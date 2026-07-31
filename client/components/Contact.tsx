"use client";

import { useState } from "react";

const contactMethods = [
  {
    icon: "✉️",
    title: "Email Us",
    desc: "Drop us a line anytime",
    value: "support@toolkit.com",
    color: "violet" as const,
  },
  {
    icon: "💬",
    title: "Live Chat",
    desc: "Mon–Fri, 9am to 6pm",
    value: "Start a conversation",
    color: "cyan" as const,
  },
  {
    icon: "📍",
    title: "Office",
    desc: "Come say hello",
    value: "San Francisco, CA",
    color: "emerald" as const,
  },
];

const colorStyles = {
  violet: { icon: "bg-violet-500/15 text-violet-300", ring: "hover:border-violet-500/40" },
  cyan: { icon: "bg-cyan-500/15 text-cyan-300", ring: "hover:border-cyan-500/40" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-300", ring: "hover:border-emerald-500/40" },
};

const faqs = [
  { q: "How fast do you reply?", a: "We usually respond within 24 hours on business days." },
  { q: "Do you offer support for bugs?", a: "Yes — pick \"Bug Report\" as the subject and include as much detail as you can." },
  { q: "Can I suggest a new tool?", a: "Absolutely. We love feature requests — use the form below." },
];


export const metadata = {
  title: "Contact Us",
  description: "Have questions, feedback, or need help? Reach out to our support team and we will get back to you as soon as possible.",
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General Inquiry", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      // Replace with your actual API endpoint
      await new Promise((res) => setTimeout(res, 1200));
      setStatus("success");
      setForm({ name: "", email: "", subject: "General Inquiry", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-14 px-6">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            We&apos;d love to hear from you
          </span>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
            Get in{" "}
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              touch
            </span>
          </h1>

          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Questions, feedback, or a tool idea? Send us a message and our team will get back to you shortly.
          </p>
        </div>
      </section>

      {/* ── Contact methods ── */}
      <section className="px-6 pb-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {contactMethods.map((m) => {
            const c = colorStyles[m.color];
            return (
              <div
                key={m.title}
                className={`p-5 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-200 ${c.ring}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${c.icon}`}>
                  {m.icon}
                </div>
                <p className="font-semibold text-white/85 text-sm mb-0.5">{m.title}</p>
                <p className="text-white/35 text-xs mb-2">{m.desc}</p>
                <p className="text-white/70 text-sm font-medium">{m.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="px-6 py-14 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 md:p-9">
          <h2 className="text-xl font-bold mb-1">Send a message</h2>
          <p className="text-white/40 text-sm mb-7">Fill out the form and we&apos;ll respond as soon as possible.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Your Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200 appearance-none"
              >
                <option className="bg-[#111118]">General Inquiry</option>
                <option className="bg-[#111118]">Bug Report</option>
                <option className="bg-[#111118]">Feature Request</option>
                <option className="bg-[#111118]">Partnership</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full h-36 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm resize-none focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200"
              />
            </div>

            {status === "error" && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ Please fill in your name, email, and message.
              </div>
            )}
            {status === "success" && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-emerald-400 text-sm">
                ✓ Message sent! We&apos;ll be in touch soon.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>

        {/* FAQ sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-4">
              Quick Answers
            </p>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <p className="text-sm font-semibold text-white/85 mb-1">{f.q}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 via-violet-600/5 to-cyan-600/10 p-6">
            <span className="text-2xl">⚡</span>
            <p className="font-semibold text-white text-sm mt-3 mb-1.5">Need it fast?</p>
            <p className="text-white/50 text-xs leading-relaxed">
              For urgent issues, use Live Chat — our team typically replies in minutes during business hours.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}