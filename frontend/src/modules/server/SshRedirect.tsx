import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useServerViewStore } from "../../stores/serverViewStore";

/** 兼容旧 `/ssh` 路由：进入服务器模块的终端页 */
export function SshRedirect() {
  const setViewTab = useServerViewStore((s) => s.setViewTab);

  useEffect(() => {
    setViewTab("terminal");
  }, [setViewTab]);

  return <Navigate to="/server" replace />;
}
