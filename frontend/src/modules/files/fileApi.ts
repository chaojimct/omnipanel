import { commands, type Connection, type FileEntry, type FileManagerConnectionInfo } from "../../ipc/bindings";
import { fmtError } from "./utils";

async function unwrap<T>(res: { status: string; data?: T; error?: { message: string } }): Promise<T> {
  if (res.status === "ok" && res.data !== undefined) return res.data;
  throw new Error(res.error?.message ?? "请求失败");
}

export async function listFileConnections(): Promise<FileManagerConnectionInfo[]> {
  return unwrap(await commands.fileListConnections());
}

export async function listDirectory(connectionId: string, path: string): Promise<FileEntry[]> {
  return unwrap(await commands.fileListDir(connectionId, path));
}

export async function saveFileConnection(connection: Connection, secret: string | null): Promise<Connection> {
  return unwrap(await commands.fileSaveConnection(connection, secret));
}

export async function testFileConnection(connectionId: string): Promise<string> {
  return unwrap(await commands.fileTestConnection(connectionId));
}

export async function mkdirRemote(connectionId: string, path: string): Promise<void> {
  await unwrap(await commands.fileMkdir(connectionId, path));
}

export async function renameRemote(connectionId: string, oldPath: string, newPath: string): Promise<void> {
  await unwrap(await commands.fileRename(connectionId, oldPath, newPath));
}

export async function deleteRemote(connectionId: string, path: string): Promise<void> {
  await unwrap(await commands.fileDelete(connectionId, path));
}

export async function uploadRemote(connectionId: string, path: string, data: number[]): Promise<void> {
  await unwrap(await commands.fileUploadFile(connectionId, path, data));
}

export async function downloadRemote(connectionId: string, remotePath: string, localPath: string): Promise<void> {
  await unwrap(await commands.fileDownloadFile(connectionId, remotePath, localPath));
}

export async function readRemotePreview(connectionId: string, path: string, maxBytes = 512 * 1024): Promise<number[]> {
  return unwrap(await commands.fileReadFile(connectionId, path, maxBytes));
}

export async function loadQuickPaths() {
  return unwrap(await commands.fileLocalQuickPaths());
}

export { fmtError };
