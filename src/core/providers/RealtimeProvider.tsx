import React, { createContext, useContext, useCallback, useEffect, memo } from "react";
import { toast } from "sonner";
import { useSSE, SSEEventType, SSECallback, SSEStatus } from "../hooks/useSSE";

// ─────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────

interface RealtimeContextValue {
  status: SSEStatus;
  isConnected: boolean;
  on: <T = any>(event: SSEEventType, callback: SSECallback<T>) => () => void;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: "disconnected",
  isConnected: false,
  on: () => () => {},
  reconnect: () => {},
});

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

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

  // Global side-effects for certain event types
  useEffect(() => {
    const unsubStat = on("STAT_CREATED", (data) => {
      if (data.urgency === "CRITICAL") {
        toast.error(`⚡ STAT Critical: ${data.department}`, {
          duration: 8000,
        });
      }
    });

    const unsubSystem = on("SYSTEM_ALERT", (data) => {
      if (data.level === "error") {
        toast.error(data.message, { duration: 6000 });
      } else if (data.level === "warning") {
        toast.warning(data.message, { duration: 5000 });
      } else {
        toast.info(data.message, { duration: 4000 });
      }
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

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const useRealtime = () => useContext(RealtimeContext);

// ─────────────────────────────────────────────
// Connection Status Badge (used in Header)
// ─────────────────────────────────────────────

export const RealtimeStatusBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status, reconnect } = useRealtime();

  const config = {
    connected: {
      dot: "bg-emerald-400",
      pulse: true,
      label: "Live",
      color: "text-emerald-400",
    },
    connecting: {
      dot: "bg-amber-400",
      pulse: true,
      label: "Connecting",
      color: "text-amber-400",
    },
    reconnecting: {
      dot: "bg-amber-500",
      pulse: true,
      label: "Reconnecting",
      color: "text-amber-500",
    },
    disconnected: {
      dot: "bg-red-500",
      pulse: false,
      label: "Offline",
      color: "text-red-400",
    },
  }[status];

  return (
    <button
      onClick={status === "disconnected" ? reconnect : undefined}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-current/5 border border-current/20 transition-all ${config.color} ${className}`}
      title={status === "disconnected" ? "Click to reconnect" : `Real-time: ${status}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      <span className="text-[8px] font-black uppercase tracking-widest">{config.label}</span>
    </button>
  );
};
