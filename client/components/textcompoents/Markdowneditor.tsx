'use client';

import React, { useState } from 'react';

const MODE_OPTIONS = [
  { label: "HTML Preview", value: "preview" },
  { label: "Raw HTML", value: "html" },
  { label: "Strip Markdown", value: "strip" },
];

export default function MarkdownEditor() {
  const [input, setInput]     = useState("");
  const [output, setOutput]   = useState("");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  const handleConvert = async (mode: string) => {
    if (!input.trim()) {
      setError("Please enter some markdown first.");
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);
    setActiveMode(mode);

    try {
      const response = await fetch('http://localhost:8000/markdowneditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, mode }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.detail ? JSON.stringify(errData.detail) : `Conversion failed (HTTP ${response.status})`
        );
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.result);

    } catch (err: any) {
      setError(err.message || 'Connection lost. Is the backend running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setActiveMode(null);
  };

  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const isPreview = activeMode === "preview" && output && !loading;

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">📝</div>
          <div>
            <h1 className="text-2xl font-bold">Markdown Editor</h1>
            <p className="text-white/40 text-sm">Convert and preview markdown text instantly.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Text Area */}
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(null); }}
                placeholder="Type or paste your markdown here..."
                className="w-full h-56 p-5 bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none font-mono"
              />
              <div className="px-4 py-3 border-t border-white/8 bg-white/[0.01] flex items-center justify-between">
                <span className="text-xs text-white/30">
                  {charCount} characters · {wordCount} words
                </span>
                <button
                  onClick={handleClear}
                  disabled={!input}
                  className="text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#111118]">
              <div className="p-8 flex flex-col items-center justify-center text-center min-h-[140px]">
                {loading ? (
                  <div className="relative w-12 h-12 mb-3">
                    <svg className="animate-spin w-12 h-12 text-green-500/30" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <svg className="animate-spin w-12 h-12 text-green-500 absolute inset-0" fill="none" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                ) : output ? (
                  isPreview ? (
                    <div
                      className="text-white text-sm leading-relaxed text-left w-full prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: output }}
                    />
                  ) : (
                    <pre className="text-white text-xs font-mono text-left w-full whitespace-pre-wrap break-all">{output}</pre>
                  )
                ) : (
                  <p className="text-white/25 text-sm">Result will appear here</p>
                )}

                {output && !loading && (
                  <button
                    onClick={handleCopy}
                    className="mt-4 text-xs bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                  >
                    {copied ? "✓ Copied" : "Copy to clipboard"}
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Convert To</p>

              <div className="grid grid-cols-1 gap-2">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={loading}
                    onClick={() => handleConvert(opt.value)}
                    className={`py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      activeMode === opt.value
                        ? "bg-green-600/15 border-green-500 text-green-400"
                        : "bg-[#111116] border-white/5 text-white/60 hover:border-white/10 hover:text-white"
                    } disabled:opacity-40`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs text-white/40 leading-relaxed">
                Write markdown, pick a mode, and get an <span className="text-white/70 font-semibold">instant</span> conversion. Copy the result with one click.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}