"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export default function VolumeBooster() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Amplification factor configuration
  const [multiplier, setMultiplier] = useState<number>(1.5);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent memory context leaks
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
      setError("Please drop a valid audio file or MP4 video container.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, []);

  const handleBoost = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("volume_multiplier", multiplier.toString());

    try {
      const res = await fetch("http://localhost:8000/boost-volume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Volume calculation block error.");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error processing volume boosting pipeline.");
    } finally {
      setLoading(false);
    }
  }, [file, multiplier]);

  const clearWorkspace = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setMultiplier(1.5);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Block */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">🔊</div>
          <div>
            <h1 className="text-2xl font-bold">Volume Booster</h1>
            <p className="text-white/40 text-sm">Amplify sound ranges cleanly via algorithmic decibel shifting.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main Stage Panel Area */}
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
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">🔊</div>
                  <p className="font-semibold mb-1">Drop audio element or video track here</p>
                  <p className="text-white/35 text-xs mb-5">Supports MP3, WAV, FLAC, and MP4</p>
                  <button className="px-5 py-2 rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-500 transition-colors">Choose File</button>
                </div>
              ) : (
                <div className="p-6 w-full space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Original Track Input</p>
                    {previewUrl && <audio src={previewUrl} controls className="w-full h-10" />}
                  </div>

                  {resultUrl && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Amplified Result Monitor</p>
                      <audio src={resultUrl} controls autoPlay className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}
              <input ref={inputRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </div>

            {error && <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">⚠ {error}</div>}
          </div>

          {/* Config Layout Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Active File Staged</p>
                <h3 className="text-sm font-semibold text-white/80 truncate">{file ? file.name : "No asset loaded"}</h3>
              </div>

              {/* Slider Control Module */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white/40 uppercase">Boost Level</span>
                  <span className="font-mono text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-md text-sm">
                    {Math.round(multiplier * 100)}% ({multiplier}x)
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-white/20 font-mono">
                  <span>100% (Normal)</span>
                  <span>250%</span>
                  <span>400% (Max Safe)</span>
                </div>
              </div>

              {file && (
                <button onClick={clearWorkspace} className="pt-2 text-xs text-red-400 hover:text-red-300 transition-colors block border-t border-white/5 w-full text-left">
                  Clear Asset ✕
                </button>
              )}
            </div>

            {/* Processing Engine Trigger */}
            {!resultUrl ? (
              <button
                onClick={handleBoost}
                disabled={!file || loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  !file || loading ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                }`}
              >
                {loading ? "Amplifying Sonic Curves..." : "🔊 Apply Volume Boost"}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, "")}_boosted.${file?.name.split('.').pop() === 'mp4' ? 'mp3' : file?.name.split('.').pop()}`}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-center block bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
              >
                ⬇ Download Loud Audio
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}