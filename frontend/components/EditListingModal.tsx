"use client";

import { useEffect, useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  preferred_trade: string | null;
  price?: number | null;
  couponCode?: string;
  couponExpiry?: string;
  listing_type?: string;
  selling_price?: number | null;
  brand?: string | null;
  voucher_value?: number | null;
  category_id?: string | null;
}

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  onSuccess: () => void;
}

const CATEGORIES = ["Electronics", "Books", "Fashion", "Home", "Games", "Sports", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-heading">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs";

export default function EditListingModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: EditListingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [condition, setCondition] = useState("Good");
  const [preferredTrade, setPreferredTrade] = useState("");
  const [price, setPrice] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listingType, setListingType] = useState<"SWAP_ONLY" | "SELL_ONLY" | "SWAP_AND_SELL">("SWAP_ONLY");
  const [sellingPrice, setSellingPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [voucherValue, setVoucherValue] = useState("");

  // Initialize values when modal opens or item changes
  useEffect(() => {
    if (isOpen && item) {
      setTitle(item.title || "");
      setDescription(item.description || "");
      setCategory(item.category || "Electronics");
      setCondition(item.condition || "Good");
      setPreferredTrade(item.preferred_trade || "");
      setPrice(item.price !== undefined && item.price !== null ? String(item.price) : "");
      setCouponCode(item.couponCode || "");
      
      setListingType((item.listing_type as any) || "SWAP_ONLY");
      setSellingPrice(item.selling_price !== undefined && item.selling_price !== null ? String(item.selling_price) : "");
      setBrand(item.brand || "");
      setVoucherValue(item.voucher_value !== undefined && item.voucher_value !== null ? String(item.voucher_value) : "");

      if (item.couponExpiry) {
        setCouponExpiry(item.couponExpiry.split("T")[0]);
      } else {
        setCouponExpiry("");
      }
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    if (!title.trim()) {
      setError("Please enter a deal name.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          preferredTrade: listingType !== "SELL_ONLY" ? (preferredTrade.trim() || null) : null,
          price: listingType !== "SWAP_ONLY" && sellingPrice.trim() ? parseInt(sellingPrice.trim(), 10) : null,
          couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : undefined,
          couponExpiry: couponExpiry ? couponExpiry : undefined,
          listingType,
          sellingPrice: listingType !== "SWAP_ONLY" && sellingPrice.trim() ? parseInt(sellingPrice.trim(), 10) : null,
          brand: brand.trim() || null,
          voucherValue: voucherValue.trim() ? parseInt(voucherValue.trim(), 10) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update listing.");
      }

      onSuccess();
    } catch (err: any) {
      console.error("Error updating item:", err);
      setError(err.message || "Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
          <h2 className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider">Edit Coupon Listing</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {/* Deal Name */}
          <div>
            <FieldLabel>Deal Name</FieldLabel>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Condition</FieldLabel>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                {CONDITIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Listing Type */}
          <div>
            <FieldLabel>Listing Type</FieldLabel>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value as any)}
              className={`${inputCls} cursor-pointer`}
            >
              <option value="SWAP_ONLY">Swap Only</option>
              <option value="SELL_ONLY">Sell Only</option>
              <option value="SWAP_AND_SELL">Swap &amp; Sell</option>
            </select>
          </div>

          {/* Brand & Voucher Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Brand / Platform</FieldLabel>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Swiggy, Amazon"
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>Voucher Value (INR)</FieldLabel>
              <input
                type="number"
                min="1"
                value={voucherValue}
                onChange={(e) => setVoucherValue(e.target.value)}
                placeholder="e.g. 500"
                className={inputCls}
              />
            </div>
          </div>

          {/* Preferred Trade */}
          {listingType !== "SELL_ONLY" && (
            <div>
              <FieldLabel>Preferred Trade Description</FieldLabel>
              <input
                type="text"
                value={preferredTrade}
                onChange={(e) => setPreferredTrade(e.target.value)}
                placeholder="e.g. Amazon, Starbucks gift cards"
                className={inputCls}
              />
            </div>
          )}

          {/* Price & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            {listingType !== "SWAP_ONLY" ? (
              <div>
                <FieldLabel>Selling Price (INR) *</FieldLabel>
                <input
                  type="number"
                  min="1"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="e.g. 99, 149"
                  className={inputCls}
                />
              </div>
            ) : (
              <div />
            )}
            <div>
              <FieldLabel>Coupon Code</FieldLabel>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className={`${inputCls} font-mono uppercase font-bold`}
              />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <FieldLabel>Expiry Date</FieldLabel>
            <input
              type="date"
              value={couponExpiry}
              onChange={(e) => setCouponExpiry(e.target.value)}
              className={inputCls}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-200/80 px-6 py-4 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
