import Link from "next/link";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using ToolKit, you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of the site.",
      "We may update these terms periodically; continued use after changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "2. Use of Service",
    body: [
      "ToolKit provides free online tools for image, audio, video, and text processing. You may use these tools for personal or commercial purposes, subject to these terms.",
      "You agree not to use the service for any unlawful purpose, to upload malicious files, or to attempt to disrupt, reverse-engineer, or overload our infrastructure.",
      "You are responsible for ensuring you have the necessary rights to any content you process using our tools.",
    ],
  },
  {
    title: "3. No Account Required",
    body: [
      "Most tools are available without creating an account. Where an account is required for a specific feature, you are responsible for keeping your credentials secure.",
    ],
  },
  {
    title: "4. Intellectual Property",
    body: [
      "All branding, design, and code on ToolKit are the property of ToolKit and its licensors, unless otherwise noted.",
      "You retain full ownership of any files or content you upload or process — we claim no rights over your content.",
    ],
  },
  {
    title: "5. Disclaimer of Warranties",
    body: [
      "ToolKit is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.",
      "We do not guarantee that tools will be error-free, uninterrupted, or perfectly preserve file quality in every case.",
    ],
  },
  {
    title: "6. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, ToolKit and its team shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including loss of data or files.",
      "You use all tools at your own risk and are encouraged to keep backups of original files before processing.",
    ],
  },
  {
    title: "7. Third-Party Services",
    body: [
      "Some tools may rely on third-party APIs or services (e.g., AI-powered features). Your use of those features may also be subject to the third party's own terms.",
    ],
  },
  {
    title: "8. Termination",
    body: [
      "We reserve the right to suspend or restrict access to the service for any user who violates these terms or engages in abusive behavior, without prior notice.",
    ],
  },
  {
    title: "9. Governing Law",
    body: [
      "These terms are governed by and construed in accordance with applicable local laws, without regard to conflict-of-law principles.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "If you have any questions about these Terms & Conditions, please reach out through our Contact page.",
    ],
  },
];

export default function TermsPage() {
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
            Terms &amp;{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Conditions
            </span>
          </h1>

          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using any of our tools or services.
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
              Have questions about these terms? Visit our{" "}
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