"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import donorApi from "@/lib/donor-api";

interface Payment {
  id: string;
  amount: number;
  status: string;
  paidAt: string;
  method?: string;
  failedMessage?: string;
}

interface TransactionDetail {
  refId: string;
  amount: number;
  status: string;
  campaignType?: string;
  campaignName?: string;
  donorName?: string;
  donorEmail?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  paids?: Payment[];
  refundRequest?: {
    id: number;
    status: string;
    reason: string;
    responseMessage?: string;
    requestedAt: string;
  } | null;
}

const STATUS_MAP: Record<number, string> = {
  0: "Init",
  1: "Error",
  2: "Pending",
  3: "Failed",
  4: "Paid",
  5: "Expired",
  6: "Active",
  7: "Waiting",
  8: "Stopped",
  36: "Success", // Settlement
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
  error: "bg-red-50 text-red-600 border-red-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
  stopped: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  paid: "bg-emerald-500",
  success: "bg-emerald-500",
  active: "bg-emerald-500",
  pending: "bg-amber-500",
  failed: "bg-red-500",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DonationDetailPage() {
  const params = useParams();
  const refId = params?.refId as string;
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    async function load() {
      if (!refId) return;
      try {
        const res = await donorApi.get(`/donor/donations/${refId}`);
        setTx(res.data);
      } catch {
        /* handled by interceptor */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refId]);

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) return;
    setSubmittingRefund(true);
    try {
      await donorApi.post(`/donor/refunds/${refId}`, { reason: refundReason });
      const res = await donorApi.get(`/donor/donations/${refId}`);
      setTx(res.data);
      setShowRefundModal(false);
    } catch {
      alert("Failed to request refund.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-[hsl(var(--muted-foreground))]">Transaction not found.</p>
        <Link href="/en/donor/donations" className="text-sm text-[hsl(var(--primary))] font-semibold hover:underline">
          Back to Donations
        </Link>
      </div>
    );
  }

  const statusLabel = STATUS_MAP[Number(tx.status)] || "Unknown";
  const style = STATUS_STYLES[statusLabel.toLowerCase()] ?? STATUS_STYLES.expired;
  const dotStyle = STATUS_DOT[statusLabel.toLowerCase()] ?? "bg-gray-400";

  // Status codes for success: 4 (Success), 36 (Settlement), 6 (Active)
  const canRefund = [4, 6, 36].includes(Number(tx.status)) && !tx.refundRequest;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/en/donor/donations"
        className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Back to Donations
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] mb-1">{tx.refId}</p>
            <p className="text-2xl font-bold">{formatCurrency(tx.amount)}</p>
          </div>
          <div className="flex items-center gap-3">
            {tx.refundRequest && (
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize border ${tx.refundRequest.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                tx.refundRequest.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                Refund {tx.refundRequest.status}
              </span>
            )}
            {canRefund && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Request Refund
              </button>
            )}
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize border ${style}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {tx.refundRequest && (
          <div className={`mb-6 p-4 rounded-xl border ${tx.refundRequest.status === 'approved' ? 'bg-emerald-50/50 border-emerald-100' :
            tx.refundRequest.status === 'rejected' ? 'bg-red-50/50 border-red-100' :
              'bg-amber-50/50 border-amber-100'
            }`}>
            <p className="text-sm font-semibold mb-1">
              Refund Request: <span className="capitalize">{tx.refundRequest.status}</span>
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Reason: {tx.refundRequest.reason}</p>
            {tx.refundRequest.responseMessage && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 border-t border-[hsl(var(--border))] pt-2">
                Response: {tx.refundRequest.responseMessage}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
          <DetailRow label="Campaign" value={tx.campaignName || "—"} />
          <DetailRow label="Payment Method" value={tx.paymentMethod || "—"} />
          <DetailRow label="Donor Name" value={tx.donorName || "—"} />
          <DetailRow label="Donor Email" value={tx.donorEmail || "—"} />
          <DetailRow label="Created" value={formatDateTime(tx.createdAt)} />
          <DetailRow label="Updated" value={formatDateTime(tx.updatedAt)} />
        </div>
      </div>

      {/* Timeline */}
      {tx.paids && tx.paids.length > 0 && (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 md:p-8">
          <h2 className="font-bold mb-6">Payment History</h2>
          <div className="space-y-0">
            {tx.paids.map((p, i) => {
              const pLabel = STATUS_MAP[Number(p.status)] || "Unknown";
              const pDot = STATUS_DOT[pLabel.toLowerCase()] ?? "bg-gray-400";
              const isLatestPending = pLabel.toLowerCase() === 'pending' &&
                (p as any).cycleNumber === Math.max(...tx.paids!.map(px => (px as any).cycleNumber || 0));

              return (
                <div key={p.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${pDot}`} />
                    {i < tx.paids!.length - 1 && <div className="w-px flex-1 bg-[hsl(var(--border))]" />}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-semibold capitalize">{pLabel}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDateTime(p.paidAt)} {p.method && `· ${p.method}`} {(p as any).cycleNumber && `· Cycle ${(p as any).cycleNumber}`}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{formatCurrency(Number(p.amount))}</p>
                    {/* Only show instructions for the latest PENDING cycle */}
                    {isLatestPending && p.failedMessage && (
                      <div className="mt-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl max-w-sm">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                          Payment Instructions
                        </p>

                        {p.failedMessage.startsWith('http') ? (
                          <div className="space-y-3">
                            <div className="bg-white p-2 rounded-lg border border-amber-200 inline-block">
                              {/* Using a simple img tag for the QR URL from Midtrans */}
                              <img
                                src={p.failedMessage}
                                alt="Payment QR Code"
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                            <p className="text-[10px] text-amber-700 leading-relaxed">
                              Scan the QR code above using your GoPay, OVO, Dana, or LinkAja app to complete the payment.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] text-amber-600 font-medium">Virtual Account Number</p>
                            <p className="font-mono text-lg font-bold text-amber-900 tracking-wider">
                              {p.failedMessage}
                            </p>
                            <p className="text-[10px] text-amber-700">
                              Please transfer the exact amount to this BCA Virtual Account.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-xl">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <h3 className="text-xl font-bold">Request Refund</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Please provide a reason for your refund request.
              </p>
            </div>
            <form onSubmit={handleRequestRefund} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all resize-none h-24"
                  placeholder="e.g. Salah donasi, nominal berlebih..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] font-semibold hover:bg-[hsl(var(--secondary))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
                >
                  {submittingRefund ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
