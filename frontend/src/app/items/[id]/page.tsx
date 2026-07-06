"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import SwapModal from "@/components/SwapModal";
import EditListingModal from "@/components/EditListingModal";
import {
  Tag,
  RefreshCw,
  AlertCircle,
  Trash2,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  CreditCard,
  Lock,
  Unlock,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import FadeUp from "@/components/FadeUp";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  image_url: string | null;
  preferred_trade: string | null;
  status: string;
  created_at: string;
  profiles?: Profile;
  price?: number | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let _scriptPromise: Promise<any> | null = null;

function loadRazorpay(): Promise<any> {
  if (_scriptPromise) return _scriptPromise;

  _scriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () => {
      _scriptPromise = null;
      reject(new Error("Failed to load Razorpay checkout script."));
    };
    document.body.appendChild(script);
  });

  return _scriptPromise;
}

export default function ItemDetail({ params }: PageProps) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { id } = use(params);

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Purchase details state
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
  const [purchasedExpiry, setPurchasedExpiry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  const fetchItemDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch item details.");
      }
      const data = await response.json();
      setItem(data);
    } catch (err: any) {
      console.error("Error loading item details:", err);
      setError("Failed to load item details. It might have been deleted.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchItemDetails();
    }
  }, [user, id]);

  const handleDeleteItem = async () => {
    if (!item || !user || deleting) return;
    if (!confirm("Are you sure you want to delete this listing?")) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete item.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item listing: " + err.message);
      setDeleting(false);
    }
  };

  const handleSwapSuccess = (swapRequestId: string) => {
    setIsSwapModalOpen(false);
    router.push(`/swaps/${swapRequestId}`);
  };

  // Get price (use user's custom price if set, else fall back to dynamic keywords)
  const getPrice = () => {
    if (!item) return 99;
    if (item.price !== undefined && item.price !== null) return item.price;
    const text = (item.title + " " + item.description).toLowerCase();
    if (text.includes("500") || text.includes("five hundred")) return 149;
    if (text.includes("200") || text.includes("two hundred")) return 79;
    if (text.includes("50%") || text.includes("half")) return 99;
    return 49; // standard fallback price
  };

  const handleBuyDirectly = async () => {
    if (!item || !user || buying) return;
    setBuying(true);
    setError(null);

    const price = getPrice();

    try {
      const Razorpay = await loadRazorpay();

      const options = {
        key: "rzp_test_SXqyHCiTeBNWF1", // Test key loaded from CC_website
        amount: price * 100, // In Paise (100 paise = 1 INR)
        currency: "INR",
        name: "SwapSphere Premium",
        description: `Direct Purchase: ${item.title}`,
        handler: async function (response: any) {
          try {
            const buyRes = await fetch(`/api/items/${item.id}/buy`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id,
                amountPaid: price,
              }),
            });

            if (!buyRes.ok) {
              const errData = await buyRes.json();
              throw new Error(errData.error || "Failed to finalize purchase.");
            }

            const data = await buyRes.json();
            setPurchasedCode(data.couponCode);
            setPurchasedExpiry(data.couponExpiry);
            
            // Mark item status as Sold locally
            setItem(prev => prev ? { ...prev, status: "Sold" } : null);
          } catch (err: any) {
            setError(err.message || "Payment successful, but failed to retrieve code. Please contact support.");
          } finally {
            setBuying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setBuying(false);
          },
        },
        prefill: {
          name: profile?.username || "",
          email: "",
        },
        theme: {
          color: "#0a0a0a", // Match minimalist SwapSphere styling
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay initialization error:", err);
      setError("Failed to open payment gateway. Please check your internet connection.");
      setBuying(false);
    }
  };

  const handleCopyCode = () => {
    if (!purchasedCode) return;
    navigator.clipboard.writeText(purchasedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "new":
        return "bg-emerald-50 text-emerald-800 border-emerald-250";
      case "like new":
        return "bg-teal-50 text-teal-800 border-teal-250";
      case "good":
        return "bg-sky-50 text-sky-800 border-sky-250";
      case "fair":
        return "bg-amber-50 text-amber-900 border-amber-250";
      default:
        return "bg-white text-[#737373] border-[#e5e5e5]";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] flex-col items-center justify-center text-[#737373] gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[#111]" />
        <span className="text-xs">Loading item details...</span>
      </div>
    );
  }

  if (!user) return null;

  if (error || !item) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <AlertCircle className="h-8 w-8 text-[#991b1b] mb-3 stroke-[1.5]" />
          <p className="text-sm font-semibold text-[#737373]">{error || "Item not found"}</p>
          <Link href="/dashboard" className="mt-4 rounded-lg bg-white border border-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#111] hover:bg-[#fafafa] transition-colors">
            Back to Marketplace
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = item.user_id === user.id;
  const price = getPrice();

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 sm:px-6 w-full">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#111] transition-colors mb-6"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Marketplace
        </Link>

        {/* Content Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-[#e5e5e5] p-6 sm:p-8 rounded-lg">
          
          {/* Left: Image & Owner */}
          <div className="space-y-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-[#fafafa] border border-[#e5e5e5]">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#d4d4d4]">
                  <Tag className="h-12 w-12 stroke-[1.2]" />
                </div>
              )}
            </div>

            {/* Owner Section */}
            <div className="flex items-center gap-3 bg-[#fafafa] border border-[#e5e5e5] p-4 rounded-lg">
              {item.profiles?.avatar_url ? (
                <img src={item.profiles.avatar_url} alt={item.profiles.username} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#737373]">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="text-[10px] text-[#a3a3a3] font-semibold uppercase tracking-wider">Posted By</p>
                <p className="text-xs font-bold text-[#111]">@{item.profiles?.username || "user"}</p>
              </div>
            </div>
          </div>

          {/* Right: Details & Buying options */}
          <div className="flex flex-col justify-between">
            <div className="space-y-5">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                  {item.category}
                </span>
                <span className="h-1 w-1 rounded-full bg-[#e5e5e5]" />
                <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </span>
                {item.status !== "Available" && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[#e5e5e5]" />
                    <span className="rounded bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {item.status}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-[#111] leading-tight">{item.title}</h1>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                <Calendar className="h-3.5 w-3.5 text-[#a3a3a3]" />
                <span>Listed on {new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              <div className="border-t border-[#e5e5e5] pt-4">
                <h3 className="text-[10px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-2">Description</h3>
                <p className="text-xs text-[#737373] leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>

              {/* Wanted in exchange */}
              <div className="p-4 rounded-lg bg-[#fafafa] border border-[#e5e5e5]">
                <h3 className="text-[9px] font-semibold text-[#a3a3a3] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-[#a3a3a3]" />
                  <span>Looking for in exchange:</span>
                </h3>
                <p className="text-xs text-[#111] font-bold">
                  {item.preferred_trade || "Open to any trade proposals!"}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 border-t border-[#e5e5e5] mt-6 space-y-3">
              {/* If purchased code is available (celebration card) */}
              {purchasedCode ? (
                <FadeUp>
                  <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50/50 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Direct Purchase Successful!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Your payment of <strong>₹{price}</strong> has been confirmed. The coupon details have been revealed below:
                    </p>
                    <div className="rounded border border-emerald-250 bg-white p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">Coupon Code</span>
                        <code className="text-sm font-mono font-bold text-emerald-950 tracking-wider">
                          {purchasedCode}
                        </code>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy Code"}
                      </button>
                    </div>
                    {purchasedExpiry && (
                      <p className="text-[10px] text-emerald-600">
                        Expires: {new Date(purchasedExpiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </FadeUp>
              ) : isOwner ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-white py-3 text-xs font-semibold text-[#111] hover:bg-[#fafafa] transition-colors cursor-pointer"
                  >
                    Edit Listing
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 py-3 text-xs font-semibold text-[#991b1b] hover:bg-[#fef2f2] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{deleting ? "Deleting..." : "Delete Listing"}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Swap Button */}
                  <button
                    onClick={() => setIsSwapModalOpen(true)}
                    disabled={item.status !== "Available"}
                    className="w-full rounded-lg border border-[#e5e5e5] bg-white py-3 text-xs font-semibold text-[#111] hover:bg-[#fafafa] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Propose a Swap
                  </button>

                  {/* Razorpay Buy Directly Button */}
                  <button
                    onClick={handleBuyDirectly}
                    disabled={item.status !== "Available" || buying}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#0a0a0a] py-3 text-xs font-semibold text-white hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {buying ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5" />
                    )}
                    <span>{buying ? "Processing..." : `Buy for ₹${price}`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Swap Modal */}
      {item && (
        <SwapModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          receiverId={item.user_id}
          receiverItemId={item.id}
          receiverItemTitle={item.title}
          onSuccess={handleSwapSuccess}
        />
      )}

      {/* Edit Listing Modal */}
      {item && isOwner && (
        <EditListingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          item={{
            ...item,
            preferred_trade: item.preferred_trade,
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchItemDetails();
          }}
        />
      )}
    </div>
  );
}
