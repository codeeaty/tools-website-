"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function NoiseRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Noise profiling configuration (dB suppression level)
  const [reductionLevel, setReductionLevel] = useState<number>(12);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Clear tracking pointers on unmount parameters
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const handleFiles = useCallback((incoming: FileList | File[]) => {
    const selectedFile = Array.from(incoming).find(
      (f) => f.type.startsWith("audio/") || f.type === "video/mp4"
    );
    if (!selectedFile) {
      setError("Please drop a valid audio track or MP4 container.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, []);

  const handleDenoise = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("reduction_db", reductionLevel.toString());

    try {
      const res = await fetch("http://localhost:8000/remove-noise", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "De-noising tracking calculation error.");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error running noise cancellation loops.");
    } finally {
      setLoading(false);
    }
  }, [file, reductionLevel]);

  const clearWorkspace = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setReductionLevel(12);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Module Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">🪄</div>
          <div>
            <h1 className="text-2xl font-bold">Audio Noise Remover</h1>
            <p className="text-white/40 text-sm">Strip frequency hums and ambient microphone noise arrays instantly.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* File Monitor Drop Area */}
          <div className="lg:col-span-3 space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
              className={`relative rounded-2xl border-2 border-dashed flex items-center justify-center min-h-[300px] transition-all ${
                dragging ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {!file ? (
                <div onClick={() => inputRef.current?.click()} className="text-center cursor-pointer p-10 w-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">🪄</div>
                  <p className="font-semibold mb-1">Drop noisy audio track layer here</p>
                  <p className="text-white/35 text-xs mb-5">Supports MP3, WAV, FLAC, and MP4</p>
                  <button className="px-5 py-2 rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-500 transition-colors">Choose File</button>
                </div>
              ) : (
                <div className="p-6 w-full space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Original Dirty Track</p>
                    {previewUrl && <audio src={previewUrl} controls className="w-full h-10" />}
                  </div>

                  {resultUrl && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Isolated Clean Output</p>
                      <audio src={resultUrl} controls autoPlay className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}
              <input ref={inputRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </div>

            {error && <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">⚠ {error}</div>}
          </div>

          {/* Config Parameters Control */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Active File Selected</p>
                <h3 className="text-sm font-semibold text-white/80 truncate">{file ? file.name : "No asset loaded"}</h3>
              </div>

              {/* Denoise Suppression Slider Control */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/40 uppercase">Denoise Threshold</span>
                  <span className="font-mono text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-md text-sm">
                    {reductionLevel} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="30"
                  step="1"
                  value={reductionLevel}
                  onChange={(e) => setReductionLevel(parseInt(e.target.value))}
                  className="w-full accent-violet-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/20 font-mono">
                  <span>4 dB (Light)</span>
                  <span>12 dB (Standard)</span>
                  <span>30 dB (Heavy Clean)</span>
                </div>
              </div>

              {file && (
                <button onClick={clearWorkspace} className="pt-2 text-xs text-red-400 hover:text-red-300 transition-colors block border-t border-white/5 w-full text-left">
                  Clear Asset ✕
                </button>
              )}
            </div>

            {/* Form Node Process Execution Button */}
            {!resultUrl ? (
              <button
                onClick={handleDenoise}
                disabled={!file || loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  !file || loading ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                }`}
              >
                {loading ? "Analyzing Audio Spectrals..." : "🪄 Purge Background Noise"}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, "")}_clean.${file?.name.split('.').pop() === 'mp4' ? 'mp3' : file?.name.split('.').pop()}`}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-center block bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
              >
                ⬇ Download Clean File
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}