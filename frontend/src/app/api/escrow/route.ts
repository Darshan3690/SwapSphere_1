import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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

    // Adapt to SQL naming format expected by frontend
    const adaptedDeposits = deposits.map((dep) => ({
      id: dep.id,
      swap_request_id: dep.swapRequestId,
      depositor_id: dep.depositorId,
      item_id: dep.itemId,
      coupon_code: dep.couponCode,
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

    const body = await request.json();
    const { swapRequestId, itemId, couponCode, couponExpiry, verificationStatus } = body;

    if (!swapRequestId || !itemId || !couponCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    const expiryDate = couponExpiry ? new Date(couponExpiry) : null;
    if (expiryDate && expiryDate <= new Date()) {
      return NextResponse.json({ error: "This coupon is expired" }, { status: 400 });
    }

    // Create deposit
    const deposit = await prisma.escrowDeposit.create({
      data: {
        swapRequestId,
        depositorId: userId,
        itemId,
        couponCode: couponCode.trim().toUpperCase(),
        couponExpiry: expiryDate,
        verificationStatus: verificationStatus || "pending",
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

    const body = await request.json();
    const { id, verificationStatus } = body;

    if (!id || !verificationStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    const updated = await prisma.escrowDeposit.update({
      where: { id },
      data: {
        verificationStatus,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("PATCH Escrow Deposit Error:", error);
    return NextResponse.json({ error: "Failed to update deposit verification status" }, { status: 550 });
  }
}
