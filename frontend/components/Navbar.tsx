"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Bell, ShieldCheck } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const ADMIN_EMAIL = "darshan.rajput369@gmail.com";

export default function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 stroke-current stroke-[2.2] group-hover:rotate-180 transition-transform duration-500"
              >
                <path d="M7 17V4M7 4L3 8M7 4L11 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 7V20M17 20L13 16M17 20L21 16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-slate-900">
              SwapSphere
            </span>
          </Link>
          <Show when="signed-in">
            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/swaps"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                My Swaps
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors bg-indigo-50 px-2.5 py-1 rounded-lg"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
            </nav>
          </Show>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <>
              <Link
                href="/items/new"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200/50 transition-all active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5" />
                List a Coupon
              </Link>

              {/* Notification dropdown */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1 select-none">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) markAsRead(n.id);
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                              n.isRead
                                ? "bg-white border-slate-100"
                                : "bg-indigo-50/50 border-indigo-100 hover:border-indigo-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span
                                className={`text-xs font-semibold ${
                                  n.isRead ? "text-slate-600" : "text-slate-900"
                                }`}
                              >
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center border-l border-slate-200 pl-3">
                <UserButton />
              </div>
            </>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-3 py-1.5">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200/50 transition-all active:scale-[0.98] cursor-pointer">
                  Get started
                </button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}
