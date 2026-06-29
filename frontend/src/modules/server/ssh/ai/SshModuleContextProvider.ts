import { ModuleContextProvider } from "../../../../lib/ai/context";
import { buildSshAiContextText, isSshModuleContextEmpty, type SshModuleContext } from "./types";

export class SshModuleContextProvider extends ModuleContextProvider<SshModuleContext> {
  constructor() {
    super("ssh");
  }

  formatContextForAi(context: SshModuleContext): string {
    if (isSshModuleContextEmpty(context) || !context.resource || !context.hostContext) {
      return "";
    }
    return buildSshAiContextText(context.resource, context.hostContext);
  }
}

export const sshModuleContextProvider = new SshModuleContextProvider();
