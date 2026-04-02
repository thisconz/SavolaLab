import React from 'react';

export const ResponsiveContainer: React.FC<any> = ({ children }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>;
export const BarChart: React.FC<any> = ({ children }) => <div className="flex items-end h-full gap-1">{children}</div>;
export const Bar: React.FC<any> = () => <div className="bg-blue-500 w-full h-1/2"></div>;
export const XAxis: React.FC<any> = () => null;
export const YAxis: React.FC<any> = () => null;
export const CartesianGrid: React.FC<any> = () => null;
export const Tooltip: React.FC<any> = () => null;
export const Legend: React.FC<any> = () => null;
export const LineChart: React.FC<any> = ({ children }) => <div className="flex items-end h-full gap-1">{children}</div>;
export const Line: React.FC<any> = () => <div className="bg-blue-500 w-full h-1/2"></div>;
export const PieChart: React.FC<any> = ({ children }) => <div className="flex items-center justify-center h-full">{children}</div>;
export const Pie: React.FC<any> = () => <div className="w-24 h-24 rounded-full bg-blue-500"></div>;
export const Cell: React.FC<any> = () => null;
export const AreaChart: React.FC<any> = ({ children }) => <div className="flex items-end h-full gap-1">{children}</div>;
export const Area: React.FC<any> = () => <div className="bg-blue-500 w-full h-1/2"></div>;
export const ComposedChart: React.FC<any> = ({ children }) => <div className="flex items-end h-full gap-1">{children}</div>;
