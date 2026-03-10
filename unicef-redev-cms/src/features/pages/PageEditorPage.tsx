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
import { ArrowLeft, Save, Trash2, Loader2, Settings2, Globe, Eye, History, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermission } from '@/lib/auth/permissions';
import type { Block } from '../editor/serializer';
import { TemplatePicker } from './TemplatePicker';

const VisualEditor = lazy(() => import('../editor/VisualEditor').then((m) => ({ default: m.VisualEditor })));

interface PageFormData {
  title: string; slug?: string; description?: string; keywords?: string;
  metaTitle?: string; body?: string; status?: number;
  datePublished?: string; dateUnpublished?: string; dateInactive?: string; trash?: number;
  customCss?: string; customJs?: string;
}

interface PageVersion {
  id: number; pageId: number; title: string; body: string;
  version: number; authorId: number; createdAt: string;
}

const slugify = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

function VersionHistoryDialog({ pageId, open, onOpenChange, onRestore }: {
  pageId: string; open: boolean; onOpenChange: (v: boolean) => void;
  onRestore: (body: string) => void;
}) {
  const [selected, setSelected] = useState<PageVersion | null>(null);

  const { data: versions = [], isLoading } = useQuery<PageVersion[]>({
    queryKey: ['page-versions', pageId],
    queryFn: async () => (await apiClient.get(`/pages/${pageId}/versions`)).data,
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>Browse and restore previous versions of this page.</DialogDescription>
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

export function PageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [showSettings, setShowSettings] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [templateChosen, setTemplateChosen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('pages', 'edit');
  const canDelete = hasPermission('pages', 'delete');
  const canPublish = hasPermission('pages', 'publish');

  const { register, handleSubmit, watch, setValue } = useForm<PageFormData>({
    defaultValues: { title: '', slug: '', description: '', keywords: '', metaTitle: '', body: '[]', status: 0, trash: 0, customCss: '', customJs: '' },
  });

  const title = watch('title');

  useEffect(() => { if (isNew && !isManualSlug && title) setValue('slug', slugify(title)); }, [title, isNew, isManualSlug, setValue]);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => (await apiClient.get(`/pages/${id}`)).data,
    enabled: !isNew,
  });

  useEffect(() => {
    if (pageData && !isNew && !hasLoaded) {
      const toDate = (v: any) => (v ? new Date(v).toISOString().split('T')[0] : '');
      setValue('title', pageData.title || '');
      setValue('slug', pageData.slug || '');
      setValue('description', pageData.description || '');
      setValue('keywords', pageData.keywords || '');
      setValue('body', pageData.body || '[]');
      setValue('status', pageData.status || 0);
      setValue('datePublished', toDate(pageData.datePublished));
      setValue('dateUnpublished', toDate(pageData.dateUnpublished));
      setValue('dateInactive', toDate(pageData.dateInactive));
      setValue('trash', pageData.trash || 0);

      // Extract SEO and Custom fields from metadata
      try {
        const meta = pageData.metaData ? JSON.parse(pageData.metaData) : {};
        if (meta.metaTitle) setValue('metaTitle', meta.metaTitle);
        if (meta.customCss) setValue('customCss', meta.customCss);
        if (meta.customJs) setValue('customJs', meta.customJs);
      } catch (e) {
        console.error('Failed to parse page metadata', e);
      }

      setIsManualSlug(true);
      setHasLoaded(true);
    }
  }, [pageData, isNew, setValue, hasLoaded]);

  const bodyStr = watch('body') || '[]';
  const initialBlocks: Block[] = hasLoaded || isNew ? JSON.parse(bodyStr) : [];

  const saveMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      return (isNew ? await apiClient.post('/pages', data) : await apiClient.patch(`/pages/${id}`, data)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      // If we just published it or it was new, go back to list for better UX
      if (isNew || watch('status') === 2) {
        navigate('/pages');
      } else {
        queryClient.invalidateQueries({ queryKey: ['page', id] });
        if (isNew && data?.id) navigate(`/pages/${data.id}`, { replace: true });
      }
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => apiClient.post(`/pages/${id}/preview`),
    onSuccess: (res) => {
      const { token } = res.data;
      const previewUrl = `http://localhost:3000/en/${watch('slug')}?preview=${token}`;
      window.open(previewUrl, '_blank');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => apiClient.post(`/pages/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['page', id] });
    },
  });

  const trashMutation = useMutation({
    mutationFn: () => apiClient.patch(`/pages/${id}`, { trash: 1 }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pages'] }); navigate('/pages'); },
  });

  const handleEditorSave = useCallback((blocks: Block[]) => {
    setValue('body', JSON.stringify(blocks));
  }, [setValue]);

  const handleSave = handleSubmit((data) => {
    // Clean up empty date strings to avoid 400 errors from class-validator
    const cleanedData = { ...data };
    if (cleanedData.datePublished === '') delete cleanedData.datePublished;
    if (cleanedData.dateUnpublished === '') delete cleanedData.dateUnpublished;
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
    queryClient.invalidateQueries({ queryKey: ['page', id] });
  }, [setValue, queryClient, id]);

  // Auto-save when published
  const currentStatus = watch('status');
  useEffect(() => {
    if (hasLoaded && isEditorReady && Number(currentStatus) === 2 && !isNew && !saveMutation.isPending) {
      if (pageData && pageData.status !== 2) {
        handleSave();
      }
    }
  }, [currentStatus, isNew, hasLoaded, isEditorReady, pageData]);

  if (isLoading && !isNew) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (isNew && !templateChosen && initialBlocks.length === 0) {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pages')}><ArrowLeft className="h-4 w-4" /></Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">{isNew ? 'New Page' : 'Edit Page'}</h1>
            {!isNew && <p className="text-xs text-muted-foreground font-mono">/{watch('slug')}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" size="sm" onClick={() => setShowVersions(true)} className="gap-2">
              <History className="h-3.5 w-3.5" /> Versions
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className={cn('gap-2', showSettings && 'bg-muted')}>
            <Settings2 className="h-3.5 w-3.5" /> Page Settings
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending || !canEdit} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {!isNew && (
            <Button size="sm" variant="outline" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending} className="gap-2">
              {previewMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              Live Preview
            </Button>
          )}
          {!isNew && pageData?.status !== 2 && (
            <Button size="sm" variant="outline" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || !canPublish} className="gap-2 text-green-600 border-green-200 hover:bg-green-50">
              {publishMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              {publishMutation.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          )}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input {...register('title', { required: true })} placeholder="Page title" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...register('slug')} onChange={(e) => { setIsManualSlug(true); setValue('slug', e.target.value); }} className="font-mono text-sm h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Type</Label><Select><option>Default</option><option>Landing Page</option></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select {...register('status', { valueAsNumber: true })}><option value={0}>Draft</option><option value={1}>Review</option><option value={2} disabled={!canPublish}>Published</option></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea {...register('customCss')} placeholder="Page-specific CSS" className="font-mono text-sm min-h-[120px]" />
              </div>
              <div className="space-y-2">
                <Label>Custom JS</Label>
                <Textarea {...register('customJs')} placeholder="Page-specific JavaScript" className="font-mono text-sm min-h-[120px]" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {(hasLoaded || isNew) ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
            <VisualEditor key={hasLoaded ? 'loaded' : 'new'} initialBlocks={initialBlocks} onSave={handleEditorSave} onReady={() => setIsEditorReady(true)} pageId={id} />
          </Suspense>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {!isNew && (
        <VersionHistoryDialog
          pageId={id!}
          open={showVersions}
          onOpenChange={setShowVersions}
          onRestore={handleVersionRestore}
        />
      )}
    </div>
  );
}
