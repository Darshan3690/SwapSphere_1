"use client";

import { useMemo } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerkAuth();

  const memoizedUser = useMemo(() => {
    return user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          fullName: user.fullName || user.firstName || (user.primaryEmailAddress?.emailAddress ? user.primaryEmailAddress.emailAddress.split("@")[0] : "Admin"),
          firstName: user.firstName,
          username: user.username || user.firstName,
        }
      : null;
  }, [user]);

  const memoizedProfile = useMemo(() => {
    return user
      ? {
          id: user.id,
          username: user.username || user.firstName || "user",
          full_name: user.fullName || null,
          avatar_url: user.imageUrl || null,
          updated_at: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
        }
      : null;
  }, [user]);

  return {
    user: memoizedUser,
    profile: memoizedProfile,
    loading: !isLoaded,
    signOut: async () => {
      await signOut();
    },
    refreshProfile: async () => {},
  };
}
