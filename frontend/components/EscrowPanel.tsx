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

  // --- Physical handover logic ---
  // Is there a physical item involved?
  const myIsPhysical = myDeposit?.coupon_code === "PHYSICAL_HANDOVER";
  const partnerIsPhysical = partnerDeposit?.coupon_code === "PHYSICAL_HANDOVER";
  const hasPhysicalItem = myIsPhysical || partnerIsPhysical;

  // For physical+digital swaps, the digital person must confirm they received
  // the physical coupon before we reveal the digital code to the physical person.
  // We use verification_status="verified" on the DIGITAL person's deposit for this.
  const myDepositVerified = myDeposit?.verification_status === "verified";
  const partnerDepositVerified = partnerDeposit?.verification_status === "verified";

  // Can we reveal codes?
  // - Pure digital swap: reveal immediately when both deposited
  // - Physical+digital: reveal only after the digital holder confirms physical receipt
  const digitalHolderConfirmedPhysical =
    hasPhysicalItem &&
    ((!myIsPhysical && myDepositVerified) || (!partnerIsPhysical && partnerDepositVerified));

  const canReveal = bothDeposited && (!hasPhysicalItem || digitalHolderConfirmedPhysical);

  // Does the current user (digital holder) need to confirm physical receipt?
  const iNeedToConfirmPhysicalReceipt =
    bothDeposited &&
    hasPhysicalItem &&
    !myIsPhysical && // I have the digital code
    !myDepositVerified; // I haven't confirmed yet

  // Auto-fill from listing
  const handleAutoFill = () => {
    if (myCouponCode) setMyCode(myCouponCode.toUpperCase());
    if (myCouponExpiry) {
      // Convert to YYYY-MM-DD for the HTML5 date input
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

  // Digital holder confirms they physically received the coupon.
  // This sets verification_status="verified" on their own deposit, which triggers the reveal.
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
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex items-center gap-2 text-zinc-500 text-xs">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading escrow status...</span>
      </div>
    );
  }

  if (!senderIsCoupon && !receiverIsCoupon) return null;

  return (
    <div className="bg-white border border-violet-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-violet-600 px-6 py-4 flex items-center gap-2.5">
        <ShieldCheck className="h-5 w-5 text-white" />
        <div>
          <h3 className="text-sm font-bold text-white">Coupon Escrow System</h3>
          <p className="text-[10px] text-violet-200 mt-0.5">
            {hasPhysicalItem
              ? "Digital code is revealed only after physical coupon handover is confirmed."
              : "Both parties must deposit their codes. Revealed simultaneously once both have deposited."}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Deposit status cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl border p-3 text-center ${myDeposit ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
            {myDeposit ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            ) : (
              <Clock className="h-5 w-5 text-zinc-400 mx-auto mb-1" />
            )}
            <p className="text-[10px] font-bold text-zinc-700">You</p>
            <p className={`text-[9px] font-semibold mt-0.5 ${myDeposit ? "text-emerald-700" : "text-zinc-400"}`}>
              {myDeposit ? (myIsPhysical ? "Ready ✓" : "Deposited ✓") : "Pending"}
            </p>
          </div>

          <div className={`rounded-xl border p-3 text-center ${partnerDeposit ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
            {partnerDeposit ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
            ) : (
              <Clock className="h-5 w-5 text-zinc-400 mx-auto mb-1" />
            )}
            <p className="text-[10px] font-bold text-zinc-700">Partner</p>
            <p className={`text-[9px] font-semibold mt-0.5 ${partnerDeposit ? "text-emerald-700" : "text-zinc-400"}`}>
              {partnerDeposit ? (partnerIsPhysical ? "Ready ✓" : "Deposited ✓") : "Waiting..."}
            </p>
          </div>
        </div>

        {/* Digital deposit form */}
        {!myDeposit && myIsCoupon && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-violet-600" />
              Deposit your coupon code for &quot;{myItemTitle}&quot;
            </p>

            {myCouponCode && (
              <button type="button" onClick={handleAutoFill} className="text-[10px] text-violet-600 font-semibold hover:underline flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                Auto-fill from your listing
              </button>
            )}

            <input
              type="text"
              value={myCode}
              onChange={(e) => setMyCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code (e.g. SAVE50)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-mono text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              style={{ textTransform: "uppercase" }}
            />

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Expiry Date</label>
              <input
                type="date"
                value={myExpiry}
                min={tomorrowStr}
                onChange={(e) => setMyExpiry(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={submitting || !myCode.trim()}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-white py-3 text-xs font-bold hover:bg-violet-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              <span>{submitting ? "Depositing..." : "Deposit into Escrow"}</span>
            </button>
          </div>
        )}

        {/* Physical item — confirm ready for handover */}
        {!myDeposit && !myIsCoupon && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
              Physical Item Acknowledgment
            </p>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Your item (&quot;{myItemTitle}&quot;) is a physical coupon. Click below to confirm you are ready to hand it over in person. 
              The other party&apos;s digital code will only be revealed to you <strong>after they confirm they received your physical coupon</strong>.
            </p>
            <button
              onClick={handlePhysicalDeposit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-white py-3 text-xs font-bold hover:bg-violet-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>{submitting ? "Confirming..." : "Confirm Ready for Handover"}</span>
            </button>
          </div>
        )}

        {/* Waiting for partner after my deposit */}
        {myDeposit && !bothDeposited && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {myIsPhysical
                ? "You've confirmed you're ready. Waiting for your partner to deposit their coupon code."
                : "Your code is safely locked in escrow. Waiting for your partner to deposit their code."}
            </span>
          </div>
        )}

        {/* Both deposited — Physical receipt confirmation needed */}
        {bothDeposited && iNeedToConfirmPhysicalReceipt && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <HandshakeIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Physical Handover Required</p>
                <p className="leading-relaxed">
                  Your partner is ready to hand over their physical coupon &quot;{partnerItemTitle}&quot;. 
                  Meet in person, receive the physical coupon, then click the button below to confirm receipt.
                  Only then will the escrow unlock and reveal your partner&apos;s digital code to them.
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirmPhysicalReceived}
              disabled={confirming}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white py-3 text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {confirming ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              <span>{confirming ? "Confirming..." : "I Have Received the Physical Coupon"}</span>
            </button>
          </div>
        )}

        {/* Both deposited — Physical person waiting for confirmation */}
        {bothDeposited && myIsPhysical && !digitalHolderConfirmedPhysical && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Both parties are ready. Hand over your physical coupon in person. 
              Once your partner confirms they received it, their digital code will be revealed to you.
            </span>
          </div>
        )}

        {/* REVEAL — both conditions met */}
        {canReveal && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <Unlock className="h-4 w-4" />
              <span>Escrow unlocked — codes revealed!</span>
            </div>

            {/* My code (only if I have a digital code) */}
            {!myIsPhysical && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Your Code</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-bold text-zinc-900 tracking-widest">
                    {myDeposit!.coupon_code}
                  </code>
                  <button onClick={() => handleCopy(myDeposit!.coupon_code, "my")} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                    {copied === "my" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {myDeposit!.coupon_expiry && (
                  <p className="text-[10px] text-zinc-400 mt-1.5">Expires: {new Date(myDeposit!.coupon_expiry).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {/* Partner's code */}
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider mb-2">
                Partner&apos;s Code — &quot;{partnerItemTitle}&quot;
              </p>
              {partnerIsPhysical ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Physical coupon received and confirmed ✓</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono font-bold text-violet-900 tracking-widest">
                      {partnerDeposit!.coupon_code}
                    </code>
                    <button onClick={() => handleCopy(partnerDeposit!.coupon_code, "partner")} className="text-violet-400 hover:text-violet-700 transition-colors">
                      {copied === "partner" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {partnerDeposit!.coupon_expiry && (
                    <p className="text-[10px] text-violet-400 mt-1.5">Expires: {new Date(partnerDeposit!.coupon_expiry).toLocaleDateString()}</p>
                  )}
                </>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              ✅ Use the codes above and mark the swap as <strong>Completed</strong> once you&apos;ve verified everything.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
