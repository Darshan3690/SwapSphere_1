"use client";

import Link from "next/link";
import { Tag, Ticket, Clock, ArrowUpDown } from "lucide-react";

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  image_url: string | null;
  preferred_trade: string | null;
  status: string;
  is_coupon?: boolean;
  coupon_expiry?: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const getDaysUntilExpiry = (): number | null => {
    if (!item.is_coupon || !item.coupon_expiry) return null;
    const expiry = new Date(item.coupon_expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry();
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Available:  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    Pending:    { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    Swapped:    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Cancelled:  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  };

  const statusStyle = statusColors[item.status] ?? { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white transition-all duration-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Image / Thumbnail header */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100/70 border-b border-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
            {item.is_coupon ? (
              <Ticket className="h-10 w-10 stroke-[1.2] text-indigo-400/80" />
            ) : (
              <Tag className="h-10 w-10 stroke-[1.2] text-indigo-400/80" />
            )}
          </div>
        )}

        {/* Coupon badge */}
        {item.is_coupon && (
          <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
            <Ticket className="h-3 w-3" />
            Coupon
          </span>
        )}

        {/* Status badge (non-Available) */}
        {item.status !== "Available" && (
          <span
            className="absolute top-3 right-3 z-10 rounded-md border px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
          >
            {item.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            {item.category}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {item.condition}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading text-sm font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
          <Link href={`/items/${item.id}`}>
            <span className="absolute inset-0" />
            {item.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Expiry badge */}
        {item.is_coupon && daysLeft !== null && (
          <div
            className={`mt-3 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold w-fit border ${
              isExpiringSoon
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            <Clock className="h-3 w-3 flex-shrink-0" />
            {daysLeft < 0
              ? "Expired"
              : daysLeft === 0
              ? "Expires today"
              : `Exp. in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between mt-3">
          {/* Owner chip */}
          <div className="flex items-center gap-1.5">
            {item.profiles?.avatar_url ? (
              <img
                src={item.profiles.avatar_url}
                alt={item.profiles.username}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                {(item.profiles?.username ?? "U")[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-slate-500 font-medium">
              @{item.profiles?.username ?? "user"}
            </span>
          </div>
        </div>

        {/* Swap preference */}
        {item.preferred_trade && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <ArrowUpDown className="h-3 w-3 text-indigo-500 flex-shrink-0" />
            <span className="line-clamp-1 font-medium text-slate-600">Looking for: {item.preferred_trade}</span>
          </div>
        )}
      </div>
    </div>
  );
}
