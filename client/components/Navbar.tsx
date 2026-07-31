"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";


export type MenuKey = "image" | "audio" | "video" | "text";

export interface Tool {
  id: string; // Added for dynamic routing
  name: string;
  desc: string;
  icon: string;
}

const menus: Record<
  MenuKey,
  { label: string; icon: string; color: string; iconColor: string; tools: Tool[] }
> = {
  image: {
    label: "Image Tools",
    icon: "🖼️",
    color: "bg-violet-500/10 hover:bg-violet-500/20",
    iconColor: "bg-violet-500/15 text-violet-400",
    tools: [
      { id: "image-resizer", name: "Image Resizer", desc: "Resize to any dimension", icon: "⤢" },
      { id: "format-converter", name: "Format Converter", desc: "PNG, JPG, WEBP, AVIF", icon: "🔄" },
      { id: "background-remover", name: "Background Remover", desc: "AI-powered bg removal", icon: "✂️" },
      { id: "image-compressor", name: "Image Compressor", desc: "Reduce file size easily", icon: "🗜️" },
      { id: "image-editor", name: "Image Editor", desc: "Crop, rotate, filters", icon: "🎨" },
    ],
  },
  audio: {
    label: "Audio Tools",
    icon: "🎵",
    color: "bg-cyan-500/10 hover:bg-cyan-500/20",
    iconColor: "bg-cyan-500/15 text-cyan-400",
    tools: [
      { id: "audio-converter", name: "Audio Converter", desc: "MP3, WAV, FLAC, OGG", icon: "〰️" },
      { id: "audio-trimmer", name: "Audio Trimmer", desc: "Cut and split audio", icon: "✂️" },
      { id: "volume-booster", name: "Volume Booster", desc: "Normalize audio levels", icon: "🔊" },
      // { id: "noise-remover", name: "Noise Remover", desc: "Clean background noise", icon: "🎙️" },
    ],
  },
  video: {
    label: "Video Tools",
    icon: "🎬",
    color: "bg-red-500/10 hover:bg-red-500/20",
    iconColor: "bg-red-500/15 text-red-400",
    tools: [
      { id: "video-converter", name: "Video Converter", desc: "MP4, MKV, MOV, AVI", icon: "🔄" },
      { id: "video-trimmer", name: "Video Trimmer", desc: "Trim and split clips", icon: "✂️" },
      { id: "video-compressor", name: "Video Compressor", desc: "Reduce video size", icon: "🗜️" },
      { id: "gif-maker", name: "GIF Maker", desc: "Convert video to GIF", icon: "▶️" },
    ],
  },
  text: {
    label: "Text Tools",
    icon: "📝",
    color: "bg-emerald-500/10 hover:bg-emerald-500/20",
    iconColor: "bg-emerald-500/15 text-emerald-400",
    tools: [
      { id: "case-converter", name: "Case Converter", desc: "UPPER, lower, Title", icon: "Aa" },
      { id: "word-counter", name: "Word Counter", desc: "Count words, chars, lines", icon: "🔢" },
      { id: "plagiarism-checker", name: "Plagiarism Checker", desc: "Check for duplicates", icon: "🔍" },
      { id: "markdown-editor", name: "Markdown Editor", desc: "Live preview editor", icon: "Md" },
      { id: "json-formatter", name: "JSON Formatter", desc: "Beautify & validate JSON", icon: "{}" },
    ],
  },
};
export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<MenuKey | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (key: MenuKey) =>
    setOpenMenu((prev) => (prev === key ? null : key));

  const toggleMobile = (key: MenuKey) =>
    setMobileExpanded((prev) => (prev === key ? null : key));

  return (
    <nav
      ref={navRef}
      className="w-full bg-[#0A0A0F] border-b border-white/10 font-sans relative z-50"
    >
      {/* ── Desktop bar ── */}
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex-shrink-0" />
          <span className="font-bold text-xl text-white tracking-tight">
            Tool<span className="text-violet-400">Kit</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {(Object.keys(menus) as MenuKey[]).map((key) => {
            const menu = menus[key];
            const isOpen = openMenu === key;
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isOpen
                      ? "bg-white/8 text-white"
                      : "text-white/55 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{menu.icon}</span>
                  {menu.label}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isOpen && (
                  <div className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-72 bg-[#13131A] border border-white/10 rounded-2xl p-2.5 shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-150">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 pb-2">
                      {menu.label}
                    </p>
                    {menu.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={`/${tool.id}`}
                        className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors duration-150 ${menu.color}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${menu.iconColor}`}
                        >
                          {tool.icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white leading-tight">
                            {tool.name}
                          </p>
                          <p className="text-xs text-white/45">{tool.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link
            href="/tools"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            All Tools
          </Link>
        </div>

        {/* Desktop right buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* <button className="px-4 py-2 rounded-lg text-sm font-medium text-white/55 border border-white/12 hover:text-white hover:border-white/25 transition-all duration-150">
            Sign in
          </button> */}
          <button className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-150">
            <Link href={"/tools"}>
            Get started
            </Link>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 bg-white/70 rounded transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 bg-white/70 rounded transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 bg-white/70 rounded transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0A0A0F] px-4 py-3 space-y-1">
          {(Object.keys(menus) as MenuKey[]).map((key) => {
            const menu = menus[key];
            const isExpanded = mobileExpanded === key;
            return (
              <div key={key}>
                <button
                  onClick={() => toggleMobile(key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150"
                >
                  <span className="flex items-center gap-2">
                    <span>{menu.icon}</span>
                    {menu.label}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/8 pl-3">
                    {menu.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href="#"
                        className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-white/55 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${menu.iconColor}`}>
                          {tool.icon}
                        </span>
                        <div>
                          <p className="text-white/85 font-medium text-sm leading-tight">{tool.name}</p>
                          <p className="text-white/35 text-xs">{tool.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <Link href="#" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/5 transition-all">
            All Tools
          </Link>

          <div className="flex gap-2 pt-2 border-t border-white/8">
            {/* <button className="flex-1 py-2 rounded-lg text-sm font-medium text-white/60 border border-white/12 hover:text-white hover:border-white/25 transition-all">
              Sign in
            </button> */}
            <button className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors">
              <Link href={'/tools'}>
              Get started
              </Link>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}