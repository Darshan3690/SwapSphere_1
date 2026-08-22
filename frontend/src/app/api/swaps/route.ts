import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  ensureProfile,
  isProfileBlocked,
  isValidObjectId,
  jsonError,
  listingSupportsSwap,
  readJsonObject,
} from "@/lib/api";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch swaps where user is either the sender or the receiver
    const swaps = await prisma.swapRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        senderItem: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        receiverItem: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Adapt to SQL naming format that the frontend expects
    const adaptedSwaps = swaps.map((swap) => ({
      id: swap.id,
      sender_id: swap.senderId,
      receiver_id: swap.receiverId,
      sender_item_id: swap.senderItemId,
      receiver_item_id: swap.receiverItemId,
      status: swap.status,
      created_at: swap.createdAt.toISOString(),
      sender_profile: swap.sender
        ? {
            username: swap.sender.username,
            avatar_url: swap.sender.avatarUrl,
          }
        : null,
      receiver_profile: swap.receiver
        ? {
            username: swap.receiver.username,
            avatar_url: swap.receiver.avatarUrl,
          }
        : null,
      sender_item: swap.senderItem
        ? {
            id: swap.senderItem.id,
            title: swap.senderItem.title,
            image_url: swap.senderItem.imageUrl,
          }
        : null,
      receiver_item: swap.receiverItem
        ? {
            id: swap.receiverItem.id,
            title: swap.receiverItem.title,
            image_url: swap.receiverItem.imageUrl,
          }
        : null,
    }));

    return NextResponse.json(adaptedSwaps, { status: 200 });
  } catch (error: any) {
    console.error("GET Swaps Error:", error);
    return NextResponse.json({ error: "Failed to fetch swap requests" }, { status: 500 });
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

    const { receiverId, senderItemId, receiverItemId } = body;

    if (!receiverItemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isValidObjectId(receiverItemId)) {
      return jsonError("Invalid requested item id", 400);
    }

    if (senderItemId && !isValidObjectId(senderItemId)) {
      return jsonError("Invalid offer item id", 400);
    }
    const senderItemIdValue = typeof senderItemId === "string" && senderItemId ? senderItemId : null;

    // Verify receiver item exists and is Available
    const recItem = await prisma.item.findUnique({ where: { id: receiverItemId } });
    if (
      !recItem ||
      recItem.status !== "Available" ||
      recItem.isDeleted ||
      recItem.verificationStatus !== "Approved" ||
      recItem.isSuspicious
    ) {
      return NextResponse.json({ error: "Receiver item is no longer available" }, { status: 400 });
    }

    if (!listingSupportsSwap(recItem.listingType)) {
      return jsonError("This listing is not open for swaps", 400);
    }

    const actualReceiverId = recItem.userId;
    if (typeof receiverId === "string" && receiverId !== actualReceiverId) {
      return jsonError("Requested item does not belong to the selected receiver", 400);
    }

    if (userId === actualReceiverId) {
      return NextResponse.json({ error: "You cannot propose a swap with yourself" }, { status: 400 });
    }

    const profile = await ensureProfile(userId);
    if (isProfileBlocked(profile)) {
      return jsonError("Your account is not allowed to propose swaps", 403);
    }

    // Verify sender item exists and belongs to the sender
    if (senderItemIdValue) {
      const sendItem = await prisma.item.findUnique({ where: { id: senderItemIdValue } });
      if (
        !sendItem ||
        sendItem.userId !== userId ||
        sendItem.status !== "Available" ||
        sendItem.isDeleted ||
        sendItem.verificationStatus !== "Approved" ||
        !listingSupportsSwap(sendItem.listingType)
      ) {
        return NextResponse.json({ error: "Invalid offer item" }, { status: 400 });
      }
    }

    const existingSwap = await prisma.swapRequest.findFirst({
      where: {
        senderId: userId,
        receiverItemId,
        senderItemId: senderItemIdValue,
        status: { in: ["Pending", "Accepted"] },
      },
    });

    if (existingSwap) {
      return jsonError("You already have an active swap request for this listing", 409);
    }

    // Create swap request and reserve items in MongoDB
    const swapRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.swapRequest.create({
        data: {
          senderId: userId,
          receiverId: actualReceiverId,
          senderItemId: senderItemIdValue,
          receiverItemId,
          status: "Pending",
        },
      });

      if (senderItemIdValue) {
        await tx.item.update({
          where: { id: senderItemIdValue },
          data: { status: "Pending" },
        });
      }

      await tx.item.update({
        where: { id: receiverItemId },
        data: { status: "Pending" },
      });

      return created;
    });

    // Trigger Notification for the receiver
    try {
      const senderProfile = await prisma.profile.findUnique({ where: { id: userId } });
      const senderName = senderProfile?.username || "A user";

      await prisma.notification.create({
        data: {
          userId: actualReceiverId,
          title: "New Swap Offered",
          message: `@${senderName} proposed a swap for your item: "${recItem.title}".`,
          isRead: false,
        },
      });
    } catch (notiErr) {
      console.error("Failed to create Swap Offered notification:", notiErr);
    }

    return NextResponse.json({ swapRequestId: swapRequest.id }, { status: 201 });
  } catch (error: any) {
    console.error("POST Swap Error:", error);
    return NextResponse.json({ error: "Failed to propose swap request" }, { status: 500 });
  }
}
