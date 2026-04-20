/**
 * ZENTHAR RECHARTS — Real implementation
 * 
 * All components are re-exported directly from recharts.
 * The previous mock layer has been removed.
 * 
 * Add to package.json: "recharts": "^2.12.0"
 * Install: npm install recharts
 */
export {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ReferenceArea,
  Brush,
  ErrorBar,
  LabelList,
  Label,
  Text,
  Customized,
  Cross,
  Dot,
  Rectangle,
  Sector,
  Curve,
  Symbols,
  Layer,
  Surface,
  Sankey,
  Treemap,
  FunnelChart,
  Funnel,
  RadialBarChart,
  RadialBar,
} from "recharts";

// Re-export types for TypeScript consumers
export type {
  TooltipProps,
  LegendProps,
} from "recharts";