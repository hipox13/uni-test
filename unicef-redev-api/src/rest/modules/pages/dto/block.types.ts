/**
 * Block structure for Gutenberg-style editor.
 * Each page body contains an array of blocks.
 */
export interface Block {
  id: string;
  type: string;
  version: number;
  attributes: Record<string, any>;
}

export const BLOCK_TYPES = [
  'richtext',
  'heading',
  'image',
  'gallery',
  'hero',
  'cta-button',
  'embed',
  'faq-accordion',
  'promo-bar',
  'divider',
  'two-column',
  'form-embed',
] as const;

export type BlockType = typeof BLOCK_TYPES[number];
