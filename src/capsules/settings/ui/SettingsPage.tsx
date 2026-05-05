import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Beaker,
  BookOpen,
  Wrench,
  Users,
  Factory,
  Bell,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  ChevronRight,
  ShieldCheck,
  Search,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Package,
  Trash2,
  RefreshCw,
  Lock,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsApi } from "../api/settings.api";
import { Modal } from "../../../shared/components/Modal";
import { toast } from "sonner";
import clsx from "clsx";
import { LabButton } from "../../../shared/components/LabButton";

// ─────────────────────────────────────────────
// Field + Column definitions (unchanged from original — keeping compact)
// ─────────────────────────────────────────────

type FieldType = "text" | "textarea" | "number" | "select" | "date" | "toggle" | "email" | "tel" | "readonly";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  readonlyOnEdit?: boolean;
  hint?: string;
}

interface ColumnDef {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface TableConfig {
  fields: FieldDef[];
  columns: ColumnDef[];
  pk: string;
  displayName: string;
  deletable?: boolean;
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "CHEMIST", label: "Chemist" },
  { value: "SHIFT_CHEMIST", label: "Shift Chemist" },
  { value: "ASSISTING_MANAGER", label: "Assisting Manager" },
  { value: "HEAD_MANAGER", label: "Head Manager" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "DISPATCH", label: "Dispatch" },
];

const STATUS_BADGE = (val: any) => {
  const active = val === "ACTIVE" || val === 1 || val === true;
  return (
    <span
      className={clsx(
        "rounded-md border px-2 py-0.5 text-[9px] font-black uppercase",
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "bg-zenthar-graphite/40 border-zenthar-steel text-zenthar-text-muted",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const TABLE_CONFIG: Record<string, TableConfig> = {
  sample_types: {
    pk: "id",
    displayName: "Sample Types",
    deletable: true,
    fields: [
      { key: "name", label: "Type Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
    columns: [
      {
        key: "id",
        label: "ID",
        render: (v) => <span className="text-brand-sage font-mono text-[10px]">#{v}</span>,
      },
      {
        key: "name",
        label: "Name",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "description",
        label: "Description",
        render: (v) => (
          <span className="text-zenthar-text-secondary block max-w-[240px] truncate text-xs">{v || "—"}</span>
        ),
      },
    ],
  },
  test_methods: {
    pk: "id",
    displayName: "Test Methods",
    fields: [
      { key: "name", label: "Method Name", type: "text", required: true },
      { key: "sop_steps", label: "SOP Steps", type: "textarea" },
      {
        key: "formula",
        label: "Formula",
        type: "text",
        placeholder: "(A × 1000) / (b × c)",
      },
      { key: "min_range", label: "Min Range", type: "number" },
      { key: "max_range", label: "Max Range", type: "number" },
      { key: "version", label: "Version", type: "number" },
      { key: "is_active", label: "Active", type: "toggle" },
    ],
    columns: [
      {
        key: "name",
        label: "Method",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "formula",
        label: "Formula",
        render: (v) => <span className="text-brand-sage font-mono text-[10px]">{v || "—"}</span>,
      },
      {
        key: "min_range",
        label: "Range",
        render: (v, r) => (
          <span className="text-zenthar-text-secondary text-xs">
            {v ?? "—"} – {r.max_range ?? "—"}
          </span>
        ),
      },
      { key: "is_active", label: "Status", render: STATUS_BADGE },
    ],
  },
  instruments: {
    pk: "id",
    displayName: "Instruments",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "model", label: "Model", type: "text" },
      { key: "serial_number", label: "Serial Number", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "CALIBRATION_DUE", label: "Calibration Due" },
          { value: "INACTIVE", label: "Inactive" },
        ],
      },
      { key: "last_calibration", label: "Last Calibration", type: "date" },
      { key: "next_calibration", label: "Next Calibration", type: "date" },
    ],
    columns: [
      {
        key: "name",
        label: "Name",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "model",
        label: "Model",
        render: (v) => <span className="text-zenthar-text-secondary text-xs">{v || "—"}</span>,
      },
      {
        key: "serial_number",
        label: "Serial",
        render: (v) => <span className="text-brand-sage font-mono text-[10px]">{v || "—"}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (v) => {
          const map: Record<string, string> = {
            ACTIVE: "text-emerald-700 bg-emerald-50 border-emerald-200",
            CALIBRATION_DUE: "text-amber-700 bg-amber-50 border-amber-200",
            INACTIVE: "text-slate-500 bg-slate-50 border-slate-200",
          };
          return (
            <span
              className={clsx(
                "rounded border px-2 py-0.5 text-[9px] font-black uppercase",
                map[v] || map.INACTIVE,
              )}
            >
              {v}
            </span>
          );
        },
      },
      {
        key: "next_calibration",
        label: "Next Cal.",
        render: (v) => {
          if (!v) return <span className="text-brand-sage/60 text-xs">—</span>;
          const overdue = new Date(v) < new Date();
          return (
            <span
              className={clsx(
                "font-mono text-[10px]",
                overdue ? "font-bold text-red-600" : "text-zenthar-text-secondary",
              )}
            >
              {new Date(v).toLocaleDateString()}
            </span>
          );
        },
      },
    ],
  },
  clients: {
    pk: "id",
    displayName: "Clients",
    deletable: true,
    fields: [
      { key: "name", label: "Client Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "address", label: "Address", type: "textarea" },
    ],
    columns: [
      {
        key: "name",
        label: "Client",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "email",
        label: "Email",
        render: (v) => <span className="text-zenthar-text-secondary text-xs">{v || "—"}</span>,
      },
      {
        key: "phone",
        label: "Phone",
        render: (v) => <span className="text-brand-sage font-mono text-[10px]">{v || "—"}</span>,
      },
    ],
  },
  employees: {
    pk: "employee_number",
    displayName: "Employees",
    fields: [
      {
        key: "employee_number",
        label: "Employee #",
        type: "text",
        required: true,
        readonlyOnEdit: true,
      },
      { key: "name", label: "Full Name", type: "text", required: true },
      {
        key: "national_id",
        label: "National ID",
        type: "text",
        required: true,
      },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        options: ROLE_OPTIONS,
      },
      { key: "department", label: "Department", type: "text" },
      { key: "email", label: "Email", type: "email" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "INACTIVE", label: "Inactive" },
        ],
      },
    ],
    columns: [
      {
        key: "employee_number",
        label: "Emp. #",
        render: (v) => <span className="text-brand-primary font-mono text-[10px] font-bold">{v}</span>,
      },
      {
        key: "name",
        label: "Name",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "role",
        label: "Role",
        render: (v) => <span className="text-zenthar-text-secondary text-xs font-bold uppercase">{v}</span>,
      },
      { key: "status", label: "Status", render: STATUS_BADGE },
    ],
  },
  production_lines: {
    pk: "id",
    displayName: "Production Lines",
    fields: [
      { key: "name", label: "Line Name", type: "text", required: true },
      { key: "plant_id", label: "Plant ID", type: "text" },
    ],
    columns: [
      {
        key: "id",
        label: "ID",
        render: (v) => <span className="text-brand-sage font-mono text-[10px]">#{v}</span>,
      },
      {
        key: "name",
        label: "Line",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "plant_id",
        label: "Plant",
        render: (v) => <span className="text-zenthar-text-secondary text-xs">{v || "—"}</span>,
      },
    ],
  },
  inventory: {
    pk: "id",
    displayName: "Inventory",
    deletable: true,
    fields: [
      { key: "name", label: "Item Name", type: "text", required: true },
      { key: "type", label: "Type", type: "text" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "unit", label: "Unit", type: "text", placeholder: "mL, g, pcs" },
      {
        key: "min_stock",
        label: "Min Stock",
        type: "number",
        hint: "Alert threshold",
      },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
    ],
    columns: [
      {
        key: "name",
        label: "Item",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "quantity",
        label: "Qty / Unit",
        render: (v, r) => {
          const low = v != undefined && r.min_stock != undefined && v <= r.min_stock;
          return (
            <span
              className={clsx(
                "font-mono text-xs font-bold",
                low ? "text-red-600" : "text-zenthar-text-primary",
              )}
            >
              {v ?? "—"} {r.unit || ""}
              {low ? " ⚠" : ""}
            </span>
          );
        },
      },
      {
        key: "expiry_date",
        label: "Expiry",
        render: (v) => {
          if (!v) return <span className="text-brand-sage/60 text-xs">—</span>;
          const expired = new Date(v) < new Date();
          return (
            <span
              className={clsx(
                "font-mono text-[10px]",
                expired ? "font-bold text-red-600" : "text-zenthar-text-secondary",
              )}
            >
              {new Date(v).toLocaleDateString()}
            </span>
          );
        },
      },
    ],
  },
  notification_rules: {
    pk: "id",
    displayName: "Alert Rules",
    fields: [
      { key: "name", label: "Rule Name", type: "text", required: true },
      {
        key: "condition",
        label: "Condition",
        type: "textarea",
        hint: "Trigger expression",
      },
      {
        key: "action",
        label: "Action",
        type: "select",
        options: [
          { value: "OVERDUE_TEST", label: "Overdue Test" },
          { value: "WORKFLOW_FAILURE", label: "Workflow Failure" },
          { value: "SAMPLE_COMPLETED", label: "Sample Completed" },
        ],
      },
      { key: "is_active", label: "Active", type: "toggle" },
    ],
    columns: [
      {
        key: "name",
        label: "Rule",
        render: (v) => <span className="text-zenthar-text-primary font-bold">{v}</span>,
      },
      {
        key: "action",
        label: "Action",
        render: (v) => (
          <span className="text-brand-primary text-xs font-bold uppercase">
            {v?.replace(/_/g, " ") || "—"}
          </span>
        ),
      },
      { key: "is_active", label: "Active", render: STATUS_BADGE },
    ],
  },
  system_preferences: {
    pk: "key",
    displayName: "System Preferences",
    fields: [
      {
        key: "key",
        label: "Key",
        type: "text",
        required: true,
        readonlyOnEdit: true,
      },
      { key: "value", label: "Value", type: "text", required: true },
    ],
    columns: [
      {
        key: "key",
        label: "Key",
        render: (v) => <span className="text-brand-primary font-mono text-sm font-bold">{v}</span>,
      },
      {
        key: "value",
        label: "Value",
        render: (v) => <span className="text-zenthar-text-secondary font-mono text-sm">{v}</span>,
      },
    ],
  },
};

type ModuleId = keyof typeof TABLE_CONFIG;

const MODULES: {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  hint: string;
}[] = [
  {
    id: "sample_types",
    label: "Sample Types",
    icon: Beaker,
    hint: "Registered classifications",
  },
  {
    id: "test_methods",
    label: "Test Methods",
    icon: BookOpen,
    hint: "Analytical procedure library",
  },
  {
    id: "instruments",
    label: "Instruments",
    icon: Wrench,
    hint: "Calibration tracker",
  },
  {
    id: "clients",
    label: "Clients",
    icon: ShieldCheck,
    hint: "Certificate recipients",
  },
  { id: "employees", label: "Employees", icon: Users, hint: "Staff directory" },
  {
    id: "production_lines",
    label: "Prod. Lines",
    icon: Factory,
    hint: "Plant line registry",
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Package,
    hint: "Reagents and materials",
  },
  {
    id: "notification_rules",
    label: "Alert Rules",
    icon: Bell,
    hint: "Notification logic",
  },
  {
    id: "system_preferences",
    label: "Preferences",
    icon: SettingsIcon,
    hint: "Global settings",
  },
];

// ─────────────────────────────────────────────
// Field renderer
// ─────────────────────────────────────────────

const inputBase =
  "w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-zenthar-text-primary transition-all placeholder:text-brand-sage/40";

const FieldRenderer: React.FC<{
  field: FieldDef;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
}> = ({ field, value, onChange, isEditing }) => {
  const isReadonly = field.type === "readonly" || (isEditing && field.readonlyOnEdit);
  if (isReadonly)
    return (
      <div className={clsx(inputBase, "bg-zenthar-graphite/30 text-brand-sage/80 cursor-not-allowed")}>
        {value || "—"}
      </div>
    );
  if (field.type === "toggle") {
    const checked = value === 1 || value === true || value === "1";
    return (
      <button
        type="button"
        onClick={() => onChange(checked ? 0 : 1)}
        className={clsx(
          "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
          checked
            ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
            : "bg-zenthar-void border-zenthar-steel text-brand-sage",
        )}
      >
        {checked ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
        <span className="text-sm font-bold tracking-wider uppercase">{checked ? "Enabled" : "Disabled"}</span>
      </button>
    );
  }
  if (field.type === "select" && field.options) {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        required={field.required}
      >
        <option value="">Select {field.label}...</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        rows={3}
        className={clsx(inputBase, "resize-none")}
      />
    );
  }
  return (
    <input
      type={field.type === "number" ? "text" : field.type}
      value={value ?? ""}
      onChange={(e) =>
        onChange(
          field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value,
        )
      }
      placeholder={field.placeholder}
      required={field.required}
      className={inputBase}
    />
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>("sample_types");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(undefined);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [deleteItem, setDeleteItem] = useState<any>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar

  const config = TABLE_CONFIG[activeModule];
  const moduleInfo = MODULES.find((m) => m.id === activeModule)!;
  const isEditing = editingItem !== undefined;

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

  useEffect(() => {
    fetchData();
    setSearch("");
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search]);

  const openAdd = () => {
    const defaults: Record<string, any> = {};
    config.fields.forEach((f) => {
      defaults[f.key] = f.type === "toggle" ? 1 : f.type === "number" ? "" : "";
    });
    setEditingItem(undefined);
    setFormData(defaults);
    setIsFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    const values: Record<string, any> = {};
    config.fields.forEach((f) => {
      values[f.key] = item[f.key] ?? "";
    });
    setFormData(values);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(undefined);
    setFormData({});
  };

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
      setDeleteItem(undefined);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* ── MOBILE SIDEBAR TOGGLE ── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="bg-brand-primary shadow-brand-primary/40 fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all hover:scale-105 active:scale-95 lg:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <SettingsIcon size={20} />}
      </button>

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        <aside
          className={clsx(
            "shrink-0 flex-col gap-3 transition-opacity",
            !sidebarOpen && "hidden lg:flex",
            sidebarOpen && "fixed inset-y-4 left-4 z-40 flex w-[240px] lg:static lg:w-auto",
          )}
        >
          <div className="glass-panel custom-scrollbar lg:border-brand-primary/10 flex min-w-[220px] flex-1 flex-col gap-2 overflow-y-auto border border-transparent p-5 shadow-2xl lg:shadow-none">
            <div className="border-zenthar-steel/50 mb-4 flex items-center gap-4 border-b px-3 pt-2 pb-6">
              <div className="bg-brand-primary/10 border-brand-primary/30 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner">
                <SettingsIcon className="text-brand-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-zenthar-text-primary text-[12px] leading-tight font-black tracking-[0.15em] uppercase">
                  Control Panel
                </h2>
                <p className="text-brand-sage mt-1 font-mono text-[10px] tracking-widest uppercase opacity-80">
                  Registry
                </p>
              </div>
            </div>
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModule(m.id);
                  setSidebarOpen(false);
                }}
                className={clsx(
                  "group relative flex w-full items-center gap-4 overflow-hidden rounded-[16px] px-4 py-3.5 text-left transition-all duration-300",
                  activeModule === m.id
                    ? "bg-brand-primary shadow-brand-primary/30 border-brand-primary/20 z-10 scale-[1.02] border text-white shadow-lg"
                    : "text-brand-sage hover:bg-zenthar-graphite/60 hover:text-zenthar-text-primary border border-transparent",
                )}
              >
                {activeModule === m.id && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 animate-[scanline_2.5s_linear_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent"
                  />
                )}

                <m.icon
                  className={clsx(
                    "relative z-10 h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                    activeModule === m.id ? "text-white" : "opacity-60",
                  )}
                />
                <span className="relative z-10 text-[12px] leading-none font-bold tracking-wide">
                  {m.label}
                </span>
                {activeModule === m.id && (
                  <ChevronRight className="relative z-10 ml-auto h-4 w-4 text-white/80" />
                )}
              </button>
            ))}
          </div>
        </aside>
      </AnimatePresence>

      {/* ── MAIN ── */}
      <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="glass-panel relative flex shrink-0 flex-wrap items-center justify-between gap-5 overflow-hidden px-8 py-7">
          <div className="bg-brand-primary/10 pointer-events-none absolute top-0 right-0 h-72 w-72 translate-x-1/4 -translate-y-1/2 rounded-full blur-[80px]" />

          <div className="relative z-10 flex items-center gap-5">
            <div className="bg-zenthar-graphite/80 border-zenthar-steel text-brand-primary shadow-brand-primary/5 flex h-16 w-16 items-center justify-center rounded-[20px] border shadow-lg">
              <moduleInfo.icon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-zenthar-text-primary mb-2 text-2xl leading-none font-black tracking-tight">
                {moduleInfo.label}
              </h2>
              <p className="text-brand-sage font-mono text-xs tracking-[0.2em] uppercase opacity-80">
                {moduleInfo.hint}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-2 flex w-full items-center gap-4 sm:mt-0 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="text-brand-sage/50 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search registry..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zenthar-graphite/40 border-zenthar-steel focus:border-brand-primary focus:ring-brand-primary/10 text-zenthar-text-primary placeholder:text-brand-sage/40 w-full rounded-[16px] border py-3.5 pr-8 pl-11 text-sm font-medium backdrop-blur-sm transition-all focus:ring-4 focus:outline-none sm:w-64"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-brand-sage hover:text-zenthar-text-primary absolute top-1/2 right-4 -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={fetchData}
              className="bg-zenthar-graphite/40 border-zenthar-steel hover:bg-zenthar-graphite rounded-[16px] border p-3.5 shadow-sm backdrop-blur-sm transition-all"
              title="Refresh"
            >
              <RefreshCw className={clsx("text-brand-primary h-5 w-5", loading && "animate-spin")} />
            </button>
            <LabButton
              variant="primary"
              onClick={openAdd}
              icon={Plus}
              className="rounded-[16px] px-6 py-4 text-[10px]"
            >
              Add Entry
            </LabButton>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel border-zenthar-steel/50 relative flex min-h-0 flex-1 flex-col overflow-hidden border shadow-sm">
          {/* subtle background details */}
          <div className="instrument-grid pointer-events-none absolute inset-0 opacity-30" />

          {loading ? (
            <div className="relative z-10 flex flex-1 items-center justify-center">
              <div className="border-brand-primary/20 border-t-brand-primary h-8 w-8 animate-spin rounded-full border-4" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 py-16">
              <div className="bg-zenthar-graphite/30 border-zenthar-steel rounded-[24px] border p-6 shadow-inner backdrop-blur-md">
                <moduleInfo.icon className="text-brand-primary/30 h-12 w-12" />
              </div>
              <p className="text-zenthar-text-primary mt-2 text-[13px] font-black tracking-widest uppercase">
                {search ? "No results match your search" : `No ${moduleInfo.label} yet`}
              </p>
              {!search && (
                <button
                  onClick={openAdd}
                  className="text-brand-primary/80 hover:text-brand-primary text-[11px] font-bold tracking-widest uppercase transition-colors hover:underline"
                >
                  Add the first entry →
                </button>
              )}
            </div>
          ) : (
            <div className="custom-scrollbar relative z-10 flex-1 overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-zenthar-void/80 sticky top-0 z-20 backdrop-blur-xl">
                  <tr className="border-zenthar-steel/40 border-b shadow-sm">
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        className="text-brand-sage px-6 py-5 text-[10px] font-black tracking-[0.15em] uppercase"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="text-brand-sage px-6 py-5 text-right text-[10px] font-black tracking-[0.15em] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-zenthar-steel/20 divide-y">
                  {filteredData.map((item, idx) => (
                    <tr
                      key={item[config.pk] ?? idx}
                      className="hover:bg-brand-primary/[0.02] group transition-colors"
                    >
                      {config.columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          {col.render ? (
                            col.render(item[col.key], item)
                          ) : (
                            <span className="text-zenthar-text-primary/80 text-[13px] font-medium">
                              {String(item[col.key] ?? "—")}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => openEdit(item)}
                            className="group-hover:border-zenthar-steel hover:bg-zenthar-graphite/80 hover:text-brand-primary text-brand-sage flex h-8 w-8 items-center justify-center rounded-[10px] border border-transparent shadow-sm transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {config.deletable && (
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="text-brand-sage flex h-8 w-8 items-center justify-center rounded-[10px] border border-transparent shadow-sm transition-all group-hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
          <div className="border-zenthar-steel/40 bg-zenthar-void/60 relative z-20 flex shrink-0 items-center justify-between border-t px-8 py-3.5 backdrop-blur-md">
            <span className="text-brand-sage/80 font-mono text-[10px] font-medium tracking-tight uppercase">
              {filteredData.length}
              {search ? ` of ${data.length}` : ""} records
            </span>
            {data.length > 0 && (
              <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-600/90 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />{" "}
                Live connection
              </span>
            )}
          </div>
        </div>
      </main>

      {/* ── Form modal ── */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? `Edit ${moduleInfo.label}` : `Add ${moduleInfo.label}`}
        subtitle={moduleInfo.hint}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6 pt-2">
          {config.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-zenthar-text-primary flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                  {field.label}
                  {field.required && (
                    <span className="text-brand-primary mt-0.5 text-[12px] leading-none">*</span>
                  )}
                </label>
                {field.hint && (
                  <span className="text-brand-sage/60 font-mono text-[10px] italic">{field.hint}</span>
                )}
              </div>
              <FieldRenderer
                field={field}
                value={formData[field.key]}
                onChange={(val) => setFormData((p) => ({ ...p, [field.key]: val }))}
                isEditing={isEditing}
              />
            </div>
          ))}

          <AnimatePresence>
            {isEditing && activeModule === "employees" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 border-t border-red-500/10 pt-6"
              >
                <div className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                      <Lock className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black tracking-widest text-red-500 uppercase">
                        Security_Reset
                      </h4>
                      <p className="text-brand-sage mt-1 font-mono text-[9px] uppercase opacity-70">
                        Reset PIN to 0000 and clear password.
                      </p>
                    </div>
                  </div>
                  <LabButton
                    variant="secondary"
                    className="border-red-500/20 text-[9px] font-black tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!window.confirm("Reset credentials for this employee?")) return;
                      try {
                        const { AuthApi } = await import("../../auth/api/auth.api");
                        await AuthApi.resetCredentials(formData[config.pk]);
                        toast.success("Credentials regenerated successfully (Temp PIN: 0000).");
                      } catch (err) {
                        toast.error("Failed to reset credentials.");
                      }
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset_Account
                  </LabButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-zenthar-steel mt-6 flex gap-4 border-t pt-6">
            <LabButton variant="ghost" type="button" onClick={closeForm} className="flex-1 py-4 text-[11px]">
              Cancel
            </LabButton>
            <LabButton
              variant="primary"
              type="submit"
              disabled={saving}
              className="flex-1 py-4 text-[11px]"
              icon={saving ? undefined : Save}
            >
              {saving ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : undefined}
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Entry"}
            </LabButton>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(undefined)}
        title="Confirm Action"
        maxWidth="max-w-sm"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-[20px] border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-zenthar-text-primary text-sm leading-relaxed font-medium">
              Delete <span className="font-bold text-red-600">"{deleteItem?.[config.pk]}"</span>? This action
              cannot be undone and will permanently remove this record.
            </p>
          </div>
          <div className="flex gap-4">
            <LabButton
              variant="ghost"
              onClick={() => setDeleteItem(undefined)}
              className="flex-1 py-3 text-[11px]"
            >
              Cancel
            </LabButton>
            <button
              onClick={() => handleDelete(deleteItem)}
              className="flex-1 rounded-2xl bg-red-500 py-3 text-center text-[11px] font-black tracking-widest text-white uppercase shadow-md shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95"
            >
              Delete Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
