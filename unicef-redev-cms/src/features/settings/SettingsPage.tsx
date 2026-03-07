import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Globe, Image, Server, Save, Loader2, CheckCircle2,
  HardDrive, Database, Cpu, RefreshCw,
} from 'lucide-react';

interface SettingField { scope: string; key: string; value: string; label: string; type?: 'text' | 'textarea' | 'number'; }

const GENERAL_FIELDS: SettingField[] = [
  { scope: 'general', key: 'site_name', value: '', label: 'Site Name', type: 'text' },
  { scope: 'general', key: 'site_description', value: '', label: 'Site Description', type: 'textarea' },
  { scope: 'general', key: 'site_keywords', value: '', label: 'Default Keywords', type: 'text' },
  { scope: 'general', key: 'site_url', value: '', label: 'Site URL', type: 'text' },
  { scope: 'general', key: 'admin_email', value: '', label: 'Admin Email', type: 'text' },
  { scope: 'general', key: 'google_analytics_id', value: '', label: 'Google Analytics ID', type: 'text' },
];

const MEDIA_FIELDS: SettingField[] = [
  { scope: 'media', key: 'max_upload_size', value: '10', label: 'Max Upload Size (MB)', type: 'number' },
  { scope: 'media', key: 'thumbnail_width', value: '150', label: 'Thumbnail Width (px)', type: 'number' },
  { scope: 'media', key: 'thumbnail_height', value: '150', label: 'Thumbnail Height (px)', type: 'number' },
  { scope: 'media', key: 'medium_width', value: '768', label: 'Medium Width (px)', type: 'number' },
  { scope: 'media', key: 'medium_height', value: '512', label: 'Medium Height (px)', type: 'number' },
  { scope: 'media', key: 'webp_enabled', value: 'true', label: 'WebP Conversion', type: 'text' },
  { scope: 'media', key: 'allowed_extensions', value: 'jpg,jpeg,png,gif,webp,pdf,mp4,mp3', label: 'Allowed Extensions', type: 'text' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await apiClient.get('/settings')).data,
  });

  const { data: systemInfo, isLoading: loadingSystem } = useQuery({
    queryKey: ['settings', 'system-info'],
    queryFn: async () => (await apiClient.get('/settings/system-info')).data,
  });

  const saveMutation = useMutation({
    mutationFn: (items: { scope: string; key: string; value: string }[]) =>
      apiClient.patch('/settings', { settings: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const getVal = (scope: string, key: string) => {
    const formKey = `${scope}.${key}`;
    if (formState[formKey] !== undefined) return formState[formKey];
    if (Array.isArray(settings)) {
      const found = settings.find((s: any) => s.scope === scope && s.key === key);
      if (found) return found.value ?? '';
    }
    return '';
  };

  const setVal = (scope: string, key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [`${scope}.${key}`]: value }));
  };

  const saveSection = (fields: SettingField[]) => {
    const items = fields.map((f) => ({ scope: f.scope, key: f.key, value: getVal(f.scope, f.key) || f.value }));
    saveMutation.mutate(items);
  };

  const renderField = (field: SettingField) => {
    const val = getVal(field.scope, field.key);
    return (
      <div key={field.key} className="space-y-2">
        <Label className="text-sm">{field.label}</Label>
        {field.type === 'textarea' ? (
          <Textarea value={val} onChange={(e) => setVal(field.scope, field.key, e.target.value)} className="h-20" />
        ) : (
          <Input type={field.type === 'number' ? 'number' : 'text'} value={val} onChange={(e) => setVal(field.scope, field.key, e.target.value)} />
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your application configuration.</p>
          </div>
          {saved && (
            <Badge variant="success" className="gap-1.5 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </Badge>
          )}
        </div>

        <Tabs defaultValue="general">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="general" className="gap-2"><Globe className="h-3.5 w-3.5" /> General</TabsTrigger>
            <TabsTrigger value="media" className="gap-2"><Image className="h-3.5 w-3.5" /> Media</TabsTrigger>
            <TabsTrigger value="system" className="gap-2"><Server className="h-3.5 w-3.5" /> System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">General Settings</CardTitle>
                <CardDescription>Site name, description, and basic configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {GENERAL_FIELDS.map(renderField)}
                <Separator />
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2" onClick={() => saveSection(GENERAL_FIELDS)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save General
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Media Settings</CardTitle>
                <CardDescription>Upload limits, image sizes, and format options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {MEDIA_FIELDS.filter((f) => f.type === 'number').map(renderField)}
                </div>
                {MEDIA_FIELDS.filter((f) => f.type !== 'number').map(renderField)}
                <Separator />
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2" onClick={() => saveSection(MEDIA_FIELDS)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">System Information</CardTitle>
                  <CardDescription>Server details, versions, and health status.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['settings', 'system-info'] })}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSystem ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : systemInfo ? (
                  <div className="grid gap-4">
                    <InfoRow icon={Cpu} label="Node.js Version" value={systemInfo.nodeVersion || 'N/A'} />
                    <InfoRow icon={Database} label="Database" value={systemInfo.database || 'PostgreSQL'} />
                    <InfoRow icon={HardDrive} label="Platform" value={systemInfo.platform || 'N/A'} />
                    <InfoRow icon={Server} label="Uptime" value={systemInfo.uptime ? formatUptime(systemInfo.uptime) : 'N/A'} />
                    <InfoRow icon={HardDrive} label="Memory Usage" value={systemInfo.memoryUsage ? `${Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(systemInfo.memoryUsage.heapTotal / 1024 / 1024)}MB` : 'N/A'} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">Unable to load system info. Make sure the API is running.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-2.5 px-4 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium font-mono text-foreground">{value}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
