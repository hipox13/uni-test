import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Upload, Search, Copy, Trash2, Image, FileText, Film, Loader2,
  Download, X, CloudUpload, Music, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Media {
  id: string; name: string | null; title: string | null; url: string;
  thumbnailUrl?: string; mediaType: string | null; fileSize: number | null;
  extension: string | null; datePosted: string | null; labels?: string | null;
  author: { id: number; name: string | null } | null;
}

export function MediaPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Media | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['media', { search, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      return (await apiClient.get(`/media?${params}`)).data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return (await apiClient.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media'] }); if (fileInputRef.current) fileInputRef.current.value = ''; },
    onError: (err: any) => alert(`Upload failed: ${err.response?.data?.message || err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/media/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['media'] }); setSelected(null); },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadMutation.mutate(file);
  }, [uploadMutation]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const mediaList: Media[] = data?.data ?? [];
  const total = data?.meta?.total ?? mediaList.length;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Media Library</h1>
            <p className="text-sm text-muted-foreground mt-1">{total} files</p>
          </div>
          <div>
            <input ref={fileInputRef} type="file" onChange={(e) => e.target.files?.[0] && uploadMutation.mutate(e.target.files[0])} className="hidden" accept="image/*,application/pdf,video/*,audio/*" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="gap-2">
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            'rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
            isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50',
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <CloudUpload className={cn('h-8 w-8 mx-auto mb-3 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground/40')} />
          <p className="text-sm text-muted-foreground">
            {isDragging ? 'Drop file to upload' : 'Drag & drop files here, or click Upload'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Images, PDFs, videos, audio supported</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="application/pdf">PDFs</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </Select>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : mediaList.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Image className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No media found</p>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload your first file</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {mediaList.map((m) => (
                  <MediaCard key={m.id} media={m} isSelected={selected?.id === m.id}
                    onClick={() => setSelected(selected?.id === m.id ? null : m)} />
                ))}
              </div>
            )}
          </div>

          {selected && (
            <aside className="w-72 shrink-0 hidden lg:block">
              <Card className="sticky top-6">
                <div className="relative">
                  {selected.mediaType?.startsWith('image/') ? (
                    <img src={selected.url} alt="" className="w-full aspect-video object-cover rounded-t-lg" />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                      <MediaIcon type={selected.mediaType} className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
                    onClick={() => setSelected(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate">{selected.title || selected.name || 'Untitled'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px]">{selected.extension?.toUpperCase()}</Badge>
                      <span className="text-[11px] text-muted-foreground">{formatSize(selected.fileSize)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2.5">
                    <DetailRow label="Type" value={selected.mediaType || '-'} />
                    <DetailRow label="Uploaded" value={selected.datePosted ? new Date(selected.datePosted).toLocaleDateString() : '-'} />
                    <DetailRow label="Author" value={selected.author?.name || '-'} />
                    {selected.labels && <DetailRow label="Tags" value={selected.labels} />}
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs">URL</Label>
                    <div className="flex gap-1.5">
                      <Input value={selected.url} readOnly className="text-xs font-mono h-8" />
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyUrl(selected.url)}>
                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
                      <a href={selected.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" /> Open
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
                      <a href={selected.url} download>
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </Button>
                  </div>

                  <Button variant="destructive" size="sm" className="w-full gap-1.5 text-xs"
                    onClick={() => { if (confirm('Delete this file?')) deleteMutation.mutate(selected.id); }}>
                    <Trash2 className="h-3 w-3" /> Delete File
                  </Button>
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaCard({ media, isSelected, onClick }: { media: Media; isSelected: boolean; onClick: () => void }) {
  return (
    <Card className={cn('overflow-hidden cursor-pointer transition-all group', isSelected && 'ring-2 ring-primary')} onClick={onClick}>
      {media.mediaType?.startsWith('image/') ? (
        <div className="aspect-square bg-muted overflow-hidden">
          <img src={media.thumbnailUrl || media.url} alt={media.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      ) : (
        <div className="aspect-square bg-muted flex items-center justify-center">
          <MediaIcon type={media.mediaType} className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}
      <CardContent className="p-2.5">
        <p className="text-xs font-medium text-foreground truncate">{media.title || media.name || 'Untitled'}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className="text-[9px] h-4">{media.extension?.toUpperCase() || '?'}</Badge>
          <span className="text-[10px] text-muted-foreground">{formatSize(media.fileSize)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaIcon({ type, className }: { type: string | null; className?: string }) {
  if (type?.startsWith('image/')) return <Image className={className} />;
  if (type?.startsWith('video/')) return <Film className={className} />;
  if (type?.startsWith('audio/')) return <Music className={className} />;
  return <FileText className={className} />;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-foreground text-right truncate">{value}</span>
    </div>
  );
}

function formatSize(b: number | null) {
  if (!b) return '-';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
