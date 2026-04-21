import React, { memo, type FC, type ReactNode, Component, type ErrorInfo, type ElementType } from "react";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";
 
type StatusVariant = "success" | "warning" | "error" | "info" | "primary" | "muted";
 
interface StatusPillProps {
  label:     string;
  variant?:  StatusVariant;
  dot?:      boolean;
  className?:string;
}
 
const PILL_STYLES: Record<StatusVariant, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  warning: "bg-amber-50   border-amber-200   text-amber-700",
  error:   "bg-red-50     border-red-200     text-red-700",
  info:    "bg-sky-50     border-sky-200     text-sky-700",
  primary: "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
  muted:   "bg-slate-50   border-slate-200   text-slate-500",
};
 
const DOT_COLORS: Record<StatusVariant, string> = {
  success: "bg-emerald-500", warning: "bg-amber-500", error: "bg-red-500",
  info:    "bg-sky-500",     primary: "bg-brand-primary", muted: "bg-slate-400",
};
 
export const StatusPill: FC<StatusPillProps> = memo(({ label, variant = "muted", dot = true, className }) => (
  <span className={clsx(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider whitespace-nowrap",
    PILL_STYLES[variant], className,
  )}>
    {dot && <span className={clsx("w-1.5 h-1.5 rounded-full", DOT_COLORS[variant])} />}
    {label}
  </span>
));
StatusPill.displayName = "StatusPill";