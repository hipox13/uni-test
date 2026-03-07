"use client";

import React from 'react';
import { Block } from '@/types/blocks';
import { useParams } from 'next/navigation';

const HeadingBlock: React.FC<{ attributes: any }> = ({ attributes }) => {
    const level = attributes.level || 'h2';
    const classes: Record<string, string> = {
        h1: 'text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight',
        h2: 'text-3xl md:text-4xl font-bold text-slate-800 mt-14 mb-5 tracking-tight leading-tight',
        h3: 'text-2xl font-bold text-slate-800 mt-10 mb-4 tracking-tight',
    };
    const className = classes[level] || classes.h2;
    if (level === 'h1') return <h1 className={className}>{attributes.text}</h1>;
    if (level === 'h3') return <h3 className={className}>{attributes.text}</h3>;
    return <h2 className={className}>{attributes.text}</h2>;
};

const TextBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <div
        className="prose prose-slate prose-lg max-w-none my-6 leading-relaxed text-slate-600"
        dangerouslySetInnerHTML={{ __html: attributes.content || '' }}
    />
);

const ImageBlock: React.FC<{ attributes: any }> = ({ attributes }) => {
    if (!attributes.url) return null;
    return (
        <figure className="my-12">
            <img
                src={attributes.url}
                alt={attributes.alt || ''}
                className="rounded-2xl shadow-lg border border-slate-100 max-w-full h-auto mx-auto"
                loading="lazy"
            />
            {attributes.alt && (
                <figcaption className="mt-4 text-center text-sm text-slate-400 italic font-medium">
                    {attributes.alt}
                </figcaption>
            )}
        </figure>
    );
};

const CTAButtonBlock: React.FC<{ attributes: any }> = ({ attributes }) => {
    const variants: Record<string, string> = {
        primary: 'bg-[hsl(199,89%,48%)] text-white hover:brightness-110 shadow-lg',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        outline: 'border-2 border-slate-200 text-slate-700 hover:border-slate-300',
    };
    return (
        <div className="flex justify-center my-8">
            <a
                href={attributes.url || '#'}
                className={`inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold transition-all ${variants[attributes.variant || attributes.style] || variants.primary}`}
            >
                {attributes.text || 'Button'}
            </a>
        </div>
    );
};

const DividerBlock: React.FC = () => (
    <hr className="my-14 border-slate-100" />
);

const FAQBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <div className="my-12 space-y-3">
        {(attributes.items || []).map((item: any, idx: number) => (
            <details
                key={idx}
                className="group border border-slate-100 rounded-2xl bg-slate-50/50 overflow-hidden"
            >
                <summary className="list-none p-6 font-semibold text-slate-800 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors">
                    {item.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform text-sm">
                        ▼
                    </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                    {item.answer}
                </div>
            </details>
        ))}
    </div>
);

const HeroBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <section className="relative py-28 px-8 overflow-hidden bg-slate-950 text-white rounded-3xl my-12 shadow-2xl">
        {attributes.url && (
            <div className="absolute inset-0 z-0">
                <img
                    src={attributes.url}
                    alt=""
                    className="w-full h-full object-cover opacity-40 scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
            </div>
        )}
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8">
            {attributes.title && (
                <h2 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight">
                    {attributes.title}
                </h2>
            )}
            {attributes.content && (
                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                    {attributes.content}
                </p>
            )}
            {attributes.link && (
                <a
                    href={attributes.link}
                    className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-slate-950 bg-white rounded-full hover:bg-slate-50 hover:scale-105 transition-all shadow-xl"
                >
                    {attributes.text || 'Get Involved'}
                </a>
            )}
        </div>
    </section>
);

const GalleryBlock: React.FC<{ attributes: any }> = ({ attributes }) => {
    const cols = attributes.columns || 3;
    return (
        <div className={`my-12 grid gap-4 grid-cols-2 md:grid-cols-${cols}`}>
            {(attributes.images || []).map((img: any, idx: number) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100">
                    <img
                        src={img.url || img}
                        alt={img.alt || ''}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
    );
};

const PromoBarBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <div className="my-10 bg-[hsl(199,89%,48%)] text-white rounded-2xl p-8 text-center">
        <p className="text-lg font-bold">{attributes.text || ''}</p>
        {attributes.link && (
            <a
                href={attributes.link}
                className="inline-block mt-4 underline underline-offset-4 font-medium hover:opacity-80 transition-opacity"
            >
                {attributes.linkText || 'Learn More'} →
            </a>
        )}
    </div>
);

const TwoColumnBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <div className="my-12 grid md:grid-cols-2 gap-12">
        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: attributes.left || '' }} />
        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: attributes.right || '' }} />
    </div>
);

const EmbedBlock: React.FC<{ attributes: any }> = ({ attributes }) => {
    if (!attributes.url) return null;
    const isYoutube = attributes.url.includes('youtube') || attributes.url.includes('youtu.be');
    if (isYoutube) {
        const videoId = attributes.url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
        if (!videoId) return null;
        return (
            <div className="my-12 aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                />
            </div>
        );
    }
    return (
        <div className="my-12 rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            <iframe src={attributes.url} className="w-full h-[400px]" loading="lazy" />
        </div>
    );
};

const FormEmbedBlock: React.FC<{ attributes: any }> = ({ attributes }) => (
    <div className="my-12 bg-slate-50 rounded-2xl p-8 border border-slate-100">
        {attributes.title && (
            <h3 className="text-xl font-bold mb-6">{attributes.title}</h3>
        )}
        {attributes.url ? (
            <iframe src={attributes.url} className="w-full min-h-[500px] rounded-xl border-0" loading="lazy" />
        ) : (
            <p className="text-slate-400 text-center py-10">Form URL not configured</p>
        )}
    </div>
);

interface BlockRendererProps {
    blocks: Block[];
    campaignId?: number;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks, campaignId }) => {
    const params = useParams();
    const locale = params?.locale as string || 'en';

    const wrapLink = (url: string) => {
        let finalUrl = url || '';

        // Fallback for campaign articles: if link is empty or just '/', default to /donate
        if (campaignId && (finalUrl === '' || finalUrl === '/')) {
            finalUrl = '/donate';
        }

        if (!finalUrl) return finalUrl;

        // Ensure locale prefix
        if (finalUrl.startsWith('/') && !finalUrl.startsWith(`/${locale}`)) {
            finalUrl = `/${locale}${finalUrl}`;
        }

        if (!campaignId) return finalUrl;

        try {
            // Check if it's a relative /donate link or absolute to our domain
            if (finalUrl.includes('/donate')) {
                const separator = finalUrl.includes('?') ? '&' : '?';
                if (!finalUrl.includes('campaign=')) {
                    return `${finalUrl}${separator}campaign=${campaignId}`;
                }
            }
        } catch (e) { }
        return finalUrl;
    };

    return (
        <div className="block-renderer">
            {blocks.map((block) => {
                switch (block.type) {
                    case 'heading':
                        return <HeadingBlock key={block.id} attributes={block.attributes} />;
                    case 'richtext':
                    case 'text':
                        return <TextBlock key={block.id} attributes={block.attributes} />;
                    case 'image':
                        return <ImageBlock key={block.id} attributes={block.attributes} />;
                    case 'cta-button':
                        return (
                            <CTAButtonBlock
                                key={block.id}
                                attributes={{
                                    ...block.attributes,
                                    url: wrapLink(block.attributes.url || '')
                                }}
                            />
                        );
                    case 'divider':
                        return <DividerBlock key={block.id} />;
                    case 'faq-accordion':
                        return <FAQBlock key={block.id} attributes={block.attributes} />;
                    case 'hero':
                        return (
                            <HeroBlock
                                key={block.id}
                                attributes={{
                                    ...block.attributes,
                                    link: wrapLink(block.attributes.link || '')
                                }}
                            />
                        );
                    case 'gallery':
                        return <GalleryBlock key={block.id} attributes={block.attributes} />;
                    case 'promo-bar':
                        return (
                            <PromoBarBlock
                                key={block.id}
                                attributes={{
                                    ...block.attributes,
                                    link: wrapLink(block.attributes.link || '')
                                }}
                            />
                        );
                    case 'two-column':
                        return <TwoColumnBlock key={block.id} attributes={block.attributes} />;
                    case 'embed':
                        return <EmbedBlock key={block.id} attributes={block.attributes} />;
                    case 'form-embed':
                        return <FormEmbedBlock key={block.id} attributes={block.attributes} />;
                    default:
                        return (
                            <div
                                key={block.id}
                                className="p-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs my-6 font-mono text-center"
                            >
                                [ {block.type.toUpperCase()} BLOCK ]
                            </div>
                        );
                }
            })}
        </div>
    );
};
