import SparkMD5 from "spark-md5";

export interface OnePanelSystemInfo {
  hostname: string;
  os: string;
  kernel: string;
  platformVersion: string;
  uptime: number;
  cpuCores: number;
  cpuModel: string;
  totalMemory: number;
  usedMemory: number;
  totalDisk: number;
  usedDisk: number;
  swapTotal: number;
  swapUsed: number;
  currentTime: string;
}

export interface OnePanelMonitorPoint {
  time: string;
  cpuPercent: number;
  memoryUsed: number;
  memoryPercent: number;
  diskUsed: number;
  diskPercent: number;
  networkUp: number;
  networkDown: number;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;
}

export interface OnePanelProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRss: number;
  state: string;
  user: string;
}

export interface OnePanelHostInfo {
  hostname: string;
  os: string;
  kernel: string;
  platformVersion: string;
  platform: string;
}

export class OnePanelClient {
  private host: string;
  private apiKey: string;

  constructor(host: string, apiKey: string) {
    let normalized = host.replace(/\/+$/, "");
    if (!/^https?:\/\//.test(normalized)) {
      normalized = `http://${normalized}`;
    }
    this.host = normalized;
    this.apiKey = apiKey;
  }

  private token(timestamp: number): string {
    return SparkMD5.hash(`1panel${this.apiKey}${timestamp}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const res = await fetch(`${this.host}/api/v2${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "1Panel-Token": this.token(timestamp),
        "1Panel-Timestamp": String(timestamp),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`1Panel API error (${res.status}): ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async getSystemInfo(): Promise<OnePanelSystemInfo> {
    const data = await this.request<Record<string, unknown>>("GET", "/dashboard/system");
    return data as unknown as OnePanelSystemInfo;
  }

  async getMonitor(params: {
    startTime: string;
    endTime: string;
    point?: number;
  }): Promise<OnePanelMonitorPoint[]> {
    const q = new URLSearchParams({
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.point ? { point: String(params.point) } : {}),
    });
    const data = await this.request<Record<string, unknown>>("GET", `/dashboard/monitor?${q}`);
    const arr = (data.data ?? data) as unknown[];
    return arr as OnePanelMonitorPoint[];
  }

  async getProcesses(): Promise<OnePanelProcess[]> {
    const data = await this.request<Record<string, unknown>>("POST", "/host/process/search", {});
    const arr = (data.data ?? data) as unknown[];
    return arr as OnePanelProcess[];
  }

  async getHostInfo(): Promise<OnePanelHostInfo> {
    const data = await this.request<Record<string, unknown>>("GET", "/host/host");
    return data as unknown as OnePanelHostInfo;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request<unknown>("GET", "/dashboard/system");
      return true;
    } catch {
      return false;
    }
  }
}
