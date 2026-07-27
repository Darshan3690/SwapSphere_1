"use client";

import React from "react";
import { X, Gift, ShieldCheck, AlertOctagon, Star, Trash2, CheckCircle, Tag, DollarSign, Calendar, Copy } from "lucide-react";

export interface VoucherDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  brand?: string | null;
  couponCode?: string | null;
  couponExpiry?: string | null;
  price?: number | null;
  voucherValue?: number | null;
  status: string;
  verificationStatus: string;
  isFeatured: boolean;
  isSuspicious: boolean;
  isDeleted?: boolean;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    trustScore?: number;
  };
}

interface VoucherDetailDrawerProps {
  voucher: VoucherDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (voucherId: string, action: string) => Promise<void>;
}

export function VoucherDetailDrawer({ voucher, isOpen, onClose, onAction }: VoucherDetailDrawerProps) {
  if (!isOpen || !voucher) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center shadow-xs">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-slate-900 line-clamp-1">
                  {voucher.title}
                </h2>
                <p className="text-xs text-slate-500">Brand: {voucher.brand || "General"} • Category: {voucher.category}</p>
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
              voucher.isDeleted
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : voucher.verificationStatus === "Approved"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : voucher.verificationStatus === "Rejected"
                ? "bg-rose-100 text-rose-700 border border-rose-200"
                : "bg-amber-100 text-amber-700 border border-amber-200"
            }`}>
              {voucher.isDeleted ? "Soft-Deleted" : voucher.verificationStatus}
            </span>

            {voucher.isFeatured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                Featured Listing
              </span>
            )}

            {voucher.isSuspicious && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5" />
                Flagged Suspicious
              </span>
            )}
          </div>

          {/* Code Box */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>Voucher / Coupon Code</span>
              <button
                onClick={() => {
                  if (voucher.couponCode) {
                    navigator.clipboard.writeText(voucher.couponCode);
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-indigo-200 font-mono text-sm font-bold text-slate-900 tracking-wider text-center select-all">
              {voucher.couponCode || "• • • • • • • •"}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Voucher Value
              </div>
              <p className="text-base font-bold text-slate-900">${voucher.voucherValue || voucher.price || 0}</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Tag className="h-3.5 w-3.5 text-indigo-600" />
                Selling Price
              </div>
              <p className="text-base font-bold text-slate-900">${voucher.price || 0}</p>
            </div>
          </div>

          {/* Detailed Info Card */}
          <div className="space-y-3 rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 text-xs text-slate-700">
            <h3 className="font-heading font-bold text-slate-900 border-b border-slate-200 pb-2">Listing Metadata</h3>
            
            <div>
              <span className="text-slate-500 font-medium">Description:</span>
              <p className="mt-1 text-slate-800 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-200/60">
                {voucher.description || "No description provided."}
              </p>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Listed By:</span>
              <span className="font-semibold text-indigo-600">@{voucher.user?.username || "Unknown"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Seller Trust Score:</span>
              <span className="font-semibold text-slate-900">{voucher.user?.trustScore ?? 100}/100</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Expiry Date:</span>
              <span className="text-slate-700 font-medium">
                {voucher.couponExpiry ? new Date(voucher.couponExpiry).toLocaleDateString() : "No expiry"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Creation Date:</span>
              <span className="text-slate-600">{new Date(voucher.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAction(voucher.id, "approveVoucher")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {voucher.verificationStatus === "Approved" ? "Unapprove" : "Approve Listing"}
            </button>

            <button
              onClick={() => onAction(voucher.id, "featureVoucher")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition-colors"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
              {voucher.isFeatured ? "Unfeature" : "Feature Voucher"}
            </button>

            <button
              onClick={() => onAction(voucher.id, "flagSuspicious")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold transition-colors"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              {voucher.isSuspicious ? "Clear Flag" : "Flag Suspicious"}
            </button>

            <button
              onClick={() => onAction(voucher.id, "softDeleteVoucher")}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {voucher.isDeleted ? "Restore Voucher" : "Soft Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
