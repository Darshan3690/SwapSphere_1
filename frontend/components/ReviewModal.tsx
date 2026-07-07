"use client";

import { useState } from "react";
import { Star, X, RefreshCw, AlertCircle } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  revieweeId: string;
  revieweeUsername: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  revieweeId,
  revieweeUsername,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit review.");
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-xl border border-[#e5e5e5] bg-white p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#111] uppercase tracking-wider">Leave a Review</h3>
          {!success && (
            <button
              onClick={onClose}
              className="rounded p-1 text-[#737373] hover:bg-[#fafafa] hover:text-[#111] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#111]">Thank you!</p>
            <p className="text-xs text-[#737373]">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 text-xs text-[#991b1b]">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-[#737373] leading-relaxed">
              How was your trading experience with <span className="font-semibold text-[#111]">@{revieweeUsername}</span>?
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="transition-transform active:scale-90 cursor-pointer"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= (hoverRating ?? rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-[#e5e5e5] hover:text-[#d4d4d4]"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mb-1.5">
                Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Friendly swapper, fast response, coupon worked perfectly!"
                className="w-full rounded-lg bg-white border border-[#e5e5e5] px-3 py-2 text-xs text-[#111] placeholder-[#a3a3a3] focus:outline-none focus:border-[#0a0a0a] resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0a0a0a] py-2.5 text-xs font-semibold text-white hover:bg-[#262626] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>{loading ? "Submitting..." : "Submit Review"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
