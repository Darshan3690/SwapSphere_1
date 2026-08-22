import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  isItemStatus,
  isListingType,
  isValidObjectId,
  jsonError,
  listingSupportsSale,
  parseFutureDate,
  parseOptionalPositiveInt,
  readJsonObject,
  trimmedString,
} from "@/lib/api";

async function resolveCategoryId(category: string) {
  const existing = await prisma.category.findFirst({
    where: { name: { equals: category, mode: "insensitive" } },
  });
  if (existing) return existing.id;

  try {
    const created = await prisma.category.create({ data: { name: category } });
    return created.id;
  } catch {
    const retry = await prisma.category.findFirst({
      where: { name: { equals: category, mode: "insensitive" } },
    });
    return retry?.id || null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Invalid item id", 400);
    }

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
    if (!isOwner && (item.isDeleted || item.verificationStatus !== "Approved" || item.isSuspicious)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

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
    if (!isValidObjectId(id)) {
      return jsonError("Invalid item id", 400);
    }

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

    const body = await readJsonObject(request);
    if (!body) {
      return jsonError("Invalid JSON request body", 400);
    }

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

    const updateData: any = {};

    if (title !== undefined) {
      const titleValue = trimmedString(title);
      if (!titleValue) return jsonError("Title cannot be empty", 400);
      if (titleValue.length > 80) return jsonError("Title must be 80 characters or fewer", 400);
      updateData.title = titleValue;
    }

    if (description !== undefined) {
      const descriptionValue = trimmedString(description);
      if (!descriptionValue) return jsonError("Description cannot be empty", 400);
      if (descriptionValue.length > 2000) return jsonError("Description must be 2000 characters or fewer", 400);
      updateData.description = descriptionValue;
    }

    if (category !== undefined) {
      const categoryValue = trimmedString(category);
      if (!categoryValue) return jsonError("Category cannot be empty", 400);
      updateData.category = categoryValue;
      updateData.categoryId = await resolveCategoryId(categoryValue);
    }

    if (condition !== undefined) {
      const conditionValue = trimmedString(condition);
      if (!conditionValue) return jsonError("Condition cannot be empty", 400);
      updateData.condition = conditionValue;
    }

    const nextListingType = listingType === undefined ? item.listingType : listingType;
    if (!isListingType(nextListingType)) {
      return jsonError("Invalid listing type", 400);
    }
    if (listingType !== undefined) {
      updateData.listingType = nextListingType;
    }

    if (preferredTrade !== undefined) {
      updateData.preferredTrade = nextListingType !== "SELL_ONLY" ? trimmedString(preferredTrade) : null;
    }

    if (status !== undefined) {
      if (!isItemStatus(status)) return jsonError("Invalid item status", 400);
      if (item.status === "Sold" || item.status === "Swapped") {
        return jsonError("Completed listings cannot be reopened from this endpoint", 400);
      }
      updateData.status = status;
    }

    if (couponCode !== undefined) {
      const couponCodeValue = trimmedString(couponCode);
      if (!couponCodeValue) return jsonError("Coupon code cannot be empty", 400);
      updateData.couponCode = couponCodeValue.toUpperCase();
    }

    if (couponExpiry !== undefined) {
      const parsedExpiry = parseFutureDate(couponExpiry, "Expiry date");
      if (parsedExpiry.error || !parsedExpiry.value) {
        return jsonError(parsedExpiry.error || "Invalid expiry date", 400);
      }
      updateData.couponExpiry = parsedExpiry.value;
    }

    const parsedPrice = price !== undefined ? parseOptionalPositiveInt(price, "Price") : null;
    if (parsedPrice?.error) return jsonError(parsedPrice.error, 400);

    const parsedSellingPrice = sellingPrice !== undefined ? parseOptionalPositiveInt(sellingPrice, "Selling price") : null;
    if (parsedSellingPrice?.error) return jsonError(parsedSellingPrice.error, 400);

    const parsedVoucherValue = voucherValue !== undefined ? parseOptionalPositiveInt(voucherValue, "Voucher value") : null;
    if (parsedVoucherValue?.error) return jsonError(parsedVoucherValue.error, 400);

    const nextSellingPrice = parsedSellingPrice ? parsedSellingPrice.value : item.sellingPrice;
    if (listingSupportsSale(nextListingType) && !nextSellingPrice) {
      return jsonError("Selling price is required for sellable listings", 400);
    }

    if (parsedPrice) updateData.price = parsedPrice.value;
    if (parsedSellingPrice) {
      updateData.sellingPrice = parsedSellingPrice.value;
      updateData.price = parsedSellingPrice.value;
    }
    if (brand !== undefined) updateData.brand = trimmedString(brand);
    if (parsedVoucherValue) updateData.voucherValue = parsedVoucherValue.value;

    if (categoryId !== undefined) {
      if (categoryId !== null && categoryId !== "" && !isValidObjectId(categoryId)) {
        return jsonError("Invalid category id", 400);
      }
      updateData.categoryId = categoryId || null;
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
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
    if (!isValidObjectId(id)) {
      return jsonError("Invalid item id", 400);
    }

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

    await prisma.item.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "Item deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Item Error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
