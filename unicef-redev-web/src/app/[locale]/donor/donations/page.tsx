"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import donorApi from "@/lib/donor-api";

interface Donation {
  refId: string;
  amount: number;
  status: number;
  donateType?: number;
  campaignType?: number;
  dateCreated: string;
  article?: { title: string } | null;
}

const STATUS_MAP: Record<number, { label: string; style: string }> = {
  0: { label: "Init", style: "bg-gray-100 text-gray-500" },
  1: { label: "Error", style: "bg-orange-50 text-orange-600" },
  2: { label: "Pending", style: "bg-amber-50 text-amber-700" },
  3: { label: "Failed", style: "bg-red-50 text-red-600" },
  4: { label: "Success", style: "bg-emerald-50 text-emerald-700" },
  5: { label: "Expired", style: "bg-gray-100 text-gray-500" },
  6: { label: "Active", style: "bg-blue-50 text-blue-700" },
  7: { label: "Waiting", style: "bg-purple-50 text-purple-600" },
  8: { label: "Stopped", style: "bg-gray-100 text-gray-500" },
};

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "4", label: "Success" },
  { value: "6", label: "Active" },
  { value: "2", label: "Pending" },
  { value: "3", label: "Failed" },
  { value: "5", label: "Expired" },
  { value: "8", label: "Stopped" },
];
const LIMIT = 20;

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

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { limit: LIMIT, offset };
        if (status !== "") params.status = status;
        const res = await donorApi.get("/donor/donations", { params });
        setDonations(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      } catch {
        /* handled by interceptor */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [offset, status]);

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Donation History</h1>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setOffset(0); }}
          className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : donations.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white py-20 text-center">
          <p className="text-[hsl(var(--muted-foreground))] text-sm">No donations found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-[hsl(var(--border))] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Date</th>
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Ref ID</th>
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Status</th>
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Type</th>
                  <th className="text-left px-6 py-3 font-semibold text-[hsl(var(--muted-foreground))]">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr
                    key={d.refId}
                    onClick={() => window.location.href = `/en/donor/donations/${d.refId}`}
                    className="hover:bg-[hsl(var(--secondary))]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">{formatDate(d.dateCreated)}</td>
                    <td className="px-6 py-4 font-mono text-xs">{d.refId}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${d.donateType === 1 ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                        {d.donateType === 1 ? 'Monthly' : 'One-off'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[hsl(var(--muted-foreground))]">
                      {d.article?.title || 'General'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {donations.map((d) => (
              <Link
                key={d.refId}
                href={`/en/donor/donations/${d.refId}`}
                className="block rounded-2xl border border-[hsl(var(--border))] bg-white p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatDate(d.dateCreated)}</span>
                  <StatusBadge status={d.status} />
                </div>
                <p className="font-bold text-lg">{formatCurrency(d.amount)}</p>
                <p className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{d.refId}</p>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium disabled:opacity-40 hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + LIMIT)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium disabled:opacity-40 hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const info = STATUS_MAP[status] ?? { label: "Unknown", style: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${info.style}`}>
      {info.label}
    </span>
  );
}
