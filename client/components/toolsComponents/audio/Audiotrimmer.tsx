"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// 👇 HELPER FUNCTION: Placed outside component to prevent re-declaration on every render
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  const paddedMins = mins.toString().padStart(2, "0");
  const paddedSecs = secs.toString().padStart(2, "0");
  const paddedMs = ms.toString().padStart(2, "0");

  return `${paddedMins}:${paddedSecs}.${paddedMs}`;
};

export default function AudioTrimmer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Trimming parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [maxDuration, setMaxDuration] = useState<number>(0);

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Clean memory leaks
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
      setError("Please drop a valid audio file or MP4 video.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResultUrl(null);
    
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Create a temporary audio element to find the true duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setMaxDuration(tempAudio.duration);
      setEndTime(Number(tempAudio.duration.toFixed(2)));
      setStartTime(0);
    };
  }, []);

  const handleTrim = useCallback(async () => {
    if (!file) return;
    if (startTime >= endTime) {
      setError("Start time must be strictly less than End time.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("start_time", startTime.toString());
    formData.append("end_time", endTime.toString());

    try {
      const res = await fetch("http://localhost:8000/trim-audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Trimming node failure.");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error processing audio trim.");
    } finally {
      setLoading(false);
    }
  }, [file, startTime, endTime]);

  const clearWorkspace = () => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setStartTime(0);
    setEndTime(10);
    setMaxDuration(0);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white px-4 py-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">✂️</div>
          <div>
            <h1 className="text-2xl font-bold">Audio Trimmer</h1>
            <p className="text-white/40 text-sm">Cut audio structures precisely down to the millisecond.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* File Stage area */}
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
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">✂️</div>
                  <p className="font-semibold mb-1">Drop audio track layer here</p>
                  <p className="text-white/35 text-xs mb-5">Supports MP3, WAV, FLAC, and MP4</p>
                  <button className="px-5 py-2 rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-500 transition-colors">Choose File</button>
                </div>
              ) : (
                <div className="p-6 w-full space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2">Original Track Playback</p>
                    {previewUrl && <audio src={previewUrl} controls className="w-full h-10" />}
                  </div>

                  {resultUrl && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Trimmed Result Monitor</p>
                      <audio src={resultUrl} controls autoPlay className="w-full h-10" />
                    </div>
                  )}
                </div>
              )}
              <input ref={inputRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </div>

            {error && <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">⚠ {error}</div>}
          </div>

          {/* Config Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div>
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Staged Track Context</p>
                <h3 className="text-sm font-semibold text-white/80 truncate">{file ? file.name : "No asset loaded"}</h3>
                
                {/* 👇 MODIFIED: Changed from raw seconds display to professional layout with animated status light */}
                {maxDuration > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    <p className="text-xs font-mono text-violet-400">
                      Total Length: <span className="text-white font-semibold">{formatTime(maxDuration)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Timestamp Form Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase mb-1.5">Start (Seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={maxDuration || undefined}
                    value={startTime}
                    onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                  {/* 👇 ADDED: Active time readout indicator */}
                  <span className="text-[10px] text-white/30 font-mono mt-1 block">⏱ {formatTime(startTime)}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/40 uppercase mb-1.5">End (Seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={maxDuration || undefined}
                    value={endTime}
                    onChange={(e) => setEndTime(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#12121A] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-violet-500"
                  />
                  {/* 👇 ADDED: Active time readout indicator */}
                  <span className="text-[10px] text-white/30 font-mono mt-1 block">⏱ {formatTime(endTime)}</span>
                </div>
              </div>

              {file && (
                <button onClick={clearWorkspace} className="pt-2 text-xs text-red-400 hover:text-red-300 transition-colors block border-t border-white/5 w-full text-left">
                  Clear Asset ✕
                </button>
              )}
            </div>

            {/* Submission Node Button */}
            {!resultUrl ? (
              <button
                onClick={handleTrim}
                disabled={!file || loading}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  !file || loading ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                }`}
              >
                {loading ? "Processing Cut Arrays..." : "✂️ Crop Audio File"}
              </button>
            ) : (
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, "")}_trimmed.${file?.name.split('.').pop() === 'mp4' ? 'mp3' : file?.name.split('.').pop()}`}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-center block bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
              >
                ⬇ Download Trimmed Clip
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}