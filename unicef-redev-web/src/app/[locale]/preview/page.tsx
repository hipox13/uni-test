'use client';

import React, { useState, useEffect } from 'react';
import { BlockRenderer } from '@/components/BlockRenderer';
import { Block } from '@/types/blocks';

export default function PreviewPage() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [title, setTitle] = useState<string>('Preview');

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Security: Validate origin in production
            // if (event.origin !== process.env.NEXT_PUBLIC_CMS_URL) return;

            if (event.data?.type === 'CMS_LIVE_PREVIEW') {
                const { title, body } = event.data.payload;
                setTitle(title || '');

                try {
                    const parsedBlocks = typeof body === 'string' ? JSON.parse(body) : body;
                    setBlocks(Array.isArray(parsedBlocks) ? parsedBlocks : []);
                } catch (e) {
                    console.error('Failed to parse blocks in preview:', e);
                }
            }
        };

        window.addEventListener('message', handleMessage);

        // Signal to parent that we are ready
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <main className="max-w-4xl mx-auto px-6 py-12 bg-white min-h-screen shadow-sm">
            <header className="mb-12 border-b border-slate-100 pb-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {title || 'Untitled Page'}
                </h1>
                <div className="mt-4 flex items-center text-sm text-slate-500">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium text-xs mr-2">
                        PREVIEW MODE
                    </span>
                    <span>Showing real-time changes from CMS</span>
                </div>
            </header>

            <BlockRenderer blocks={blocks} />

            {blocks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-lg">No content blocks yet.</p>
                    <p className="text-sm">Start adding blocks in the CMS to see them here.</p>
                </div>
            )}
        </main>
    );
}
