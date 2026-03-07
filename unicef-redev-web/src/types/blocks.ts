export type BlockType =
    | 'text'
    | 'richtext'
    | 'image'
    | 'video'
    | 'button'
    | 'cta-button'
    | 'hero'
    | 'grid'
    | 'heading'
    | 'divider'
    | 'faq-accordion'
    | 'gallery'
    | 'promo-bar'
    | 'two-column'
    | 'form-embed'
    | 'embed';

export interface BlockAttributes {
    content?: string;
    url?: string;
    alt?: string;
    title?: string;
    text?: string;
    link?: string;
    variant?: 'primary' | 'secondary' | 'outline';
    columns?: number;
    [key: string]: any;
}

export interface Block {
    id: string;
    type: BlockType;
    version: number;
    attributes: BlockAttributes;
}

