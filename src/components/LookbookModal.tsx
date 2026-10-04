import React, { useState, useEffect, useRef, useCallback } from "react";
import { ModelData, AgencyInfo, FontFamilyType } from "../types";
import { ModelCard } from "./ModelCard";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Download, 
  Share2, 
  Sparkles,
  Sliders,
  Layers,
  Check,
  Smartphone
} from "lucide-react";

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelData[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  agency: AgencyInfo;
  title: string;
  themeColor: string;
  fontFamily: FontFamilyType;
  watermarkOptions?: {
    enabled: boolean;
    text: string;
    opacity: number;
    fontSize: number;
  };
  onDownloadCurrentPdf: (model: ModelData) => void;
  onShareCurrentPdf: (model: ModelData) => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({
  isOpen,
  onClose,
  models,
  currentIndex,
  onSelectIndex,
  agency,
  title,
  themeColor,
  fontFamily,
  watermarkOptions,
  onDownloadCurrentPdf,
  onShareCurrentPdf,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [slideDuration, setSlideDuration] = useState<number>(5000); // 5s per slide
  const [progress, setProgress] = useState<number>(0);
  const [backdropTheme, setBackdropTheme] = useState<"noir" | "studio" | "minimal">("noir");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [cardScale, setCardScale] = useState<number>(0.8);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Touch swipe tracking for iPad and iPhone
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  const safeIndex = models.length > 0 ? Math.max(0, Math.min(currentIndex, models.length - 1)) : 0;
  const currentModel = models[safeIndex];

  // Calculate dynamic scale to fit viewport exactly (A4 is 297mm x 210mm = 1122.5 x 793.7 px at 96 DPI)
  const updateScale = useCallback(() => {
    if (typeof window === "undefined") return;
    const paddingX = window.innerWidth < 768 ? 24 : 80;
    // Leave room for top and bottom HUD
    const paddingY = showThumbnails ? (window.innerWidth < 768 ? 160 : 200) : 100;
    
    const availableWidth = window.innerWidth - paddingX;
    const availableHeight = window.innerHeight - paddingY;

    // Standard A4 landscape dimensions in pixels roughly: 1122.5 x 793.7
    const baseW = 1122.5;
    const baseH = 793.7;

    const scaleW = availableWidth / baseW;
    const scaleH = availableHeight / baseH;
    const finalScale = Math.max(0.25, Math.min(1.15, Math.min(scaleW, scaleH)));
    setCardScale(finalScale);
  }, [showThumbnails]);

  useEffect(() => {
    if (!isOpen) return;
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [isOpen, updateScale]);

  // Navigate functions with subtle transition animation
  const goToNext = useCallback(() => {
    if (models.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onSelectIndex((safeIndex + 1) % models.length);
      setIsTransitioning(false);
    }, 150);
  }, [models.length, safeIndex, onSelectIndex]);

  const goToPrev = useCallback(() => {
    if (models.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      onSelectIndex((safeIndex - 1 + models.length) % models.length);
      setIsTransitioning(false);
    }, 150);
  }, [models.length, safeIndex, onSelectIndex]);

  // Keyboard navigation (Escape, Left, Right, Space)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrev]);

  // Auto-Slideshow timer
  useEffect(() => {
    if (!isOpen || !isPlaying || models.length <= 1) {
      setProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50; // update progress every 50ms
    const totalSteps = slideDuration / intervalStep;
    let stepCount = 0;

    progressIntervalRef.current = setInterval(() => {
      stepCount++;
      setProgress(Math.min(100, (stepCount / totalSteps) * 100));
      if (stepCount >= totalSteps) {
        stepCount = 0;
        setProgress(0);
        goToNext();
      }
    }, intervalStep);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, isPlaying, slideDuration, models.length, goToNext]);

  // Native fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Touch Swipe Handlers for iPad & iPhone
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // Minimum px to trigger swipe

    if (deltaX > minSwipeDistance) {
      // Swiped Left -> Go Next
      goToNext();
    } else if (deltaX < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!isOpen || !currentModel) return null;

  // Background style classes based on chosen ambient mode
  const bgClasses = {
    noir: "bg-slate-950 text-slate-100",
    studio: "bg-[#181e29] text-slate-100",
    minimal: "bg-[#f1f5f9] text-slate-900",
  }[backdropTheme];

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none overflow-hidden transition-colors duration-500 ${bgClasses}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Glassmorphism Navigation HUD */}
      <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 z-20 backdrop-blur-xl bg-black/35 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shadow-inner">
            <Sparkles size={16} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-white/90">
                Lookbook Agenzia
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-white/80 font-bold">
                {safeIndex + 1} / {models.length}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-white/60 truncate max-w-xs sm:max-w-md">
              {currentModel.name || "Modella senza nome"} &bull; {agency.name || "Cosmopolitan Agency"}
            </p>
          </div>
        </div>

        {/* Center / Ambient Mode controls */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/10">
          <button
            type="button"
            onClick={() => setBackdropTheme("noir")}
            className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all ${
              backdropTheme === "noir" ? "bg-white text-slate-950 shadow-xs" : "text-white/70 hover:text-white"
            }`}
          >
            Runway Dark
          </button>
          <button
            type="button"
            onClick={() => setBackdropTheme("studio")}
            className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all ${
              backdropTheme === "studio" ? "bg-white text-slate-950 shadow-xs" : "text-white/70 hover:text-white"
            }`}
          >
            Studio Grey
          </button>
          <button
            type="button"
            onClick={() => setBackdropTheme("minimal")}
            className={`px-3 py-1 text-[11px] font-bold rounded-xl transition-all ${
              backdropTheme === "minimal" ? "bg-white text-slate-950 shadow-xs" : "text-white/70 hover:text-white"
            }`}
          >
            Minimal Light
          </button>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Slideshow Auto-Play */}
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              isPlaying 
                ? "bg-amber-500 border-amber-400 text-slate-950 shadow-sm" 
                : "bg-white/10 border-white/15 text-white hover:bg-white/20"
            }`}
            title={isPlaying ? "Metti in pausa presentazione (Spazio)" : "Avvia presentazione automatica (Spazio)"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{isPlaying ? "Pausa" : "Auto-Play"}</span>
          </button>

          {/* Download PDF button directly from lookbook */}
          <button
            type="button"
            onClick={() => onDownloadCurrentPdf(currentModel)}
            className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Scarica PDF di questa scheda"
          >
            <Download size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Share / AirDrop directly */}
          <button
            type="button"
            onClick={() => onShareCurrentPdf(currentModel)}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-sm hover:from-indigo-600 hover:to-violet-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Condividi o AirDrop"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">AirDrop</span>
          </button>

          {/* Toggle Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all cursor-pointer"
            title={isFullscreen ? "Esci da Schermo Intero" : "Schermo Intero"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Close Lookbook */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-red-600 hover:border-red-500 transition-all cursor-pointer"
            title="Chiudi Lookbook (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Auto-Play Progress Bar (shown when playing) */}
      {isPlaying && (
        <div className="w-full h-1 bg-white/10 overflow-hidden relative z-20">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Center Stage: Fluidly Scaled Composit Card */}
      <main className="flex-1 w-full flex items-center justify-center relative p-2 sm:p-6 overflow-hidden">
        {/* Left Navigation Chevron Button */}
        {models.length > 1 && (
          <button
            type="button"
            onClick={goToPrev}
            className="absolute left-2 sm:left-6 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-xl cursor-pointer"
            title="Modella precedente (Freccia Sinistra)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Scaled Card Container with smooth opacity/transform transition */}
        <div 
          className={`flex items-center justify-center transition-all duration-200 ${
            isTransitioning ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100"
          }`}
          style={{
            transform: `scale(${cardScale})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
          }}
        >
          <div className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden border border-white/10">
            <ModelCard
              model={currentModel}
              agency={agency}
              title={title}
              themeColor={themeColor}
              fontFamily={fontFamily}
              watermarkOptions={watermarkOptions}
            />
          </div>
        </div>

        {/* Right Navigation Chevron Button */}
        {models.length > 1 && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 sm:right-6 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all shadow-xl cursor-pointer"
            title="Modella successiva (Freccia Destra)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </main>

      {/* Bottom Filmstrip Drawer (Thumbnails of all models) */}
      <footer className="w-full z-20 backdrop-blur-2xl bg-black/40 border-t border-white/10 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Toggle Filmstrip visibility */}
          <button
            type="button"
            onClick={() => {
              setShowThumbnails((prev) => !prev);
              setTimeout(updateScale, 100);
            }}
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-white/70 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10 transition-all cursor-pointer shrink-0"
          >
            <Layers size={13} />
            <span>{showThumbnails ? "Nascondi Rullino" : "Mostra Rullino"}</span>
          </button>

          {/* Swipe Indicator for Mobile */}
          <div className="flex sm:hidden items-center gap-1.5 text-[10px] font-semibold text-white/60">
            <span>👈 Scorri a sinistra o destra per sfogliare</span>
          </div>

          {/* Horizontal Scrolling Thumbnails Filmstrip */}
          {showThumbnails && (
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
              {models.map((m, idx) => {
                const isActive = idx === safeIndex;
                const photo = m.photos?.[0]?.url || "";
                return (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        onSelectIndex(idx);
                        setIsTransitioning(false);
                      }, 100);
                    }}
                    className={`shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-950 border-white shadow-lg scale-105"
                        : "bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-white/20">
                      {photo ? (
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white/40">
                          {m.name ? m.name.charAt(0).toUpperCase() : "#"}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold leading-tight truncate max-w-[90px]">
                        {m.name || `Modella ${idx + 1}`}
                      </p>
                      <p className={`text-[9px] leading-none ${isActive ? "text-slate-600 font-semibold" : "text-white/50"}`}>
                        {m.height ? `${m.height} cm` : `ID #${idx + 1}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Model counter pill */}
          <div className="shrink-0 text-right">
            <span className="text-[11px] font-mono text-white/70 font-semibold">
              {safeIndex + 1} di {models.length}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
