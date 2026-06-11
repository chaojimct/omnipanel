/** 内建本地 Docker 连接 id（与后端 `docker-local` 一致，不可删除）。 */
export const DOCKER_LOCAL_CONNECTION_ID = "docker-local";

export function isBuiltinLocalDockerConnection(connectionId: string): boolean {
  return connectionId === DOCKER_LOCAL_CONNECTION_ID;
}
