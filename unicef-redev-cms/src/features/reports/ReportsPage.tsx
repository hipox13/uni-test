import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, ArrowLeftRight, TrendingUp, Download } from 'lucide-react';

const STATUS_MAP: Record<number, string> = {
  0: 'Init', 1: 'Error', 2: 'Pending', 3: 'Failed', 4: 'Success', 5: 'Expired', 6: 'Active', 7: 'Waiting', 8: 'Stopped',
};
const STATUS_COLORS: Record<number, string> = {
  0: 'bg-gray-400', 1: 'bg-orange-500', 2: 'bg-amber-500', 3: 'bg-red-500', 4: 'bg-emerald-500', 5: 'bg-gray-400', 6: 'bg-blue-500', 7: 'bg-purple-500', 8: 'bg-slate-500',
};
const CAMPAIGN_MAP: Record<number, string> = { 1: 'Monthly', 2: 'One-off' };

const fmtIdr = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-sm font-medium text-right">{value} ({pct.toFixed(1)}%)</span>
    </div>
  );
}

export function ReportsPage() {
  const { data: stats } = useQuery({
    queryKey: ['report-stats'],
    queryFn: () => apiClient.get('/transactions/stats').then((r) => r.data),
  });
  const { data: txRes } = useQuery({
    queryKey: ['report-transactions'],
    queryFn: () => apiClient.get('/transactions', { params: { limit: 10 } }).then((r) => r.data),
  });

  const totalTx = stats?.totalTransactions ?? 0;
  const totalAmount = stats?.totalAmount ?? 0;
  const byStatus: { status: number; count: number }[] = stats?.byStatus ?? [];
  const byCampaign: { campaignType: number; count: number }[] = stats?.byCampaignType ?? [];
  const paidCount = byStatus.find((s) => s.status === 1)?.count ?? 0;
  const successRate = totalTx > 0 ? ((paidCount / totalTx) * 100).toFixed(1) : '0.0';
  const monthly = byCampaign.find((c) => c.campaignType === 1)?.count ?? 0;
  const oneoff = byCampaign.find((c) => c.campaignType === 2)?.count ?? 0;
  const campaignTotal = monthly + oneoff;
  const transactions = txRes?.data ?? [];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">View analytics and export reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => alert('Export CSV coming soon')}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('Export PDF coming soon')}>
              <Download className="h-4 w-4 mr-1" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: fmtIdr(totalAmount), icon: DollarSign, cls: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'Total Transactions', value: totalTx, icon: ArrowLeftRight, cls: 'bg-primary/10 text-primary' },
            { label: 'Success Rate', value: `${successRate}%`, icon: TrendingUp, cls: 'bg-sky-500/10 text-sky-600' },
            { label: 'Monthly / One-off', value: `${monthly} / ${oneoff}`, icon: BarChart3, cls: 'bg-violet-500/10 text-violet-600' },
          ].map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.cls}`}><c.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-xl font-semibold">{c.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm">Transaction Breakdown by Status</h3>
              {[0, 1, 2, 3, 4].map((s) => {
                const count = byStatus.find((b) => b.status === s)?.count ?? 0;
                return <Bar key={s} label={STATUS_MAP[s]} value={count} total={totalTx} color={STATUS_COLORS[s]} />;
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-sm">Monthly vs One-off Split</h3>
              <Bar label="Monthly" value={monthly} total={campaignTotal} color="bg-sky-500" />
              <Bar label="One-off" value={oneoff} total={campaignTotal} color="bg-violet-500" />
              <div className="flex gap-4 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-sky-500" /> Monthly</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-violet-500" /> One-off</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-4">Last 10 Transactions</h3>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {['Ref ID', 'Amount', 'Status', 'Campaign', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No data</td></tr>
                  ) : (
                    transactions.map((tx: any) => (
                      <tr key={tx.refId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{tx.refId}</td>
                        <td className="px-4 py-3 font-medium">{fmtIdr(Number(tx.amount ?? 0))}</td>
                        <td className="px-4 py-3">
                          <Badge variant={tx.status === 1 ? 'success' : tx.status === 0 ? 'warning' : tx.status === 2 ? 'destructive' : 'secondary' as any}>
                            {STATUS_MAP[tx.status] ?? 'Unknown'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{CAMPAIGN_MAP[tx.campaignType] ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(tx.dateCreated)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
