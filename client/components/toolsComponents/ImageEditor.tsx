"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type Tool = "select" | "crop";
type FlipDir = "horizontal" | "vertical";

type Adjustments = {
  brightness: number;  // -100 to 100
  contrast:   number;  // -100 to 100
  saturation: number;  // -100 to 100
  blur:       number;  // 0 to 20
  sharpness:  number;  // 0 to 10 (via unsharp mask sim)
  hue:        number;  // -180 to 180
  opacity:    number;  // 0 to 100
};

type Filter = {
  key:  string;
  label: string;
  css:  string;
};

type CropBox = { x: number; y: number; w: number; h: number };

// ── Filters ──────────────────────────────────────────────────────────────────
const FILTERS: Filter[] = [
  { key: "none",       label: "None",       css: "none" },
  { key: "grayscale",  label: "B&W",        css: "grayscale(100%)" },
  { key: "sepia",      label: "Sepia",      css: "sepia(80%)" },
  { key: "vivid",      label: "Vivid",      css: "saturate(180%) contrast(110%)" },
  { key: "cool",       label: "Cool",       css: "hue-rotate(30deg) saturate(120%)" },
  { key: "warm",       label: "Warm",       css: "sepia(30%) saturate(140%)" },
  { key: "fade",       label: "Fade",       css: "opacity(85%) contrast(90%) brightness(110%)" },
  { key: "noir",       label: "Noir",       css: "grayscale(100%) contrast(130%) brightness(90%)" },
  { key: "chrome",     label: "Chrome",     css: "saturate(200%) contrast(115%) brightness(105%)" },
  { key: "matte",      label: "Matte",      css: "contrast(90%) saturate(90%) brightness(108%)" },
  { key: "invert",     label: "Invert",     css: "invert(100%)" },
  { key: "polaroid",   label: "Polaroid",   css: "sepia(50%) contrast(85%) brightness(110%) saturate(130%)" },
];

const DEFAULT_ADJ: Adjustments = {
  brightness: 0,
  contrast:   0,
  saturation: 0,
  blur:       0,
  sharpness:  0,
  hue:        0,
  opacity:    100,
};

const SIDEBAR_TABS = [
  { key: "adjust",  label: "Adjust",  icon: "🎛️" },
  { key: "filter",  label: "Filters", icon: "✨" },
  { key: "crop",    label: "Crop",    icon: "✂️" },
  { key: "transform", label: "Transform", icon: "🔄" },
  { key: "text",    label: "Text",    icon: "T" },
] as const;

type TabKey = typeof SIDEBAR_TABS[number]["key"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const buildFilter = (adj: Adjustments, filterCss: string) => {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast   !== 0) parts.push(`contrast(${1 + adj.contrast   / 100})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.blur       !== 0) parts.push(`blur(${adj.blur}px)`);
  if (adj.hue        !== 0) parts.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.opacity    !== 100) parts.push(`opacity(${adj.opacity / 100})`);
  if (filterCss !== "none") parts.push(filterCss);
  return parts.join(" ") || "none";
};

// ── Component ────────────────────────────────────────────────────────────────
export default function ImageEditor() {
  const [imageSrc, setImageSrc]     = useState<string | null>(null);
  const [fileName, setFileName]     = useState("image");
  const [tab, setTab]               = useState<TabKey>("adjust");
  const [adj, setAdj]               = useState<Adjustments>(DEFAULT_ADJ);
  const [filter, setFilter]         = useState<Filter>(FILTERS[0]);
  const [rotation, setRotation]     = useState(0);
  const [flipH, setFlipH]           = useState(false);
  const [flipV, setFlipV]           = useState(false);
  const [tool, setTool]             = useState<Tool>("select");
  const [crop, setCrop]             = useState<CropBox | null>(null);
  const [cropDrag, setCropDrag]     = useState<{ startX: number; startY: number } | null>(null);
  const [history, setHistory]       = useState<string[]>([]);
  const [histIdx, setHistIdx]       = useState(-1);
  const [zoom, setZoom]             = useState(1);
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor]   = useState("#ffffff");
  const [fontSize, setFontSize]     = useState(32);
  const [dragging, setDragging]     = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const previewRef  = useRef<HTMLImageElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const wrapRef     = useRef<HTMLDivElement>(null);

  // ── Load image ──────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setImageSrc(url);
    setFileName(f.name.replace(/\.[^/.]+$/, ""));
    setAdj(DEFAULT_ADJ);
    setFilter(FILTERS[0]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(null);
    setHistory([url]);
    setHistIdx(0);
    setZoom(1);
    setTextOverlay("");
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  // ── CSS filter string for live preview ─────────────────────────────────
  const liveFilter = buildFilter(adj, filter.css);

  // ── Transform style for preview ─────────────────────────────────────────
  const previewTransform = `
    rotate(${rotation}deg)
    scaleX(${flipH ? -1 : 1})
    scaleY(${flipV ? -1 : 1})
    scale(${zoom})
  `;

  // ── Adjustment slider helper ────────────────────────────────────────────
  const Slider = ({
    label, icon, field, min, max, step = 1,
  }: {
    label: string; icon: string; field: keyof Adjustments; min: number; max: number; step?: number;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/50 flex items-center gap-1.5">
          <span>{icon}</span>{label}
        </span>
        <span className="text-xs font-bold text-white/70">{adj[field]}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={adj[field]}
        onChange={(e) => setAdj((p) => ({ ...p, [field]: Number(e.target.value) }))}
        className="w-full accent-violet-500 h-1"
      />
      <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
        <span>{min}</span>
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  );

  // ── Apply edits to canvas & export ─────────────────────────────────────
  const applyToCanvas = (callback?: (dataUrl: string) => void) => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const W = img.width  * cos + img.height * sin;
      const H = img.width  * sin + img.height * cos;

      canvas.width  = W;
      canvas.height = H;

      ctx.clearRect(0, 0, W, H);
      ctx.filter = liveFilter === "none" ? "" : liveFilter;

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      // Apply crop if exists
      if (crop && tool === "crop") {
        ctx.drawImage(
          img,
          crop.x, crop.y, crop.w, crop.h,
          -img.width / 2, -img.height / 2,
          img.width, img.height
        );
      } else {
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }

      // Text overlay
      if (textOverlay.trim()) {
        ctx.filter = "none";
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.fillText(textOverlay, 0, H / 2 - 20 - H / 2 + 40);
      }

      ctx.restore();

      if (callback) callback(canvas.toDataURL("image/png"));
    };
    img.src = imageSrc;
  };

  // ── Push to history ─────────────────────────────────────────────────────
  const pushHistory = (url: string) => {
    const newHist = history.slice(0, histIdx + 1);
    newHist.push(url);
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setImageSrc(url);
  };

  const undo = () => {
    if (histIdx <= 0) return;
    const idx = histIdx - 1;
    setHistIdx(idx);
    setImageSrc(history[idx]);
    setAdj(DEFAULT_ADJ);
    setCrop(null);
  };

  const redo = () => {
    if (histIdx >= history.length - 1) return;
    const idx = histIdx + 1;
    setHistIdx(idx);
    setImageSrc(history[idx]);
  };

  // ── Apply crop ──────────────────────────────────────────────────────────
  const applyCrop = () => {
    if (!crop || !imageSrc) return;
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d")!;
    const img    = new Image();
    img.onload = () => {
      canvas.width  = crop.w;
      canvas.height = crop.h;
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      pushHistory(canvas.toDataURL("image/png"));
      setCrop(null);
      setTool("select");
    };
    img.src = imageSrc;
  };

  // ── Export / Download ───────────────────────────────────────────────────
  const download = (fmt: "png" | "jpeg" | "webp") => {
    applyToCanvas((dataUrl) => {
      const canvas = canvasRef.current!;
      const out    = canvas.toDataURL(`image/${fmt}`, 0.92);
      const a      = document.createElement("a");
      a.href       = out;
      a.download   = `${fileName}_edited.${fmt}`;
      a.click();
    });

    // Trigger applyToCanvas without callback to also update canvas
    applyToCanvas();
  };

  // ── Crop mouse events on preview ────────────────────────────────────────
  const getCropCoords = (e: React.MouseEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const img  = previewRef.current!;
    const imgRect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth  / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    const x = (e.clientX - imgRect.left)  * scaleX;
    const y = (e.clientY - imgRect.top)   * scaleY;
    return { x: Math.max(0, x), y: Math.max(0, y), scaleX, scaleY, imgRect };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool !== "crop") return;
    const { x, y } = getCropCoords(e);
    setCropDrag({ startX: x, startY: y });
    setCrop({ x, y, w: 0, h: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!cropDrag || tool !== "crop") return;
    const { x, y } = getCropCoords(e);
    setCrop({
      x: Math.min(cropDrag.startX, x),
      y: Math.min(cropDrag.startY, y),
      w: Math.abs(x - cropDrag.startX),
      h: Math.abs(y - cropDrag.startY),
    });
  };

  const onMouseUp = () => setCropDrag(null);

  // ── Crop overlay position ────────────────────────────────────────────────
  const getCropOverlay = () => {
    if (!crop || !previewRef.current) return null;
    const img    = previewRef.current;
    const imgRect = img.getBoundingClientRect();
    const scaleX = imgRect.width  / img.naturalWidth;
    const scaleY = imgRect.height / img.naturalHeight;
    return {
      left:   crop.x * scaleX,
      top:    crop.y * scaleY,
      width:  crop.w * scaleX,
      height: crop.h * scaleY,
    };
  };

  const cropOverlay = getCropOverlay();

  // ── Reset all ────────────────────────────────────────────────────────────
  const reset = () => {
    setAdj(DEFAULT_ADJ);
    setFilter(FILTERS[0]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setCrop(null);
    setTool("select");
    setTextOverlay("");
    if (history.length > 0) {
      setImageSrc(history[0]);
      setHistIdx(0);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  if (!imageSrc) {
    return (
      <main className="min-h-screen bg-[#0A0A0F] text-white font-sans px-4 py-12">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="mb-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl">🎨</div>
            <div>
              <h1 className="text-2xl font-bold">Image Editor</h1>
              <p className="text-white/40 text-sm">Crop, rotate, filter, adjust — all in browser</p>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-24 px-6 text-center ${
              dragging
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-5">🎨</div>
            <p className="text-white font-semibold text-lg mb-2">Open an image to start editing</p>
            <p className="text-white/35 text-sm mb-6">PNG, JPG, WEBP — drag & drop or click</p>
            <button className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
              Open Image
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["✂️ Crop", "🔄 Rotate", "↔️ Flip", "🎨 Filters", "🎛️ Adjustments", "📝 Text", "💾 Export PNG/JPEG/WEBP"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/45">{f}</span>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Editor UI ─────────────────────────────────────────────────────────────
  return (
    <main className="h-screen bg-[#0A0A0F] text-white font-sans flex flex-col overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-[#0D0D14] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center text-sm">🎨</div>
          <span className="font-semibold text-sm text-white/80">{fileName}</span>
        </div>

        {/* History */}
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={histIdx <= 0}
            className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
            ↩ Undo
          </button>
          <button onClick={redo} disabled={histIdx >= history.length - 1}
            className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
            ↪ Redo
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button onClick={reset}
            className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">
            ↺ Reset
          </button>
          <button onClick={() => inputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/8 transition-all">
            📂 Open
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Export:</span>
          {(["png", "jpeg", "webp"] as const).map((f) => (
            <button key={f} onClick={() => download(f)}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors uppercase">
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar tabs (icon strip) ── */}
        <div className="w-14 bg-[#0D0D14] border-r border-white/8 flex flex-col items-center py-3 gap-1 flex-shrink-0">
          {SIDEBAR_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.label}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-sm ${
                tab === t.key
                  ? "bg-violet-600 text-white"
                  : "text-white/35 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="text-[8px] font-medium leading-none">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Sidebar panel ── */}
        <div className="w-64 bg-[#0D0D14] border-r border-white/8 flex flex-col overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">

            {/* ADJUST */}
            {tab === "adjust" && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Adjustments</p>
                <Slider label="Brightness" icon="☀️"  field="brightness" min={-100} max={100} />
                <Slider label="Contrast"   icon="◑"   field="contrast"   min={-100} max={100} />
                <Slider label="Saturation" icon="🎨"  field="saturation" min={-100} max={100} />
                <Slider label="Hue"        icon="🌈"  field="hue"        min={-180} max={180} />
                <Slider label="Blur"       icon="💧"  field="blur"       min={0}    max={20}  step={0.5} />
                <Slider label="Opacity"    icon="👁️"  field="opacity"    min={0}    max={100} />
                <button onClick={() => setAdj(DEFAULT_ADJ)}
                  className="w-full py-2 rounded-xl border border-white/10 text-white/40 text-xs hover:text-white hover:border-white/20 transition-all">
                  Reset Adjustments
                </button>
              </>
            )}

            {/* FILTER */}
            {tab === "filter" && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Filters</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all ${
                        filter.key === f.key
                          ? "border-violet-500/60 bg-violet-500/15"
                          : "border-white/8 hover:border-white/20"
                      }`}
                    >
                      {imageSrc && (
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#111]">
                          <img
                            src={imageSrc}
                            alt={f.label}
                            className="w-full h-full object-cover"
                            style={{ filter: f.css === "none" ? "none" : f.css }}
                          />
                        </div>
                      )}
                      <span className="text-[9px] text-white/60 font-medium">{f.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* CROP */}
            {tab === "crop" && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Crop</p>
                <button
                  onClick={() => setTool(tool === "crop" ? "select" : "crop")}
                  className={`w-full py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    tool === "crop"
                      ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                      : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
                  }`}
                >
                  {tool === "crop" ? "✂️ Drawing crop…" : "✂️ Start Crop"}
                </button>
                {tool === "crop" && (
                  <p className="text-xs text-white/35 text-center">Drag on the image to draw a crop area</p>
                )}
                {crop && crop.w > 0 && (
                  <>
                    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/50 space-y-1">
                      <div className="flex justify-between"><span>Width</span><span className="text-white/80">{Math.round(crop.w)}px</span></div>
                      <div className="flex justify-between"><span>Height</span><span className="text-white/80">{Math.round(crop.h)}px</span></div>
                    </div>
                    <button onClick={applyCrop}
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors">
                      ✓ Apply Crop
                    </button>
                    <button onClick={() => { setCrop(null); setTool("select"); }}
                      className="w-full py-2 rounded-xl border border-white/10 text-white/40 text-xs hover:text-white hover:border-white/20 transition-all">
                      Cancel
                    </button>
                  </>
                )}

                {/* Aspect ratio presets */}
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mt-2">Aspect Ratio Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Free",    w: 0,    h: 0 },
                    { label: "1 : 1",   w: 1,    h: 1 },
                    { label: "4 : 3",   w: 4,    h: 3 },
                    { label: "16 : 9",  w: 16,   h: 9 },
                    { label: "3 : 2",   w: 3,    h: 2 },
                    { label: "Portrait",w: 9,    h: 16 },
                  ].map((p) => (
                    <button key={p.label}
                      className="py-2 rounded-lg border border-white/8 text-[10px] text-white/45 hover:text-white hover:border-white/20 transition-all font-medium">
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* TRANSFORM */}
            {tab === "transform" && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Rotate</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "↺ 90° Left",  val: -90  },
                    { label: "↻ 90° Right", val:  90  },
                    { label: "↻ 180°",      val:  180 },
                    { label: "↻ 270°",      val:  270 },
                  ].map((r) => (
                    <button key={r.label}
                      onClick={() => setRotation((prev) => (prev + r.val) % 360)}
                      className="py-2 rounded-xl border border-white/8 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all font-medium">
                      {r.label}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">Custom Angle</span>
                    <span className="text-xs font-bold text-white/70">{rotation}°</span>
                  </div>
                  <input type="range" min={-180} max={180} value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-violet-500 h-1" />
                </div>

                <div className="w-px h-px bg-transparent mt-1" />
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Flip</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setFlipH((p) => !p)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      flipH ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-white/8 text-white/45 hover:text-white hover:border-white/20"
                    }`}>
                    ↔ Flip H
                  </button>
                  <button onClick={() => setFlipV((p) => !p)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      flipV ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-white/8 text-white/45 hover:text-white hover:border-white/20"
                    }`}>
                    ↕ Flip V
                  </button>
                </div>

                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mt-1">Zoom</p>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">Preview Zoom</span>
                    <span className="text-xs font-bold text-white/70">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input type="range" min={0.25} max={3} step={0.05} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-violet-500 h-1" />
                </div>
              </>
            )}

            {/* TEXT */}
            {tab === "text" && (
              <>
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Text Overlay</p>
                <textarea
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Type your text here…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
                />
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Font Size</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={10} max={120} value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="flex-1 accent-violet-500 h-1" />
                    <span className="text-xs font-bold text-white/70 w-8 text-right">{fontSize}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border-0 bg-transparent cursor-pointer" />
                    <span className="text-xs text-white/50">{textColor}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["#ffffff", "#000000", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"].map((c) => (
                    <button key={c} onClick={() => setTextColor(c)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${textColor === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Canvas area ── */}
        <div
          ref={wrapRef}
          className={`flex-1 bg-[#111118] flex items-center justify-center overflow-hidden relative ${
            tool === "crop" ? "cursor-crosshair" : "cursor-default"
          }`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {/* Checker bg */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(45deg,#1a1a1a 25%,transparent 25%),linear-gradient(-45deg,#1a1a1a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a1a 75%),linear-gradient(-45deg,transparent 75%,#1a1a1a 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
            }} />

          {/* Image */}
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.1s" }}>
            <img
              ref={previewRef}
              src={imageSrc}
              alt="editing"
              draggable={false}
              className="max-w-full max-h-full select-none block"
              style={{
                filter: liveFilter,
                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                transition: "transform 0.15s, filter 0.1s",
                maxHeight: "calc(100vh - 110px)",
                maxWidth:  "calc(100vw - 340px)",
              }}
            />

            {/* Crop overlay */}
            {tool === "crop" && crop && crop.w > 2 && crop.h > 2 && cropOverlay && (
              <>
                {/* Dark mask */}
                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                {/* Bright crop area */}
                <div
                  className="absolute border-2 border-white pointer-events-none"
                  style={{
                    left:   cropOverlay.left,
                    top:    cropOverlay.top,
                    width:  cropOverlay.width,
                    height: cropOverlay.height,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                    background: "transparent",
                  }}
                >
                  {/* Rule-of-thirds grid */}
                  {[33, 66].map((p) => (
                    <div key={`h${p}`}>
                      <div className="absolute w-full border-t border-white/30" style={{ top: `${p}%` }} />
                      <div className="absolute h-full border-l border-white/30" style={{ left: `${p}%` }} />
                    </div>
                  ))}
                  {/* Corner handles */}
                  {[
                    "top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"
                  ].map((pos) => (
                    <div key={pos} className={`absolute w-3 h-3 bg-white rounded-sm ${pos} -translate-x-1/2 -translate-y-1/2`} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Text preview overlay */}
          {textOverlay && (
            <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
              <span
                style={{ color: textColor, fontSize: `${Math.min(fontSize, 48)}px`, fontWeight: "bold", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
              >
                {textOverlay}
              </span>
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-white/50 text-xs">
            {Math.round(zoom * 100)}%
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl px-2 py-1">
            <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
              className="w-6 h-6 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm transition-colors">−</button>
            <button onClick={() => setZoom(1)}
              className="px-2 text-[10px] text-white/40 hover:text-white transition-colors">FIT</button>
            <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="w-6 h-6 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm transition-colors">+</button>
          </div>
        </div>
      </div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}