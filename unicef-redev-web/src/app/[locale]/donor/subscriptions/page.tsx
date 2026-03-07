"use client";

import { useEffect, useState, useCallback } from "react";
import donorApi from "@/lib/donor-api";

interface Subscription {
  refId: string;
  campaignName?: string;
  amount: number;
  status: string;
  startDate: string;
  lastPaidDate?: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await donorApi.get("/donor/subscriptions");
      setSubs(res.data);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(refId: string) {
    setCancellingId(refId);
    try {
      await donorApi.post(`/donor/subscriptions/${refId}/cancel`);
      setSubs((prev) => prev.filter((s) => s.refId !== refId));
    } catch {
      /* handled by interceptor */
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Active Subscriptions</h1>

      {subs.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white py-20 text-center">
          <div className="space-y-2">
            <p className="text-[hsl(var(--muted-foreground))] text-sm">No active subscriptions.</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Monthly donations will appear here once activated.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subs.map((s) => (
            <div
              key={s.refId}
              className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{s.campaignName || "Monthly Donation"}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">{s.refId}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 capitalize">
                  {s.status}
                </span>
              </div>

              <p className="text-2xl font-bold">
                {formatCurrency(s.amount)}
                <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]"> / month</span>
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Start Date</p>
                  <p className="text-sm font-medium">{formatDate(s.startDate)}</p>
                </div>
                {s.lastPaidDate && (
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Last Paid</p>
                    <p className="text-sm font-medium">{formatDate(s.lastPaidDate)}</p>
                  </div>
                )}
              </div>

              {confirmId === s.refId ? (
                <div className="flex items-center gap-3 pt-2">
                  <p className="text-xs text-red-600 flex-1">Cancel this subscription?</p>
                  <button
                    onClick={() => handleCancel(s.refId)}
                    disabled={cancellingId === s.refId}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {cancellingId === s.refId ? "Cancelling..." : "Confirm"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-xs font-semibold hover:bg-[hsl(var(--secondary))] transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(s.refId)}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
