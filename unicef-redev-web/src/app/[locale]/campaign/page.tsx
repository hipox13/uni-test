import Link from "next/link";
import { getApiUrl } from "@/lib/api/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns - UNICEF Indonesia",
  description: "Explore and support UNICEF Indonesia campaigns for children.",
};

interface Campaign {
  id: number;
  title: string | null;
  slug: string | null;
  description: string | null;
  body: string | null;
  status: number;
  donateType: number | null;
  dateCreated: string | null;
  picture: string | null;
  author?: { name: string | null };
}

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch(getApiUrl("/donations"), { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const all: Campaign[] = Array.isArray(data) ? data : data.data || [];
    return all.filter((c) => c.status === 2);
  } catch {
    return [];
  }
}

function getCampaignImage(campaign: Campaign): string | null {
  if (campaign.picture) return campaign.picture;
  if (!campaign.body) return null;
  try {
    const blocks = JSON.parse(campaign.body);
    const img = blocks.find((b: any) => b.type === "image" || b.type === "hero");
    return img?.attributes?.url || null;
  } catch {
    return null;
  }
}

const TYPE_LABELS: Record<number, string> = {
  1: "Monthly",
  2: "One-time",
  3: "Monthly & One-time",
};

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const campaigns = await getCampaigns();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
          Make an Impact
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Our Campaigns
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed">
          Choose a cause that matters to you and help make a difference for children in Indonesia.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-[hsl(var(--muted-foreground))]">
            No campaigns available at the moment.
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Check back soon for new campaigns.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const imageUrl = getCampaignImage(campaign);
            const typeLabel = campaign.donateType
              ? TYPE_LABELS[campaign.donateType]
              : null;

            return (
              <Link
                key={campaign.id}
                href={`/${locale}/campaign/${campaign.slug}`}
                className="group flex flex-col rounded-2xl border border-[hsl(var(--border))] overflow-hidden hover:shadow-xl hover:shadow-[hsl(199,89%,48%,0.06)] hover:border-[hsl(var(--primary))]/30 transition-all duration-500"
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(199,89%,35%)] relative overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={campaign.title || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </div>
                  )}
                  {typeLabel && (
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full text-[hsl(var(--foreground))]">
                      {typeLabel}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-6 flex flex-col">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                    {campaign.title || "Untitled Campaign"}
                  </h3>
                  {campaign.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-3 flex-1">
                      {campaign.description}
                    </p>
                  )}
                  <div className="mt-5 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
                    <span className="text-sm font-semibold text-[hsl(var(--primary))]">
                      GO TO ARTICLE →
                    </span>
                    {campaign.dateCreated && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(campaign.dateCreated).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
