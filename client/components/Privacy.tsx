import Link from "next/link";

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect minimal information to operate ToolKit. Most tools process your files entirely in your browser, meaning your files never reach our servers.",
      "For features that require server processing, we temporarily handle uploaded files solely to perform the requested operation, and we delete them automatically afterward.",
      "We may collect basic usage analytics (pages visited, tools used, browser type) to improve the product. This data is anonymized and not linked to your identity.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "Any information collected is used only to provide, maintain, and improve our tools and services.",
      "We do not sell, rent, or trade your personal information to third parties.",
      "We may use aggregated, non-identifying data to understand which tools are most useful and to guide future development.",
    ],
  },
  {
    title: "3. File Privacy",
    body: [
      "Files processed by browser-based tools (image, audio, video, text) are handled locally on your device and are never uploaded to our servers.",
      "For tools that require server-side processing, files are processed in memory or temporary storage and permanently deleted within a short window after the task completes.",
      "We never inspect, share, or retain the content of your files beyond what is required to perform the requested operation.",
    ],
  },
  {
    title: "4. Cookies & Tracking",
    body: [
      "We use essential cookies to keep the site functioning correctly (e.g., remembering your preferences).",
      "We may use privacy-respecting analytics tools to understand aggregate usage patterns. These do not track you across other websites.",
      "You can disable cookies in your browser settings at any time; core tools will continue to work without them.",
    ],
  },
  {
    title: "5. Data Security",
    body: [
      "We apply industry-standard security practices, including encrypted connections (HTTPS), to protect any data in transit.",
      "Because most processing happens client-side, your files are rarely exposed to any external server in the first place.",
      "No system is 100% secure, but we continually review our practices to minimize risk.",
    ],
  },
  {
    title: "6. Third-Party Services",
    body: [
      "Some advanced features (e.g., AI-powered background removal) may rely on third-party APIs. When this is the case, we only send the minimum data required to perform the task.",
      "We vet third-party providers for their own privacy and security practices before integrating them.",
    ],
  },
  {
    title: "7. Your Rights",
    body: [
      "You may request information about any data we hold about you, or request its deletion, by contacting us.",
      "Since most processing is local to your browser, in most cases we simply have nothing to delete.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time. Material changes will be reflected with an updated date below, and continued use of the site constitutes acceptance of the revised policy.",
    ],
  },
];

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-14 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Legal
          </span>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
            Privacy{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Policy
            </span>
          </h1>

          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Your privacy matters to us. Here&apos;s exactly what we collect, how we use it, and how we protect it.
          </p>
          <p className="text-white/30 text-xs mt-4">Last updated: June 2026</p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 md:p-10 space-y-10">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-bold text-white mb-3">{s.title}</h2>
              <div className="space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-white/50 text-sm leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/8">
            <p className="text-white/50 text-sm leading-relaxed">
              Questions about this policy? Reach out via our{" "}
              <Link href="/contact" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}