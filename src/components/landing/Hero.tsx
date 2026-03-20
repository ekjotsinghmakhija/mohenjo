import React from "react";

export default function Hero() {
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
          <button
            className="px-8 py-4 bg-amber-500 text-neutral-950 font-semibold rounded-md hover:bg-amber-400 transition-colors"
            data-testid="waitlist-button"
          >
            Join the Waitlist
          </button>
          <button className="px-8 py-4 bg-neutral-800 text-neutral-200 font-semibold rounded-md hover:bg-neutral-700 transition-colors border border-neutral-700">
            Read the Manifesto
          </button>
        </div>
        <p className="mt-6 text-sm text-neutral-500 font-mono">
          Spots remaining: <span className="text-amber-500 font-bold" data-testid="spots-remaining">1,000</span> / 1,000
        </p>
      </div>
    </section>
  );
}
