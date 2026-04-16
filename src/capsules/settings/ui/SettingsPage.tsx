import React, { useState, useEffect } from "react";
import {
  Beaker,
  BookOpen,
  Wrench,
  Users,
  Factory,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Save,
  Edit2,
  ChevronRight,
  Database,
  ShieldCheck,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { SettingsApi } from "../api/settings.api";
import { Modal } from "../../../ui/components/Modal";
import { toast } from "sonner";

type SettingModule =
  | "lab_config"
  | "test_library"
  | "instruments"
  | "clients"
  | "users"
  | "plant"
  | "notifications"
  | "inventory"
  | "preferences";

export const SettingsPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<SettingModule>("lab_config");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({});

  const modules = [
    {
      id: "lab_config",
      label: "Laboratory",
      icon: Beaker,
      table: "sample_types",
    },
    {
      id: "test_library",
      label: "Methods",
      icon: BookOpen,
      table: "test_methods",
    },
    {
      id: "instruments",
      label: "Instruments",
      icon: Wrench,
      table: "instruments",
    },
    {
      id: "clients",
      label: "Certificates",
      icon: ShieldCheck,
      table: "clients",
    },
    { id: "users", label: "Permissions", icon: Users, table: "employees" },
    {
      id: "plant",
      label: "Production",
      icon: Factory,
      table: "production_lines",
    },
    {
      id: "notifications",
      label: "Alert Rules",
      icon: Bell,
      table: "notification_rules",
    },
    { id: "inventory", label: "Inventory", icon: Database, table: "inventory" },
    {
      id: "preferences",
      label: "Preferences",
      icon: SettingsIcon,
      table: "system_preferences",
    },
  ];

  const currentModule = modules.find((m) => m.id === activeModule);

  const fetchData = async () => {
    if (!currentModule) return;
    setLoading(true);
    try {
      const result = await SettingsApi.getSettings(currentModule.table as any);
      setData(result);
    } catch (err) {
      console.error("Fetch failed", err);
      toast.error("Failed to fetch settings data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentModule || !editingItem) return;
    try {
      const id = editingItem.id || editingItem.employee_number || editingItem.key;
      await SettingsApi.updateSetting(currentModule.table as any, id, editingItem);
      toast.success("Setting updated successfully");
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to save setting");
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeModule]);

  return (
    <div className="h-full flex gap-6 p-4 bg-(--color-zenthar-graphite)/30">
      {/* 1. NAVIGATION SIDEBAR */}
      <aside className="w-72 flex flex-col gap-4">
        <div className="bg-(--color-zenthar-carbon) rounded-4xl border border-brand-sage/10 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl">
              <SettingsIcon className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-tighter">
                Control Center
              </h1>
              <p className="text-[10px] text-brand-sage font-bold uppercase opacity-50">
                Zenthar Registry
              </p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {modules.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id as SettingModule)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  activeModule === m.id
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]"
                    : "text-brand-sage hover:bg-(--color-zenthar-void) hover:text-white"
                }`}
              >
                <m.icon
                  className={`w-4 h-4 ${activeModule === m.id ? "text-white" : "opacity-70"}`}
                />
                <span className="text-xs font-bold tracking-tight flex-1 text-left">
                  {m.label}
                </span>
                {activeModule === m.id && (
                  <motion.div
                    layoutId="dot"
                    className="w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 bg-(--color-zenthar-carbon) rounded-[2.5rem] border border-brand-sage/10 shadow-sm flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <header className="px-10 py-8 border-b border-brand-sage/5 flex items-center justify-between bg-(--color-zenthar-carbon)/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-(--color-zenthar-void) rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
              {currentModule && <currentModule.icon className="w-7 h-7" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {currentModule?.label} Registry
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                Live Database Connection
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAdding(true)}
            className="group flex items-center gap-3 pl-4 pr-6 py-3 bg-brand-primary text-white rounded-2xl text-xs font-bold hover:bg-brand-primary/80 transition-all shadow-xl shadow-brand-primary/10"
          >
            <div className="p-1.5 bg-white/10 rounded-lg group-hover:rotate-90 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            Add New Entry
          </button>
        </header>

        {/* DATA LIST */}
        <div className="flex-1 overflow-auto p-10 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center animate-pulse">
              <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Syncing Laboratory Data...
              </p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-3">
              {data.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={item.id || idx}
                  className="group bg-(--color-zenthar-void) border border-brand-sage/10 rounded-2xl p-4 flex items-center gap-6 hover:shadow-xl hover:shadow-brand-primary/5 hover:border-brand-primary/20 transition-all duration-300"
                >
                  {/* Index / Status */}
                  <div className="w-10 h-10 rounded-xl bg-(--color-zenthar-carbon) flex items-center justify-center text-[10px] font-black text-brand-sage group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                    {(idx + 1).toString().padStart(2, "0")}
                  </div>

                  {/* Main Identity */}
                  <div className="flex-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-brand-primary transition-colors truncate">
                      {item.name ||
                        item.key ||
                        item.employee_number ||
                        "Unnamed Entry"}
                    </h4>
                    <p className="text-[9px] font-mono text-brand-sage mt-0.5">
                      UID: {item.id || "TEMP_HASH"}
                    </p>
                  </div>

                  {/* Dynamic Meta Columns */}
                  <div className="flex-3 grid grid-cols-3 gap-4 border-l border-brand-sage/5 pl-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
                        Descriptor
                      </span>
                      <span className="text-[11px] font-bold text-white truncate">
                        {item.type || item.role || "Standard"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
                        Metric / Status
                      </span>
                      <span className="text-[11px] font-bold text-white">
                        {item.quantity
                          ? `${item.quantity} ${item.unit}`
                          : "Active"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
                        Last Modified
                      </span>
                      <span className="text-[11px] font-bold text-white">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString()
                          : "Today"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pr-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2.5 rounded-xl bg-(--color-zenthar-carbon) text-brand-sage hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {data.length === 0 && (
                <div className="py-20 flex flex-col items-center border-2 border-dashed border-brand-sage/10 rounded-4xl bg-(--color-zenthar-void)">
                  <Database className="w-12 h-12 text-brand-sage/20 mb-4" />
                  <h3 className="text-xs font-black text-brand-sage uppercase tracking-widest">
                    No entries found for this module
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Edit ${currentModule?.label} Entry`}
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-sage">
            Editing entry: {editingItem?.name || editingItem?.key || editingItem?.employee_number || "Unknown"}
          </p>
          <div className="bg-(--color-zenthar-void) p-4 rounded-xl border border-brand-sage/10">
            <pre className="text-[10px] font-mono text-white overflow-auto max-h-48">
              {JSON.stringify(editingItem, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEditingItem(null)}
              className="px-4 py-2 text-sm font-bold text-brand-sage hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-primary/80 transition-colors shadow-lg shadow-brand-primary/20"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
