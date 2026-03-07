import { Card, CardContent } from '@/components/ui/card';
import { FileText, Megaphone, Layout, Newspaper, Heart } from 'lucide-react';
import type { Block } from '../editor/serializer';

let _nextId = 1;
const bid = () => `tpl-${_nextId++}`;

const TEMPLATES: { name: string; description: string; icon: typeof FileText; blocks: Block[] }[] = [
  {
    name: 'Blank Page',
    description: 'Start from an empty canvas',
    icon: FileText,
    blocks: [],
  },
  {
    name: 'Landing Page',
    description: 'Hero, text, CTA, two columns, and FAQ',
    icon: Layout,
    blocks: [
      { id: bid(), type: 'hero', version: 1, attributes: { title: 'Welcome to Our Campaign', content: 'Making a difference, one step at a time.', text: 'Get Involved' } },
      { id: bid(), type: 'richtext', version: 1, attributes: { content: 'Learn more about our mission and how you can contribute to creating lasting change.' } },
      { id: bid(), type: 'cta-button', version: 1, attributes: { text: 'Donate Now', url: '/donate', variant: 'primary' } },
      { id: bid(), type: 'two-column', version: 1, attributes: { left: 'Our programs reach millions of children worldwide.', right: 'Every contribution makes a real impact.', ratio: '50-50' } },
      { id: bid(), type: 'faq-accordion', version: 1, attributes: { items: [{ question: 'How can I help?', answer: 'You can donate, volunteer, or spread the word.' }, { question: 'Where does my money go?', answer: 'Funds go directly to programs supporting children in need.' }] } },
    ],
  },
  {
    name: 'Campaign Page',
    description: 'Hero, image, text, promo bar, and CTA',
    icon: Megaphone,
    blocks: [
      { id: bid(), type: 'heading', version: 1, attributes: { level: 'h2', text: 'Campaign Heading', className: 'text-3xl font-bold' } },
      { id: bid(), type: 'richtext', version: 1, attributes: { content: 'Describe your campaign here to inspire donors.', className: 'text-muted-foreground' } },
      { id: bid(), type: 'image', version: 1, attributes: { url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop', alt: 'Campaign', className: 'rounded-xl h-64 w-full object-cover' } },
      { id: bid(), type: 'cta-button', version: 1, attributes: { text: 'Donate Now', url: '/donate', variant: 'primary', className: 'mt-4 w-full py-4 text-lg font-bold' } },
      { id: bid(), type: 'promo-bar', version: 1, attributes: { text: 'Join us in making a difference today!', backgroundColor: '#00aeef', className: 'bg-primary/10' } },
    ],
  },
  {
    name: 'Article Page',
    description: 'Heading, text, image, and more text',
    icon: Newspaper,
    blocks: [
      { id: bid(), type: 'heading', version: 1, attributes: { text: 'Article Title', level: 'h1' } },
      { id: bid(), type: 'richtext', version: 1, attributes: { content: 'Introduction paragraph — set the context for your article here.' } },
      { id: bid(), type: 'image', version: 1, attributes: { url: '', alt: 'Article featured image' } },
      { id: bid(), type: 'richtext', version: 1, attributes: { content: 'Continue writing the body of your article in this block.' } },
    ],
  },
  {
    name: 'Donation Page',
    description: 'Hero, text, CTA, columns, and form embed',
    icon: Heart,
    blocks: [
      { id: bid(), type: 'hero', version: 1, attributes: { title: 'Make a Donation', content: 'Your generosity changes lives.', text: 'Donate' } },
      { id: bid(), type: 'richtext', version: 1, attributes: { content: 'Every donation directly funds programs that protect and empower children around the world.' } },
      { id: bid(), type: 'cta-button', version: 1, attributes: { text: 'Give Monthly', url: '/donate', variant: 'primary' } },
      { id: bid(), type: 'two-column', version: 1, attributes: { left: 'One-time gifts create immediate impact.', right: 'Monthly giving sustains long-term change.', ratio: '50-50' } },
      { id: bid(), type: 'form-embed', version: 1, attributes: { formId: 'donation-form', formUrl: '' } },
    ],
  },
];

const BLOCK_LABEL: Record<string, string> = {
  hero: 'Hero', richtext: 'Text', 'cta-button': 'CTA', 'two-column': '2-Col',
  'faq-accordion': 'FAQ', image: 'Img', heading: 'H1', 'promo-bar': 'Promo', 'form-embed': 'Form',
};

export function TemplatePicker({ onSelect, mode = 'page' }: { onSelect: (blocks: Block[]) => void; mode?: 'page' | 'article' }) {
  const filteredTemplates = TEMPLATES.filter(tpl => {
    if (mode === 'article') return tpl.name.includes('Article') || tpl.name.includes('Campaign') || tpl.name.includes('Blank');
    return true;
  });

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Choose a Template</h1>
          <p className="text-sm text-muted-foreground">Pick a starting layout for your new {mode}.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTemplates.map((tpl) => (
            <Card
              key={tpl.name}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 hover:shadow-md transition-all group"
              onClick={() => onSelect(tpl.blocks)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <tpl.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{tpl.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                {tpl.blocks.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {tpl.blocks.map((b, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {BLOCK_LABEL[b.type] || b.type}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
