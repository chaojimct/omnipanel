export function AiAssistant() {
  return (
    <div className="db-ai-panel">
      <div className="db-ai-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="16" height="16"><path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01M6 14h.01"/><path d="M12 17v4M8 21h8"/></svg>
        <h3>AI Assistant</h3>
        <span className="badge badge-accent" style={{marginLeft: "auto"}}>NL2SQL</span>
      </div>
      <div className="db-ai-messages">
        <div className="db-ai-msg">
          <div className="msg-role ai">AI</div>
          <div>Connected to <code>app_production</code>. I can see 5 tables in the current schema. Try asking me to generate queries in natural language.</div>
        </div>
        <div className="db-ai-msg">
          <div className="msg-role user">User</div>
          <div>Show me the top 5 users by total order amount this month</div>
        </div>
        <div className="db-ai-msg">
          <div className="msg-role ai">AI</div>
          <div>Generated SQL:<br /><br /><code style={{display: "block", padding: "8px", background: "var(--bg-deeper)", borderRadius: "4px", fontSize: "12px", lineHeight: "1.5"}}>{"SELECT u.name, u.email,\n  SUM(o.total) AS total_amount\nFROM orders o\nJOIN users u ON u.id = o.user_id\nWHERE o.created_at >= date_trunc('month', NOW())\nGROUP BY u.id, u.name, u.email\nORDER BY total_amount DESC\nLIMIT 5;"}</code><br /><br /><span className="text-accent" style={{cursor: "pointer"}}>Run Query</span> {" · "} <span style={{cursor: "pointer"}}>Copy</span></div>
        </div>
      </div>
      <div className="db-ai-input">
        <input className="input" placeholder="Ask in natural language..." style={{width: "100%"}} />
      </div>
    </div>
  );
}
