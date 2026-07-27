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

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Pending:   { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Accepted:  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  Completed: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Rejected:  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  Cancelled: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
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
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Authenticating...</span>
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 mx-auto max-w-4xl px-4 sm:px-6 w-full py-8">
        {/* ── Page header */}
        <div className="pb-6 border-b border-slate-200/80">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">My Trade Requests</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage incoming barter proposals, outgoing offers, and past swap transactions.
          </p>
        </div>

        {/* ── Tabs */}
        <div className="flex gap-6 border-b border-slate-200/80">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-3 pt-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === id
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
              {count > 0 && (
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 leading-none">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Error */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── List */}
        <div className="py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading trade requests...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <ArrowRightLeft className="h-6 w-6 stroke-[1.5]" />
              </div>
              <p className="font-heading text-base font-bold text-slate-900">No swap requests</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                {activeTab === "incoming"
                  ? "You haven't received any trade requests yet."
                  : activeTab === "outgoing"
                  ? "You haven't proposed any trades yet. Visit the Marketplace to get started."
                  : "No completed or past swap transactions found."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {currentList.map((swap, i) => {
                const isIncoming = swap.receiver_id === user.id;
                const partner = isIncoming ? swap.sender_profile : swap.receiver_profile;
                const partnerItem = isIncoming ? swap.sender_item : swap.receiver_item;
                const myItem = isIncoming ? swap.receiver_item : swap.sender_item;
                const statusStyle = STATUS_STYLES[swap.status] ?? { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };

                return (
                  <FadeUp key={swap.id} delay={i * 0.05}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all">
                      {/* Items */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* My item thumbnail */}
                        <div className="shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {myItem?.image_url ? (
                            <img src={myItem.image_url} alt={myItem.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600">
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </div>

                        {/* Partner's item thumbnail */}
                        <div className="shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {partnerItem?.image_url ? (
                            <img src={partnerItem.image_url} alt={partnerItem.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Tag className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">
                            {myItem?.title ?? "—"}{" "}
                            <span className="text-slate-400 font-normal">for</span>{" "}
                            {partnerItem?.title ?? "—"}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span
                              className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                            >
                              {swap.status}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(swap.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              @{partner?.username ?? "user"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/swaps/${swap.id}`}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat &amp; Escrow Room
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
