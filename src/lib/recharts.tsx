import React from "react";

/**
 * RECHARTS MOCK LAYER 
 * Purpose: Static render bypass for CI/CD or specialized HUD testing.
 */

// Container handles the group/chart classes from your widgets
export const ResponsiveContainer: React.FC<any> = ({ children, width, height }) => (
  <div style={{ width: width || "100%", height: height || "100%" }} className="recharts-mock-container">
    {children}
  </div>
);

// Flex layouts for Bar/Area/Composed to simulate chart flow
const ChartLayout: React.FC<any> = ({ children }) => (
  <div className="flex items-end w-full h-full gap-2 px-2 pb-6 relative">
    {children}
  </div>
);

export const BarChart = ChartLayout;
export const LineChart = ChartLayout;
export const AreaChart = ChartLayout;
export const ComposedChart = ChartLayout;

// Pie requires centering for your "Central HUD" readout
export const PieChart: React.FC<any> = ({ children }) => (
  <div className="relative flex items-center justify-center w-full h-full">
    {children}
  </div>
);

// Visual Mocks - Matches Zenthar proportions
export const Bar: React.FC<any> = ({ dataKey }) => (
  <div className="bg-brand-primary/40 w-full rounded-t-sm transition-all hover:bg-brand-primary" style={{ height: '60%' }} />
);

export const Area: React.FC<any> = () => (
  <div className="absolute inset-x-0 bottom-6 h-1/2 bg-linear-to-t from-brand-primary/20 to-brand-primary/5 border-t-2 border-brand-primary" />
);

export const Pie: React.FC<any> = () => (
  <div className="w-32 h-32 rounded-full border-12 border-brand-primary/20 flex items-center justify-center">
    <div className="w-20 h-20 rounded-full border-2 border-dashed border-brand-primary/10" />
  </div>
);

// No-op components to prevent React "not a function" errors
export const XAxis: React.FC<any> = () => null;
export const YAxis: React.FC<any> = () => null;
export const CartesianGrid: React.FC<any> = () => null;
export const Tooltip: React.FC<any> = () => null;
export const Legend: React.FC<any> = () => null;
export const Cell: React.FC<any> = () => null;
export const Line: React.FC<any> = () => <div className="absolute w-full h-0.5 bg-brand-primary top-1/2" />;