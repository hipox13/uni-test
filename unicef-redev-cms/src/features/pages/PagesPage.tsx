import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, FileText, Copy, Loader2, Clock } from 'lucide-react';

interface Page {
  id: string; title: string | null; slug: string | null; status: number;
  dateModified: string | null; author: { id: number; name: string | null } | null;
}

export function PagesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['pages', { search, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      return (await apiClient.get(`/pages?${params}`)).data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/pages/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages'] }),
  });

  const pages: Page[] = data?.data ?? [];
  const total = data?.meta?.total ?? pages.length;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pages</h1>
            <p className="text-sm text-muted-foreground mt-1">{total} pages total</p>
          </div>
          <Button onClick={() => navigate('/pages/new')} className="gap-2">
            <Plus className="h-4 w-4" /> New Page
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
              <option value="">All Status</option>
              <option value="0">Draft</option>
              <option value="1">Review</option>
              <option value="2">Published</option>
            </Select>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : pages.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No pages found</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/pages/new')}>Create your first page</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Modified</th>
                      <th className="px-6 py-3 w-28" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pages.map((page) => (
                      <tr key={page.id} className="group hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/pages/${page.id}`)}>
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{page.title || 'Untitled'}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">/{page.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{page.author?.name || '-'}</span>
                        </td>
                        <td className="px-6 py-3.5"><StatusBadge status={page.status} /></td>
                        <td className="px-6 py-3.5 hidden lg:table-cell">
                          {page.dateModified && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />{new Date(page.dateModified).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => navigate(`/pages/${page.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicate" onClick={() => duplicateMutation.mutate(page.id)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"
                              onClick={() => { if (confirm('Delete this page?')) deleteMutation.mutate(page.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const map = {
    0: { label: 'Draft', variant: 'secondary' as const },
    1: { label: 'Review', variant: 'warning' as const },
    2: { label: 'Published', variant: 'success' as const },
  };
  const { label, variant } = map[status as keyof typeof map] ?? map[0];
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
}
