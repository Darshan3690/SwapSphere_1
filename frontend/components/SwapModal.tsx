"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { X, RefreshCw, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";

interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  image_url: string | null;
  status: string;
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverItemId: string;
  receiverItemTitle: string;
  onSuccess: (swapRequestId: string) => void;
}

export default function SwapModal({
  isOpen,
  onClose,
  receiverId,
  receiverItemId,
  receiverItemTitle,
  onSuccess,
}: SwapModalProps) {
  const { user } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchMyItems();
    }
  }, [isOpen, user]);

  const fetchMyItems = async () => {
    if (!user) return;
    setFetchingItems(true);
    setError(null);
    try {
      const response = await fetch(`/api/items?userId=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      
      const data = await response.json();
      
      // Filter out only available items
      const availableItems = data.filter((item: any) => item.status === "Available");
      
      setMyItems(availableItems || []);
      if (availableItems && availableItems.length > 0) {
        setSelectedItemId(availableItems[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError("Failed to load your items.");
    } finally {
      setFetchingItems(false);
    }
  };

  const handleProposeSwap = async () => {
    if (!user || !selectedItemId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Create the swap request via custom REST API endpoint
      const response = await fetch("/api/swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId,
          senderItemId: selectedItemId,
          receiverItemId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to propose swap");
      }

      const data = await response.json();

      // 2. Set the status of BOTH items to "Pending" via custom PATCH requests on our backend
      // We perform PATCH calls to secure database integrity.
      await fetch(`/api/items/${selectedItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pending" }),
      });

      await fetch(`/api/items/${receiverItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pending" }),
      });

      onSuccess(data.swapRequestId);
    } catch (err: any) {
      console.error("Error creating swap:", err);
      setError(err.message || "Failed to propose swap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 text-indigo-600" />
          <h2 className="font-heading text-lg font-bold text-slate-900">Propose a Swap</h2>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          You are requesting to trade for <strong className="text-slate-900">&quot;{receiverItemTitle}&quot;</strong>. Choose which of your active listings to offer in exchange.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {fetchingItems ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Loading your available listings...</span>
          </div>
        ) : myItems.length === 0 ? (
          <div className="flex flex-col items-center text-center py-6 border border-dashed border-slate-200 rounded-xl mb-6 bg-slate-50">
            <p className="text-xs text-slate-500 mb-3">You don&apos;t have any active coupons available to trade.</p>
            <Link
              href="/items/new"
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3.5 py-2 rounded-xl shadow-xs transition-all hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              List an Item First
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-heading">
              Choose an item to offer:
            </label>
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5">
              {myItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedItemId === item.id
                      ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProposeSwap}
            disabled={loading || myItems.length === 0}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-xs font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Sending..." : "Submit Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
