import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const LISTING_TYPES = ["SWAP_ONLY", "SELL_ONLY", "SWAP_AND_SELL"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const ITEM_STATUSES = ["Available", "Pending", "Swapped", "Sold"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const SWAP_STATUSES = ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"] as const;
export type SwapStatus = (typeof SWAP_STATUSES)[number];

export const ESCROW_STATUSES = ["pending", "verified", "invalid"] as const;
export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export function trimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseOptionalPositiveInt(
  value: unknown,
  fieldName: string
): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === "") {
    return { value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { value: null, error: `${fieldName} must be a positive whole number` };
  }

  return { value: parsed };
}

export function parseFutureDate(
  value: unknown,
  fieldName: string
): { value: Date | null; error?: string } {
  const raw = trimmedString(value);
  if (!raw) {
    return { value: null, error: `${fieldName} is required` };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return { value: null, error: `${fieldName} must be a valid date` };
  }

  if (parsed <= new Date()) {
    return { value: null, error: `${fieldName} must be in the future` };
  }

  return { value: parsed };
}

export function isListingType(value: unknown): value is ListingType {
  return typeof value === "string" && LISTING_TYPES.includes(value as ListingType);
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && ITEM_STATUSES.includes(value as ItemStatus);
}

export function isSwapStatus(value: unknown): value is SwapStatus {
  return typeof value === "string" && SWAP_STATUSES.includes(value as SwapStatus);
}

export function isEscrowStatus(value: unknown): value is EscrowStatus {
  return typeof value === "string" && ESCROW_STATUSES.includes(value as EscrowStatus);
}

export function listingSupportsSwap(listingType: string | null | undefined) {
  return listingType !== "SELL_ONLY";
}

export function listingSupportsSale(listingType: string | null | undefined) {
  return listingType === "SELL_ONLY" || listingType === "SWAP_AND_SELL";
}

export async function ensureProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (profile) return profile;

  const safeUsername = `user_${userId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  return prisma.profile.create({
    data: {
      id: userId,
      username: safeUsername,
      fullName: "New Swapper",
    },
  });
}

export function isProfileBlocked(profile: { isBanned?: boolean; isSuspended?: boolean } | null) {
  return !!profile?.isBanned || !!profile?.isSuspended;
}
