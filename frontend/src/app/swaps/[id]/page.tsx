"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ChatWindow from "@/components/ChatWindow";
import { RefreshCw, AlertCircle, ArrowLeft, Check, X, ShieldAlert, Sparkles, Star, CheckCircle2 } from "lucide-react";
import EscrowPanel from "@/components/EscrowPanel";
import ReviewModal from "@/components/ReviewModal";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ItemDetails {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  condition: string;
  is_coupon: boolean;
  coupon_code: string | null;
  coupon_expiry: string | null;
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
  sender_item: ItemDetails;
  receiver_item: ItemDetails;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SwapNegotiation({ params }: PageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { id } = use(params);

  const [swap, setSwap] = useState<SwapRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const fetchSwapDetails = async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/swaps/${id}`);
      if (!response.ok) throw new Error("Failed to load swap details");

      const data = await response.json();
      setSwap(data);
    } catch (err: any) {
      console.error("Error loading swap negotiation:", err);
      setError("Failed to fetch negotiation details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchSwapDetails();
    }
  }, [user, id]);

  const handleUpdateStatus = async (newStatus: "Accepted" | "Rejected" | "Cancelled" | "Completed") => {
    if (!swap || !user || actionLoading) return;
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/swaps/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      await fetchSwapDetails();
    } catch (err: any) {
      console.error("Error updating swap status:", err);
      setError("Failed to update status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Loading negotiation room...</span>
      </div>
    );
  }

  if (!user) return null;

  if (error || !swap) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <AlertCircle className="h-10 w-10 text-red-600 mb-3" />
          <p className="text-sm font-semibold text-slate-700">{error || "Negotiation details not found"}</p>
          <Link href="/swaps" className="mt-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs">
            Back to My Swaps
          </Link>
        </main>
      </div>
    );
  }

  const isIncoming = swap.receiver_id === user.id;
  const partnerProfile = isIncoming ? swap.sender_profile : swap.receiver_profile;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-indigo-600 text-white border-indigo-600 font-bold";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "cancelled":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 w-full z-10">
        {/* Back link */}
        <Link
          href="/swaps"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Swaps
        </Link>

        {/* Header summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
          <div>
            <h1 className="font-heading text-xl font-bold flex items-center gap-2.5 text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span>Negotiation Room with @{partnerProfile.username}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Discuss exchange details, verify terms, and complete voucher transfers safely in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Proposal Status:</span>
            <span className={`rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getStatusBadge(swap.status)}`}>
              {swap.status}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Split Grid (Items side-by-side / Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Side-by-Side Items Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm">
              {/* Sender offered item */}
              <div className="flex flex-col border border-slate-200/80 p-4 rounded-xl bg-slate-50/70">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 font-heading">
                  {isIncoming ? "@" + swap.sender_profile.username + " Offers" : "My Offered Item"}
                </p>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-white border border-slate-200">
                  {swap.sender_item?.image_url ? (
                    <img src={swap.sender_item.image_url} alt={swap.sender_item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                  )}
                </div>
                <h3 className="font-heading text-sm font-bold text-slate-900 mt-4 line-clamp-1">{swap.sender_item?.title}</h3>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="text-[10px] uppercase text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">{swap.sender_item?.category}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span className="text-[10px] text-slate-500 font-semibold">{swap.sender_item?.condition}</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal line-clamp-3">{swap.sender_item?.description}</p>
              </div>

              {/* Receiver requested item */}
              <div className="flex flex-col border border-slate-200/80 p-4 rounded-xl bg-slate-50/70">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 font-heading">
                  {isIncoming ? "My Listing requested" : "Requested from @" + swap.receiver_profile.username}
                </p>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-white border border-slate-200">
                  {swap.receiver_item?.image_url ? (
                    <img src={swap.receiver_item.image_url} alt={swap.receiver_item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                  )}
                </div>
                <h3 className="font-heading text-sm font-bold text-slate-900 mt-4 line-clamp-1">{swap.receiver_item?.title}</h3>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="text-[10px] uppercase text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">{swap.receiver_item?.category}</span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span className="text-[10px] text-slate-500 font-semibold">{swap.receiver_item?.condition}</span>
                </div>
                <p className="text-xs text-slate-600 leading-normal line-clamp-3">{swap.receiver_item?.description}</p>
              </div>
            </div>

            {/* Action Console */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-sm">
              <h3 className="font-heading text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Check className="h-4 w-4 text-indigo-600" />
                <span>Trade Action Console</span>
              </h3>

              {actionLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Syncing request state...</span>
                </div>
              ) : swap.status === "Pending" ? (
                isIncoming ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You received this proposal. Discuss details in the chat and decide whether to accept or decline the trade.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateStatus("Accepted")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 py-3 text-xs font-semibold shadow-sm shadow-indigo-200 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        <span>Accept Proposal</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus("Rejected")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 py-3 text-xs font-semibold cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span>Decline Proposal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You proposed this swap. Discuss the trade with the seller. You can retract this request at any time.
                    </p>
                    <button
                      onClick={() => handleUpdateStatus("Cancelled")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 py-3 text-xs font-semibold transition-all border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      <X className="h-4 w-4" />
                      <span>Retract Proposal</span>
                    </button>
                  </div>
                )
              ) : swap.status === "Accepted" ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800 leading-relaxed font-medium">
                    <Check className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span>
                      This swap has been accepted! {swap.sender_item?.is_coupon || swap.receiver_item?.is_coupon
                        ? "Both parties must deposit their coupon codes into escrow below before completing the trade."
                        : "Chat to arrange a safe physical hand-off. Once you have exchanged items, mark the trade as Completed."}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdateStatus("Completed")}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 py-3.5 text-xs font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
                  >
                    <span>Complete Exchange &amp; Trade</span>
                  </button>
                </div>
              ) : swap.status === "Completed" ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed font-medium">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>
                      This exchange is complete! The items have been successfully swapped and codes released.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsReviewOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 py-3.5 text-xs font-bold shadow-sm transition-all cursor-pointer border border-amber-500"
                  >
                    <Star className="h-4 w-4 fill-white text-white" />
                    <span>Rate @{partnerProfile.username}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 leading-relaxed">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0 text-slate-400" />
                  <span>
                    This negotiation is inactive. The proposal was {swap.status.toLowerCase()}. Item listings associated with rejected or cancelled trades are back on the marketplace.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Chat Section */}
          <div className="lg:col-span-1">
            <ChatWindow swapRequestId={swap.id} />
          </div>
        </div>

        {/* Escrow Panel — shown only when swap is Accepted and at least one item is a coupon */}
        {swap.status === "Accepted" && (swap.sender_item?.is_coupon || swap.receiver_item?.is_coupon) && (
          <div className="mt-8">
            <EscrowPanel
              swapRequestId={swap.id}
              senderId={swap.sender_id}
              receiverId={swap.receiver_id}
              senderItemId={swap.sender_item_id}
              receiverItemId={swap.receiver_item_id}
              senderItemTitle={swap.sender_item?.title || ""}
              receiverItemTitle={swap.receiver_item?.title || ""}
              senderIsCoupon={!!swap.sender_item?.is_coupon}
              receiverIsCoupon={!!swap.receiver_item?.is_coupon}
              senderCouponCode={swap.sender_item?.coupon_code}
              receiverCouponCode={swap.receiver_item?.coupon_code}
              senderCouponExpiry={swap.sender_item?.coupon_expiry}
              receiverCouponExpiry={swap.receiver_item?.coupon_expiry}
            />
          </div>
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          revieweeId={partnerProfile.id}
          revieweeUsername={partnerProfile.username}
        />
      </main>
    </div>
  );
}
