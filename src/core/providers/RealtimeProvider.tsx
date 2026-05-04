import React, { createContext, useContext, useEffect, memo } from "react";
import { toast } from "sonner";
import { useSSE, type SSEEventType, type SSECallback, type SSEStatus } from "../hooks/useSSE";

interface RealtimeContextValue {
  status: SSEStatus;
  isConnected: boolean;
  on: <T = any>(event: SSEEventType, callback: SSECallback<T>) => () => void;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "disconnected",
  isConnected: false,
  on: () => () => { /* empty */ },
  reconnect: () => { /* empty */ },
});

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { status, isConnected, on, reconnect } = useSSE({
    onConnect: (info) => {
      console.info("[Realtime] Connected:", info.connectionId);
    },
    onReconnect: (attempt) => {
      console.warn("[Realtime] Reconnecting, attempt", attempt);
    },
    onGiveUp: () => {
      toast.error("Real-time connection lost. Please refresh.", {
        duration: 0,
        id: "sse-lost",
      });
    },
  });

  useEffect(() => {
    const unsubStat = on("STAT_CREATED", (data) => {
      if (data.urgency === "CRITICAL") {
        toast.error(`⚡ STAT Critical: ${data.department}`, { duration: 8000 });
      }
    });

    const unsubSystem = on("SYSTEM_ALERT", (data) => {
      if (data.level === "error") toast.error(data.message, { duration: 6000 });
      else if (data.level === "warning") toast.warning(data.message, { duration: 5000 });
      else toast.info(data.message, { duration: 4000 });
    });

    return () => {
      unsubStat();
      unsubSystem();
    };
  }, [on]);

  return (
    <RealtimeContext.Provider value={{ status, isConnected, on, reconnect }}>
      {children}
    </RealtimeContext.Provider>
  );
});

RealtimeProvider.displayName = "RealtimeProvider";

export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeStatusBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status, reconnect } = useRealtime();

  const configs = {
    connected: { dotColor: "#10b981", label: "Live", textColor: "#10b981", pulse: true },
    connecting: { dotColor: "#f59e0b", label: "Connecting", textColor: "#f59e0b", pulse: true },
    reconnecting: { dotColor: "#f59e0b", label: "Reconnecting", textColor: "#f59e0b", pulse: true },
    disconnected: { dotColor: "#ef4444", label: "Offline", textColor: "#ef4444", pulse: false },
  };

  const config = configs[status];

  return (
    <button
      onClick={status === "disconnected" ? reconnect : undefined}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[8px] font-black tracking-widest uppercase transition-all ${className}`}
      style={{
        background: `${config.dotColor}10`,
        border: `1px solid ${config.dotColor}30`,
        color: config.textColor,
        cursor: status === "disconnected" ? "pointer" : "default",
      }}
      title={status === "disconnected" ? "Click to reconnect" : `Real-time: ${status}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: config.dotColor }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{
            background: config.dotColor,
            boxShadow: `0 0 6px ${config.dotColor}`,
          }}
        />
      </span>
      <span>{config.label}</span>
    </button>
  );
};
