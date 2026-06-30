use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use omnipanel_db::DbParams;
use omnipanel_store::DbConnectionConfig;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter};

use crate::commands::database::{self, DbColumnMeta};

const PAGE_SIZE: i64 = 500;
const MAX_DIFF_DETAIL_ROWS: usize = 100;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DbSyncTableSpec {
    pub name: String,
    pub columns: Vec<DbColumnMeta>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableRowDiffPayload {
    pub row_key: String,
    pub display_key: String,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub changed_fields: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_row: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_row: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableRowCompareEvent {
    pub table: String,
    pub status: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub diff_rows: Option<u32>,
    #[serde(default)]
    pub diffs: Vec<TableRowDiffPayload>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncated: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableCountEvent {
    pub table: String,
    pub side: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaColumnDiffPayload {
    pub name: String,
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_type: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub target_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaCompareEvent {
    pub table: String,
    pub status: String,
    #[serde(default)]
    pub columns: Vec<SchemaColumnDiffPayload>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BgTaskDbEvent {
    pub task_id: String,
    pub event_type: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub table: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub count: Option<TableCountEvent>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub row_result: Option<TableRowCompareEvent>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub schema_result: Option<SchemaCompareEvent>,
}

fn to_params(c: &DbConnectionConfig) -> DbParams {
    DbParams {
        db_type: c.db_type.clone(),
        host: c.host.clone(),
        port: c.port,
        user: c.user.clone(),
        password: c.password.clone(),
        database: c.database.clone(),
        ssl: c.ssl,
    }
}

fn normalize_value(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Null => String::new(),
        serde_json::Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn build_row_key(
    row: &HashMap<String, serde_json::Value>,
    pk_columns: &[String],
    all_columns: &[String],
) -> String {
    let keys = if pk_columns.is_empty() {
        all_columns
    } else {
        pk_columns
    };
    keys.iter()
        .map(|col| normalize_value(row.get(col).unwrap_or(&serde_json::Value::Null)))
        .collect::<Vec<_>>()
        .join("\0")
}

fn format_row_display_key(
    row: &HashMap<String, serde_json::Value>,
    pk_columns: &[String],
    all_columns: &[String],
) -> String {
    let keys = if pk_columns.is_empty() {
        all_columns.iter().take(3).cloned().collect::<Vec<_>>()
    } else {
        pk_columns.to_vec()
    };
    keys.iter()
        .map(|col| {
            format!(
                "{col}={}",
                normalize_value(row.get(col).unwrap_or(&serde_json::Value::Null))
            )
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn clamp_row_count(count: i64) -> u32 {
    if count <= 0 {
        0
    } else if count > i64::from(u32::MAX) {
        u32::MAX
    } else {
        count as u32
    }
}

async fn fetch_all_rows(
    connection: &DbConnectionConfig,
    table_name: &str,
    cancel: &AtomicBool,
    row_total: u32,
    row_completed: &mut u32,
    report_rows: Arc<dyn Fn(u32, u32) + Send + Sync>,
) -> Result<Vec<HashMap<String, serde_json::Value>>, String> {
    let total = database::db_count_table(
        connection.clone(),
        None,
        table_name.to_string(),
        None,
    )
    .await?;
    if total <= 0 {
        return Ok(Vec::new());
    }

    let mut rows = Vec::new();
    let mut offset = 0i64;
    while offset < total {
        if cancel.load(Ordering::Relaxed) {
            return Err("cancelled".to_string());
        }
        let page = database::db_preview_table(
            connection.clone(),
            table_name.to_string(),
            PAGE_SIZE as u32,
            offset as u32,
            None,
            None,
        )
        .await?;
        let fetched = page.rows.len() as u32;
        rows.extend(page.rows);
        *row_completed = row_completed.saturating_add(fetched);
        if row_total > 0 {
            report_rows(*row_completed, row_total);
        }
        offset += PAGE_SIZE;
    }
    Ok(rows)
}

async fn compare_table_rows(
    source: &DbConnectionConfig,
    target: &DbConnectionConfig,
    table_name: &str,
    columns: &[DbColumnMeta],
    cancel: Arc<AtomicBool>,
    report_rows: Arc<dyn Fn(u32, u32) + Send + Sync>,
) -> TableRowCompareEvent {
    let pk_columns: Vec<String> = columns
        .iter()
        .filter(|c| c.is_pk)
        .map(|c| c.name.clone())
        .collect();
    let all_column_names: Vec<String> = columns.iter().map(|c| c.name.clone()).collect();

    let source_total = database::db_count_table(
        source.clone(),
        None,
        table_name.to_string(),
        None,
    )
    .await
    .map(clamp_row_count)
    .unwrap_or(0);
    let target_total = database::db_count_table(
        target.clone(),
        None,
        table_name.to_string(),
        None,
    )
    .await
    .map(clamp_row_count)
    .unwrap_or(0);
    let row_total = source_total.saturating_add(target_total).max(1);
    let mut row_completed = 0u32;

    let source_rows = match fetch_all_rows(
        source,
        table_name,
        &cancel,
        row_total,
        &mut row_completed,
        report_rows.clone(),
    )
    .await
    {
        Ok(rows) => rows,
        Err(e) => {
            if e == "cancelled" {
                return TableRowCompareEvent {
                    table: table_name.to_string(),
                    status: "error".to_string(),
                    diff_rows: None,
                    diffs: Vec::new(),
                    truncated: None,
                    error: Some("cancelled".to_string()),
                };
            }
            return TableRowCompareEvent {
                table: table_name.to_string(),
                status: "error".to_string(),
                diff_rows: None,
                diffs: Vec::new(),
                truncated: None,
                error: Some(e),
            };
        }
    };

    if cancel.load(Ordering::Relaxed) {
        return TableRowCompareEvent {
            table: table_name.to_string(),
            status: "error".to_string(),
            diff_rows: None,
            diffs: Vec::new(),
            truncated: None,
            error: Some("cancelled".to_string()),
        };
    }

    let target_rows = match fetch_all_rows(
        target,
        table_name,
        &cancel,
        row_total,
        &mut row_completed,
        report_rows.clone(),
    )
    .await
    {
        Ok(rows) => rows,
        Err(e) => {
            return TableRowCompareEvent {
                table: table_name.to_string(),
                status: "error".to_string(),
                diff_rows: None,
                diffs: Vec::new(),
                truncated: None,
                error: Some(e),
            };
        }
    };

    report_rows(row_completed.min(row_total), row_total);

    let mut source_map: HashMap<String, HashMap<String, serde_json::Value>> = HashMap::new();
    for row in source_rows {
        let key = build_row_key(&row, &pk_columns, &all_column_names);
        source_map.insert(key, row);
    }

    let mut target_map: HashMap<String, HashMap<String, serde_json::Value>> = HashMap::new();
    for row in target_rows {
        let key = build_row_key(&row, &pk_columns, &all_column_names);
        target_map.insert(key, row);
    }

    let mut diffs: Vec<TableRowDiffPayload> = Vec::new();
    let mut diff_count = 0u32;

    for (key, source_row) in &source_map {
        if cancel.load(Ordering::Relaxed) {
            return TableRowCompareEvent {
                table: table_name.to_string(),
                status: "error".to_string(),
                diff_rows: None,
                diffs: Vec::new(),
                truncated: None,
                error: Some("cancelled".to_string()),
            };
        }
        match target_map.get(key) {
            None => {
                diff_count += 1;
                if diffs.len() < MAX_DIFF_DETAIL_ROWS {
                    diffs.push(TableRowDiffPayload {
                        row_key: key.clone(),
                        display_key: format_row_display_key(source_row, &pk_columns, &all_column_names),
                        kind: "sourceOnly".to_string(),
                        changed_fields: None,
                        source_row: Some(source_row.clone()),
                        target_row: None,
                    });
                }
            }
            Some(target_row) => {
                let mut changed: Vec<String> = Vec::new();
                for col in &all_column_names {
                    let sv = normalize_value(source_row.get(col).unwrap_or(&serde_json::Value::Null));
                    let tv = normalize_value(target_row.get(col).unwrap_or(&serde_json::Value::Null));
                    if sv != tv {
                        changed.push(col.clone());
                    }
                }
                if !changed.is_empty() {
                    diff_count += 1;
                    if diffs.len() < MAX_DIFF_DETAIL_ROWS {
                        diffs.push(TableRowDiffPayload {
                            row_key: key.clone(),
                            display_key: format_row_display_key(
                                source_row,
                                &pk_columns,
                                &all_column_names,
                            ),
                            kind: "changed".to_string(),
                            changed_fields: Some(changed),
                            source_row: Some(source_row.clone()),
                            target_row: Some(target_row.clone()),
                        });
                    }
                }
            }
        }
    }

    for (key, target_row) in &target_map {
        if cancel.load(Ordering::Relaxed) {
            return TableRowCompareEvent {
                table: table_name.to_string(),
                status: "error".to_string(),
                diff_rows: None,
                diffs: Vec::new(),
                truncated: None,
                error: Some("cancelled".to_string()),
            };
        }
        if source_map.contains_key(key) {
            continue;
        }
        diff_count += 1;
        if diffs.len() < MAX_DIFF_DETAIL_ROWS {
            diffs.push(TableRowDiffPayload {
                row_key: key.clone(),
                display_key: format_row_display_key(target_row, &pk_columns, &all_column_names),
                kind: "targetOnly".to_string(),
                changed_fields: None,
                source_row: None,
                target_row: Some(target_row.clone()),
            });
        }
    }

    if diff_count == 0 {
        report_rows(row_total, row_total);
        TableRowCompareEvent {
            table: table_name.to_string(),
            status: "match".to_string(),
            diff_rows: Some(0),
            diffs: Vec::new(),
            truncated: None,
            error: None,
        }
    } else {
        report_rows(row_total, row_total);
        TableRowCompareEvent {
            table: table_name.to_string(),
            status: "diff".to_string(),
            diff_rows: Some(diff_count),
            diffs,
            truncated: Some(diff_count as usize > MAX_DIFF_DETAIL_ROWS),
            error: None,
        }
    }
}

fn column_signature(col: &DbColumnMeta) -> String {
    format!("{}|{}|{}", col.column_type, col.is_pk, col.is_fk)
}

fn compare_table_columns(
    source: &[DbColumnMeta],
    target: &[DbColumnMeta],
) -> Vec<SchemaColumnDiffPayload> {
    let mut diffs = Vec::new();
    let target_by_name: HashMap<_, _> = target.iter().map(|c| (c.name.as_str(), c)).collect();
    let source_by_name: HashMap<_, _> = source.iter().map(|c| (c.name.as_str(), c)).collect();

    for sc in source {
        match target_by_name.get(sc.name.as_str()) {
            None => diffs.push(SchemaColumnDiffPayload {
                name: sc.name.clone(),
                kind: "added".to_string(),
                source_type: Some(sc.column_type.clone()),
                target_type: None,
            }),
            Some(tc) if column_signature(sc) != column_signature(tc) => {
                diffs.push(SchemaColumnDiffPayload {
                    name: sc.name.clone(),
                    kind: "changed".to_string(),
                    source_type: Some(sc.column_type.clone()),
                    target_type: Some(tc.column_type.clone()),
                });
            }
            _ => {}
        }
    }

    for tc in target {
        if !source_by_name.contains_key(tc.name.as_str()) {
            diffs.push(SchemaColumnDiffPayload {
                name: tc.name.clone(),
                kind: "removed".to_string(),
                source_type: None,
                target_type: Some(tc.column_type.clone()),
            });
        }
    }

    diffs.sort_by(|a, b| a.name.cmp(&b.name));
    diffs
}

async fn emit_db_event(app: &AppHandle, event: BgTaskDbEvent) {
    let _ = app.emit("bg-task-db-event", &event);
}

pub async fn run_db_data_sync_analysis(
    app: AppHandle,
    task_id: String,
    source: DbConnectionConfig,
    target: DbConnectionConfig,
    tables: Vec<DbSyncTableSpec>,
    cancel: Arc<AtomicBool>,
    progress: Arc<dyn Fn(String, u32, u32, Option<u32>, Option<u32>) + Send + Sync>,
) -> Result<(), String> {
    let total = tables.len().max(1) as u32;
    let source_db = source.database.clone();
    let target_db = target.database.clone();

    for (idx, spec) in tables.iter().enumerate() {
        if cancel.load(Ordering::Relaxed) {
            return Ok(());
        }

        let index = (idx + 1) as u32;
        let table = spec.name.clone();

        progress(
            format!("正在统计目标表行数 ({index}/{total})：{table}"),
            index,
            total,
            None,
            None,
        );

        let target_count = database::db_count_table(
            target.clone(),
            Some(target_db.clone()),
            table.clone(),
            None,
        )
        .await
        .ok();

        emit_db_event(
            &app,
            BgTaskDbEvent {
                task_id: task_id.clone(),
                event_type: "count".to_string(),
                table: Some(table.clone()),
                count: Some(TableCountEvent {
                    table: table.clone(),
                    side: "target".to_string(),
                    count: target_count,
                }),
                row_result: None,
                schema_result: None,
            },
        )
        .await;

        if cancel.load(Ordering::Relaxed) {
            return Ok(());
        }

        let progress_for_rows = progress.clone();
        let table_for_rows = table.clone();
        let report_rows: Arc<dyn Fn(u32, u32) + Send + Sync> = Arc::new(move |row_completed, row_total| {
            progress_for_rows(
                format!("正在逐行比对 ({index}/{total})：{table_for_rows}"),
                index,
                total,
                Some(row_completed),
                Some(row_total),
            );
        });

        progress(
            format!("正在逐行比对 ({index}/{total})：{table}"),
            index,
            total,
            Some(0),
            None,
        );

        let row_result = compare_table_rows(
            &source,
            &target,
            &table,
            &spec.columns,
            cancel.clone(),
            report_rows,
        )
        .await;
        emit_db_event(
            &app,
            BgTaskDbEvent {
                task_id: task_id.clone(),
                event_type: "row_result".to_string(),
                table: Some(table.clone()),
                count: None,
                row_result: Some(row_result),
                schema_result: None,
            },
        )
        .await;

        let _ = source_db.as_str();
    }

    progress(
        format!("对比分析已完成 ({total}/{total})"),
        total,
        total,
        None,
        None,
    );
    Ok(())
}

pub async fn run_db_schema_sync_analysis(
    app: AppHandle,
    task_id: String,
    target: DbConnectionConfig,
    target_schema: String,
    tables: Vec<DbSyncTableSpec>,
    cancel: Arc<AtomicBool>,
    progress: Arc<dyn Fn(String, u32, u32, Option<u32>, Option<u32>) + Send + Sync>,
) -> Result<(), String> {
    let total = tables.len().max(1) as u32;

    for (idx, spec) in tables.iter().enumerate() {
        if cancel.load(Ordering::Relaxed) {
            return Ok(());
        }

        let index = (idx + 1) as u32;
        let table = spec.name.clone();

        progress(
            format!("正在对比表结构 ({index}/{total})：{table}"),
            index,
            total,
            None,
            None,
        );

        let schema_result = match database::db_introspect_table(
            target.clone(),
            Some(target_schema.clone()),
            table.clone(),
        )
        .await
        {
            Ok(target_table) => {
                let columns = compare_table_columns(&spec.columns, &target_table.columns);
                SchemaCompareEvent {
                    table: table.clone(),
                    status: if columns.is_empty() {
                        "match".to_string()
                    } else {
                        "diff".to_string()
                    },
                    columns,
                    error: None,
                }
            }
            Err(e) => SchemaCompareEvent {
                table: table.clone(),
                status: "error".to_string(),
                columns: Vec::new(),
                error: Some(e),
            },
        };

        emit_db_event(
            &app,
            BgTaskDbEvent {
                task_id: task_id.clone(),
                event_type: "schema_result".to_string(),
                table: Some(table),
                count: None,
                row_result: None,
                schema_result: Some(schema_result),
            },
        )
        .await;
    }

    progress(
        format!("对比分析已完成 ({total}/{total})"),
        total,
        total,
        None,
        None,
    );
    Ok(())
}

// 保留 to_params 供后续扩展（源库计数等）
#[allow(dead_code)]
fn _db_params_helper(c: &DbConnectionConfig) -> DbParams {
    to_params(c)
}
