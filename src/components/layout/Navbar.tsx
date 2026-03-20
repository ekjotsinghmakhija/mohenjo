"use client";

import React from "react";
import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser
} from "@clerk/nextjs";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <nav className="w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight text-neutral-50 hover:text-amber-500 transition-colors">
          Mohenjo<span className="text-amber-500">.</span>
        </Link>

        {/* Auth Controls */}
        <div className="flex items-center gap-4">

          {/* 1. Loading State */}
          {!isLoaded ? (
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          ) :
          /* 2. Logged OUT State */
          !isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-neutral-300 hover:text-white transition-colors">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button className="text-sm font-semibold bg-amber-500 text-neutral-950 px-4 py-2 rounded-md hover:bg-amber-400 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          ) :
          /* 3. Logged IN State */
          (
            <>
              <Link
                href="/city"
                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 mr-4 transition-colors"
              >
                Enter City
              </Link>
              <UserButton />
            </>
          )}

        </div>
      </div>
    </nav>
  );
}
