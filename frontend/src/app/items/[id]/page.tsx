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
  Copy,
  Check,
  CheckCircle2,
  Ticket
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
          color: "#4f46e5", // SaaS indigo primary theme
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "like new":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "good":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "fair":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Loading coupon details...</span>
      </div>
    );
  }

  if (!user) return null;

  if (error || !item) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <AlertCircle className="h-10 w-10 text-red-600 mb-3 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-700">{error || "Item not found"}</p>
          <Link href="/dashboard" className="mt-4 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs">
            Back to Marketplace
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = item.user_id === user.id;
  const price = getPrice();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 sm:px-6 w-full">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Marketplace
        </Link>

        {/* Content Card Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-sm">
          
          {/* Left: Image & Owner Profile Card */}
          <div className="space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100/70 border border-slate-200/80">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                  <Ticket className="h-14 w-14 stroke-[1.2] text-indigo-400/80" />
                </div>
              )}
            </div>

            {/* Owner Profile Card */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
              {item.profiles?.avatar_url ? (
                <img src={item.profiles.avatar_url} alt={item.profiles.username} className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
              )}
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified Seller</p>
                <p className="text-xs font-bold text-slate-900">@{item.profiles?.username || "user"}</p>
              </div>
            </div>
          </div>

          {/* Right: Details & Action Buttons */}
          <div className="flex flex-col justify-between">
            <div className="space-y-5">
              {/* Category & Status Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  {item.category}
                </span>
                <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </span>
                {item.status !== "Available" && (
                  <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {item.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl font-bold text-slate-900 leading-tight">{item.title}</h1>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Listed on {new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              {/* Description */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>

              {/* Wanted in exchange */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Looking for in exchange:</span>
                </h3>
                <p className="text-xs text-slate-900 font-bold">
                  {item.preferred_trade || "Open to any trade proposals!"}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
              {/* If purchased code is available (celebration card) */}
              {purchasedCode ? (
                <FadeUp>
                  <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50/60 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                      <span>Direct Purchase Successful!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Your payment of <strong>₹{price}</strong> has been confirmed. The coupon code is shown below:
                    </p>
                    <div className="rounded-lg border border-emerald-200 bg-white p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block mb-0.5">Coupon Code</span>
                        <code className="text-base font-mono font-extrabold text-slate-900 tracking-wider">
                          {purchasedCode}
                        </code>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                    {purchasedExpiry && (
                      <p className="text-[10px] text-emerald-700 font-medium">
                        Valid Expiry Date: {new Date(purchasedExpiry).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </FadeUp>
              ) : isOwner ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    Edit Listing
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    disabled={deleting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 py-3 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
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
                    className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-200"
                  >
                    Propose a Swap
                  </button>

                  {/* Razorpay Buy Directly Button */}
                  <button
                    onClick={handleBuyDirectly}
                    disabled={item.status !== "Available" || buying}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {buying ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
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
