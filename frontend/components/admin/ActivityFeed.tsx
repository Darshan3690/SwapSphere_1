"use client";

import React from "react";
import { Activity, ShieldCheck, Gift, RefreshCw, UserPlus, FileText, AlertTriangle } from "lucide-react";

export interface ActivityItem {
  id: string;
  action: string;
  type?: "audit" | "user" | "voucher" | "trade" | "security";
  createdAt: string;
}

interface ActivityFeedProps {
  logs: ActivityItem[];
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  const getIcon = (type?: string, action?: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("ban") || act.includes("suspend") || act.includes("security")) {
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
    }
    if (act.includes("verify") || act.includes("approve") || act.includes("escrow")) {
      return <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />;
    }
    if (act.includes("voucher") || act.includes("item") || act.includes("coupon")) {
      return <Gift className="h-3.5 w-3.5 text-indigo-600" />;
    }
    if (act.includes("swap") || act.includes("trade")) {
      return <RefreshCw className="h-3.5 w-3.5 text-blue-600" />;
    }
    if (act.includes("user") || act.includes("signup")) {
      return <UserPlus className="h-3.5 w-3.5 text-purple-600" />;
    }
    return <FileText className="h-3.5 w-3.5 text-slate-500" />;
  };

  const sampleLogs: ActivityItem[] = [
    { id: "1", action: "User @alex_trader listed Amazon $50 Voucher", type: "voucher", createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
    { id: "2", action: "System verified double escrow deposit for Trade #tr_821", type: "security", createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { id: "3", action: "New user registered via Clerk: darshan.rajput369@gmail.com", type: "user", createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
    { id: "4", action: "Admin approved listing 'PVR Movie Ticket'", type: "audit", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: "5", action: "Trade completed between @john_doe and @sam_vouchers", type: "trade", createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  ];

  const displayLogs = logs && logs.length > 0 ? logs : sampleLogs;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-slate-900">Live Activity Feed</h3>
            <p className="text-[11px] text-slate-500">Real-time platform updates & admin audit trail</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {displayLogs.length} events
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1 space-y-2">
        {displayLogs.map((item) => (
          <div key={item.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/60 shrink-0 mt-0.5">
                {getIcon(item.type, item.action)}
              </div>
              <div>
                <p className="font-medium text-slate-800 leading-snug">{item.action}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} • {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
              Live
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
