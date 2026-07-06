"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { Upload, AlertCircle, RefreshCw, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["Electronics", "Books", "Fashion", "Home", "Games", "Sports", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1.5">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg bg-white border border-[#e5e5e5] px-4 py-2.5 text-sm text-[#111] placeholder-[#a3a3a3] focus:outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-colors";

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
          preferredTrade: preferredTrade.trim() || null,
          couponCode: couponCode.trim().toUpperCase(),
          couponExpiry,
          price: price.trim() ? parseInt(price.trim(), 10) : null,
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
      <div className="flex min-h-screen bg-[#fafafa] flex-col items-center justify-center text-[#737373] gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[#111]" />
        <span className="text-xs">Authenticating...</span>
      </div>
    );
  }

  if (!user) return null;

  const minExpiry = new Date();
  minExpiry.setDate(minExpiry.getDate() + 1);
  const minExpiryStr = minExpiry.toISOString().split("T")[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-2xl px-4 sm:px-6 w-full">
        {/* ── Page header */}
        <div className="pt-10 pb-6 border-b border-[#e5e5e5]">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#111] transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Marketplace
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#111]">List a Coupon</h1>
          <p className="mt-1 text-sm text-[#737373]">
            Fill in the details to add your coupon to the marketplace.
          </p>
        </div>

        {/* ── Error banner */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b]">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Form */}
        <form onSubmit={handleSubmit} className="py-8 space-y-6">

          {/* Coupon details card */}
          <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-5">
            {/* Info banner */}
            <div className="flex items-start gap-2.5 rounded-md bg-[#fafafa] border border-[#e5e5e5] p-3 text-[11px] text-[#737373]">
              <Info className="h-3.5 w-3.5 mt-px flex-shrink-0 text-[#a3a3a3]" />
              <span>
                Your coupon code is stored securely and only shared with the other party once both sides have confirmed the swap.
              </span>
            </div>

            {/* Coupon Code */}
            <div>
              <FieldLabel>Coupon Code <span className="text-[#991b1b] normal-case tracking-normal">*</span></FieldLabel>
              <input
                type="text"
                required
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE50, FLAT200OFF"
                className={`${inputCls} font-mono uppercase`}
              />
            </div>

            {/* Expiry */}
            <div>
              <FieldLabel>Expiry Date <span className="text-[#991b1b] normal-case tracking-normal">*</span></FieldLabel>
              <input
                type="date"
                required
                value={couponExpiry}
                min={minExpiryStr}
                onChange={e => setCouponExpiry(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-[#a3a3a3]">
                Only future-dated coupons can be listed.
              </p>
            </div>

            {/* Price (Optional) */}
            <div>
              <FieldLabel>Direct Buy Price (INR) (Optional)</FieldLabel>
              <input
                type="number"
                min="1"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="e.g. 99, 149 (leave empty if swap-only)"
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-[#a3a3a3]">
                Set a price if you want other swappers to buy this coupon instantly via Razorpay.
              </p>
            </div>
          </div>

          {/* Listing details card */}
          <div className="rounded-lg border border-[#e5e5e5] bg-white p-6 space-y-5">
            {/* Title */}
            <div>
              <FieldLabel>Deal Name <span className="text-[#991b1b] normal-case tracking-normal">*</span></FieldLabel>
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

            {/* Description */}
            <div>
              <FieldLabel>Description <span className="text-[#991b1b] normal-case tracking-normal">*</span></FieldLabel>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the coupon — what brand/platform, what discount, any restrictions or T&C."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Preferred Trade */}
            <div>
              <FieldLabel>Wanted in exchange <span className="text-[#a3a3a3] normal-case tracking-normal font-normal">(optional)</span></FieldLabel>
              <input
                type="text"
                value={preferredTrade}
                onChange={e => setPreferredTrade(e.target.value)}
                placeholder="e.g. Swiggy coupon, Zomato discount, any food delivery coupon"
                className={inputCls}
              />
            </div>
          </div>

          {/* Image upload card */}
          <div className="rounded-lg border border-[#e5e5e5] bg-white p-6">
            <FieldLabel>Coupon Screenshot / Brand Logo <span className="text-[#a3a3a3] normal-case tracking-normal font-normal">(optional)</span></FieldLabel>

            {imagePreview ? (
              <div className="relative mt-2 aspect-video rounded-lg overflow-hidden border border-[#e5e5e5] bg-[#fafafa] max-w-sm">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#991b1b] border border-[#fecaca] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-[#e5e5e5] bg-[#fafafa] rounded-lg p-10 hover:bg-white hover:border-[#d4d4d4] cursor-pointer transition-colors">
                <Upload className="h-7 w-7 text-[#d4d4d4] mb-2.5 stroke-[1.5]" />
                <span className="text-xs font-semibold text-[#737373]">Click to upload photo</span>
                <span className="text-[11px] text-[#a3a3a3] mt-1">PNG, JPG, JPEG — max 5 MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#0a0a0a] py-3 text-sm font-semibold text-white hover:bg-[#262626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
        </form>
      </main>
    </div>
  );
}
