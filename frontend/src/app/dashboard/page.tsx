"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ItemCard, { Item } from "@/components/ItemCard";
import { RefreshCw, Search, Tag, AlertCircle, LayoutGrid, User as UserIcon } from "lucide-react";

const CATEGORIES = ["All","Electronics","Books","Fashion","Home","Games","Sports","Other"];

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"marketplace" | "my-listings">("marketplace");
  const [items, setItems] = useState<Item[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [myItemsLoading, setMyItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  const fetchMarketplaceItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/items");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data || []);
      setFilteredItems(data || []);
    } catch {
      setError("Failed to fetch listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyItems = async () => {
    if (!user) return;
    setMyItemsLoading(true);
    try {
      const res = await fetch(`/api/items?userId=${user.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMyItems(data || []);
    } catch {
      // silent
    } finally {
      setMyItemsLoading(false);
    }
  };

  useEffect(() => {
    if (user) { fetchMarketplaceItems(); fetchMyItems(); }
  }, [user]);

  useEffect(() => {
    let result = items;
    if (selectedCategory !== "All") {
      result = result.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.preferred_trade && i.preferred_trade.toLowerCase().includes(q))
      );
    }
    setFilteredItems(result);
  }, [searchQuery, selectedCategory, items]);

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] flex-col items-center justify-center text-[#737373] gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-[#111]" />
        <span className="text-xs">Authenticating...</span>
      </div>
    );
  }

  if (!user) return null;

  const currentList = activeTab === "marketplace" ? filteredItems : myItems;
  const currentLoading = activeTab === "marketplace" ? loading : myItemsLoading;

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">

        {/* ── Page header ──────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-10 pb-6 border-b border-[#e5e5e5]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111]">
              {activeTab === "marketplace" ? "Browse Coupons" : "My Listings"}
            </h1>
            <p className="mt-1 text-sm text-[#737373]">
              {activeTab === "marketplace"
                ? "Find coupons available for exchange and propose a swap."
                : "All your active listings, including pending and swapped ones."}
            </p>
          </div>

          {activeTab === "marketplace" && (
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#a3a3a3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search coupons..."
                className="w-full rounded-lg bg-white border border-[#e5e5e5] pl-9 pr-4 py-2 text-xs text-[#111] placeholder-[#a3a3a3] focus:outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-colors"
              />
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex gap-6 border-b border-[#e5e5e5] mt-0">
          {([
            { id: "marketplace", label: "Marketplace", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
            { id: "my-listings", label: "My Listings",  icon: <UserIcon className="h-3.5 w-3.5" />, count: myItems.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "my-listings") fetchMyItems(); }}
              className={`flex items-center gap-1.5 pb-3 pt-4 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#111] text-[#111]"
                  : "border-transparent text-[#737373] hover:text-[#111]"
              }`}
            >
              {tab.icon}
              {tab.label}
              {"count" in tab && tab.count > 0 && (
                <span className="ml-0.5 rounded-full bg-[#0a0a0a] px-1.5 py-px text-[9px] font-bold text-white leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Category filters ─────────────────────────── */}
        {activeTab === "marketplace" && (
          <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-none py-4 border-b border-[#e5e5e5]">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                    : "bg-white border-[#e5e5e5] text-[#737373] hover:border-[#d4d4d4] hover:text-[#111]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Error ────────────────────────────────────── */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#991b1b]">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────── */}
        <div className="py-8">
          {currentLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-[#737373]">
              <RefreshCw className="h-5 w-5 animate-spin text-[#111]" />
              <span className="text-xs">Fetching listings...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-lg border border-dashed border-[#e5e5e5] bg-white">
              <Tag className="h-8 w-8 text-[#d4d4d4] stroke-[1.2] mb-3" />
              <p className="text-sm font-semibold text-[#111]">
                {activeTab === "my-listings" ? "No listings yet" : "No items found"}
              </p>
              <p className="mt-1 text-xs text-[#737373] max-w-xs">
                {activeTab === "my-listings"
                  ? 'Click "List a Coupon" in the navbar to create your first listing.'
                  : "Try adjusting your search or selecting a different category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentList.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
