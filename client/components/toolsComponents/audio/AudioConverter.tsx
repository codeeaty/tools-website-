"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const TARGET_FORMATS = ["mp3", "wav", "ogg", "flac"];
const BITRATES = ["128k", "192k", "256k", "320k"];

export default function AudioConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("192k");
  
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-clean temporary Blob instances from memory cache
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const selectedFile = Array.from(incoming).find((f) => f.type.startsWith("audio/"));
    if (!selectedFile) {
      setError("Please drop a valid audio track resource file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResultUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
    setPreviewUrl((p) => {
      if (p) URL.revokeObjectURL(p);
      return URL.createObjectURL(selectedFile);
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const clearWorkspace = useCallback(() => {
    setFile(null);
    setPreviewUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
    setResultUrl((p) => { if (p) URL.revokeObjectURL(p); return null; });
    setError(null);
  }, []);

  const handleConversion = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_format", targetFormat);
    formData.append("bitrate", bitrate);

    try {
      const res = await fetch("http://localhost:8000/convert-audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Encoding failure on audio matrix pipelines.");
      }

      const blob = await res.blob();
      setResultUrl((p) => {
        if (p) URL.revokeObjectURL(p);
        return URL.createObjectURL(blob);
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Internal system crash transcoding audio.");
    } 
  }, [file, targetFormat, bitrate]);

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header Block */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">🎵</div>
          <div>
            <h1 className="text-2xl font-bold">AI Audio Converter</h1>
            <p className="text-white/40 text-sm">Transcode media architectures cleanly to standard formats.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Stage Workspace */}
          <div className="lg:col-span-3 space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden min-h-[300px] flex items-center justify-center ${
                dragging ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {!file ? (
                <div 
                  onClick={() => inputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer hover:bg-white/[0.01] w-full h-full"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">🎵</div>
                  <p className="text-white font-semibold mb-1">Drop audio track layer here</p>
                  <p className="text-white/35 text-sm mb-5">Supports MP3, WAV, M4A, OGG, FLAC</p>
                  <div className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                    Choose File
                  </div>
                </div>
              ) : (
                <div className="p-6 w-full flex flex-col justify-center items-center gap-6">
                  {/* Playback Monitors */}
                  <div className="w-full space-y-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Source Player Monitor</p>
                      {previewUrl && <audio src={previewUrl} controls className="w-full h-10 accent-violet-500" />}
                    </div>

                    {resultUrl && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl animate-fade-in">
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Converted Stream Monitor</p>
                        <audio src={resultUrl} controls className="w-full h-10 accent-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Setting Control Dashboard Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Staged Track</p>
                <h3 className="text-sm font-semibold text-white/80 truncate">{file ? file.name : "No asset context targeted"}</h3>
              </div>

              {/* Param Configurations */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Convert Target</label>
                  <select 
                    value={targetFormat} 
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  >
                    {TARGET_FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                  </select>
                </div>

                {targetFormat === "mp3" && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">Bitrate Profile</label>
                    <select 
                      value={bitrate} 
                      onChange={(e) => setBitrate(e.target.value)}
                      className="w-full bg-[#12121A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      {BITRATES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              {file && (
                <button 
                  onClick={clearWorkspace}
                  className="pt-2 text-xs text-red-400 hover:text-red-300 transition-colors block border-t border-white/5 w-full text-left"
                >
                  Unstage Audio Object ✕
                </button>
              )}
            </div>

            {/* Form Actions */}
            {!resultUrl ? (
              <button
                onClick={handleConversion}
                disabled={!file || loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  !file || loading
                    ? "bg-white/5 text-white/25 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Encoding Audio Nodes...
                  </>
                ) : (
                  <>🔄 Convert Audio Format</>
                )}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, "")}_converted.${targetFormat}`}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-center block bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
              >
                ⬇ Download Transcoded File
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}