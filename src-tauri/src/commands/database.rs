use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use sqlx::mysql::{MySqlConnectOptions, MySqlPoolOptions};
use sqlx::{Column, Row, TypeInfo, ValueRef};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbConnectionConfig {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub host: String,
    pub port: u16,
    pub user: String,
    pub password: String,
    pub database: String,
    pub group: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub rows: Vec<HashMap<String, serde_json::Value>>,
    pub columns: Vec<String>,
}

#[tauri::command]
pub async fn db_list_connections(state: State<'_, AppState>) -> Result<Vec<DbConnectionConfig>, String> {
    let store = state.db_connections.lock().await;
    let mut list: Vec<_> = store.values().cloned().collect();
    list.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(list)
}

#[tauri::command]
pub async fn db_save_connection(
    state: State<'_, AppState>,
    connection: DbConnectionConfig,
) -> Result<DbConnectionConfig, String> {
    let mut store = state.db_connections.lock().await;
    let id = if connection.id.is_empty() {
        uuid_v4()
    } else {
        connection.id.clone()
    };
    let conn = DbConnectionConfig { id, ..connection };
    store.insert(conn.id.clone(), conn.clone());
    Ok(conn)
}

#[tauri::command]
pub async fn db_delete_connection(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut store = state.db_connections.lock().await;
    store.remove(&id);
    Ok(())
}

#[tauri::command]
pub async fn db_test_connection(connection: DbConnectionConfig) -> Result<String, String> {
    let pool = connect(&connection).await?;
    let row = sqlx::query("SELECT VERSION() AS version")
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Query failed: {e}"))?;
    let version: String = row.get("version");
    pool.close().await;
    Ok(version)
}

#[tauri::command]
pub async fn db_list_databases(connection: DbConnectionConfig) -> Result<Vec<String>, String> {
    let pool = connect(&connection).await?;
    let rows = sqlx::query(
        "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA \
         WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys') \
         ORDER BY SCHEMA_NAME",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Query failed: {e}"))?;
    let databases: Vec<String> = rows.iter().map(|r| r.get::<String, _>(0)).collect();
    pool.close().await;
    Ok(databases)
}

#[tauri::command]
pub async fn db_list_tables(
    connection: DbConnectionConfig,
    schema: Option<String>,
) -> Result<Vec<String>, String> {
    let schema = resolve_schema(&connection, schema)?;
    let pool = connect(&connection).await?;
    let rows = sqlx::query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME",
    )
    .bind(&schema)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Query failed: {e}"))?;
    let tables: Vec<String> = rows.iter().map(|r| r.get::<String, _>(0)).collect();
    pool.close().await;
    Ok(tables)
}

#[tauri::command]
pub async fn db_preview_table(
    connection: DbConnectionConfig,
    table: String,
    limit: u32,
) -> Result<TableInfo, String> {
    let pool = connect(&connection).await?;
    let sql = format!("SELECT * FROM `{}` LIMIT ?", table);
    let query_result = sqlx::query(&sql)
        .bind(limit as i64)
        .fetch_all(&pool)
        .await
        .map_err(|e| format!("Query failed: {e}"))?;
    let columns: Vec<String> = if query_result.is_empty() {
        let row = sqlx::query(&format!("SELECT * FROM `{}` LIMIT 1", table))
            .fetch_optional(&pool)
            .await
            .map_err(|e| format!("Query failed: {e}"))?;
        match row {
            Some(r) => r.columns().iter().map(|c| c.name().to_string()).collect(),
            None => return Ok(TableInfo { name: table, rows: vec![], columns: vec![] }),
        }
    } else {
        query_result[0].columns().iter().map(|c| c.name().to_string()).collect()
    };
    let rows: Vec<HashMap<String, serde_json::Value>> = query_result
        .iter()
        .map(|r| {
            let mut map = HashMap::new();
            for (i, col) in columns.iter().enumerate() {
                let val = extract_value(r, i);
                map.insert(col.clone(), val);
            }
            map
        })
        .collect();
    pool.close().await;
    Ok(TableInfo {
        name: table,
        rows,
        columns,
    })
}

async fn connect(conn: &DbConnectionConfig) -> Result<sqlx::MySqlPool, String> {
    let mut opts = MySqlConnectOptions::new()
        .host(&conn.host)
        .port(conn.port)
        .username(&conn.user)
        .password(&conn.password);
    if !conn.database.trim().is_empty() {
        opts = opts.database(conn.database.trim());
    }
    MySqlPoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await
        .map_err(|e| format!("Connection failed: {e}"))
}

fn resolve_schema(conn: &DbConnectionConfig, schema: Option<String>) -> Result<String, String> {
    schema
        .filter(|s| !s.trim().is_empty())
        .or_else(|| {
            let db = conn.database.trim();
            if db.is_empty() {
                None
            } else {
                Some(db.to_string())
            }
        })
        .ok_or_else(|| "未指定数据库".to_string())
}

fn extract_value(row: &sqlx::mysql::MySqlRow, index: usize) -> serde_json::Value {
    match row.try_get_raw(index) {
        Ok(raw) => {
            if raw.is_null() {
                return serde_json::Value::Null;
            }
            let type_name = raw.type_info().name().to_lowercase();
            if type_name.contains("int") || type_name.contains("tinyint") {
                if let Ok(v) = row.try_get::<i64, _>(index) {
                    return serde_json::json!(v);
                }
            }
            if type_name.contains("float") || type_name.contains("double") || type_name.contains("decimal") {
                if let Ok(v) = row.try_get::<f64, _>(index) {
                    return serde_json::json!(v);
                }
            }
            if type_name.contains("char") || type_name.contains("text") || type_name.contains("varchar") {
                if let Ok(v) = row.try_get::<String, _>(index) {
                    return serde_json::Value::String(v);
                }
            }
            if type_name.contains("blob") || type_name.contains("binary") {
                return serde_json::Value::String("[BLOB]".to_string());
            }
            if let Ok(v) = row.try_get::<String, _>(index) {
                serde_json::Value::String(v)
            } else {
                serde_json::Value::Null
            }
        }
        Err(_) => serde_json::Value::Null,
    }
}

fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    format!(
        "{:08x}-{:04x}-4{:03x}-{:04x}-{:012x}",
        now.as_secs(),
        (now.as_nanos() & 0xffff) as u16,
        ((now.as_nanos() >> 16) as u16 & 0xfff),
        ((now.as_nanos() >> 28) as u16 & 0x3fff) | 0x8000,
        (now.as_nanos() >> 44) & 0xffff_ffff_ffff
    )
}
