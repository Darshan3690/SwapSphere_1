import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute rolling average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt.toISOString(),
        reviewer: r.reviewer
          ? {
              username: r.reviewer.username,
              avatar_url: r.reviewer.avatarUrl,
            }
          : null,
      })),
      averageRating: parseFloat(averageRating),
      totalCount: reviews.length,
    }, { status: 200 });
  } catch (error: any) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { revieweeId, rating, comment } = body;

    if (!revieweeId || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const numericRating = parseInt(String(rating), 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (userId === revieweeId) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
    }

    // Verify the reviewee profile exists
    const reviewee = await prisma.profile.findUnique({
      where: { id: revieweeId },
    });

    if (!reviewee) {
      return NextResponse.json({ error: "Reviewee not found" }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: userId,
        revieweeId,
        rating: numericRating,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    console.error("POST Review Error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
