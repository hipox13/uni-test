import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api/client";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Block } from "@/types/blocks";
import type { Metadata } from "next";

interface PageData {
  id: number;
  title: string | null;
  slug: string | null;
  body: string | null;
  description: string | null;
  keywords: string | null;
  metaData: string | null;
  status: number;
  datePublished: string | null;
  author?: { name: string | null };
}

async function getData(slug: string, previewToken?: string): Promise<PageData | null> {
  // If preview token is provided, fetch specifically from preview endpoints
  if (previewToken) {
    // Try article preview first
    try {
      const res = await fetch(getApiUrl(`/articles/preview/by-token?token=${previewToken}`), { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch { }

    // Try page preview second
    try {
      const res = await fetch(getApiUrl(`/pages/preview/by-token?token=${previewToken}`), { cache: 'no-store' });
      if (res.ok) return res.json();
    } catch { }
  }

  // Try pages first
  try {
    const res = await fetch(getApiUrl(`/pages/by-slug/${slug}`), { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch { }

  // Try articles second
  try {
    const res = await fetch(getApiUrl(`/articles/by-slug/${slug}`), { next: { revalidate: 60 } });
    if (res.ok) return res.json();
  } catch { }

  return null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const data = await getData(slug, preview);
  if (!data) return { title: "Not Found" };

  let meta: any = {};
  try {
    meta = data.metaData ? JSON.parse(data.metaData) : {};
  } catch { }

  return {
    title: meta.metaTitle || data.title || "UNICEF",
    description: meta.metaDescription || data.description || "",
    keywords: data.keywords || undefined,
    openGraph: meta.ogImage ? { images: [meta.ogImage] } : undefined,
  };
}

export default async function DynamicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const data = await getData(slug, preview);
  if (!data) notFound();

  let blocks: Block[] = [];
  try {
    const parsed = data.body ? JSON.parse(data.body) : [];
    blocks = Array.isArray(parsed) ? parsed : [];
  } catch { }

  let meta: any = {};
  try {
    meta = data.metaData ? JSON.parse(data.metaData) : {};
  } catch { }

  const hasManualHeading = blocks[0]?.type === 'heading';

  const publishDate = data.datePublished
    ? new Date(data.datePublished).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  return (
    <article className="max-w-4xl mx-auto px-6 py-16">
      {/* Inject Custom CSS */}
      {meta.customCss && (
        <style dangerouslySetInnerHTML={{ __html: meta.customCss }} />
      )}
      {/* Inject Custom JS */}
      {meta.customJs && (
        <script dangerouslySetInnerHTML={{ __html: meta.customJs }} />
      )}
      {/* Expose campaignId for BlockRenderer */}
      <script dangerouslySetInnerHTML={{ __html: `window.campaignId = ${data.id};` }} />

      {!hasManualHeading && (
        <header className="mb-12 pb-8 border-b border-slate-100">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {data.title || "Untitled"}
          </h1>
          {(publishDate || data.author?.name) && (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
              {publishDate && <time>{publishDate}</time>}
              {publishDate && data.author?.name && <span>&middot;</span>}
              {data.author?.name && <span>{data.author.name}</span>}
            </div>
          )}
          {data.description && (
            <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-2xl">
              {data.description}
            </p>
          )}
        </header>
      )}

      <BlockRenderer blocks={blocks} campaignId={data.id} />

      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
          <p className="text-lg">No content blocks yet.</p>
        </div>
      )}
    </article>
  );
}
