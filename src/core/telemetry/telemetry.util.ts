export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
  CRITICAL = 50, // Added for STAT-level badge triggers
}

export interface TelemetryEvent {
  event: string;
  level: LogLevel;
  timestamp: number; // Unix for easier sorting/filtering
  payload?: Record<string, any>;
  module?: string;
  metadata?: Record<string, any>;
}

class TelemetryService {
  logInfo(event: string, payload?: Record<string, any>) {
    this.info(event, payload);
  }
  logError(event: string, payload?: Record<string, any>) {
    this.error(event, payload);
  }
  private static instance: TelemetryService;
  private eventBuffer: TelemetryEvent[] = [];
  private readonly BUFFER_LIMIT = 50;
  private globalMetadata: Record<string, any> = {
    version: process.env.VITE_ZENTHAR_VERSION || "unknown",
    environment: process.env.NODE_ENV || "development",
  };

  private constructor() {
    // Auto-flush buffer on window unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Attach persistent data to every future log (e.g., UserID, SessionID)
   */
  public setGlobalMetadata(data: Record<string, any>) {
    this.globalMetadata = { ...this.globalMetadata, ...data };
  }

  public log(
    event: string,
    level: LogLevel = LogLevel.INFO,
    payload?: Record<string, any>,
    module: string = "CORE",
  ) {
    const telemetryEvent: TelemetryEvent = {
      event,
      level,
      module: module.toUpperCase(),
      timestamp: Date.now(),
      payload,
      metadata: { ...this.globalMetadata },
    };

    // 1. Development Output (Formatted for the Zenthar Console)
    if (process.env.NODE_ENV === "development") {
      this.printToConsole(telemetryEvent);
    }

    // 2. Buffer for production (prevents API spam)
    this.eventBuffer.push(telemetryEvent);

    if (
      this.eventBuffer.length >= this.BUFFER_LIMIT ||
      level >= LogLevel.ERROR
    ) {
      this.flush();
    }
  }

  private flush() {
    if (this.eventBuffer.length === 0) return;

    // In production: send to Sentry, Datadog, or internal API
    // const payload = [...this.eventBuffer];
    this.eventBuffer = [];
  }

  private printToConsole(e: TelemetryEvent) {
    const styles = {
      [LogLevel.DEBUG]: "color: #71717a", // Zinc
      [LogLevel.INFO]: "color: #b1be9b", // Brand Primary
      [LogLevel.WARN]: "color: #f97316", // Orange
      [LogLevel.ERROR]: "color: #ef4444", // Red
      [LogLevel.CRITICAL]:
        "background: #ef4444; color: white; padding: 2px 4px; border-radius: 2px;",
    };

    const levelLabel = LogLevel[e.level];
    console.log(
      `%c[${levelLabel}] %c${e.module}%c ${e.event}`,
      styles[e.level],
      "font-weight: bold; color: #09090b",
      "color: inherit",
      e.payload || "",
    );
  }

  /* Helper Methods */
  public debug = (msg: string, data?: any, mod?: string) =>
    this.log(msg, LogLevel.DEBUG, data, mod);
  public info = (msg: string, data?: any, mod?: string) =>
    this.log(msg, LogLevel.INFO, data, mod);
  public warn = (msg: string, data?: any, mod?: string) =>
    this.log(msg, LogLevel.WARN, data, mod);
  public error = (msg: string, data?: any, mod?: string) =>
    this.log(msg, LogLevel.ERROR, data, mod);
  public critical = (msg: string, data?: any, mod?: string) =>
    this.log(msg, LogLevel.CRITICAL, data, mod);
}

export const Telemetry = TelemetryService.getInstance();
