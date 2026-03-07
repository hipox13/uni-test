import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Shield, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

type Role = { id: number; title: string; name: string; groupName: string; _count?: { users: number }; permissions?: Permission[] };
type Permission = { id: number; module: string; action: string };
type RoleForm = { title: string; name: string; groupName: string };
type PermForm = { module: string; action: string };

const fetchRoles = () => apiClient.get('/roles').then(r => r.data?.data ?? r.data ?? []);
const fetchPermissions = () => apiClient.get('/permissions').then(r => r.data?.data ?? r.data ?? []);

export function RolesPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage user roles and access permissions</p>
        </div>
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="roles"><RolesTab /></TabsContent>
          <TabsContent value="permissions"><PermissionsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RolesTab() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; role?: Role }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const { data: roles = [], isLoading } = useQuery<Role[]>({ queryKey: ['roles'], queryFn: fetchRoles });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/roles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setDeleteTarget(null); },
  });

  if (isLoading) return <LoadingState />;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between p-6 pb-4">
          <p className="text-sm text-muted-foreground">{roles.length} role(s)</p>
          <Button size="sm" onClick={() => setDialog({ open: true })}><Plus className="h-4 w-4 mr-1" />Add Role</Button>
        </div>
        <CardContent>
          {roles.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No roles yet. Create your first role.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Title</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Group</th>
                    <th className="text-left font-medium text-muted-foreground px-4 py-3">Users</th>
                    <th className="text-right font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(role => (
                    <tr key={role.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{role.title}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{role.name}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{role.groupName || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{role._count?.users ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => setDialog({ open: true, role })} title="Manage Permissions">
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDialog({ open: true, role })} title="Edit Role">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(role)} title="Delete Role">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleDialog open={dialog.open} role={dialog.role} onClose={() => setDialog({ open: false })} />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMut.isPending} onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}>
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoleDialog({ open, role, onClose }: { open: boolean; role?: Role; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!role;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleForm>({
    values: role ? { title: role.title, name: role.name, groupName: role.groupName } : { title: '', name: '', groupName: '' },
  });

  const { data: allPermissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
    enabled: open,
  });

  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);

  useEffect(() => {
    if (role?.permissions && open) {
      setSelectedPerms(role.permissions.map(p => p.id));
    } else if (!isEdit && open) {
      setSelectedPerms([]);
    }
  }, [role, open, isEdit]);

  const mutation = useMutation({
    mutationFn: async (data: RoleForm) => {
      const res = isEdit ? await apiClient.patch(`/roles/${role!.id}`, data) : await apiClient.post('/roles', data);
      const roleId = isEdit ? role!.id : res.data.id;

      // If edit or create succeeded, assign permissions
      if (selectedPerms.length > 0) {
        await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds: selectedPerms });
      }
      return res.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); reset(); onClose(); },
  });

  const togglePerm = (id: number) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // Group permissions for cleaner display
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Create'} Role</DialogTitle>
          <DialogDescription>{isEdit ? 'Update role details and permissions.' : 'Add a new user role and assign permissions.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-6 overflow-y-auto pr-2 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Content Editor" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (slug)</Label>
              <Input id="name" placeholder="e.g. content-editor" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input id="groupName" placeholder="e.g. CMS" {...register('groupName')} />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Permissions</Label>
            <div className="border rounded-lg divide-y bg-muted/20">
              {Object.entries(grouped).map(([mod, perms]) => (
                <div key={mod} className="p-3 space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{mod}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePerm(p.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                          selectedPerms.includes(p.id)
                            ? "bg-primary border-primary text-primary-foreground shadow-sm"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        {p.action}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {allPermissions.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No permissions found. Create them in the Permissions tab.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2 mt-2 -mx-2 px-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsTab() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const { data: permissions = [], isLoading } = useQuery<Permission[]>({ queryKey: ['permissions'], queryFn: fetchPermissions });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/permissions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
  });

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.module] ??= []).push(p);
    return acc;
  }, {});

  if (isLoading) return <LoadingState />;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between p-6 pb-4">
          <p className="text-sm text-muted-foreground">{permissions.length} permission(s) across {Object.keys(grouped).length} module(s)</p>
          <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Permission</Button>
        </div>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No permissions defined yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([mod, perms]) => (
                <div key={mod} className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold capitalize mb-3">{mod}</h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(p => (
                      <Badge key={p.id} variant="outline" className="gap-1.5 pr-1.5 group">
                        {p.action}
                        <button
                          onClick={() => deleteMut.mutate(p.id)}
                          className="ml-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PermissionDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function PermissionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PermForm>({ defaultValues: { module: '', action: '' } });

  const mutation = useMutation({
    mutationFn: (data: PermForm) => apiClient.post('/permissions', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permissions'] }); reset(); onClose(); },
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Permission</DialogTitle>
          <DialogDescription>Create a new module + action permission pair.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module">Module</Label>
            <Input id="module" placeholder="e.g. pages, articles, media" {...register('module', { required: 'Module is required' })} />
            {errors.module && <p className="text-xs text-destructive">{errors.module.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Input id="action" placeholder="e.g. view, create, edit, delete" {...register('action', { required: 'Action is required' })} />
            {errors.action && <p className="text-xs text-destructive">{errors.action.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Permission'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </CardContent>
    </Card>
  );
}
