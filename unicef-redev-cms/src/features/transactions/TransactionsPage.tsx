import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import {
  ArrowLeftRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  Wallet,
  CheckCircle2,
  Clock,
  Eye,
  StopCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LIMIT = 20;
const STATUS_MAP: Record<number, string> = {
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
const DONATE_TYPE_MAP: Record<number, string> = { 1: 'Monthly', 2: 'One-off' };

interface TransactionPaid {
  id: number | string;
  status: number;
  paidAt?: string;
  paidAmount?: number | string;
  amount?: number | string;
  paymentGateway?: string;
  failedMessage?: string;
  cycleNumber?: number;
}

interface Transaction {
  id: string | number;
  refId: string;
  amount: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: number;
  donateType?: number;
  campaignType?: number;
  paymentGateway?: string;
  dateCreated: string;
  lastUpdated?: string;
  user?: { name: string; email: string };
  article?: { title: string };
  paids?: TransactionPaid[];
}

function useDebounce(value: string, delay = 400) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

const fmtIdr = (v: number | string | bigint | null | undefined) => {
  if (v == null) return '—';
  const n = typeof v === 'bigint' ? Number(v) : typeof v === 'string' ? Number(v) : v;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
};
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function StatCard({ label, value, icon: Icon, iconCls }: { label: string; value: string | number; icon: React.ElementType; iconCls: string }) {
  return (
    <Card><CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconCls}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>
      </div>
    </CardContent></Card>
  );
}
function StatusBadge({ status }: { status: number }) {
  const label = STATUS_MAP[status] ?? 'Unknown';
  const variant =
    status === 4 || status === 6 ? 'success'
      : status === 2 ? 'warning'
        : status === 3 || status === 5 ? 'destructive'
          : 'secondary';
  return <Badge variant={variant as any}>{label}</Badge>;
}

function DonateTypeBadge({ type }: { type?: number }) {
  if (type == null) return <span className="text-muted-foreground">—</span>;
  const label = DONATE_TYPE_MAP[type] ?? 'Unknown';
  const cls = type === 1 ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400';
  return <Badge className={cls}>{label}</Badge>;
}

function DetailDialog({ open, onOpenChange, refId }: { open: boolean; onOpenChange: (v: boolean) => void; refId: string | null }) {
  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', refId],
    queryFn: () => apiClient.get(`/transactions/${refId}`).then((r) => r.data as Transaction),
    enabled: !!refId && open,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Transaction Details</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : tx ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Ref ID</span><span className="font-mono">{tx.refId}</span>
              <span className="text-muted-foreground">Amount</span><span className="font-medium">{fmtIdr(tx.amount)}</span>
              <span className="text-muted-foreground">Status</span><StatusBadge status={tx.status} />
              <span className="text-muted-foreground">Type</span><DonateTypeBadge type={tx.donateType} />
              <span className="text-muted-foreground">Donor</span><span>{[tx.firstName, tx.lastName].filter(Boolean).join(' ')} ({tx.email})</span>
              <span className="text-muted-foreground">Article</span><span>{tx.article?.title ?? '—'}</span>
              <span className="text-muted-foreground">Gateway</span><span>{tx.paymentGateway ?? '—'}</span>
              <span className="text-muted-foreground">Date</span><span>{fmtDate(tx.dateCreated)}</span>
            </div>
            {tx.paids?.length ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Payment History</h4>
                <div className="space-y-2">
                  {tx.paids.map((p, i) => (
                    <div key={i} className="flex flex-col gap-1 rounded border p-3 text-sm">
                      <div className="flex items-center justify-between mt-1">
                        <StatusBadge status={p.status as any} />
                        {/* Only show VA for the latest PENDING cycle */}
                        {p.status === 2 && p.failedMessage && (p as any).cycleNumber === Math.max(...(tx.paids || []).map(px => (px as any).cycleNumber || 0)) && (
                          <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded select-all" title="Click to copy VA">
                            VA: {p.failedMessage}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium">{fmtIdr(p.paidAmount || p.amount || 0)}</span>
                          <span className="text-muted-foreground ml-2">via {p.paymentGateway ?? '—'}</span>
                        </div>
                        <span className="text-muted-foreground">{fmtDate(p.paidAt || (p as any).dateCreated)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export function TransactionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [detailRefId, setDetailRefId] = useState<string | null>(null);
  const q = useDebounce(search);

  useEffect(() => setPage(0), [q, statusFilter, campaignFilter, dateFrom, dateTo]);

  const params: Record<string, string | number> = {
    limit: LIMIT,
    offset: page * LIMIT,
  };
  if (q) params.search = q;
  if (statusFilter !== '') params.status = Number(statusFilter);
  if (campaignFilter !== '') params.donateType = Number(campaignFilter);
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const { data: listRes, isLoading } = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => apiClient.get('/transactions', { params }).then((r) => r.data),
  });

  const { data: statsRes } = useQuery({
    queryKey: ['transactions-stats'],
    queryFn: () => apiClient.get('/transactions/stats').then((r) => r.data),
  });

  const transactions: Transaction[] = listRes?.data ?? [];
  const total = listRes?.total ?? 0;
  const stats = statsRes ?? {};
  const paidCount = (stats.byStatus as { status: number; count: number }[])?.find((s) => s.status === 1)?.count ?? 0;
  const pendingCount = (stats.byStatus as { status: number; count: number }[])?.find((s) => s.status === 0)?.count ?? 0;
  const from = total ? page * LIMIT + 1 : 0;
  const to = Math.min((page + 1) * LIMIT, total);
  const hasNext = to < total;
  const hasPrev = page > 0;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">Monitor donation transactions and payment activity</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/bulk-stop')} className="gap-2">
            <StopCircle className="h-4 w-4 text-destructive" />
            Bulk Stop
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Transactions" value={stats.totalTransactions ?? 0} icon={Receipt} iconCls="bg-primary/10 text-primary" />
          <StatCard label="Total Amount" value={fmtIdr(stats.totalAmount ?? 0)} icon={Wallet} iconCls="bg-emerald-500/10 text-emerald-600" />
          <StatCard label="Paid" value={paidCount} icon={CheckCircle2} iconCls="bg-emerald-500/10 text-emerald-600" />
          <StatCard label="Pending" value={pendingCount} icon={Clock} iconCls="bg-amber-500/10 text-amber-600" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search refId, email, name…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">All Status</option>
            {[0, 1, 2, 3, 4].map((s) => (
              <option key={s} value={s}>{STATUS_MAP[s]}</option>
            ))}
          </Select>
          <Select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="w-full sm:w-40">
            <option value="">All Types</option>
            <option value="1">Monthly</option>
            <option value="2">One-off</option>
          </Select>
          <Input type="date" placeholder="From" className="w-full sm:w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" placeholder="To" className="w-full sm:w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {['Ref ID', 'Donor', 'Amount', 'Type', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b last:border-0">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded w-3/4" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.refId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{tx.refId}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium">{[tx.firstName, tx.lastName].filter(Boolean).join(' ')}</span>
                          <p className="text-muted-foreground text-xs">{tx.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{fmtIdr(tx.amount)}</td>
                      <td className="px-4 py-3"><DonateTypeBadge type={tx.donateType} /></td>
                      <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(tx.dateCreated)}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDetailRefId(tx.refId); }} title="View detail">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
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

      <DetailDialog open={!!detailRefId} onOpenChange={(v) => !v && setDetailRefId(null)} refId={detailRefId} />
    </div>
  );
}
