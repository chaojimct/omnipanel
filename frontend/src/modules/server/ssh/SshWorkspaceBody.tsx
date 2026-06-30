import { SshWorkspacePanel } from "./SshWorkspacePanel";

type Props = {
  enabled?: boolean;
  embedded?: boolean;
};

/** @deprecated 使用 SshWorkspacePanel；保留别名供旧引用 */
export function SshWorkspaceBody({ enabled = true, embedded = false }: Props) {
  return <SshWorkspacePanel enabled={enabled} embedded={embedded} />;
}
