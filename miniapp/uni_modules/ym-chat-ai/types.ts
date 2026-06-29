// utils/types.ts
// TypeScript类型定义

export interface RequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  enableChunked?: boolean;
  [key: string]: any;
}

export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface Adapter {
  requestAdapter<T = any>(config: RequestConfig): Promise<Response<T>>;
  getToken(): string;
}

export interface Interceptor<T> {
  (value: T): T | Promise<T>;
}

export interface Interceptors {
  request: Interceptor<RequestConfig>[];
  response: Interceptor<Response>[];
  error: Interceptor<any>[];
}


// 密码修改参数
export interface PasswordChangeParams {
  oldPassword: string;
  newPassword: string;
}

// 附件文件类型
export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

// 发送事件类型
export interface SendEvent {
  message: string;
  timestamp: number;
  isOnline?: boolean;
}