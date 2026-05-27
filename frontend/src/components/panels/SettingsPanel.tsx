export function SettingsPanel() {
  return (
    <div className="settings-workspace">
      <div className="settings-nav">
        <div className="settings-nav-item active" data-set="general">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4"/></svg>
          General
        </div>
        <div className="settings-nav-item" data-set="appearance">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          Appearance
        </div>
        <div className="settings-nav-item" data-set="keybindings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8"/></svg>
          Keybindings
        </div>
        <div className="settings-nav-item" data-set="ai">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M12 17v4M8 21h8"/></svg>
          AI Models
        </div>
        <div className="settings-nav-item" data-set="security">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Security
        </div>
        <div className="settings-nav-item" data-set="terminal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
          Terminal
        </div>
        <div className="settings-nav-item" data-set="data">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
          Data &amp; Backup
        </div>
      </div>

      <div className="settings-main">
        {/* General */}
        <div className="settings-panel active" id="panel-general">
          <div className="settings-section">
            <h2>General</h2>
            <p className="section-desc">Application behavior and startup settings</p>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Language</h4>
                <p>Interface display language</p>
              </div>
              <select className="setting-select"><option>English</option><option selected>中文</option><option>日本語</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Launch on startup</h4>
                <p>Start OmniPanel when your computer starts</p>
              </div>
              <div className="toggle"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Restore last session</h4>
                <p>Reopen tabs, layouts and connections from last session</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Check for updates</h4>
                <p>Automatically check for new versions</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Telemetry</h4>
                <p>Send anonymous usage data (no personal data collected)</p>
              </div>
              <div className="toggle"></div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-panel" id="panel-appearance">
          <div className="settings-section">
            <h2>Appearance</h2>
            <p className="section-desc">Theme, font, and density settings</p>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Theme</h4>
                <p>Application color scheme</p>
              </div>
              <select className="setting-select"><option selected>Dark (Default)</option><option>Light</option><option>System</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Accent Color</h4>
                <p>Primary accent color for highlights and actions</p>
              </div>
              <div style={{display: "flex", gap: "var(--sp-2)"}}>
                <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", cursor: "pointer", border: "2px solid var(--fg)"}}></div>
                <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "#30d158", cursor: "pointer"}}></div>
                <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "#ff9f0a", cursor: "pointer"}}></div>
                <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "#ff3b30", cursor: "pointer"}}></div>
                <div style={{width: "24px", height: "24px", borderRadius: "50%", background: "#bf5af2", cursor: "pointer"}}></div>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>UI Density</h4>
                <p>Controls spacing and element size</p>
              </div>
              <select className="setting-select"><option>Compact</option><option selected>Standard</option><option>Comfortable</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Sidebar position</h4>
                <p>Left or right side of the window</p>
              </div>
              <select className="setting-select"><option selected>Left</option><option>Right</option></select>
            </div>
          </div>
        </div>

        {/* Keybindings */}
        <div className="settings-panel" id="panel-keybindings">
          <div className="settings-section">
            <h2>Keybindings</h2>
            <p className="section-desc">Keyboard shortcuts for all major actions</p>
            <div className="setting-row">
              <div className="setting-label"><h4>New Terminal Tab</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>T</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Close Tab</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>W</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Switch Tab</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>Tab</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Command Palette</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>K</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Toggle AI Panel</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>L</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Split Terminal</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>New SSH Connection</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>N</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>New DB Connection</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Settings</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>,</kbd></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Toggle Tab N</h4></div>
              <div className="keybind"><kbd>Ctrl</kbd> + <kbd>1-9</kbd></div>
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className="settings-panel" id="panel-ai">
          <div className="settings-section">
            <h2>AI Models</h2>
            <p className="section-desc">Configure AI providers and model preferences</p>

            <h3 style={{fontSize: "13px", fontWeight: 600, marginBottom: "var(--sp-3)"}}>Cloud API Providers</h3>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>C</div>
              <div className="provider-info">
                <div className="provider-name">Claude API</div>
                <div className="provider-desc">Anthropic Claude {"·"} claude-sonnet-4-6</div>
              </div>
              <span className="badge badge-success">Active</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>G</div>
              <div className="provider-info">
                <div className="provider-name">OpenAI API</div>
                <div className="provider-desc">GPT-4o {"·"} gpt-4o-2024-08-06</div>
              </div>
              <span className="badge badge-muted">Inactive</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>D</div>
              <div className="provider-info">
                <div className="provider-name">DeepSeek API</div>
                <div className="provider-desc">DeepSeek Coder {"·"} deepseek-coder-v2</div>
              </div>
              <span className="badge badge-muted">Inactive</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>

            <h3 style={{fontSize: "13px", fontWeight: 600, margin: "var(--sp-4) 0 var(--sp-3)"}}>Local Models</h3>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--surface)", color: "var(--fg-2)"}}>O</div>
              <div className="provider-info">
                <div className="provider-name">Ollama</div>
                <div className="provider-desc">localhost:11434 {"·"} codellama:34b</div>
              </div>
              <span className="badge badge-success">Connected</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>

            <h3 style={{fontSize: "13px", fontWeight: 600, margin: "var(--sp-4) 0 var(--sp-3)"}}>CLI Agents</h3>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>CC</div>
              <div className="provider-info">
                <div className="provider-name">Claude Code</div>
                <div className="provider-desc">Local CLI {"·"} claude-code detected</div>
              </div>
              <span className="badge badge-success">Available</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>
            <div className="provider-card">
              <div className="provider-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>CA</div>
              <div className="provider-info">
                <div className="provider-name">Cursor Agent</div>
                <div className="provider-desc">Local CLI {"·"} cursor-agent detected</div>
              </div>
              <span className="badge badge-success">Available</span>
              <button className="btn btn-ghost btn-sm">Configure</button>
            </div>

            <div className="setting-row" style={{marginTop: "var(--sp-4)"}}>
              <div className="setting-label">
                <h4>Default Provider</h4>
                <p>Provider used when no specific provider is selected</p>
              </div>
              <select className="setting-select"><option selected>Claude API</option><option>Ollama</option><option>OpenAI API</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Stream responses</h4>
                <p>Show AI responses as they are generated</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Prefer local models for sensitive data</h4>
                <p>Automatically use local models when connected to production</p>
              </div>
              <div className="toggle on"></div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="settings-panel" id="panel-security">
          <div className="settings-section">
            <h2>Security</h2>
            <p className="section-desc">Credential storage, AI safety, and operation policies</p>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Credential Storage</h4>
                <p>Where SSH keys, DB passwords, and API keys are stored</p>
              </div>
              <select className="setting-select"><option selected>System Keychain</option><option>Encrypted SQLite</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Production environment confirmation</h4>
                <p>Require confirmation before executing commands on prod servers</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Dangerous command detection</h4>
                <p>Warn before executing rm -rf, DROP TABLE, docker rm, etc.</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>AI operation approval</h4>
                <p>Require user confirmation before AI executes any write operation</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Data sent to AI</h4>
                <p>What context is included when sending to AI providers</p>
              </div>
              <select className="setting-select"><option selected>Minimal (sanitized)</option><option>Full context</option><option>None</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Audit logging</h4>
                <p>Record all high-risk operations, AI actions, and data modifications</p>
              </div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Sensitive data masking</h4>
                <p>Automatically mask emails, phones, tokens, and passwords in display</p>
              </div>
              <div className="toggle on"></div>
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="settings-panel" id="panel-terminal">
          <div className="settings-section">
            <h2>Terminal</h2>
            <p className="section-desc">Terminal emulator settings</p>
            <div className="setting-row">
              <div className="setting-label"><h4>Font Family</h4><p>Monospace font for terminal</p></div>
              <select className="setting-select"><option selected>Berkeley Mono</option><option>JetBrains Mono</option><option>Fira Code</option><option>IBM Plex Mono</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Font Size</h4></div>
              <select className="setting-select"><option>12px</option><option selected>13px</option><option>14px</option><option>15px</option><option>16px</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Line Height</h4></div>
              <select className="setting-select"><option>1.2</option><option>1.4</option><option selected>1.6</option><option>1.8</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Cursor Style</h4></div>
              <select className="setting-select"><option>Block</option><option selected>Bar</option><option>Underline</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Cursor Blink</h4></div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Scrollback Lines</h4><p>Number of lines to keep in scroll buffer</p></div>
              <select className="setting-select"><option>1000</option><option>5000</option><option selected>10000</option><option>50000</option></select>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>GPU Acceleration</h4><p>Use wgpu for terminal rendering</p></div>
              <div className="toggle on"></div>
            </div>
            <div className="setting-row">
              <div className="setting-label"><h4>Copy on select</h4><p>Automatically copy selected text to clipboard</p></div>
              <div className="toggle"></div>
            </div>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="settings-panel" id="panel-data">
          <div className="settings-section">
            <h2>Data &amp; Backup</h2>
            <p className="section-desc">Local data management, import/export, and cleanup</p>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Export all data</h4>
                <p>Export connections, settings, history, and workflows to a file</p>
              </div>
              <button className="btn btn-secondary btn-sm">Export</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Import data</h4>
                <p>Import from OmniPanel export, Xshell, WindTerm, or OpenSSH config</p>
              </div>
              <button className="btn btn-secondary btn-sm">Import</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Clear command history</h4>
                <p>Remove all saved terminal command history</p>
              </div>
              <button className="btn btn-danger btn-sm">Clear</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Clear AI conversation history</h4>
                <p>Remove all saved AI chat history</p>
              </div>
              <button className="btn btn-danger btn-sm">Clear</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Clear SQL history</h4>
                <p>Remove all saved SQL query history</p>
              </div>
              <button className="btn btn-danger btn-sm">Clear</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Clear audit log</h4>
                <p>Remove all audit trail records</p>
              </div>
              <button className="btn btn-danger btn-sm">Clear</button>
            </div>
            <div className="setting-row">
              <div className="setting-label">
                <h4>Reset all settings</h4>
                <p>Restore all settings to factory defaults</p>
              </div>
              <button className="btn btn-danger btn-sm">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
