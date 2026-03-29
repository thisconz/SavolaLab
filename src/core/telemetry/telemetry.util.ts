export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

export interface TelemetryEvent {
  name: string;
  level: LogLevel;
  timestamp: string;
  data?: any;
  context?: string;
}

export class TelemetryService {
  private static instance: TelemetryService;

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public log(name: string, level: LogLevel, data?: any, context?: string) {
    const event: TelemetryEvent = {
      name,
      level,
      timestamp: new Date().toISOString(),
      data,
      context,
    };

    // In production, this would send to a logging service like Sentry or Datadog
    console.log(`[${event.level}] ${event.name}:`, event.data);

    if (level === LogLevel.ERROR) {
      // Handle critical errors, maybe show a global toast or error boundary
    }
  }

  public logInfo(name: string, data?: any, context?: string) {
    this.log(name, LogLevel.INFO, data, context);
  }

  public logWarn(name: string, data?: any, context?: string) {
    this.log(name, LogLevel.WARN, data, context);
  }

  public logError(name: string, data?: any, context?: string) {
    this.log(name, LogLevel.ERROR, data, context);
  }

  public logDebug(name: string, data?: any, context?: string) {
    this.log(name, LogLevel.DEBUG, data, context);
  }
}

export const Telemetry = TelemetryService.getInstance();
