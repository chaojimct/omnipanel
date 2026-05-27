export function StatusBar() {
  return (
    <div className="statusbar">
      <span className="statusbar-item"><span className="statusbar-dot green"></span> 6 servers</span>
      <span className="statusbar-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><rect x="2" y="7" width="6" height="5" rx="1" /><rect x="10" y="7" width="6" height="5" rx="1" /></svg>
        5 containers
      </span>
      <span className="statusbar-item">3 tasks</span>
      <span className="statusbar-item">3 drafts</span>
      <span className="statusbar-spacer"></span>
      <span className="statusbar-item" style={{ color: "var(--meta)" }}>Ctrl+K: Command Palette</span>
    </div>
  );
}
