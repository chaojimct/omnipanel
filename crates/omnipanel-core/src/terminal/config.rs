/// Configuration for a terminal instance.
#[derive(Debug, Clone)]
pub struct TerminalConfig {
    /// Number of columns.
    pub cols: u16,
    /// Number of rows.
    pub rows: u16,
    /// Scrollback buffer size (lines).
    pub scrollback_lines: u32,
    /// Working directory.
    pub working_dir: Option<String>,
    /// Environment variables to set.
    pub env_vars: Vec<(String, String)>,
}

impl Default for TerminalConfig {
    fn default() -> Self {
        Self {
            cols: 120,
            rows: 40,
            scrollback_lines: 10_000,
            working_dir: None,
            env_vars: Vec::new(),
        }
    }
}
