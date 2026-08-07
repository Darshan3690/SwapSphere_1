"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard,
  BarChart3,
  Users as UsersIcon,
  Ticket,
  ArrowRightLeft,
  Star,
  Tags,
  Briefcase,
  AlertTriangle,
  MessageSquare,
  FileText,
  Megaphone,
  Bell,
  Heart,
  Download,
  Settings as SettingsIcon,
  History,
  RefreshCw,
  Search,
  Check,
  X,
  AlertCircle,
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
  Unlock,
  Sparkles,
  Eye,
  CheckSquare,
  Square,
  Ban,
  UserCheck,
  CheckCircle,
  AlertOctagon
} from "lucide-react";

import { GrowthAreaChart, CategoryPieChart, BrandBarChart, TopSellersBarChart } from "@/components/admin/AnalyticsCharts";
import { SystemHealthWidget } from "@/components/admin/SystemHealthWidget";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { UserDetailDrawer, UserDetail } from "@/components/admin/UserDetailDrawer";
import { VoucherDetailDrawer, VoucherDetail } from "@/components/admin/VoucherDetailDrawer";

const ADMIN_EMAILS = [
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase(),
  "darshan.rajput369@gmail.com",
  "jaiminkansagara388@gmail.com"
].filter(Boolean);

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "vouchers", label: "Vouchers", icon: Ticket },
  { id: "trades", label: "Trades", icon: ArrowRightLeft },
  { id: "featured", label: "Featured", icon: Star },
  { id: "categories", label: "Categories", icon: Tags },
  { id: "brands", label: "Brands", icon: Briefcase },
  { id: "fraud", label: "Fraud Center", icon: AlertTriangle },
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "feedback", label: "Feedback", icon: Heart },
  { id: "exports", label: "Exports", icon: Download },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "audit", label: "Audit Logs", icon: History }
] as const;

type TabId = (typeof SIDEBAR_ITEMS)[number]["id"];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");

  // Input states for form additions
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Settings page states
  const [platformName, setPlatformName] = useState("SwapSphere");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxUploadSize, setMaxUploadSize] = useState("5MB");

  // Selection states for Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);

  // Slide-over Drawer modal states
  const [inspectUser, setInspectUser] = useState<UserDetail | null>(null);
  const [inspectVoucher, setInspectVoucher] = useState<VoucherDetail | null>(null);

  const isUserAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else if (!isUserAdmin) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router, isUserAdmin]);

  // Data fetcher
  const fetchAdminData = async (isInitial = false) => {
    if (isInitial || !data) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin?tab=${activeTab}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server returned ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isUserAdmin) {
      fetchAdminData(true);
      setSelectedUserIds([]);
      setSelectedVoucherIds([]);
    }
  }, [user?.id, activeTab, isUserAdmin]);

  // Action dispatcher
  const handleAction = async (action: string, payload: any) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
      if (!res.ok) throw new Error("Action failed to execute.");
      fetchAdminData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (actionType: string) => {
    if (activeTab === "users" && selectedUserIds.length > 0) {
      await handleAction(actionType, { userIds: selectedUserIds });
      setSelectedUserIds([]);
    } else if (activeTab === "vouchers" && selectedVoucherIds.length > 0) {
      await handleAction(actionType, { voucherIds: selectedVoucherIds });
      setSelectedVoucherIds([]);
    }
  };

  // CSV Exporter Helper
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col items-center justify-center text-slate-500 gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Verifying Credentials...</span>
      </div>
    );
  }

  if (!user || !isUserAdmin) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 gap-4 sm:gap-8">
        {/* ── Sidebar Navigation ──────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-1.5 sticky top-20">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 font-heading tracking-wider">Business Control Center</p>
              <h2 className="font-heading text-sm font-bold text-slate-900 mt-0.5">Welcome {user.fullName || user.firstName || (user.email ? user.email.split("@")[0] : "Admin")}</h2>
            </div>
            <div className="max-h-[70vh] overflow-y-auto space-y-1 pr-1">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ──────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Mobile Horizontal Pill Tab Navigation */}
          <div className="md:hidden mb-4 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-[11px] font-bold text-slate-900 uppercase tracking-wider">Control Center</span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label}</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-2xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">Updating control center telemetry...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Tab: Dashboard ────────────────────────────── */}
              {activeTab === "dashboard" && data?.stats && (
                <div className="space-y-6">
                  {/* Headline Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-6 text-white shadow-md shadow-indigo-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-lg font-bold">👋 Welcome back, {user.fullName || user.firstName || (user.email ? user.email.split("@")[0] : "Admin")}</h2>
                      <p className="text-xs text-indigo-100 mt-1">Platform overview metrics, live system telemetry, and activity feeds are active.</p>
                    </div>
                    <Sparkles className="h-8 w-8 text-indigo-200/80 animate-pulse hidden sm:block" />
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Active Users", value: data.stats.users, color: "text-indigo-600" },
                      { label: "Total Vouchers", value: data.stats.vouchers, color: "text-blue-600" },
                      { label: "Trades Initiated", value: data.stats.trades, color: "text-emerald-600" },
                      { label: "SaaS Revenue", value: `₹${data.stats.revenue}`, color: "text-slate-900" },
                      { label: "Active Fraud Reports", value: data.stats.fraudReports, color: "text-red-600" },
                      { label: "Vouchers Pending Review", value: data.stats.pendingReview, color: "text-amber-600" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                        <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                        <p className={`font-heading text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* System Health Widget */}
                  <SystemHealthWidget health={data.health} />

                  {/* Grid: Charts & Activity Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-sm font-bold text-slate-900">Platform User & Trade Growth</h3>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Live Stream</span>
                      </div>
                      <GrowthAreaChart />
                    </div>

                    <div className="lg:col-span-1">
                      <ActivityFeed logs={data.activityFeed} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Analytics ────────────────────────────── */}
              {activeTab === "analytics" && data?.analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                      <h3 className="font-heading text-sm font-bold text-slate-900">Category Distribution</h3>
                      <CategoryPieChart data={data.analytics.categoryDistribution} />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                      <h3 className="font-heading text-sm font-bold text-slate-900">Top Brands Volume</h3>
                      <BrandBarChart data={data.analytics.brandRanking} />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
                    <h3 className="font-heading text-sm font-bold text-slate-900">Top Seller Trust Scores</h3>
                    <TopSellersBarChart data={data.analytics.topSellers} />
                  </div>
                </div>
              )}

              {/* ── Tab: Users ───────────────────────────────── */}
              {activeTab === "users" && data?.users && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-heading text-base font-bold text-slate-900">Registered Platform Users</h2>
                      <p className="text-xs text-slate-500">Manage user accounts, verification, trust scores & suspensions</p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Bulk Action Bar */}
                  {selectedUserIds.length > 0 && (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 animate-in fade-in duration-200">
                      <span className="font-semibold">{selectedUserIds.length} users selected</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkAction("bulk_verify_users")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                        >
                          Bulk Verify
                        </button>
                        <button
                          onClick={() => handleBulkAction("bulk_suspend_users")}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700"
                        >
                          Bulk Suspend
                        </button>
                        <button
                          onClick={() => handleBulkAction("bulk_ban_users")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700"
                        >
                          Bulk Ban
                        </button>
                        <button
                          onClick={() => setSelectedUserIds([])}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-900 uppercase font-heading text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.length === data.users.length && data.users.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUserIds(data.users.map((u: any) => u.id));
                                else setSelectedUserIds([]);
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="p-3">User</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Trust Score</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.users
                          .filter((u: any) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(u.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedUserIds(prev => [...prev, u.id]);
                                    else setSelectedUserIds(prev => prev.filter(id => id !== u.id));
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 flex items-center gap-1">
                                      @{u.username}
                                      {u.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                                    </p>
                                    <p className="text-[10px] text-slate-400">ID: {u.id.substring(0, 12)}...</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-slate-700">{u.role}</td>
                              <td className="p-3">
                                <span className="font-bold text-emerald-600">{u.trustScore}/100</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.isBanned
                                    ? "bg-red-100 text-red-700"
                                    : u.isSuspended
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {u.isBanned ? "Banned" : u.isSuspended ? "Suspended" : "Active"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setInspectUser(u)}
                                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleAction("verify_seller", { userId: u.id, status: !u.isVerified })}
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                      u.isVerified ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    }`}
                                  >
                                    {u.isVerified ? "Unverify" : "Verify"}
                                  </button>
                                  <button
                                    onClick={() => handleAction("suspend_user", { userId: u.id, status: !u.isSuspended })}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                                  >
                                    {u.isSuspended ? "Unsuspend" : "Suspend"}
                                  </button>
                                  <button
                                    onClick={() => handleAction("ban_user", { userId: u.id, status: !u.isBanned })}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer"
                                  >
                                    {u.isBanned ? "Unban" : "Ban"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Tab: Vouchers ────────────────────────────── */}
              {activeTab === "vouchers" && data?.vouchers && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="font-heading text-base font-bold text-slate-900">Listed Coupon Vouchers</h2>
                      <p className="text-xs text-slate-500">Review, verify, feature or soft-delete marketplace listings</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search vouchers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Bulk Action Bar */}
                  {selectedVoucherIds.length > 0 && (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-900 animate-in fade-in duration-200">
                      <span className="font-semibold">{selectedVoucherIds.length} vouchers selected</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBulkAction("bulk_approve_vouchers")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700"
                        >
                          Bulk Approve
                        </button>
                        <button
                          onClick={() => handleBulkAction("bulk_feature_vouchers")}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700"
                        >
                          Bulk Feature
                        </button>
                        <button
                          onClick={() => handleBulkAction("bulk_soft_delete_vouchers")}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700"
                        >
                          Bulk Soft-Delete
                        </button>
                        <button
                          onClick={() => setSelectedVoucherIds([])}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vouchers Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-900 uppercase font-heading text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={selectedVoucherIds.length === data.vouchers.length && data.vouchers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedVoucherIds(data.vouchers.map((v: any) => v.id));
                                else setSelectedVoucherIds([]);
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.vouchers
                          .filter((v: any) => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((v: any) => (
                            <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedVoucherIds.includes(v.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedVoucherIds(prev => [...prev, v.id]);
                                    else setSelectedVoucherIds(prev => prev.filter(id => id !== v.id));
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="p-3 font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <span>{v.title}</span>
                                  {v.isDeleted && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[9px]">Deleted</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">{v.category}</td>
                              <td className="p-3 font-bold text-slate-900">${v.price || 0}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  v.verificationStatus === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {v.verificationStatus}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setInspectVoucher(v)}
                                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleAction("verify_voucher", { voucherId: v.id, status: v.verificationStatus === "Approved" ? "Pending" : "Approved" })}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    {v.verificationStatus === "Approved" ? "Unapprove" : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleAction("soft_delete_voucher", { voucherId: v.id, status: !v.isDeleted })}
                                    className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                                  >
                                    {v.isDeleted ? "Restore" : "Soft Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Other Tabs (Trades, Featured, Categories, Brands, Audit, etc.) ─────────────── */}
              {activeTab === "trades" && data?.trades && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Trade Swap Requests</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-900 uppercase font-heading text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3">Trade ID</th>
                          <th className="p-3">Sender</th>
                          <th className="p-3">Receiver</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.trades.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono font-bold text-indigo-600">{t.id.substring(0, 10)}...</td>
                            <td className="p-3 font-semibold text-slate-900">@{t.sender?.username}</td>
                            <td className="p-3 font-semibold text-slate-900">@{t.receiver?.username}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  disabled={t.status === "Completed"}
                                  onClick={() => handleAction("force_complete_trade", { tradeId: t.id })}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                    t.status === "Completed"
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer active:scale-95"
                                  }`}
                                >
                                  {t.status === "Completed" ? "Completed" : "Force Complete"}
                                </button>
                                <button
                                  disabled={t.status === "Cancelled"}
                                  onClick={() => handleAction("cancel_trade", { tradeId: t.id })}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                    t.status === "Cancelled"
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                      : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer active:scale-95"
                                  }`}
                                >
                                  {t.status === "Cancelled" ? "Cancelled" : "Cancel"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Tab: Categories ────────────────────────────── */}
              {activeTab === "categories" && data?.categories && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-heading text-base font-bold text-slate-900">Platform Categories</h2>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New category..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            handleAction("add_category", { name: newCategoryName });
                            setNewCategoryName("");
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.categories.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                        <button
                          onClick={() => handleAction("delete_category", { categoryId: c.id })}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Featured ────────────────────────────── */}
              {activeTab === "featured" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Featured Listings</h2>
                  <p className="text-xs text-slate-500">Manage promotional and highlighted marketplace items</p>
                  <div className="divide-y divide-slate-100 text-xs">
                    {data?.featured?.length === 0 ? (
                      <p className="text-slate-400 py-6 text-center">No featured vouchers currently.</p>
                    ) : (
                      data?.featured?.map((v: any) => (
                        <div key={v.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{v.title}</p>
                            <p className="text-[10px] text-slate-400">Listed by @{v.user?.username || "user"}</p>
                          </div>
                          <button
                            onClick={() => handleAction("featured_voucher", { voucherId: v.id, status: false })}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-semibold text-[11px]"
                          >
                            Unfeature
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Reports ────────────────────────────── */}
              {activeTab === "reports" && data?.summary && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="font-heading text-base font-bold text-slate-900">Business & Financial Reports</h2>
                      <p className="text-xs text-slate-500">Executive summary metrics and platform transaction reports</p>
                    </div>
                    <button
                      onClick={() => downloadCSV("business_report.csv", ["Metric", "Value"], [
                        ["Total Users", data.summary.totalUsers],
                        ["Total Vouchers", data.summary.totalVouchers],
                        ["Completed Trades", data.summary.completedTrades],
                        ["Pending Trades", data.summary.pendingTrades],
                        ["Reported Fraud", data.summary.reportedFraud],
                        ["Estimated SaaS Revenue", `₹${data.summary.totalRevenue}`]
                      ])}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Summary CSV
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Registered Platform Users</span>
                      <p className="font-heading text-xl font-bold text-indigo-600 mt-1">{data.summary.totalUsers}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Listed Coupon Vouchers</span>
                      <p className="font-heading text-xl font-bold text-blue-600 mt-1">{data.summary.totalVouchers}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Successful Trades</span>
                      <p className="font-heading text-xl font-bold text-emerald-600 mt-1">{data.summary.completedTrades}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Pending Swaps</span>
                      <p className="font-heading text-xl font-bold text-amber-600 mt-1">{data.summary.pendingTrades}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Fraud Escalations</span>
                      <p className="font-heading text-xl font-bold text-red-600 mt-1">{data.summary.reportedFraud}</p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Est. SaaS Platform Revenue</span>
                      <p className="font-heading text-xl font-bold text-slate-900 mt-1">₹{data.summary.totalRevenue}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Chats Moderation ────────────────────────── */}
              {activeTab === "chats" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div>
                    <h2 className="font-heading text-base font-bold text-slate-900">Trade Chat Monitoring & Moderation</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Live chat telemetry across trade swap negotiations</p>
                  </div>
                  <div className="space-y-3 text-xs">
                    {!data?.chats || data?.chats?.length === 0 ? (
                      <p className="text-slate-400 py-8 text-center">No active chat messages recorded yet.</p>
                    ) : (
                      data.chats.map((msg: any) => (
                        <div key={msg.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">@{msg.sender?.username || "user"}</span>
                              {msg.isReported && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">Flagged</span>
                              )}
                              <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0 ml-auto sm:ml-0">
                              {msg.isReported && (
                                <button
                                  onClick={() => handleAction("dismiss_chat_report", { messageId: msg.id })}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                                >
                                  Dismiss
                                </button>
                              )}
                              <button
                                onClick={() => handleAction("delete_chat_message", { messageId: msg.id })}
                                className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed break-words bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs font-mono">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Brands ────────────────────────────── */}
              {activeTab === "brands" && data?.brands && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-heading text-base font-bold text-slate-900">Supported Brands</h2>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="New brand name..."
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                      <button
                        onClick={() => {
                          if (newBrandName.trim()) {
                            handleAction("add_brand", { name: newBrandName });
                            setNewBrandName("");
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Add Brand
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.brands.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <span className="font-semibold text-xs text-slate-900">{b.name}</span>
                        <button
                          onClick={() => handleAction("delete_brand", { brandId: b.id })}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Fraud Center ────────────────────────────── */}
              {activeTab === "fraud" && data && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Fraud Center & Escalations</h2>
                  <div className="space-y-3 text-xs">
                    <h3 className="font-bold text-slate-700">Flagged Users</h3>
                    {data?.flaggedUsers?.length === 0 ? (
                      <p className="text-slate-400">No banned or suspended users.</p>
                    ) : (
                      data?.flaggedUsers?.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100">
                          <div>
                            <span className="font-bold text-slate-900">@{u.username}</span>
                            <span className="ml-2 text-[10px] text-red-600 font-bold">{u.isBanned ? "Banned" : "Suspended"}</span>
                          </div>
                          <button
                            onClick={() => handleAction("ban_user", { userId: u.id, status: false })}
                            className="px-2 py-1 text-[10px] font-bold bg-white text-slate-700 border border-slate-200 rounded-md"
                          >
                            Unban
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Notifications & Broadcasting ───────────── */}
              {activeTab === "notifications" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Broadcast System Notifications</h2>
                  <div className="space-y-3 max-w-lg">
                    <input
                      type="text"
                      placeholder="Broadcast Title"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-600"
                    />
                    <textarea
                      placeholder="Broadcast message body..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-600"
                    />
                    <button
                      onClick={() => {
                        if (broadcastTitle.trim() && broadcastMessage.trim()) {
                          handleAction("send_broadcast", { title: broadcastTitle, message: broadcastMessage });
                          setBroadcastTitle("");
                          setBroadcastMessage("");
                          alert("Broadcast sent to all users!");
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer"
                    >
                      Send Broadcast to All Users
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: Announcements ────────────────────────────── */}
              {activeTab === "announcements" && data?.announcements && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="font-heading text-base font-bold text-slate-900">Platform Announcements</h2>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Title..."
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Content..."
                        value={announcementContent}
                        onChange={(e) => setAnnouncementContent(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                      />
                      <button
                        onClick={() => {
                          if (announcementTitle.trim()) {
                            handleAction("add_announcement", { title: announcementTitle, content: announcementContent });
                            setAnnouncementTitle("");
                            setAnnouncementContent("");
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Publish
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.announcements.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{a.title}</p>
                          <p className="text-slate-600 mt-0.5">{a.content}</p>
                        </div>
                        <button
                          onClick={() => handleAction("delete_announcement", { announcementId: a.id })}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Feedback ────────────────────────────── */}
              {activeTab === "feedback" && data?.feedback && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">User Feedback & Support Tickets</h2>
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.feedback.map((f: any) => (
                      <div key={f.id} className="py-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{f.subject}</span>
                            <span className="text-[10px] text-slate-400">by @{f.username} ({f.email})</span>
                          </div>
                          <p className="text-slate-600 mt-1">{f.message}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab: Exports ────────────────────────────── */}
              {activeTab === "exports" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Data Exporters (CSV)</h2>
                  <p className="text-xs text-slate-500">Download formatted database tables for backup and business intelligence</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => downloadCSV("users_export.csv", ["ID", "Username", "Role", "TrustScore"], (data?.users || []).map((u: any) => [u.id, u.username, u.role, u.trustScore]))}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors cursor-pointer"
                    >
                      <Download className="h-5 w-5 text-indigo-600 mb-2" />
                      <p className="font-bold text-xs text-slate-900">Export Users</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Download full user directory</p>
                    </button>
                    <button
                      onClick={() => downloadCSV("vouchers_export.csv", ["ID", "Title", "Category", "Price", "Status"], (data?.items || []).map((i: any) => [i.id, i.title, i.category, i.price, i.verificationStatus]))}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors cursor-pointer"
                    >
                      <Download className="h-5 w-5 text-indigo-600 mb-2" />
                      <p className="font-bold text-xs text-slate-900">Export Vouchers</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Download all marketplace listings</p>
                    </button>
                    <button
                      onClick={() => downloadCSV("trades_export.csv", ["ID", "SenderID", "ReceiverID", "Status", "CreatedAt"], (data?.trades || []).map((t: any) => [t.id, t.senderId, t.receiverId, t.status, t.createdAt]))}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-colors cursor-pointer"
                    >
                      <Download className="h-5 w-5 text-indigo-600 mb-2" />
                      <p className="font-bold text-xs text-slate-900">Export Trade Logs</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Download swap transaction history</p>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: Settings ────────────────────────────── */}
              {activeTab === "settings" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">Platform Global Settings</h2>
                  <div className="space-y-3 text-xs max-w-md">
                    <div>
                      <label className="font-semibold text-slate-700">Platform Title</label>
                      <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="font-semibold text-slate-700">Maintenance Mode</span>
                      <button onClick={() => setMaintenanceMode(!maintenanceMode)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${maintenanceMode ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                        {maintenanceMode ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <span className="font-semibold text-slate-700">Max Upload Size</span>
                      <span className="font-bold text-slate-900">{maxUploadSize}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Audit Logs ────────────────────────────── */}
              {activeTab === "audit" && data?.logs && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h2 className="font-heading text-base font-bold text-slate-900">System Audit Trail</h2>
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.logs.map((log: any) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <span className="font-mono text-slate-700">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Slide-over User Detail Drawer */}
      <UserDetailDrawer
        user={inspectUser}
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        onAction={async (userId, action) => {
          if (action === "verifyUser") await handleAction("verify_seller", { userId, status: !inspectUser?.isVerified });
          if (action === "suspendUser") await handleAction("suspend_user", { userId, status: !inspectUser?.isSuspended });
          if (action === "banUser") await handleAction("ban_user", { userId, status: !inspectUser?.isBanned });
          if (action === "resetTrustScore") await handleAction("reset_trust", { userId });
          setInspectUser(null);
        }}
      />

      {/* Slide-over Voucher Detail Drawer */}
      <VoucherDetailDrawer
        voucher={inspectVoucher}
        isOpen={!!inspectVoucher}
        onClose={() => setInspectVoucher(null)}
        onAction={async (voucherId, action) => {
          if (action === "approveVoucher") await handleAction("verify_voucher", { voucherId, status: inspectVoucher?.verificationStatus === "Approved" ? "Pending" : "Approved" });
          if (action === "featureVoucher") await handleAction("featured_voucher", { voucherId, status: !inspectVoucher?.isFeatured });
          if (action === "flagSuspicious") await handleAction("suspicious_voucher", { voucherId, status: !inspectVoucher?.isSuspicious });
          if (action === "softDeleteVoucher") await handleAction("soft_delete_voucher", { voucherId, status: !inspectVoucher?.isDeleted });
          setInspectVoucher(null);
        }}
      />
    </div>
  );
}
