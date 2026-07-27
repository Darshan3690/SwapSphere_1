"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ticket,
  ShieldCheck,
  Copy,
  Check,
  HandshakeIcon,
} from "lucide-react";

interface EscrowDeposit {
  id: string;
  depositor_id: string;
  item_id: string;
  coupon_code: string;
  coupon_expiry: string | null;
  verification_status: string;
  deposited_at: string;
}

interface EscrowPanelProps {
  swapRequestId: string;
  senderId: string;
  receiverId: string;
  senderItemId: string;
  receiverItemId: string;
  senderItemTitle: string;
  receiverItemTitle: string;
  senderIsCoupon: boolean;
  receiverIsCoupon: boolean;
  senderCouponCode?: string | null;
  receiverCouponCode?: string | null;
  senderCouponExpiry?: string | null;
  receiverCouponExpiry?: string | null;
}

export default function EscrowPanel({
  swapRequestId,
  senderId,
  receiverId,
  senderItemId,
  receiverItemId,
  senderItemTitle,
  receiverItemTitle,
  senderIsCoupon,
  receiverIsCoupon,
  senderCouponCode,
  receiverCouponCode,
  senderCouponExpiry,
  receiverCouponExpiry,
}: EscrowPanelProps) {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<EscrowDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myCode, setMyCode] = useState("");
  const [myExpiry, setMyExpiry] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchDeposits = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const response = await fetch(`/api/escrow?swapRequestId=${swapRequestId}`);
      if (!response.ok) throw new Error("Failed to fetch escrow deposits");
      const data = await response.json();
      setDeposits(data || []);
    } catch (err: any) {
      setError("Failed to load escrow status.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits(true);
    const interval = setInterval(() => fetchDeposits(false), 5000);
    return () => clearInterval(interval);
  }, [swapRequestId]);

  if (!user) return null;

  const isUserSender = user.id === senderId;
  const myItemId = isUserSender ? senderItemId : receiverItemId;
  const myItemTitle = isUserSender ? senderItemTitle : receiverItemTitle;
  const myIsCoupon = isUserSender ? senderIsCoupon : receiverIsCoupon;
  const partnerItemTitle = isUserSender ? receiverItemTitle : senderItemTitle;
  const myCouponCode = isUserSender ? senderCouponCode : receiverCouponCode;
  const myCouponExpiry = isUserSender ? senderCouponExpiry : receiverCouponExpiry;

  const myDeposit = deposits.find((d) => d.depositor_id === user.id);
  const partnerDeposit = deposits.find((d) => d.depositor_id !== user.id);
  const bothDeposited = !!myDeposit && !!partnerDeposit;

  // Physical handover logic
  const myIsPhysical = myDeposit?.coupon_code === "PHYSICAL_HANDOVER";
  const partnerIsPhysical = partnerDeposit?.coupon_code === "PHYSICAL_HANDOVER";
  const hasPhysicalItem = myIsPhysical || partnerIsPhysical;

  const myDepositVerified = myDeposit?.verification_status === "verified";
  const partnerDepositVerified = partnerDeposit?.verification_status === "verified";

  const digitalHolderConfirmedPhysical =
    hasPhysicalItem &&
    ((!myIsPhysical && myDepositVerified) || (!partnerIsPhysical && partnerDepositVerified));

  const canReveal = bothDeposited && (!hasPhysicalItem || digitalHolderConfirmedPhysical);

  const iNeedToConfirmPhysicalReceipt =
    bothDeposited &&
    hasPhysicalItem &&
    !myIsPhysical &&
    !myDepositVerified;

  // Auto-fill from listing
  const handleAutoFill = () => {
    if (myCouponCode) setMyCode(myCouponCode.toUpperCase());
    if (myCouponExpiry) {
      const datePart = new Date(myCouponExpiry).toISOString().split("T")[0];
      setMyExpiry(datePart);
    }
  };

  const handleDeposit = async () => {
    if (!user || !myCode.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      if (myExpiry) {
        const expiry = new Date(myExpiry);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expiry <= today) {
          setError("This coupon has already expired. You cannot deposit an expired coupon into escrow.");
          setSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swapRequestId,
          itemId: myItemId,
          couponCode: myCode.trim().toUpperCase(),
          couponExpiry: myExpiry || null,
          verificationStatus: "pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to deposit into escrow.");
      }

      await fetchDeposits(false);
    } catch (err: any) {
      setError(err.message || "Failed to deposit into escrow.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhysicalDeposit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swapRequestId,
          itemId: myItemId,
          couponCode: "PHYSICAL_HANDOVER",
          couponExpiry: null,
          verificationStatus: "pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to confirm handover.");
      }

      await fetchDeposits(false);
    } catch (err: any) {
      setError(err.message || "Failed to confirm handover.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPhysicalReceived = async () => {
    if (!user || !myDeposit) return;
    setConfirming(true);
    setError(null);

    try {
      const response = await fetch("/api/escrow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: myDeposit.id,
          verificationStatus: "verified",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to confirm receipt.");
      }

      await fetchDeposits(false);
    } catch (err: any) {
      setError(err.message || "Failed to confirm receipt.");
    } finally {
      setConfirming(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-2.5 text-slate-500 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
        <span className="font-medium">Loading escrow verification status...</span>
      </div>
    );
  }

  if (!senderIsCoupon && !receiverIsCoupon) return null;

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-6 py-4 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-white flex-shrink-0" />
        <div>
          <h3 className="font-heading text-sm font-bold text-white">Coupon Double-Escrow Protocol</h3>
          <p className="text-[11px] text-indigo-100 mt-0.5">
            {hasPhysicalItem
              ? "Digital code is revealed only after physical coupon handover is confirmed."
              : "Both parties deposit codes securely. Revealed simultaneously once both have deposited."}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Deposit status cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-xl border p-3.5 text-center ${myDeposit ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
            {myDeposit ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            ) : (
              <Clock className="h-5 w-5 text-slate-400 mx-auto mb-1" />
            )}
            <p className="text-xs font-bold text-slate-900">Your Deposit</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${myDeposit ? "text-emerald-700" : "text-slate-400"}`}>
              {myDeposit ? (myIsPhysical ? "Handover Ready ✓" : "Code Deposited ✓") : "Pending Deposit"}
            </p>
          </div>

          <div className={`rounded-xl border p-3.5 text-center ${partnerDeposit ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}>
            {partnerDeposit ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            ) : (
              <Clock className="h-5 w-5 text-slate-400 mx-auto mb-1" />
            )}
            <p className="text-xs font-bold text-slate-900">Partner&apos;s Deposit</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${partnerDeposit ? "text-emerald-700" : "text-slate-400"}`}>
              {partnerDeposit ? (partnerIsPhysical ? "Handover Ready ✓" : "Code Deposited ✓") : "Waiting for Partner..."}
            </p>
          </div>
        </div>

        {/* Digital deposit form */}
        {!myDeposit && myIsCoupon && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
              <Lock className="h-4 w-4 text-indigo-600" />
              Deposit coupon code for &quot;{myItemTitle}&quot;
            </p>

            {myCouponCode && (
              <button type="button" onClick={handleAutoFill} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                Auto-fill from your listing
              </button>
            )}

            <input
              type="text"
              value={myCode}
              onChange={(e) => setMyCode(e.target.value.toUpperCase())}
              placeholder="Enter secret coupon code (e.g. SAVE50)"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ textTransform: "uppercase" }}
            />

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Coupon Expiry Date</label>
              <input
                type="date"
                value={myExpiry}
                min={tomorrowStr}
                onChange={(e) => setMyExpiry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={submitting || !myCode.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              <span>{submitting ? "Locking in Escrow..." : "Lock Code into Escrow"}</span>
            </button>
          </div>
        )}

        {/* Physical item acknowledgement */}
        {!myDeposit && !myIsCoupon && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Physical Voucher Acknowledgment
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your item (&quot;{myItemTitle}&quot;) is a physical coupon. Click below to confirm you are ready to hand it over in person. 
              The other party&apos;s digital code will only be revealed to you <strong>after they confirm receipt of your physical coupon</strong>.
            </p>
            <button
              onClick={handlePhysicalDeposit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-3 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{submitting ? "Confirming..." : "Confirm Ready for Physical Handover"}</span>
            </button>
          </div>
        )}

        {/* Waiting for partner */}
        {myDeposit && !bothDeposited && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>
              {myIsPhysical
                ? "You've confirmed handover readiness. Waiting for your partner to deposit their coupon code."
                : "Your coupon code is locked securely in escrow. Waiting for your partner to deposit their code."}
            </span>
          </div>
        )}

        {/* Both deposited — Physical receipt confirmation needed */}
        {bothDeposited && iNeedToConfirmPhysicalReceipt && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
              <HandshakeIcon className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold mb-1">Physical Handover Required</p>
                <p className="leading-relaxed text-slate-700">
                  Your partner is ready to hand over their physical coupon &quot;{partnerItemTitle}&quot;. 
                  Meet in person, receive the physical coupon, then click the button below to confirm receipt.
                  Only then will the escrow unlock and reveal your digital code to them.
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirmPhysicalReceived}
              disabled={confirming}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            >
              {confirming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{confirming ? "Confirming..." : "I Have Received the Physical Coupon"}</span>
            </button>
          </div>
        )}

        {/* REVEAL — both conditions met */}
        {canReveal && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Unlock className="h-4.5 w-4.5 text-emerald-600" />
              <span>Escrow unlocked — codes revealed!</span>
            </div>

            {/* My code */}
            {!myIsPhysical && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Deposited Code</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-base font-mono font-extrabold text-slate-900 tracking-widest">
                    {myDeposit!.coupon_code}
                  </code>
                  <button onClick={() => handleCopy(myDeposit!.coupon_code, "my")} className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                    {copied === "my" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {myDeposit!.coupon_expiry && (
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">Expires: {new Date(myDeposit!.coupon_expiry).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {/* Partner's code */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-2xs">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">
                Partner&apos;s Revealed Code — &quot;{partnerItemTitle}&quot;
              </p>
              {partnerIsPhysical ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Physical coupon received and verified ✓</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-base font-mono font-extrabold text-indigo-950 tracking-widest">
                      {partnerDeposit!.coupon_code}
                    </code>
                    <button onClick={() => handleCopy(partnerDeposit!.coupon_code, "partner")} className="text-indigo-500 hover:text-indigo-700 transition-colors p-1">
                      {copied === "partner" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {partnerDeposit!.coupon_expiry && (
                    <p className="text-[10px] text-indigo-700 mt-1.5 font-medium">Expires: {new Date(partnerDeposit!.coupon_expiry).toLocaleDateString()}</p>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              ✅ Use the codes above and click <strong>Complete Exchange &amp; Trade</strong> in the console once verified.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
