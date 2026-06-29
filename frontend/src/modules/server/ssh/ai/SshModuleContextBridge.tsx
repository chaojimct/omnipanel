import { useEffect, useRef } from "react";
import { mountModuleContextProvider, updateRegisteredProviderContext } from "../../../../lib/ai/context";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import type { SshHostContext } from "../hooks/useSshHostContext";
import { sshModuleContextProvider, SshModuleContextProvider } from "./SshModuleContextProvider";

type Props = {
  resource: WorkspaceResource | null;
  hostContext: SshHostContext | null;
};

export function SshModuleContextBridge({ resource, hostContext }: Props) {
  const providerRef = useRef<SshModuleContextProvider>(sshModuleContextProvider);

  useEffect(() => mountModuleContextProvider(providerRef.current), []);

  useEffect(() => {
    updateRegisteredProviderContext(providerRef.current, {
      resource,
      hostContext,
    });
  }, [resource, hostContext]);

  return null;
}
