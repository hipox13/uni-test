import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Tags } from 'lucide-react';

interface Tag {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  group?: string;
  status?: number;
  owner?: number;
}

const GROUP_COLORS: Record<string, string> = {
  general: 'border-l-blue-500',
  media: 'border-l-emerald-500',
  content: 'border-l-amber-500',
  campaign: 'border-l-violet-500',
  other: 'border-l-gray-500',
};

const GROUP_OPTIONS = [
  { value: '', label: '— No group —', owner: undefined },
  { value: 'general', label: 'General', owner: 1 },
  { value: 'media', label: 'Media', owner: 2 },
  { value: 'content', label: 'Content', owner: 3 },
  { value: 'campaign', label: 'Campaign', owner: 4 },
  { value: 'other', label: 'Other', owner: 5 },
];

const tagSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  group: z.string().optional(),
});
type TagForm = z.infer<typeof tagSchema>;

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function TagsPage() {
  const qc = useQueryClient();
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await apiClient.get<Tag[]>('/tags')).data,
  });

  const filtered = useMemo(() => {
    if (!groupFilter) return tags;
    const opt = GROUP_OPTIONS.find((o) => o.value === groupFilter);
    if (!opt?.owner) return tags;
    return tags.filter((t) => t.owner === opt.owner);
  }, [tags, groupFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Tag[]>();
    filtered.forEach((t) => {
      const opt = GROUP_OPTIONS.find((o) => o.owner === t.owner);
      const g = opt?.label ?? (t.owner != null ? `Group ${t.owner}` : 'Uncategorized');
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    });
    return map;
  }, [filtered]);

  const createMut = useMutation({
    mutationFn: (d: TagForm) => {
      const opt = GROUP_OPTIONS.find((o) => o.value === d.group);
      return apiClient.post('/tags', { title: d.title, slug: d.slug || slugify(d.title), owner: opt?.owner });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setCreateOpen(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: TagForm & { id: number }) => {
      const opt = GROUP_OPTIONS.find((o) => o.value === d.group);
      return apiClient.patch(`/tags/${id}`, { title: d.title, slug: d.slug, owner: opt?.owner });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  });

  const handleDelete = (tag: Tag) => {
    if (confirm(`Delete tag "${tag.title}"?`)) deleteMut.mutate(tag.id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tags & Taxonomy</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage tags for content and media.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add Tag
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">All groups</option>
          {GROUP_OPTIONS.filter((o) => o.value).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tags.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tags className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tags yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>Add your first tag</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((tag) => {
                  const g = (GROUP_OPTIONS.find((o) => o.owner === tag.owner)?.value ?? (tag.group ?? '').toLowerCase()) || 'other';
                  const borderClass = GROUP_COLORS[g] ?? GROUP_COLORS.other;
                  return (
                    <Card key={tag.id} className={`border-l-4 ${borderClass} overflow-hidden group`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{tag.title}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">{tag.slug || slugify(tag.title)}</p>
                            {tag.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tag.description}</p>}
                            {(tag.group || tag.owner != null) && (
                              <Badge variant="outline" className="mt-2 text-[10px]">{GROUP_OPTIONS.find((o) => o.owner === tag.owner)?.label ?? tag.group ?? `Group ${tag.owner}`}</Badge>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(tag)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(tag)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TagFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tag={null}
        onSubmit={(d) => createMut.mutate(d)}
        isPending={createMut.isPending}
      />

      <TagFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        tag={editing}
        onSubmit={(d) => editing && updateMut.mutate({ ...d, id: editing.id })}
        isPending={updateMut.isPending}
      />
    </div>
  );
}

function TagFormDialog({
  open,
  onOpenChange,
  tag,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tag: Tag | null;
  onSubmit: (d: TagForm) => void;
  isPending: boolean;
}) {
  const isEdit = !!tag;
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TagForm>({
    resolver: zodResolver(tagSchema),
    defaultValues: { title: '', slug: '', description: '', group: '' },
  });
  const title = watch('title');
  useEffect(() => {
    if (open && title && !isEdit) setValue('slug', slugify(title));
  }, [open, title, isEdit, setValue]);

  useEffect(() => {
    if (open) {
      if (tag) {
        const groupVal = GROUP_OPTIONS.find((o) => o.owner === tag.owner)?.value ?? tag.group ?? '';
        reset({ title: tag.title, slug: tag.slug ?? '', description: tag.description ?? '', group: groupVal });
      } else reset({ title: '', slug: '', description: '', group: '' });
    }
  }, [open, tag, reset]);

  const onOpen = (v: boolean) => onOpenChange(v);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update tag details.' : 'Add a new tag.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => onSubmit(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-title">Title</Label>
            <Input id="tag-title" placeholder="Tag title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag-slug">Slug (auto-generated)</Label>
            <Input id="tag-slug" placeholder="url-slug" className="font-mono text-sm" {...register('slug')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag-desc">Description</Label>
            <Input id="tag-desc" placeholder="Optional" {...register('description')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag-group">Group</Label>
            <Select id="tag-group" {...register('group')}>
              {GROUP_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
