import React, { useState, useEffect, useCallback } from "react";
import { Bell, Check, Trash2, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { NotificationApi } from "../api/notification.api";
import { Notification } from "../../../core/types";
import { useNotifications } from "../hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "SAMPLE_COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "WORKFLOW_FAILURE":
        return <XCircle className="text-lab-laser h-4 w-4" />;
      case "OVERDUE_TEST":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="text-brand-primary h-4 w-4" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative overflow-hidden rounded-2xl border p-3 transition-all duration-300 ${
          unreadCount > 0
            ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-brand-primary/20 shadow-xl"
            : "border-brand-sage/20 hover:border-brand-primary/30 hover:text-brand-primary hover:shadow-brand-primary/10 bg-(--color-zenthar-graphite)/80 text-white/70 backdrop-blur-sm hover:shadow-lg"
        }`}
      >
        {/* Hover Gradient */}
        <div className="from-brand-primary/0 via-brand-primary/5 pointer-events-none absolute inset-0 bg-linear-to-tr to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <Bell
          className={`relative z-10 h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${unreadCount > 0 ? "animate-pulse" : ""}`}
        />
        {unreadCount > 0 && (
          <span className="bg-lab-laser absolute -top-1.5 -right-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-xl border border-white/20 text-[10px] font-black text-(--color-zenthar-void) shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-400px border-brand-sage/20 absolute right-0 z-50 mt-4 overflow-hidden rounded-[2rem] border bg-(--color-zenthar-carbon)/95 shadow-2xl backdrop-blur-2xl"
            >
              {/* Decorative Header Background */}
              <div className="from-brand-primary/10 pointer-events-none absolute top-0 right-0 left-0 h-24 bg-linear-to-b via-(--color-zenthar-graphite)/50 to-transparent" />
              <div className="h-1px via-brand-primary/30 absolute top-0 left-0 w-full bg-linear-to-r from-transparent to-transparent" />

              <div className="border-brand-sage/10 relative z-10 flex items-center justify-between border-b p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-primary/10 border-brand-primary/20 flex h-8 w-8 items-center justify-center rounded-xl border shadow-inner">
                    <Bell className="text-brand-primary h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-black tracking-[0.2em] text-(--color-zenthar-text-primary) uppercase">
                    System Alerts
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-brand-primary hover:bg-brand-primary/10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors hover:text-(--color-zenthar-text-secondary)"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="custom-scrollbar relative z-10 max-h-[32rem] overflow-auto">
                {notifications.length === 0 ? (
                  <div className="text-brand-sage flex flex-col items-center p-12 text-center opacity-50">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-zenthar-graphite)/50">
                      <Bell className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                      No active notifications
                    </p>
                  </div>
                ) : (
                  <div className="divide-brand-sage/5 divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`group relative flex gap-4 p-5 transition-all duration-300 hover:bg-(--color-zenthar-graphite)/50 ${!notification.is_read ? "bg-brand-primary/5" : ""}`}
                      >
                        {!notification.is_read && (
                          <div className="bg-brand-primary absolute top-0 bottom-0 left-0 w-1" />
                        )}
                        <div
                          className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl shadow-inner ${
                            notification.type === "WORKFLOW_FAILURE"
                              ? "bg-lab-laser/10 border-lab-laser/30 border"
                              : notification.type === "SAMPLE_COMPLETED"
                                ? "border border-emerald-500/30 bg-emerald-500/10"
                                : "border-brand-sage/10 border bg-(--color-zenthar-graphite)"
                          }`}
                        >
                          {getIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[11px] leading-relaxed tracking-tight ${!notification.is_read ? "font-black text-(--color-zenthar-text-primary)" : "font-bold text-(--color-zenthar-text-primary)/70"}`}
                          >
                            {notification.message}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-brand-sage flex items-center gap-2 font-mono text-[9px] font-bold tracking-tighter uppercase opacity-60">
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(notification.created_at)}
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="border-brand-sage/20 text-brand-primary hover:bg-brand-primary hover:border-brand-primary rounded-xl border bg-(--color-zenthar-graphite) px-4 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-sm transition-all hover:text-(--color-zenthar-void) active:scale-95"
                              >
                                Acknowledge
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-brand-sage/10 relative z-10 border-t bg-(--color-zenthar-graphite)/30 p-5 text-center">
                <button
                  className="text-brand-sage hover:border-brand-sage/20 rounded-xl border border-transparent px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all hover:bg-(--color-zenthar-graphite) hover:text-(--color-zenthar-text-primary) hover:shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Dismiss Panel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
