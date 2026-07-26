"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { Upload, AlertCircle, RefreshCw, ArrowLeft, Info, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Electronics", "Books", "Fashion", "Home", "Games", "Sports", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-heading">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs";

export default function NewItem() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [condition, setCondition] = useState("Good");
  const [preferredTrade, setPreferredTrade] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [price, setPrice] = useState("");

  const [listingType, setListingType] = useState<"SWAP_ONLY" | "SELL_ONLY" | "SWAP_AND_SELL">("SWAP_ONLY");
  const [sellingPrice, setSellingPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [voucherValue, setVoucherValue] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  // Clean up object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, JPEG).");
      return;
    }
    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = (): boolean => {
    if (!title.trim()) { setError("Please enter a coupon/deal name."); return false; }
    if (!description.trim()) { setError("Please add a description."); return false; }
    if (!couponCode.trim()) { setError("Please enter the coupon code."); return false; }
    if (!couponExpiry) { setError("Please set an expiry date."); return false; }
    if (listingType !== "SWAP_ONLY" && !sellingPrice.trim()) { setError("Please enter a selling price."); return false; }

    const expiry = new Date(couponExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry <= today) {
      setError("Coupon expiry date must be in the future. Expired coupons cannot be listed.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setError(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || "Failed to upload image.");
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      }

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          imageUrl,
          preferredTrade: listingType !== "SELL_ONLY" ? (preferredTrade.trim() || null) : null,
          couponCode: couponCode.trim().toUpperCase(),
          couponExpiry,
          price: listingType !== "SWAP_ONLY" && sellingPrice.trim() ? parseInt(sellingPrice.trim(), 10) : null,
          listingType,
          sellingPrice: listingType !== "SWAP_ONLY" && sellingPrice.trim() ? parseInt(sellingPrice.trim(), 10) : null,
          brand: brand.trim() || null,
          voucherValue: voucherValue.trim() ? parseInt(voucherValue.trim(), 10) : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create listing.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Authenticating...</span>
      </div>
    );
  }

  if (!user) return null;

  const minExpiry = new Date();
  minExpiry.setDate(minExpiry.getDate() + 1);
  const minExpiryStr = minExpiry.toISOString().split("T")[0];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 mx-auto max-w-2xl px-4 sm:px-6 w-full py-8">
        {/* ── Page header */}
        <div className="pb-6 border-b border-slate-200/80">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Marketplace
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">List a Coupon</h1>
          <p className="mt-1 text-xs text-slate-500">
            Fill in the details to add your voucher or promo code to the marketplace.
          </p>
        </div>

        {/* ── Error banner */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Form */}
        <form onSubmit={handleSubmit} className="py-8 space-y-6">

          {/* Secret Code details card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-5 shadow-xs">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl bg-indigo-50/70 border border-indigo-100 p-3.5 text-xs text-indigo-900 leading-relaxed">
              <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-indigo-600" />
              <span>
                Your secret coupon code is stored securely in SwapSphere's double escrow protocol and will only be revealed after a trade is agreed upon.
              </span>
            </div>

            {/* Listing Type */}
            <div>
              <FieldLabel>Listing Type <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
              <select
                value={listingType}
                onChange={e => setListingType(e.target.value as any)}
                className={`${inputCls} cursor-pointer font-medium`}
              >
                <option value="SWAP_ONLY">Swap Only (Barter for another coupon)</option>
                <option value="SELL_ONLY">Sell Only (Purchase via Razorpay)</option>
                <option value="SWAP_AND_SELL">Swap &amp; Sell (Both options enabled)</option>
              </select>
            </div>

            {/* Coupon Code */}
            <div>
              <FieldLabel>Coupon Code <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
              <input
                type="text"
                required
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE50, FLAT200OFF"
                className={`${inputCls} font-mono uppercase font-bold text-slate-900`}
              />
            </div>

            {/* Expiry */}
            <div>
              <FieldLabel>Expiry Date <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
              <input
                type="date"
                required
                value={couponExpiry}
                min={minExpiryStr}
                onChange={e => setCouponExpiry(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Only active, future-dated coupons can be listed on the marketplace.
              </p>
            </div>

            {/* Selling Price (Conditional) */}
            {listingType !== "SWAP_ONLY" && (
              <div>
                <FieldLabel>Selling Price (INR) <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
                <input
                  type="number"
                  min="1"
                  required
                  value={sellingPrice}
                  onChange={e => setSellingPrice(e.target.value)}
                  placeholder="e.g. 99, 149"
                  className={inputCls}
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  The price other swappers will pay to buy this coupon directly.
                </p>
              </div>
            )}
          </div>

          {/* Listing details card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-5 shadow-xs">
            {/* Title */}
            <div>
              <FieldLabel>Deal / Voucher Name <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Flat 50% Off Powerbank, BookMyShow ₹200 Off"
                className={inputCls}
              />
            </div>

            {/* Category & Condition row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Category</FieldLabel>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Condition</FieldLabel>
                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Brand & Voucher Value row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Brand / Platform</FieldLabel>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="e.g. Amazon, Swiggy, Uber"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>Voucher Worth Value (INR)</FieldLabel>
                <input
                  type="number"
                  min="1"
                  value={voucherValue}
                  onChange={e => setVoucherValue(e.target.value)}
                  placeholder="e.g. 500, 1000"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description <span className="text-red-500 normal-case tracking-normal">*</span></FieldLabel>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the coupon details — what brand, discount percentage/amount, restrictions or minimum spend requirement."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Preferred Trade */}
            {listingType !== "SELL_ONLY" && (
              <div>
                <FieldLabel>Wanted in exchange <span className="text-slate-400 normal-case tracking-normal font-normal">(optional)</span></FieldLabel>
                <input
                  type="text"
                  value={preferredTrade}
                  onChange={e => setPreferredTrade(e.target.value)}
                  placeholder="e.g. Swiggy coupon, Zomato discount, Steam key"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Image upload card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
            <FieldLabel>Coupon Banner / Brand Screenshot <span className="text-slate-400 normal-case tracking-normal font-normal">(optional)</span></FieldLabel>

            {imagePreview ? (
              <div className="relative mt-3 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2.5 right-2.5 rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-3 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50/70 rounded-xl p-8 hover:bg-slate-100/50 hover:border-indigo-300 cursor-pointer transition-all">
                <Upload className="h-8 w-8 text-indigo-500 mb-2 stroke-[1.5]" />
                <span className="text-xs font-semibold text-slate-700">Click to upload voucher image</span>
                <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, JPEG — maximum 5 MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
            {loading ? "Publishing Listing..." : "Publish Listing"}
          </button>
        </form>
      </main>
    </div>
  );
}
