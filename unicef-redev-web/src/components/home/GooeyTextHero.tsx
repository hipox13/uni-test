"use client";

import Link from "next/link";
import { GooeyText } from "@/components/ui/gooey-text-morphing";

export function GooeyTextHero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-[hsl(199,89%,48%,0.06)] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(199,89%,48%,0.03)] blur-[80px]" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 md:space-y-10">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
          UNICEF Indonesia
        </p>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
          Every Child Deserves
        </h1>

        <div className="h-[60px] sm:h-[80px] md:h-[100px] lg:h-[120px] relative">
          <GooeyText
            texts={["Education", "Clean Water", "Healthcare", "A Future"]}
            morphTime={1.5}
            cooldownTime={0.5}
            className="font-bold"
            textClassName="text-[hsl(var(--primary))] text-4xl sm:text-6xl md:text-7xl lg:text-[72pt]"
          />
        </div>

        <p className="text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto leading-relaxed">
          Together we can build a better world for every child in Indonesia.
          Your donation creates lasting change.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/en/donate"
            className="inline-flex items-center gap-2 text-white bg-[hsl(var(--primary))] px-9 py-4 rounded-full text-base font-semibold hover:brightness-110 transition-all shadow-xl shadow-[hsl(199,89%,48%,0.2)]"
          >
            Donate Now →
          </Link>
          <Link
            href="/en/campaign"
            className="inline-flex items-center gap-2 text-[hsl(var(--foreground))] border border-[hsl(var(--border))] px-9 py-4 rounded-full text-base font-medium hover:bg-[hsl(var(--secondary))] transition-colors"
          >
            View Campaigns
          </Link>
        </div>
      </div>

      {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
        <div className="w-5 h-8 rounded-full border-2 border-[hsl(var(--border))] flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
        </div>
      </div> */}
    </section>
  );
}
