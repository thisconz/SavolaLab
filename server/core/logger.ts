import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } },
  }),
});

export const logger = new Proxy(baseLogger, {
  get(target, prop) {
    const ctx = requestContext.getStore();
    if (ctx && typeof (target as any)[prop] === "function") {
      return (obj: any, ...args: any[]) => {
        const merged = typeof obj === "object" ? { ...obj, requestId: ctx.requestId } : { msg: obj, requestId: ctx.requestId };
        return (target as any)[prop](merged, ...args);
      };
    }
    return (target as any)[prop];
  },
});
