import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { NotificationApi } from "../api/notification.api";
import { Notification } from "../../../core/types";
import { useNotifications } from "../hooks/useNotifications"
import { motion, AnimatePresence } from "@/src/lib/motion";

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "SAMPLE_COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "WORKFLOW_FAILURE":
        return <XCircle className="w-4 h-4 text-lab-laser" />;
      case "OVERDUE_TEST":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-brand-primary" />;
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
        className={`relative p-3 rounded-2xl transition-all duration-300 group border overflow-hidden ${
          unreadCount > 0
            ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-xl shadow-brand-primary/20"
            : "bg-white/80 backdrop-blur-sm border-brand-sage/20 text-brand-sage hover:border-brand-primary/30 hover:text-brand-primary hover:shadow-lg hover:shadow-brand-primary/10"
        }`}
      >
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-linear-to-tr from-brand-primary/0 via-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <Bell className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-lab-laser text-white text-[10px] font-black flex items-center justify-center rounded-xl border-2 border-white shadow-lg z-20">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 mt-4 w-400px bg-white/95 backdrop-blur-2xl border border-brand-sage/20 rounded-2rem shadow-2xl z-50 overflow-hidden"
            >
              {/* Decorative Header Background */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-brand-primary/10 via-brand-mist/50 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent" />

              <div className="p-6 border-b border-brand-sage/10 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
                    <Bell className="w-4 h-4 text-brand-primary" />
                  </div>
                  <h3 className="text-xs font-black text-brand-deep uppercase tracking-[0.2em]">
                    System Alerts
                  </h3>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-brand-primary hover:text-brand-deep uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-primary/10"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-32rem overflow-auto custom-scrollbar relative z-10">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-brand-sage opacity-50 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-mist/50 flex items-center justify-center mb-4">
                      <Bell className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                      No active notifications
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-sage/5">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-5 transition-all duration-300 hover:bg-brand-mist/50 flex gap-4 group relative ${!notification.is_read ? "bg-brand-primary/5" : ""}`}
                      >
                        {!notification.is_read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                        )}
                        <div
                          className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                            notification.type === "WORKFLOW_FAILURE"
                              ? "bg-rose-50 border border-rose-100"
                              : notification.type === "SAMPLE_COMPLETED"
                                ? "bg-emerald-50 border border-emerald-100"
                                : "bg-brand-mist border border-brand-sage/10"
                          }`}
                        >
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-[11px] leading-relaxed tracking-tight ${!notification.is_read ? "text-brand-deep font-black" : "text-brand-sage font-bold"}`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-brand-sage uppercase tracking-tighter opacity-60">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(notification.created_at)}
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() =>
                                  markAsRead(notification.id)
                                }
                                className="px-4 py-1.5 rounded-xl bg-white border border-brand-sage/20 text-brand-primary text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all shadow-sm active:scale-95"
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

              <div className="p-5 border-t border-brand-sage/10 bg-brand-mist/30 text-center relative z-10">
                <button
                  className="text-[10px] font-black text-brand-sage hover:text-brand-deep uppercase tracking-[0.2em] transition-all px-4 py-2 rounded-xl hover:bg-white border border-transparent hover:border-brand-sage/20 hover:shadow-sm"
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
