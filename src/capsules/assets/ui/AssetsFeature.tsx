import React, { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  Database,
  Wrench,
  Package,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Activity,
  Calendar,
  Layers,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { MetricCard } from "../../../ui/components/MetricCard";
import { api } from "../../../core/http/client";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Instrument {
  id: number;
  name: string;
  model?: string;
  serial_number?: string;
  status?: string;
  last_calibration?: string;
  next_calibration?: string;
}

interface Equipment {
  id: number;
  name: string;
  type?: string;
  status?: string;
  line_id?: number;
}

interface InventoryItem {
  id: number;
  name: string;
  type?: string;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  min_stock?: number;
}

interface ProductionLine {
  id: number;
  name: string;
  plant_id?: string;
}

type AssetTab = "instruments" | "equipment" | "inventory";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const CalibrationBadge: React.FC<{ nextCal?: string }> = ({ nextCal }) => {
  const days = daysUntil(nextCal);
  if (days === null) return <span className="text-xs text-brand-sage/50">Not set</span>;
  if (days < 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[9px] font-black text-red-700 uppercase">
        <AlertTriangle className="w-3 h-3" /> Overdue {Math.abs(days)}d
      </span>
    );
  if (days <= 14)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[9px] font-black text-amber-700 uppercase">
        <Clock className="w-3 h-3" /> Due in {days}d
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700 uppercase">
      <CheckCircle2 className="w-3 h-3" /> {days}d left
    </span>
  );
};

const InstrumentStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    ACTIVE: "bg-emerald-50 border-emerald-200 text-emerald-700",
    CALIBRATION_DUE: "bg-amber-50 border-amber-200 text-amber-700",
    INACTIVE: "bg-slate-50 border-slate-200 text-slate-500",
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-md border text-[9px] font-black uppercase", styles[status || "INACTIVE"] || styles.INACTIVE)}>
      {status || "Unknown"}
    </span>
  );
};

const StockBar: React.FC<{ quantity?: number; minStock?: number }> = ({ quantity = 0, minStock = 0 }) => {
  const max = Math.max(quantity, minStock * 3, 10);
  const pct = Math.min(100, (quantity / max) * 100);
  const isLow = quantity <= minStock;
  const isCritical = quantity <= minStock * 0.5;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zenthar-graphite/50 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={clsx("text-xs font-bold font-mono w-10 text-right", isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-zenthar-text-primary")}>
        {quantity}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Instruments
// ─────────────────────────────────────────────────────────────────────────────

const InstrumentsTab: React.FC<{ instruments: Instrument[]; loading: boolean }> = ({ instruments, loading }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      search
        ? instruments.filter((i) =>
            [i.name, i.model, i.serial_number, i.status].some((v) =>
              String(v ?? "").toLowerCase().includes(search.toLowerCase()),
            ),
          )
        : instruments,
    [instruments, search],
  );

  const stats = useMemo(() => {
    const overdue = instruments.filter((i) => {
      const d = daysUntil(i.next_calibration);
      return d !== null && d < 0;
    }).length;
    const dueSoon = instruments.filter((i) => {
      const d = daysUntil(i.next_calibration);
      return d !== null && d >= 0 && d <= 14;
    }).length;
    const active = instruments.filter((i) => i.status === "ACTIVE").length;
    return { total: instruments.length, active, overdue, dueSoon };
  }, [instruments]);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <MetricCard label="Total Instruments" value={stats.total} icon={Wrench} variant="primary" />
        <MetricCard label="Active" value={stats.active} icon={Activity} variant="success" />
        <MetricCard label="Due Soon" value={stats.dueSoon} icon={Clock} variant="warning" trend="≤ 14 days" />
        <MetricCard label="Overdue" value={stats.overdue} icon={AlertTriangle} variant="error" />
      </div>

      {/* Table */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-8 py-5 border-b border-zenthar-steel flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Wrench className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-zenthar-text-primary">Instrument Registry</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/50" />
            <input
              type="text"
              placeholder="Search instruments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-48"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <tr className="border-b border-zenthar-steel">
                  {["Name", "Model", "Serial", "Status", "Last Cal.", "Next Cal.", "Health"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {filtered.map((instr) => (
                  <tr key={instr.id} className="hover:bg-zenthar-graphite/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-zenthar-text-primary">{instr.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-zenthar-text-secondary">{instr.model || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] text-brand-sage">{instr.serial_number || "—"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <InstrumentStatusBadge status={instr.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-zenthar-text-secondary">{formatDate(instr.last_calibration)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono text-zenthar-text-secondary">{formatDate(instr.next_calibration)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <CalibrationBadge nextCal={instr.next_calibration} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Wrench className="w-8 h-8 text-brand-sage/20 mx-auto mb-2" />
                      <p className="text-xs font-black text-brand-sage/60 uppercase tracking-widest">No instruments found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-8 py-3 border-t border-zenthar-steel bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">{filtered.length} instruments</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Equipment
// ─────────────────────────────────────────────────────────────────────────────

const EquipmentTab: React.FC<{ lines: ProductionLine[]; loading: boolean }> = ({ lines, loading }) => {
  const [equipmentMap, setEquipmentMap] = useState<Record<number, Equipment[]>>({});
  const [loadingEquip, setLoadingEquip] = useState(false);
  const [expandedLine, setExpandedLine] = useState<number | null>(null);

  const loadEquipment = useCallback(async (lineId: number) => {
    if (equipmentMap[lineId]) {
      setExpandedLine((prev) => (prev === lineId ? null : lineId));
      return;
    }
    setLoadingEquip(true);
    try {
      const res = await api.get<{ success: boolean; data: Equipment[] }>(`/operational/equipment?line_id=${lineId}`);
      setEquipmentMap((prev) => ({ ...prev, [lineId]: res.data || [] }));
      setExpandedLine(lineId);
    } catch {
      // ignore
    } finally {
      setLoadingEquip(false);
    }
  }, [equipmentMap]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <MetricCard label="Production Lines" value={lines.length} icon={Factory} variant="primary" />
        <MetricCard label="Equipment Units" value={Object.values(equipmentMap).flat().length} icon={Layers} variant="secondary" />
        <MetricCard label="Lines Inspected" value={Object.keys(equipmentMap).length} icon={CheckCircle2} variant="success" />
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-8 py-5 border-b border-zenthar-steel flex items-center gap-3 shrink-0">
          <Factory className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-black uppercase tracking-widest text-zenthar-text-primary">Equipment by Production Line</span>
          <span className="text-[10px] font-mono text-brand-sage ml-auto">Click a line to expand equipment</span>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar divide-y divide-zenthar-steel/40">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id}>
                <button
                  onClick={() => loadEquipment(line.id)}
                  className="w-full flex items-center justify-between px-8 py-5 hover:bg-zenthar-graphite/20 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zenthar-text-primary">{line.name}</p>
                      <p className="text-[10px] font-mono text-brand-sage">Plant: {line.plant_id || "PLANT-01"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {equipmentMap[line.id] && (
                      <span className="text-[10px] font-mono text-brand-sage">
                        {equipmentMap[line.id].length} units
                      </span>
                    )}
                    <motion.div
                      animate={{ rotate: expandedLine === line.id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 text-brand-sage group-hover:text-brand-primary transition-colors" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedLine === line.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zenthar-graphite/10"
                    >
                      {loadingEquip ? (
                        <div className="px-8 py-4 text-[10px] font-mono text-brand-sage">Loading...</div>
                      ) : (equipmentMap[line.id] || []).length === 0 ? (
                        <div className="px-8 py-6 text-xs text-brand-sage/60 font-medium">
                          No equipment registered for this line.
                        </div>
                      ) : (
                        <div className="px-8 py-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
                          {(equipmentMap[line.id] || []).map((eq) => (
                            <div key={eq.id} className="p-4 bg-white rounded-2xl border border-zenthar-steel shadow-sm">
                              <p className="text-sm font-bold text-zenthar-text-primary mb-1">{eq.name}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-brand-sage">{eq.type || "Equipment"}</span>
                                <span className={clsx(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                                  eq.status === "OPERATIONAL"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-amber-50 border-amber-200 text-amber-700",
                                )}>
                                  {eq.status || "Unknown"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
          {!loading && lines.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Factory className="w-8 h-8 text-brand-sage/20 mx-auto mb-2" />
              <p className="text-xs font-black text-brand-sage/60 uppercase tracking-widest">No production lines configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Inline ChevronRight import fix
const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Inventory
// ─────────────────────────────────────────────────────────────────────────────

const InventoryTab: React.FC<{ inventory: InventoryItem[]; loading: boolean }> = ({ inventory, loading }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expired">("all");

  const filtered = useMemo(() => {
    let items = inventory;
    if (filter === "low") items = items.filter((i) => (i.quantity ?? 0) <= (i.min_stock ?? 0));
    if (filter === "expired") items = items.filter((i) => i.expiry_date && new Date(i.expiry_date) < new Date());
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => [i.name, i.type].some((v) => String(v ?? "").toLowerCase().includes(q)));
    }
    return items;
  }, [inventory, filter, search]);

  const stats = useMemo(() => {
    const lowStock = inventory.filter((i) => (i.quantity ?? 0) <= (i.min_stock ?? 0)).length;
    const expired = inventory.filter((i) => i.expiry_date && new Date(i.expiry_date) < new Date()).length;
    return { total: inventory.length, lowStock, expired };
  }, [inventory]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <MetricCard label="Total Items" value={stats.total} icon={Package} variant="primary" />
        <MetricCard label="Low Stock" value={stats.lowStock} icon={TrendingDown} variant="warning" trend="At or below minimum" />
        <MetricCard label="Expired" value={stats.expired} icon={AlertTriangle} variant="error" />
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-8 py-5 border-b border-zenthar-steel flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-zenthar-text-primary">Inventory</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter chips */}
            {(["all", "low", "expired"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border",
                  filter === f
                    ? "bg-brand-primary border-brand-primary text-white"
                    : "border-zenthar-steel text-brand-sage hover:border-brand-primary/30",
                )}
              >
                {f === "all" ? "All" : f === "low" ? `Low Stock (${stats.lowStock})` : `Expired (${stats.expired})`}
              </button>
            ))}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-sage/50" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-36"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <tr className="border-b border-zenthar-steel">
                  {["Item", "Type", "Stock Level", "Min. Stock", "Expiry", "Alert"].map((h) => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {filtered.map((item) => {
                  const isLow = (item.quantity ?? 0) <= (item.min_stock ?? 0);
                  const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                  return (
                    <tr key={item.id} className={clsx("hover:bg-zenthar-graphite/20 transition-colors", (isLow || isExpired) && "bg-red-50/30")}>
                      <td className="px-6 py-4">
                        <span className="font-bold text-zenthar-text-primary">{item.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-zenthar-text-secondary">{item.type || "—"}</span>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <StockBar quantity={item.quantity} minStock={item.min_stock} />
                        <span className="text-[9px] font-mono text-brand-sage mt-0.5 block">
                          {item.quantity ?? 0} {item.unit || "units"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-brand-sage">{item.min_stock ?? "—"} {item.unit || ""}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx("text-[10px] font-mono", isExpired ? "text-red-600 font-bold" : "text-zenthar-text-secondary")}>
                          {formatDate(item.expiry_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 border border-red-200 text-[9px] font-black uppercase text-red-700">Expired</span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-[9px] font-black uppercase text-amber-700">Low</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black uppercase text-emerald-700">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Package className="w-8 h-8 text-brand-sage/20 mx-auto mb-2" />
                      <p className="text-xs font-black text-brand-sage/60 uppercase tracking-widest">No items found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-8 py-3 border-t border-zenthar-steel bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">{filtered.length} items</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const AssetsFeature: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<AssetTab>("instruments");
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [instrRes, invRes, linesRes] = await Promise.allSettled([
        api.get<{ success: boolean; data: Instrument[] }>("/operational/instruments"),
        api.get<{ success: boolean; data: InventoryItem[] }>("/operational/inventory"),
        api.get<{ success: boolean; data: ProductionLine[] }>("/operational/production-lines"),
      ]);
      if (instrRes.status === "fulfilled") setInstruments(instrRes.value.data || []);
      if (invRes.status === "fulfilled") setInventory(invRes.value.data || []);
      if (linesRes.status === "fulfilled") setLines(linesRes.value.data || []);
    } catch (err) {
      console.error("Failed to load assets", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const TABS: { id: AssetTab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "instruments", label: "Instruments", icon: Wrench, count: instruments.length },
    { id: "equipment", label: "Equipment", icon: Factory, count: lines.length },
    { id: "inventory", label: "Inventory", icon: Package, count: inventory.length },
  ];

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Tab bar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-2 bg-white/70 backdrop-blur-xl rounded-2xl border border-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                activeTab === tab.id
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                  : "text-brand-sage hover:text-zenthar-text-primary hover:bg-zenthar-graphite/30",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={clsx(
                "text-[9px] font-mono px-1.5 py-0.5 rounded-md",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-zenthar-graphite/50 text-brand-sage",
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={fetchAll}
          className="ml-auto p-2.5 bg-white/70 border border-white rounded-xl shadow-sm hover:bg-white transition-all"
          title="Refresh"
        >
          <RefreshCw className={clsx("w-4 h-4 text-brand-sage", loading && "animate-spin")} />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "instruments" && (
              <InstrumentsTab instruments={instruments} loading={loading} />
            )}
            {activeTab === "equipment" && (
              <EquipmentTab lines={lines} loading={loading} />
            )}
            {activeTab === "inventory" && (
              <InventoryTab inventory={inventory} loading={loading} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

AssetsFeature.displayName = "AssetsFeature";
export default AssetsFeature;