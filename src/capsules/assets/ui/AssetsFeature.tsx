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
  d ? new Date(d).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) : "—";

const CalBadge: React.FC<{ nextCal?: string }> = ({ nextCal }) => {
  const d = daysUntil(nextCal);
  if (d === null) return <span className="text-xs text-(--color-zenthar-text-muted)">Not set</span>;
  if (d < 0)
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                         bg-red-500/10 border border-red-500/20
                                         text-[9px] font-black text-red-400 uppercase"
      >
        <AlertTriangle className="w-3 h-3" /> Overdue
      </span>
    );
  if (d <= 14)
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                         bg-amber-500/10 border border-amber-500/20
                                         text-[9px] font-black text-amber-400 uppercase"
      >
        <Clock className="w-3 h-3" /> {d}d
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                           bg-emerald-500/10 border border-emerald-500/20
                           text-[9px] font-black text-emerald-400 uppercase"
    >
      <CheckCircle2 className="w-3 h-3" /> {d}d
    </span>
  );
};

const StatusChip: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    CALIBRATION_DUE: "bg-amber-500/10  border-amber-500/20  text-amber-400",
    INACTIVE: "bg-white/5       border-white/10       text-(--color-zenthar-text-muted)",
    OPERATIONAL: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded border text-[9px] font-black uppercase",
        map[status ?? ""] ?? map.INACTIVE,
      )}
    >
      {status ?? "Unknown"}
    </span>
  );
};

const StockBar: React.FC<{ qty?: number; min?: number }> = ({ qty = 0, min = 0 }) => {
  const max = Math.max(qty, min * 3, 10);
  const pct = Math.min(100, (qty / max) * 100);
  const low = qty <= min;
  const crit = qty <= min * 0.5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-(--color-zenthar-graphite) rounded-full overflow-hidden">
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
          crit ? "text-red-400" : low ? "text-amber-400" : "text-(--color-zenthar-text-primary)",
        )}
      >
        {qty}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Table wrapper
// ─────────────────────────────────────────────

const DataTable: React.FC<{
  headers: string[];
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}> = ({ headers, loading, empty, children }) => (
  <div
    className="flex-1 bg-(--color-zenthar-carbon) rounded-3xl border border-(--color-zenthar-steel)
                  overflow-hidden flex flex-col min-h-0"
  >
    {loading ? (
      <TableSkeleton rows={6} columns={headers.length} />
    ) : empty ? (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-(--color-zenthar-text-muted)">
        <Package className="w-10 h-10 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest">No records found</p>
      </div>
    ) : (
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-(--color-zenthar-carbon)/95 backdrop-blur-sm z-10">
            <tr className="border-b border-(--color-zenthar-steel)">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-[9px] font-black uppercase
                                       tracking-widest text-(--color-zenthar-text-muted)"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-zenthar-steel)/40">{children}</tbody>
        </table>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────
// Instruments tab
// ─────────────────────────────────────────────

const InstrumentsTab: React.FC<{ instruments: Instrument[]; loading: boolean }> = ({
  instruments,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return instruments;
    const q = search.toLowerCase();
    return instruments.filter((i) =>
      [i.name, i.model, i.serial_number].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [instruments, search]);

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
        <MetricCard label="Total" value={instruments.length} icon={Wrench} variant="primary" />
        <MetricCard label="Active" value={active} icon={Activity} variant="success" />
        <MetricCard
          label="Due Soon"
          value={dueSoon}
          icon={Clock}
          variant="warning"
          trend="≤ 14 days"
        />
        <MetricCard label="Overdue" value={overdue} icon={AlertTriangle} variant="error" />
      </div>

      <DataTable
        headers={["Name", "Model", "Serial", "Status", "Last Cal.", "Next Cal.", "Health"]}
        loading={loading}
        empty={filtered.length === 0}
      >
        {filtered.map((i) => (
          <tr key={i.id} className="hover:bg-(--color-zenthar-graphite)/30 transition-colors">
            <td className="px-5 py-3.5">
              <span className="font-bold text-(--color-zenthar-text-primary)">{i.name}</span>
            </td>
            <td className="px-5 py-3.5">
              <span className="text-xs text-(--color-zenthar-text-secondary)">
                {i.model ?? "—"}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <span className="font-mono text-[10px] text-(--color-zenthar-text-muted)">
                {i.serial_number ?? "—"}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <StatusChip status={i.status} />
            </td>
            <td className="px-5 py-3.5">
              <span className="text-[10px] font-mono text-(--color-zenthar-text-secondary)">
                {fmtDate(i.last_calibration)}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <span className="text-[10px] font-mono text-(--color-zenthar-text-secondary)">
                {fmtDate(i.next_calibration)}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <CalBadge nextCal={i.next_calibration} />
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
};

// ─────────────────────────────────────────────
// Inventory tab
// ─────────────────────────────────────────────

const InventoryTab: React.FC<{ inventory: InventoryItem[]; loading: boolean }> = ({
  inventory,
  loading,
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expired">("all");

  const filtered = useMemo(() => {
    let items = inventory;
    if (filter === "low") items = items.filter((i) => (i.quantity ?? 0) <= (i.min_stock ?? 0));
    if (filter === "expired")
      items = items.filter((i) => i.expiry_date && new Date(i.expiry_date) < new Date());
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

  const lowCount = inventory.filter((i) => (i.quantity ?? 0) <= (i.min_stock ?? 0)).length;
  const expCount = inventory.filter(
    (i) => i.expiry_date && new Date(i.expiry_date) < new Date(),
  ).length;

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <MetricCard label="Total Items" value={inventory.length} icon={Package} variant="primary" />
        <MetricCard
          label="Low Stock"
          value={lowCount}
          icon={TrendingDown}
          variant="warning"
          trend="At or below min"
        />
        <MetricCard label="Expired" value={expCount} icon={AlertTriangle} variant="error" />
      </div>

      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        {(["all", "low", "expired"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border",
              filter === f
                ? "bg-brand-primary border-brand-primary text-white"
                : "border-(--color-zenthar-steel) text-(--color-zenthar-text-muted) hover:border-brand-primary/30",
            )}
          >
            {f === "all" ? "All" : f === "low" ? `Low (${lowCount})` : `Expired (${expCount})`}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-(--color-zenthar-text-muted)" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) rounded-xl
                       pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-brand-primary
                       text-(--color-zenthar-text-primary) w-36"
          />
        </div>
      </div>

      <DataTable
        headers={["Item", "Type", "Stock", "Min Stock", "Expiry", "Status"]}
        loading={loading}
        empty={filtered.length === 0}
      >
        {filtered.map((item) => {
          const isLow = (item.quantity ?? 0) <= (item.min_stock ?? 0);
          const isExp = item.expiry_date && new Date(item.expiry_date) < new Date();
          return (
            <tr
              key={item.id}
              className={clsx(
                "hover:bg-(--color-zenthar-graphite)/30 transition-colors",
                (isLow || isExp) && "bg-red-500/3",
              )}
            >
              <td className="px-5 py-3.5">
                <span className="font-bold text-(--color-zenthar-text-primary)">{item.name}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs text-(--color-zenthar-text-secondary)">
                  {item.type ?? "—"}
                </span>
              </td>
              <td className="px-5 py-3.5 w-40">
                <StockBar qty={item.quantity} min={item.min_stock} />
                <span className="text-[9px] font-mono text-(--color-zenthar-text-muted) mt-0.5 block">
                  {item.quantity ?? 0} {item.unit ?? "units"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-mono text-(--color-zenthar-text-muted)">
                  {item.min_stock ?? "—"}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={clsx(
                    "text-[10px] font-mono",
                    isExp ? "text-red-400 font-bold" : "text-(--color-zenthar-text-secondary)",
                  )}
                >
                  {fmtDate(item.expiry_date)}
                </span>
              </td>
              <td className="px-5 py-3.5">
                {isExp ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black uppercase text-red-400">
                    Expired
                  </span>
                ) : isLow ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase text-amber-400">
                    Low
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400">
                    OK
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>
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
      if (iRes.status === "fulfilled") setInstruments((iRes.value as any).data ?? []);
      if (invRes.status === "fulfilled") setInventory((invRes.value as any).data ?? []);
      if (lRes.status === "fulfilled") setLines((lRes.value as any).data ?? []);
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
    { id: "equipment" as AssetTab, label: "Equipment", icon: Factory, count: lines.length },
    { id: "inventory" as AssetTab, label: "Inventory", icon: Package, count: inventory.length },
  ];

  return (
    <div
      className="flex flex-col h-full gap-5 overflow-hidden bg-(--color-zenthar-graphite)/30
                    p-2 rounded-3xl"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="flex gap-1 bg-(--color-zenthar-carbon) p-1 rounded-2xl
                        border border-(--color-zenthar-steel)"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                activeTab === tab.id
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                  : "text-(--color-zenthar-text-muted) hover:text-(--color-zenthar-text-primary) hover:bg-(--color-zenthar-graphite)",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span
                className={clsx(
                  "text-[9px] font-mono px-1.5 py-0.5 rounded-md",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-(--color-zenthar-graphite) text-(--color-zenthar-text-muted)",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={fetchAll}
          className="ml-auto p-2.5 bg-(--color-zenthar-carbon)
                                              border border-(--color-zenthar-steel) rounded-xl
                                              hover:border-brand-primary/30 transition-all"
          title="Refresh"
        >
          <RefreshCw
            className={clsx("w-4 h-4 text-(--color-zenthar-text-muted)", loading && "animate-spin")}
          />
        </button>
      </div>

      {/* Tab content */}
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
                    label="Active"
                    value={`${lines.length}`}
                    icon={Activity}
                    variant="success"
                  />
                </div>
                <DataTable
                  headers={["ID", "Line Name", "Plant ID"]}
                  loading={loading}
                  empty={lines.length === 0}
                >
                  {lines.map((line) => (
                    <tr
                      key={line.id}
                      className="hover:bg-(--color-zenthar-graphite)/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[10px] text-(--color-zenthar-text-muted)">
                          #{line.id}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-(--color-zenthar-text-primary)">
                          {line.name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-(--color-zenthar-text-secondary)">
                          {line.plant_id ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>
            )}
            {activeTab === "inventory" && <InventoryTab inventory={inventory} loading={loading} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

AssetsFeature.displayName = "AssetsFeature";
export default AssetsFeature;
