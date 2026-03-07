import { getApiUrl } from "@/lib/api/client";
import { BlockRenderer } from "@/components/BlockRenderer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GooeyTextHero } from "@/components/home/GooeyTextHero";
import Link from "next/link";

async function getHomepageData() {
  try {
    const res = await fetch(getApiUrl("/pages/by-slug/home"), {
      next: { revalidate: 60 },
      cache: 'no-store'
    });
    if (res.ok) return res.json();
  } catch (err) {
    console.error("Failed to fetch home page from CMS:", err);
  }
  return null;
}

export default async function Home() {
  const data = await getHomepageData();

  // If no CMS page with slug 'home', show the original static design
  if (!data || !data.body) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <GooeyTextHero />

          {/* Original Stats Bar */}
          <section className="bg-[hsl(var(--foreground))] text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
              {[
                { value: "12M+", label: "Children Reached" },
                { value: "34", label: "Provinces Covered" },
                { value: "200K+", label: "Monthly Donors" },
                { value: "99%", label: "Goes to Programs" },
              ].map((stat, i) => (
                <div key={stat.label} className={`py-12 px-8 text-center ${i > 0 ? "border-l border-white/10" : ""}`}>
                  <p className="text-3xl md:text-4xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-white/50 mt-2 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Original Impact Section */}
          <section id="impact" className="py-32 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-12">How Your Donation Helps</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 border rounded-3xl bg-white">💧 Clean Water</div>
                <div className="p-8 border rounded-3xl bg-white">📚 Education</div>
                <div className="p-8 border rounded-3xl bg-white">🏥 Healthcare</div>
              </div>
            </div>
          </section>

          {/* Original CTA */}
          <section className="py-32 px-6 text-center">
            <h2 className="text-4xl font-bold mb-8">Make a Difference Today</h2>
            <Link href="/en/donate" className="bg-[hsl(var(--primary))] text-white px-10 py-5 rounded-full text-lg font-bold shadow-xl">
              Donate Now →
            </Link>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // If CMS page exists, render dynamic blocks
  const blocks = JSON.parse(data.body);
  const meta = data.metaData ? JSON.parse(data.metaData) : {};

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Inject Custom CSS/JS from CMS */}
        {meta.customCss && <style dangerouslySetInnerHTML={{ __html: meta.customCss }} />}
        {meta.customJs && <script dangerouslySetInnerHTML={{ __html: meta.customJs }} />}

        <BlockRenderer blocks={blocks} />
      </main>
      <SiteFooter />
    </div>
  );
}
