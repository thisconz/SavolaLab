import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Beaker, BookOpen, Wrench, Users, Factory, Bell,
  Settings as SettingsIcon, Plus, Edit2, ChevronRight,
  Database, ShieldCheck, Search, X, Save, ToggleLeft,
  ToggleRight, AlertCircle, Package, Trash2, Check,
  RefreshCw, ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { SettingsApi }             from "../api/settings.api";
import { Modal }                   from "../../../shared/components/Modal";
import { toast }                   from "sonner";
import clsx                        from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Field + Column definitions (unchanged from original — keeping compact)
// ─────────────────────────────────────────────

type FieldType = "text" | "textarea" | "number" | "select" | "date" | "toggle" | "email" | "tel" | "readonly";

interface FieldDef {
  key:           string;
  label:         string;
  type:          FieldType;
  options?:      { value: string; label: string }[];
  required?:     boolean;
  placeholder?:  string;
  readonlyOnEdit?: boolean;
  hint?:         string;
}

interface ColumnDef {
  key:     string;
  label:   string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface TableConfig {
  fields:      FieldDef[];
  columns:     ColumnDef[];
  pk:          string;
  displayName: string;
  deletable?:  boolean;
}

const ROLE_OPTIONS = [
  { value: "ADMIN",             label: "Admin"             },
  { value: "CHEMIST",           label: "Chemist"           },
  { value: "SHIFT_CHEMIST",     label: "Shift Chemist"     },
  { value: "ASSISTING_MANAGER", label: "Assisting Manager" },
  { value: "HEAD_MANAGER",      label: "Head Manager"      },
  { value: "ENGINEER",          label: "Engineer"          },
  { value: "DISPATCH",          label: "Dispatch"          },
];

const STATUS_BADGE = (val: any) => {
  const active = val === "ACTIVE" || val === 1 || val === true;
  return (
    <span className={clsx("px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
      active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500")}>
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const TABLE_CONFIG: Record<string, TableConfig> = {
  sample_types: {
    pk: "id", displayName: "Sample Types", deletable: true,
    fields: [
      { key: "name",        label: "Type Name",    type: "text",     required: true  },
      { key: "description", label: "Description",  type: "textarea"                  },
    ],
    columns: [
      { key: "id",          label: "ID",          render: (v) => <span className="font-mono text-[10px] text-brand-sage">#{v}</span> },
      { key: "name",        label: "Name",        render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "description", label: "Description", render: (v) => <span className="text-xs text-zenthar-text-secondary truncate block max-w-[240px]">{v || "—"}</span> },
    ],
  },
  test_methods: {
    pk: "id", displayName: "Test Methods",
    fields: [
      { key: "name",      label: "Method Name", type: "text",   required: true },
      { key: "sop_steps", label: "SOP Steps",   type: "textarea" },
      { key: "formula",   label: "Formula",     type: "text",   placeholder: "(A × 1000) / (b × c)" },
      { key: "min_range", label: "Min Range",   type: "number"  },
      { key: "max_range", label: "Max Range",   type: "number"  },
      { key: "version",   label: "Version",     type: "number"  },
      { key: "is_active", label: "Active",      type: "toggle"  },
    ],
    columns: [
      { key: "name",      label: "Method",  render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "formula",   label: "Formula", render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
      { key: "min_range", label: "Range",   render: (v, r) => <span className="text-xs text-zenthar-text-secondary">{v ?? "—"} – {r.max_range ?? "—"}</span> },
      { key: "is_active", label: "Status",  render: STATUS_BADGE },
    ],
  },
  instruments: {
    pk: "id", displayName: "Instruments",
    fields: [
      { key: "name",             label: "Name",             type: "text",   required: true },
      { key: "model",            label: "Model",            type: "text"   },
      { key: "serial_number",    label: "Serial Number",    type: "text"   },
      { key: "status",           label: "Status",           type: "select",
        options: [{ value: "ACTIVE", label: "Active" }, { value: "CALIBRATION_DUE", label: "Calibration Due" }, { value: "INACTIVE", label: "Inactive" }] },
      { key: "last_calibration", label: "Last Calibration", type: "date"   },
      { key: "next_calibration", label: "Next Calibration", type: "date"   },
    ],
    columns: [
      { key: "name",          label: "Name",    render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "model",         label: "Model",   render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      { key: "serial_number", label: "Serial",  render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
      { key: "status",        label: "Status",  render: (v) => {
          const map: Record<string, string> = { ACTIVE: "text-emerald-700 bg-emerald-50 border-emerald-200", CALIBRATION_DUE: "text-amber-700 bg-amber-50 border-amber-200", INACTIVE: "text-slate-500 bg-slate-50 border-slate-200" };
          return <span className={clsx("px-2 py-0.5 rounded border text-[9px] font-black uppercase", map[v] || map.INACTIVE)}>{v}</span>;
        }
      },
      { key: "next_calibration", label: "Next Cal.", render: (v) => {
          if (!v) return <span className="text-xs text-brand-sage/60">—</span>;
          const overdue = new Date(v) < new Date();
          return <span className={clsx("text-[10px] font-mono", overdue ? "text-red-600 font-bold" : "text-zenthar-text-secondary")}>{new Date(v).toLocaleDateString()}</span>;
        }
      },
    ],
  },
  clients: {
    pk: "id", displayName: "Clients", deletable: true,
    fields: [
      { key: "name",    label: "Client Name", type: "text",  required: true },
      { key: "email",   label: "Email",        type: "email" },
      { key: "phone",   label: "Phone",        type: "tel"   },
      { key: "address", label: "Address",      type: "textarea" },
    ],
    columns: [
      { key: "name",    label: "Client", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "email",   label: "Email",  render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      { key: "phone",   label: "Phone",  render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
    ],
  },
  employees: {
    pk: "employee_number", displayName: "Employees",
    fields: [
      { key: "employee_number", label: "Employee #",   type: "text",   required: true, readonlyOnEdit: true },
      { key: "name",            label: "Full Name",    type: "text",   required: true },
      { key: "national_id",     label: "National ID",  type: "text",   required: true },
      { key: "dob",             label: "Date of Birth",type: "date",   required: true },
      { key: "role",            label: "Role",         type: "select", required: true, options: ROLE_OPTIONS },
      { key: "department",      label: "Department",   type: "text"   },
      { key: "email",           label: "Email",        type: "email"  },
      { key: "status",          label: "Status",       type: "select",
        options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }] },
    ],
    columns: [
      { key: "employee_number", label: "Emp. #", render: (v) => <span className="font-mono text-[10px] font-bold text-brand-primary">{v}</span> },
      { key: "name",            label: "Name",   render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "role",            label: "Role",   render: (v) => <span className="text-xs font-bold text-zenthar-text-secondary uppercase">{v}</span> },
      { key: "status",          label: "Status", render: STATUS_BADGE },
    ],
  },
  production_lines: {
    pk: "id", displayName: "Production Lines",
    fields: [
      { key: "name",     label: "Line Name", type: "text", required: true },
      { key: "plant_id", label: "Plant ID",  type: "text" },
    ],
    columns: [
      { key: "id",       label: "ID",        render: (v) => <span className="font-mono text-[10px] text-brand-sage">#{v}</span> },
      { key: "name",     label: "Line",      render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "plant_id", label: "Plant",     render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
    ],
  },
  inventory: {
    pk: "id", displayName: "Inventory", deletable: true,
    fields: [
      { key: "name",        label: "Item Name",       type: "text",   required: true },
      { key: "type",        label: "Type",            type: "text"   },
      { key: "quantity",    label: "Quantity",        type: "number" },
      { key: "unit",        label: "Unit",            type: "text",   placeholder: "mL, g, pcs" },
      { key: "min_stock",   label: "Min Stock",       type: "number", hint: "Alert threshold" },
      { key: "expiry_date", label: "Expiry Date",     type: "date"   },
    ],
    columns: [
      { key: "name",     label: "Item",      render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "quantity", label: "Qty / Unit",render: (v, r) => {
          const low = v != null && r.min_stock != null && v <= r.min_stock;
          return <span className={clsx("font-mono text-xs font-bold", low ? "text-red-600" : "text-zenthar-text-primary")}>{v ?? "—"} {r.unit || ""}{low ? " ⚠" : ""}</span>;
        }
      },
      { key: "expiry_date", label: "Expiry", render: (v) => {
          if (!v) return <span className="text-xs text-brand-sage/60">—</span>;
          const expired = new Date(v) < new Date();
          return <span className={clsx("text-[10px] font-mono", expired ? "text-red-600 font-bold" : "text-zenthar-text-secondary")}>{new Date(v).toLocaleDateString()}</span>;
        }
      },
    ],
  },
  notification_rules: {
    pk: "id", displayName: "Alert Rules",
    fields: [
      { key: "name",      label: "Rule Name",  type: "text",    required: true },
      { key: "condition", label: "Condition",  type: "textarea", hint: "Trigger expression" },
      { key: "action",    label: "Action",     type: "select",
        options: [
          { value: "OVERDUE_TEST",     label: "Overdue Test"      },
          { value: "WORKFLOW_FAILURE", label: "Workflow Failure"  },
          { value: "SAMPLE_COMPLETED", label: "Sample Completed"  },
        ]
      },
      { key: "is_active", label: "Active",     type: "toggle" },
    ],
    columns: [
      { key: "name",      label: "Rule",   render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "action",    label: "Action", render: (v) => <span className="text-xs font-bold text-brand-primary uppercase">{v?.replace(/_/g, " ") || "—"}</span> },
      { key: "is_active", label: "Active", render: STATUS_BADGE },
    ],
  },
  system_preferences: {
    pk: "key", displayName: "System Preferences",
    fields: [
      { key: "key",   label: "Key",   type: "text", required: true, readonlyOnEdit: true },
      { key: "value", label: "Value", type: "text", required: true },
    ],
    columns: [
      { key: "key",   label: "Key",   render: (v) => <span className="font-mono text-sm font-bold text-brand-primary">{v}</span> },
      { key: "value", label: "Value", render: (v) => <span className="font-mono text-sm text-zenthar-text-secondary">{v}</span> },
    ],
  },
};

type ModuleId = keyof typeof TABLE_CONFIG;

const MODULES: { id: ModuleId; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "sample_types",       label: "Sample Types",    icon: Beaker,       hint: "Registered classifications" },
  { id: "test_methods",       label: "Test Methods",    icon: BookOpen,     hint: "Analytical procedure library" },
  { id: "instruments",        label: "Instruments",     icon: Wrench,       hint: "Calibration tracker" },
  { id: "clients",            label: "Clients",         icon: ShieldCheck,  hint: "Certificate recipients" },
  { id: "employees",          label: "Employees",       icon: Users,        hint: "Staff directory" },
  { id: "production_lines",   label: "Prod. Lines",     icon: Factory,      hint: "Plant line registry" },
  { id: "inventory",          label: "Inventory",       icon: Package,      hint: "Reagents and materials" },
  { id: "notification_rules", label: "Alert Rules",     icon: Bell,         hint: "Notification logic" },
  { id: "system_preferences", label: "Preferences",     icon: SettingsIcon, hint: "Global settings" },
];

// ─────────────────────────────────────────────
// Field renderer
// ─────────────────────────────────────────────

const inputBase = "w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-zenthar-text-primary transition-all placeholder:text-brand-sage/40";

const FieldRenderer: React.FC<{
  field:     FieldDef;
  value:     any;
  onChange:  (val: any) => void;
  isEditing: boolean;
}> = ({ field, value, onChange, isEditing }) => {
  const isReadonly = field.type === "readonly" || (isEditing && field.readonlyOnEdit);
  if (isReadonly) return <div className={clsx(inputBase, "bg-zenthar-graphite/30 cursor-not-allowed text-brand-sage/80")}>{value || "—"}</div>;
  if (field.type === "toggle") {
    const checked = value === 1 || value === true || value === "1";
    return (
      <button type="button" onClick={() => onChange(checked ? 0 : 1)}
        className={clsx("flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
          checked ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary" : "bg-zenthar-void border-zenthar-steel text-brand-sage")}>
        {checked ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        <span className="text-sm font-bold uppercase tracking-wider">{checked ? "Enabled" : "Disabled"}</span>
      </button>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputBase} required={field.required}>
        <option value="">Select {field.label}...</option>
        {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (field.type === "textarea") {
    return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} required={field.required} rows={3} className={clsx(inputBase, "resize-none")} />;
  }
  return (
    <input type={field.type === "number" ? "text" : field.type}
      value={value ?? ""}
      onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      placeholder={field.placeholder} required={field.required} className={inputBase} />
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>("sample_types");
  const [data,         setData]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [isFormOpen,   setIsFormOpen]   = useState(false);
  const [editingItem,  setEditingItem]  = useState<any>(null);
  const [formData,     setFormData]     = useState<Record<string, any>>({});
  const [deleteItem,   setDeleteItem]   = useState<any>(null);
  const [sidebarOpen,  setSidebarOpen]  = useState(false); // mobile sidebar

  const config     = TABLE_CONFIG[activeModule];
  const moduleInfo = MODULES.find((m) => m.id === activeModule)!;
  const isEditing  = editingItem !== null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await SettingsApi.getSettings(activeModule as any);
      setData(result || []);
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [activeModule]);

  useEffect(() => { fetchData(); setSearch(""); }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) => Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [data, search]);

  const openAdd = () => {
    const defaults: Record<string, any> = {};
    config.fields.forEach((f) => {
      defaults[f.key] = f.type === "toggle" ? 1 : f.type === "number" ? "" : "";
    });
    setEditingItem(null);
    setFormData(defaults);
    setIsFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const values: Record<string, any> = {};
    config.fields.forEach((f) => { values[f.key] = item[f.key] ?? ""; });
    setFormData(values);
    setIsFormOpen(true);
  };

  const closeForm = () => { setIsFormOpen(false); setEditingItem(null); setFormData({}); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await SettingsApi.updateSetting(activeModule as any, editingItem[config.pk], formData);
        toast.success("Entry updated");
      } else {
        await SettingsApi.addSetting(activeModule as any, formData);
        toast.success("Entry created");
      }
      closeForm();
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    try {
      await SettingsApi.deleteSetting(activeModule as any, item[config.pk]);
      toast.success("Entry deleted");
      setDeleteItem(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl gap-6">

      {/* ── MOBILE SIDEBAR TOGGLE ── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-50 lg:hidden w-12 h-12 bg-brand-primary text-white rounded-2xl shadow-xl shadow-brand-primary/30 flex items-center justify-center"
      >
        {sidebarOpen ? <X size={18} /> : <SettingsIcon size={18} />}
      </button>

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {(sidebarOpen) && (
          <aside className={clsx(
            "flex-col gap-3 shrink-0",
            // Desktop: always visible
            "hidden lg:flex",
            // Mobile: fixed overlay
            sidebarOpen && "flex fixed left-4 top-20 bottom-20 z-40 bg-white/90 backdrop-blur-xl rounded-3xl p-4 w-56 shadow-2xl lg:relative lg:top-auto lg:bottom-auto lg:left-auto lg:shadow-none lg:p-0 lg:w-auto"
          )}>
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm p-4 flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar min-w-[200px]">
              <div className="flex items-center gap-3 px-3 pb-4 border-b border-zenthar-steel mb-2">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <SettingsIcon className="w-4 h-4 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-[11px] font-black text-zenthar-text-primary uppercase tracking-wider">Control Panel</h2>
                  <p className="text-[9px] text-brand-sage font-mono">System Registry</p>
                </div>
              </div>
              {MODULES.map((m) => (
                <button key={m.id} onClick={() => { setActiveModule(m.id); setSidebarOpen(false); }}
                  className={clsx("w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left group",
                    activeModule === m.id
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                      : "text-brand-sage hover:bg-zenthar-graphite/40 hover:text-zenthar-text-primary")}>
                  <m.icon className={clsx("w-4 h-4 shrink-0", activeModule === m.id ? "text-white" : "opacity-70")} />
                  <span className="text-[11px] font-bold tracking-tight leading-none">{m.label}</span>
                  {activeModule === m.id && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
                </button>
              ))}
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm px-6 py-5 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
              <moduleInfo.icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zenthar-text-primary tracking-tight">{moduleInfo.label}</h2>
              <p className="text-[11px] text-brand-sage">{moduleInfo.hint}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/50" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-44 transition-all" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sage hover:text-zenthar-text-primary">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={fetchData} className="p-2.5 border border-zenthar-steel rounded-xl hover:bg-zenthar-void transition-all" title="Refresh">
              <RefreshCw className={clsx("w-4 h-4 text-brand-sage", loading && "animate-spin")} />
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-brand-primary/90 shadow-md shadow-brand-primary/20 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="p-6 bg-zenthar-graphite/30 rounded-full border border-zenthar-steel">
                <moduleInfo.icon className="w-10 h-10 text-brand-sage/30" />
              </div>
              <p className="text-sm font-black text-zenthar-text-primary uppercase tracking-widest">
                {search ? "No results match your search" : `No ${moduleInfo.label} yet`}
              </p>
              {!search && <button onClick={openAdd} className="text-xs font-bold text-brand-primary hover:underline">Add the first entry →</button>}
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-zenthar-steel">
                    {config.columns.map((col) => (
                      <th key={col.key} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage">{col.label}</th>
                    ))}
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zenthar-steel/40">
                  {filteredData.map((item, idx) => (
                    <tr key={item[config.pk] ?? idx} className="hover:bg-zenthar-graphite/20 transition-colors group">
                      {config.columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          {col.render ? col.render(item[col.key], item) : <span className="text-sm text-zenthar-text-secondary">{String(item[col.key] ?? "—")}</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(item)} className="p-2 rounded-xl border border-transparent group-hover:border-zenthar-steel hover:bg-brand-primary/10 hover:text-brand-primary text-brand-sage transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {config.deletable && (
                            <button onClick={() => setDeleteItem(item)} className="p-2 rounded-xl border border-transparent group-hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-brand-sage transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-8 py-3 border-t border-zenthar-steel bg-white/50 shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-mono text-brand-sage">{filteredData.length}{search ? ` of ${data.length}` : ""} records</span>
            {data.length > 0 && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live connection
              </span>
            )}
          </div>
        </div>
      </main>

      {/* ── Form modal ── */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={isEditing ? `Edit ${moduleInfo.label}` : `Add ${moduleInfo.label}`} subtitle={moduleInfo.hint} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-5">
          {config.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
                  {field.label}{field.required && <span className="text-brand-primary ml-1">*</span>}
                </label>
                {field.hint && <span className="text-[9px] text-brand-sage/60 font-mono italic">{field.hint}</span>}
              </div>
              <FieldRenderer field={field} value={formData[field.key]} onChange={(val) => setFormData((p) => ({ ...p, [field.key]: val }))} isEditing={isEditing} />
            </div>
          ))}
          <div className="flex gap-3 pt-4 border-t border-zenthar-steel mt-4">
            <button type="button" onClick={closeForm} className="flex-1 py-3.5 text-xs font-black text-brand-sage border border-zenthar-steel rounded-2xl hover:bg-zenthar-void transition-all uppercase tracking-widest">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white text-xs font-black rounded-2xl hover:bg-brand-primary/90 shadow-lg transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Entry"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} title="Confirm Delete" maxWidth="max-w-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-sm text-zenthar-text-primary">
              Delete <span className="font-bold">{deleteItem?.[config.pk]}</span>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeleteItem(null)} className="flex-1 py-3 text-xs font-black text-brand-sage border border-zenthar-steel rounded-2xl hover:bg-zenthar-void uppercase tracking-widest">Cancel</button>
            <button onClick={() => handleDelete(deleteItem)} className="flex-1 py-3 bg-red-600 text-white text-xs font-black rounded-2xl hover:bg-red-500 uppercase tracking-widest active:scale-95">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;