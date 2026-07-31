"use client";

import { useState, useRef, useCallback } from "react";

type FormatKey = "jpeg" | "png" | "webp" | "avif" | "gif" | "bmp";

const formats: { key: FormatKey; label: string; desc: string; color: string }[] = [
  { key: "jpeg", label: "JPEG", desc: "Best for photos", color: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
  { key: "png",  label: "PNG",  desc: "Lossless quality", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
  { key: "webp", label: "WEBP", desc: "Modern & small", color: "border-violet-500/40 bg-violet-500/10 text-violet-400" },
  { key: "avif", label: "AVIF", desc: "Next-gen format", color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400" },
  { key: "gif",  label: "GIF",  desc: "Animated images", color: "border-pink-500/40 bg-pink-500/10 text-pink-400" },
  { key: "bmp",  label: "BMP",  desc: "Uncompressed raw", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
];

const FORMAT_MIME: Record<FormatKey, string> = {
  jpeg: "image/jpeg",
  png:  "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif:  "image/gif",
  bmp:  "image/bmp",
};

type ConvertedFile = {
  name: string;
  url: string;
  size: string;
  format: FormatKey;
};

const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function FormatConverter() {
  const [files, setFiles]           = useState<File[]>([]);
  const [previews, setPreviews]     = useState<string[]>([]);
  const [targetFormat, setTargetFormat] = useState<FormatKey>("webp");
  const [quality, setQuality]       = useState(90);
  const [dragging, setDragging]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [converted, setConverted]   = useState<ConvertedFile[]>([]);
  const [error, setError]           = useState<string | null>(null);
  const [progress, setProgress]     = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
    arr.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPreviews((prev) => [...prev, url]);
    });
    setConverted([]);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setConverted([]);
  };

  const getSourceFormat = (file: File) =>
    file.type.split("/")[1]?.toUpperCase() ?? "IMG";

  const handleConvert = async () => {
    if (!files.length) return;
    setLoading(true);
    setError(null);
    setConverted([]);
    setProgress(0);

    const results: ConvertedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", targetFormat);
        formData.append("quality", String(quality));

        const res = await fetch("http://localhost:8000/convert", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Conversion failed");
        }

        const blob = await res.blob();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        results.push({
          name: `${baseName}.${targetFormat}`,
          url: URL.createObjectURL(blob),
          size: fileSize(blob.size),
          format: targetFormat,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setConverted(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = () => {
    converted.forEach((f) => {
      const a = document.createElement("a");
      a.href = f.url;
      a.download = f.name;
      a.click();
    });
  };

  const selectedFormat = formats.find((f) => f.key === targetFormat)!;

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-xl">🔄</div>
          <div>
            <h1 className="text-2xl font-bold">Format Converter</h1>
            <p className="text-white/40 text-sm">Convert images between PNG, JPG, WEBP, AVIF, GIF and BMP</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-3 space-y-5">

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !files.length && inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                dragging
                  ? "border-cyan-500 bg-cyan-500/10"
                  : files.length
                  ? "border-white/10 bg-white/[0.02] cursor-default"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] cursor-pointer"
              }`}
            >
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">🔄</div>
                  <p className="text-white font-semibold mb-1">Drop images here</p>
                  <p className="text-white/35 text-sm mb-5">PNG, JPG, WEBP, AVIF, GIF, BMP — multiple files supported</p>
                  <button className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold transition-colors">
                    Choose Files
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl p-3">
                      <img
                        src={previews[i]}
                        alt={file.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{file.name}</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          {getSourceFormat(file)} • {fileSize(file.size)}
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-white/20 text-sm">→</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${selectedFormat.color}`}>
                          {selectedFormat.label}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/30 flex items-center justify-center text-sm transition-colors flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

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
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>Converting…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-300"
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

            {/* Results */}
            {converted.length > 0 && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/15">
                  <p className="text-sm font-semibold text-emerald-400">
                    ✓ {converted.length} file{converted.length > 1 ? "s" : ""} converted
                  </p>
                  {converted.length > 1 && (
                    <button
                      onClick={downloadAll}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      ⬇ Download All
                    </button>
                  )}
                </div>
                <div className="divide-y divide-white/5">
                  {converted.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white/80">{f.name}</p>
                        <p className="text-xs text-white/35">{f.size} • {f.format.toUpperCase()}</p>
                      </div>
                      <a
                        href={f.url}
                        download={f.name}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
                      >
                        ⬇ Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Controls */}
          <div className="lg:col-span-2 space-y-4">

            {/* Target format */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Convert To</p>
              <div className="grid grid-cols-3 gap-2">
                {formats.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTargetFormat(f.key)}
                    className={`py-3 px-2 rounded-xl border text-center transition-all duration-150 ${
                      targetFormat === f.key
                        ? f.color + " border-opacity-100"
                        : "border-white/8 bg-white/[0.02] text-white/40 hover:text-white/70 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            {targetFormat !== "png" && targetFormat !== "bmp" && targetFormat !== "gif" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Quality</p>
                  <span className="text-sm font-bold text-cyan-400">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10} max={100} value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>Smaller file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}

            {/* Format info */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Format Guide</p>
              <div className="space-y-2.5 text-xs text-white/45">
                <div className="flex gap-2"><span className="text-orange-400 font-bold w-10">JPEG</span><span>Photos & images with rich colors</span></div>
                <div className="flex gap-2"><span className="text-blue-400 font-bold w-10">PNG</span><span>Transparency, screenshots, logos</span></div>
                <div className="flex gap-2"><span className="text-violet-400 font-bold w-10">WEBP</span><span>Best for web — small + quality</span></div>
                <div className="flex gap-2"><span className="text-cyan-400 font-bold w-10">AVIF</span><span>Next-gen, smallest file size</span></div>
                <div className="flex gap-2"><span className="text-pink-400 font-bold w-10">GIF</span><span>Animations, simple graphics</span></div>
                <div className="flex gap-2"><span className="text-emerald-400 font-bold w-10">BMP</span><span>Uncompressed, max quality</span></div>
              </div>
            </div>

            {/* Convert button */}
            <button
              onClick={handleConvert}
              disabled={!files.length || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !files.length || loading
                  ? "bg-white/5 text-white/25 cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Converting…
                </>
              ) : (
                <>🔄 Convert {files.length > 1 ? `${files.length} Images` : "Image"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}