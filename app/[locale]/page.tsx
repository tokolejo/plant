import { HeroSection } from "@/components/home/HeroSection";
import { DiscoveryFeed } from "@/components/home/DiscoveryFeed";
import { IsoBoardPreview } from "@/components/home/IsoBoardPreview";

export default function HomePage() {
  return (
    <div className="flex flex-col" style={{ overflow: "visible" }}>
      {/* 1. Hero + Search */}
      <HeroSection />

      {/* 2. Discovery Feed (Live Real Supabase Listings) */}
      <DiscoveryFeed />

      {/* 3. ISO Match Board */}
      <IsoBoardPreview />
    </div>
  );
}
