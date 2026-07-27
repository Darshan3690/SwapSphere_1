"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import ScrollVelocity from "@/components/ScrollVelocity";
import BlurReveal from "@/components/BlurReveal";
import CountUp from "@/components/CountUp";
import FadeUp from "@/components/FadeUp";
import CardTilt from "@/components/CardTilt";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  RefreshCw,
  Shield,
  Zap,
  Check,
  Sparkles,
  ChevronDown,
  Gift,
  Clock,
  Ticket,
  Lock,
  ArrowUpRight,
  Users,
  Percent
} from "lucide-react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

const TICKER_TEXT =
  "Electronics · Amazon Pay · Netflix · Flipkart · Starbucks · Spotify · Gaming Keys · Myntra · Travel Vouchers · Gift Cards";

const STEPS = [
  {
    num: "01",
    icon: <Ticket className="h-5 w-5 text-indigo-600" />,
    title: "List your voucher",
    desc: "Upload any unused gift card or coupon in under 60 seconds. Set your preferred trade.",
  },
  {
    num: "02",
    icon: <Zap className="h-5 w-5 text-indigo-600" />,
    title: "Propose a swap",
    desc: "Browse hundreds of active listings and send instant barter requests with 1-click.",
  },
  {
    num: "03",
    icon: <Shield className="h-5 w-5 text-indigo-600" />,
    title: "Exchange securely",
    desc: "Both parties deposit codes into our double-escrow tank for 100% verified, scam-free releases.",
  },
];

const STATS = [
  { to: 12000, suffix: "+", label: "Active Listings" },
  { to: 4800, suffix: "", label: "Completed Swaps" },
  { to: 100, suffix: "%", label: "Cashless & Secure" },
];

const MOCK_PREVIEW_COUPONS = [
  {
    brand: "Amazon Pay",
    value: "₹2,500",
    desc: "Valid on all store items, no minimum order limit.",
    bg: "from-amber-500 to-orange-600",
    req: "Netflix Premium / Spotify",
    category: "Gift Cards",
    daysLeft: 12,
  },
  {
    brand: "Starbucks India",
    value: "₹1,000",
    desc: "Complimentary handcrafted beverage & pastry.",
    bg: "from-emerald-600 to-teal-700",
    req: "Amazon / Nike Store",
    category: "Food & Drinks",
    daysLeft: 4,
  },
  {
    brand: "Nike Store",
    value: "20% OFF",
    desc: "Promo code for apparel, sneakers and accessories.",
    bg: "from-indigo-600 to-violet-700",
    req: "Steam Key / Games",
    category: "Fashion",
    daysLeft: 8,
  },
  {
    brand: "PlayStation Network",
    value: "₹500",
    desc: "PSN store wallet recharge digital voucher.",
    bg: "from-blue-600 to-indigo-700",
    req: "Starbucks / BookMyShow",
    category: "Gaming",
    daysLeft: 22,
  }
];

const FAQS = [
  {
    question: "How does the secure double escrow system work?",
    answer: "Once both users agree to a swap, SwapSphere acts as a secure intermediary holding tank. When both parties input and verify their codes, our escrow system exchanges the coupon codes simultaneously, preventing one-sided scam attempts."
  },
  {
    question: "Are there any listing or trade fees?",
    answer: "No! SwapSphere is 100% cashless and 100% free. We believe in direct peer-to-peer barter. You swap what you have for what you need without paying middleman cuts."
  },
  {
    question: "What items can be listed on SwapSphere?",
    answer: "We support unused gift cards, promo codes, subscription codes, discount vouchers, game keys, event tickets, and more. All items are verified during listing to ensure a high-trust marketplace."
  },
  {
    question: "Can I sell coupons for cash instead of swapping?",
    answer: "Yes! While swapping is our primary focus, sellers can toggle 'Sell Only' or 'Swap & Sell' and set a price in INR. Buyers can buy securely via integrated cashless escrow."
  }
];

// Clean Light Landing Navbar
function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
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
        </div>

        {/* Right side navigation triggers */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm shadow-indigo-200"
            >
              Go to Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer px-3 py-1.5">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all active:scale-[0.98] cursor-pointer shadow-sm shadow-indigo-200">
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

// Interactive Swap Demonstration Widget (SaaS Light Theme)
function SwapDemo() {
  const [swapping, setSwapping] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [itemsOrder, setItemsOrder] = useState(["A", "B"]);

  const handleSwap = () => {
    if (swapping) return;
    setSwapping(true);
    setTimeout(() => {
      setItemsOrder(prev => [...prev].reverse());
      setSwapped(prev => !prev);
      setSwapping(false);
    }, 900);
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/60 w-full max-w-[460px] mx-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/30 pointer-events-none" />
      
      <div className="relative flex justify-between items-center gap-6 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {itemsOrder.map((item) => {
            if (item === "A") {
              return (
                <motion.div
                  key="card-a"
                  layout
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  className="relative z-10 w-[140px] aspect-[2/3] rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white flex flex-col justify-between shadow-md shadow-orange-500/20 border border-white/20"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold tracking-wider opacity-90 uppercase">Amazon</span>
                    <div className="p-1 rounded-md bg-white/20 backdrop-blur-md">
                      <Gift className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-heading text-xl font-extrabold tracking-tight">₹2,000</div>
                    <div className="text-[9px] opacity-85 font-medium mt-0.5">Gift Voucher</div>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex items-center justify-between">
                    <span className="text-[9px] font-medium opacity-80">OWNER: ALEX</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                </motion.div>
              );
            } else {
              return (
                <motion.div
                  key="card-b"
                  layout
                  transition={{ type: "spring", stiffness: 120, damping: 15 }}
                  className="relative z-10 w-[140px] aspect-[2/3] rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white flex flex-col justify-between shadow-md shadow-indigo-500/20 border border-white/20"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold tracking-wider opacity-90 uppercase">Netflix</span>
                    <div className="p-1 rounded-md bg-white/20 backdrop-blur-md">
                      <Zap className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-heading text-lg font-extrabold tracking-tight">3 Months</div>
                    <div className="text-[9px] opacity-85 font-medium mt-0.5">Premium Plan</div>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex items-center justify-between">
                    <span className="text-[9px] font-medium opacity-80">OWNER: SARA</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                </motion.div>
              );
            }
          })}
        </AnimatePresence>

        {/* Swap Trigger Button */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
          <motion.button
            onClick={handleSwap}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg text-white transition-all cursor-pointer ${
              swapping ? "bg-amber-500 animate-spin" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </motion.button>
          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full select-none">
            {swapping ? "Trading" : "Swap Now"}
          </span>
        </div>
      </div>

      {/* Success Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={swapped && !swapping ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.95 }}
        className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>Escrow Verified: Amazon code sent to Sara, Netflix code sent to Alex!</span>
      </motion.div>
    </div>
  );
}

// FAQ Accordion Item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200/80 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-heading font-semibold text-slate-900 focus:outline-none cursor-pointer"
      >
        <span className="text-sm">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 flex-shrink-0 ml-4"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed pr-6">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden relative">
      <LandingNavbar />

      {/* Subtle SaaS Background Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-br from-indigo-100/60 via-blue-50/40 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <main className="flex-1 flex flex-col relative z-10">

        {/* ── Hero Section ─────────────────────────────────── */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Headline Column */}
            <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
              {/* Badge info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 self-center lg:self-start rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-semibold text-indigo-700 mb-6 shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>100% Cashless Peer-to-Peer Bartering Platform</span>
              </motion.div>

              {/* Main Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                Swap your unused coupons.{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Get what you need.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                SwapSphere lets you safely trade unused gift cards, vouchers, and promo codes directly with other users through our automated double-escrow verification system.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer">
                    Start Swapping Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignUpButton>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                >
                  Explore Marketplace
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>No Listing Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Verified Escrow</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Instant Exchange</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Demo Column */}
            <div className="lg:col-span-5 flex justify-center">
              <SwapDemo />
            </div>

          </div>
        </section>

        {/* ── Ticker Bar ───────────────────────────────────── */}
        <div className="border-y border-slate-200/80 bg-white py-4 shadow-2xs ticker-fade overflow-hidden">
          <ScrollVelocity text={TICKER_TEXT} default_velocity={2} className="text-xs font-bold uppercase tracking-wider text-slate-500 mx-6" />
        </div>

        {/* ── Stats Bar ────────────────────────────────────── */}
        <section className="py-12 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STATS.map((stat, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-xs"
                >
                  <div className="font-heading text-3xl sm:text-4xl font-extrabold text-indigo-600">
                    <CountUp to={stat.to} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works Section ─────────────────────────── */}
        <section className="py-20 bg-white border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Simple 3-Step Barter
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
                How SwapSphere Works
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                No money needed. Trade what you don't use for deals you love in three easy steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="relative h-full rounded-2xl border border-slate-200/90 bg-slate-50/50 p-8 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
                        {step.icon}
                      </div>
                      <span className="font-heading text-2xl font-black text-slate-300">
                        {step.num}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Marketplace Preview ────────────────────── */}
        <section className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Live Deals
                </span>
                <h2 className="font-heading text-3xl font-extrabold text-slate-900 mt-3">
                  Featured Marketplace Vouchers
                </h2>
              </div>
              <Link
                href="/dashboard"
                className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                View all listings
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_PREVIEW_COUPONS.map((coupon, i) => (
                <FadeUp key={i} delay={i * 0.08}>
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between h-full">
                    <div>
                      <div className={`rounded-xl bg-gradient-to-r ${coupon.bg} p-4 text-white mb-4 shadow-sm`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{coupon.category}</span>
                        <div className="font-heading text-xl font-black mt-1">{coupon.value}</div>
                        <div className="text-xs font-semibold mt-0.5">{coupon.brand}</div>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {coupon.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">Wants: {coupon.req}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        {coupon.daysLeft}d left
                      </span>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ Section ────────────────────────────────── */}
        <section className="py-20 bg-white border-t border-slate-200/80">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl font-extrabold text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                Everything you need to know about swapping and our escrow protocol.
              </p>
            </div>

            <div className="space-y-1">
              {FAQS.map((faq, idx) => (
                <FaqItem key={idx} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────── */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-8 sm:p-12 text-white text-center shadow-xl shadow-indigo-200">
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
                Turn your unused coupons into instant value today.
              </h2>
              <p className="mt-3 text-sm text-indigo-100 max-w-xl mx-auto">
                Join thousands of users exchanging vouchers safely without spending a single rupee.
              </p>
              <div className="mt-8 flex justify-center">
                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer shadow-md">
                    Get Started Free
                  </button>
                </SignUpButton>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© {new Date().getFullYear()} SwapSphere Inc. Cashless peer-to-peer voucher barter platform.</p>
        </div>
      </footer>
    </div>
  );
}
