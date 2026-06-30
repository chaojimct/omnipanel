import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MODULE_PATHS } from "../../lib/paths";
import { useTerminalLeftPanelStore } from "./terminalLeftPanelStore";

/** 旧 /module/ssh 路由重定向到终端 SSH 管理模式 */
export function SshToTerminalRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    useTerminalLeftPanelStore.getState().focusSsh();
    navigate(MODULE_PATHS.terminal, { replace: true });
  }, [navigate]);

  return null;
}
