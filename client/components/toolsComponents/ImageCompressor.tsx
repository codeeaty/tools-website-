"use client";

import { useState, useRef, useCallback } from "react";

type CompressMode = "lossy" | "lossless";
type OutputFormat = "jpeg" | "png" | "webp" | "avif";

const formats: { key: OutputFormat; label: string; desc: string; lossy: boolean }[] = [
  { key: "jpeg", label: "JPEG", desc: "Best for photos",     lossy: true  },
  { key: "webp", label: "WEBP", desc: "Best compression",    lossy: true  },
  { key: "avif", label: "AVIF", desc: "Next-gen tiny files", lossy: true  },
  { key: "png",  label: "PNG",  desc: "Lossless only",       lossy: false },
];

const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const savings = (original: number, compressed: number) => {
  const pct = ((original - compressed) / original) * 100;
  return pct > 0 ? `${pct.toFixed(1)}% smaller` : "No reduction";
};

type FileEntry = {
  file: File;
  preview: string;
  id: string;
};

type ResultEntry = {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  url: string;
  format: OutputFormat;
};

export default function ImageCompressor() {
  const [entries, setEntries]       = useState<FileEntry[]>([]);
  const [results, setResults]       = useState<ResultEntry[]>([]);
  const [mode, setMode]             = useState<CompressMode>("lossy");
  const [format, setFormat]         = useState<OutputFormat>("webp");
  const [quality, setQuality]       = useState(80);
  const [dragging, setDragging]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newEntries: FileEntry[] = arr.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      id: Math.random().toString(36).slice(2),
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    setResults([]);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const totalSaved = results.reduce(
    (acc, r) => acc + Math.max(0, r.originalSize - r.compressedSize),
    0
  );

  const handleCompress = async () => {
    if (!entries.length) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const out: ResultEntry[] = [];

    try {
      for (let i = 0; i < entries.length; i++) {
        const { file, id } = entries[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", format);
        formData.append("quality", String(quality));
        formData.append("lossless", String(mode === "lossless"));

        const res = await fetch("http://localhost:8000/compress", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Compression failed");
        }

        const blob = await res.blob();
        const baseName = file.name.replace(/\.[^/.]+$/, "");

        out.push({
          id,
          name: `${baseName}_compressed.${format}`,
          originalSize: file.size,
          compressedSize: blob.size,
          url: URL.createObjectURL(blob),
          format,
        });

        setProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      setResults(out);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = () => {
    results.forEach((r) => {
      const a = document.createElement("a");
      a.href = r.url;
      a.download = r.name;
      a.click();
    });
  };

  const losslessOnly = format === "png";

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xl">🗜️</div>
          <div>
            <h1 className="text-2xl font-bold">Image Compressor</h1>
            <p className="text-white/40 text-sm">Reduce image file size without losing visible quality</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── LEFT ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => entries.length === 0 && inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed transition-all duration-200 ${
                dragging
                  ? "border-emerald-500 bg-emerald-500/10"
                  : entries.length === 0
                  ? "cursor-pointer border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                    🗜️
                  </div>
                  <p className="text-white font-semibold mb-1">Drop images to compress</p>
                  <p className="text-white/35 text-sm mb-5">PNG, JPG, WEBP, AVIF — multiple files supported</p>
                  <button className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                    Choose Files
                  </button>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {entries.map((entry) => {
                    const result = results.find((r) => r.id === entry.id);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl p-3"
                      >
                        {/* Thumb */}
                        <img
                          src={entry.preview}
                          alt={entry.file.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{entry.file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-white/35">{fileSize(entry.file.size)}</span>
                            {result && (
                              <>
                                <span className="text-white/20 text-xs">→</span>
                                <span className="text-xs text-white/60">{fileSize(result.compressedSize)}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  result.compressedSize < entry.file.size
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-white/8 text-white/35"
                                }`}>
                                  {savings(entry.file.size, result.compressedSize)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress / Download */}
                        {loading && !result && (
                          <svg className="animate-spin w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}

                        {result && (
                          <a
                            href={result.url}
                            download={result.name}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/25 text-emerald-400 hover:text-white text-[10px] font-semibold transition-all flex-shrink-0"
                          >
                            ⬇
                          </a>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/15 hover:text-red-400 text-white/25 flex items-center justify-center text-xs transition-colors flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  {/* Add more */}
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-white/35 text-sm hover:text-white/60 hover:border-white/20 transition-colors"
                  >
                    + Add more images
                  </button>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {/* Progress bar */}
            {loading && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>Compressing {entries.length} image{entries.length > 1 ? "s" : ""}…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}

            {/* Summary bar */}
            {results.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-5 py-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-emerald-400">
                    ✓ {results.length} image{results.length > 1 ? "s" : ""} compressed
                  </p>
                  <p className="text-xs text-white/40">
                    Total saved:{" "}
                    <span className="text-white/70 font-medium">{fileSize(totalSaved)}</span>
                  </p>
                </div>
                {results.length > 1 && (
                  <button
                    onClick={downloadAll}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                  >
                    ⬇ Download All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT — Controls ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Mode */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Compression Mode</p>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {(["lossy", "lossless"] as CompressMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      if (m === "lossless") setFormat("png");
                      else setFormat("webp");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                      mode === m
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/30 mt-2.5 leading-relaxed">
                {mode === "lossy"
                  ? "Reduces file size by removing some image data. Barely noticeable at 75%+ quality."
                  : "No quality loss — only removes metadata and optimizes encoding."}
              </p>
            </div>

            {/* Format */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Output Format</p>
              <div className="grid grid-cols-2 gap-2">
                {formats
                  .filter((f) => (mode === "lossless" ? !f.lossy : true))
                  .map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      className={`py-3 px-3 rounded-xl border text-left transition-all ${
                        format === f.key
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                          : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <p className="text-sm font-bold">{f.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p>
                    </button>
                  ))}
              </div>
            </div>

            {/* Quality slider */}
            {!losslessOnly && mode === "lossy" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Quality</p>
                  <span className="text-sm font-bold text-emerald-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10} max={100} value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                  <span>Max compression</span>
                  <span>Original quality</span>
                </div>

                {/* Quality presets */}
                <div className="flex gap-1.5 mt-3">
                  {[
                    { label: "Web",  value: 70, color: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
                    { label: "Good", value: 80, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                    { label: "Best", value: 90, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setQuality(p.value)}
                      className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        quality === p.value ? p.color : "border-white/8 text-white/30 hover:text-white/60"
                      }`}
                    >
                      {p.label} {p.value}%
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Tips</p>
              <ul className="space-y-2 text-xs text-white/40">
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>WEBP gives 30–50% smaller than JPEG</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>80% quality looks same as original</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>Use AVIF for the smallest file size</li>
                <li className="flex gap-2"><span className="text-emerald-400">✓</span>PNG lossless for logos & screenshots</li>
              </ul>
            </div>

            {/* Compress button */}
            <button
              onClick={handleCompress}
              disabled={!entries.length || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !entries.length || loading
                  ? "bg-white/5 text-white/25 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Compressing…
                </>
              ) : (
                <>🗜️ Compress {entries.length > 1 ? `${entries.length} Images` : "Image"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}