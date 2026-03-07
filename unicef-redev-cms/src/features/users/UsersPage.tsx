import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Loader2, Shield } from 'lucide-react';

interface Role { id: number; name: string; title?: string }
interface User {
  id: number; name: string; email: string; status: number;
  phoneNumber?: string; dateCreated: string; role?: Role; roleId?: number;
}

const LIMIT = 20;

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().optional(),
  roleId: z.string().optional(),
  status: z.string().optional(),
});
type UserForm = z.infer<typeof createUserSchema>;

function useDebounce(value: string, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

// ── User Form Dialog ──────────────────────────────────────────────
function UserFormDialog({ open, onOpenChange, user, roles }: {
  open: boolean; onOpenChange: (v: boolean) => void; user: User | null; roles: Role[];
}) {
  const qc = useQueryClient();
  const isEdit = !!user;
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', roleId: '', status: '1' },
  });

  useEffect(() => {
    if (open) reset(user
      ? { name: user.name, email: user.email, password: '', roleId: String(user.role?.id ?? user.roleId ?? ''), status: String(user.status) }
      : { name: '', email: '', password: '', roleId: '', status: '1' });
  }, [open, user, reset]);

  const mut = useMutation({
    mutationFn: (d: UserForm) => {
      const body: Record<string, unknown> = { name: d.name, email: d.email, status: Number(d.status) };
      if (d.roleId) body.roleId = Number(d.roleId);
      if (d.password) body.password = d.password;
      return isEdit ? apiClient.patch(`/users/${user!.id}`, body) : apiClient.post('/users', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onOpenChange(false); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update user details.' : 'Add a new user to the system.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mut.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uf-name">Name</Label>
            <Input id="uf-name" placeholder="Full name" {...register('name')} />
            <FieldError msg={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-email">Email</Label>
            <Input id="uf-email" type="email" placeholder="user@example.com" {...register('email')} />
            <FieldError msg={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-pw">Password{isEdit && <span className="text-muted-foreground font-normal"> (leave blank to keep)</span>}</Label>
            <Input id="uf-pw" type="password" placeholder={isEdit ? '••••••' : 'Min 6 characters'} {...register('password')} />
            <FieldError msg={errors.password?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="uf-role">Role</Label>
              <Select id="uf-role" {...register('roleId')}>
                <option value="">— None —</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.title ?? r.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf-status">Status</Label>
              <Select id="uf-status" {...register('status')}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
          {mut.isError && <p className="text-xs text-destructive text-center">{(mut.error as any)?.response?.data?.message ?? 'Something went wrong'}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Dialog ─────────────────────────────────────────────────
function DeleteDialog({ open, onOpenChange, user }: {
  open: boolean; onOpenChange: (v: boolean) => void; user: User | null;
}) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => apiClient.delete(`/users/${user!.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onOpenChange(false); },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-foreground">{user?.name}</span>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function UsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const q = useDebounce(search);

  useEffect(() => setPage(0), [q, statusFilter, roleFilter]);

  const { data: rolesRes } = useQuery({
    queryKey: ['roles'], queryFn: () => apiClient.get('/roles').then((r) => r.data), staleTime: 5 * 60_000,
  });
  // Robustly handle [ ... ] or { data: [ ... ] }
  const roles: Role[] = rolesRes?.data ?? (Array.isArray(rolesRes) ? rolesRes : []);

  const { data, isLoading } = useQuery({
    queryKey: ['users', q, statusFilter, roleFilter, page],
    queryFn: () => apiClient.get('/users', {
      params: { ...(q && { search: q }), ...(statusFilter !== '' && { status: statusFilter }), ...(roleFilter && { roleId: roleFilter }), limit: LIMIT, offset: page * LIMIT },
    }).then((r) => r.data),
  });

  const users: User[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const from = total ? page * LIMIT + 1 : 0;
  const to = Math.min((page + 1) * LIMIT, total);
  const hasNext = to < total;
  const hasPrev = page > 0;

  const openCreate = useCallback(() => { setSelected(null); setFormOpen(true); }, []);
  const openEdit = useCallback((u: User) => { setSelected(u); setFormOpen(true); }, []);
  const openDelete = useCallback((u: User) => { setSelected(u); setDeleteOpen(true); }, []);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          <Button onClick={openCreate}><UserPlus /> Add User</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
          <Select className="w-full sm:w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.title ?? r.name}</option>)}
          </Select>
        </div>

        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['User', 'Email', 'Role', 'Status', 'Registered'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b last:border-0">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-3/4" /></td>
                    ))}
                  </tr>
                )) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />No users found.
                    </td>
                  </tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role ? <Badge variant="info">{u.role.title ?? u.role.name}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === 1 ? 'success' : 'destructive'}>{u.status === 1 ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.dateCreated)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => openDelete(u)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>Showing {from}–{to} of {total}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={selected} roles={roles} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={selected} />
    </div>
  );
}
