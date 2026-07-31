"use client";

import { useState, useRef, useCallback } from "react";

type BGColor = "transparent" | "white" | "black" | "custom";

const bgColors: { key: BGColor; label: string; preview: string }[] = [
  { key: "transparent", label: "Transparent", preview: "bg-[url('/checkerboard.png')] bg-repeat" },
  { key: "white",       label: "White",       preview: "bg-white" },
  { key: "black",       label: "Black",       preview: "bg-black" },
  { key: "custom",      label: "Custom",      preview: "bg-gradient-to-br from-violet-500 to-cyan-500" },
];

const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function BackgroundRemover() {
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [bgColor, setBgColor]     = useState<BGColor>("transparent");
  const [customColor, setCustomColor] = useState("#6366f1");
  const [compareMode, setCompareMode] = useState(false);
  const [sliderX, setSliderX]     = useState(50);
  const [outputFormat, setOutputFormat] = useState<"png" | "webp">("png");

  const inputRef    = useRef<HTMLInputElement>(null);
  const compareRef  = useRef<HTMLDivElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    setResultUrl(null);
    setError(null);
    setCompareMode(false);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleRemove = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", outputFormat);
      if (bgColor !== "transparent") {
        formData.append("bg_color", bgColor === "custom" ? customColor : bgColor);
      }

      const res = await fetch("http://localhost:8000/remove-background", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Background removal failed");
      }

      const blob = await res.blob();
      setResultSize(fileSize(blob.size));
      setResultUrl(URL.createObjectURL(blob));
      setCompareMode(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_nobg.${outputFormat}`;
    a.click();
  };

  // Compare slider mouse drag
  const handleSliderDrag = (e: React.MouseEvent) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderX(x);
  };

  const checkerStyle = {
    backgroundImage:
      "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
    backgroundSize: "16px 16px",
    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  };

  const getBgStyle = () => {
    if (bgColor === "transparent") return checkerStyle;
    if (bgColor === "white") return { backgroundColor: "#ffffff" };
    if (bgColor === "black") return { backgroundColor: "#000000" };
    if (bgColor === "custom") return { backgroundColor: customColor };
    return checkerStyle;
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-xl">✂️</div>
          <div>
            <h1 className="text-2xl font-bold">Background Remover</h1>
            <p className="text-white/40 text-sm">Remove image backgrounds instantly with AI — free & private</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT — Upload + Preview */}
          <div className="lg:col-span-3 space-y-5">

            {/* Upload / Preview area */}
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-20 px-6 text-center ${
                  dragging
                    ? "border-pink-500 bg-pink-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">✂️</div>
                <p className="text-white font-semibold mb-1">Drop your image here</p>
                <p className="text-white/35 text-sm mb-5">PNG, JPG, WEBP supported • Works best with people, objects & logos</p>
                <button className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold transition-colors">
                  Choose Image
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Before / After tabs */}
                {resultUrl && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCompareMode(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !compareMode ? "bg-pink-600 text-white" : "bg-white/5 text-white/40 hover:text-white"
                      }`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setCompareMode(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        compareMode ? "bg-pink-600 text-white" : "bg-white/5 text-white/40 hover:text-white"
                      }`}
                    >
                      Slider Compare
                    </button>
                  </div>
                )}

                {/* Side by side */}
                {(!compareMode || !resultUrl) && (
                  <div className={`grid ${resultUrl ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                    {/* Original */}
                    <div className="rounded-2xl border border-white/10 overflow-hidden">
                      <div className="bg-[#111118] aspect-square flex items-center justify-center overflow-hidden">
                        <img src={preview!} alt="Original" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="px-3 py-2 border-t border-white/8 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-white/60">Original</p>
                          <p className="text-[10px] text-white/30">{fileSize(file.size)}</p>
                        </div>
                        <button onClick={() => { setFile(null); setPreview(null); setResultUrl(null); }}
                          className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Result */}
                    {resultUrl && (
                      <div className="rounded-2xl border border-pink-500/25 overflow-hidden">
                        <div className="aspect-square flex items-center justify-center overflow-hidden" style={getBgStyle()}>
                          <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="px-3 py-2 border-t border-pink-500/15 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-pink-400">✓ Background Removed</p>
                            <p className="text-[10px] text-white/30">{resultSize}</p>
                          </div>
                          <button onClick={handleDownload}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-semibold transition-colors">
                            ⬇ Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Slider compare */}
                {compareMode && resultUrl && (
                  <div
                    ref={compareRef}
                    className="relative rounded-2xl border border-white/10 overflow-hidden aspect-video cursor-ew-resize select-none"
                    onMouseMove={(e) => e.buttons === 1 && handleSliderDrag(e)}
                    onClick={handleSliderDrag}
                  >
                    {/* Result (bottom layer with bg) */}
                    <div className="absolute inset-0 flex items-center justify-center" style={getBgStyle()}>
                      <img src={resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                    </div>
                    {/* Original (top layer, clipped) */}
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-[#111118] overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}
                    >
                      <img src={preview!} alt="Original" className="max-w-full max-h-full object-contain" />
                    </div>
                    {/* Divider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                      style={{ left: `${sliderX}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                        <span className="text-black text-xs font-bold">↔</span>
                      </div>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium">Original</div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-pink-400 text-[10px] font-medium">No BG</div>
                  </div>
                )}

                {/* Loading placeholder */}
                {loading && (
                  <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 aspect-video flex flex-col items-center justify-center gap-3">
                    <div className="relative w-14 h-14">
                      <svg className="animate-spin w-14 h-14 text-pink-500/30" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <svg className="animate-spin w-14 h-14 text-pink-500 absolute inset-0" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg">✂️</span>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 text-sm font-medium">Removing background…</p>
                      <p className="text-white/30 text-xs mt-0.5">AI is processing your image</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}

            {/* Download big button */}
            {resultUrl && (
              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                ⬇ Download Image ({outputFormat.toUpperCase()})
              </button>
            )}
          </div>

          {/* RIGHT — Controls */}
          <div className="lg:col-span-2 space-y-4">

            {/* Background color */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Background Color</p>
              <div className="grid grid-cols-2 gap-2">
                {bgColors.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setBgColor(c.key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-sm ${
                      bgColor === c.key
                        ? "border-pink-500/50 bg-pink-500/10 text-white"
                        : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex-shrink-0 border border-white/15 ${c.preview}`} />
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom color picker */}
              {bgColor === "custom" && (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-medium text-white/60">Custom color</p>
                    <p className="text-xs text-white/30">{customColor}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Output format */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Output Format</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "png" as const,  label: "PNG",  desc: "Supports transparency" },
                  { key: "webp" as const, label: "WEBP", desc: "Small + transparent" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setOutputFormat(f.key)}
                    className={`py-3 px-3 rounded-xl border text-left transition-all ${
                      outputFormat === f.key
                        ? "border-pink-500/50 bg-pink-500/10 text-white"
                        : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Best Results</p>
              <ul className="space-y-2 text-xs text-white/40">
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Use clear, high-contrast images</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Works best for people & products</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> PNG keeps transparency intact</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> WEBP gives smaller file with transparency</li>
                <li className="flex gap-2"><span className="text-pink-400">✓</span> Max recommended size: 10MB</li>
              </ul>
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !file || loading
                  ? "bg-white/5 text-white/25 cursor-not-allowed"
                  : "bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/25"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>✂️ Remove Background</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}