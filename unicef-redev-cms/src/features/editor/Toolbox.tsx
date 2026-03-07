import { createElement, type ComponentType } from 'react';
import { useEditor } from '@craftjs/core';
import { Button } from '@/components/ui/button';
import {
  Type, AlignLeft, ImageIcon, Layout, MousePointerClick,
  Minus, Video, MessageSquare, Megaphone, Columns, FileInput, ImageMinus,
  Library, X,
} from 'lucide-react';
import {
  EditorHeading, EditorRichText, EditorImage, EditorHero, EditorCTA,
  EditorDivider, EditorEmbed, EditorFAQ, EditorPromo, EditorGallery,
  EditorTwoColumn, EditorFormEmbed,
} from './blocks';
import { useBlocksLibraryStore } from '@/lib/stores/blocksLibraryStore';

const RESOLVER_MAP: Record<string, ComponentType<any>> = {
  EditorHeading, EditorRichText, EditorImage, EditorHero, EditorCTA,
  EditorDivider, EditorEmbed, EditorFAQ, EditorPromo, EditorGallery,
  EditorTwoColumn, EditorFormEmbed,
};

const BLOCKS = [
  { label: 'Heading', icon: Type, component: EditorHeading },
  { label: 'Rich Text', icon: AlignLeft, component: EditorRichText },
  { label: 'Image', icon: ImageIcon, component: EditorImage },
  { label: 'Gallery', icon: ImageMinus, component: EditorGallery },
  { label: 'Hero Section', icon: Layout, component: EditorHero },
  { label: 'CTA Button', icon: MousePointerClick, component: EditorCTA },
  { label: 'Embed', icon: Video, component: EditorEmbed },
  { label: 'FAQ', icon: MessageSquare, component: EditorFAQ },
  { label: 'Promo Bar', icon: Megaphone, component: EditorPromo },
  { label: 'Two Column', icon: Columns, component: EditorTwoColumn },
  { label: 'Form Embed', icon: FileInput, component: EditorFormEmbed },
  { label: 'Divider', icon: Minus, component: EditorDivider },
];

export function Toolbox() {
  const { connectors } = useEditor();
  const { blocks, removeBlock } = useBlocksLibraryStore();

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">Elements</p>
      {BLOCKS.map((b) => (
          <Button
            key={b.label}
            ref={(r: HTMLButtonElement | null) => r && connectors.create(r, createElement(b.component))}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 h-9 text-xs cursor-grab active:cursor-grabbing hover:bg-primary/5"
          >
            <b.icon className="h-3.5 w-3.5 text-muted-foreground" />
            {b.label}
          </Button>
      ))}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 mt-6 px-1">Saved Blocks</p>
      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground px-1">No saved blocks yet. Select a block and use &quot;Save as Block&quot;.</p>
      ) : blocks.map((sb) => {
        const Comp = RESOLVER_MAP[sb.type];
        if (!Comp) return null;
        return (
          <div key={sb.id} className="group flex items-center gap-1">
            <Button ref={(r: HTMLButtonElement | null) => r && connectors.create(r, createElement(Comp, sb.props))}
              variant="ghost" size="sm" className="flex-1 justify-start gap-2 h-9 text-xs cursor-grab active:cursor-grabbing hover:bg-primary/5">
              <Library className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{sb.name}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); removeBlock(sb.id); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
