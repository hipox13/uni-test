import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface Logo {
  id: string;
  name: string | null;
  title: string | null;
  description?: string | null;
  url?: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Indonesian' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese' },
];

function logoUrl(item: Logo) {
  if (item.url) return item.url;
  if (item.name && !item.name.startsWith('http')) return `${API_BASE}/uploads/${item.name}`;
  return '';
}

export function LogosPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<Logo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');

  const { data: logos = [], isLoading } = useQuery({
    queryKey: ['logos'],
    queryFn: async () => (await apiClient.get<Logo[]>('/logos')).data,
  });

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('No file selected');
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('title', selectedFile.name);
      fd.append('language', language);
      return (await apiClient.post('/logos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logos'] });
      setUploadOpen(false);
      setSelectedFile(null);
      setLanguage('en');
      fileRef.current && (fileRef.current.value = '');
    },
    onError: (err: unknown) => alert(`Upload failed: ${(err as any)?.response?.data?.message ?? (err as Error).message}`),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/media/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logos'] });
      setPreview(null);
    },
  });

  const handleUpload = () => {
    if (selectedFile) uploadMut.mutate();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Logo Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage site logos by language.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" /> Upload Logo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : logos.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No logos yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setUploadOpen(true)}>Upload your first logo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => {
            const url = logoUrl(logo);
            const langLabel = LANGUAGES.find((l) => l.value === logo.description)?.label ?? logo.description ?? '—';
            return (
              <Card key={logo.id} className="overflow-hidden group cursor-pointer" onClick={() => setPreview(logo)}>
                <div className="aspect-square bg-muted flex items-center justify-center p-4">
                  {url ? (
                    <img src={url} alt={logo.title ?? ''} className="max-w-full max-h-full object-contain" loading="lazy" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate">{logo.title ?? logo.name ?? 'Untitled'}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{langLabel}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 gap-1 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this logo?')) deleteMut.mutate(logo.id); }}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Logo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>File</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploadMut.isPending}>
                {uploadMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.title ?? preview?.name ?? 'Logo'}</DialogTitle>
          </DialogHeader>
          {preview && logoUrl(preview) && (
            <img src={logoUrl(preview)} alt="" className="w-full max-h-[70vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
