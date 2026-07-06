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

  const statusColors: Record<string, { bg: string; text: string }> = {
    Available:  { bg: "#f0fdf4", text: "#166534" },
    Pending:    { bg: "#fef3c7", text: "#92400e" },
    Swapped:    { bg: "#eff6ff", text: "#1d4ed8" },
    Cancelled:  { bg: "#fef2f2", text: "#991b1b" },
  };

  const statusStyle = statusColors[item.status] ?? { bg: "#f5f5f5", text: "#525252" };

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border border-[#e5e5e5] bg-white transition-all duration-200 hover:border-[#d4d4d4]"
      style={{ boxShadow: "none" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#fafafa] border-b border-[#e5e5e5]">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#d4d4d4]">
            {item.is_coupon ? (
              <Ticket className="h-9 w-9 stroke-[1]" />
            ) : (
              <Tag className="h-9 w-9 stroke-[1]" />
            )}
          </div>
        )}

        {/* Coupon badge */}
        {item.is_coupon && (
          <span className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-full bg-[#0a0a0a] px-2 py-0.5 text-[10px] font-medium text-white">
            <Ticket className="h-2.5 w-2.5" />
            Coupon
          </span>
        )}

        {/* Status badge (non-Available) */}
        {item.status !== "Available" && (
          <span
            className="absolute top-2.5 right-2.5 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {item.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        <span className="text-[10px] font-medium uppercase tracking-widest text-[#a3a3a3]">
          {item.category}
        </span>

        {/* Title */}
        <h3 className="mt-1 text-sm font-semibold text-[#111] leading-snug line-clamp-1">
          <Link href={`/items/${item.id}`}>
            <span className="absolute inset-0" />
            {item.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-[#737373] line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Expiry badge */}
        {item.is_coupon && daysLeft !== null && (
          <div
            className="mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium w-fit"
            style={{
              background: isExpiringSoon ? "#fef3c7" : "#f5f5f5",
              color: isExpiringSoon ? "#92400e" : "#737373",
            }}
          >
            <Clock className="h-2.5 w-2.5 flex-shrink-0" />
            {daysLeft < 0
              ? "Expired"
              : daysLeft === 0
              ? "Expires today"
              : `Exp. in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-[#f5f5f5] flex items-center justify-between mt-3">
          {/* Condition chip */}
          <span className="rounded-full border border-[#e5e5e5] px-2 py-0.5 text-[10px] font-medium text-[#737373]">
            {item.condition}
          </span>

          {/* Owner */}
          <div className="flex items-center gap-1.5">
            {item.profiles?.avatar_url ? (
              <img
                src={item.profiles.avatar_url}
                alt={item.profiles.username}
                className="h-4 w-4 rounded-full object-cover"
              />
            ) : (
              <div className="h-4 w-4 rounded-full bg-[#f5f5f5] border border-[#e5e5e5] flex items-center justify-center text-[7px] font-semibold text-[#737373]">
                {(item.profiles?.username ?? "U")[0].toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-[#a3a3a3]">
              @{item.profiles?.username ?? "user"}
            </span>
          </div>
        </div>

        {/* Swap preference */}
        {item.preferred_trade && (
          <div className="mt-2 flex items-center gap-1 text-[10px] text-[#737373]">
            <ArrowUpDown className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="line-clamp-1">{item.preferred_trade}</span>
          </div>
        )}
      </div>
    </div>
  );
}
