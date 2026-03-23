import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);
  const dbUser = useQuery(
    api.users.getUserByExternalId,
    user?.id ? { externalId: user.id } : "skip"
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function sync() {
      if (isLoaded && isSignedIn && user && !isSyncing) {
        setIsSyncing(true);
        try {
          await syncUserMutation({
            name: user.fullName || user.username || "Anonymous Founder",
            email: user.primaryEmailAddress?.emailAddress || "",
            externalId: user.id,
            avatarUrl: user.imageUrl,
          });
          if (isMounted) setSyncError(null);
        } catch (error: any) {
          if (isMounted) {
            setSyncError(error.message || "Failed to secure your spot.");
          }
        } finally {
          if (isMounted) setIsSyncing(false);
        }
      }
    }

    sync();

    return () => {
      isMounted = false;
    };
  }, [user, isLoaded, isSignedIn, syncUserMutation]);

  // Expose a method to let the user pick their faction later
  const setFaction = async (faction: "vanguard" | "syndicate" | "celestial") => {
    if (!user) return;
    await syncUserMutation({
      name: user.fullName || user.username || "Anonymous Founder",
      email: user.primaryEmailAddress?.emailAddress || "",
      externalId: user.id,
      avatarUrl: user.imageUrl,
      faction: faction,
    });
  };

  return { isSyncing, syncError, dbUser, setFaction };
}
