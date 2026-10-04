import React, { useState } from "react";
import { Grid, X, Crosshair, Ruler, Eye } from "lucide-react";

export type GridMode = "thirds" | "eyes" | "metric";
export type GridColor = "cyan" | "emerald" | "amber" | "white" | "dark";

interface GridOverlayProps {
  mode: GridMode;
  onModeChange: (mode: GridMode) => void;
  onClose: () => void;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  mode,
  onModeChange,
  onClose,
}) => {
  const [color, setColor] = useState<GridColor>("cyan");
  const [opacity, setOpacity] = useState<number>(0.75);
  const [showRulerTicks, setShowRulerTicks] = useState<boolean>(true);

  // High-contrast color palettes with shadow for visibility on both dark & white images
  const colorMap: Record<GridColor, { stroke: string; accent: string; label: string; bgBadge: string }> = {
    cyan: { stroke: "#06b6d4", accent: "#22d3ee", label: "Ciano Neon", bgBadge: "bg-cyan-500" },
    emerald: { stroke: "#10b981", accent: "#34d399", label: "Smeraldo", bgBadge: "bg-emerald-500" },
    amber: { stroke: "#f59e0b", accent: "#fbbf24", label: "Ambra", bgBadge: "bg-amber-500" },
    white: { stroke: "#f8fafc", accent: "#ffffff", label: "Bianco", bgBadge: "bg-slate-200" },
    dark: { stroke: "#0f172a", accent: "#334155", label: "Grafite", bgBadge: "bg-slate-800" },
  };

  const activeStroke = colorMap[color].stroke;
  const activeAccent = colorMap[color].accent;

  // 297mm x 210mm coordinates
  const W = 297;
  const H = 210;

  return (
    <div 
      data-html2canvas-ignore="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-30"
      style={{ opacity }}
    >
      {/* Precision SVG Vector Grid aligned to exact 297mm x 210mm card canvas */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ filter: "drop-shadow(0px 0px 0.75px rgba(0,0,0,0.85))" }}
      >
        <defs>
          {/* Subtle 10mm dot pattern for background reference */}
          <pattern id="dotPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.35" fill={activeStroke} opacity="0.35" />
          </pattern>

          {/* 20mm fine grid pattern */}
          <pattern id="fineGridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={activeStroke}
              strokeWidth="0.2"
              opacity="0.3"
            />
            {/* 10mm subtle subdivisions */}
            <line x1="10" y1="0" x2="10" y2="20" stroke={activeStroke} strokeWidth="0.1" strokeDasharray="0.5,1.5" opacity="0.2" />
            <line x1="0" y1="10" x2="20" y2="10" stroke={activeStroke} strokeWidth="0.1" strokeDasharray="0.5,1.5" opacity="0.2" />
          </pattern>
        </defs>

        {/* 1. OUTER SAFE MARGIN BORDER */}
        <rect
          x="4"
          y="4"
          width={W - 8}
          height={H - 8}
          fill="none"
          stroke={activeStroke}
          strokeWidth="0.3"
          strokeDasharray="2,2"
          opacity="0.4"
        />

        {/* 2. MODE: METRIC (MILLIMETRICA COMPLETA) */}
        {mode === "metric" && (
          <>
            <rect x="0" y="0" width={W} height={H} fill="url(#fineGridPattern)" />

            {/* Major 50mm grid lines */}
            {[50, 100, 150, 200, 250].map((x) => (
              <line
                key={`major-x-${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={H}
                stroke={activeAccent}
                strokeWidth="0.4"
                opacity="0.5"
              />
            ))}
            {[50, 100, 150, 200].map((y) => (
              <line
                key={`major-y-${y}`}
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke={activeAccent}
                strokeWidth="0.4"
                opacity="0.5"
              />
            ))}

            {/* Center axes with crosshair marks */}
            <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={activeAccent} strokeWidth="0.6" strokeDasharray="3,1.5" opacity="0.85" />
            <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={activeAccent} strokeWidth="0.6" strokeDasharray="3,1.5" opacity="0.85" />
          </>
        )}

        {/* 3. MODE: THIRDS (REGOLA DEI TERZI FOTOGRAFICA) */}
        {mode === "thirds" && (
          <>
            <rect x="0" y="0" width={W} height={H} fill="url(#dotPattern)" />

            {/* Vertical Thirds (X = 99mm, 198mm) */}
            <line x1={99} y1={0} x2={99} y2={H} stroke={activeStroke} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.9" />
            <line x1={198} y1={0} x2={198} y2={H} stroke={activeStroke} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.9" />

            {/* Horizontal Thirds (Y = 70mm, 140mm) */}
            <line x1={0} y1={70} x2={W} y2={70} stroke={activeStroke} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.9" />
            <line x1={0} y1={140} x2={W} y2={140} stroke={activeStroke} strokeWidth="0.5" strokeDasharray="4,2" opacity="0.9" />

            {/* Optical Center Cross */}
            <line x1={W / 2 - 12} y1={H / 2} x2={W / 2 + 12} y2={H / 2} stroke={activeAccent} strokeWidth="0.7" opacity="0.95" />
            <line x1={W / 2} y1={H / 2 - 12} x2={W / 2} y2={H / 2 + 12} stroke={activeAccent} strokeWidth="0.7" opacity="0.95" />
            <circle cx={W / 2} cy={H / 2} r="1.5" fill="none" stroke={activeAccent} strokeWidth="0.4" opacity="0.9" />

            {/* 4 Golden Focal Intersections / Power Points */}
            {[
              { x: 99, y: 70 },
              { x: 198, y: 70 },
              { x: 99, y: 140 },
              { x: 198, y: 140 },
            ].map((pt, idx) => (
              <g key={`point-${idx}`}>
                <circle cx={pt.x} cy={pt.y} r="2.5" fill="none" stroke={activeAccent} strokeWidth="0.6" opacity="0.95" />
                <circle cx={pt.x} cy={pt.y} r="0.6" fill={activeAccent} opacity="0.95" />
                <line x1={pt.x - 4} y1={pt.y} x2={pt.x + 4} y2={pt.y} stroke={activeAccent} strokeWidth="0.3" opacity="0.8" />
                <line x1={pt.x} y1={pt.y - 4} x2={pt.x} y2={pt.y + 4} stroke={activeAccent} strokeWidth="0.3" opacity="0.8" />
              </g>
            ))}

            {/* Upper portrait eye-level alignment line at Y = 52mm (standard editorial portrait level) */}
            <line x1={0} y1={52} x2={W} y2={52} stroke={activeAccent} strokeWidth="0.4" strokeDasharray="1.5,1.5" opacity="0.7" />
          </>
        )}

        {/* 4. MODE: EYES (ALLINEAMENTO VOLTI & PROFILI FOTOGRAFICI) */}
        {mode === "eyes" && (
          <>
            <rect x="0" y="0" width={W} height={H} fill="url(#dotPattern)" />

            {/* Multilevel horizontal face alignment guides across adjacent photo slots */}
            {/* Eye level 1 (Close-up portraits): Y = 45mm */}
            <g>
              <line x1={0} y1={45} x2={W} y2={45} stroke={activeAccent} strokeWidth="0.6" strokeDasharray="3,1.5" opacity="0.95" />
              <text x="7" y="43" fill={activeAccent} fontSize="2.6" fontFamily="sans-serif" fontWeight="bold">
                LINEA OCCHI (PRIMO PIANO / CLOSE-UP)
              </text>
            </g>

            {/* Eye level 2 (Three-quarters portrait): Y = 62mm */}
            <g>
              <line x1={0} y1={62} x2={W} y2={62} stroke={activeStroke} strokeWidth="0.5" strokeDasharray="3,1.5" opacity="0.9" />
              <text x="7" y="60" fill={activeStroke} fontSize="2.6" fontFamily="sans-serif" fontWeight="bold">
                LINEA OCCHI (3/4 & MEZZO BUSTO)
              </text>
            </g>

            {/* Chin / Shoulder level: Y = 95mm */}
            <g>
              <line x1={0} y1={95} x2={W} y2={95} stroke={activeStroke} strokeWidth="0.4" strokeDasharray="2,2" opacity="0.8" />
              <text x="7" y="93" fill={activeStroke} fontSize="2.4" fontFamily="sans-serif" opacity="0.85">
                LINEA SPALLE / MENTO
              </text>
            </g>

            {/* Waist level / Upper hips: Y = 135mm */}
            <g>
              <line x1={0} y1={135} x2={W} y2={135} stroke={activeStroke} strokeWidth="0.4" strokeDasharray="2,2" opacity="0.75" />
              <text x="7" y="133" fill={activeStroke} fontSize="2.4" fontFamily="sans-serif" opacity="0.85">
                LINEA VITA / BACINO
              </text>
            </g>

            {/* Vertical Multi-column reference axes (splits for 2, 3, and 4 photo layouts) */}
            {/* Split 2 photos: X = 148.5 */}
            <line x1={148.5} y1={0} x2={148.5} y2={H} stroke={activeAccent} strokeWidth="0.4" strokeDasharray="4,2" opacity="0.8" />
            {/* Split 3 photos: X = 99, 198 */}
            <line x1={99} y1={0} x2={99} y2={H} stroke={activeStroke} strokeWidth="0.35" strokeDasharray="3,3" opacity="0.6" />
            <line x1={198} y1={0} x2={198} y2={H} stroke={activeStroke} strokeWidth="0.35" strokeDasharray="3,3" opacity="0.6" />

            {/* Face framing center markers */}
            {[
              { x: 49.5, y: 55 },
              { x: 148.5, y: 55 },
              { x: 247.5, y: 55 },
            ].map((marker, idx) => (
              <g key={`marker-${idx}`} opacity="0.85">
                {/* Oval guide for face positioning */}
                <ellipse cx={marker.x} cy={marker.y} rx="12" ry="16" fill="none" stroke={activeAccent} strokeWidth="0.4" strokeDasharray="1.5,1.5" />
                <line x1={marker.x - 3} y1={marker.y} x2={marker.x + 3} y2={marker.y} stroke={activeAccent} strokeWidth="0.3" />
                <line x1={marker.x} y1={marker.y - 3} x2={marker.x} y2={marker.y + 3} stroke={activeAccent} strokeWidth="0.3" />
              </g>
            ))}
          </>
        )}

        {/* 5. RULER MILLIMETER TICKS ALONG EDGES */}
        {showRulerTicks && (
          <g opacity="0.7">
            {/* Top X ticks every 10mm */}
            {Array.from({ length: 29 }).map((_, i) => {
              const x = (i + 1) * 10;
              const isMajor = x % 50 === 0;
              return (
                <g key={`tick-x-${x}`}>
                  <line x1={x} y1={0} x2={x} y2={isMajor ? 4 : 2} stroke={activeStroke} strokeWidth="0.3" />
                  {isMajor && (
                    <text x={x + 1} y={3.5} fill={activeStroke} fontSize="2.2" fontFamily="sans-serif">
                      {x}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Left Y ticks every 10mm */}
            {Array.from({ length: 20 }).map((_, i) => {
              const y = (i + 1) * 10;
              const isMajor = y % 50 === 0;
              return (
                <g key={`tick-y-${y}`}>
                  <line x1={0} y1={y} x2={isMajor ? 4 : 2} y2={y} stroke={activeStroke} strokeWidth="0.3" />
                  {isMajor && (
                    <text x={1} y={y - 1} fill={activeStroke} fontSize="2.2" fontFamily="sans-serif">
                      {y}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* FLOATING QUICK CONTROL DOCK ON PREVIEW (POINTER-EVENTS-AUTO) */}
      <div 
        className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl border border-white/20 flex items-center gap-3 text-xs z-40 transition-all hover:bg-slate-900"
      >
        <div className="flex items-center gap-1.5 font-bold text-[11px] text-cyan-300 pr-1 border-r border-white/15">
          <Grid size={13} className="text-cyan-400 animate-pulse" />
          <span>Griglia Guida</span>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => onModeChange("thirds")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              mode === "thirds" ? "bg-cyan-500 text-white font-bold shadow-xs" : "hover:bg-white/10 text-slate-300"
            }`}
            title="Regola dei Terzi (3x3 con punti focali e linea occhi)"
          >
            <Crosshair size={11} />
            Terzi
          </button>
          <button
            type="button"
            onClick={() => onModeChange("eyes")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              mode === "eyes" ? "bg-cyan-500 text-white font-bold shadow-xs" : "hover:bg-white/10 text-slate-300"
            }`}
            title="Allineamento Volti, Occhi & Spalle tra le varie foto del composit"
          >
            <Eye size={11} />
            Volti & Occhi
          </button>
          <button
            type="button"
            onClick={() => onModeChange("metric")}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              mode === "metric" ? "bg-cyan-500 text-white font-bold shadow-xs" : "hover:bg-white/10 text-slate-300"
            }`}
            title="Griglia Millimetrica 20mm con assi e coordinate"
          >
            <Ruler size={11} />
            Millimetrica
          </button>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/15">
          {(["cyan", "emerald", "amber", "white", "dark"] as GridColor[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                colorMap[c].bgBadge
              } ${color === c ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110" : "opacity-60 hover:opacity-100 border-white/30"}`}
              title={`Colore: ${colorMap[c].label}`}
            />
          ))}
        </div>

        {/* Opacity Selector */}
        <div className="flex items-center gap-1 pl-1 border-l border-white/15 text-[10px] text-slate-300">
          <button
            type="button"
            onClick={() => setOpacity(opacity === 0.5 ? 0.85 : opacity === 0.85 ? 1 : 0.5)}
            className="hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 font-mono"
            title="Regola opacità griglia"
          >
            {Math.round(opacity * 100)}%
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/20 text-slate-400 hover:text-white transition-all ml-0.5"
          title="Chiudi / Disattiva overlay griglia"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
