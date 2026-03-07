import { useNode } from '@craftjs/core';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type ReactNode, type CSSProperties } from 'react';

/* ─── Types ─── */
export interface StyleProps {
  width?: string;
  height?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
  borderRadius?: string;
  opacity?: string;
}

/* ─── Constants & Helpers ─── */
const SEL = 'ring-2 ring-primary ring-offset-2 rounded-lg';
const HOV = 'ring-1 ring-primary/30 rounded-lg';

export function buildStyle(s: any): CSSProperties {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return {};
  const o: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (v !== undefined && v !== '' && typeof v !== 'object') o[k] = v;
  }
  return o;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium">{label}</Label>{children}</div>;
}

/* ─── Shared Style Settings ─── */
function StyleSettings() {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  const s = (props.style || {}) as StyleProps;
  const set = (key: keyof StyleProps, val: string) =>
    setProp((p: any) => (p.style = { ...p.style, [key]: val }));

  return (
    <div className="space-y-4 pt-2">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Size</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Width"><Input value={s.width || ''} onChange={e => set('width', e.target.value)} placeholder="e.g. 100%" /></Field>
          <Field label="Height"><Input value={s.height || ''} onChange={e => set('height', e.target.value)} placeholder="auto" /></Field>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Spacing</p>
        <Label className="text-[11px] text-muted-foreground">Padding</Label>
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {(['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const).map(k => (
            <Input key={k} value={s[k] || ''} onChange={e => set(k, e.target.value)}
              placeholder={k.replace('padding', '').charAt(0)} className="text-xs h-7 text-center" />
          ))}
        </div>
        <Label className="text-[11px] text-muted-foreground mt-2 block">Margin</Label>
        <div className="grid grid-cols-4 gap-1.5 mt-1">
          {(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const).map(k => (
            <Input key={k} value={s[k] || ''} onChange={e => set(k, e.target.value)}
              placeholder={k.replace('margin', '').charAt(0)} className="text-xs h-7 text-center" />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Typography</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Font Size"><Input value={s.fontSize || ''} onChange={e => set('fontSize', e.target.value)} placeholder="16px" /></Field>
          <Field label="Weight"><Input value={s.fontWeight || ''} onChange={e => set('fontWeight', e.target.value)} placeholder="400" /></Field>
        </div>
        <div className="mt-2">
          <Field label="Align">
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <Button key={a} type="button" variant={s.textAlign === a ? 'default' : 'outline'} size="sm"
                  className="flex-1 h-7 text-xs capitalize" onClick={() => set('textAlign', a)}>{a}</Button>
              ))}
            </div>
          </Field>
        </div>
        <div className="mt-2">
          <Field label="Color">
            <div className="flex gap-2">
              <input type="color" value={s.color || '#000000'} onChange={e => set('color', e.target.value)}
                className="h-9 w-10 rounded border border-input cursor-pointer p-0.5" />
              <Input value={s.color || ''} onChange={e => set('color', e.target.value)} placeholder="#000000" className="flex-1" />
            </div>
          </Field>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background</p>
        <Field label="Background">
          <div className="flex gap-2">
            <input type="color" value={s.backgroundColor || '#ffffff'} onChange={e => set('backgroundColor', e.target.value)}
              className="h-9 w-10 rounded border border-input cursor-pointer p-0.5" />
            <Input value={s.backgroundColor || ''} onChange={e => set('backgroundColor', e.target.value)} placeholder="transparent" className="flex-1" />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Radius"><Input value={s.borderRadius || ''} onChange={e => set('borderRadius', e.target.value)} placeholder="0px" /></Field>
          <Field label="Opacity"><Input value={s.opacity || ''} onChange={e => set('opacity', e.target.value)} placeholder="1" /></Field>
        </div>
      </div>
    </div>
  );
}

function StyleCollapsible() {
  return (
    <details className="border rounded-lg mt-4">
      <summary className="px-3 py-2 text-xs font-semibold cursor-pointer select-none hover:bg-muted/50 rounded-lg">
        Style Settings
      </summary>
      <div className="px-3 pb-3"><StyleSettings /></div>
    </details>
  );
}

/* ═══════════════════════════════════════════════
   Block Components
   ═══════════════════════════════════════════════ */

/* ─── Canvas (root droppable) ─── */
export const EditorCanvas = ({ children }: { children?: ReactNode }) => {
  const { connectors: { connect } } = useNode();
  return <div ref={r => connect(r!)} className="min-h-[400px] p-0">{children}</div>;
};
EditorCanvas.craft = { displayName: 'Canvas', rules: { canMoveIn: () => true } };

/* ─── Heading ─── */
export const EditorHeading = ({ text = 'Heading', level = 'h2', style = {} as StyleProps }: { text?: string; level?: string | number; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const tagStr = typeof level === 'number' ? `h${level}` : (level || 'h2');
  const Tag = tagStr as keyof JSX.IntrinsicElements;
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <Tag className={cn(tagStr === 'h1' && 'text-4xl font-bold', tagStr === 'h2' && 'text-3xl font-semibold', tagStr === 'h3' && 'text-2xl font-medium')}>
        {text}
      </Tag>
    </div>
  );
};
const HeadingSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Text"><Input value={props.text || ''} onChange={e => setProp((p: any) => (p.text = e.target.value))} /></Field>
      <Field label="Level">
        <div className="flex gap-1.5">
          {(['h1', 'h2', 'h3'] as const).map(l => (
            <Button key={l} variant={props.level === l ? 'default' : 'outline'} size="sm"
              className="flex-1 h-8 text-xs" onClick={() => setProp((p: any) => (p.level = l))}>{l.toUpperCase()}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorHeading.craft = { displayName: 'Heading', props: { text: 'Heading', level: 'h2', style: {} }, related: { settings: HeadingSettings } };

/* ─── Rich Text ─── */
export const EditorRichText = ({ content = '', style = {} as StyleProps }: { content?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <div className="prose prose-sm max-w-none text-foreground">
        {content ? <p>{content}</p> : <p className="text-muted-foreground italic">Click to edit text...</p>}
      </div>
    </div>
  );
};
const RichTextSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Content">
        <Textarea value={props.content || ''} onChange={e => setProp((p: any) => (p.content = e.target.value))} className="min-h-[120px]" placeholder="Type your content..." />
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorRichText.craft = { displayName: 'Rich Text', props: { content: '', style: {} }, related: { settings: RichTextSettings } };

/* ─── Image ─── */
export const EditorImage = ({ url = '', alt = '', objectFit = 'cover', style = {} as StyleProps }: { url?: string; alt?: string; objectFit?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      {url ? (
        <img src={url} alt={alt} className="max-w-full h-auto rounded-lg" style={{ objectFit: objectFit as CSSProperties['objectFit'] }} />
      ) : (
        <div className="h-48 rounded-lg bg-muted flex items-center justify-center border border-dashed border-border">
          <span className="text-sm text-muted-foreground">Set image URL in settings</span>
        </div>
      )}
    </div>
  );
};
const ImageSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Image URL"><Input type="url" value={props.url || ''} onChange={e => setProp((p: any) => (p.url = e.target.value))} placeholder="https://..." /></Field>
      <Field label="Alt Text"><Input value={props.alt || ''} onChange={e => setProp((p: any) => (p.alt = e.target.value))} /></Field>
      <Field label="Object Fit">
        <div className="flex gap-1.5">
          {(['cover', 'contain', 'fill', 'none'] as const).map(v => (
            <Button key={v} variant={props.objectFit === v ? 'default' : 'outline'} size="sm"
              className="flex-1 h-7 text-[10px]" onClick={() => setProp((p: any) => (p.objectFit = v))}>{v}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorImage.craft = { displayName: 'Image', props: { url: '', alt: '', objectFit: 'cover', style: {} }, related: { settings: ImageSettings } };

/* ─── Hero Section ─── */
export const EditorHero = ({ title = '', content = '', text = '', link: _link = '', url = '', style = {} as StyleProps }: { title?: string; content?: string; text?: string; link?: string; url?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <div className="relative overflow-hidden rounded-lg"
        style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className={cn('px-8 py-16 text-center', url ? 'bg-black/50 text-white' : 'bg-gradient-to-br from-primary/10 to-primary/5')}>
          <h2 className="text-3xl font-bold mb-3">{title || 'Hero Title'}</h2>
          {content && <p className="text-lg opacity-80 mb-6 max-w-xl mx-auto">{content}</p>}
          {text && <span className="inline-block bg-primary text-white px-6 py-3 rounded-full font-semibold">{text}</span>}
        </div>
      </div>
    </div>
  );
};
const HeroSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Title"><Input value={props.title || ''} onChange={e => setProp((p: any) => (p.title = e.target.value))} /></Field>
      <Field label="Subtitle"><Textarea value={props.content || ''} onChange={e => setProp((p: any) => (p.content = e.target.value))} className="h-20" /></Field>
      <Field label="Button Text"><Input value={props.text || ''} onChange={e => setProp((p: any) => (p.text = e.target.value))} /></Field>
      <Field label="Button Link"><Input value={props.link || ''} onChange={e => setProp((p: any) => (p.link = e.target.value))} /></Field>
      <Field label="Background Image"><Input type="url" value={props.url || ''} onChange={e => setProp((p: any) => (p.url = e.target.value))} /></Field>
      <StyleCollapsible />
    </div>
  );
};
EditorHero.craft = { displayName: 'Hero Section', props: { title: '', content: '', text: '', link: '', url: '', style: {} }, related: { settings: HeroSettings } };

/* ─── CTA Button ─── */
export const EditorCTA = ({ text = 'Click Here', url = '', variant = 'primary', style = {} as StyleProps }: { text?: string; url?: string; variant?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <span className={cn('inline-block px-6 py-3 rounded-full font-semibold text-sm',
        variant === 'primary' && 'bg-primary text-white',
        variant === 'secondary' && 'bg-secondary text-foreground',
        variant === 'outline' && 'border-2 border-primary text-primary')}>
        {text}
      </span>
      {url && <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">&rarr; {url}</p>}
    </div>
  );
};
const CTASettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Button Text"><Input value={props.text || ''} onChange={e => setProp((p: any) => (p.text = e.target.value))} /></Field>
      <Field label="URL"><Input type="url" value={props.url || ''} onChange={e => setProp((p: any) => (p.url = e.target.value))} /></Field>
      <Field label="Variant">
        <div className="flex gap-1.5">
          {(['primary', 'secondary', 'outline'] as const).map(v => (
            <Button key={v} variant={props.variant === v ? 'default' : 'outline'} size="sm"
              className="flex-1 h-8 text-xs capitalize" onClick={() => setProp((p: any) => (p.variant = v))}>{v}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorCTA.craft = { displayName: 'CTA Button', props: { text: 'Click Here', url: '', variant: 'primary', style: {} }, related: { settings: CTASettings } };

/* ─── Divider ─── */
export const EditorDivider = ({ style = {} as StyleProps }: { style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-4 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <hr className="border-border" />
    </div>
  );
};
const DividerSettings = () => (<StyleCollapsible />);
EditorDivider.craft = { displayName: 'Divider', props: { style: {} }, related: { settings: DividerSettings } };

/* ─── Embed ─── */
export const EditorEmbed = ({ url = '', type = 'youtube', style = {} as StyleProps }: { url?: string; type?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  const src = type === 'youtube' ? url.replace('watch?v=', 'embed/') : url;
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      {url ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
          <iframe src={src} className="w-full h-full" allowFullScreen title="embed" />
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border border-dashed">
          <span className="text-sm text-muted-foreground">Embed ({type}) &mdash; Set URL in settings</span>
        </div>
      )}
    </div>
  );
};
const EmbedSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="URL"><Input type="url" value={props.url || ''} onChange={e => setProp((p: any) => (p.url = e.target.value))} placeholder="YouTube/Vimeo URL" /></Field>
      <Field label="Type">
        <div className="flex gap-1.5">
          {(['youtube', 'vimeo', 'iframe'] as const).map(t => (
            <Button key={t} variant={props.type === t ? 'default' : 'outline'} size="sm"
              className="flex-1 h-8 text-xs" onClick={() => setProp((p: any) => (p.type = t))}>{t}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorEmbed.craft = { displayName: 'Embed', props: { url: '', type: 'youtube', style: {} }, related: { settings: EmbedSettings } };

/* ─── Promo Bar ─── */
export const EditorPromo = ({ text = '', link = '', backgroundColor = '#00aeef', style = {} as StyleProps }: { text?: string; link?: string; backgroundColor?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <div className="px-6 py-3 text-center text-white font-medium text-sm rounded-lg" style={{ backgroundColor }}>
        {text || 'Promo text here'} {link && <span className="underline ml-2">Learn more &rarr;</span>}
      </div>
    </div>
  );
};
const PromoSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Text"><Input value={props.text || ''} onChange={e => setProp((p: any) => (p.text = e.target.value))} /></Field>
      <Field label="Link"><Input value={props.link || ''} onChange={e => setProp((p: any) => (p.link = e.target.value))} /></Field>
      <Field label="Bar Color">
        <div className="flex gap-2">
          <input type="color" value={props.backgroundColor || '#00aeef'} onChange={e => setProp((p: any) => (p.backgroundColor = e.target.value))}
            className="h-9 w-10 rounded border border-input cursor-pointer p-0.5" />
          <Input value={props.backgroundColor || ''} onChange={e => setProp((p: any) => (p.backgroundColor = e.target.value))} className="flex-1" />
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorPromo.craft = { displayName: 'Promo Bar', props: { text: '', link: '', backgroundColor: '#00aeef', style: {} }, related: { settings: PromoSettings } };

/* ─── Gallery ─── */
export const EditorGallery = ({ images = [] as string[], columns = 3, style = {} as StyleProps }: { images?: string[]; columns?: number; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      {images.length > 0 ? (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {images.map((u, i) => <img key={i} src={u} className="aspect-square object-cover rounded-lg w-full" alt="" />)}
        </div>
      ) : (
        <div className="h-32 rounded-lg bg-muted flex items-center justify-center border border-dashed">
          <span className="text-sm text-muted-foreground">Gallery &mdash; Add images in settings</span>
        </div>
      )}
    </div>
  );
};
const GallerySettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Image URLs (one per line)">
        <Textarea value={(props.images || []).join('\n')} onChange={e => setProp((p: any) => (p.images = e.target.value.split('\n').filter(Boolean)))}
          className="min-h-[100px] font-mono text-xs" />
      </Field>
      <Field label="Columns">
        <div className="flex gap-1.5">
          {[2, 3, 4].map(n => (
            <Button key={n} variant={props.columns === n ? 'default' : 'outline'} size="sm"
              className="flex-1 h-8 text-xs" onClick={() => setProp((p: any) => (p.columns = n))}>{n}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorGallery.craft = { displayName: 'Gallery', props: { images: [], columns: 3, style: {} }, related: { settings: GallerySettings } };

/* ─── FAQ Accordion ─── */
export const EditorFAQ = ({ items = [{ question: '', answer: '' }], style = {} as StyleProps }: { items?: { question: string; answer: string }[]; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <div className="space-y-2">
        {(items || []).map((item, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 font-medium text-sm">{item.question || `Question ${i + 1}`}</div>
            <div className="px-4 py-3 text-sm text-muted-foreground">{item.answer || 'Answer...'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
const FAQSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  const items: { question: string; answer: string }[] = props.items || [];
  const update = (idx: number, key: string, val: string) =>
    setProp((p: any) => { const c = [...(p.items || [])]; c[idx] = { ...c[idx], [key]: val }; p.items = c; });
  return (
    <div className="space-y-3">
      {items.map((_: any, i: number) => (
        <div key={i} className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <Input value={items[i]?.question || ''} onChange={e => update(i, 'question', e.target.value)} placeholder="Question" />
          <Textarea value={items[i]?.answer || ''} onChange={e => update(i, 'answer', e.target.value)} placeholder="Answer" className="h-16" />
          <Button variant="ghost" size="sm" className="text-xs text-destructive"
            onClick={() => setProp((p: any) => (p.items = items.filter((_: any, j: number) => j !== i)))}>Remove</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full border-dashed"
        onClick={() => setProp((p: any) => (p.items = [...(p.items || []), { question: '', answer: '' }]))}>+ Add FAQ</Button>
      <StyleCollapsible />
    </div>
  );
};
EditorFAQ.craft = { displayName: 'FAQ Accordion', props: { items: [{ question: '', answer: '' }], style: {} }, related: { settings: FAQSettings } };

/* ─── Two Column ─── */
const RATIOS: Record<string, string> = { '50-50': '1fr 1fr', '33-67': '1fr 2fr', '67-33': '2fr 1fr' };

export const EditorTwoColumn = ({ left = '', right = '', ratio = '50-50', style = {} as StyleProps }: { left?: string; right?: string; ratio?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      <div className="grid gap-4" style={{ gridTemplateColumns: RATIOS[ratio] || '1fr 1fr' }}>
        <div className="p-4 rounded-lg bg-muted/30 border border-dashed min-h-[80px] text-sm">{left || 'Left column'}</div>
        <div className="p-4 rounded-lg bg-muted/30 border border-dashed min-h-[80px] text-sm">{right || 'Right column'}</div>
      </div>
    </div>
  );
};
const TwoColSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Left Column"><Textarea value={props.left || ''} onChange={e => setProp((p: any) => (p.left = e.target.value))} className="h-20" /></Field>
      <Field label="Right Column"><Textarea value={props.right || ''} onChange={e => setProp((p: any) => (p.right = e.target.value))} className="h-20" /></Field>
      <Field label="Ratio">
        <div className="flex gap-1.5">
          {(['50-50', '33-67', '67-33'] as const).map(r => (
            <Button key={r} variant={props.ratio === r ? 'default' : 'outline'} size="sm"
              className="flex-1 h-8 text-xs" onClick={() => setProp((p: any) => (p.ratio = r))}>{r}</Button>
          ))}
        </div>
      </Field>
      <StyleCollapsible />
    </div>
  );
};
EditorTwoColumn.craft = { displayName: 'Two Column', props: { left: '', right: '', ratio: '50-50', style: {} }, related: { settings: TwoColSettings } };

/* ─── Form Embed ─── */
export const EditorFormEmbed = ({ formId = '', formUrl = '', style = {} as StyleProps }: { formId?: string; formUrl?: string; style?: StyleProps }) => {
  const { connectors: { connect, drag }, selected, hovered } = useNode((s) => ({ selected: s.events.selected, hovered: s.events.hovered }));
  return (
    <div ref={r => connect(drag(r!))} style={buildStyle(style)}
      className={cn('py-3 px-4 cursor-move transition-all', selected && SEL, hovered && !selected && HOV)}>
      {formUrl ? (
        <iframe src={formUrl} className="w-full rounded-lg border" style={{ minHeight: '200px' }} title="form" />
      ) : (
        <div className="h-32 rounded-lg bg-muted/50 border border-dashed flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">Embedded Form</span>
          {formId && <span className="text-xs text-muted-foreground font-mono mt-1">ID: {formId}</span>}
        </div>
      )}
    </div>
  );
};
const FormEmbedSettings = () => {
  const { actions: { setProp }, props } = useNode((n) => ({ props: n.data.props }));
  return (
    <div className="space-y-4">
      <Field label="Form ID"><Input value={props.formId || ''} onChange={e => setProp((p: any) => (p.formId = e.target.value))} /></Field>
      <Field label="Embed URL"><Input type="url" value={props.formUrl || ''} onChange={e => setProp((p: any) => (p.formUrl = e.target.value))} /></Field>
      <StyleCollapsible />
    </div>
  );
};
EditorFormEmbed.craft = { displayName: 'Form Embed', props: { formId: '', formUrl: '', style: {} }, related: { settings: FormEmbedSettings } };
