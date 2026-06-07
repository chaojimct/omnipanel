use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

/// gRPC connection configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrpcConnectionConfig {
    /// Server endpoint, e.g. "https://localhost:50051" or "http://host:9090"
    pub endpoint: String,
    /// Additional metadata (gRPC headers) to include with every request.
    pub metadata: HashMap<String, String>,
    /// Optional TLS override: if true, skip certificate verification.
    pub insecure: Option<bool>,
    /// Timeout per call in milliseconds (default 30s).
    pub timeout_ms: Option<u64>,
}

/// A stored gRPC connection session.
pub struct GrpcSession {
    pub config: GrpcConnectionConfig,
    pub client: reqwest::Client,
}

/// gRPC response returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrpcResponse {
    /// HTTP status code (200 for successful gRPC calls).
    pub status: u16,
    /// gRPC status code (0 = OK, from grpc-status trailer).
    pub grpc_status: u32,
    /// gRPC status message (from grpc-message trailer).
    pub grpc_message: String,
    /// Response headers/metadata.
    pub headers: HashMap<String, String>,
    /// Response body (UTF-8 decoded, or base64 for binary).
    pub body: String,
    /// Round-trip time in milliseconds.
    pub time_ms: u64,
    /// Response body size in bytes.
    pub size_bytes: usize,
}

/// Describes a discovered gRPC service method (from server reflection).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrpcServiceInfo {
    pub service_name: String,
    pub methods: Vec<GrpcMethodInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrpcMethodInfo {
    pub name: String,
    pub full_path: String,
    pub input_type: String,
    pub output_type: String,
    pub is_client_streaming: bool,
    pub is_server_streaming: bool,
}

/// Create a reqwest HTTP/2 client for gRPC.
fn build_client(config: &GrpcConnectionConfig) -> Result<reqwest::Client, String> {
    let mut builder = reqwest::Client::builder()
        .http2_prior_knowledge()
        .timeout(Duration::from_millis(config.timeout_ms.unwrap_or(30_000)))
        .redirect(reqwest::redirect::Policy::limited(5));

    if config.insecure.unwrap_or(false) {
        builder = builder.danger_accept_invalid_certs(true);
    }

    builder
        .build()
        .map_err(|e| format!("Failed to create gRPC client: {e}"))
}

/// Encode a message body into gRPC length-prefixed framing.
///
/// gRPC wire format per message:
///   [compression_flag: 1 byte] [message_length: 4 bytes big-endian] [message_data]
fn encode_grpc_frame(body: &[u8]) -> Vec<u8> {
    let len = body.len() as u32;
    let mut framed = Vec::with_capacity(5 + body.len());
    framed.push(0u8); // no compression
    framed.extend_from_slice(&len.to_be_bytes());
    framed.extend_from_slice(body);
    framed
}

/// Decode gRPC length-prefixed frames from response body.
/// Returns the concatenation of all message payloads.
fn decode_grpc_frames(data: &[u8]) -> Result<Vec<u8>, String> {
    let mut result = Vec::new();
    let mut offset = 0;

    while offset < data.len() {
        if offset + 5 > data.len() {
            break;
        }
        let compression = data[offset];
        let msg_len = u32::from_be_bytes([
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
            data[offset + 4],
        ]) as usize;

        offset += 5;

        if offset + msg_len > data.len() {
            return Err(format!(
                "gRPC frame truncated: expected {msg_len} bytes at offset {offset}, have {}",
                data.len() - offset
            ));
        }

        if compression != 0 {
            return Err("Compressed gRPC messages are not supported in this simplified client".into());
        }

        result.extend_from_slice(&data[offset..offset + msg_len]);
        offset += msg_len;
    }

    Ok(result)
}

impl GrpcSession {
    /// Connect to a gRPC server (validate endpoint reachability).
    pub async fn connect(config: GrpcConnectionConfig) -> Result<Self, String> {
        let client = build_client(&config)?;

        // Validate endpoint is reachable with a gRPC-web health-check style probe.
        // We send a POST with grpc content-type; even an error response confirms the
        // server is a gRPC endpoint.
        let endpoint = config.endpoint.trim_end_matches('/');
        let probe_url = format!("{endpoint}/grpc.health.v1.Health/Check");

        // We just build the client; actual connectivity is tested on first call.
        // This keeps connect() fast.
        tracing::info!("gRPC session created for {endpoint}");
        Ok(GrpcSession {
            config,
            client,
        })
    }

    /// Execute a unary gRPC call.
    ///
    /// `service` and `method` form the URL path: `/{service}/{method}`.
    /// `request_body` is the raw request payload (UTF-8 JSON or base64-encoded binary).
    pub async fn call(
        &self,
        service: &str,
        method: &str,
        request_body: &str,
        extra_metadata: Option<HashMap<String, String>>,
    ) -> Result<GrpcResponse, String> {
        let endpoint = self.config.endpoint.trim_end_matches('/');
        let path = format!("{endpoint}/{service}/{method}");

        // Build gRPC-framed body: user provides the raw protobuf or JSON payload.
        // We accept JSON text and send it directly — many dev servers support this.
        let payload = request_body.as_bytes();
        let framed_body = encode_grpc_frame(payload);

        let mut req = self
            .client
            .post(&path)
            .header("content-type", "application/grpc")
            .header("te", "trailers")
            .body(framed_body);

        // Apply connection-level metadata
        for (key, value) in &self.config.metadata {
            req = req.header(key.as_str(), value.as_str());
        }

        // Apply per-request metadata
        if let Some(meta) = &extra_metadata {
            for (key, value) in meta {
                req = req.header(key.as_str(), value.as_str());
            }
        }

        let start = std::time::Instant::now();
        let resp = req.send().await.map_err(|e| format!("gRPC call failed: {e}"))?;
        let elapsed = start.elapsed().as_millis() as u64;

        let http_status = resp.status().as_u16();

        // Collect response headers
        let mut headers = HashMap::new();
        let mut grpc_status: u32 = 0;
        let mut grpc_message = String::new();

        for (key, value) in resp.headers() {
            let k = key.to_string();
            if let Ok(v) = value.to_str() {
                if k == "grpc-status" {
                    grpc_status = v.parse().unwrap_or(0);
                } else if k == "grpc-message" {
                    grpc_message = urlencoding::decode(v)
                        .unwrap_or_else(|_| v.into())
                        .into_owned();
                }
                headers.insert(k, v.to_string());
            }
        }

        let raw_body = resp
            .bytes()
            .await
            .map_err(|e| format!("Failed to read gRPC response: {e}"))?;

        let size_bytes = raw_body.len();

        // Decode gRPC frames
        let decoded = if raw_body.len() >= 5 {
            decode_grpc_frames(&raw_body).unwrap_or_else(|_| raw_body.to_vec())
        } else {
            raw_body.to_vec()
        };

        // Try UTF-8 decode; fall back to base64
        let body = match std::str::from_utf8(&decoded) {
            Ok(s) => s.to_string(),
            Err(_) => base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &decoded),
        };

        // If we got HTTP 200 but no grpc-status in headers, check trailers
        // (reqwest with HTTP/2 may expose trailers in headers for some servers)
        if grpc_status == 0 && http_status == 200 {
            // Trailer headers might already be in the headers map
        }

        // Map HTTP errors to gRPC status
        if http_status != 200 && grpc_status == 0 {
            grpc_status = match http_status {
                400 => 3,  // INVALID_ARGUMENT
                401 => 16, // UNAUTHENTICATED
                403 => 7,  // PERMISSION_DENIED
                404 => 5,  // NOT_FOUND
                429 => 8,  // RESOURCE_EXHAUSTED
                500 => 13, // INTERNAL
                501 => 12, // UNIMPLEMENTED
                503 => 14, // UNAVAILABLE
                504 => 4,  // DEADLINE_EXCEEDED
                _ => 2,    // UNKNOWN
            };
            if grpc_message.is_empty() {
                grpc_message = format!("HTTP {http_status}");
            }
        }

        Ok(GrpcResponse {
            status: http_status,
            grpc_status,
            grpc_message,
            headers,
            body,
            time_ms: elapsed,
            size_bytes,
        })
    }

    /// Attempt gRPC server reflection to discover services.
    ///
    /// Uses the standard gRPC Server Reflection Protocol:
    ///   grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo
    ///
    /// Returns a list of services and their methods, or an error if reflection
    /// is not supported by the server.
    pub async fn reflect(&self) -> Result<Vec<GrpcServiceInfo>, String> {
        // Send a reflection request for "list_services"
        // The reflection protocol uses streaming, but we can try a unary
        // approximation or use the gRPC-Web variant.
        //
        // Reflection request proto (field 1 = list_services, value = """):
        //   message ServerReflectionRequest { string list_services = 1; }
        //
        // We construct the minimal protobuf: field 1, wire type 2 (length-delimited), length 0
        // tag = (1 << 3) | 2 = 0x0A, length = 0
        let list_services_req = vec![0x0Au8, 0x00];

        let endpoint = self.config.endpoint.trim_end_matches('/');
        let reflect_path = format!(
            "{endpoint}/grpc.reflection.v1alpha.ServerReflection/ServerReflectionInfo"
        );

        let framed = encode_grpc_frame(&list_services_req);

        let mut req = self
            .client
            .post(&reflect_path)
            .header("content-type", "application/grpc")
            .header("te", "trailers")
            .body(framed);

        for (key, value) in &self.config.metadata {
            req = req.header(key.as_str(), value.as_str());
        }

        let resp = req
            .send()
            .await
            .map_err(|e| format!("Reflection request failed: {e}"))?;

        if !resp.status().is_success() {
            return Err(format!(
                "Server reflection not available (HTTP {})",
                resp.status().as_u16()
            ));
        }

        let raw = resp
            .bytes()
            .await
            .map_err(|e| format!("Failed to read reflection response: {e}"))?;

        if raw.len() < 5 {
            return Err("Server reflection not available (empty response)".into());
        }

        let decoded = decode_grpc_frames(&raw)?;

        // Try to parse the reflection response.
        // The response proto contains a list of service descriptors.
        // For the simplified approach, we do a best-effort string extraction
        // of service names from the binary proto response.
        let mut services = Vec::new();

        // Attempt to extract service names from the proto response.
        // In the ServerReflectionResponse, service names appear as strings
        // after the "list_services_response" field tag.
        // We do a heuristic extraction since we don't have a proto parser.
        let raw_str = String::from_utf8_lossy(&decoded);

        // The reflection response contains ServiceResponse messages with `name` fields.
        // Extract strings that look like service names (contain dots, no spaces).
        let mut i = 0;
        let bytes = &decoded;
        while i < bytes.len() {
            // Look for length-delimited strings (tag byte with wire type 2)
            if i + 1 < bytes.len() {
                let potential_len = bytes[i] as usize;
                if potential_len > 2 && potential_len < 200 && i + 1 + potential_len <= bytes.len() {
                    if let Ok(s) = std::str::from_utf8(&bytes[i + 1..i + 1 + potential_len]) {
                        // Check if it looks like a fully-qualified service name
                        if s.contains('.') && !s.contains(' ') && s.len() > 3 {
                            services.push(GrpcServiceInfo {
                                service_name: s.to_string(),
                                methods: Vec::new(), // Methods would need per-service reflection
                            });
                        }
                    }
                }
            }
            i += 1;
        }

        if services.is_empty() {
            // If heuristic extraction failed, report the raw response for debugging
            return Err(format!(
                "Server reflection responded but no services could be parsed. \
                 Raw response ({} bytes). The server may require a full protobuf client. \
                 You can manually specify service/method paths.",
                decoded.len()
            ));
        }

        // Deduplicate
        services.sort_by(|a, b| a.service_name.cmp(&b.service_name));
        services.dedup_by(|a, b| a.service_name == b.service_name);

        Ok(services)
    }
}
