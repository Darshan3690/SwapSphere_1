import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  isEscrowStatus,
  isValidObjectId,
  jsonError,
  parseFutureDate,
  readJsonObject,
  trimmedString,
} from "@/lib/api";

const PHYSICAL_HANDOVER_CODE = "PHYSICAL_HANDOVER";

type EscrowDepositForReveal = {
  depositorId: string;
  couponCode: string;
  verificationStatus: string;
};

function escrowCanReveal(deposits: EscrowDepositForReveal[]) {
  if (deposits.length < 2) return false;
  if (deposits.some((deposit) => deposit.verificationStatus === "invalid")) return false;

  const hasPhysical = deposits.some((deposit) => deposit.couponCode === PHYSICAL_HANDOVER_CODE);
  if (!hasPhysical) return true;

  return deposits.some(
    (deposit) =>
      deposit.couponCode !== PHYSICAL_HANDOVER_CODE &&
      deposit.verificationStatus === "verified"
  );
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const swapRequestId = url.searchParams.get("swapRequestId");

    if (!swapRequestId) {
      return NextResponse.json({ error: "Missing swapRequestId parameter" }, { status: 400 });
    }

    if (!isValidObjectId(swapRequestId)) {
      return jsonError("Invalid swap request id", 400);
    }

    // Verify user belongs to the swap request
    const swap = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not authorized" }, { status: 403 });
    }

    const deposits = await prisma.escrowDeposit.findMany({
      where: { swapRequestId },
    });

    const canReveal = escrowCanReveal(deposits);

    // Adapt to SQL naming format expected by frontend
    const adaptedDeposits = deposits.map((dep) => ({
      id: dep.id,
      swap_request_id: dep.swapRequestId,
      depositor_id: dep.depositorId,
      item_id: dep.itemId,
      coupon_code:
        dep.depositorId === userId ||
        canReveal ||
        dep.couponCode === PHYSICAL_HANDOVER_CODE
          ? dep.couponCode
          : null,
      is_revealed:
        dep.depositorId === userId ||
        canReveal ||
        dep.couponCode === PHYSICAL_HANDOVER_CODE,
      coupon_expiry: dep.couponExpiry ? dep.couponExpiry.toISOString() : null,
      verification_status: dep.verificationStatus,
      deposited_at: dep.depositedAt.toISOString(),
    }));

    return NextResponse.json(adaptedDeposits, { status: 200 });
  } catch (error: any) {
    console.error("GET Escrow Deposits Error:", error);
    return NextResponse.json({ error: "Failed to fetch escrow deposits" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return jsonError("Invalid JSON request body", 400);
    }

    const { swapRequestId, itemId, couponCode, couponExpiry, verificationStatus } = body;

    if (!swapRequestId || !itemId || !couponCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidObjectId(swapRequestId) || !isValidObjectId(itemId)) {
      return jsonError("Invalid escrow request identifiers", 400);
    }

    const couponCodeValue = trimmedString(couponCode);
    if (!couponCodeValue) {
      return jsonError("Coupon code is required", 400);
    }

    // Verify user belongs to the swap request
    const swap = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        senderItem: true,
        receiverItem: true,
      },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not authorized" }, { status: 403 });
    }

    if (swap.status !== "Accepted") {
      return jsonError("Escrow deposits can only be submitted for accepted swaps", 400);
    }

    const userItemId = swap.senderId === userId ? swap.senderItemId : swap.receiverItemId;
    const userItem = swap.senderId === userId ? swap.senderItem : swap.receiverItem;
    if (itemId !== userItemId || !userItem) {
      return jsonError("Escrow item does not belong to you in this swap", 403);
    }

    const normalizedCouponCode = couponCodeValue.toUpperCase();
    if (userItem.isCoupon && normalizedCouponCode === PHYSICAL_HANDOVER_CODE) {
      return jsonError("Digital coupon listings must deposit the actual coupon code", 400);
    }
    if (!userItem.isCoupon && normalizedCouponCode !== PHYSICAL_HANDOVER_CODE) {
      return jsonError("Physical listings must use the physical handover confirmation", 400);
    }

    let expiryDate: Date | null = null;
    if (userItem.isCoupon) {
      const parsedExpiry = couponExpiry
        ? parseFutureDate(couponExpiry, "Coupon expiry date")
        : { value: null, error: undefined };
      if (parsedExpiry.error) {
        return jsonError(parsedExpiry.error, 400);
      }
      expiryDate = parsedExpiry.value;
    }

    if (verificationStatus && verificationStatus !== "pending") {
      return jsonError("New escrow deposits must start as pending", 400);
    }

    // Create deposit
    const deposit = await prisma.escrowDeposit.create({
      data: {
        swapRequestId,
        depositorId: userId,
        itemId,
        couponCode: normalizedCouponCode,
        couponExpiry: expiryDate,
        verificationStatus: "pending",
      },
    });

    return NextResponse.json(deposit, { status: 201 });
  } catch (error: any) {
    console.error("POST Escrow Deposit Error:", error);
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You have already deposited your code into escrow." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit escrow deposit" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonObject(request);
    if (!body) {
      return jsonError("Invalid JSON request body", 400);
    }

    const { id, verificationStatus } = body;

    if (!id || !verificationStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidObjectId(id)) {
      return jsonError("Invalid escrow deposit id", 400);
    }

    if (!isEscrowStatus(verificationStatus) || verificationStatus === "pending") {
      return jsonError("Invalid verification status", 400);
    }

    // Verify user is authorized (they own the deposit or are the other party in the swap)
    const deposit = await prisma.escrowDeposit.findUnique({
      where: { id },
      include: {
        swapRequest: true,
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.swapRequest.senderId !== userId && deposit.swapRequest.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (deposit.swapRequest.status !== "Accepted") {
      return jsonError("Escrow status can only be updated while the swap is accepted", 400);
    }

    if (deposit.depositorId !== userId) {
      return jsonError("You can only verify your own escrow deposit", 403);
    }

    const updated = await prisma.escrowDeposit.update({
      where: { id },
      data: {
        verificationStatus,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("PATCH Escrow Deposit Error:", error);
    return NextResponse.json({ error: "Failed to update deposit verification status" }, { status: 500 });
  }
}
