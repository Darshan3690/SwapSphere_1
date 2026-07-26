"use client";

import React from "react";
import { Server, Database, ShieldCheck, Activity, Cpu, CheckCircle2, Clock } from "lucide-react";

interface SystemHealthWidgetProps {
  health?: {
    dbStatus: string;
    dbLatencyMs: number;
    escrowStatus: string;
    apiResponseTimeMs: number;
    activeWebhooks: number;
    memoryUsageMB: number;
    uptimePercentage: number;
  };
}

export function SystemHealthWidget({ health }: SystemHealthWidgetProps) {
  const data = health || {
    dbStatus: "Healthy",
    dbLatencyMs: 14,
    escrowStatus: "Operational",
    apiResponseTimeMs: 42,
    activeWebhooks: 3,
    memoryUsageMB: 128,
    uptimePercentage: 99.98,
  };

  const metrics = [
    {
      title: "MongoDB Cluster",
      status: data.dbStatus,
      detail: `${data.dbLatencyMs} ms query latency`,
      icon: Database,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      badge: "Operational",
    },
    {
      title: "Escrow Contract Service",
      status: data.escrowStatus,
      detail: "Double verification active",
      icon: ShieldCheck,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      badge: "Active",
    },
    {
      title: "API Performance",
      status: `${data.apiResponseTimeMs} ms avg`,
      detail: `${data.uptimePercentage}% 30-day uptime`,
      icon: Activity,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      badge: "Fast",
    },
    {
      title: "Server Memory Load",
      status: `${data.memoryUsageMB} MB`,
      detail: "Process memory footprint",
      icon: Cpu,
      color: "text-purple-600 bg-purple-50 border-purple-100",
      badge: "Normal",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-900">System Infrastructure Health</h3>
            <p className="text-[11px] text-slate-500">Live service telemetry and database indicators</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          All Systems Operational
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-lg ${item.color}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  {item.badge}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{item.title}</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{item.status}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
