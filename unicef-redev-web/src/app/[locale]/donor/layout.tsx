"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isDonorAuthenticated, clearDonorToken } from "@/lib/donor-auth";

const NAV_ITEMS = [
  { label: "Profile", href: "/en/donor/profile" },
  { label: "Donations", href: "/en/donor/donations" },
  { label: "Subscriptions", href: "/en/donor/subscriptions" },
];

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname.endsWith("/donor/login");

  useEffect(() => {
    if (!isLoginPage && !isDonorAuthenticated()) {
      router.replace("/en/donor/login");
      return;
    }
    setReady(true);
  }, [isLoginPage, router]);

  function handleLogout() {
    clearDonorToken();
    router.replace("/en/donor/login");
  }

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-[60vh]">
      <nav className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link
              href="/en/donor/profile"
              className="text-sm font-bold text-[hsl(var(--primary))] mr-4"
            >
              Donor Portal
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-colors px-3 py-2"
            >
              Logout
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-[hsl(var(--muted-foreground))]"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                {mobileOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[hsl(var(--border))] px-6 py-3 space-y-1 bg-white">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${isActive(item.href)
                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))]"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
