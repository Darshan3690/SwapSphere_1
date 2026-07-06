"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import ScrollVelocity from "@/components/ScrollVelocity";
import BlurReveal from "@/components/BlurReveal";
import CountUp from "@/components/CountUp";
import FadeUp from "@/components/FadeUp";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, Shield, Zap, ArrowUpRight } from "lucide-react";
import { Show, SignInButton } from "@clerk/nextjs";

const TICKER_TEXT =
  "Electronics · Books · Fashion · Home · Games · Sports · Coupons · Vouchers · Digital Goods · Gift Cards";

const STEPS = [
  {
    num: "01",
    icon: <RefreshCw className="h-4 w-4" />,
    title: "List your coupon",
    desc: "Upload any unused voucher in under 60 seconds. Set what you'd like in return.",
  },
  {
    num: "02",
    icon: <Zap className="h-4 w-4" />,
    title: "Propose a swap",
    desc: "Browse the marketplace and send a swap offer. Negotiate directly in real-time chat.",
  },
  {
    num: "03",
    icon: <Shield className="h-4 w-4" />,
    title: "Exchange securely",
    desc: "Once both agree, codes are swapped through our secure escrow confirmation flow.",
  },
];

const STATS = [
  { to: 12000, suffix: "+", label: "Coupons listed" },
  { to: 4800, suffix: "", label: "Swaps completed" },
  { to: 100, suffix: "%", label: "Cashless" },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa] text-[#111]">
      <Navbar />

      <main className="flex-1 flex flex-col">

        {/* ── Hero ───────────────────────────────────────── */}
        <section
          className="relative overflow-hidden min-h-[calc(100vh-3.5rem)] flex items-center"
          style={{
            backgroundImage: `radial-gradient(circle, #d4d4d4 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        >
          {/* Gradient overlays to fade the dot grid subtly */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 50% 0%, #fafafa 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent 50%, #fafafa 100%)",
            }}
          />

          <div className="relative mx-auto max-w-7xl w-full px-6 sm:px-10 py-16 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-16 items-center">
            {/* Left */}
            <div>


              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl xl:text-[4.5rem] font-bold text-[#111] leading-[1.06] tracking-[-0.035em] max-w-2xl">
                <BlurReveal text="The smarter way" delay={0.1} />
                <br />
                <span className="inline-flex flex-wrap gap-x-[0.22em]">
                  <BlurReveal text="to exchange" delay={0.22} className="text-[#111]" />
                  {" "}
                  <BlurReveal text="coupons." delay={0.34} className="text-[#b4b4b4]" />
                </span>
              </h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="mt-6 max-w-sm text-[15px] text-[#737373] leading-[1.75]"
              >
                Browse unused vouchers. Propose a direct swap —
                no cash, no hassle.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.68, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="mt-10 flex flex-wrap items-center gap-3"
              >
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#262626] transition-colors"
                  >
                    Browse Marketplace
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="group inline-flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#262626] transition-colors cursor-pointer">
                      Start Swapping Free
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </SignInButton>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white/80 px-5 py-2.5 text-sm font-medium text-[#111] hover:bg-white transition-colors backdrop-blur-sm"
                  >
                    Browse first
                  </Link>
                </Show>
              </motion.div>
            </div>

            {/* Right — animated stats */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="hidden lg:flex flex-col gap-8 border-l border-[#e5e5e5] pl-10"
            >
              {STATS.map(({ to, suffix, label }) => (
                <div key={label}>
                  <p className="text-4xl font-bold tracking-[-0.04em] text-[#111] tabular-nums">
                    <CountUp to={to} suffix={suffix} />
                  </p>
                  <p className="mt-1 text-[11px] text-[#a3a3a3] font-medium uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Scroll Velocity Ticker ──────────────────────── */}
        <div className="ticker-fade border-y border-[#e5e5e5] bg-white py-5 overflow-hidden">
          <ScrollVelocity
            text={TICKER_TEXT}
            default_velocity={4}
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c4c4c4] select-none"
          />
        </div>

        {/* ── How It Works ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl w-full px-6 sm:px-10 py-24">
          {/* Header */}
          <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 border-b border-[#e5e5e5] pb-8">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a3a3a3]">
                How it works
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-[#111]">
                Three steps to your next swap.
              </h2>
            </div>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#111] transition-colors cursor-pointer whitespace-nowrap">
                  Get started
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-px group-hover:-translate-y-px transition-transform" />
                </button>
              </SignInButton>
            </Show>
          </FadeUp>

          {/* Steps — staggered */}
          <div className="grid grid-cols-1 gap-px bg-[#e5e5e5] sm:grid-cols-3">
            {STEPS.map(({ num, icon, title, desc }, i) => (
              <FadeUp key={num} delay={i * 0.1}>
                <div className="group h-full bg-white p-8 hover:bg-[#fafafa] transition-colors cursor-default">
                  <div className="flex items-start justify-between mb-8">
                    <span className="text-[11px] font-bold text-[#e5e5e5] tracking-widest font-mono">{num}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fafafa] border border-[#e5e5e5] text-[#737373] group-hover:bg-[#0a0a0a] group-hover:text-white group-hover:border-[#0a0a0a] transition-all duration-300">
                      {icon}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#111] tracking-[-0.01em]">{title}</h3>
                  <p className="mt-2 text-xs text-[#737373] leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ── Full-bleed CTA ────────────────────────────────── */}
        <section className="bg-[#0a0a0a] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <FadeUp>
            <div className="relative mx-auto max-w-7xl w-full px-6 sm:px-10 py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-[-0.025em]">
                  Ready to swap smarter?
                </h2>
                <p className="mt-2 text-sm text-[#525252]">
                  Join thousands already trading their coupons for free.
                </p>
              </div>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="group shrink-0 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                    Create free account
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="group shrink-0 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors"
                >
                  Open Marketplace
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Show>
            </div>
          </FadeUp>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-[#e5e5e5] bg-white py-6">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-[#111]">
              <path d="M7 17V4M7 4L3 8M7 4L11 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 7V20M17 20L13 16M17 20L21 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-semibold text-[#111]">swapsphere</span>
          </div>
          <p className="text-[11px] text-[#a3a3a3]">© 2026 swapsphere. All rights reserved.</p>
          <p className="text-[11px] font-medium text-[#a3a3a3] uppercase tracking-[0.08em]">
            Cashless · Trustless · Seamless
          </p>
        </div>
      </footer>
    </div>
  );
}
