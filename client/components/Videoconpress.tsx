'use client';

import React, { useState, useRef } from 'react';

export default function VideoCompressor() {
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [quality, setQuality]   = useState<string>("medium");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [savedSize, setSavedSize] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (f: File) => {
    setError(null);
    setSuccess(false);
    setSavedSize(null);
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setLoading(false);
    setError("Compression cancelled.");
  };

  const handleCompress = async () => {
    if (!file) { setError("Please select a video file."); return; }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSavedSize(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId  = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 min

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', quality);

    try {
      const response = await fetch('http://localhost:8000/compress-video', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let detail = `Compression failed (HTTP ${response.status})`;
        try { const e = await response.json(); if (e?.detail) detail = e.detail; } catch (_) {}
        throw new Error(detail);
      }

      // Read compressed size from response header
      const compressedSize = response.headers.get('X-Compressed-Size');
      if (compressedSize) {
        const saved = file.size - parseInt(compressedSize);
        const pct   = ((saved / file.size) * 100).toFixed(1);
        setSavedSize(`Saved ${formatFileSize(saved)} (${pct}%) — ${formatFileSize(parseInt(compressedSize))} final`);
      }

      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const base = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.download = `${base}_compressed.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError("Request timed out or was cancelled.");
      } else {
        setError(err.message || 'Connection lost. Is the backend running on port 8000?');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const qualities = [
    { key: "high",   label: "High",   desc: "Minimal compression, best quality" },
    { key: "medium", label: "Medium", desc: "Balanced size and quality" },
    { key: "low",    label: "Low",    desc: "Maximum compression, smaller file" },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-xl">🗜️</div>
          <div>
            <h1 className="text-2xl font-bold">Video Compressor</h1>
            <p className="text-white/40 text-sm">Reduce video file size while keeping great quality.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: File Area */}
          <div className="lg:col-span-3 space-y-5">
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-24 px-6 text-center ${
                  dragging
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">📁</div>
                <p className="text-white font-semibold mb-1">Drop your video file here</p>
                <p className="text-white/35 text-sm mb-5">MP4, MKV, WebM, AVI and more</p>
                <button className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-colors">
                  Choose Video
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#111118]">
                <div className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                  {loading ? (
                    <div className="relative w-16 h-16 mb-4">
                      <svg className="animate-spin w-16 h-16 text-orange-500/30" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <svg className="animate-spin w-16 h-16 text-orange-500 absolute inset-0" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl">🗜️</span>
                    </div>
                  ) : (
                    <div className="text-5xl mb-4 text-orange-500/70">🎥</div>
                  )}

                  <p className="text-white text-sm font-medium max-w-md break-all px-4">{file.name}</p>
                  <p className="text-white/30 text-xs mt-1">Original: {formatFileSize(file.size)}</p>

                  {loading && (
                    <button onClick={handleCancel} className="mt-4 text-xs text-white/40 hover:text-red-400 underline transition-colors">
                      Cancel
                    </button>
                  )}

                  {success && savedSize && (
                    <span className="mt-4 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
                      ✓ {savedSize}
                    </span>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-white/8 bg-white/[0.01] flex items-center justify-between">
                  <span className="text-xs text-white/40">Ready to compress</span>
                  <button
                    onClick={() => { setFile(null); setSuccess(false); setError(null); setSavedSize(null); }}
                    disabled={loading}
                    className="text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Clear File
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Compression Quality</p>

              {qualities.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  disabled={loading}
                  onClick={() => setQuality(q.key)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    quality === q.key
                      ? "bg-orange-600/15 border-orange-500 text-orange-400"
                      : "bg-[#111116] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <p className="font-semibold text-sm">{q.label}</p>
                  <p className={`text-xs mt-0.5 ${quality === q.key ? "text-orange-400/70" : "text-white/30"}`}>{q.desc}</p>
                </button>
              ))}

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs text-white/40 leading-relaxed">
                Output is always <span className="text-white/70 font-semibold">MP4 (H.264)</span> — maximum compatibility across all devices.
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                !file || loading
                  ? "bg-white/5 text-white/25 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/25"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Compressing...
                </>
              ) : (
                <>🗜️ Compress & Download</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}