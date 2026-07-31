'use client';

import React, { useState, useEffect, useRef } from 'react';

interface KeywordDensity {
  word: string;
  count: number;
  density: number;
}

interface WordStats {
  characters: number;
  characters_no_space: number;
  words: number;
  sentences: number;
  paragraphs: number;
  avg_word_length: number;
  longest_word: string;
  reading_time_seconds: number;
  speaking_time_seconds: number;
  keyword_density: KeywordDensity[];
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins} min ${secs}s`;
}

export default function WordCounter() {
  const [input, setInput]   = useState("");
  const [stats, setStats]   = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setStats(null);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchStats(input);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  const fetchStats = async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/text/word-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.detail ? JSON.stringify(errData.detail) : `Request failed (HTTP ${response.status})`
        );
      }

      const data: WordStats = await response.json();
      setStats(data);

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Connection lost. Is the backend running on port 8000?');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setStats(null);
    setError(null);
  };

  const statCards = stats ? [
    { label: "Characters", value: stats.characters },
    { label: "Characters (no space)", value: stats.characters_no_space },
    { label: "Words", value: stats.words },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Avg Word Length", value: `${stats.avg_word_length} chars` },
  ] : [];

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl">📊</div>
          <div>
            <h1 className="text-2xl font-bold">Word Counter</h1>
            <p className="text-white/40 text-sm">Advanced text analytics — words, reading time, keyword density and more.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Text Area */}
          <div className="lg:col-span-3 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Start typing or paste your text here..."
                className="w-full h-72 p-5 bg-transparent text-white placeholder-white/25 text-sm resize-none focus:outline-none"
              />
              <div className="px-4 py-3 border-t border-white/8 bg-white/[0.01] flex items-center justify-between">
                <span className="text-xs text-white/30">
                  {loading ? "Analyzing..." : stats ? `${stats.words} words analyzed` : "Live stats update as you type"}
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

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}

            {/* Reading / Speaking Time */}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-lg">📖</div>
                  <div>
                    <p className="text-xs text-white/40">Reading Time</p>
                    <p className="text-sm font-semibold text-white">{formatTime(stats.reading_time_seconds)}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-lg">🗣️</div>
                  <div>
                    <p className="text-xs text-white/40">Speaking Time</p>
                    <p className="text-sm font-semibold text-white">{formatTime(stats.speaking_time_seconds)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Stats Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Statistics</p>

              {!stats ? (
                <p className="text-white/25 text-sm py-6 text-center">Start typing to see stats</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {statCards.map((card) => (
                    <div
                      key={card.label}
                      className="bg-[#111116] border border-white/5 rounded-xl p-3"
                    >
                      <p className="text-lg font-bold text-green-400">{card.value}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{card.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {stats?.longest_word && (
                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-3 text-xs text-white/40">
                  Longest word: <span className="text-white/80 font-semibold">{stats.longest_word}</span>
                </div>
              )}
            </div>

            {/* Keyword Density */}
            {stats && stats.keyword_density.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                <p className="text-xs font-semibold text-white/35 uppercase tracking-widest">Top Keywords</p>
                <div className="space-y-2">
                  {stats.keyword_density.map((kw) => (
                    <div key={kw.word} className="flex items-center gap-3">
                      <span className="text-xs text-white/70 w-20 truncate">{kw.word}</span>
                      <div className="flex-1 h-2 bg-[#111116] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500/70 rounded-full"
                          style={{ width: `${Math.min(100, kw.density * 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 w-14 text-right">{kw.count} · {kw.density}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}