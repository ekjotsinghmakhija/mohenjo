import CityGrid from "@/components/city/CityGrid";

export default function CityPage() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden relative">
      {/* The Game Engine fills the entire screen */}
      <CityGrid />
    </main>
  );
}
