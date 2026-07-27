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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-slate-900 uppercase tracking-wider">Leave a Review</h3>
          {!success && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
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
            <p className="font-heading text-sm font-bold text-slate-900">Thank you!</p>
            <p className="text-xs text-slate-500">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              How was your trading experience with <span className="font-bold text-slate-900">@{revieweeUsername}</span>?
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
                        : "text-slate-200 hover:text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-heading">
                Comments (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Fast response, code worked perfectly!"
                className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 resize-none shadow-2xs"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
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
