'use client';

import React, { useState, useRef } from 'react';

interface Match {
  sentence_index: number;
  sentence: string;
  matched_with: string;
  similarity: number;
  source_label?: string;
}

interface CheckResult {
  overall_similarity?: number;
  plagiarism_score: number;
  total_sentences: number;
  flagged_sentences: number;
  matches: Match[];
  error?: string;
}

export default function PlagiarismChecker() {
  const [text, setText]           = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult]       = useState<CheckResult | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const handleCheck = async () => {
    if (!text.trim()) { setError("Please enter the text you want to check."); return; }
    if (!reference.trim()) { setError("Please enter a reference text to compare against."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('http://localhost:8000/text/plagiarism-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, reference }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.detail ? JSON.stringify(errData.detail) : `Check failed (HTTP ${response.status})`
        );
      }

      const data: CheckResult = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Connection lost. Is the backend running on port 8000?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setReference("");
    setResult(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 50) return "text-red-400 border-red-500/30 bg-red-500/10";
    if (score >= 20) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    return "text-green-400 border-green-500/30 bg-green-500/10";
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">🔍</div>
          <div>
            <h1 className="text-2xl font-bold">Plagiarism Checker</h1>
            <p className="text-white/40 text-sm">Compare your text against a reference for matching content.</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-yellow-400/90 text-xs leading-relaxed">
          ⚠ This tool checks similarity against text <span className="font-semibold">you provide</span> — it does not search the web or any external database. For full web-scale plagiarism detection, use a service like Copyscape or Turnitin.
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          {/* Source Text */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/8 bg-white/[0.01]">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Your Text</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the text you want to check..."
              className="w-full h-56 p-5 bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none"
            />
          </div>

          {/* Reference Text */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/8 bg-white/[0.01]">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Reference Text</span>
            </div>
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Paste the source/original text to compare against..."
              className="w-full h-56 p-5 bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleCheck}
            disabled={loading || !text || !reference}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
              loading || !text || !reference
                ? "bg-white/5 text-white/25 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/25"
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Checking...
              </>
            ) : (
              <>🔍 Check Similarity</>
            )}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className={`rounded-2xl border p-5 ${getScoreColor(result.plagiarism_score)}`}>
                <p className="text-3xl font-bold">{result.plagiarism_score}%</p>
                <p className="text-xs mt-1 opacity-70">Plagiarism Score</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-3xl font-bold text-white">{result.flagged_sentences}/{result.total_sentences}</p>
                <p className="text-xs mt-1 text-white/40">Flagged Sentences</p>
              </div>
              {result.overall_similarity !== undefined && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-3xl font-bold text-white">{result.overall_similarity}%</p>
                  <p className="text-xs mt-1 text-white/40">Overall Text Similarity</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">
                Matched Sentences {result.matches.length === 0 && "— None Found"}
              </p>

              {result.matches.length === 0 ? (
                <p className="text-white/25 text-sm py-6 text-center">No significant matches detected.</p>
              ) : (
                <div className="space-y-3">
                  {result.matches.map((m, i) => (
                    <div key={i} className="rounded-xl border border-white/8 bg-[#111118] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/30">Sentence {m.sentence_index + 1}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(m.similarity)}`}>
                          {m.similarity}% match
                        </span>
                      </div>
                      <p className="text-sm text-white/85 leading-relaxed">"{m.sentence}"</p>
                      <div className="pl-3 border-l-2 border-green-500/30">
                        <p className="text-xs text-white/40 mb-0.5">Matched with{m.source_label ? ` (${m.source_label})` : ""}:</p>
                        <p className="text-sm text-white/60 leading-relaxed">"{m.matched_with}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}