import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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
      isDeleted: { not: true }
    };

    if (userIdFilter) {
      whereClause.userId = userIdFilter;
    } else {
      whereClause.status = "Available";
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

    const body = await request.json();
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

    // Server-side validation
    if (!title?.trim() || !description?.trim() || !category || !condition || !couponCode?.trim() || !couponExpiry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expiryDate = new Date(couponExpiry);
    if (expiryDate <= new Date()) {
      return NextResponse.json({ error: "Expiry date must be in the future" }, { status: 400 });
    }

    // Ensure the profile exists in MongoDB (resilience layer)
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      // Fallback: create profile if it was not created by webhook
      await prisma.profile.create({
        data: {
          id: userId,
          username: `user_${userId.substring(userId.length - 6)}`,
          fullName: "New Swapper",
        },
      });
    }

    // Resilience layer for Category model
    let finalCategoryId = categoryId;
    if (!finalCategoryId && category) {
      const dbCategory = await prisma.category.findFirst({
        where: { name: { equals: category, mode: "insensitive" } },
      });
      if (dbCategory) {
        finalCategoryId = dbCategory.id;
      } else {
        const newCat = await prisma.category.create({
          data: { name: category },
        });
        finalCategoryId = newCat.id;
      }
    }

    const parsedPrice = price ? parseInt(String(price), 10) : null;
    const parsedSellingPrice = sellingPrice ? parseInt(String(sellingPrice), 10) : null;
    const parsedVoucherValue = voucherValue ? parseInt(String(voucherValue), 10) : null;

    // Create new listing in MongoDB
    const newItem = await prisma.item.create({
      data: {
        userId,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        imageUrl: imageUrl || null,
        preferredTrade: preferredTrade?.trim() || null,
        status: "Available",
        isCoupon: true,
        price: parsedPrice,
        couponCode: couponCode.trim().toUpperCase(),
        couponExpiry: expiryDate,
        listingType: listingType || "SWAP_ONLY",
        sellingPrice: parsedSellingPrice !== null ? parsedSellingPrice : parsedPrice,
        brand: brand?.trim() || null,
        voucherValue: parsedVoucherValue,
        categoryId: finalCategoryId || null,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST Item Error:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
