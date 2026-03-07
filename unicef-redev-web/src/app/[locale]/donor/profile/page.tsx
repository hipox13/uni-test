"use client";

import { useEffect, useState } from "react";
import donorApi from "@/lib/donor-api";

interface DonorProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  picture: string | null;
  phone?: string;
  address?: string;
  city?: string;
}

interface DonorStats {
  totalDonated: number;
  totalTransactions: number;
  activeSubscriptions: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DonorProfilePage() {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, statsRes] = await Promise.all([
          donorApi.get("/donor/profile"),
          donorApi.get("/donor/stats"),
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
        const p = profileRes.data;
        setForm({ name: p.name || "", phone: p.phone || "", address: p.address || "", city: p.city || "" });
      } catch {
        /* handled by interceptor */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await donorApi.patch("/donor/profile", form);
      setProfile(res.data);
      setEditing(false);
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <p className="text-[hsl(var(--muted-foreground))]">Failed to load profile.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Donated", value: formatCurrency(stats?.totalDonated ?? 0) },
    { label: "Transactions", value: String(stats?.totalTransactions ?? 0) },
    { label: "Active Subscriptions", value: String(stats?.activeSubscriptions ?? 0) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[hsl(var(--border))] p-5 bg-white"
          >
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt={profile.name}
              className="w-20 h-20 rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold">{profile.name}</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{profile.email}</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm font-semibold text-[hsl(var(--primary))] hover:underline"
          >
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4 max-w-lg">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
            <InfoRow label="Phone" value={profile.phone || "—"} />
            <InfoRow label="City" value={profile.city || "—"} />
            <InfoRow label="Address" value={profile.address || "—"} />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
