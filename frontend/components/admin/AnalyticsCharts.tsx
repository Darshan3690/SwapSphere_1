"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface BrandData {
  name: string;
  count: number;
}

interface TopSellerData {
  username: string;
  trustScore: number;
}

interface AnalyticsChartsProps {
  categoryDistribution: CategoryData[];
  brandRanking: BrandData[];
  topSellers: TopSellerData[];
}

const COLORS = ["#4F46E5", "#2563EB", "#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

// Timeline mock growth data
const growthData = [
  { name: "Mon", Users: 120, Trades: 45, Revenue: 320 },
  { name: "Tue", Users: 190, Trades: 80, Revenue: 540 },
  { name: "Wed", Users: 300, Trades: 140, Revenue: 980 },
  { name: "Thu", Users: 420, Trades: 210, Revenue: 1450 },
  { name: "Fri", Users: 680, Trades: 380, Revenue: 2600 },
  { name: "Sat", Users: 950, Trades: 590, Revenue: 4100 },
  { name: "Sun", Users: 1248, Trades: 820, Revenue: 5800 },
];

export function GrowthAreaChart() {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTrades" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
              fontWeight: 600,
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Area type="monotone" dataKey="Users" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
          <Area type="monotone" dataKey="Trades" stroke="#0EA5E9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrades)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  const chartData = data && data.length > 0 ? data : [
    { name: "Electronics", value: 40 },
    { name: "Fashion", value: 25 },
    { name: "Gaming", value: 20 },
    { name: "Entertainment", value: 15 },
  ];

  return (
    <div className="w-full h-72 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BrandBarChart({ data }: { data: BrandData[] }) {
  const chartData = data && data.length > 0 ? data : [
    { name: "Amazon", count: 42 },
    { name: "Flipkart", count: 35 },
    { name: "Swiggy", count: 28 },
    { name: "Netflix", count: 19 },
    { name: "Steam", count: 14 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopSellersBarChart({ data }: { data: TopSellerData[] }) {
  const chartData = data && data.length > 0 ? data : [
    { username: "darshan_admin", trustScore: 100 },
    { username: "alex_trader", trustScore: 95 },
    { username: "crypto_sam", trustScore: 88 },
  ];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} domain={[0, 100]} />
          <YAxis dataKey="username" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} width={90} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#E2E8F0",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="trustScore" fill="#10B981" radius={[0, 6, 6, 0]} name="Trust Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
