import CityGrid from "@/components/city/CityGrid";

export default function CityPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="mb-8 flex justify-between items-end border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-50 tracking-tight">
              Sector <span className="text-amber-500">Alpha</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Live grid activity. Place your foundations.</p>
          </div>
          <div className="text-sm font-mono text-neutral-500">
            Coordinates: Global
          </div>
        </header>

        {/* The Game Board */}
        <CityGrid />
      </div>
    </main>
  );
}
