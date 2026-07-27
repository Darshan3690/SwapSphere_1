"use client";

import React from "react";
import { X, ShieldCheck, ShieldAlert, Ban, RefreshCw, UserCheck, Calendar, Star, Package, ArrowRightLeft } from "lucide-react";

export interface UserDetail {
  id: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  trustScore?: number;
  isVerified?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  role?: string;
  creditBalance?: number;
  freeBoosts?: number;
  referralCode?: string | null;
  updatedAt?: string;
  itemsCount?: number;
  swapsCount?: number;
}

interface UserDetailDrawerProps {
  user: UserDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (userId: string, action: string) => Promise<void>;
}

export function UserDetailDrawer({ user, isOpen, onClose, onAction }: UserDetailDrawerProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
                  @{user.username}
                  {user.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                </h2>
                <p className="text-xs text-slate-500">{user.fullName || "SwapSphere Trader"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Badges & Status */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              user.isBanned
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : user.isSuspended
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}>
              {user.isBanned ? "Banned" : user.isSuspended ? "Suspended" : "Active"}
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Role: {user.role || "USER"}
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 stroke-amber-500" />
              Trust Score: {user.trustScore ?? 100}/100
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Package className="h-3.5 w-3.5 text-indigo-600" />
                Vouchers Listed
              </div>
              <p className="text-lg font-bold text-slate-900">{user.itemsCount ?? "--"}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                Swaps Conducted
              </div>
              <p className="text-lg font-bold text-slate-900">{user.swapsCount ?? "--"}</p>
            </div>
          </div>

          {/* User Metadata Fields */}
          <div className="space-y-3 rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 text-xs text-slate-700">
            <h3 className="font-heading font-bold text-slate-900 border-b border-slate-200 pb-2">Account Metadata</h3>
            
            <div className="flex justify-between">
              <span className="text-slate-500">Clerk User ID:</span>
              <span className="font-mono text-[11px] font-semibold text-slate-900">{user.id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Credit Balance:</span>
              <span className="font-semibold text-emerald-600">${user.creditBalance || 0}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Free Boosts Left:</span>
              <span className="font-semibold text-slate-900">{user.freeBoosts || 0}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Referral Code:</span>
              <span className="font-mono font-semibold text-indigo-600">{user.referralCode || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Last Profile Update:</span>
              <span className="text-slate-600">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "Recently"}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction(user.id, "verifyUser")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {user.isVerified ? "Unverify" : "Verify Badge"}
            </button>

            <button
              onClick={() => onAction(user.id, "resetTrustScore")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Score (100)
            </button>

            <button
              onClick={() => onAction(user.id, "suspendUser")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {user.isSuspended ? "Unsuspend" : "Suspend User"}
            </button>

            <button
              onClick={() => onAction(user.id, "banUser")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <Ban className="h-3.5 w-3.5" />
              {user.isBanned ? "Unban User" : "Ban User"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
