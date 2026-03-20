import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useSyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncUserMutation = useMutation(api.users.syncUser);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function sync() {
      // Only sync if they are logged in and we haven't already started syncing
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
            // This catches our "Mohenjo is full" error from the backend
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
  }, [user, isLoaded, isSignedIn, syncUserMutation]); // Dependencies

  return { isSyncing, syncError };
}
