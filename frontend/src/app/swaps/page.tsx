"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import FadeUp from "@/components/FadeUp";
import { RefreshCw, MessageSquare, ArrowRightLeft, AlertCircle, Calendar, Tag } from "lucide-react";
import Link from "next/link";

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface ItemSummary {
  id: string;
  title: string;
  image_url: string | null;
}

interface SwapRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_item_id: string;
  receiver_item_id: string;
  status: string;
  created_at: string;
  sender_profile: Profile;
  receiver_profile: Profile;
  sender_item: ItemSummary;
  receiver_item: ItemSummary;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending:   { bg: "#fef3c7", text: "#92400e" },
  Accepted:  { bg: "#f0fdf4", text: "#166534" },
  Completed: { bg: "#eff6ff", text: "#1d4ed8" },
  Rejected:  { bg: "#fef2f2", text: "#991b1b" },
  Cancelled: { bg: "#f5f5f5", text: "#525252" },
};

export default function SwapsDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "history">("incoming");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  const fetchSwaps = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/swaps");
      if (!res.ok) throw new Error("Failed to load swaps");
      const data = await res.json();
      setSwaps(data || []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch swaps.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSwaps();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] flex-col items-center justify-center text-[#737373] gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[#111]" />
        <span className="text-xs">Authenticating...</span>
      </div>
    );
  }

  if (!user) return null;

  const incoming = swaps.filter(s => s.receiver_id === user.id && s.status === "Pending");
  const outgoing = swaps.filter(s => s.sender_id === user.id && s.status === "Pending");
  const history  = swaps.filter(s => s.status !== "Pending");

  const tabMap = { incoming, outgoing, history };
  const currentList = tabMap[activeTab];

  const TABS = [
    { id: "incoming" as const, label: "Incoming",  count: incoming.length },
    { id: "outgoing" as const, label: "Outgoing",  count: outgoing.length },
    { id: "history"  as const, label: "History",   count: history.length  },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 w-full">
        {/* ── Page header */}
        <div className="pt-10 pb-6 border-b border-[#e5e5e5]">
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">My Swaps</h1>
          <p className="mt-1 text-sm text-[#737373]">
            Review incoming requests and manage your active trades.
          </p>
        </div>

        {/* ── Tabs */}
        <div className="flex gap-6 border-b border-[#e5e5e5]">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-3 pt-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === id
                  ? "border-[#111] text-[#111]"
                  : "border-transparent text-[#737373] hover:text-[#111]"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="rounded-full bg-[#0a0a0a] px-1.5 py-px text-[9px] font-bold text-white leading-none">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Error */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b]">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── List */}
        <div className="py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-[#737373]">
              <RefreshCw className="h-4 w-4 animate-spin text-[#111]" />
              <span className="text-xs">Loading swaps...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-lg border border-dashed border-[#e5e5e5] bg-white">
              <ArrowRightLeft className="h-8 w-8 text-[#d4d4d4] stroke-[1.2] mb-3" />
              <p className="text-sm font-semibold text-[#111]">No swap requests</p>
              <p className="mt-1 text-xs text-[#737373] max-w-xs">
                {activeTab === "incoming"
                  ? "You haven't received any trade requests yet."
                  : activeTab === "outgoing"
                  ? "You haven't proposed any trades yet. Visit the Marketplace to get started."
                  : "No completed or past swaps yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((swap, i) => {
                const isIncoming = swap.receiver_id === user.id;
                const partner = isIncoming ? swap.sender_profile : swap.receiver_profile;
                const partnerItem = isIncoming ? swap.sender_item : swap.receiver_item;
                const myItem = isIncoming ? swap.receiver_item : swap.sender_item;
                const statusStyle = STATUS_STYLES[swap.status] ?? { bg: "#f5f5f5", text: "#525252" };

                return (
                  <FadeUp key={swap.id} delay={i * 0.05}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#e5e5e5] p-5 rounded-lg hover:border-[#d4d4d4] transition-colors">
                      {/* Items */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* My item thumbnail */}
                        <div className="shrink-0 h-12 w-12 rounded-md overflow-hidden bg-[#fafafa] border border-[#e5e5e5]">
                          {myItem?.image_url ? (
                            <img src={myItem.image_url} alt={myItem.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-[#d4d4d4]" />
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#fafafa]">
                          <ArrowRightLeft className="h-3 w-3 text-[#737373]" />
                        </div>

                        {/* Partner's item thumbnail */}
                        <div className="shrink-0 h-12 w-12 rounded-md overflow-hidden bg-[#fafafa] border border-[#e5e5e5]">
                          {partnerItem?.image_url ? (
                            <img src={partnerItem.image_url} alt={partnerItem.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-[#d4d4d4]" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#111] line-clamp-1">
                            {myItem?.title ?? "—"}{" "}
                            <span className="text-[#a3a3a3] font-normal">for</span>{" "}
                            {partnerItem?.title ?? "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: statusStyle.bg, color: statusStyle.text }}
                            >
                              {swap.status}
                            </span>
                            <span className="text-[10px] text-[#a3a3a3] flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(swap.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[10px] text-[#a3a3a3]">
                              @{partner?.username ?? "user"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/swaps/${swap.id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#262626] transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat &amp; Negotiate
                      </Link>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
