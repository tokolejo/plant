import { HeroSection } from "@/components/home/HeroSection";
import { DiscoveryFeed } from "@/components/home/DiscoveryFeed";
import { IsoBoardPreview } from "@/components/home/IsoBoardPreview";
import { SAMPLE_LISTINGS } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-6" style={{ overflow: "visible" }}>
      {/* 1. Hero + Search */}
      <HeroSection />

      {/* 2. Discovery Feed (Uniform Grid with Filter Tabs & Centered View All) */}
      <DiscoveryFeed listings={SAMPLE_LISTINGS} />

      {/* 3. ISO Match Board */}
      <IsoBoardPreview />
    </div>
  );
}
