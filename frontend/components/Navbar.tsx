"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
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

          {/* Main nav links */}
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
