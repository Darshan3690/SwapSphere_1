import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
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

    const body = await request.json();
    const { receiverId, senderItemId, receiverItemId } = body;

    if (!receiverId || !receiverItemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (userId === receiverId) {
      return NextResponse.json({ error: "You cannot propose a swap with yourself" }, { status: 400 });
    }

    // Verify receiver item exists and is Available
    const recItem = await prisma.item.findUnique({ where: { id: receiverItemId } });
    if (!recItem || recItem.status !== "Available") {
      return NextResponse.json({ error: "Receiver item is no longer available" }, { status: 400 });
    }

    // Verify sender item exists and belongs to the sender
    if (senderItemId) {
      const sendItem = await prisma.item.findUnique({ where: { id: senderItemId } });
      if (!sendItem || sendItem.userId !== userId) {
        return NextResponse.json({ error: "Invalid offer item" }, { status: 400 });
      }
    }

    // Create swap request in MongoDB
    const swapRequest = await prisma.swapRequest.create({
      data: {
        senderId: userId,
        receiverId,
        senderItemId: senderItemId || null,
        receiverItemId,
        status: "Pending",
      },
    });

    // Trigger Notification for the receiver
    try {
      const senderProfile = await prisma.profile.findUnique({ where: { id: userId } });
      const senderName = senderProfile?.username || "A user";
      const itemDetails = await prisma.item.findUnique({ where: { id: receiverItemId } });
      const itemName = itemDetails?.title || "your listing";

      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: "New Swap Offered",
          message: `@${senderName} proposed a swap for your item: "${itemName}".`,
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
