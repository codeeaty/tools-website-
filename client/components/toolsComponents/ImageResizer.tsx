"use client";

import { useState, useRef, useCallback } from "react";

type ResizeMode = "custom" | "percentage" | "preset";

const presets = [
  { label: "HD", w: 1280, h: 720 },
  { label: "Full HD", w: 1920, h: 1080 },
  { label: "4K", w: 3840, h: 2160 },
  { label: "Instagram", w: 1080, h: 1080 },
  { label: "Twitter", w: 1500, h: 500 },
  { label: "Facebook", w: 1200, h: 630 },
  { label: "Thumbnail", w: 1280, h: 720 },
  { label: "Avatar", w: 400, h: 400 },
];

const formats = ["JPEG", "PNG", "WEBP", "AVIF"];

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [origSize, setOrigSize] = useState({ w: 0, h: 0 });
  const [mode, setMode] = useState<ResizeMode>("custom");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [percentage, setPercentage] = useState(100);
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState("JPEG");
  const [quality, setQuality] = useState(90);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setResultUrl(null);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setOrigSize({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleWidthChange = (val: string) => {
    setWidth(val);
    if (lockRatio && origSize.w && origSize.h) {
      const ratio = origSize.h / origSize.w;
      setHeight(String(Math.round(Number(val) * ratio)));
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    if (lockRatio && origSize.w && origSize.h) {
      const ratio = origSize.w / origSize.h;
      setWidth(String(Math.round(Number(val) * ratio)));
    }
  };

  const applyPreset = (p: { w: number; h: number }) => {
    setWidth(String(p.w));
    setHeight(String(p.h));
    setLockRatio(false);
  };

  const fileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleResize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      let finalW = parseInt(width);
      let finalH = parseInt(height);
      if (mode === "percentage") {
        finalW = Math.round(origSize.w * (percentage / 100));
        finalH = Math.round(origSize.h * (percentage / 100));
      }

      formData.append("width", String(finalW));
      formData.append("height", String(finalH));
      formData.append("format", format.toLowerCase());
      formData.append("quality", String(quality));
      formData.append("maintain_aspect_ratio", String(lockRatio && mode !== "custom"));

      const res = await fetch("http://localhost:8000/resize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Resize failed");
      }

      const blob = await res.blob();
      setResultSize(fileSize(blob.size));
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `resized.${format.toLowerCase()}`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      {/* Glow background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">
              ⤢
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Image Resizer</h1>
              <p className="text-white/40 text-sm">Resize images to any dimension in seconds</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {["Free", "No sign-up", "Browser-based", "Batch soon"].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/45">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT — Upload + Preview */}
          <div className="lg:col-span-3 space-y-5">
            {/* Drop zone */}
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-20 px-6 text-center ${
                  dragging
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                  🖼️
                </div>
                <p className="text-white font-semibold mb-1">Drop your image here</p>
                <p className="text-white/35 text-sm mb-5">PNG, JPG, WEBP, AVIF supported</p>
                <button className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                  Choose File
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                {/* Image preview */}
                <div className="relative aspect-video bg-[#111118] flex items-center justify-center overflow-hidden">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setResultUrl(null); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
                {/* File info */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
                  <div>
                    <p className="text-sm font-medium text-white/80 truncate max-w-[220px]">{file.name}</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {origSize.w} × {origSize.h}px • {fileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                  >
                    Change
                  </button>
                  <input ref={inputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
              </div>
            )}

            {/* Result preview */}
            {resultUrl && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden">
                <div className="relative aspect-video bg-[#111118] flex items-center justify-center overflow-hidden">
                  <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    ✓ Resized
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-emerald-500/15">
                  <div>
                    <p className="text-sm font-medium text-white/80">Output ready</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {width} × {height}px • {resultSize} • {format}
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                  >
                    ⬇ Download
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* RIGHT — Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mode tabs */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Resize Mode</p>
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {(["custom", "percentage", "preset"] as ResizeMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                      mode === m
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {mode === "custom" && (
                  <>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-white/40 mb-1.5 block">Width (px)</label>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                          placeholder="1920"
                        />
                      </div>
                      <button
                        onClick={() => setLockRatio((p) => !p)}
                        className={`self-end mb-0.5 w-9 h-9 rounded-xl border flex items-center justify-center text-base transition-colors ${
                          lockRatio ? "border-violet-500/50 bg-violet-500/15 text-violet-400" : "border-white/10 text-white/25 hover:text-white/50"
                        }`}
                        title="Lock aspect ratio"
                      >
                        🔗
                      </button>
                      <div className="flex-1">
                        <label className="text-xs text-white/40 mb-1.5 block">Height (px)</label>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                          placeholder="1080"
                        />
                      </div>
                    </div>
                    {lockRatio && (
                      <p className="text-xs text-violet-400/70 flex items-center gap-1">
                        <span>🔗</span> Aspect ratio locked
                      </p>
                    )}
                  </>
                )}

                {mode === "percentage" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-white/40">Scale</label>
                      <span className="text-sm font-bold text-violet-400">{percentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={1} max={200} value={percentage}
                      onChange={(e) => setPercentage(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-xs text-white/25 mt-1">
                      <span>1%</span><span>100%</span><span>200%</span>
                    </div>
                    {origSize.w > 0 && (
                      <p className="text-xs text-white/35 mt-2 text-center">
                        Output: {Math.round(origSize.w * percentage / 100)} × {Math.round(origSize.h * percentage / 100)}px
                      </p>
                    )}
                  </div>
                )}

                {mode === "preset" && (
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p)}
                        className={`text-left px-3 py-2.5 rounded-xl border transition-all text-xs ${
                          width === String(p.w) && height === String(p.h)
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-white/8 bg-white/[0.02] text-white/55 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <p className="font-semibold">{p.label}</p>
                        <p className="text-white/30 text-[10px]">{p.w}×{p.h}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Format & Quality */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Output Format</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                        format === f
                          ? "bg-violet-600 text-white"
                          : "bg-white/5 text-white/45 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {format !== "PNG" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-white/40">Quality</label>
                    <span className="text-sm font-bold text-violet-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10} max={100} value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-white/25 mt-1">
                    <span>Smaller</span><span>Balanced</span><span>Best</span>
                  </div>
                </div>
              )}
            </div>

            {/* Resize button */}
            <button
              onClick={handleResize}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !file || loading
                  ? "bg-white/5 text-white/25 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Resizing…
                </>
              ) : (
                <>⤢ Resize Image</>
              )}
            </button>

            {/* Tips */}
            <div className="rounded-xl border border-white/6 bg-white/[0.02] px-4 py-3">
              <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-2">Tips</p>
              <ul className="space-y-1.5 text-xs text-white/35">
                <li>• Use WEBP for best compression with quality</li>
                <li>• PNG is lossless — great for screenshots</li>
                <li>• Lock ratio to avoid stretching</li>
                <li>• Quality 80–90% is ideal for web images</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}