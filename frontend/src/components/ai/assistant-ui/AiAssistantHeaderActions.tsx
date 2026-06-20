import { useCallback } from "react";

import { appConfirm } from "../../../lib/appConfirm";
import { useI18n } from "../../../i18n";
import { useAiStore } from "../../../stores/aiStore";
import { Button } from "../../ui/Button";
import { IconMessage, IconPlus, IconXCircle } from "../../ui/Icons";
import { AiMcpConnections } from "../AiMcpConnections";
import { AiModelSelect } from "../AiModelSelect";

/** 标题栏左侧：MCP 连接、模型选择 */
export function AiAssistantHeaderLeft() {
  const { t } = useI18n();
  const isGenerating = useAiStore((s) => s.isGenerating);

  return (
    <div className="ai-panel-header-left">
      <AiMcpConnections />
      <div className="ai-subwindow-model">
        <span className="ai-subwindow-model-label">{t("ai.modelSelect.label")}</span>
        <AiModelSelect disabled={isGenerating} className="ai-subwindow-model-select" />
      </div>
    </div>
  );
}

/** 标题栏右侧：会话列表、新建、删除当前会话 */
export function AiAssistantHeaderRight() {
  const { t } = useI18n();
  const conversationListOpen = useAiStore((s) => s.conversationListOpen);
  const toggleConversationList = useAiStore((s) => s.toggleConversationList);
  const activeConversationId = useAiStore((s) => s.activeConversationId);
  const createConversation = useAiStore((s) => s.createConversation);
  const deleteConversation = useAiStore((s) => s.deleteConversation);
  const isGenerating = useAiStore((s) => s.isGenerating);

  const handleDeleteCurrent = useCallback(async () => {
    if (!activeConversationId || isGenerating) return;
    if (!(await appConfirm(t("ai.conversations.deleteCurrentConfirm")))) return;
    deleteConversation(activeConversationId);
  }, [activeConversationId, deleteConversation, isGenerating, t]);

  const handleNew = useCallback(() => {
    if (isGenerating) return;
    createConversation();
  }, [createConversation, isGenerating]);

  return (
    <div className="ai-panel-header-right">
      <Button
        variant="ghost"
        size="icon-xs"
        className={conversationListOpen ? "is-active" : ""}
        onClick={toggleConversationList}
        aria-label={t("ai.conversations.toggle")}
        title={t("ai.conversations.toggle")}
        aria-pressed={conversationListOpen}
      >
        <IconMessage size={15} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={isGenerating}
        onClick={handleNew}
        aria-label={t("ai.conversations.new")}
        title={t("ai.conversations.new")}
      >
        <IconPlus size={15} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={!activeConversationId || isGenerating}
        onClick={() => void handleDeleteCurrent()}
        aria-label={t("ai.conversations.deleteCurrent")}
        title={t("ai.conversations.deleteCurrent")}
      >
        <IconXCircle size={15} />
      </Button>
    </div>
  );
}

/** SubWindow 等场景：左右工具条合并为一行 */
export function AiAssistantHeaderToolbar() {
  return (
    <div className="ai-subwindow-header-toolbar">
      <AiAssistantHeaderLeft />
      <AiAssistantHeaderRight />
    </div>
  );
}
