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
  Database,
  ShieldCheck,
  Search,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { SettingsApi } from "../api/settings.api";
import { Modal } from "../../../ui/components/Modal";
import { toast } from "sonner";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Schema Registry
// ─────────────────────────────────────────────────────────────────────────────

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "toggle"
  | "email"
  | "tel"
  | "readonly";

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
  const isActive = val === "ACTIVE" || val === 1 || val === true;
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
        isActive
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-500",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const TABLE_CONFIG: Record<string, TableConfig> = {
  sample_types: {
    pk: "id",
    displayName: "Sample Types",
    fields: [
      { key: "name", label: "Type Name", type: "text", required: true, placeholder: "e.g. Raw Sugar" },
      { key: "description", label: "Description", type: "textarea", placeholder: "Describe this sample type..." },
    ],
    columns: [
      { key: "id", label: "ID", render: (v) => <span className="font-mono text-[10px] text-brand-sage">#{v}</span> },
      { key: "name", label: "Name", render: (v) => <span className="font-bold text-zenthar-text-primary text-sm">{v}</span> },
      { key: "description", label: "Description", render: (v) => <span className="text-xs text-zenthar-text-secondary truncate max-w-xs block">{v || "—"}</span> },
    ],
  },

  test_methods: {
    pk: "id",
    displayName: "Test Methods",
    fields: [
      { key: "name", label: "Method Name", type: "text", required: true, placeholder: "e.g. ICUMSA Colour" },
      { key: "sop_steps", label: "SOP Steps", type: "textarea", placeholder: "Step 1: ...\nStep 2: ..." },
      { key: "formula", label: "Calculation Formula", type: "text", placeholder: "e.g. (A × 1000) / (b × c)" },
      { key: "min_range", label: "Minimum Range", type: "number", placeholder: "0" },
      { key: "max_range", label: "Maximum Range", type: "number", placeholder: "100" },
      { key: "version", label: "Version", type: "number", placeholder: "1" },
      { key: "is_active", label: "Active", type: "toggle" },
    ],
    columns: [
      { key: "name", label: "Method", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "formula", label: "Formula", render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
      {
        key: "min_range",
        label: "Range",
        render: (v, row) => (
          <span className="text-xs text-zenthar-text-secondary">
            {v ?? "—"} – {row.max_range ?? "—"}
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
      { key: "name", label: "Instrument Name", type: "text", required: true, placeholder: "e.g. Refractometer RX-500" },
      { key: "model", label: "Model", type: "text", placeholder: "Model number" },
      { key: "serial_number", label: "Serial Number", type: "text", placeholder: "SN-XXXXXX" },
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
      { key: "name", label: "Instrument", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "model", label: "Model", render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      { key: "serial_number", label: "Serial", render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
      {
        key: "status",
        label: "Status",
        render: (v) => {
          const map: Record<string, { bg: string; text: string }> = {
            ACTIVE: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
            CALIBRATION_DUE: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
            INACTIVE: { bg: "bg-slate-50 border-slate-200", text: "text-slate-500" },
          };
          const s = map[v] || map.INACTIVE;
          return (
            <span className={clsx("px-2 py-0.5 rounded border text-[9px] font-black uppercase", s.bg, s.text)}>
              {v}
            </span>
          );
        },
      },
      {
        key: "next_calibration",
        label: "Next Cal.",
        render: (v) => {
          if (!v) return <span className="text-xs text-brand-sage/60">—</span>;
          const isOverdue = new Date(v) < new Date();
          return (
            <span className={clsx("text-[10px] font-mono", isOverdue ? "text-red-600 font-bold" : "text-zenthar-text-secondary")}>
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
    fields: [
      { key: "name", label: "Client Name", type: "text", required: true, placeholder: "Company or person name" },
      { key: "email", label: "Email", type: "email", placeholder: "contact@example.com" },
      { key: "phone", label: "Phone", type: "tel", placeholder: "+966 5X XXX XXXX" },
      { key: "address", label: "Address", type: "textarea", placeholder: "Street, City, Country" },
    ],
    columns: [
      { key: "name", label: "Client", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "email", label: "Email", render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      { key: "phone", label: "Phone", render: (v) => <span className="font-mono text-[10px] text-brand-sage">{v || "—"}</span> },
      {
        key: "created_at",
        label: "Added",
        render: (v) => (
          <span className="text-[10px] text-brand-sage/60">
            {v ? new Date(v).toLocaleDateString() : "—"}
          </span>
        ),
      },
    ],
  },

  employees: {
    pk: "employee_number",
    displayName: "Employees",
    fields: [
      { key: "employee_number", label: "Employee Number", type: "text", required: true, readonlyOnEdit: true, placeholder: "EMP-001" },
      { key: "name", label: "Full Name", type: "text", required: true, placeholder: "Full name" },
      { key: "national_id", label: "National ID", type: "text", required: true, placeholder: "ID number" },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "role", label: "Role", type: "select", required: true, options: ROLE_OPTIONS },
      { key: "department", label: "Department", type: "text", placeholder: "e.g. Quality Control" },
      { key: "email", label: "Email", type: "email", placeholder: "employee@company.com" },
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
      { key: "employee_number", label: "Emp. #", render: (v) => <span className="font-mono text-[10px] font-bold text-brand-primary">{v}</span> },
      { key: "name", label: "Name", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "role", label: "Role", render: (v) => <span className="text-xs font-bold text-zenthar-text-secondary uppercase">{v}</span> },
      { key: "department", label: "Dept.", render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      { key: "status", label: "Status", render: STATUS_BADGE },
    ],
  },

  production_lines: {
    pk: "id",
    displayName: "Production Lines",
    fields: [
      { key: "name", label: "Line Name", type: "text", required: true, placeholder: "e.g. Crystallization" },
      { key: "plant_id", label: "Plant ID", type: "text", placeholder: "PLANT-01" },
    ],
    columns: [
      { key: "id", label: "ID", render: (v) => <span className="font-mono text-[10px] text-brand-sage">#{v}</span> },
      { key: "name", label: "Line Name", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "plant_id", label: "Plant", render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
    ],
  },

  inventory: {
    pk: "id",
    displayName: "Inventory",
    fields: [
      { key: "name", label: "Item Name", type: "text", required: true, placeholder: "e.g. Hydrochloric Acid" },
      { key: "type", label: "Type", type: "text", placeholder: "e.g. Reagent" },
      { key: "quantity", label: "Current Quantity", type: "number", placeholder: "0" },
      { key: "unit", label: "Unit", type: "text", placeholder: "e.g. mL, g, pcs" },
      { key: "min_stock", label: "Minimum Stock", type: "number", placeholder: "0", hint: "Alert threshold" },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
    ],
    columns: [
      { key: "name", label: "Item", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "type", label: "Type", render: (v) => <span className="text-xs text-zenthar-text-secondary">{v || "—"}</span> },
      {
        key: "quantity",
        label: "Qty / Unit",
        render: (v, row) => {
          const isLow = v != null && row.min_stock != null && v <= row.min_stock;
          return (
            <span className={clsx("font-mono text-xs font-bold", isLow ? "text-red-600" : "text-zenthar-text-primary")}>
              {v ?? "—"} {row.unit || ""}
              {isLow && " ⚠"}
            </span>
          );
        },
      },
      {
        key: "expiry_date",
        label: "Expiry",
        render: (v) => {
          if (!v) return <span className="text-xs text-brand-sage/60">—</span>;
          const isExpired = new Date(v) < new Date();
          return (
            <span className={clsx("text-[10px] font-mono", isExpired ? "text-red-600 font-bold" : "text-zenthar-text-secondary")}>
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
      { key: "name", label: "Rule Name", type: "text", required: true, placeholder: "e.g. Overdue Test Alert" },
      { key: "description", label: "Description", type: "textarea", placeholder: "What does this rule do?" },
      { key: "condition", label: "Condition", type: "textarea", placeholder: "e.g. test.status = PENDING AND age > 4h", hint: "Trigger expression" },
      {
        key: "action",
        label: "Notification Type",
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
      { key: "name", label: "Rule", render: (v) => <span className="font-bold text-zenthar-text-primary">{v}</span> },
      { key: "action", label: "Action Type", render: (v) => <span className="text-xs font-bold text-brand-primary uppercase">{v?.replace(/_/g, " ") || "—"}</span> },
      { key: "description", label: "Description", render: (v) => <span className="text-xs text-zenthar-text-secondary truncate max-w-xs block">{v || "—"}</span> },
      { key: "is_active", label: "Active", render: STATUS_BADGE },
    ],
  },

  system_preferences: {
    pk: "key",
    displayName: "System Preferences",
    fields: [
      { key: "key", label: "Preference Key", type: "text", required: true, readonlyOnEdit: true, placeholder: "e.g. date_format" },
      { key: "value", label: "Value", type: "text", required: true, placeholder: "Setting value" },
    ],
    columns: [
      { key: "key", label: "Key", render: (v) => <span className="font-mono text-sm font-bold text-brand-primary">{v}</span> },
      { key: "value", label: "Value", render: (v) => <span className="font-mono text-sm text-zenthar-text-secondary">{v}</span> },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Module config (sidebar nav)
// ─────────────────────────────────────────────────────────────────────────────

type ModuleId =
  | "sample_types"
  | "test_methods"
  | "instruments"
  | "clients"
  | "employees"
  | "production_lines"
  | "inventory"
  | "notification_rules"
  | "system_preferences";

const MODULES: { id: ModuleId; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "sample_types", label: "Sample Types", icon: Beaker, hint: "Registered sample classifications" },
  { id: "test_methods", label: "Test Methods", icon: BookOpen, hint: "Analytical procedure library" },
  { id: "instruments", label: "Instruments", icon: Wrench, hint: "Equipment calibration tracker" },
  { id: "clients", label: "Clients", icon: ShieldCheck, hint: "Certificate recipients" },
  { id: "employees", label: "Employees", icon: Users, hint: "Staff directory and roles" },
  { id: "production_lines", label: "Production Lines", icon: Factory, hint: "Plant line registry" },
  { id: "inventory", label: "Inventory", icon: Package, hint: "Reagents and materials" },
  { id: "notification_rules", label: "Alert Rules", icon: Bell, hint: "Automated notification logic" },
  { id: "system_preferences", label: "Preferences", icon: SettingsIcon, hint: "Global system settings" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Field Renderer
// ─────────────────────────────────────────────────────────────────────────────

const inputBase =
  "w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-zenthar-text-primary transition-all placeholder:text-brand-sage/40";

interface FieldRendererProps {
  field: FieldDef;
  value: any;
  onChange: (val: any) => void;
  isEditing: boolean;
}

const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, isEditing }) => {
  const isReadonly = field.type === "readonly" || (isEditing && field.readonlyOnEdit);

  if (isReadonly) {
    return (
      <div className={clsx(inputBase, "bg-zenthar-graphite/30 cursor-not-allowed text-brand-sage/80")}>
        {value || "—"}
      </div>
    );
  }

  if (field.type === "toggle") {
    const checked = value === 1 || value === true || value === "1";
    return (
      <button
        type="button"
        onClick={() => onChange(checked ? 0 : 1)}
        className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
          checked
            ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
            : "bg-zenthar-void border-zenthar-steel text-brand-sage",
        )}
      >
        {checked ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        <span className="text-sm font-bold uppercase tracking-wider">
          {checked ? "Enabled" : "Disabled"}
        </span>
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

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>("sample_types");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const config = TABLE_CONFIG[activeModule];
  const moduleInfo = MODULES.find((m) => m.id === activeModule)!;
  const isEditing = editingItem !== null;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await SettingsApi.getSettings(activeModule as any);
      setData(result || []);
    } catch (err) {
      console.error("Fetch failed", err);
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  }, [activeModule]);

  useEffect(() => {
    fetchData();
    setSearch("");
  }, [fetchData]);

  // ── Filtered rows ──────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
    );
  }, [data, search]);

  // ── Form open/close ────────────────────────────────────────────────────────

  const openAdd = () => {
    const defaults: Record<string, any> = {};
    config.fields.forEach((f) => {
      if (f.type === "toggle") defaults[f.key] = 1;
      else if (f.type === "number") defaults[f.key] = "";
      else defaults[f.key] = "";
    });
    setEditingItem(null);
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
    setEditingItem(null);
    setFormData({});
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        const pk = editingItem[config.pk];
        await SettingsApi.updateSetting(activeModule as any, pk, formData);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-6 h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">

      {/* ── Sidebar ── */}
      <aside className="w-64 flex flex-col gap-3 shrink-0">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm p-4 flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 pb-4 border-b border-zenthar-steel mb-2">
            <div className="p-2 bg-brand-primary/10 rounded-xl">
              <SettingsIcon className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-zenthar-text-primary uppercase tracking-wider">
                Control Panel
              </h2>
              <p className="text-[9px] text-brand-sage font-mono">System Registry</p>
            </div>
          </div>

          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left group",
                activeModule === m.id
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-brand-sage hover:bg-zenthar-graphite/40 hover:text-zenthar-text-primary",
              )}
            >
              <m.icon className={clsx("w-4 h-4 shrink-0", activeModule === m.id ? "text-white" : "opacity-70")} />
              <span className="text-[11px] font-bold tracking-tight leading-none">{m.label}</span>
              {activeModule === m.id && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm px-8 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
              <moduleInfo.icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zenthar-text-primary tracking-tight">
                {moduleInfo.label}
              </h2>
              <p className="text-[11px] text-brand-sage mt-0.5">{moduleInfo.hint}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/50" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-52 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sage hover:text-zenthar-text-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add button */}
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-brand-primary/90 shadow-md shadow-brand-primary/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
                Loading {moduleInfo.label}...
              </span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="p-6 bg-zenthar-graphite/30 rounded-full border border-zenthar-steel">
                <moduleInfo.icon className="w-10 h-10 text-brand-sage/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-zenthar-text-primary uppercase tracking-widest">
                  {search ? "No results match your search" : `No ${moduleInfo.label} yet`}
                </p>
                {!search && (
                  <p className="text-xs text-brand-sage mt-1">
                    Click "Add Entry" to create the first one.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-zenthar-steel">
                    {config.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zenthar-steel/40">
                  {filteredData.map((item, idx) => (
                    <tr
                      key={item[config.pk] ?? idx}
                      className="hover:bg-zenthar-graphite/20 transition-colors group"
                    >
                      {config.columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          {col.render
                            ? col.render(item[col.key], item)
                            : <span className="text-sm text-zenthar-text-secondary">{String(item[col.key] ?? "—")}</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-xl border border-transparent group-hover:border-zenthar-steel hover:bg-brand-primary/10 hover:text-brand-primary text-brand-sage transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-8 py-3 border-t border-zenthar-steel bg-white/50 shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-mono text-brand-sage">
              {filteredData.length} {search ? "of " + data.length : ""} records
            </span>
            {data.length > 0 && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live connection
              </span>
            )}
          </div>
        </div>
      </main>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={isEditing ? `Edit ${moduleInfo.label}` : `Add ${moduleInfo.label}`}
        subtitle={moduleInfo.hint}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {config.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
                  {field.label}
                  {field.required && <span className="text-brand-primary ml-1">*</span>}
                </label>
                {field.hint && (
                  <span className="text-[9px] text-brand-sage/60 font-mono italic">{field.hint}</span>
                )}
              </div>
              <FieldRenderer
                field={field}
                value={formData[field.key]}
                onChange={(val) => setFormData((prev) => ({ ...prev, [field.key]: val }))}
                isEditing={isEditing}
              />
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-zenthar-steel mt-4">
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 py-3.5 text-xs font-black text-brand-sage border border-zenthar-steel rounded-2xl hover:bg-zenthar-void transition-all uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-primary text-white text-xs font-black rounded-2xl hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Entry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;