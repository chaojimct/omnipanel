mod config;
mod event;

pub use config::TerminalConfig;
pub use event::TerminalEvent;

use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};

/// A terminal instance wrapping a shell process.
pub struct Terminal {
    config: TerminalConfig,
    child: Child,
    /// Accumulated output lines from the PTY.
    output: Arc<Mutex<Vec<u8>>>,
}

impl Terminal {
    /// Spawn a new terminal with the given config.
    pub fn new(config: TerminalConfig) -> anyhow::Result<Self> {
        let shell = if cfg!(windows) {
            std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string())
        } else {
            std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
        };

        let child = Command::new(&shell)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        Ok(Self {
            config,
            child,
            output: Arc::new(Mutex::new(Vec::new())),
        })
    }

    /// Get the current terminal output buffer.
    pub fn output(&self) -> Vec<u8> {
        self.output.lock().unwrap().clone()
    }

    /// Read available output from the PTY (non-blocking).
    pub fn try_read_output(&mut self) -> anyhow::Result<usize> {
        let stdout = self.child.stdout.as_mut().ok_or_else(|| {
            anyhow::anyhow!("no stdout")
        })?;

        let mut buf = [0u8; 8192];
        let mut total = 0;

        loop {
            use std::io::Read;
            match stdout.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    self.output.lock().unwrap().extend_from_slice(&buf[..n]);
                    total += n;
                }
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => break,
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(e) => return Err(e.into()),
            }
        }

        Ok(total)
    }

    /// Write input to the PTY stdin.
    pub fn write_input(&mut self, data: &[u8]) -> anyhow::Result<()> {
        let stdin = self.child.stdin.as_mut().ok_or_else(|| {
            anyhow::anyhow!("no stdin")
        })?;
        stdin.write_all(data)?;
        stdin.flush()?;
        Ok(())
    }

    /// Check if the terminal process is still alive.
    pub fn is_alive(&mut self) -> bool {
        matches!(self.child.try_wait(), Ok(None))
    }

    /// Get the terminal config.
    pub fn config(&self) -> &TerminalConfig {
        &self.config
    }
}

impl Drop for Terminal {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}
