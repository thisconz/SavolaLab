export interface SystemMetrics {
  // HTTP
  http_requests_total: number;
  http_errors_4xx: number;
  http_errors_5xx: number;
  http_latency_p50_ms: number;
  http_latency_p99_ms: number;

  // Database
  db_query_count: number;
  db_slow_queries: number; // >100ms
  db_pool_size: number;
  db_pool_idle: number;

  // SSE
  sse_active_connections: number;
  sse_events_published: number;

  // Business
  samples_registered_today: number;
  tests_completed_today: number;
  overdue_tests: number;
  stat_requests_open: number;
}
