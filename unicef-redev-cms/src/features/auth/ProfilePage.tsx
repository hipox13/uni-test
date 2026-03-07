import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';
import { Loader2, Pencil, X, Check } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileMsg(null);
    try {
      const res = await apiClient.patch('/auth/profile', data);
      updateUser(res.data);
      setEditing(false);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: typeof message === 'string' ? message : message[0] });
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordMsg(null);
    try {
      await apiClient.patch('/auth/profile', {
        currentPassword: data.currentPassword,
        password: data.newPassword,
      });
      passwordForm.reset();
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to change password.';
      setPasswordMsg({ type: 'error', text: typeof message === 'string' ? message : message[0] });
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    profileForm.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
    });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name ?? 'User'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              {user?.role && (
                <Badge variant="secondary" className="mt-1">
                  {user.role.title}
                </Badge>
              )}
            </div>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {profileMsg && (
            <div
              className={`rounded-lg px-4 py-3 text-sm mb-4 ${
                profileMsg.type === 'success'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {editing ? (
                  <>
                    <Input id="name" {...profileForm.register('name')} />
                    {profileForm.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">{user?.name ?? '—'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {editing ? (
                  <>
                    <Input id="email" type="email" {...profileForm.register('email')} />
                    {profileForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">{user?.email ?? '—'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {editing ? (
                  <Input id="phone" {...profileForm.register('phone')} placeholder="Optional" />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">{user?.phone || '—'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {editing ? (
                  <Input id="address" {...profileForm.register('address')} placeholder="Optional" />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted/50 rounded-md">{user?.address || '—'}</p>
                )}
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" size="sm" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <Check className="h-4 w-4" />
                  Save changes
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {passwordMsg && (
            <div
              className={`rounded-lg px-4 py-3 text-sm mb-4 ${
                passwordMsg.type === 'success'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...passwordForm.register('currentPassword')}
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" size="sm" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
