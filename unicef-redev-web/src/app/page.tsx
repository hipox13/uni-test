import Link from "next/link";
import { GooeyTextHero } from "@/components/home/GooeyTextHero";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <GooeyTextHero />

      {/* Stats Bar */}
      <section className="bg-[hsl(var(--foreground))] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { value: "12M+", label: "Children Reached" },
            { value: "34", label: "Provinces Covered" },
            { value: "200K+", label: "Monthly Donors" },
            { value: "99%", label: "Goes to Programs" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`py-12 px-8 text-center ${i > 0 ? "border-l border-white/10" : ""}`}
            >
              <p className="text-3xl md:text-4xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-white/50 mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))] mb-5">
              Our Impact
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              How Your Donation Helps
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-6 text-lg leading-relaxed">
              Every contribution makes a real difference in the lives of children across Indonesia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "💧",
                title: "Clean Water",
                desc: "Providing safe drinking water and sanitation to communities in need across remote areas of Indonesia.",
                stat: "2.3M people served",
              },
              {
                icon: "📚",
                title: "Education",
                desc: "Ensuring every child has access to quality education, learning materials, and trained teachers.",
                stat: "4.8M children enrolled",
              },
              {
                icon: "🏥",
                title: "Healthcare",
                desc: "Supporting nutrition programs, vaccinations, and healthcare services for children and mothers.",
                stat: "6.1M vaccinations",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative p-10 rounded-3xl border border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary))]/30 hover:shadow-2xl hover:shadow-[hsl(199,89%,48%,0.06)] transition-all duration-500"
              >
                <span className="text-5xl block">{item.icon}</span>
                <h3 className="text-xl font-bold mt-6 mb-3">{item.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-6">
                  {item.desc}
                </p>
                <div className="pt-4 border-t border-[hsl(var(--border))]">
                  <p className="text-sm font-bold text-[hsl(var(--primary))]">{item.stat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-32 px-6 bg-[hsl(var(--secondary))]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
              Our Mission
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              For Every Child,
              <br />a Fair Chance
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              UNICEF works in Indonesia&apos;s toughest places to reach the most disadvantaged
              children and adolescents — and to protect the rights of every child, everywhere.
            </p>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We believe every child has the right to survive, thrive, and fulfill their
              potential — to the benefit of a better world.
            </p>
            <Link
              href="/en/campaign"
              className="inline-flex items-center gap-2 text-[hsl(var(--primary))] font-semibold hover:gap-3 transition-all pt-2"
            >
              Explore our campaigns →
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(199,89%,35%)] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop"
                alt="Children learning"
                className="w-full h-full object-cover mix-blend-overlay opacity-80"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-[hsl(var(--border))]">
              <p className="text-3xl font-bold text-[hsl(var(--primary))]">34</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Provinces across Indonesia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Make a Difference Today
          </h2>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto leading-relaxed">
            Join thousands of donors supporting children&apos;s futures across Indonesia.
            Every amount counts.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/en/donate"
              className="inline-flex items-center gap-2 text-white bg-[hsl(var(--primary))] px-10 py-5 rounded-full text-lg font-semibold hover:brightness-110 transition-all shadow-xl shadow-[hsl(199,89%,48%,0.25)]"
            >
              Donate Now →
            </Link>
            <Link
              href="/en/donate"
              className="inline-flex items-center gap-2 text-[hsl(var(--foreground))] border border-[hsl(var(--border))] px-10 py-5 rounded-full text-lg font-medium hover:bg-[hsl(var(--secondary))] transition-colors"
            >
              Become a Monthly Donor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                For every child, health, education, equality, protection. UNICEF has been
                working in Indonesia since 1948.
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
    </div>
  );
}
