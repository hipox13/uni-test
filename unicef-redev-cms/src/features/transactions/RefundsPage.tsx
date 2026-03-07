import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { RefreshCcw, Eye, X, Check, Receipt } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface RefundRequest {
    id: number;
    transactionRefId: string;
    userId: number;
    requestedAt: string;
    reason: string;
    status: string;
    responseMessage?: string;
    transaction: {
        refId: string;
        amount: number;
        status: number;
        paymentGateway: string;
        article?: { title: string };
    };
    user: {
        name: string;
        email: string;
    };
}

export function RefundsPage() {
    const [requests, setRequests] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
    const [responseMsg, setResponseMsg] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/payments/refunds');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (action: 'approve' | 'reject', manual: boolean = false) => {
        if (!selectedRequest) return;
        setProcessing(true);
        try {
            await apiClient.post(`/payments/refunds/${selectedRequest.id}/${action === 'approve' ? 'approve' : 'reject'}`, {
                responseMessage: responseMsg,
                manual, // Send manual flag
            });
            setSelectedRequest(null);
            setResponseMsg("");
            fetchRequests();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to process refund';
            if (action === 'approve' && !manual) {
                if (window.confirm(`${msg}\n\nWould you like to mark this as refunded MANUALLY instead? (No API call will be made)`)) {
                    handleAction('approve', true);
                    return;
                }
            } else {
                alert(msg);
            }
        } finally {
            setProcessing(false);
        }
    };

    const fmtIdr = (v: number) => {
        const val = typeof v === 'string' ? parseFloat(v) : v;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };
    const fmtDate = (iso: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Refund Requests</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage and process donor refund requests.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRequests}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {loading && requests.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                                <RefreshCcw className="w-8 h-8 animate-spin text-muted-foreground/30" />
                                Loading requests...
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
                                <Receipt className="w-8 h-8 text-muted-foreground/20" />
                                No refund requests found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Date</th>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Transaction</th>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Donor</th>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Amount</th>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {requests.map((r) => (
                                            <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{fmtDate(r.requestedAt)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{r.transactionRefId}</div>
                                                    <div className="text-xs text-muted-foreground">{r.transaction.article?.title || 'General'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-foreground">{r.user?.name || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-foreground">{fmtIdr(r.transaction.amount)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'} className="capitalize text-[10px]">
                                                        {r.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedRequest(r)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Eye className="w-4 h-4" />
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
            </div>

            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Refund Request Details</DialogTitle>
                        <div className="sr-only">
                            Detailed information about the donor's refund request and options to approve or reject.
                        </div>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Donor</p>
                                    <p className="font-medium">{selectedRequest.user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">{selectedRequest.user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                                    <p className="font-semibold text-lg">{fmtIdr(selectedRequest.transaction?.amount || 0)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                                    <div className="bg-muted/50 p-3 rounded-xl border border-border text-sm italic">
                                        "{selectedRequest.reason}"
                                    </div>
                                </div>
                            </div>

                            {selectedRequest.status === 'pending' ? (
                                <div className="space-y-3 p-4 bg-muted rounded-2xl border border-border">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response Message (Optional)</label>
                                    <Textarea
                                        placeholder="Add a message for the donor..."
                                        value={responseMsg}
                                        onChange={(e) => setResponseMsg(e.target.value)}
                                        className="bg-white border-border focus:ring-1 focus:ring-primary h-20 text-sm"
                                    />
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleAction('reject')}
                                            disabled={processing}
                                            className="grow gap-2 rounded-xl h-10 shadow-sm"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing}
                                            className="grow gap-2 rounded-xl h-10 shadow-sm bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {processing ? (
                                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            Approve & Refund
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Historical Response</p>
                                    <p className="text-sm font-medium">{selectedRequest.responseMessage || "No message provided."}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                                        <Check className="w-3 h-3" /> Processed
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
