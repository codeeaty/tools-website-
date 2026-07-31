"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  href: string;
};

const tools: Tool[] = [
  // Image
  { name: "Image Resizer", desc: "Resize images to any custom dimension instantly", icon: "⤢", category: "image", badge: "Popular", href: "/image-resizer" },
  { name: "Background Remover", desc: "Remove image backgrounds with AI in one click", icon: "✂️", category: "image", badge: "AI", href: "/background-remover" },
  { name: "Format Converter", desc: "Convert between PNG, JPG, WEBP, AVIF and more", icon: "🔄", category: "image", href: "/image-format-converter" },
  { name: "Image Compressor", desc: "Reduce file size without losing visible quality", icon: "🗜️", category: "image", href: "/image-compressor" },
  { name: "Image Editor", desc: "Crop, rotate, flip and apply filters online", icon: "🎨", category: "image", href: "/image-editor" },
  // Audio
  { name: "Audio Converter", desc: "Convert audio to MP3, WAV, FLAC, OGG and more", icon: "〰️", category: "audio", badge: "Popular", href: "/audio-converter" },
  { name: "Audio Trimmer", desc: "Cut, split and merge audio clips with precision", icon: "✂️", category: "audio", href: "/audio-trimmer" },
  { name: "Volume Booster", desc: "Boost or normalize audio volume levels", icon: "🔊", category: "audio", href: "/volume-booster" },
  // Video
  { name: "Video Converter", desc: "Convert video to MP4, MKV, MOV, AVI and more", icon: "🔄", category: "video", badge: "Popular", href: "/video-converter" },
  { name: "Video Compressor", desc: "Shrink video file sizes without quality loss", icon: "🗜️", category: "video", href: "/video-compressor" },
  { name: "Video Trimmer", desc: "Trim and cut video clips with frame precision", icon: "✂️", category: "video", href: "/video-trimmer" },
  { name: "GIF Maker", desc: "Convert any video clip into an animated GIF", icon: "▶️", category: "video", href: "/gif-maker" },
  // Text
  { name: "Word Counter", desc: "Count words, characters, sentences and lines", icon: "🔢", category: "text", badge: "Popular", href: "/word-counter" },
  { name: "Case Converter", desc: "Convert text to UPPER, lower, Title or camelCase", icon: "Aa", category: "text", href: "/case-converter" },
  { name: "JSON Formatter", desc: "Beautify, minify and validate JSON data", icon: "{}", category: "text", href: "/json-formatter" },
  { name: "Markdown Editor", desc: "Write Markdown with a live HTML preview", icon: "Md", category: "text", href: "/markdown-editor" },
  { name: "Plagiarism Checker", desc: "Detect duplicate content across the web", icon: "🔍", category: "text", badge: "AI", href: "/plagiarism-checker" },
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

const PAGE_SIZE = 4;

export default function ToolsPage() {
  const [active, setActive] = useState<CategoryKey>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = active === "all" || t.category === active;
      const matchSearch =
        search.trim() === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [active, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategory = (key: CategoryKey) => {
    setActive(key);
    setSearch("");
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // Build a compact page list with ellipses, e.g. 1 2 3 ... 8
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    const windowSize = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - windowSize && i <= currentPage + windowSize)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      {/* ── Page title bar ── */}
      <section className="relative px-6 pt-16 pb-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-300 text-[11px] font-semibold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              {tools.length} Tools Available
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Explore all{" "}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                tools
              </span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tools…"
              className="w-full bg-white/6 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all duration-200"
            />
          </div>
        </div>
      </section>

      {/* ── Sidebar + Content ── */}
      <section className="relative px-6 pb-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* Sidebar categories */}
        <aside className="md:sticky md:top-20 self-start">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest px-3 pt-2 pb-3">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              {categories.map((c) => {
                const count = c.key === "all" ? tools.length : tools.filter((t) => t.category === c.key).length;
                return (
                  <button
                    key={c.key}
                    onClick={() => handleCategory(c.key)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active === c.key
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                        : "text-white/55 hover:text-white hover:bg-white/6 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{c.icon}</span> {c.label}
                    </span>
                    <span className={`text-[11px] ${active === c.key ? "text-violet-300/70" : "text-white/25"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Tools list */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white/80">
              {search ? `Results for "${search}"` : active === "all" ? "All Tools" : categories.find((c) => c.key === active)?.label}
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
            <div className="flex flex-col gap-3">
              {paginated.map((tool) => {
                const styles = categoryStyles[tool.category];
                return (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:shadow-xl transition-all duration-200 ${styles.card}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${styles.icon} transition-colors`}>
                      {tool.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`font-semibold text-white/85 text-sm leading-tight group-hover:text-white transition-colors ${styles.glow}`}>
                          {tool.name}
                        </p>
                        {tool.badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles.badge}`}>
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs leading-relaxed truncate">{tool.desc}</p>
                    </div>

                    <span className={`hidden sm:inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${styles.badge} capitalize`}>
                      {tool.category}
                    </span>

                    <svg
                      className="w-4 h-4 text-white/20 group-hover:text-white/50 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ── Glass Pagination ── */}
          {filtered.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/60 transition-all duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {pageNumbers.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-white/30 text-sm select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-10 h-10 rounded-xl border text-sm font-semibold backdrop-blur-md transition-all duration-150 ${
                        p === currentPage
                          ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                          : "bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-white/60 transition-all duration-150"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}