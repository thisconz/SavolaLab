export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: any;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}
