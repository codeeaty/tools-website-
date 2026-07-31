"use client";

import Link from "next/link";
import { useState } from "react";

type CategoryKey = "all" | "image" | "audio" | "video" | "text";

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "all", label: "All Tools", icon: "⚡" },
  { key: "image", label: "Image", icon: "🖼️" },
  { key: "audio", label: "Audio", icon: "🎵" },
  { key: "video", label: "Video", icon: "🎬" },
  { key: "text", label: "Text", icon: "📝" },
];

type Tool = {
  name: string;
  desc: string;
  icon: string;
  category: Exclude<CategoryKey, "all">;
  badge?: string;
};

const tools: Tool[] = [
  // Image
  { name: "Image Resizer", desc: "Resize images to any custom dimension instantly", icon: "⤢", category: "image", badge: "Popular" },
  { name: "Background Remover", desc: "Remove image backgrounds with AI in one click", icon: "✂️", category: "image", badge: "AI" },
  { name: "Format Converter", desc: "Convert between PNG, JPG, WEBP, AVIF and more", icon: "🔄", category: "image" },
  { name: "Image Compressor", desc: "Reduce file size without losing visible quality", icon: "🗜️", category: "image" },
  { name: "Image Editor", desc: "Crop, rotate, flip and apply filters online", icon: "🎨", category: "image" },
  // { name: "Watermark Adder", desc: "Add text or image watermarks in seconds", icon: "💧", category: "image" },
  // Audio
  { name: "Audio Converter", desc: "Convert audio to MP3, WAV, FLAC, OGG and more", icon: "〰️", category: "audio", badge: "Popular" },
  { name: "Audio Trimmer", desc: "Cut, split and merge audio clips with precision", icon: "✂️", category: "audio" },
  // { name: "Noise Remover", desc: "AI-powered background noise removal from audio", icon: "🎙️", category: "audio", badge: "AI" },
  { name: "Volume Booster", desc: "Boost or normalize audio volume levels", icon: "🔊", category: "audio" },
  // { name: "Audio Merger", desc: "Combine multiple audio files into one", icon: "🔗", category: "audio" },
  // { name: "Pitch Changer", desc: "Change pitch without affecting playback speed", icon: "🎚️", category: "audio" },
  // Video
  { name: "Video Converter", desc: "Convert video to MP4, MKV, MOV, AVI and more", icon: "🔄", category: "video", badge: "Popular" },
  { name: "Video Compressor", desc: "Shrink video file sizes without quality loss", icon: "🗜️", category: "video" },
  { name: "Video Trimmer", desc: "Trim and cut video clips with frame precision", icon: "✂️", category: "video" },
  { name: "GIF Maker", desc: "Convert any video clip into an animated GIF", icon: "▶️", category: "video" },
  // { name: "Subtitle Adder", desc: "Embed or burn SRT subtitles into your video", icon: "💬", category: "video" },
  // { name: "Screen Recorder", desc: "Record your screen directly in the browser", icon: "🖥️", category: "video", badge: "New" },
  // Text
  { name: "Word Counter", desc: "Count words, characters, sentences and lines", icon: "🔢", category: "text", badge: "Popular" },
  { name: "Case Converter", desc: "Convert text to UPPER, lower, Title or camelCase", icon: "Aa", category: "text" },
  { name: "JSON Formatter", desc: "Beautify, minify and validate JSON data", icon: "{}", category: "text" },
  { name: "Markdown Editor", desc: "Write Markdown with a live HTML preview", icon: "Md", category: "text" },
  { name: "Plagiarism Checker", desc: "Detect duplicate content across the web", icon: "🔍", category: "text", badge: "AI" },
  // { name: "Lorem Generator", desc: "Generate placeholder Lorem Ipsum text fast", icon: "¶", category: "text" },
];

const categoryStyles: Record<Exclude<CategoryKey, "all">, { card: string; badge: string; icon: string; glow: string }> = {
  image: {
    card: "hover:border-violet-500/40 hover:shadow-violet-500/10",
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    icon: "bg-violet-500/15 text-violet-300",
    glow: "group-hover:text-violet-400",
  },
  audio: {
    card: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    icon: "bg-cyan-500/15 text-cyan-300",
    glow: "group-hover:text-cyan-400",
  },
  video: {
    card: "hover:border-red-500/40 hover:shadow-red-500/10",
    badge: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: "bg-red-500/15 text-red-300",
    glow: "group-hover:text-red-400",
  },
  text: {
    card: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    icon: "bg-emerald-500/15 text-emerald-300",
    glow: "group-hover:text-emerald-400",
  },
};

const stats = [
  { value: "15+", label: "Free Tools" },
  { value: "100%", label: "Browser-based" },
  { value: "Free", label: "No Hidden Costs" },
  { value: "0", label: "Sign-up Required" },
];

const features = [
  { icon: "🔒", title: "Private & Secure", desc: "Files are processed locally in your browser. Nothing is uploaded to our servers." },
  { icon: "⚡", title: "Lightning Fast", desc: "Optimized algorithms ensure your files are processed in seconds, not minutes." },
  { icon: "🆓", title: "Always Free", desc: "Every tool on this platform is completely free to use with no hidden limits." },
  { icon: "📱", title: "Works Everywhere", desc: "Fully responsive — use any tool on desktop, tablet, or mobile seamlessly." },
];

export default function HomePage() {
  const [active, setActive] = useState<CategoryKey>("all");
  const [search, setSearch] = useState("");

  const filtered = tools.filter((t) => {
    const matchCat = active === "all" || t.category === active;
    const matchSearch =
      search.trim() === "" ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-violet-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Pill tag */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-xs font-semibold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            50+ Free Online Tools
          </span>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            All the tools you need,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              in one place.
            </span>
          </h1>

          <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Free online tools for images, audio, video &amp; text — no account, no limits, no nonsense.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              className="w-full bg-white/6 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => { setActive(c.key); setSearch(""); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                  active === c.key
                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
    

      {/* ── Tools Grid ── */}
      <section className="px-6 pt-2 pb-15 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            {search ? `Results for "${search}"` : active === "all" ? "All Tools" : categories.find(c => c.key === active)?.label}
          </h2>
          <span className="text-white/35 text-sm">{filtered.length} tools</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium">No tools found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tool) => {
              const styles = categoryStyles[tool.category];
              return (
                <Link
                  key={tool.name}
                  href="#"
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:shadow-xl transition-all duration-200 ${styles.card}`}
                >
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${styles.icon} transition-colors`}>
                    {tool.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold text-white/85 text-sm leading-tight group-hover:text-white transition-colors ${styles.glow}`}>
                        {tool.name}
                      </p>
                      {tool.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs leading-relaxed">{tool.desc}</p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </section>
  <section className="border-y border-white/6 bg-white/[0.02] px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── Features ── */}
      <section className="px-6 py-16 border-t border-white/6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why ToolKit?</h2>
            <p className="text-white/40 max-w-md mx-auto">Built for speed, privacy, and simplicity — no bloat, just tools.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.05] hover:border-white/12 transition-all duration-200"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-white mt-3 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/15 via-violet-600/5 to-cyan-600/10 p-12 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-500/15 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start using tools for free
            </h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              No sign-up. No credit card. Just pick a tool and get to work.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-violet-500/25">
              <Link href={"tools"}>
                Browse all tools
              </Link>
              </button>
              {/* <button className="px-7 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/12 text-white font-semibold text-sm transition-colors duration-150">
                Learn more
              </button> */}
            </div>
          </div>
        </div>
      </section>

   
    </main>
  );
}