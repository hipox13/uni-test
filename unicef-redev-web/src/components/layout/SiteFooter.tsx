import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
                <span className="text-white font-bold text-sm">U</span>
              </div>
              <span className="font-bold text-lg">UNICEF Indonesia</span>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm leading-relaxed">
              For every child, health, education, equality, protection.
              UNICEF has been working in Indonesia since 1948.
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-5">Programs</p>
            <ul className="space-y-3">
              {["Education", "Health", "Water & Sanitation", "Child Protection"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-5">Support</p>
            <ul className="space-y-3">
              {["Contact Us", "FAQ", "Privacy Policy", "Terms of Service"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--border))] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            &copy; 2026 UNICEF Indonesia. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Twitter", "Instagram", "Facebook", "YouTube"].map((social) => (
              <Link
                key={social}
                href="#"
                className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                {social}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
