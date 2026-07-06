import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const swap = await prisma.swapRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        senderItem: true,
        receiverItem: true,
      },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    // Verify the user is part of this swap
    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not part of this swap" }, { status: 403 });
    }

    // Adapt to SQL naming format that the frontend expects
    const adaptedSwap = {
      id: swap.id,
      sender_id: swap.senderId,
      receiver_id: swap.receiverId,
      sender_item_id: swap.senderItemId,
      receiver_item_id: swap.receiverItemId,
      status: swap.status,
      created_at: swap.createdAt.toISOString(),
      sender_profile: swap.sender
        ? {
            id: swap.sender.id,
            username: swap.sender.username,
            avatar_url: swap.sender.avatarUrl,
          }
        : null,
      receiver_profile: swap.receiver
        ? {
            id: swap.receiver.id,
            username: swap.receiver.username,
            avatar_url: swap.receiver.avatarUrl,
          }
        : null,
      sender_item: swap.senderItem
        ? {
            id: swap.senderItem.id,
            title: swap.senderItem.title,
            description: swap.senderItem.description,
            image_url: swap.senderItem.imageUrl,
            category: swap.senderItem.category,
            condition: swap.senderItem.condition,
            is_coupon: swap.senderItem.isCoupon,
            coupon_code: swap.status === "Completed" || swap.senderId === userId ? swap.senderItem.couponCode : undefined,
            coupon_expiry: swap.senderItem.couponExpiry
              ? swap.senderItem.couponExpiry.toISOString()
              : null,
          }
        : null,
      receiver_item: swap.receiverItem
        ? {
            id: swap.receiverItem.id,
            title: swap.receiverItem.title,
            description: swap.receiverItem.description,
            image_url: swap.receiverItem.imageUrl,
            category: swap.receiverItem.category,
            condition: swap.receiverItem.condition,
            is_coupon: swap.receiverItem.isCoupon,
            coupon_code: swap.status === "Completed" || swap.receiverId === userId ? swap.receiverItem.couponCode : undefined,
            coupon_expiry: swap.receiverItem.couponExpiry
              ? swap.receiverItem.couponExpiry.toISOString()
              : null,
          }
        : null,
    };

    return NextResponse.json(adaptedSwap, { status: 200 });
  } catch (error: any) {
    console.error("GET Swap Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch swap details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const swap = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    // Verify user is authorized to perform status changes
    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["Accepted", "Rejected", "Cancelled", "Completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid swap status" }, { status: 400 });
    }

    // Execute updates inside a transaction for structural safety
    const updatedSwap = await prisma.$transaction(async (tx) => {
      // 1. Update the Swap Request status
      const updated = await tx.swapRequest.update({
        where: { id },
        data: { status },
      });

      // 2. Synchronize item statuses
      if (status === "Rejected" || status === "Cancelled") {
        if (swap.senderItemId) {
          await tx.item.update({
            where: { id: swap.senderItemId },
            data: { status: "Available" },
          });
        }
        await tx.item.update({
          where: { id: swap.receiverItemId },
          data: { status: "Available" },
        });
      } else if (status === "Completed") {
        if (swap.senderItemId) {
          await tx.item.update({
            where: { id: swap.senderItemId },
            data: { status: "Swapped" },
          });
        }
        await tx.item.update({
          where: { id: swap.receiverItemId },
          data: { status: "Swapped" },
        });
      } else if (status === "Accepted") {
        // Mark items as Pending during swap acceptance
        if (swap.senderItemId) {
          await tx.item.update({
            where: { id: swap.senderItemId },
            data: { status: "Pending" },
          });
        }
        await tx.item.update({
          where: { id: swap.receiverItemId },
          data: { status: "Pending" },
        });
      }

      return updated;
    });

    return NextResponse.json(updatedSwap, { status: 200 });
  } catch (error: any) {
    console.error("PATCH Swap Status Error:", error);
    return NextResponse.json({ error: "Failed to update swap status" }, { status: 500 });
  }
}
