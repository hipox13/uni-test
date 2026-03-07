import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Newspaper, Loader2, Clock } from 'lucide-react';

export function DonationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', searchTerm],
    queryFn: async () => {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      return (await apiClient.get(`/articles${params}`)).data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/articles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  });

  const list = Array.isArray(articles) ? articles : articles?.data ?? [];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Articles</h1>
            <p className="text-sm text-muted-foreground mt-1">{list.length} articles total</p>
          </div>
          <Button onClick={() => navigate('/articles/new')} className="gap-2">
            <Plus className="h-4 w-4" /> Create Article
          </Button>
        </div>

        <Card>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <div className="py-16 text-center">
                <Newspaper className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No articles found</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/articles/new')}>Create your first article</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Modified</th>
                      <th className="px-6 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {list.map((article: any) => (
                      <tr key={article.id} className="group hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/articles/${article.id}`)}>
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{article.title}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">/{article.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge variant="outline" className="text-[10px]">
                            {article.donateType === 2 ? 'Monthly+Oneoff' : 'General'}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5"><StatusBadge status={article.status} /></td>
                        <td className="px-6 py-3.5 hidden lg:table-cell">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />{new Date(article.dateModified).toLocaleDateString()}
                            </span>
                            <span className="text-[11px] text-muted-foreground">by {article.author?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => navigate(`/articles/${article.id}`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"
                              onClick={() => { if (confirm('Delete this article?')) deleteMutation.mutate(article.id); }}>
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
