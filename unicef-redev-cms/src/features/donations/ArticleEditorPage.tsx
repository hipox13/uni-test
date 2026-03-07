import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Trash2, Loader2, Settings2, Eye, History, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/auth/permissions';
import type { Block } from '../editor/serializer';

import { TemplatePicker } from '../pages/TemplatePicker';

const VisualEditor = lazy(() => import('../editor/VisualEditor').then((m) => ({ default: m.VisualEditor })));

interface ArticleFormData {
  title: string; slug?: string; description?: string; keywords?: string;
  body?: string; bodyOneOff?: string; status?: number; donateType?: number;
  campaignType?: number; specialTags?: string; datePublished?: string; dateInactive?: string;
  picture?: string; mobilePicture?: string; thumbnail?: string; thankyouPicture?: string;
  monthlyParams?: string; oneoffParams?: string;
  customCss?: string;
  customJs?: string;
}

interface ArticleVersion {
  id: number; donationId: number; title: string; body: string;
  version: number; authorId: number; createdAt: string;
}

const slugify = (t: string) => t.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

function VersionHistoryDialog({ articleId, open, onOpenChange, onRestore }: {
  articleId: string; open: boolean; onOpenChange: (v: boolean) => void;
  onRestore: (body: string) => void;
}) {
  const [selected, setSelected] = useState<ArticleVersion | null>(null);

  const { data: versions = [], isLoading } = useQuery<ArticleVersion[]>({
    queryKey: ['article-versions', articleId],
    queryFn: async () => (await apiClient.get(`/articles/${articleId}/versions`)).data,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>Browse and restore previous versions of this article.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No version history yet.</p>
        ) : (
          <div className="flex gap-4 min-h-0 flex-1 overflow-hidden">
            <div className="w-52 shrink-0 overflow-y-auto border-r pr-3 space-y-1">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-xs transition-colors',
                    selected?.id === v.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  <div className="font-semibold">Version {v.version}</div>
                  <div className={cn('mt-0.5', selected?.id === v.id ? 'opacity-80' : 'text-muted-foreground')}>
                    {new Date(v.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {v.authorId && (
                    <Badge variant="outline" className="mt-1 text-[9px] h-4">Author #{v.authorId}</Badge>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Version {selected.version}</p>
                      <p className="text-xs text-muted-foreground">{selected.title || 'Untitled'}</p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { onRestore(selected.body); onOpenChange(false); }}
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </Button>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4 text-xs font-mono whitespace-pre-wrap max-h-[45vh] overflow-y-auto">
                    {(() => {
                      try {
                        const blocks = JSON.parse(selected.body) as Block[];
                        if (!Array.isArray(blocks) || blocks.length === 0) return selected.body;
                        return blocks.map((b, i) => `[${i + 1}] ${b.type}: ${JSON.stringify(b.attributes, null, 2)}`).join('\n\n');
                      } catch {
                        return selected.body;
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Select a version to preview.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [showSettings, setShowSettings] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [templateChosen, setTemplateChosen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('articles', 'edit');
  const canDelete = hasPermission('articles', 'delete');
  const canPublish = hasPermission('articles', 'publish');

  const { register, handleSubmit, watch, setValue } = useForm<ArticleFormData>({
    defaultValues: { title: '', slug: '', description: '', keywords: '', body: '[]', bodyOneOff: '[]', status: 0, donateType: 1 },
  });

  const title = watch('title');

  useEffect(() => {
    if (isNew && title) setValue('slug', slugify(title));
  }, [title, isNew, setValue]);

  const { data: articleData, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => (await apiClient.get(`/articles/${id}`)).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (articleData && !isNew && !hasLoaded) {
      Object.keys(articleData).forEach((key) => {
        let value = articleData[key];
        if (key.includes('date') && value) value = new Date(value).toISOString().split('T')[0];
        setValue(key as any, value);
      });

      // Parse metadata for custom fields
      try {
        const meta = articleData.metaData ? JSON.parse(articleData.metaData) : {};
        if (meta.customCss) setValue('customCss', meta.customCss);
        if (meta.customJs) setValue('customJs', meta.customJs);
      } catch (e) {
        console.error('Failed to parse article metadata', e);
      }

      setHasLoaded(true);
    }
  }, [articleData, isNew, setValue, hasLoaded]);

  const initialBlocks: Block[] = JSON.parse(watch('body') || '[]');

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => isNew ? apiClient.post('/articles', data) : apiClient.patch(`/articles/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      // If we just published it or it was new, go back to list for better UX
      if (isNew || watch('status') === 2) {
        navigate('/articles');
      } else if (isNew) {
        navigate(`/articles/${res.data.id}`);
      }
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => apiClient.post(`/articles/${id}/preview`),
    onSuccess: (res) => {
      const { token } = res.data;
      const previewUrl = `http://localhost:3000/en/campaign/${watch('slug')}?preview=${token}`;
      window.open(previewUrl, '_blank');
    },
  });

  const trashMutation = useMutation({
    mutationFn: () => apiClient.patch(`/articles/${id}`, { status: 0 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['articles'] }); navigate('/articles'); },
  });

  const handleEditorSave = useCallback((blocks: Block[]) => {
    setValue('body', JSON.stringify(blocks));
  }, [setValue]);

  const handleSave = handleSubmit((data) => {
    // Clean up empty date strings to avoid 400 errors from class-validator
    const cleanedData = { ...data };
    if (cleanedData.datePublished === '') delete cleanedData.datePublished;
    if (cleanedData.dateInactive === '') delete cleanedData.dateInactive;

    if (!isEditorReady) {
      console.warn('Editor not ready yet, skipping save');
      return;
    }
    window.dispatchEvent(new Event('editor:save'));
    setTimeout(() => {
      const latestBody = watch('body');
      saveMutation.mutate({ ...cleanedData, body: latestBody });
    }, 100);
  });

  const handleTemplateSelect = useCallback((blocks: Block[]) => {
    setValue('body', JSON.stringify(blocks));
    setTemplateChosen(true);
  }, [setValue]);

  const handleVersionRestore = useCallback((body: string) => {
    setValue('body', body);
    queryClient.invalidateQueries({ queryKey: ['article', id] });
  }, [setValue, queryClient, id]);

  // Auto-save when status manually changed to Published
  const currentStatus = watch('status');
  useEffect(() => {
    if (hasLoaded && isEditorReady && Number(currentStatus) === 2 && !isNew && !saveMutation.isPending) {
      if (articleData && articleData.status !== 2) {
        handleSave();
      }
    }
  }, [currentStatus, isNew, hasLoaded, isEditorReady, articleData]);

  if (isLoading && !isNew) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (isNew && !templateChosen && initialBlocks.length === 0) {
    return <TemplatePicker onSelect={handleTemplateSelect} mode="article" />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/articles')}><ArrowLeft className="h-4 w-4" /></Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">{isNew ? 'New Article' : 'Edit Article'}</h1>
            {!isNew && <p className="text-xs text-muted-foreground font-mono">/{watch('slug')}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={() => setShowVersions(true)} className="gap-2">
              <History className="h-3.5 w-3.5" /> Versions
            </Button>
          )}
          {!isNew && (
            <Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending} className="gap-2">
              {previewMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              Live Preview
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className={cn('gap-2', showSettings && 'bg-muted')}>
            <Settings2 className="h-3.5 w-3.5" /> Article Settings
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !canEdit} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {!isNew && canDelete && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { if (confirm('Move to trash?')) trashMutation.mutate(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {showSettings && (
        <div className="border-b bg-muted/30 px-8 py-6 shrink-0 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input {...register('title', { required: true })} placeholder="Article title" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...register('slug')} className="font-mono text-sm h-10" />
              </div>
              <div className="space-y-2">
                <Label>Donation Type</Label>
                <Select {...register('donateType', { valueAsNumber: true })}>
                  <option value={1}>Monthly only</option>
                  <option value={2}>One-off only</option>
                  <option value={3}>Monthly + One-off</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select {...register('status', { valueAsNumber: true })}>
                  <option value={0}>Draft</option>
                  <option value={1}>Review</option>
                  <option value={2} disabled={!canPublish}>Published</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Published Date</Label>
                <Input type="date" {...register('datePublished')} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Inactive Date</Label>
                <Input type="date" {...register('dateInactive')} className="h-10" />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs">Special Tags</Label>
                <Input {...register('specialTags')} placeholder="tag1, tag2" className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Custom CSS</Label>
                <Textarea {...register('customCss')} placeholder=".my-class { color: red; }" className="font-mono text-xs h-24" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Custom JS</Label>
                <Textarea {...register('customJs')} placeholder="console.log('hello');" className="font-mono text-xs h-24" />
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="flex-1 flex overflow-hidden">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
          <VisualEditor initialBlocks={initialBlocks} onSave={handleEditorSave} onReady={() => setIsEditorReady(true)} pageId={`article-${id}`} />
        </Suspense>
      </div>

      {!isNew && (
        <VersionHistoryDialog
          articleId={id!}
          open={showVersions}
          onOpenChange={setShowVersions}
          onRestore={handleVersionRestore}
        />
      )}
    </div>
  );
}

