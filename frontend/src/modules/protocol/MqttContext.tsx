import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type MqttQos = 0 | 1 | 2;
export type MqttStatus = "disconnected" | "connecting" | "connected";

export interface MqttSubscription {
  topic: string;
  qos: MqttQos;
}

export interface MqttMessageItem {
  direction: "in" | "out";
  topic: string;
  payload: string;
  qos: MqttQos;
  retain: boolean;
  time: string;
}

interface MqttIpcMessage {
  topic: string;
  payload: string;
  qos: number;
  retain: boolean;
  timestamp: string;
}

export const MQTT_TOPIC_PRESETS: MqttSubscription[] = [
  { topic: "devices/+/telemetry", qos: 1 },
  { topic: "alerts/#", qos: 0 },
  { topic: "home/sensors/temp", qos: 1 },
];

function nowTime(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

interface MqttContextValue {
  brokerUrl: string;
  setBrokerUrl: (value: string) => void;
  clientId: string;
  setClientId: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  status: MqttStatus;
  connectError: string | null;
  useTls: boolean;
  setUseTls: (value: boolean) => void;
  tlsCaPath: string;
  setTlsCaPath: (value: string) => void;
  tlsClientCert: string;
  setTlsClientCert: (value: string) => void;
  tlsClientKey: string;
  setTlsClientKey: (value: string) => void;
  showTls: boolean;
  setShowTls: (value: boolean) => void;
  willTopic: string;
  setWillTopic: (value: string) => void;
  willPayload: string;
  setWillPayload: (value: string) => void;
  willQos: MqttQos;
  setWillQos: (value: MqttQos) => void;
  willRetain: boolean;
  setWillRetain: (value: boolean) => void;
  showWill: boolean;
  setShowWill: (value: boolean) => void;
  subscriptions: MqttSubscription[];
  newTopic: string;
  setNewTopic: (value: string) => void;
  newQos: MqttQos;
  setNewQos: (value: MqttQos) => void;
  subscribe: () => Promise<void>;
  unsubscribe: (index: number) => Promise<void>;
  quickSubscribe: (topic: string, qos?: MqttQos) => Promise<void>;
  fillSubscribeTopic: (topic: string) => void;
  messages: MqttMessageItem[];
  clearMessages: () => void;
  pubTopic: string;
  setPubTopic: (value: string) => void;
  pubQos: MqttQos;
  setPubQos: (value: MqttQos) => void;
  pubPayload: string;
  setPubPayload: (value: string) => void;
  pubRetain: boolean;
  setPubRetain: (value: boolean) => void;
  publish: () => Promise<void>;
  toggleConnection: () => Promise<void>;
}

const MqttContext = createContext<MqttContextValue | null>(null);

export function MqttProvider({ children }: { children: ReactNode }) {
  const [brokerUrl, setBrokerUrl] = useState("mqtt://broker.hivemq.com:1883");
  const [clientId, setClientId] = useState("omnipanel-001");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<MqttStatus>("disconnected");
  const [connectError, setConnectError] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<MqttSubscription[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [newQos, setNewQos] = useState<MqttQos>(0);
  const [messages, setMessages] = useState<MqttMessageItem[]>([]);

  const [pubTopic, setPubTopic] = useState("devices/esp32-01/cmd");
  const [pubQos, setPubQos] = useState<MqttQos>(0);
  const [pubPayload, setPubPayload] = useState('{"action":"reboot"}');
  const [pubRetain, setPubRetain] = useState(false);

  const [useTls, setUseTls] = useState(false);
  const [tlsCaPath, setTlsCaPath] = useState("");
  const [tlsClientCert, setTlsClientCert] = useState("");
  const [tlsClientKey, setTlsClientKey] = useState("");
  const [showTls, setShowTls] = useState(false);

  const [willTopic, setWillTopic] = useState("");
  const [willPayload, setWillPayload] = useState("");
  const [willQos, setWillQos] = useState<MqttQos>(0);
  const [willRetain, setWillRetain] = useState(false);
  const [showWill, setShowWill] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const subscriptionsRef = useRef(subscriptions);
  subscriptionsRef.current = subscriptions;

  const cleanupSession = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await invoke("mqtt_disconnect", { id: sessionIdRef.current });
      } catch {
        /* ignore */
      }
      sessionIdRef.current = null;
    }
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      void cleanupSession();
    };
  }, [cleanupSession]);

  const resubscribeAll = useCallback(async (sessionId: string) => {
    for (const sub of subscriptionsRef.current) {
      await invoke("mqtt_subscribe", {
        id: sessionId,
        subscription: { topic: sub.topic, qos: sub.qos },
      });
    }
  }, []);

  const subscribeTopic = useCallback(
    async (topic: string, qos: MqttQos) => {
      const trimmed = topic.trim();
      if (!trimmed || !sessionIdRef.current) return;
      if (subscriptionsRef.current.some((s) => s.topic === trimmed)) return;

      await invoke("mqtt_subscribe", {
        id: sessionIdRef.current,
        subscription: { topic: trimmed, qos },
      });
      setSubscriptions((prev) => [...prev, { topic: trimmed, qos }]);
    },
    [],
  );

  const toggleConnection = useCallback(async () => {
    if (status === "connected" || status === "connecting") {
      await cleanupSession();
      setStatus("disconnected");
      setConnectError(null);
      return;
    }

    setStatus("connecting");
    setConnectError(null);
    try {
      const onMessage = new Channel<MqttIpcMessage>();
      onMessage.onmessage = (msg: MqttIpcMessage) => {
        setMessages((prev) => [
          ...prev,
          {
            direction: "in",
            topic: msg.topic,
            payload: msg.payload,
            qos: msg.qos as MqttQos,
            retain: msg.retain,
            time: msg.timestamp,
          },
        ]);
      };

      const config = {
        broker_url: brokerUrl,
        client_id: clientId,
        username: username.trim() || null,
        password: password || null,
        keep_alive_secs: 60,
        clean_session: true,
        use_tls: useTls || brokerUrl.startsWith("mqtts"),
        tls_ca_path: tlsCaPath || null,
        tls_client_cert: tlsClientCert || null,
        tls_client_key: tlsClientKey || null,
        will_topic: willTopic || null,
        will_payload: willPayload || null,
        will_qos: willTopic ? willQos : null,
        will_retain: willTopic ? willRetain : null,
      };

      const id = await invoke<string>("mqtt_connect", { config, onMessage });
      sessionIdRef.current = id;

      const unlisten = await listen<{ session_id: string; event: string }>(
        "mqtt-event",
        (event) => {
          if (event.payload.session_id === id) {
            setStatus("disconnected");
            sessionIdRef.current = null;
          }
        },
      );
      unlistenRef.current = unlisten;

      await resubscribeAll(id);
      setStatus("connected");
    } catch (e) {
      console.error("MQTT connect failed:", e);
      setStatus("disconnected");
      setConnectError(e instanceof Error ? e.message : String(e));
      await cleanupSession();
    }
  }, [
    status,
    brokerUrl,
    clientId,
    username,
    password,
    useTls,
    tlsCaPath,
    tlsClientCert,
    tlsClientKey,
    willTopic,
    willPayload,
    willQos,
    willRetain,
    cleanupSession,
    resubscribeAll,
  ]);

  const subscribe = useCallback(async () => {
    try {
      await subscribeTopic(newTopic, newQos);
      setNewTopic("");
    } catch (e) {
      console.error("MQTT subscribe failed:", e);
    }
  }, [newTopic, newQos, subscribeTopic]);

  const quickSubscribe = useCallback(
    async (topic: string, qos: MqttQos = 0) => {
      try {
        await subscribeTopic(topic, qos);
      } catch (e) {
        console.error("MQTT subscribe failed:", e);
      }
    },
    [subscribeTopic],
  );

  const unsubscribe = useCallback(async (idx: number) => {
    const sub = subscriptionsRef.current[idx];
    if (!sub || !sessionIdRef.current) return;
    try {
      await invoke("mqtt_unsubscribe", { id: sessionIdRef.current, topic: sub.topic });
      setSubscriptions((prev) => prev.filter((_, i) => i !== idx));
    } catch (e) {
      console.error("MQTT unsubscribe failed:", e);
    }
  }, []);

  const publish = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await invoke("mqtt_publish", {
        id: sessionIdRef.current,
        message: { topic: pubTopic, payload: pubPayload, qos: pubQos, retain: pubRetain },
      });
      setMessages((prev) => [
        ...prev,
        {
          direction: "out",
          topic: pubTopic,
          payload: pubPayload,
          qos: pubQos,
          retain: pubRetain,
          time: nowTime(),
        },
      ]);
    } catch (e) {
      console.error("MQTT publish failed:", e);
    }
  }, [pubTopic, pubPayload, pubQos, pubRetain]);

  const fillSubscribeTopic = useCallback((topic: string) => {
    setNewTopic(topic);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = useMemo<MqttContextValue>(
    () => ({
      brokerUrl,
      setBrokerUrl,
      clientId,
      setClientId,
      username,
      setUsername,
      password,
      setPassword,
      status,
      connectError,
      useTls,
      setUseTls,
      tlsCaPath,
      setTlsCaPath,
      tlsClientCert,
      setTlsClientCert,
      tlsClientKey,
      setTlsClientKey,
      showTls,
      setShowTls,
      willTopic,
      setWillTopic,
      willPayload,
      setWillPayload,
      willQos,
      setWillQos,
      willRetain,
      setWillRetain,
      showWill,
      setShowWill,
      subscriptions,
      newTopic,
      setNewTopic,
      newQos,
      setNewQos,
      subscribe,
      unsubscribe,
      quickSubscribe,
      fillSubscribeTopic,
      messages,
      clearMessages,
      pubTopic,
      setPubTopic,
      pubQos,
      setPubQos,
      pubPayload,
      setPubPayload,
      pubRetain,
      setPubRetain,
      publish,
      toggleConnection,
    }),
    [
      brokerUrl,
      clientId,
      username,
      password,
      status,
      connectError,
      useTls,
      tlsCaPath,
      tlsClientCert,
      tlsClientKey,
      showTls,
      willTopic,
      willPayload,
      willQos,
      willRetain,
      showWill,
      subscriptions,
      newTopic,
      newQos,
      subscribe,
      unsubscribe,
      quickSubscribe,
      fillSubscribeTopic,
      messages,
      clearMessages,
      pubTopic,
      pubQos,
      pubPayload,
      pubRetain,
      publish,
      toggleConnection,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttContextValue {
  const ctx = useContext(MqttContext);
  if (!ctx) {
    throw new Error("useMqtt must be used within MqttProvider");
  }
  return ctx;
}
