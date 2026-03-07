import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Eye, X, Activity } from 'lucide-react';

interface LogEntry {
  id: number; dataId: string; userId: number; dataBefore: any; dataAfter: any;
  dateCreated: string; feature: string; action: string; ipAddress: string;
  user: { name: string; email: string };
}

const LIMIT = 20;

const ACTION_BADGE: Record<string, { variant: 'success' | 'info' | 'destructive'; label: string }> = {
  create: { variant: 'success', label: 'Create' },
  update: { variant: 'info', label: 'Update' },
  delete: { variant: 'destructive', label: 'Delete' },
};

const FEATURE_COLORS: Record<string, string> = {
  pages: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  users: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  roles: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  menus: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  media: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  donations: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  settings: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400',
};

function useDebounce(value: string, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function FeatureBadge({ feature }: { feature: string }) {
  const color = FEATURE_COLORS[feature.toLowerCase()] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
  return (
    <span className={`inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {feature}
    </span>
  );
}

function DetailDialog({ entry, onClose }: { entry: LogEntry | null; onClose: () => void }) {
  if (!entry) return null;
  const hasBoth = entry.dataBefore && entry.dataAfter;
  return (
    <Dialog open={!!entry} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Entry Details</DialogTitle>
          <DialogDescription>
            {entry.feature} · {entry.action} · {fmtDate(entry.dateCreated)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">User:</span> {entry.user?.name}</div>
          <div><span className="text-muted-foreground">Email:</span> {entry.user?.email}</div>
          <div><span className="text-muted-foreground">Data ID:</span> {entry.dataId}</div>
          <div><span className="text-muted-foreground">IP:</span> {entry.ipAddress}</div>
        </div>
        <div className={hasBoth ? 'grid grid-cols-2 gap-4' : ''}>
          {entry.dataBefore && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Before</p>
              <pre className="rounded-md bg-red-50 dark:bg-red-950/30 border p-3 text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(entry.dataBefore, null, 2)}
              </pre>
            </div>
          )}
          {entry.dataAfter && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">After</p>
              <pre className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border p-3 text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(entry.dataAfter, null, 2)}
              </pre>
            </div>
          )}
          {!entry.dataBefore && !entry.dataAfter && (
            <p className="text-sm text-muted-foreground italic">No data changes recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LogActivityPage() {
  const [feature, setFeature] = useState('');
  const [action, setAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const debouncedFeature = useDebounce(feature);

  useEffect(() => setPage(0), [debouncedFeature, action, dateFrom, dateTo]);

  const { data: countRes } = useQuery({
    queryKey: ['log-activity-count'],
    queryFn: () => apiClient.get('/log-activity/count').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['log-activity', debouncedFeature, action, dateFrom, dateTo, page],
    queryFn: () => apiClient.get('/log-activity', {
      params: {
        ...(debouncedFeature && { feature: debouncedFeature }),
        ...(action && { action }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        limit: LIMIT,
        offset: page * LIMIT,
      },
    }).then((r) => r.data),
  });

  const logs: LogEntry[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalCount: number = countRes?.count ?? 0;
  const from = total ? page * LIMIT + 1 : 0;
  const to = Math.min((page + 1) * LIMIT, total);
  const hasFilters = feature || action || dateFrom || dateTo;

  const clearFilters = () => { setFeature(''); setAction(''); setDateFrom(''); setDateTo(''); };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Log Activity</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-1">{totalCount.toLocaleString()} total</Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Filter by feature…" className="flex-1" value={feature} onChange={(e) => setFeature(e.target.value)} />
          <Select className="w-full sm:w-40" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </Select>
          <Input type="date" className="w-full sm:w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From date" />
          <Input type="date" className="w-full sm:w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To date" />
          {hasFilters && (
            <Button variant="ghost" size="sm" className="shrink-0" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Date', 'User', 'Feature', 'Action', 'Data ID', 'IP Address', ''].map((h) => (
                    <th key={h || 'actions'} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b last:border-0">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-3/4" /></td>
                    ))}
                  </tr>
                )) : isError ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-destructive">
                      Failed to load activity logs. Please try again.
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No activity logs found.
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const ab = ACTION_BADGE[log.action] ?? { variant: 'secondary' as const, label: log.action };
                  return (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(log.dateCreated)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{log.user?.name}</div>
                        <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                      </td>
                      <td className="px-4 py-3"><FeatureBadge feature={log.feature} /></td>
                      <td className="px-4 py-3"><Badge variant={ab.variant}>{ab.label}</Badge></td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.dataId}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(log)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>Showing {from}–{to} of {total}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <Button variant="outline" size="sm" disabled={to >= total} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
