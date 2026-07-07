import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, amountPaid } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment confirmation details" }, { status: 400 });
    }

    // Find the item
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId === userId) {
      return NextResponse.json({ error: "You cannot purchase your own listing" }, { status: 400 });
    }

    if (item.status !== "Available") {
      return NextResponse.json({ error: "This item is no longer available for purchase" }, { status: 400 });
    }

    // Server-side Razorpay verification (if credentials are set in environment variables)
    const rzKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const rzKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (rzKeyId && rzKeySecret) {
      try {
        const authHeader = "Basic " + Buffer.from(`${rzKeyId}:${rzKeySecret}`).toString("base64");
        const rzResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { Authorization: authHeader },
        });

        if (!rzResponse.ok) {
          return NextResponse.json({ error: "Failed to verify payment with payment gateway" }, { status: 400 });
        }

        const payment = await rzResponse.json();
        
        // Calculate expected price
        const expectedPrice = item.price !== null && item.price !== undefined ? item.price : 99;
        const expectedAmountPaise = expectedPrice * 100;
        
        if (payment.status !== "captured") {
          return NextResponse.json({ error: `Payment verification failed: status is ${payment.status}` }, { status: 400 });
        }

        if (Math.abs(payment.amount - expectedAmountPaise) > 10) {
          return NextResponse.json({ error: "Payment verification failed: amount mismatch" }, { status: 400 });
        }
      } catch (err: any) {
        console.error("Razorpay verification error:", err);
        return NextResponse.json({ error: "Payment verification system error" }, { status: 500 });
      }
    } else {
      console.warn("Razorpay API credentials not configured. Skipping payment verification for testing.");
    }

    // Update status to Sold/Swapped so it's no longer available in the marketplace
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        status: "Sold",
      },
    });

    // Trigger Notification for the seller
    try {
      const buyerProfile = await prisma.profile.findUnique({ where: { id: userId } });
      const buyerName = buyerProfile?.username || "A buyer";

      await prisma.notification.create({
        data: {
          userId: item.userId,
          title: "Voucher Purchased Directly!",
          message: `@${buyerName} purchased your listing: "${item.title}" for ₹${item.price || 0}.`,
          isRead: false,
        },
      });
    } catch (notiErr) {
      console.error("Failed to create direct purchase notification:", notiErr);
    }

    // Securely return the coupon details ONLY after successful purchase
    return NextResponse.json({
      success: true,
      message: "Purchase complete!",
      couponCode: item.couponCode || "NO_CODE_PROVIDED",
      couponExpiry: item.couponExpiry ? item.couponExpiry.toISOString() : null,
      title: item.title,
    }, { status: 200 });

  } catch (error: any) {
    console.error("POST Buy Item Error:", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 });
  }
}
