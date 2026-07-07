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

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Strip sensitive coupon details if requester is not the owner
    const isOwner = userId === item.userId;

    const adaptedItem = {
      ...item,
      couponCode: isOwner ? item.couponCode : undefined,
      user_id: item.userId,
      image_url: item.imageUrl,
      preferred_trade: item.preferredTrade,
      listing_type: item.listingType,
      selling_price: item.sellingPrice,
      brand: item.brand,
      voucher_value: item.voucherValue,
      category_id: item.categoryId,
      boosted_until: item.boostedUntil ? item.boostedUntil.toISOString() : null,
      created_at: item.createdAt.toISOString(),
      profiles: item.user
        ? {
            id: item.user.id,
            username: item.user.username,
            avatar_url: item.user.avatarUrl,
          }
        : null,
    };

    return NextResponse.json(adaptedItem, { status: 200 });
  } catch (error: any) {
    console.error("GET Item Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch item details" }, { status: 500 });
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

    // Verify ownership
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      condition,
      preferredTrade,
      status,
      price,
      couponCode,
      couponExpiry,
      listingType,
      sellingPrice,
      brand,
      voucherValue,
      categoryId
    } = body;

    const parsedPrice = price !== undefined
      ? (price === null || price === "" ? null : parseInt(String(price), 10))
      : undefined;

    let parsedExpiry = undefined;
    if (couponExpiry !== undefined) {
      if (!couponExpiry) {
        parsedExpiry = null;
      } else {
        let d = new Date(couponExpiry);
        if (isNaN(d.getTime())) {
          // Parse DD/MM/YYYY manually if native constructor fails
          const parts = String(couponExpiry).split("/");
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            d = new Date(year, month, day);
          }
        }
        if (!isNaN(d.getTime())) {
          parsedExpiry = d;
        } else {
          return NextResponse.json({ error: "Invalid expiry date format. Please use YYYY-MM-DD or DD/MM/YYYY." }, { status: 400 });
        }
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        category: category !== undefined ? category : undefined,
        condition: condition !== undefined ? condition : undefined,
        preferredTrade: preferredTrade !== undefined ? preferredTrade : undefined,
        status: status !== undefined ? status : undefined,
        price: parsedPrice,
        couponCode: couponCode !== undefined ? (couponCode ? couponCode.trim().toUpperCase() : null) : undefined,
        couponExpiry: parsedExpiry,
        listingType: listingType !== undefined ? listingType : undefined,
        sellingPrice: sellingPrice !== undefined ? (sellingPrice === null || sellingPrice === "" ? null : parseInt(String(sellingPrice), 10)) : undefined,
        brand: brand !== undefined ? brand : undefined,
        voucherValue: voucherValue !== undefined ? (voucherValue === null || voucherValue === "" ? null : parseInt(String(voucherValue), 10)) : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
      },
    });

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error: any) {
    console.error("PATCH Item Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before deleting
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== userId) {
      return NextResponse.json({ error: "Forbidden: You do not own this listing" }, { status: 403 });
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Item Error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
