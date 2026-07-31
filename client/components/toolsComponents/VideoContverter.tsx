'use client';

import React, { useState, useRef } from 'react';

const toolMeta = {
  id: "video-converter",
  name: "Video Converter",
  description: "Convert video files instantly to MP4, MKV, or WebM formats with high-speed processing.",
  icon: "🔄"
};

export default function VideoConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState<boolean>(false);
  const [format, setFormat] = useState<string>("mp4");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFile = (selectedFile: File) => {
    setError(null);
    setSuccess(false);
    setFile(selectedFile);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConvertAndDownload = async () => {
    if (!file) {
      setError("Please select or drop a video file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('output_format', format);

    try {
      const response = await fetch('http://localhost:8000/convert-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let fallbackMsg = `Conversion failed (Status ${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.detail) fallbackMsg = errData.detail;
        } catch (_) {}
        throw new Error(fallbackMsg);
      }

      // The browser receives the FileResponse payload here
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Force trigger native browser file save dialog
      const a = document.createElement('a');
      a.href = url;
      const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
      a.download = `${originalName}_converted.${format}`;
      
      document.body.appendChild(a);
      a.click();
      
      // Clean up DOM objects
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection lost. Is the backend API running on port 8000?');
    } finally {
      // CRITICAL FIX: This code executes immediately upon transmission end, dismissing the spinner
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      {/* Background Gradient Effect */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Tool Title Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-xl">
            {toolMeta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{toolMeta.name}</h1>
            <p className="text-white/40 text-sm">{toolMeta.description}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left panel: File Input Area */}
          <div className="lg:col-span-3 space-y-5">
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-24 px-6 text-center ${
                  dragging
                    ? "border-pink-500 bg-pink-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
                  📁
                </div>
                <p className="text-white font-semibold mb-1">Drop your video file here</p>
                <p className="text-white/35 text-sm mb-5">Any standard format can be processed</p>
                <button className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold transition-colors">
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
                <div className="p-8 flex flex-col items-center justify-center text-center relative min-h-[220px]">
                  {loading ? (
                    <div className="relative w-16 h-16 mb-4">
                      <svg className="animate-spin w-16 h-16 text-pink-500/30" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      </svg>
                      <svg className="animate-spin w-16 h-16 text-pink-500 absolute inset-0" fill="none" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl">⚙️</span>
                    </div>
                  ) : (
                    <div className="text-5xl mb-4 text-pink-500/70">🎥</div>
                  )}
                  
                  <p className="text-white text-sm font-medium max-w-md break-all px-4">{file.name}</p>
                  <p className="text-white/30 text-xs mt-1">{formatFileSize(file.size)}</p>

                  {success && (
                    <span className="mt-4 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
                      ✓ Conversion Completed Successfully
                    </span>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-white/8 bg-white/[0.01] flex items-center justify-between">
                  <span className="text-xs text-white/40">Ready for conversion</span>
                  <button 
                    onClick={() => { setFile(null); setSuccess(false); }}
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

          {/* Right panel: Controls & Targets Configuration */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-1">Select Output Target</p>
              
              <div className="grid grid-cols-3 gap-2">
                {["mp4", "mkv", "webm"].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    disabled={loading}
                    onClick={() => setFormat(fmt)}
                    className={`py-3 rounded-xl border font-semibold text-sm transition-all uppercase tracking-wider ${
                      format === fmt
                        ? "bg-pink-600/15 border-pink-500 text-pink-400 shadow-md"
                        : "bg-[#111116] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs text-white/40 leading-relaxed">
                Converting using <span className="text-white/70 font-semibold">ultrafast preset hardware execution</span>. Compression indices are rendered synchronously for maximum cross-platform streaming capability.
              </div>
            </div>

            <button
              onClick={handleConvertAndDownload}
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
                  Encoding Video...
                </>
              ) : (
                <>🔄 Convert & Download</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}