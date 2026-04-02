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
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { SettingsApi } from "../api/settings.api";
import { Modal } from "../../../ui/components/Modal";

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
      label: "Laboratory Configuration",
      icon: Beaker,
      table: "sample_types",
    },
    {
      id: "test_library",
      label: "Test & Method Library",
      icon: BookOpen,
      table: "test_methods",
    },
    {
      id: "instruments",
      label: "Instrument Registry",
      icon: Wrench,
      table: "instruments",
    },
    {
      id: "clients",
      label: "Client & Certificate",
      icon: ShieldCheck,
      table: "clients",
    },
    {
      id: "users",
      label: "User & Permissions",
      icon: Users,
      table: "employees",
    },
    {
      id: "plant",
      label: "Plant Structure",
      icon: Factory,
      table: "production_lines",
    },
    {
      id: "notifications",
      label: "Notification Rules",
      icon: Bell,
      table: "notification_rules",
    },
    {
      id: "inventory",
      label: "Inventory Management",
      icon: Database,
      table: "inventory",
    },
    {
      id: "preferences",
      label: "System Preferences",
      icon: SettingsIcon,
      table: "system_preferences",
    },
  ];

  const currentModule = modules.find((m) => m.id === activeModule);

  const fetchData = async () => {
    if (!currentModule) return;
    setLoading(true);
    try {
      const result = await SettingsApi.getSettings(currentModule.table);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeModule]);

  const handleAdd = async () => {
    if (!currentModule) return;
    try {
      await SettingsApi.addSetting(currentModule.table, newItem);
      setIsAdding(false);
      setNewItem({});
      fetchData();
    } catch (err) {
      console.error("Failed to add setting", err);
    }
  };

  const handleUpdate = async () => {
    if (!currentModule || !editingItem) return;
    const pk =
      currentModule.table === "system_preferences"
        ? "key"
        : currentModule.table === "employees"
          ? "employee_number"
          : "id";
    const id = editingItem[pk];

    try {
      await SettingsApi.updateSetting(currentModule.table, id, editingItem);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error("Failed to update setting", err);
    }
  };

  return (
    <div className="h-full flex gap-8 overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      {/* Settings Sidebar */}
      <div className="w-80 bg-white rounded-3xl border border-brand-sage/10 overflow-hidden flex flex-col shadow-sm relative group/sidebar">
        <div className="absolute right-0 top-0 w-64 h-64 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover/sidebar:scale-150" />
        
        <div className="p-8 border-b border-brand-sage/10 bg-white/50 backdrop-blur-md relative z-10">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary" />
          <h2 className="text-xs font-black text-brand-deep uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20 shadow-inner">
              <SettingsIcon className="w-4 h-4 text-brand-primary" />
            </div>
            System Control
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2 custom-scrollbar relative z-10">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id as SettingModule)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 text-left group relative overflow-hidden ${
                activeModule === m.id
                  ? "bg-brand-deep text-white shadow-xl shadow-brand-deep/20 scale-[1.02]"
                  : "text-brand-sage hover:bg-white hover:shadow-md hover:scale-[1.01] border border-transparent hover:border-brand-sage/20"
              }`}
            >
              {activeModule === m.id && (
                <motion.div layoutId="activeSettingTab" className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary rounded-l-2xl" />
              )}
              <div className={`p-2 rounded-xl transition-all duration-300 shadow-inner ${activeModule === m.id ? "bg-white/10 scale-110" : "bg-brand-mist group-hover:bg-brand-primary/10 group-hover:scale-105"}`}>
                <m.icon
                  className={`w-4 h-4 transition-colors ${activeModule === m.id ? "text-brand-primary" : "text-brand-sage group-hover:text-brand-primary"}`}
                />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeModule === m.id ? "text-white" : "group-hover:text-brand-deep"}`}>
                {m.label}
              </span>
              {activeModule === m.id && (
                <ChevronRight className="w-4 h-4 ml-auto text-brand-primary animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-white rounded-3xl border border-brand-sage/10 overflow-hidden flex flex-col shadow-sm relative group/content">
        <div className="absolute right-0 top-0 w-96 h-96 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover/content:scale-150" />
        <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover/content:opacity-100 transform scale-x-0 group-hover/content:scale-x-100 transition-all duration-700 origin-left" />

        <div className="p-8 border-b border-brand-sage/10 flex items-center justify-between bg-white/50 backdrop-blur-md relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-inner">
                {currentModule && <currentModule.icon className="w-6 h-6 text-brand-primary" />}
              </div>
              <h2 className="text-3xl font-light text-brand-deep tracking-tight">
                {currentModule?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-16">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">
                Configuration interface for system-wide{" "}
                {currentModule?.label.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 px-8 py-4 bg-brand-deep text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all duration-300 shadow-xl shadow-brand-deep/20 hover:shadow-brand-primary/30 active:scale-95 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 translate-x--100% group-hover:translate-x-100% transition-transform duration-700" />
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Provision Entry
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative z-10">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
                Synchronizing Registry...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              <Modal
                isOpen={isAdding}
                onClose={() => setIsAdding(false)}
                title={`Provision New ${currentModule?.label}`}
              >
                <div className="space-y-8 p-2">
                  <div className="grid grid-cols-1 gap-6">
                    {/* Fallback fields if data is empty */}
                    {(data.length > 0
                      ? Object.keys(data[0])
                      : activeModule === "inventory"
                        ? [
                            "name",
                            "type",
                            "quantity",
                            "unit",
                            "expiry_date",
                            "min_stock",
                          ]
                        : ["name", "description"]
                    )
                      .filter((k) => k !== "id")
                      .map((key) => (
                        <div key={key} className="space-y-2">
                          <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                            {key.replace("_", " ")}
                          </label>
                          <input
                            type={
                              key.includes("date")
                                ? "date"
                                : key.includes("quantity") ||
                                    key.includes("stock") ||
                                    key.includes("value")
                                  ? "number"
                                  : "text"
                            }
                            step={
                              key.includes("quantity") ||
                              key.includes("stock") ||
                              key.includes("value")
                                ? "any"
                                : undefined
                            }
                            className="w-full bg-brand-mist/30 border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-xs font-bold text-brand-deep focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 outline-none transition-all placeholder:text-brand-sage/40"
                            placeholder={`Enter ${key.replace("_", " ")}...`}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parsedVal =
                                key.includes("quantity") ||
                                key.includes("stock") ||
                                key.includes("value")
                                  ? val === ""
                                    ? 0
                                    : parseFloat(val)
                                  : val;
                              setNewItem({ ...newItem, [key]: parsedVal });
                            }}
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setIsAdding(false)}
                      className="flex-1 px-6 py-4 text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] hover:bg-brand-mist rounded-2xl transition-all border border-brand-sage/10"
                    >
                      Abort
                    </button>
                    <button
                      onClick={handleAdd}
                      className="flex-2 flex items-center justify-center gap-3 px-6 py-4 bg-brand-deep text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-deep/90 transition-all shadow-2xl shadow-brand-deep/30 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      Commit Entry
                    </button>
                  </div>
                </div>
              </Modal>

              <Modal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                title={`Modify ${currentModule?.label}`}
              >
                <div className="space-y-8 p-2">
                  <div className="grid grid-cols-1 gap-6">
                    {editingItem &&
                      Object.keys(editingItem)
                        .filter(
                          (k) =>
                            k !== "id" &&
                            k !== "key" &&
                            k !== "employee_number",
                        )
                        .map((key) => (
                          <div key={key} className="space-y-2">
                            <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                              {key.replace("_", " ")}
                            </label>
                            <input
                              type={
                                key.includes("date")
                                  ? "date"
                                  : typeof editingItem[key] === "number"
                                    ? "number"
                                    : "text"
                              }
                              step={
                                typeof editingItem[key] === "number"
                                  ? "any"
                                  : undefined
                              }
                              value={editingItem[key] || ""}
                              className="w-full bg-brand-mist/30 border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-xs font-bold text-brand-deep focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 outline-none transition-all"
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsedVal =
                                  key.includes("quantity") ||
                                  key.includes("stock") ||
                                  key.includes("value") ||
                                  typeof editingItem[key] === "number"
                                    ? val === ""
                                      ? 0
                                      : parseFloat(val)
                                    : val;
                                setEditingItem({
                                  ...editingItem,
                                  [key]: parsedVal,
                                });
                              }}
                            />
                          </div>
                        ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setEditingItem(null)}
                      className="flex-1 px-6 py-4 text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] hover:bg-brand-mist rounded-2xl transition-all border border-brand-sage/10"
                    >
                      Abort
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="flex-2 flex items-center justify-center gap-3 px-6 py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary/90 transition-all shadow-2xl shadow-brand-primary/30 active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      Update Registry
                    </button>
                  </div>
                </div>
              </Modal>

              <div className="grid grid-cols-1 gap-4">
                {data.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="group relative overflow-hidden bg-white border border-brand-sage/10 rounded-2xl hover:border-brand-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-transparent group-hover:bg-brand-primary transition-colors duration-300" />
                    <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />

                    <div className="flex items-center gap-6 w-full px-6 py-4 relative z-10">
                      <div className="w-12 h-12 bg-brand-mist/50 rounded-xl flex items-center justify-center text-brand-primary font-mono font-black text-xs group-hover:bg-brand-primary/10 group-hover:scale-110 transition-all duration-300 shadow-inner">
                        {(idx + 1).toString().padStart(2, "0")}
                      </div>

                      <div className="flex-1 grid grid-cols-12 gap-6 items-center">
                        <div className="col-span-4">
                          <div className="text-sm font-black text-brand-deep uppercase tracking-wider truncate group-hover:text-brand-primary transition-colors">
                            {item.name ||
                              item.key ||
                              item.employee_number ||
                              `Registry Entry #${item.id}`}
                          </div>
                          <div className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-widest mt-1 opacity-60 truncate">
                            ID: {item.id || "N/A"}
                          </div>
                        </div>

                        <div className="col-span-6 flex items-center gap-8">
                          {activeModule === "inventory" ? (
                            <>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-brand-sage uppercase tracking-[0.2em]">Type</span>
                                <span className="font-mono text-xs font-medium text-brand-deep">
                                  {item.type}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-brand-sage uppercase tracking-[0.2em]">Stock</span>
                                <span className="font-mono text-xs font-medium text-brand-deep">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-brand-sage uppercase tracking-[0.2em]">Expiry</span>
                                <span
                                  className={`font-mono text-xs font-medium ${new Date(item.expiry_date) < new Date() ? "text-rose-500" : "text-brand-deep"}`}
                                >
                                  {item.expiry_date}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col w-full gap-1">
                              <span className="text-[9px] font-bold text-brand-sage uppercase tracking-[0.2em]">Details</span>
                              <span className="font-mono text-xs font-medium text-brand-deep truncate opacity-80">
                                {item.description ||
                                  item.value ||
                                  item.role ||
                                  item.symbol ||
                                  "NO METADATA DEFINED"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-3 bg-brand-mist/50 text-brand-sage hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all duration-300 active:scale-95 shadow-sm"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {data.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center p-20 bg-brand-mist/20 rounded-3xl border border-dashed border-brand-sage/20">
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                      <Database className="w-8 h-8 text-brand-sage/40" />
                    </div>
                    <p className="text-xs font-black text-brand-sage uppercase tracking-[0.2em]">
                      No registry entries found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
