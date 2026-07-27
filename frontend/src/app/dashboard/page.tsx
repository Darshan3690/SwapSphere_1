"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ItemCard, { Item } from "@/components/ItemCard";
import { RefreshCw, Search, Tag, AlertCircle, LayoutGrid, User as UserIcon, SlidersHorizontal } from "lucide-react";

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

  const [selectedListingType, setSelectedListingType] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth");
  }, [user, authLoading, router]);

  const fetchMarketplaceItems = async (
    cat = selectedCategory,
    search = searchQuery,
    type = selectedListingType,
    min = minPrice,
    max = maxPrice
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (cat && cat !== "All") params.append("category", cat);
      if (search.trim()) params.append("search", search.trim());
      if (type && type !== "All") params.append("listingType", type);
      if (min.trim()) params.append("minValue", min.trim());
      if (max.trim()) params.append("maxValue", max.trim());

      const res = await fetch(`/api/items?${params.toString()}`);
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
    if (user) {
      fetchMarketplaceItems(selectedCategory, searchQuery, selectedListingType, minPrice, maxPrice);
      fetchMyItems();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === "marketplace") {
      const timer = setTimeout(() => {
        fetchMarketplaceItems(selectedCategory, searchQuery, selectedListingType, minPrice, maxPrice);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedCategory, selectedListingType, minPrice, maxPrice, activeTab, user]);

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Authenticating...</span>
      </div>
    );
  }

  if (!user) return null;

  const currentList = activeTab === "marketplace" ? filteredItems : myItems;
  const currentLoading = activeTab === "marketplace" ? loading : myItemsLoading;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">

        {/* ── Page header ──────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8 pb-6 border-b border-slate-200/80">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">
              {activeTab === "marketplace" ? "Browse Marketplace" : "My Listings"}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === "marketplace"
                ? "Find coupons available for barter exchange or purchase."
                : "Manage your active listings, including pending trades and swapped vouchers."}
            </p>
          </div>

          {activeTab === "marketplace" && (
            <div className="flex items-center gap-2.5 w-full md:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search coupons, brands, or deals..."
                  className="w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all shadow-2xs"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  showFilters
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div className="flex gap-6 border-b border-slate-200/80 mt-0">
          {([
            { id: "marketplace", label: "Marketplace", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
            { id: "my-listings", label: "My Listings",  icon: <UserIcon className="h-3.5 w-3.5" />, count: myItems.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "my-listings") fetchMyItems(); }}
              className={`flex items-center gap-2 pb-3 pt-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.icon}
              {tab.label}
              {"count" in tab && tab.count > 0 && (
                <span className="ml-0.5 rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600 leading-none">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Category filters ─────────────────────────── */}
        {activeTab === "marketplace" && (
          <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-none py-4 border-b border-slate-200/80">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium border whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Additional filters panel ───────────────────── */}
        {activeTab === "marketplace" && showFilters && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
            {/* Listing Type Select */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Listing Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {([
                  { id: "All", label: "All Types" },
                  { id: "SWAP_ONLY", label: "Swap Only" },
                  { id: "SELL_ONLY", label: "Sell Only" },
                  { id: "SWAP_AND_SELL", label: "Swap & Sell" }
                ] as const).map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedListingType(type.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                      selectedListingType === type.id
                        ? "bg-indigo-600 border-indigo-600 text-white font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Price Range (INR)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                  className="text-xs text-slate-500 hover:text-red-600 font-medium px-2 py-1.5 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────── */}
        {error && (
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────── */}
        <div className="py-8">
          {currentLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Fetching listings...</span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                <Tag className="h-6 w-6 stroke-[1.5]" />
              </div>
              <p className="font-heading text-base font-bold text-slate-900">
                {activeTab === "my-listings" ? "No listings yet" : "No coupons found"}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                {activeTab === "my-listings"
                  ? 'Click "List a Coupon" in the navigation bar to create your first listing.'
                  : "Try adjusting your search query, price filter, or selecting a different category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
