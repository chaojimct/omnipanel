import { useNavigate } from "react-router-dom";
import { useI18n } from "../../../../i18n";
import { MODULE_PATHS } from "../../../../lib/paths";
import { useAiStore } from "../../../../stores/aiStore";
import { useActionStore } from "../../../../stores/actionStore";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import type { SshHostContext } from "../hooks/useSshHostContext";
import { buildSshAiContextText } from "../ai/types";
import { getProfile } from "../data/hostProfiles";
import { isProdHost } from "../utils/sshProdGuard";

type Props = {
  resource: WorkspaceResource;
  context: SshHostContext;
};

export function HostOrchestrationBar({ resource, context }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const openDrawer = useAiStore((s) => s.openDrawer);
  const createConversation = useAiStore((s) => s.createConversation);
  const setContext = useAiStore((s) => s.setContext);
  const setDraftPrompt = useAiStore((s) => s.setDraftPrompt);
  const enqueueAction = useActionStore((s) => s.enqueueAction);

  const isProd = isProdHost(resource, context.connection);

  function openAiTroubleshoot() {
    const convId = createConversation();
    setContext(convId, [
      { type: "ssh-host", label: resource.name },
      { type: "environment", label: resource.environment },
    ]);
    const ctxText = buildSshAiContextText(resource, context);
    setDraftPrompt(
      `${ctxText}\n\n请基于以上主机状态，帮我分析当前可能的风险点，并给出可执行的排查命令链（需我确认后再执行）。`,
    );
    openDrawer();
  }

  function openWorkflow(template: "patrol" | "release") {
    const profile = getProfile(resource);
    const preset =
      template === "patrol"
        ? profile.presets.find((p) => p.id.includes("troubleshoot") || p.tone === "warn") ??
          profile.presets[0]
        : profile.presets.find((p) => p.id.includes("release") || p.tone === "accent") ??
          profile.presets[1] ?? profile.presets[0];

    enqueueAction(
      {
        type: "workflow",
        title: template === "patrol" ? t("ssh.orchestration.patrol") : t("ssh.orchestration.release"),
        description: `${resource.name} · ${preset?.title ?? template}`,
        command: preset?.commands.join(" && ") ?? "uptime",
        resourceId: resource.id,
        source: "用户",
      },
      { deferRun: true, requireApproval: isProd },
    );

    navigate(MODULE_PATHS.workflow, {
      state: {
        sshWorkflowSeed: {
          hostId: resource.id,
          hostName: resource.name,
          template,
          commands: preset?.commands ?? [],
        },
      },
    });
  }

  return (
    <div className={`ssh-orchestration${isProd ? " ssh-orchestration--prod" : ""}`}>
      {isProd && (
        <span className="ssh-orchestration__prod-badge">{t("ssh.prod.badge")}</span>
      )}
      <div className="ssh-orchestration__actions">
        <button type="button" className="ssh-orchestration__btn" onClick={openAiTroubleshoot}>
          {t("ssh.orchestration.aiTroubleshoot")}
        </button>
        <button
          type="button"
          className="ssh-orchestration__btn"
          onClick={() => openWorkflow("patrol")}
        >
          {t("ssh.orchestration.patrol")}
        </button>
        <button
          type="button"
          className="ssh-orchestration__btn"
          onClick={() => openWorkflow("release")}
        >
          {t("ssh.orchestration.release")}
        </button>
      </div>
    </div>
  );
}
