"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { isDonorAuthenticated, getDonorToken, clearDonorToken } from "@/lib/donor-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

interface DonorUser {
  name: string;
  email: string;
  picture?: string | null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || "en";
  const isActive = (href: string) => pathname.startsWith(href);

  const [user, setUser] = useState<DonorUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDonorAuthenticated()) return;
    const token = getDonorToken();
    fetch(`${API_URL}/api/v1/donor/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUser(data); })
      .catch(() => { });
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    clearDonorToken();
    setUser(null);
    setMenuOpen(false);
    router.push(`/${locale}`);
  }

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-[hsl(var(--border))]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="font-bold text-lg tracking-tight">UNICEF Indonesia</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/${locale}/campaign`}
            className={`text-sm font-medium transition-colors ${isActive(`/${locale}/campaign`)
              ? "text-[hsl(var(--foreground))]"
              : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            Campaigns
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user.name}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[hsl(var(--muted-foreground))]">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-[hsl(var(--border))] shadow-xl py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                  </div>
                  <Link
                    href={`/${locale}/donor/profile`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-[hsl(var(--secondary))] transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    href={`/${locale}/donor/donations`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-[hsl(var(--secondary))] transition-colors"
                  >
                    Donation History
                  </Link>
                  <Link
                    href={`/${locale}/donor/subscriptions`}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-[hsl(var(--secondary))] transition-colors"
                  >
                    Subscriptions
                  </Link>
                  <div className="border-t border-[hsl(var(--border))] mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/${locale}/donor/login`}
              className={`text-sm font-medium transition-colors ${isActive(`/${locale}/donor`)
                ? "text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
            >
              My Account
            </Link>
          )}

        </nav>
      </div>
    </header>
  );
}
