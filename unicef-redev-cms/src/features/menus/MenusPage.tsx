import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
  ExternalLink, Check, X, Pencil, Loader2, CornerDownRight,
} from 'lucide-react';

interface MenuItem {
  id: number;
  parent: number | null;
  groupName: string | null;
  title: string | null;
  href: string | null;
  target: string | null;
  ordering: number | null;
  status: number | null;
}

interface EditingState {
  id: number;
  title: string;
  href: string;
  parentId: number | null;
  target: string;
}

const GROUPS = ['main', 'footer', 'donor'] as const;

export function MenusPage() {
  const queryClient = useQueryClient();
  const [groupFilter, setGroupFilter] = useState<string>('main');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', href: '', parentId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['menus', { groupName: groupFilter }],
    queryFn: async () => (await apiClient.get(`/menus/flat?groupName=${groupFilter}`)).data,
  });

  const items: MenuItem[] = useMemo(() => {
    if (!data?.data) return [];
    return [...(data.data as MenuItem[])].sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
  }, [data]);

  const rootItems = useMemo(() => items.filter((i) => !i.parent), [items]);
  const childrenOf = (parentId: number) => items.filter((i) => i.parent === parentId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['menus'] });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiClient.post('/menus', body),
    onSuccess: () => { invalidate(); setAdding(false); setNewItem({ title: '', href: '', parentId: '' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => apiClient.patch(`/menus/${id}`, body),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/menus/${id}`),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (body: { items: { id: number; ordering: number; parentId: number | null }[] }) =>
      apiClient.patch('/menus/reorder', body),
    onSuccess: invalidate,
  });

  const moveItem = (item: MenuItem, direction: 'up' | 'down') => {
    const siblings = item.parent ? childrenOf(item.parent) : rootItems;
    const idx = siblings.findIndex((s) => s.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const reordered = siblings.map((s, i) => {
      if (i === idx) return { id: siblings[swapIdx].id, ordering: i + 1, parentId: siblings[swapIdx].parent };
      if (i === swapIdx) return { id: item.id, ordering: i + 1, parentId: item.parent };
      return { id: s.id, ordering: i + 1, parentId: s.parent };
    });
    reorderMutation.mutate({ items: reordered });
  };

  const toggleStatus = (item: MenuItem) => {
    updateMutation.mutate({ id: item.id, status: item.status === 1 ? 0 : 1 });
  };

  const startEdit = (item: MenuItem) => {
    setEditing({ id: item.id, title: item.title || '', href: item.href || '', parentId: item.parent, target: item.target || '' });
  };

  const saveEdit = () => {
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id, title: editing.title, href: editing.href,
      parentId: editing.parentId, target: editing.target,
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      title: newItem.title || 'New Item',
      href: newItem.href || null,
      groupName: groupFilter,
      parentId: newItem.parentId ? parseInt(newItem.parentId) : null,
    });
  };

  const renderRow = (item: MenuItem, depth: number = 0) => {
    const isEditing = editing?.id === item.id;
    const children = childrenOf(item.id);

    return (
      <div key={item.id}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b hover:bg-muted/30 transition-colors group">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 shrink-0" />

          {depth > 0 && (
            <div className="flex items-center" style={{ paddingLeft: `${(depth - 1) * 20}px` }}>
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/40 mr-1" />
            </div>
          )}

          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="h-8 text-sm flex-1" placeholder="Title" autoFocus />
              <Input value={editing.href} onChange={(e) => setEditing({ ...editing, href: e.target.value })}
                className="h-8 text-sm flex-1 font-mono" placeholder="/url" />
              <select value={editing.target} onChange={(e) => setEditing({ ...editing, target: e.target.value })}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
              <select value={editing.parentId ?? ''}
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value ? parseInt(e.target.value) : null })}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="">No parent</option>
                {items.filter((i) => i.id !== editing.id).map((i) => (
                  <option key={i.id} value={i.id}>{i.title || `#${i.id}`}</option>
                ))}
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <span className={`text-sm font-medium truncate ${item.status === 1 ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {item.title || 'Untitled'}
                </span>
                {item.href && (
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 truncate max-w-[200px]">
                    <ExternalLink className="h-3 w-3 shrink-0" />{item.href}
                  </span>
                )}
                {item.target === '_blank' && <Badge variant="outline" className="text-[9px] h-4">New Tab</Badge>}
              </div>

              <Badge variant={item.status === 1 ? 'success' : 'secondary'} className="text-[10px] cursor-pointer" onClick={() => toggleStatus(item)}>
                {item.status === 1 ? 'Published' : 'Draft'}
              </Badge>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(item, 'up')} title="Move up">
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveItem(item, 'down')} title="Move down">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete"
                  onClick={() => { if (confirm(`Delete "${item.title}"?`)) deleteMutation.mutate(item.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
        {children.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Navigation Menus</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage site navigation menus and their items.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <Tabs value={groupFilter} onValueChange={setGroupFilter}>
        <TabsList>
          {GROUPS.map((g) => (
            <TabsTrigger key={g} value={g} className="capitalize">{g}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {adding && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Menu item title" className="h-9" autoFocus />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input value={newItem.href} onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                  placeholder="/path or https://..." className="h-9 font-mono text-sm" />
              </div>
              <div className="w-40 space-y-1.5">
                <Label className="text-xs">Parent</Label>
                <select value={newItem.parentId} onChange={(e) => setNewItem({ ...newItem, parentId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">None (root)</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.title || `#${i.id}`}</option>)}
                </select>
              </div>
              <Button size="sm" className="gap-2 h-9" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Add
              </Button>
              <Button variant="ghost" size="sm" className="h-9" onClick={() => setAdding(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {groupFilter} menu — {items.length} items
          </span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No menu items yet</p>
            <p className="text-xs mt-1">Click "Add Item" to create your first menu entry.</p>
          </div>
        ) : (
          <div>{rootItems.map((item) => renderRow(item))}</div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Use the arrow buttons to reorder, click the status badge to toggle publish, and click edit to modify details.
      </p>
    </div>
  );
}
