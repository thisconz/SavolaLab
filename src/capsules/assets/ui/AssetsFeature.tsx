import React, { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  Wrench,
  Package,
  Factory,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Activity,
  TrendingDown,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { MetricCard } from "../../../shared/components/MetricCard";
import { TableSkeleton } from "../../../shared/components/Skeletons";
import { api } from "../../../core/http/client";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const daysUntil = (d?: string) =>
  d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) : null;
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const CalBadge: React.FC<{ nextCal?: string }> = ({ nextCal }) => {
  const d = daysUntil(nextCal);
  if (d === null)
    return <span className="text-xs text-brand-sage/50">Not set</span>;
  if (d < 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[9px] font-black text-red-700 uppercase">
        <AlertTriangle className="w-3 h-3" /> Overdue
      </span>
    );
  if (d <= 14)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-black text-amber-700 uppercase">
        <Clock className="w-3 h-3" /> {d}d
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black text-emerald-700 uppercase">
      <CheckCircle2 className="w-3 h-3" /> {d}d
    </span>
  );
};

const StatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 border-emerald-200 text-emerald-700",
    CALIBRATION_DUE: "bg-amber-50 border-amber-200 text-amber-700",
    INACTIVE: "bg-slate-50 border-slate-200 text-slate-500",
    OPERATIONAL: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded border text-[9px] font-black uppercase",
        map[status ?? ""] ?? map.INACTIVE,
      )}
    >
      {status || "Unknown"}
    </span>
  );
};

const StockBar: React.FC<{ qty?: number; min?: number }> = ({
  qty = 0,
  min = 0,
}) => {
  const max = Math.max(qty, min * 3, 10);
  const pct = Math.min(100, (qty / max) * 100);
  const low = qty <= min;
  const crit = qty <= min * 0.5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zenthar-graphite/50 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            crit ? "bg-red-500" : low ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={clsx(
          "text-xs font-bold font-mono w-10 text-right",
          crit
            ? "text-red-600"
            : low
              ? "text-amber-600"
              : "text-zenthar-text-primary",
        )}
      >
        {qty}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Instruments tab
// ─────────────────────────────────────────────

const InstrumentsTab: React.FC<{
  instruments: Instrument[];
  loading: boolean;
}> = ({ instruments, loading }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      !search
        ? instruments
        : instruments.filter((i) =>
            [i.name, i.model, i.serial_number].some((v) =>
              String(v ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()),
            ),
          ),
    [instruments, search],
  );

  const overdue = instruments.filter((i) => {
    const d = daysUntil(i.next_calibration);
    return d !== null && d < 0;
  }).length;
  const dueSoon = instruments.filter((i) => {
    const d = daysUntil(i.next_calibration);
    return d !== null && d >= 0 && d <= 14;
  }).length;
  const active = instruments.filter((i) => i.status === "ACTIVE").length;

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <MetricCard
          label="Total"
          value={instruments.length}
          icon={Wrench}
          variant="primary"
        />
        <MetricCard
          label="Active"
          value={active}
          icon={Activity}
          variant="success"
        />
        <MetricCard
          label="Due Soon"
          value={dueSoon}
          icon={Clock}
          variant="warning"
          trend="≤ 14 days"
        />
        <MetricCard
          label="Overdue"
          value={overdue}
          icon={AlertTriangle}
          variant="error"
        />
      </div>
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-7 py-4 border-b border-zenthar-steel flex items-center justify-between shrink-0">
          <span className="text-xs font-black text-zenthar-text-primary uppercase tracking-widest">
            Instrument Registry
          </span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/40" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-44"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <TableSkeleton rows={6} columns={6} />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 z-10">
                <tr className="border-b border-zenthar-steel">
                  {[
                    "Name",
                    "Model",
                    "Serial",
                    "Status",
                    "Last Cal.",
                    "Next Cal.",
                    "Health",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {filtered.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-zenthar-graphite/20 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-zenthar-text-primary">
                        {i.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-zenthar-text-secondary">
                        {i.model || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[10px] text-brand-sage">
                        {i.serial_number || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusChip status={i.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-mono text-zenthar-text-secondary">
                        {fmtDate(i.last_calibration)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-mono text-zenthar-text-secondary">
                        {fmtDate(i.next_calibration)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <CalBadge nextCal={i.next_calibration} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <p className="text-xs font-black text-brand-sage/60 uppercase">
                        No instruments found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-7 py-3 border-t border-zenthar-steel bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">
            {filtered.length} instruments
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Inventory tab
// ─────────────────────────────────────────────

const InventoryTab: React.FC<{
  inventory: InventoryItem[];
  loading: boolean;
}> = ({ inventory, loading }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expired">("all");

  const filtered = useMemo(() => {
    let items = inventory;
    if (filter === "low")
      items = items.filter((i) => (i.quantity ?? 0) <= (i.min_stock ?? 0));
    if (filter === "expired")
      items = items.filter(
        (i) => i.expiry_date && new Date(i.expiry_date) < new Date(),
      );
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        [i.name, i.type].some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    return items;
  }, [inventory, filter, search]);

  const lowCount = inventory.filter(
    (i) => (i.quantity ?? 0) <= (i.min_stock ?? 0),
  ).length;
  const expCount = inventory.filter(
    (i) => i.expiry_date && new Date(i.expiry_date) < new Date(),
  ).length;

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <MetricCard
          label="Total Items"
          value={inventory.length}
          icon={Package}
          variant="primary"
        />
        <MetricCard
          label="Low Stock"
          value={lowCount}
          icon={TrendingDown}
          variant="warning"
          trend="At or below min"
        />
        <MetricCard
          label="Expired"
          value={expCount}
          icon={AlertTriangle}
          variant="error"
        />
      </div>
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-7 py-4 border-b border-zenthar-steel flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex gap-1.5">
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
                {f === "all"
                  ? "All"
                  : f === "low"
                    ? `Low (${lowCount})`
                    : `Expired (${expCount})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-sage/40" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zenthar-void border border-zenthar-steel rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary w-36"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 z-10">
                <tr className="border-b border-zenthar-steel">
                  {[
                    "Item",
                    "Type",
                    "Stock Level",
                    "Min Stock",
                    "Expiry",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {filtered.map((item) => {
                  const isLow = (item.quantity ?? 0) <= (item.min_stock ?? 0);
                  const isExp =
                    item.expiry_date && new Date(item.expiry_date) < new Date();
                  return (
                    <tr
                      key={item.id}
                      className={clsx(
                        "hover:bg-zenthar-graphite/20 transition-colors",
                        (isLow || isExp) && "bg-red-50/20",
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-zenthar-text-primary">
                          {item.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-zenthar-text-secondary">
                          {item.type || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 w-40">
                        <StockBar qty={item.quantity} min={item.min_stock} />
                        <span className="text-[9px] font-mono text-brand-sage mt-0.5 block">
                          {item.quantity ?? 0} {item.unit || "units"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-brand-sage">
                          {item.min_stock ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={clsx(
                            "text-[10px] font-mono",
                            isExp
                              ? "text-red-600 font-bold"
                              : "text-zenthar-text-secondary",
                          )}
                        >
                          {fmtDate(item.expiry_date)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isExp ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 border border-red-200 text-[9px] font-black uppercase text-red-700">
                            Expired
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-200 text-[9px] font-black uppercase text-amber-700">
                            Low
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-black uppercase text-emerald-700">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="text-xs font-black text-brand-sage/60 uppercase">
                        No items found
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-7 py-3 border-t border-zenthar-steel bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">
            {filtered.length} items
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const AssetsFeature: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<AssetTab>("instruments");
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, invRes, lRes] = await Promise.allSettled([
        api.get<{ data: Instrument[] }>("/operational/instruments"),
        api.get<{ data: InventoryItem[] }>("/operational/inventory"),
        api.get<{ data: ProductionLine[] }>("/operational/production-lines"),
      ]);
      if (iRes.status === "fulfilled") setInstruments(iRes.value.data || []);
      if (invRes.status === "fulfilled") setInventory(invRes.value.data || []);
      if (lRes.status === "fulfilled") setLines(lRes.value.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const TABS = [
    {
      id: "instruments" as AssetTab,
      label: "Instruments",
      icon: Wrench,
      count: instruments.length,
    },
    {
      id: "equipment" as AssetTab,
      label: "Equipment",
      icon: Factory,
      count: lines.length,
    },
    {
      id: "inventory" as AssetTab,
      label: "Inventory",
      icon: Package,
      count: inventory.length,
    },
  ];

  return (
    <div className="flex flex-col h-full gap-5 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex gap-1.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white p-1.5 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                activeTab === tab.id
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-brand-sage hover:text-zenthar-text-primary hover:bg-zenthar-graphite/30",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span
                className={clsx(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded-md",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-zenthar-graphite/50 text-brand-sage",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={fetchAll}
          className="ml-auto p-2.5 bg-white/70 border border-white rounded-xl hover:bg-white transition-all"
          title="Refresh"
        >
          <RefreshCw
            className={clsx(
              "w-4 h-4 text-brand-sage",
              loading && "animate-spin",
            )}
          />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {activeTab === "instruments" && (
              <InstrumentsTab instruments={instruments} loading={loading} />
            )}
            {activeTab === "equipment" && (
              <div className="flex flex-col gap-4 h-full">
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <MetricCard
                    label="Production Lines"
                    value={lines.length}
                    icon={Factory}
                    variant="primary"
                  />
                  <MetricCard
                    label="Lines Configured"
                    value={`${lines.length} active`}
                    icon={Activity}
                    variant="secondary"
                  />
                </div>
                <div className="flex-1 bg-white/80 rounded-3xl border border-white overflow-hidden flex flex-col min-h-0">
                  <div className="px-7 py-4 border-b border-zenthar-steel shrink-0">
                    <span className="text-xs font-black text-zenthar-text-primary uppercase tracking-widest">
                      Production Lines
                    </span>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                      <TableSkeleton rows={5} columns={3} />
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white/95 z-10">
                          <tr className="border-b border-zenthar-steel">
                            {["ID", "Line Name", "Plant ID"].map((h) => (
                              <th
                                key={h}
                                className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-sage"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zenthar-steel/40">
                          {lines.map((line) => (
                            <tr
                              key={line.id}
                              className="hover:bg-zenthar-graphite/20 transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <span className="font-mono text-[10px] text-brand-sage">
                                  #{line.id}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="font-bold text-zenthar-text-primary">
                                  {line.name}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="text-xs text-zenthar-text-secondary">
                                  {line.plant_id || "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
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
