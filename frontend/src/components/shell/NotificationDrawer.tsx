import { useState, useEffect, useCallback } from "react";

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const toggleHandler = () => toggle();
    window.addEventListener("toggle-notif-drawer", toggleHandler);
    return () => window.removeEventListener("toggle-notif-drawer", toggleHandler);
  }, [toggle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <>
      <div
        className={`notif-drawer-overlay${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(false)}
      />
      <div className={`notif-drawer${isOpen ? " open" : ""}`}>
        <div className="notif-drawer-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="16" height="16"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <h3>通知中心</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="notif-drawer-body">
          <div className="notif-group-title">紧急</div>
          <div className="notif-item unread">
            <div className="notif-icon" style={{background:"var(--danger-soft)", color:"var(--danger)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">磁盘空间不足 — staging-worker</div>
              <div className="notif-desc">WAL 日志持续增长，当前使用率 92%。需要清理或扩容。</div>
              <div className="notif-time">30 分钟前</div>
            </div>
          </div>
          <div className="notif-item warn">
            <div className="notif-icon" style={{background:"var(--warn-soft)", color:"var(--warn)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">SSL 证书即将过期</div>
              <div className="notif-desc">prod-web-01 · api.example.com 的证书将在 14 天后过期。</div>
              <div className="notif-time">1 小时前</div>
            </div>
          </div>
          <div className="notif-item unread">
            <div className="notif-icon" style={{background:"var(--warn-soft)", color:"var(--warn)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">prod-db CPU 使用率偏高</div>
              <div className="notif-desc">过去 15 分钟 CPU 使用率维持在 67%，可能存在慢查询。</div>
              <div className="notif-time">2 小时前</div>
            </div>
          </div>

          <div className="notif-group-title">今日</div>
          <div className="notif-item">
            <div className="notif-icon" style={{background:"var(--success-soft)", color:"var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">数据库备份完成</div>
              <div className="notif-desc">prod-db-master 自动备份完成，已验证完整性。大小 2.3 GB。</div>
              <div className="notif-time">6 小时前</div>
            </div>
          </div>
          <div className="notif-item">
            <div className="notif-icon" style={{background:"var(--accent-soft)", color:"var(--accent)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">容器 celery-worker 自动重启</div>
              <div className="notif-desc">celery-worker 因 OOM 被 kill 后自动重启，当前运行正常。</div>
              <div className="notif-time">8 小时前</div>
            </div>
          </div>
          <div className="notif-item">
            <div className="notif-icon" style={{background:"var(--success-soft)", color:"var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">服务器巡检全部通过</div>
              <div className="notif-desc">6 台服务器例行巡检完成，无异常发现。</div>
              <div className="notif-time">10 小时前</div>
            </div>
          </div>

          <div className="notif-group-title">昨日</div>
          <div className="notif-item">
            <div className="notif-icon" style={{background:"var(--accent-soft)", color:"var(--accent)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div className="notif-content">
              <div className="notif-title">Rate limit 触发</div>
              <div className="notif-desc">45.33.32.0/24 子网在 5 分钟内发送 2,847 次请求，已触发限流。</div>
              <div className="notif-time">昨天 15:42</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
