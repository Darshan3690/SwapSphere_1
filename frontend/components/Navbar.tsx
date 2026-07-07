"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Bell } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar() {
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
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e5e5]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-[#111] group-hover:rotate-180 transition-transform duration-500"
            >
              <path
                d="M7 17V4M7 4L3 8M7 4L11 8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 7V20M17 20L13 16M17 20L21 16"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold tracking-tight text-[#111]">
              swapsphere
            </span>
          </Link>
          <Show when="signed-in">
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-[#737373] hover:text-[#111] transition-colors"
              >
                Marketplace
              </Link>
              <Link
                href="/swaps"
                className="flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-[#111] transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                My Swaps
              </Link>
            </nav>
          </Show>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <>
              <Link
                href="/items/new"
                className="flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#262626] transition-colors"
              >
                <Plus className="h-3 w-3" />
                List a Coupon
              </Link>

              {/* Notification dropdown */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="relative p-1 text-[#737373] hover:text-[#111] transition-colors cursor-pointer rounded-lg hover:bg-[#fafafa]"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-2 w-2 rounded-full bg-[#f97316] ring-1 ring-white animate-pulse" />
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#111]">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[9px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 select-none">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-[#a3a3a3] text-center py-4">
                          No notifications yet
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) markAsRead(n.id);
                            }}
                            className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                              n.isRead
                                ? "bg-white border-[#f5f5f5]"
                                : "bg-[#fafafa] border-[#e5e5e5] hover:border-[#d4d4d4]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span
                                className={`text-[11px] font-semibold ${
                                  n.isRead ? "text-[#525252]" : "text-[#111]"
                                }`}
                              >
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#f97316] shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-[10px] text-[#737373] mt-1 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center border-l border-[#e5e5e5] pl-3">
                <UserButton />
              </div>
            </>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-4">
              <SignInButton mode="modal">
                <button className="text-xs font-medium text-[#737373] hover:text-[#111] transition-colors cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-[#0a0a0a] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#262626] transition-colors cursor-pointer">
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
