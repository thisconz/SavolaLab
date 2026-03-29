import React, { memo, useState } from "react";
import { Activity, Database, X, LogOut, RefreshCw } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { QuickSwitch } from "../../capsules/auth";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../ui/components/Logo";

/**
 * Header: Stable layout component.
 */
export const Header: React.FC = memo(() => {
  const { activeTab } = useAppStore();
  const { currentUser, logout } = useAuthStore();
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <header className="h-20 border-b border-brand-sage/10 flex items-center justify-between px-10 bg-white/90 backdrop-blur-xl relative z-50 overflow-hidden">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 instrument-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-1px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent" />

      <div className="flex items-center gap-10 relative z-10">
        <LogoRoot size="md" variant="dark">
          <LogoText />
        </LogoRoot>
        <div className="h-8 w-1px bg-brand-sage/10" />
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1 opacity-60">
              <Activity className="w-3 h-3 text-brand-primary animate-pulse" />
              System Status
            </div>
            <div className="text-[11px] font-mono font-black text-brand-primary uppercase tracking-widest">
              Optimal Operational State
            </div>
          </div>
          <div className="h-8 w-1px bg-brand-sage/10 mx-2" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1 opacity-60">
              <Database className="w-3 h-3 text-brand-sage" />
              Sync Protocol
            </div>
            <div className="text-[11px] font-mono font-black text-brand-sage uppercase tracking-widest">
              0 Pending Segments
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10 relative z-10">
        <div className="flex items-center gap-8">
          <NotificationCenter />

          <div className="h-10 w-1px bg-brand-sage/10" />

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center justify-end gap-3 mb-1">
                <div className="text-xs font-black text-brand-deep uppercase tracking-wider">
                  {currentUser.name}
                </div>
                <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black rounded-lg uppercase tracking-widest border border-brand-primary/20 shadow-sm">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-tighter opacity-60">
                {currentUser.dept} • QC-SEC-01
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSwitchOpen(true)}
                className="w-12 h-12 rounded-2xl bg-brand-mist border-2 border-brand-sage/10 flex items-center justify-center hover:border-brand-primary/40 transition-all group overflow-hidden relative shadow-inner"
                title="Quick Switch Account"
              >
                <span className="text-xs font-black text-brand-deep group-hover:opacity-0 transition-opacity">
                  {currentUser.initials}
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-brand-primary/10 backdrop-blur-sm">
                  <RefreshCw className="w-5 h-5 text-brand-primary" />
                </div>
              </button>

              <button
                onClick={logout}
                className="p-3 text-brand-sage hover:text-lab-laser hover:bg-lab-laser/5 rounded-2xl transition-all border border-transparent hover:border-lab-laser/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuickSwitch
        isOpen={isSwitchOpen}
        onClose={() => setIsSwitchOpen(false)}
      />
    </header>
  );
});

Header.displayName = "Header";
