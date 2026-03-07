import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, DollarSign, CreditCard, Clock as ClockIcon,
  ArrowRight, Plus, FileText, Newspaper, Image, BarChart3, Loader2,
} from 'lucide-react';

const STATUS_LABELS: Record<number, string> = {
  0: 'Init',
  1: 'Error',
  2: 'Pending',
  3: 'Failed',
  4: 'Success',
  5: 'Expired',
  6: 'Active',
  7: 'Waiting',
  8: 'Stopped',
};

const DONATE_TYPE_LABELS: Record<number, string> = {
  1: 'Monthly',
  2: 'One-off',
};

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: txnStats } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => (await apiClient.get('/transactions/stats')).data,
  });

  const { data: recentTxns } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/transactions', { params: { limit: 5, offset: 0 } });
      return res.data?.data ?? res.data ?? [];
    },
  });

  const pendingCount = Array.isArray(txnStats?.byStatus)
    ? txnStats.byStatus.find((s: any) => s.status === 2)?._count ?? txnStats.byStatus.find((s: any) => s.status === 2)?.count ?? 0
    : 0;

  const stats = [
    {
      label: 'Total Donations',
      value: formatCurrency(txnStats?.totalAmount ?? 0),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-100/80',
    },
    {
      label: 'Total Transactions',
      value: formatNumber(txnStats?.totalTransactions ?? 0),
      icon: CreditCard,
      color: 'text-violet-600 bg-violet-100/80',
    },
    {
      label: 'Total Donors',
      value: formatNumber(txnStats?.totalDonors ?? 0),
      icon: Users,
      color: 'text-blue-600 bg-blue-100/80',
    },
    {
      label: 'Pending Transactions',
      value: formatNumber(pendingCount),
      icon: ClockIcon,
      color: 'text-amber-600 bg-amber-100/80',
    },
  ];

  const transactions: any[] = Array.isArray(recentTxns) ? recentTxns : [];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Donation overview and content management.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate('/pages/new')} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> New Page
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/articles/new')} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> New Article
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{s.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => navigate('/transactions')}>
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading transactions...
                </div>
              ) : (
                <div className="divide-y">
                  {transactions.map((txn: any) => {
                    const donorName = txn.user?.name || [txn.firstName, txn.lastName].filter(Boolean).join(' ') || txn.refId || `TXN-${txn.id}`;
                    const txnDate = txn.dateCreated || txn.createdAt;
                    const statusLabel = STATUS_LABELS[txn.status] ?? `Status ${txn.status}`;
                    const statusVariant = (txn.status === 4 || txn.status === 6) ? 'success' : txn.status === 2 ? 'warning' : txn.status === 3 || txn.status === 5 ? 'destructive' : 'outline';
                    const campaignLabel = txn.donateType != null ? DONATE_TYPE_LABELS[txn.donateType] : null;

                    return (
                      <div key={txn.id ?? txn.refId} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{donorName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">{txn.refId || txn.id}</span>
                            {campaignLabel && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <Badge variant="outline" className="text-[9px] h-4">{campaignLabel}</Badge>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(txn.amount ?? 0)}</p>
                          {txnDate && (
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <ClockIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">{timeAgo(txnDate)}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant={statusVariant as any} className="text-[10px] shrink-0">
                          {statusLabel}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { icon: FileText, label: 'Create Page', path: '/pages/new', color: 'text-blue-600' },
                { icon: Newspaper, label: 'New Article', path: '/articles/new', color: 'text-amber-600' },
                { icon: Image, label: 'Upload Media', path: '/media', color: 'text-emerald-600' },
                { icon: BarChart3, label: 'View Reports', path: '/reports', color: 'text-violet-600' },
              ].map((a) => (
                <Button key={a.path} variant="ghost" size="sm" className="w-full justify-start gap-3 h-9 text-xs"
                  onClick={() => navigate(a.path)}>
                  <a.icon className={`h-3.5 w-3.5 ${a.color}`} />{a.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(0)}K`;
  return `Rp${n}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('id-ID');
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
