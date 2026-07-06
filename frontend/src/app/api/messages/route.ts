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

    // Verify user is part of the swap request to protect chat privacy
    const swap = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not authorized" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { swapRequestId },
      include: {
        sender: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Adapt to SQL naming format expected by frontend
    const adaptedMessages = messages.map((msg) => ({
      id: msg.id,
      swap_request_id: msg.swapRequestId,
      sender_id: msg.senderId,
      content: msg.content,
      created_at: msg.createdAt.toISOString(),
      profiles: msg.sender
        ? {
            username: msg.sender.username,
            avatar_url: msg.sender.avatarUrl,
          }
        : null,
    }));

    return NextResponse.json(adaptedMessages, { status: 200 });
  } catch (error: any) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { swapRequestId, content } = body;

    if (!swapRequestId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user is part of the swap request
    const swap = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
    });

    if (!swap) {
      return NextResponse.json({ error: "Swap request not found" }, { status: 404 });
    }

    if (swap.senderId !== userId && swap.receiverId !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not authorized" }, { status: 403 });
    }

    // Create the message in MongoDB
    const newMessage = await prisma.message.create({
      data: {
        swapRequestId,
        senderId: userId,
        content: content.trim(),
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
