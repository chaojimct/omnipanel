import { useEffect, useState } from "react";

import { commands, type AiTraceRecord } from "../../ipc/bindings";
import { isTauriRuntime } from "../../lib/isTauriRuntime";

export function TraceDetailView({ sessionId }: { sessionId: string }) {
  const [traces, setTraces] = useState<AiTraceRecord[]>([]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void commands
      .aiListSessionTraces(sessionId)
      .then(setTraces)
      .catch(() => setTraces([]));
  }, [sessionId]);

  return (
    <div className="ai-trace-detail">
      <h3 className="settings-subsection-title">Session: {sessionId}</h3>
      <ul className="ai-trace-timeline">
        {traces.map((trace) => (
          <li key={trace.id} className="ai-trace-event">
            <div className="ai-trace-event-head">
              <span>{trace.eventType}</span>
              <span className="section-desc">{new Date(trace.ts).toLocaleString()}</span>
            </div>
            <pre className="settings-code-block ai-trace-payload">{trace.payload}</pre>
          </li>
        ))}
        {traces.length === 0 ? <li className="section-desc">无 trace 事件</li> : null}
      </ul>
    </div>
  );
}
