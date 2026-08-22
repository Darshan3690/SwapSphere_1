import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  ensureProfile,
  isListingType,
  isProfileBlocked,
  jsonError,
  listingSupportsSale,
  parseFutureDate,
  parseOptionalPositiveInt,
  readJsonObject,
  trimmedString,
} from "@/lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdFilter = url.searchParams.get("userId");
    const categoryFilter = url.searchParams.get("category");
    const searchFilter = url.searchParams.get("search");
    const listingTypeFilter = url.searchParams.get("listingType");
    const minValueFilter = url.searchParams.get("minValue");
    const maxValueFilter = url.searchParams.get("maxValue");

    const whereClause: any = {
      isDeleted: { not: true },
    };

    if (userIdFilter) {
      whereClause.userId = userIdFilter;
    } else {
      whereClause.status = "Available";
      whereClause.verificationStatus = "Approved";
      whereClause.isSuspicious = { not: true };
    }

    if (categoryFilter && categoryFilter !== "All") {
      whereClause.category = { equals: categoryFilter, mode: "insensitive" };
    }

    if (listingTypeFilter && listingTypeFilter !== "All") {
      whereClause.listingType = listingTypeFilter;
    }

    if (minValueFilter || maxValueFilter) {
      const min = minValueFilter ? parseInt(minValueFilter, 10) : undefined;
      const max = maxValueFilter ? parseInt(maxValueFilter, 10) : undefined;
      if ((minValueFilter && (isNaN(min!) || min! < 0)) || (maxValueFilter && (isNaN(max!) || max! < 0))) {
        return jsonError("Price filters must be valid positive numbers", 400);
      }
      if (min !== undefined && max !== undefined && min > max) {
        return jsonError("Minimum price cannot be greater than maximum price", 400);
      }
      
      whereClause.sellingPrice = {};
      if (min !== undefined && !isNaN(min)) {
        whereClause.sellingPrice.gte = min;
      }
      if (max !== undefined && !isNaN(max)) {
        whereClause.sellingPrice.lte = max;
      }
    }

    if (searchFilter && searchFilter.trim()) {
      const s = searchFilter.trim();
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { title: { contains: s, mode: "insensitive" } },
            { brand: { contains: s, mode: "insensitive" } },
            { description: { contains: s, mode: "insensitive" } },
          ],
        },
      ];
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const { userId } = await auth();

    // Map to frontend-expected formats
    const adaptedItems = items.map((item) => {
      const isOwner = userId === item.userId;
      return {
        id: item.id,
        user_id: item.userId,
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        image_url: item.imageUrl,
        preferred_trade: item.preferredTrade,
        status: item.status,
        is_coupon: item.isCoupon,
        price: item.price,
        coupon_code: isOwner ? item.couponCode : undefined,
        coupon_expiry: item.couponExpiry ? item.couponExpiry.toISOString() : null,
        created_at: item.createdAt.toISOString(),
        listing_type: item.listingType,
        selling_price: item.sellingPrice,
        brand: item.brand,
        voucher_value: item.voucherValue,
        category_id: item.categoryId,
        boosted_until: item.boostedUntil ? item.boostedUntil.toISOString() : null,
        profiles: item.user
          ? {
              id: item.user.id,
              username: item.user.username,
              avatar_url: item.user.avatarUrl,
            }
          : null,
      };
    });

    return NextResponse.json(adaptedItems, { status: 200 });
  } catch (error: any) {
    console.error("GET Items Error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
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

    const {
      title,
      description,
      category,
      condition,
      imageUrl,
      preferredTrade,
      couponCode,
      couponExpiry,
      price,
      listingType,
      sellingPrice,
      brand,
      voucherValue,
      categoryId,
    } = body;

    const titleValue = trimmedString(title);
    const descriptionValue = trimmedString(description);
    const categoryValue = trimmedString(category);
    const conditionValue = trimmedString(condition);
    const couponCodeValue = trimmedString(couponCode);
    const brandValue = trimmedString(brand);
    const preferredTradeValue = trimmedString(preferredTrade);
    const requestedListingType = listingType ?? "SWAP_ONLY";

    if (!titleValue || !descriptionValue || !categoryValue || !conditionValue || !couponCodeValue || !couponExpiry) {
      return jsonError("Missing required fields", 400);
    }

    if (titleValue.length > 80) {
      return jsonError("Title must be 80 characters or fewer", 400);
    }

    if (descriptionValue.length > 2000) {
      return jsonError("Description must be 2000 characters or fewer", 400);
    }

    if (!isListingType(requestedListingType)) {
      return jsonError("Invalid listing type", 400);
    }

    const parsedExpiry = parseFutureDate(couponExpiry, "Expiry date");
    if (parsedExpiry.error || !parsedExpiry.value) {
      return jsonError(parsedExpiry.error || "Invalid expiry date", 400);
    }

    const parsedPrice = parseOptionalPositiveInt(price, "Price");
    if (parsedPrice.error) {
      return jsonError(parsedPrice.error, 400);
    }

    const parsedSellingPrice = parseOptionalPositiveInt(sellingPrice, "Selling price");
    if (parsedSellingPrice.error) {
      return jsonError(parsedSellingPrice.error, 400);
    }

    const parsedVoucherValue = parseOptionalPositiveInt(voucherValue, "Voucher value");
    if (parsedVoucherValue.error) {
      return jsonError(parsedVoucherValue.error, 400);
    }

    if (listingSupportsSale(requestedListingType) && !parsedSellingPrice.value) {
      return jsonError("Selling price is required for sellable listings", 400);
    }

    if (categoryId && typeof categoryId === "string" && !/^[a-f\d]{24}$/i.test(categoryId)) {
      return jsonError("Invalid category id", 400);
    }

    const profile = await ensureProfile(userId);
    if (isProfileBlocked(profile)) {
      return jsonError("Your account is not allowed to create listings", 403);
    }

    // Resilience layer for Category model
    let finalCategoryId = typeof categoryId === "string" ? categoryId : null;
    if (!finalCategoryId && categoryValue) {
      const dbCategory = await prisma.category.findFirst({
        where: { name: { equals: categoryValue, mode: "insensitive" } },
      });
      if (dbCategory) {
        finalCategoryId = dbCategory.id;
      } else {
        try {
          const newCat = await prisma.category.create({
            data: { name: categoryValue },
          });
          finalCategoryId = newCat.id;
        } catch {
          const retryCategory = await prisma.category.findFirst({
            where: { name: { equals: categoryValue, mode: "insensitive" } },
          });
          finalCategoryId = retryCategory?.id || null;
        }
      }
    }

    const finalSellingPrice = parsedSellingPrice.value ?? parsedPrice.value;

    // Create new listing in MongoDB
    const newItem = await prisma.item.create({
      data: {
        userId,
        title: titleValue,
        description: descriptionValue,
        category: categoryValue,
        condition: conditionValue,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null,
        preferredTrade: requestedListingType !== "SELL_ONLY" ? preferredTradeValue : null,
        status: "Available",
        isCoupon: true,
        price: finalSellingPrice,
        couponCode: couponCodeValue.toUpperCase(),
        couponExpiry: parsedExpiry.value,
        listingType: requestedListingType,
        sellingPrice: finalSellingPrice,
        brand: brandValue,
        voucherValue: parsedVoucherValue.value,
        categoryId: finalCategoryId || null,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST Item Error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
