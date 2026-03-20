"use client";

import React from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSyncUser } from "@/hooks/useSyncUser";

export default function Hero() {
  // Destructure and rename isLoaded to avoid conflicts
  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();

  // Fetch live count from Convex. Default to 0 while loading.
  const founderCount = useQuery(api.users.getFounderCount) ?? 0;

  // This hook silently syncs the user if they are logged in
  const { syncError } = useSyncUser();

  const handleJoin = async () => {
    // TypeScript now knows signIn is fully loaded and safe to use
    if (!isSignInLoaded || !signIn) return;

    await signIn.authenticateWithRedirect({
      strategy: "oauth_github",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
      additionalQueryParams: { prompt: "select_account" },
    });
  };

  const maxFounders = 1000;
  const spotsRemaining = Math.max(0, maxFounders - founderCount);
  const isFull = spotsRemaining === 0;

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-50 px-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl mb-6">
          Project <span className="text-amber-500">Mohenjo</span>
        </h1>
        <p className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          The high-scale, zero-cost developer city. Your IDE activity builds the grid.
          Currently capped at 1,000 founders to ensure structural integrity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isUserLoaded ? (
            <button disabled className="px-8 py-4 bg-neutral-800 text-neutral-500 font-semibold rounded-md">
              Initializing Protocol...
            </button>
          ) : isSignedIn ? (
            syncError && syncError.includes("CAPACITY_REACHED") ? (
               <button disabled className="px-8 py-4 bg-red-900/50 text-red-200 font-semibold rounded-md border border-red-800">
                Waitlist Full
              </button>
            ) : (
              <button className="px-8 py-4 bg-emerald-600 text-neutral-50 font-semibold rounded-md hover:bg-emerald-500 transition-colors">
                Enter the City
              </button>
            )
          ) : (
            <button
              onClick={handleJoin}
              // Disable button if city is full OR if Clerk hasn't loaded yet
              disabled={isFull || !isSignInLoaded}
              className={`px-8 py-4 font-semibold rounded-md transition-colors ${
                isFull || !isSignInLoaded
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
              }`}
            >
              {isFull ? "City is Full" : "Join the Waitlist"}
            </button>
          )}

          <button className="px-8 py-4 bg-neutral-800 text-neutral-200 font-semibold rounded-md hover:bg-neutral-700 transition-colors border border-neutral-700">
            Read the Manifesto
          </button>
        </div>

        {syncError && !syncError.includes("CAPACITY_REACHED") && (
          <p className="mt-4 text-red-400 text-sm">{syncError}</p>
        )}

        <p className="mt-6 text-sm text-neutral-500 font-mono">
          Spots remaining: <span className="text-amber-500 font-bold" data-testid="spots-remaining">{spotsRemaining}</span> / {maxFounders}
        </p>
      </div>
    </section>
  );
}
