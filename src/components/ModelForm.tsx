import React, { useRef, useState } from "react";
import { ModelData, AgencyInfo, BatchRenameOptions, FontFamilyType } from "../types";
import { BatchRenameModal } from "./BatchRenameModal";
import { MultiPhotoUploadModal } from "./MultiPhotoUploadModal";
import { ARTISTIC_FILTERS, getFilterName, getFilterCss, getFilterById, ArtisticFilter } from "../filters";
import { 
  User, 
  Sparkles, 
  Move, 
  Trash2, 
  RefreshCw, 
  Upload, 
  Layers, 
  Settings, 
  Eye, 
  EyeOff,
  Heart,
  ZoomIn,
  CheckCircle,
  PlusCircle,
  Maximize2,
  Undo,
  Redo,
  Copy,
  GitBranch,
  History,
  BookmarkPlus,
  Tag,
  Search,
  Clock,
  X,
  Grid,
  Target,
  ScanFace,
  Check,
  RotateCcw,
  Cloud,
  AlertCircle,
  FolderInput,
  Download,
  FileUp,
  Camera,
  ChevronRight,
  Sliders,
  ArrowLeft,
  ArrowUpDown,
  ArrowLeftRight,
  SortAsc,
  SortDesc,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Filter,
  Calendar,
  SlidersHorizontal,
  FilterX
} from "lucide-react";

interface ModelFormProps {
  model: ModelData;
  onChangeModel: (updated: ModelData) => void;
  agency: AgencyInfo;
  onChangeAgency: (updated: AgencyInfo) => void;
  title: string;
  onChangeTitle: (title: string) => void;
  presets: ModelData[];
  onSelectPreset: (preset: ModelData) => void;
  themeColor: "silver" | "charcoal" | "beige" | "gold" | "white";
  onSelectThemeColor: (color: "silver" | "charcoal" | "beige" | "gold" | "white") => void;
  fontFamily: FontFamilyType;
  onSelectFontFamily: (font: FontFamilyType) => void;
  onClearForm: () => void;
  localProfiles: ModelData[];
  onSaveLocal: () => void;
  onSaveNewVersion?: (customNote?: string) => void;
  onDeleteLocal: (id: string) => void;
  onDuplicateLocal?: (model: ModelData) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showMultiExport?: boolean;
  onToggleMultiExport?: (val: boolean) => void;
  showGridOverlay?: boolean;
  onToggleGridOverlay?: (val: boolean) => void;
  autoSave?: boolean;
  onToggleAutoSave?: (val: boolean) => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
  lastAutoSavedAt?: Date | null;
  onBatchRenameProfiles?: (options: BatchRenameOptions) => Promise<void>;
  onOpenImportCardsModal?: () => void;
  onExportActiveCardJson?: () => void;
  onExportCatalogBackupJson?: () => void;
  cloudQuotaExceeded?: boolean;
  selectedModelIds?: string[];
  onToggleSelectModelId?: (id: string) => void;
  onSelectAllModelIds?: (ids: string[]) => void;
  onDeselectAllModelIds?: (ids?: string[]) => void;
}

// Helper per rilevamento automatico del viso e degli occhi (FaceDetector API o scansione ponderata su canvas)
async function detectFaceAndEyeAlignment(imgSrc: string): Promise<{ offsetX: number; offsetY: number; zoom: number; message: string }> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = imgSrc;
    });

    // 1. Prova API nativa FaceDetector del browser se supportata (Chromium/Edge)
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        const faceDetector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await faceDetector.detect(img);
        if (faces && faces.length > 0) {
          const face = faces[0];
          const box = face.boundingBox;
          const centerX = box.x + box.width / 2;
          const eyeY = box.y + box.height * 0.38; // Altezza stimata asse oculare all'interno del volto
          
          const naturalW = img.naturalWidth || 1;
          const naturalH = img.naturalHeight || 1;
          
          const offsetX = Math.round(Math.max(10, Math.min(90, (centerX / naturalW) * 100)));
          const offsetY = Math.round(Math.max(10, Math.min(85, (eyeY / naturalH) * 100)));
          
          return {
            offsetX,
            offsetY,
            zoom: 115,
            message: `Viso rilevato con successo (X: ${offsetX}%, Y: ${offsetY}%)`
          };
        }
      } catch {
        // Fallback su scansione canvas
      }
    }

    // 2. Scansione ad alte prestazioni su canvas campionando la densità tonale del volto nella parte superiore
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      const sampleW = 80;
      const sampleH = Math.min(120, Math.round((img.naturalHeight / (img.naturalWidth || 1)) * sampleW)) || 100;
      canvas.width = sampleW;
      canvas.height = sampleH;
      ctx.drawImage(img, 0, 0, sampleW, sampleH);

      const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
      const data = imgData.data;

      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;

      const scanHeight = Math.floor(sampleH * 0.65);
      for (let y = 0; y < scanHeight; y++) {
        for (let x = 0; x < sampleW; x++) {
          const idx = (y * sampleW + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 128) continue;

          // Euristiche incarnato/contrasto ritratto fotografico
          const isWarm = r > 65 && g > 35 && b > 20 && (r - g) > 8 && (r > b);
          if (isWarm) {
            const verticalPriority = 1 + (1 - y / scanHeight);
            weightedX += x * verticalPriority;
            weightedY += y * verticalPriority;
            totalWeight += verticalPriority;
          }
        }
      }

      if (totalWeight > 35) {
        const rawX = ((weightedX / totalWeight) / sampleW) * 100;
        const rawY = ((weightedY / totalWeight) / sampleH) * 100;
        const offsetX = Math.round(Math.max(15, Math.min(85, rawX)));
        const offsetY = Math.round(Math.max(15, Math.min(55, rawY)));
        return {
          offsetX,
          offsetY,
          zoom: 115,
          message: `Viso e sguardo centrati (X: ${offsetX}%, Y: ${offsetY}%)`
        };
      }
    }

    // 3. Preset proporzione aurea per ritrattistica e composit
    return {
      offsetX: 50,
      offsetY: 24,
      zoom: 115,
      message: "Viso centrato in primo piano (X: 50%, Y: 24%)"
    };
  } catch {
    return {
      offsetX: 50,
      offsetY: 24,
      zoom: 115,
      message: "Centratura standard viso applicata"
    };
  }
}

interface PhotoSlotCardProps {
  slot: "Left" | "Center" | "Right" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  label: string;
  imageSrc?: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  filter?: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onTriggerUpload: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onFieldChange: (field: keyof ModelData, value: any) => void;
  availableSlots?: Array<{ slot: string; label: string; hasImage: boolean }>;
  onSwapWithSlot?: (targetSlot: string) => void;
  recommendation: {
    minWidth: number;
    minHeight: number;
    orientation: string;
    ratio: string;
    notes: string;
  };
}

const PhotoSlotCard: React.FC<PhotoSlotCardProps> = ({
  slot,
  label,
  imageSrc,
  zoom,
  offsetX,
  offsetY,
  filter,
  fileInputRef,
  onTriggerUpload,
  onFileChange,
  onRemovePhoto,
  onFieldChange,
  availableSlots,
  onSwapWithSlot,
  recommendation,
}) => {
  const zoomKey = `zoom${slot}` as keyof ModelData;
  const offsetXKey = `offsetX${slot}` as keyof ModelData;
  const offsetYKey = `offsetY${slot}` as keyof ModelData;
  const filterKey = `filter${slot}` as keyof ModelData;

  const [isDetecting, setIsDetecting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showSwapMenu, setShowSwapMenu] = useState(false);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const hasImage = Boolean(imageSrc && imageSrc.trim().length > 0);

  // Azioni di allineamento automatico rapido
  const applyAlignmentPreset = (type: "centra-viso" | "occhi-livello" | "mezzo-busto" | "figura-intera") => {
    if (type === "centra-viso") {
      onFieldChange(offsetXKey, 50);
      onFieldChange(offsetYKey, 24);
      onFieldChange(zoomKey, 115);
      showFeedback("Viso centrato in primo piano (Y: 24%)");
    } else if (type === "occhi-livello") {
      onFieldChange(offsetXKey, 50);
      onFieldChange(offsetYKey, 32);
      onFieldChange(zoomKey, 110);
      showFeedback("Occhi allineati al livello 32% (Regola 1/3)");
    } else if (type === "mezzo-busto") {
      onFieldChange(offsetXKey, 50);
      onFieldChange(offsetYKey, 38);
      onFieldChange(zoomKey, 100);
      showFeedback("Inquadratura mezzo busto (spalle centrate)");
    } else if (type === "figura-intera") {
      onFieldChange(offsetXKey, 50);
      onFieldChange(offsetYKey, 50);
      onFieldChange(zoomKey, 100);
      showFeedback("Centratura neutra 50/50");
    }
  };

  const handleSmartAutoDetect = async () => {
    if (!imageSrc) return;
    setIsDetecting(true);
    try {
      const result = await detectFaceAndEyeAlignment(imageSrc);
      onFieldChange(offsetXKey, result.offsetX);
      onFieldChange(offsetYKey, result.offsetY);
      if (result.zoom) {
        onFieldChange(zoomKey, result.zoom);
      }
      showFeedback(result.message);
    } catch {
      applyAlignmentPreset("centra-viso");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="border border-slate-200/90 rounded-xl bg-white p-4 space-y-3.5 shadow-2xs hover:shadow-xs transition-shadow">
      {/* Header with Slot Title and Status Badge */}
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5 tracking-wide">
          <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block"></span>
          {label}
        </span>
        {hasImage ? (
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-3xs">
            <CheckCircle size={10} className="text-emerald-600" />
            Caricata
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
            Slot vuoto
          </span>
        )}
      </div>

      {/* Hidden File Input for this slot */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {/* Image Preview & Replacement Action Area */}
      {hasImage ? (
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 shadow-3xs">
          <div className="relative group shrink-0">
            <img
              src={imageSrc}
              alt={label}
              className="w-13 h-16 object-cover rounded-lg border border-slate-200 shadow-xs bg-slate-100"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Foto Assegnata</span>
              <span className="text-[9.5px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded font-semibold">
                Pronta
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">
              Sostituisci la foto o usa i controlli automatici per allineare viso e occhi.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
            {availableSlots && availableSlots.length > 1 && (
              <button
                type="button"
                onClick={() => setShowSwapMenu(!showSwapMenu)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  showSwapMenu 
                    ? "bg-amber-500 border-amber-600 text-slate-950 shadow-xs" 
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-3xs"
                }`}
                title="Sposta o scambia manualmente questa foto con un altro Box del Composit"
              >
                <ArrowLeftRight size={13} className={showSwapMenu ? "text-slate-950" : "text-amber-600"} />
                <span className="hidden sm:inline">Sposta / Scambia</span>
                <span className="sm:hidden">Sposta</span>
              </button>
            )}
            <button
              type="button"
              onClick={onTriggerUpload}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer"
              title="Carica una nuova foto al posto di questa senza eliminare o ricreare il blocco"
            >
              <RefreshCw size={13} className="shrink-0" />
              <span>Sostituisci</span>
            </button>
            <button
              type="button"
              onClick={onRemovePhoto}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-red-200"
              title="Rimuovi solo la foto da questo slot (il blocco viene mantenuto)"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="flex-1 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs py-3 px-3 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-3xs"
          >
            <Upload size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
            <span className="font-semibold">Carica / Sfoglia Foto</span>
          </button>
          {availableSlots && availableSlots.some((s) => s.slot !== slot && s.hasImage) && (
            <button
              type="button"
              onClick={() => setShowSwapMenu(!showSwapMenu)}
              className="px-3 py-2 bg-slate-100 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              title="Prendi o sposta una foto da un altro box verso questo slot vuoto"
            >
              <ArrowLeftRight size={13} className="text-amber-600" />
              <span>Prendi da altro box</span>
            </button>
          )}
        </div>
      )}

      {/* Manual Swap Sub-Drawer */}
      {showSwapMenu && availableSlots && availableSlots.length > 1 && (
        <div className="bg-gradient-to-r from-amber-50/90 to-indigo-50/70 border border-amber-200/90 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowLeftRight size={13} className="text-amber-600" />
              {hasImage ? "Sposta o scambia manualmente questa foto con:" : "Prendi una foto da un altro box per metterla qui:"}
            </span>
            <button
              type="button"
              onClick={() => setShowSwapMenu(false)}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 cursor-pointer"
            >
              Chiudi ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {availableSlots
              .filter((s) => s.slot !== slot)
              .map((s) => (
                <button
                  key={s.slot}
                  type="button"
                  onClick={() => {
                    onSwapWithSlot?.(s.slot);
                    setShowSwapMenu(false);
                    showFeedback(`Scambiata con ${s.label}`);
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold bg-white hover:bg-amber-100 hover:text-amber-950 border border-slate-200 hover:border-amber-300 transition-all text-slate-700 shadow-3xs cursor-pointer text-left"
                >
                  <span className="truncate">{s.label}</span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5 bg-slate-100 text-slate-600">
                    {s.hasImage ? "↔️ Scambia" : (hasImage ? "➡️ Sposta qui" : "⬅️ Prendi")}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Dimensioni Consigliate */}
      <div className="bg-slate-50/80 border border-slate-100 px-3 py-2 rounded-lg space-y-1 block text-left">
        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
            {recommendation.minWidth} × {recommendation.minHeight} px
          </span>
          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
            {recommendation.ratio} ({recommendation.orientation})
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          {recommendation.notes}
        </p>
      </div>

      {/* PANNELLO ALLINEAMENTO AUTOMATICO RAPIDO */}
      <div className="bg-slate-50/90 border border-indigo-100/80 rounded-xl p-3 space-y-2.5 shadow-3xs">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles size={12} className="text-indigo-600" />
            Allineamento Automatico Profilo
          </span>
          {feedbackMsg && (
            <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
              <Check size={10} className="text-emerald-600" />
              {feedbackMsg}
            </span>
          )}
        </div>

        {/* Pulsanti Rapidi Automatici: Centra Viso, Allinea Occhi a Livello, Mezzo Busto, Neutro */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => applyAlignmentPreset("centra-viso")}
            disabled={!hasImage}
            className="flex items-center gap-2 p-2 bg-white hover:bg-indigo-50/70 hover:border-indigo-300 border border-slate-200/90 text-slate-800 rounded-lg text-left transition-all shadow-3xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Centra automaticamente il viso in orizzontale e posiziona la testa nel terzo superiore (Y: 24%)"
          >
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Target size={13} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-indigo-900">
                Centra Viso
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">Primo piano / Headshot</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyAlignmentPreset("occhi-livello")}
            disabled={!hasImage}
            className="flex items-center gap-2 p-2 bg-white hover:bg-amber-50/70 hover:border-amber-300 border border-slate-200/90 text-slate-800 rounded-lg text-left transition-all shadow-3xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Allinea la linea degli occhi a livello (Y: 32%) per coordinare lo sguardo orizzontalmente con gli altri profili"
          >
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Eye size={13} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-amber-900">
                Allinea Occhi a Livello
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">Sguardo su linea 1/3</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyAlignmentPreset("mezzo-busto")}
            disabled={!hasImage}
            className="flex items-center gap-2 p-2 bg-white hover:bg-emerald-50/70 hover:border-emerald-300 border border-slate-200/90 text-slate-800 rounded-lg text-left transition-all shadow-3xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Inquadratura equilibrata a mezzo busto con spazio naturale sopra la testa"
          >
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <User size={13} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-emerald-900">
                Mezzo Busto
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">Testa e spalle (Y: 38%)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => applyAlignmentPreset("figura-intera")}
            disabled={!hasImage}
            className="flex items-center gap-2 p-2 bg-white hover:bg-blue-50/70 hover:border-blue-300 border border-slate-200/90 text-slate-800 rounded-lg text-left transition-all shadow-3xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Centratura standard 50% orizzontale e 50% verticale con zoom naturale"
          >
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Maximize2 size={13} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-blue-900">
                Figura Intera
              </div>
              <div className="text-[9px] text-slate-500 leading-tight">Neutro 50/50 naturale</div>
            </div>
          </button>
        </div>

        {/* Pulsante Scansione Intelligente Viso & Occhi */}
        {hasImage && (
          <button
            type="button"
            onClick={handleSmartAutoDetect}
            disabled={isDetecting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/90 text-indigo-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-3xs"
            title="Analizza la foto con FaceDetector o scansione di densità e posiziona automaticamente il profilo"
          >
            {isDetecting ? (
              <>
                <RefreshCw size={12} className="animate-spin text-indigo-600" />
                <span>Rilevamento viso in corso...</span>
              </>
            ) : (
              <>
                <ScanFace size={13} className="text-indigo-600" />
                <span>Rileva e Centra Viso con Intelligenza Visiva</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Regolazioni Manuali Fine-Tuning: Zoom & Offset & Filtro */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        {/* Zoom Slider + Quick Buttons */}
        <div>
          <div className="flex justify-between items-center text-[11px] text-slate-600 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <ZoomIn size={12} className="text-slate-500" /> Zoom: {zoom ?? 100}%
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onFieldChange(zoomKey, 100)}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (zoom ?? 100) === 100 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="100% (Fit normale)"
              >
                100% Fit
              </button>
              <button
                type="button"
                onClick={() => onFieldChange(zoomKey, 115)}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (zoom ?? 100) === 115 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="115% (Primo piano standard)"
              >
                115% Viso
              </button>
              <button
                type="button"
                onClick={() => onFieldChange(zoomKey, 130)}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (zoom ?? 100) === 130 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="130% (Close-up intenso)"
              >
                130% Close-up
              </button>
              <button 
                type="button"
                onClick={() => {
                  onFieldChange(zoomKey, 100);
                  onFieldChange(offsetXKey, 50);
                  onFieldChange(offsetYKey, 50);
                  showFeedback("Allineamento reimpostato a 50/50");
                }} 
                className="text-red-500 hover:text-red-700 hover:underline text-[10px] font-semibold cursor-pointer ml-1"
                title="Reimposta zoom e posizione al centro neutro"
              >
                Reset
              </button>
            </div>
          </div>
          <input
            type="range"
            min="30"
            max="300"
            value={zoom ?? 100}
            onChange={(e) => onFieldChange(zoomKey, parseInt(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer"
          />
        </div>

        {/* Quick Vertical & Horizontal Controls + Fine Slider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 pt-1">
          {/* Spostamento Orizzontale (X) */}
          <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-slate-700">Allineamento Orizzontale (X)</span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">{offsetX ?? 50}%</span>
            </div>
            
            {/* Quick Horizontal Alignment Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetXKey, 30);
                  showFeedback("Allineato a sinistra (30%)");
                }}
                className={`flex-1 py-1 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (offsetX ?? 50) === 30 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Allinea a sinistra (30%)"
              >
                Sinistra (30%)
              </button>
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetXKey, 50);
                  showFeedback("Centrato orizzontalmente (50%)");
                }}
                className={`flex-1 py-1 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (offsetX ?? 50) === 50 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Centra orizzontalmente (50%)"
              >
                Centro (50%)
              </button>
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetXKey, 70);
                  showFeedback("Allineato a destra (70%)");
                }}
                className={`flex-1 py-1 rounded text-[9.5px] font-medium transition-all cursor-pointer ${
                  (offsetX ?? 50) === 70 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Allinea a destra (70%)"
              >
                Destra (70%)
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={offsetX ?? 50}
              onChange={(e) => onFieldChange(offsetXKey, parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Spostamento Verticale (Y) */}
          <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-slate-700">Allineamento Verticale (Y)</span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">{offsetY ?? 50}%</span>
            </div>

            {/* Quick Vertical Alignment Pills: Viso, Occhi, Centro, Basso */}
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetYKey, 24);
                  showFeedback("Viso in alto (24%)");
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-medium transition-all text-center cursor-pointer ${
                  (offsetY ?? 50) === 24 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Viso in alto (24%) per primo piano"
              >
                Viso (24%)
              </button>
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetYKey, 32);
                  showFeedback("Occhi a livello (32%)");
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-medium transition-all text-center cursor-pointer ${
                  (offsetY ?? 50) === 32 ? "bg-amber-600 text-white font-bold" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Allinea gli occhi a livello 32% (Regola 1/3)"
              >
                Occhi (32%)
              </button>
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetYKey, 50);
                  showFeedback("Centro verticale (50%)");
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-medium transition-all text-center cursor-pointer ${
                  (offsetY ?? 50) === 50 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Centro verticale (50%)"
              >
                Centro (50%)
              </button>
              <button
                type="button"
                onClick={() => {
                  onFieldChange(offsetYKey, 70);
                  showFeedback("In basso (70%)");
                }}
                className={`py-1 px-0.5 rounded text-[9px] font-medium transition-all text-center cursor-pointer ${
                  (offsetY ?? 50) === 70 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="In basso (70%) per inquadrare scarpe o abito"
              >
                Basso (70%)
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={offsetY ?? 50}
              onChange={(e) => onFieldChange(offsetYKey, parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModelForm: React.FC<ModelFormProps> = ({
  model,
  onChangeModel,
  agency,
  onChangeAgency,
  title,
  onChangeTitle,
  presets,
  onSelectPreset,
  themeColor,
  onSelectThemeColor,
  fontFamily,
  onSelectFontFamily,
  onClearForm,
  localProfiles,
  onSaveLocal,
  onSaveNewVersion,
  onDeleteLocal,
  onDuplicateLocal,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showMultiExport = false,
  onToggleMultiExport,
  showGridOverlay = false,
  onToggleGridOverlay,
  autoSave = true,
  onToggleAutoSave,
  autoSaveStatus = "idle",
  lastAutoSavedAt = null,
  onBatchRenameProfiles,
  onOpenImportCardsModal,
  onExportActiveCardJson,
  onExportCatalogBackupJson,
  cloudQuotaExceeded = false,
  selectedModelIds = [],
  onToggleSelectModelId,
  onSelectAllModelIds,
  onDeselectAllModelIds,
}) => {
  const [activeTab, setActiveTab] = React.useState<"dati" | "allineamento" | "filtri" | "stile" | "salvati">("dati");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [dbSearch, setDbSearch] = React.useState("");
  const [batchStatusMessage, setBatchStatusMessage] = useState<string | null>(null);
  const [showBatchRenameModal, setShowBatchRenameModal] = useState<boolean>(false);
  const [showMultiPhotoModal, setShowMultiPhotoModal] = useState<boolean>(false);

  // Database Tab: Sorting & Advanced Filter states
  const [dbSortOrder, setDbSortOrder] = useState<"alpha-asc" | "alpha-desc" | "date-desc" | "date-asc">(() => {
    try {
      return (localStorage.getItem("db_cards_sort_order") as any) || "alpha-asc";
    } catch {
      return "alpha-asc";
    }
  });
  const [dbCategoryFilter, setDbCategoryFilter] = useState<"all" | "woman" | "man" | "child-woman" | "child-man">("all");
  const [dbTagFilter, setDbTagFilter] = useState<string>("all"); // "all" | "catalog_only" | "no_catalog" | seasonal tag string
  const [dbDateFilter, setDbDateFilter] = useState<"all" | "today" | "week" | "month" | "year_2026" | "year_2025">("all");
  const [dbShowAdvancedFilters, setDbShowAdvancedFilters] = useState<boolean>(false);

  const handleSetSortOrder = (order: "alpha-asc" | "alpha-desc" | "date-desc" | "date-asc") => {
    setDbSortOrder(order);
    try {
      localStorage.setItem("db_cards_sort_order", order);
    } catch (e) {}
  };

  // Helper to extract unique seasonal tags from profile names
  const availableSeasonalTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    localProfiles.forEach((p) => {
      // Find bracket tags like [SS26], [FW25], [CRUISE], [CASTING]
      const matches = (p.name || "").match(/\[([A-Za-z0-9_\-\s]+)\]/g);
      if (matches) {
        matches.forEach((m) => {
          const clean = m.replace(/[\[\]]/g, "").trim().toUpperCase();
          if (clean && clean.length <= 15) tagSet.add(clean);
        });
      }
      // Also look for prefixes like SS26 - or FW25 -
      const prefixMatch = (p.name || "").match(/^(SS\d{2}|FW\d{2}|CRUISE\s*\d{0,2}|CASTING\s*\d{0,2})/i);
      if (prefixMatch && prefixMatch[1]) {
        tagSet.add(prefixMatch[1].trim().toUpperCase());
      }
    });
    return Array.from(tagSet).sort();
  }, [localProfiles]);

  // Date filtering logic
  const matchDateFilter = (p: ModelData): boolean => {
    if (dbDateFilter === "all") return true;
    const dateStr = p.createdAt || p.updatedAt;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (dbDateFilter === "today") {
      return diffHours <= 24 || d.toDateString() === now.toDateString();
    }
    if (dbDateFilter === "week") {
      return diffDays <= 7;
    }
    if (dbDateFilter === "month") {
      return diffDays <= 31 || (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    }
    if (dbDateFilter === "year_2026") {
      return d.getFullYear() === 2026;
    }
    if (dbDateFilter === "year_2025") {
      return d.getFullYear() === 2025;
    }
    return true;
  };

  // Tag & Catalog filtering logic
  const matchTagFilter = (p: ModelData): boolean => {
    if (dbTagFilter === "all") return true;
    if (dbTagFilter === "catalog_only") {
      return selectedModelIds.includes(p.id);
    }
    if (dbTagFilter === "no_catalog") {
      return !selectedModelIds.includes(p.id);
    }
    // Specific seasonal tag
    const targetTag = dbTagFilter.toUpperCase();
    const nameUpper = (p.name || "").toUpperCase();
    return nameUpper.includes(`[${targetTag}]`) || nameUpper.includes(targetTag);
  };

  const matchGenderCategory = (p: ModelData, target: "woman" | "man" | "child-woman" | "child-man"): boolean => {
    const g = (p.gender || "").toLowerCase().trim();
    if (target === "man") {
      return g === "model man" || g === "man" || g === "uomo" || g === "male";
    }
    if (target === "child-woman") {
      return g === "child model woman" || g === "child woman" || g === "bambina" || g.includes("bambina");
    }
    if (target === "child-man") {
      return g === "child model man" || g === "child man" || g === "bambino" || g.includes("bambino");
    }
    // default woman: matches if explicitly woman, donna, female or if it does NOT match man/child
    const isMan = g === "model man" || g === "man" || g === "uomo" || g === "male";
    const isChildW = g === "child model woman" || g === "child woman" || g === "bambina" || g.includes("bambina");
    const isChildM = g === "child model man" || g === "child man" || g === "bambino" || g.includes("bambino");
    return !isMan && !isChildW && !isChildM;
  };

  // Extended Full-Text Search across name, revision note, version and physical specs
  const matchSearchQuery = (p: ModelData): boolean => {
    if (!dbSearch.trim()) return true;
    const q = dbSearch.toLowerCase().trim();
    if (p.name && p.name.toLowerCase().includes(q)) return true;
    if (p.versionNote && p.versionNote.toLowerCase().includes(q)) return true;
    if (`v${p.version || 1}`.toLowerCase().includes(q)) return true;
    if (p.height && p.height.toLowerCase().includes(q)) return true;
    if (p.eyes && p.eyes.toLowerCase().includes(q)) return true;
    if (p.hair && p.hair.toLowerCase().includes(q)) return true;
    if (p.shoes && p.shoes.toLowerCase().includes(q)) return true;
    if (p.sizeUpper && p.sizeUpper.toLowerCase().includes(q)) return true;
    if (p.sizeLower && p.sizeLower.toLowerCase().includes(q)) return true;
    if (p.bust && p.bust.toLowerCase().includes(q)) return true;
    if (p.waist && p.waist.toLowerCase().includes(q)) return true;
    if (p.hips && p.hips.toLowerCase().includes(q)) return true;
    return false;
  };

  const activeAdvancedFiltersCount = 
    (dbCategoryFilter !== "all" ? 1 : 0) + 
    (dbTagFilter !== "all" ? 1 : 0) + 
    (dbDateFilter !== "all" ? 1 : 0) + 
    (dbSearch.trim() ? 1 : 0);

  const handleResetAllDbFilters = () => {
    setDbSearch("");
    setDbCategoryFilter("all");
    setDbTagFilter("all");
    setDbDateFilter("all");
  };
  
  // States for 'Filtri Stile' section
  const [selectedFilterScope, setSelectedFilterScope] = useState<"all" | string>("all");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<"all" | "bn" | "vintage" | "editorial" | "warm">("all");
  const [filterFeedbackMsg, setFilterFeedbackMsg] = useState<string | null>(null);
  
  // Refs for file uploads
  const fileLeftRef = useRef<HTMLInputElement>(null);
  const fileCenterRef = useRef<HTMLInputElement>(null);
  const fileRightRef = useRef<HTMLInputElement>(null);
  const file4Ref = useRef<HTMLInputElement>(null);
  const file5Ref = useRef<HTMLInputElement>(null);
  const file6Ref = useRef<HTMLInputElement>(null);
  const file7Ref = useRef<HTMLInputElement>(null);
  const file8Ref = useRef<HTMLInputElement>(null);
  const file9Ref = useRef<HTMLInputElement>(null);
  const file10Ref = useRef<HTMLInputElement>(null);

  // Form field changes
  const handleFieldChange = (field: keyof ModelData, value: string | number) => {
    onChangeModel({
      ...model,
      [field]: value,
    });
  };

  // Helper for image recommended sizes
  const getImageRecommendation = (slot: "Left" | "Center" | "Right" | "4" | "5" | "6" | "7" | "8" | "9" | "10", layout: string) => {
    const l = layout || "classic";
    if (l === "classic") {
      if (slot === "Left") {
        return { minWidth: 1000, minHeight: 1440, orientation: "Verticale", ratio: "2:3", notes: "Ottimale per Primo Piano / Ritratti viso e spalle." };
      }
      if (slot === "Center") {
        return { minWidth: 1000, minHeight: 1470, orientation: "Verticale", ratio: "2:3", notes: "Ottimale per Mezza Figura (fino ai fianchi)." };
      }
      if (slot === "Right") {
        return { minWidth: 1000, minHeight: 1440, orientation: "Verticale", ratio: "2:3", notes: "Ottimale per Figura Intera (da piedi a testa)." };
      }
    }
    if (l === "duo") {
      if (slot === "Left") {
        return { minWidth: 1500, minHeight: 1420, orientation: "Quasi Quadrata", ratio: "1.1:1", notes: "Consigliato ritratto largo o primo piano editoriale." };
      }
      if (slot === "Right") {
        return { minWidth: 1500, minHeight: 1420, orientation: "Quasi Quadrata", ratio: "1.1:1", notes: "Consigliato corpo intero o mezza figura ampia." };
      }
    }
    if (l === "asymmetric-left") {
      if (slot === "Left") {
        return { minWidth: 1500, minHeight: 1420, orientation: "Quasi Quadrata", ratio: "1.1:1", notes: "Copertina Sinistra di grande impatto visivo." };
      }
      if (slot === "Center") {
        return { minWidth: 1500, minHeight: 625, orientation: "Orizzontale Larga", ratio: "2.4:1", notes: "Ottimale per primi piani ravvicinati o dettagli." };
      }
      if (slot === "Right") {
        return { minWidth: 1500, minHeight: 625, orientation: "Orizzontale Larga", ratio: "2.4:1", notes: "Dettaglio secondario o foto d'azione / mood." };
      }
    }
    if (l === "solo") {
      return { minWidth: 2400, minHeight: 1100, orientation: "Orizzontale Panoramica", ratio: "2.15:1", notes: "Grande copertina singola. Scegli un'immagine panoramica ad alta definizione." };
    }
    if (l === "grid-4") {
      return { minWidth: 1500, minHeight: 625, orientation: "Orizzontale Larga", ratio: "2.4:1", notes: "Foto orizzontali adatte alla disposizione in griglia." };
    }
    if (l === "grid-6") {
      return { minWidth: 1200, minHeight: 760, orientation: "Orizzontale Standard", ratio: "1.6:1 (3:2)", notes: "Formato fotografico standard (3:2), per una griglia uniforme." };
    }
    if (l === "editorial-6") {
      if (slot === "Left") {
        return { minWidth: 1000, minHeight: 1600, orientation: "Verticale Slanciata", ratio: "1:1.7", notes: "Grande foto verticale slanciata (estrema sinistra)." };
      }
      if (slot === "Center") {
        return { minWidth: 1000, minHeight: 1400, orientation: "Verticale", ratio: "2:3", notes: "Foto verticale centrale accanto alle misure." };
      }
      return { minWidth: 1000, minHeight: 1400, orientation: "Verticale Standard", ratio: "2:3", notes: "Disposta nella griglia 2x2 sul lato destro." };
    }
    if (l === "cinematic-2") {
      return { minWidth: 1920, minHeight: 650, orientation: "Cinematica Orizzontale", ratio: "3:1", notes: "Grande foto panoramica/orizzontale in formato 3:1." };
    }
    if (l === "campaign-2-portrait") {
      return { minWidth: 1000, minHeight: 1200, orientation: "Verticale (Portrait)", ratio: "1:1.12", notes: "Grande foto di campagna verticale slanciata." };
    }
    if (l === "campaign-2" || l === "campaign-wedding" || l === "campaign-solo") {
      return { minWidth: 1200, minHeight: 1000, orientation: "Orizzontale/Quadrata", ratio: "1.14:1", notes: "Grande foto di campagna o editoriale, formato quasi quadrato." };
    }
    if (l === "campaign-brand-6") {
      return { minWidth: 1000, minHeight: 1333, orientation: "Verticale (Portrait)", ratio: "3:4", notes: "Foto verticale di campagna o ritratto, formato 3:4." };
    }
    if (l === "campaign-5-hybrid") {
      return { minWidth: 1000, minHeight: 1290, orientation: "Verticale (Portrait)", ratio: "3:4", notes: "Grande foto verticale a sinistra + 4 ritratti verticali sulla destra." };
    }
    if (l === "campaign-tvc" || l === "campaign-tvc-4") {
      return { minWidth: 1920, minHeight: 1080, orientation: "Widescreen 16:9 (Still TVC)", ratio: "1.77:1 (16:9)", notes: "Still video o fotogramma in formato cinematografico 16:9." };
    }
    return { minWidth: 1000, minHeight: 1000, orientation: "Qualsiasi", ratio: "Flessibile", notes: "Usa foto ad alta definizione." };
  };

  // Helper per ottenere l'elenco degli slot fotografici attivi nel layout corrente
  const getActiveSlots = (currentLayout: string | undefined, m: ModelData) => {
    const l = currentLayout || "classic";
    let showLeft = false;
    let showCenter = false;
    let showRight = false;
    let show4 = false;
    let show5 = false;
    let show6 = false;
    let show7 = false;
    let show8 = false;
    let show9 = false;
    let show10 = false;

    let labelLeft = "1. Foto Sinistra";
    let labelCenter = "2. Foto Centro";
    let labelRight = "3. Foto Destra";
    let label4 = "4. Quarta Foto";
    let label5 = "5. Quinta Foto";
    let label6 = "6. Sesta Foto";
    let label7 = "7. Settima Foto";
    let label8 = "8. Ottava Foto";
    let label9 = "9. Nona Foto";
    let label10 = "10. Decima Foto";

    if (l === "classic") {
      showLeft = true;
      showCenter = true;
      showRight = true;
      labelLeft = "Foto 1 (Sinistra - Ritr./Profilo)";
      labelCenter = "Foto 2 (Centro - Tre Quarti)";
      labelRight = "Foto 3 (Destra - Figura Intera)";
    } else if (l === "duo") {
      showLeft = true;
      showRight = true;
      labelLeft = "Foto 1 (Sinistra - Ritratto)";
      labelRight = "Foto 2 (Destra - Intero/Primo Piano)";
    } else if (l === "asymmetric-left") {
      showLeft = true;
      showCenter = true;
      showRight = true;
      labelLeft = "Foto 1 (Sinistra Grande)";
      labelCenter = "Foto 2 (Alto Destra)";
      labelRight = "Foto 3 (Basso Destra)";
    } else if (l === "solo") {
      if (m.imageLeft && !m.imageCenter) {
        showLeft = true;
        labelLeft = "Foto Copertina Singola (Sinistra)";
      } else {
        showCenter = true;
        labelCenter = "Foto Copertina Singola (Centro)";
      }
    } else if (l === "grid-4") {
      showLeft = true; showCenter = true; showRight = true; show4 = true;
      labelLeft = "Foto 1 (Alto Sinistra)";
      labelCenter = "Foto 2 (Alto Destra)";
      labelRight = "Foto 3 (Basso Sinistra)";
      label4 = "Foto 4 (Basso Destra)";
    } else if (l === "grid-6") {
      showLeft = true; showCenter = true; showRight = true; show4 = true; show5 = true; show6 = true;
      labelLeft = "Foto 1 (Alto Sinistra)";
      labelCenter = "Foto 2 (Alto Centro)";
      labelRight = "Foto 3 (Alto Destra)";
      label4 = "Foto 4 (Basso Sinistra)";
      label5 = "Foto 5 (Basso Centro)";
      label6 = "Foto 6 (Basso Destra)";
    } else if (l === "editorial-6") {
      showLeft = true; showCenter = true; showRight = true; show4 = true; show5 = true; show6 = true;
      labelLeft = "Foto 1 (Grande Sinistra)";
      labelCenter = "Foto 2 (Mezza Figura Centro)";
      labelRight = "Foto 3 (Griglia Alto Sx)";
      label4 = "Foto 4 (Griglia Alto Dx)";
      label5 = "Foto 5 (Griglia Basso Sx)";
      label6 = "Foto 6 (Griglia Basso Dx)";
    } else if (l === "grid-10") {
      showLeft = true; showCenter = true; showRight = true; show4 = true; show5 = true; show6 = true; show7 = true; show8 = true; show9 = true; show10 = true;
      labelLeft = "Foto 1 (R1-P1)"; labelCenter = "Foto 2 (R1-P2)"; labelRight = "Foto 3 (R1-P3)"; label4 = "Foto 4 (R1-P4)"; label5 = "Foto 5 (R1-P5)";
      label6 = "Foto 6 (R2-P1)"; label7 = "Foto 7 (R2-P2)"; label8 = "Foto 8 (R2-P3)"; label9 = "Foto 9 (R2-P4)"; label10 = "Foto 10 (R2-P5)";
    } else if (l === "cinematic-2") {
      showLeft = true; showCenter = true;
      labelLeft = "Foto 1 (Cinematica Alto)";
      labelCenter = "Foto 2 (Cinematica Basso)";
    } else if (l === "campaign-2" || l === "campaign-2-portrait" || l === "campaign-wedding" || l === "campaign-seamless") {
      showLeft = true; showCenter = true;
      labelLeft = "Foto 1 (Sinistra)";
      labelCenter = "Foto 2 (Destra)";
    } else if (l === "campaign-3") {
      showLeft = true; showCenter = true; showRight = true;
      labelLeft = "Foto 1 (Sinistra Slanciata)";
      labelCenter = "Foto 2 (Centro Alto)";
      labelRight = "Foto 3 (Centro Basso)";
    } else if (l === "campaign-tvc") {
      showLeft = true; showCenter = true; showRight = true;
      labelLeft = "Foto 1 (TVC Still Alto Sx)";
      labelCenter = "Foto 2 (TVC Still Alto Dx)";
      labelRight = "Foto 3 (TVC Still Basso)";
    } else if (l === "campaign-tvc-4") {
      showLeft = true; showCenter = true; showRight = true; show4 = true;
      labelLeft = "Foto 1 (TVC 1 Alto Sx)";
      labelCenter = "Foto 2 (TVC 2 Alto Dx)";
      labelRight = "Foto 3 (TVC 3 Basso Sx)";
      label4 = "Foto 4 (TVC 4 Basso Dx)";
    } else if (l === "campaign-solo") {
      showLeft = true;
      labelLeft = "Foto Campagna Singola";
    } else if (l === "campaign-brand-6") {
      showLeft = true; showCenter = true; showRight = true; show4 = true; show5 = true; show6 = true;
      labelLeft = "Foto 1 (Alto Sx)"; labelCenter = "Foto 2 (Alto Cx)"; labelRight = "Foto 3 (Alto Dx)";
      label4 = "Foto 4 (Basso Sx)"; label5 = "Foto 5 (Basso Cx)"; label6 = "Foto 6 (Basso Dx)";
    } else if (l === "campaign-5-hybrid") {
      showLeft = true; showCenter = true; showRight = true; show4 = true; show5 = true;
      labelLeft = "Foto 1 (Grande Sx)"; labelCenter = "Foto 2 (Griglia Alto Sx)"; labelRight = "Foto 3 (Griglia Alto Dx)";
      label4 = "Foto 4 (Griglia Basso Sx)"; label5 = "Foto 5 (Griglia Basso Dx)";
    } else {
      showLeft = true; showCenter = true; showRight = true;
    }

    const all = [
      { slot: "Left" as const, show: showLeft, label: labelLeft, img: m.imageLeft, filterKey: "filterLeft" as keyof ModelData, filterVal: m.filterLeft },
      { slot: "Center" as const, show: showCenter, label: labelCenter, img: m.imageCenter, filterKey: "filterCenter" as keyof ModelData, filterVal: m.filterCenter },
      { slot: "Right" as const, show: showRight, label: labelRight, img: m.imageRight, filterKey: "filterRight" as keyof ModelData, filterVal: m.filterRight },
      { slot: "4" as const, show: show4, label: label4, img: m.image4, filterKey: "filter4" as keyof ModelData, filterVal: m.filter4 },
      { slot: "5" as const, show: show5, label: label5, img: m.image5, filterKey: "filter5" as keyof ModelData, filterVal: m.filter5 },
      { slot: "6" as const, show: show6, label: label6, img: m.image6, filterKey: "filter6" as keyof ModelData, filterVal: m.filter6 },
      { slot: "7" as const, show: show7, label: label7, img: m.image7, filterKey: "filter7" as keyof ModelData, filterVal: m.filter7 },
      { slot: "8" as const, show: show8, label: label8, img: m.image8, filterKey: "filter8" as keyof ModelData, filterVal: m.filter8 },
      { slot: "9" as const, show: show9, label: label9, img: m.image9, filterKey: "filter9" as keyof ModelData, filterVal: m.filter9 },
      { slot: "10" as const, show: show10, label: label10, img: m.image10, filterKey: "filter10" as keyof ModelData, filterVal: m.filter10 },
    ];

    return all.filter(item => item.show);
  };

  const activeSlots = React.useMemo(() => {
    return getActiveSlots(model.layout, model);
  }, [
    model.layout,
    model.imageLeft, model.imageCenter, model.imageRight,
    model.image4, model.image5, model.image6, model.image7, model.image8, model.image9, model.image10,
    model.filterLeft, model.filterCenter, model.filterRight,
    model.filter4, model.filter5, model.filter6, model.filter7, model.filter8, model.filter9, model.filter10
  ]);

  const activeFilterSlotsCount = React.useMemo(() => {
    return activeSlots.filter(s => s.filterVal && s.filterVal !== "none").length;
  }, [activeSlots]);

  const previewImageSrc = React.useMemo(() => {
    const firstWithImg = activeSlots.find(s => !!s.img);
    if (firstWithImg && firstWithImg.img) return firstWithImg.img;
    return model.imageLeft || model.imageCenter || model.imageRight || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";
  }, [activeSlots, model.imageLeft, model.imageCenter, model.imageRight]);

  const handleApplyFilter = (filterId: string, targetScope: "all" | string = selectedFilterScope) => {
    const updated = { ...model };
    const filterObj = ARTISTIC_FILTERS.find(f => f.id === filterId);
    const filterLabel = filterObj ? filterObj.name : "Naturale";

    if (targetScope === "all") {
      updated.filterLeft = filterId;
      updated.filterCenter = filterId;
      updated.filterRight = filterId;
      updated.filter4 = filterId;
      updated.filter5 = filterId;
      updated.filter6 = filterId;
      updated.filter7 = filterId;
      updated.filter8 = filterId;
      updated.filter9 = filterId;
      updated.filter10 = filterId;
      setFilterFeedbackMsg(filterId === "none" ? "Colori originali ripristinati su tutte le foto" : `Filtro "${filterLabel}" applicato a tutte le foto!`);
    } else {
      const key = `filter${targetScope}` as keyof ModelData;
      (updated as any)[key] = filterId;
      setFilterFeedbackMsg(filterId === "none" ? `Filtro rimosso dalla Foto ${targetScope}` : `Filtro "${filterLabel}" applicato alla Foto ${targetScope}!`);
    }
    onChangeModel(updated);
    setTimeout(() => setFilterFeedbackMsg(null), 3500);
  };

  // Helper to resize and compress uploaded images to prevent browser crash and localStorage Quota limits
  const resizeAndCompressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          resolve("");
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Adjust keeping aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target.result as string); // Fallback to raw base64
            return;
          }

          try {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", quality);
            resolve(compressed);
          } catch (e) {
            console.error("Canvas draw failed, falling back to original", e);
            resolve(event.target.result as string);
          }
        };
        img.onerror = () => {
          resolve(event.target?.result as string); // Fallback to raw base64
        };
        img.src = event.target.result as string;
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsDataURL(file);
    });
  };

  // Image Upload handler (resizes & loads locally as Base64 so it can be exported to PDF)
  const handleImageFileChange = async (slot: "Left" | "Center" | "Right" | "4" | "5" | "6" | "7" | "8" | "9" | "10", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // High quality web compression
        const compressedBase64 = await resizeAndCompressImage(file, 1200, 1200, 0.82);
        if (compressedBase64) {
          const key = (slot === "Left" || slot === "Center" || slot === "Right") ? `image${slot}` : `image${slot}`;
          handleFieldChange(key as keyof ModelData, compressedBase64);
        }
      } catch (err) {
        console.error("Failed to compress, reading normally", err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64 = event.target.result as string;
            const key = (slot === "Left" || slot === "Center" || slot === "Right") ? `image${slot}` : `image${slot}`;
            handleFieldChange(key as keyof ModelData, base64);
          }
        };
        reader.readAsDataURL(file);
      }
      e.target.value = "";
    }
  };

  // Trigger file click
  const triggerImageUpload = (slot: "Left" | "Center" | "Right" | "4" | "5" | "6" | "7" | "8" | "9" | "10") => {
    if (slot === "Left" && fileLeftRef.current) fileLeftRef.current.click();
    if (slot === "Center" && fileCenterRef.current) fileCenterRef.current.click();
    if (slot === "Right" && fileRightRef.current) fileRightRef.current.click();
    if (slot === "4" && file4Ref.current) file4Ref.current.click();
    if (slot === "5" && file5Ref.current) file5Ref.current.click();
    if (slot === "6" && file6Ref.current) file6Ref.current.click();
    if (slot === "7" && file7Ref.current) file7Ref.current.click();
    if (slot === "8" && file8Ref.current) file8Ref.current.click();
    if (slot === "9" && file9Ref.current) file9Ref.current.click();
    if (slot === "10" && file10Ref.current) file10Ref.current.click();
  };

  // Preset triggers
  const handleUrlPaste = (slot: "Left" | "Center" | "Right", url: string) => {
    handleFieldChange(`image${slot}` as keyof ModelData, url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full bg-slate-50/50">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 bg-white p-1 gap-1 sticky top-0 z-10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("dati")}
          className={`flex-1 min-w-[70px] py-2.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "dati" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <User size={13} />
          <span className="hidden sm:inline">Dati Fisici</span>
          <span className="sm:hidden">Dati</span>
        </button>
        <button
          onClick={() => setActiveTab("allineamento")}
          className={`flex-1 min-w-[70px] py-2.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "allineamento" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Move size={13} />
          <span className="hidden sm:inline">Foto & Crop</span>
          <span className="sm:hidden">Foto</span>
        </button>
        <button
          onClick={() => setActiveTab("filtri")}
          className={`flex-1 min-w-[95px] py-2.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "filtri" 
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500 font-bold" 
              : "text-slate-700 hover:bg-indigo-50/70 hover:text-indigo-700"
          }`}
        >
          <Sparkles size={13} className={activeTab === "filtri" ? "text-amber-300 animate-pulse" : "text-amber-500"} />
          <span className="font-bold">Filtri Stile</span>
          {activeFilterSlotsCount > 0 && (
            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
              activeTab === "filtri" ? "bg-white text-indigo-700" : "bg-indigo-100 text-indigo-800"
            }`}>
              {activeFilterSlotsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("stile")}
          className={`flex-1 min-w-[70px] py-2.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "stile" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Settings size={13} />
          <span className="hidden sm:inline">Stile Scheda</span>
          <span className="sm:hidden">Stile</span>
        </button>
        <button
          onClick={() => setActiveTab("salvati")}
          className={`flex-1 min-w-[75px] py-2.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "salvati" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers size={13} />
          <span>Database</span>
          {localProfiles.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
              {localProfiles.length}
            </span>
          )}
          {selectedModelIds.length > 0 && (
            <span className="bg-emerald-600 text-white text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ml-0.5 flex items-center gap-0.5" title={`${selectedModelIds.length} schede con tag Catalogo`}>
              <Bookmark size={8} />
              <span>{selectedModelIds.length}</span>
            </span>
          )}
        </button>
      </div>

      {/* Undo/Redo & Utility bar */}
      <div className="flex items-center justify-between px-5 py-2 w-full bg-slate-50 border-b border-slate-100 text-xs shadow-3xs">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1 select-none">
          <Sparkles size={11} className="text-slate-400 animate-pulse" />
          Pannello Compilazione
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            type="button"
            className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
              canUndo
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs active:scale-95"
                : "bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Annulla ultima modifica (Ctrl+Z)"
          >
            <Undo size={12} />
            Annulla
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            type="button"
            className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
              canRedo
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-2xs active:scale-95"
                : "bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Ripristina modifica (Ctrl+Y)"
          >
            <Redo size={12} />
            Ripristina
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] md:max-h-[calc(100vh-220px)] no-scrollbar">
        
        {/* TAB 1: DATI FISICI DEL MODELLO */}
        {activeTab === "dati" && (
          <div className="space-y-4">
            
            {/* Quick Saved Card Selector in Tab 1 - Directly switch between created cards */}
            {localProfiles.length > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-150 rounded-xl p-3 mb-1 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers size={13} className="text-indigo-600" />
                    Card Create nel Database ({localProfiles.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("salvati")}
                    className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Vedi Archivio Completo →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {localProfiles.slice(0, 12).map((p) => {
                    const isActive = p.id === model.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectPreset(p)}
                        className={`text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all font-semibold cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500 font-bold"
                            : "bg-white hover:bg-indigo-100/70 text-slate-800 border border-slate-200"
                        }`}
                        title={`Carica ${p.name || "Modello"} (v${p.version || 1})`}
                      >
                        <span className="truncate max-w-[130px]">{p.name || "Senza Nome"}</span>
                        <span className={`text-[9px] px-1 rounded-sm ${isActive ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-500"}`}>
                          v{p.version || 1}
                        </span>
                      </button>
                    );
                  })}
                  {localProfiles.length > 12 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("salvati")}
                      className="text-xs py-1 px-2 text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      +{localProfiles.length - 12} altre...
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Template Presets */}
            <div>
              <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2 text-left">
                Carica Modello di Prova
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-xs py-1.5 px-3 rounded-full flex items-center gap-1 transition-all text-slate-700 font-medium shadow-2xs"
                  >
                    <Sparkles size={11} className="text-amber-500" />
                    {preset.name}
                  </button>
                ))}
                <button
                  onClick={onClearForm}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-600 py-1.5 px-3 rounded-full flex items-center gap-1 transition-all"
                >
                  <Trash2 size={11} />
                  Nuovo / Pulisci
                </button>
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Modella / Modello</label>
                <input
                  type="text"
                  placeholder="es. MARIA V."
                  value={model.name}
                  onChange={(e) => handleFieldChange("name", e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Campagna / Cliente / Editoriale (es. per layout Campagna)</label>
                <input
                  type="text"
                  placeholder="es. WEDDING ASIA (apparirà come: NOME FOR WEDDING ASIA o sdoppiato con | per Touring)"
                  value={model.campaignName || ""}
                  onChange={(e) => handleFieldChange("campaignName", e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium"
                />
              </div>

              {(model.layout === "campaign-2" || model.layout === "campaign-2-portrait" || model.layout === "campaign-wedding" || model.layout === "campaign-seamless" || model.layout === "classic" || model.layout === "duo" || model.layout === "campaign-solo") && (
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">Didascalia Personalizzata (Sovrascrive tutto il testo predefinito in basso, es: NOME ... )</label>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold">Opzionale</span>
                  </div>
                  <input
                    type="text"
                    placeholder="es. MARIA V. FOR VOGUE ITALIA (lascia vuoto per usare il testo predefinito)"
                    value={model.customCaption || ""}
                    onChange={(e) => handleFieldChange("customCaption", e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium placeholder:text-slate-400"
                  />
                </div>
              )}

              {(model.layout === "campaign-tvc" || model.layout === "campaign-tvc-4") && (
                <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase block">Specifiche Layout TVC ({model.layout === "campaign-tvc-4" ? "4" : "3"} Video Still)</span>
                  <div className={`grid grid-cols-1 ${model.layout === "campaign-tvc-4" ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Brand / TVC 1 (Top-Left)</label>
                      <input
                        type="text"
                        placeholder="es. OPPO RENO 2"
                        value={model.tvcLabelLeft || ""}
                        onChange={(e) => handleFieldChange("tvcLabelLeft", e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Brand / TVC 2 (Top-Right)</label>
                      <input
                        type="text"
                        placeholder="es. YARDLEY TVC"
                        value={model.tvcLabelCenter || ""}
                        onChange={(e) => handleFieldChange("tvcLabelCenter", e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Brand / TVC 3 (Bottom-Left)</label>
                      <input
                        type="text"
                        placeholder="es. VIVO TVC"
                        value={model.tvcLabelRight || ""}
                        onChange={(e) => handleFieldChange("tvcLabelRight", e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                      />
                    </div>
                    {model.layout === "campaign-tvc-4" && (
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Brand / TVC 4 (Bottom-Right)</label>
                        <input
                          type="text"
                          placeholder="es. SAMSONITE TVC"
                          value={model.tvcLabel4 || ""}
                          onChange={(e) => handleFieldChange("tvcLabel4", e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {model.layout === "campaign-brand-6" && (
                <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase block">Testi Layout Royal Enfield (Spazi Sinistra)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">BLOCCO SUPERIORE (Sopra la Linea Divider)</span>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">Riga 1: Brand/Cliente</label>
                        <input
                          type="text"
                          placeholder="es. ROYAL ENFIELD"
                          value={model.campaignName || ""}
                          onChange={(e) => handleFieldChange("campaignName", e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">Riga 2: Campagna/Collection</label>
                        <input
                          type="text"
                          placeholder="es. CAMPAIGN"
                          value={model.tvcLabelLeft || ""}
                          onChange={(e) => handleFieldChange("tvcLabelLeft", e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 bg-white border border-slate-100 rounded-lg space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block">BLOCCO INFERIORE (Sotto la Linea Divider)</span>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">Riga 1: Brand/Cliente</label>
                        <input
                          type="text"
                          placeholder="es. ROYAL ENFIELD"
                          value={model.customCaption || ""}
                          onChange={(e) => handleFieldChange("customCaption", e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">Riga 2: Campagna/Collection</label>
                        <input
                          type="text"
                          placeholder="es. CAMPAIGN"
                          value={model.tvcLabelCenter || ""}
                          onChange={(e) => handleFieldChange("tvcLabelCenter", e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="col-span-2 text-left">
                <label className="text-xs font-semibold text-slate-700 block mb-1">GENERE / CATEGORIA (In Database)</label>
                <select
                  value={model.gender || "model woman"}
                  onChange={(e) => handleFieldChange("gender", e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium cursor-pointer"
                >
                  <option value="model woman">model woman (Donna)</option>
                  <option value="model man">model man (Uomo)</option>
                  <option value="child model woman">child model woman (Bambina)</option>
                  <option value="child model man">child model man (Bambino)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Questo campo non apparirà sul foglio e-composit ma serve per catalogare i modelli nel database.</p>
              </div>

              <div className="col-span-2 text-left bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hideSpecsBar"
                    checked={model.hideSpecsBar || false}
                    onChange={(e) => handleFieldChange("hideSpecsBar", e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                  />
                  <label htmlFor="hideSpecsBar" className="text-xs font-bold text-slate-800 cursor-pointer select-none uppercase tracking-wider">
                    Nascondi Barra dei Dati Fisici
                  </label>
                </div>

                {!model.hideSpecsBar && (
                  <div className="flex items-center gap-2 pl-6 pt-0.5">
                    <input
                      type="checkbox"
                      id="specsBarWhiteBg"
                      checked={model.specsBarWhiteBg || false}
                      onChange={(e) => handleFieldChange("specsBarWhiteBg", e.target.checked)}
                      className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                    />
                    <label htmlFor="specsBarWhiteBg" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                      Sfondo bianco con testi neri (Inverti colori barra)
                    </label>
                  </div>
                )}
                {model.hideSpecsBar && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Testo Sostitutivo Barra (opzionale)
                      </label>
                      <input
                        type="text"
                        placeholder="es. WWW.COSMOPOLITANAGENCY.IT • INFO@COSMOPOLITANAGENCY.IT"
                        value={model.customFooterText || ""}
                        onChange={(e) => handleFieldChange("customFooterText", e.target.value.toUpperCase())}
                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-medium focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Questo testo sostituirà l'intera barra nera dei dati fisici sulla scheda. Se lasciato vuoto, la barra sarà semplicemente rimossa.
                      </p>
                    </div>

                    {model.customFooterText && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="customFooterWhiteBg"
                          checked={model.customFooterWhiteBg || false}
                          onChange={(e) => handleFieldChange("customFooterWhiteBg", e.target.checked)}
                          className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                        />
                        <label htmlFor="customFooterWhiteBg" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                          Testo nero su base bianca (senza barra nera)
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Personalizzazione Intestazione Destra (Card)</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderName"
                        checked={model.hideHeaderName || false}
                        onChange={(e) => handleFieldChange("hideHeaderName", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderName" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Nome
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderIndex"
                        checked={model.hideHeaderIndex || false}
                        onChange={(e) => handleFieldChange("hideHeaderIndex", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderIndex" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Index
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideSocialIcons"
                        checked={model.hideSocialIcons || false}
                        onChange={(e) => handleFieldChange("hideSocialIcons", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideSocialIcons" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Social
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Personalizzazione Intestazione Sinistra (Card)</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderLogo"
                        checked={model.hideHeaderLogo || false}
                        onChange={(e) => handleFieldChange("hideHeaderLogo", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderLogo" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Logo/Nome Agenzia
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderCategory"
                        checked={model.hideHeaderCategory || false}
                        onChange={(e) => handleFieldChange("hideHeaderCategory", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderCategory" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Categoria (Titolo)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderContacts1"
                        checked={model.hideHeaderContacts1 || false}
                        onChange={(e) => handleFieldChange("hideHeaderContacts1", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderContacts1" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Tel/Nome
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderContacts2"
                        checked={model.hideHeaderContacts2 || false}
                        onChange={(e) => handleFieldChange("hideHeaderContacts2", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderContacts2" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Indirizzo/Città
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="hideHeaderContacts3"
                        checked={model.hideHeaderContacts3 || false}
                        onChange={(e) => handleFieldChange("hideHeaderContacts3", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="hideHeaderContacts3" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Nascondi Email/Sito Web
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showHeaderDividerLine"
                        checked={model.showHeaderDividerLine || false}
                        onChange={(e) => handleFieldChange("showHeaderDividerLine", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="showHeaderDividerLine" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Mostra Rigo Separatore Header
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Protezione Immagini (Watermark)</span>
                    {model.showWatermark && (
                      <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        Attivo su tutte le foto
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showWatermark"
                        checked={model.showWatermark || false}
                        onChange={(e) => handleFieldChange("showWatermark", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="showWatermark" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Abilita Watermark (Filigrana Foto)
                      </label>
                    </div>

                    {model.showWatermark && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                        {/* Preset Rapidi */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            Preset Rapidi a 1 Clic
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "📄 BOZZA", val: "BOZZA" },
                              { label: "🔒 CONFIDENZIALE", val: "CONFIDENZIALE" },
                              { label: "🎬 SOLO CASTING", val: "SOLO CASTING" },
                              { label: `🏛️ ${(agency?.name || "AGENZIA").toUpperCase()}`, val: (agency?.name || "COSMOPOLITAN").toUpperCase() },
                              { label: `👤 ${(model.name || "MODELLA").toUpperCase()}`, val: (model.name || "MODELLA").toUpperCase() },
                            ].map((preset) => (
                              <button
                                key={preset.val}
                                type="button"
                                onClick={() => handleFieldChange("watermarkText", preset.val)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  (model.watermarkText || "").toUpperCase() === preset.val.toUpperCase()
                                    ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Testo Libero */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                            Testo Personalizzato
                          </label>
                          <input
                            type="text"
                            placeholder="es. BOZZA, CONFIDENZIALE, COSMOPOLITAN"
                            value={model.watermarkText || ""}
                            onChange={(e) => handleFieldChange("watermarkText", e.target.value.toUpperCase())}
                            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </div>

                        {/* Slider Opacità & Dimensione Font */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                          {/* Opacità */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                Opacità: {Math.round((model.watermarkOpacity !== undefined ? model.watermarkOpacity : 0.20) * 100)}%
                              </label>
                              <span className="text-[9px] text-slate-400 font-mono">10% - 50%</span>
                            </div>
                            <input
                              type="range"
                              min="0.10"
                              max="0.50"
                              step="0.02"
                              value={model.watermarkOpacity !== undefined ? model.watermarkOpacity : 0.20}
                              onChange={(e) => handleFieldChange("watermarkOpacity", parseFloat(e.target.value))}
                              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                            />
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>Trasparente</span>
                              <span>Medio</span>
                              <span>Marcato</span>
                            </div>
                          </div>

                          {/* Dimensione Carattere */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                Dimensione: {model.watermarkFontSize || 20} px
                              </label>
                              <span className="text-[9px] text-slate-400 font-mono">15 - 28 px</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: "Compatto", size: 15 },
                                { label: "Medio", size: 20 },
                                { label: "Grande", size: 28 },
                              ].map((opt) => (
                                <button
                                  key={opt.size}
                                  type="button"
                                  onClick={() => handleFieldChange("watermarkFontSize", opt.size)}
                                  className={`py-1 text-[9.5px] font-bold rounded-md border text-center transition-all cursor-pointer ${
                                    (model.watermarkFontSize || 20) === opt.size
                                      ? "bg-slate-900 text-white border-slate-900"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-400 leading-normal bg-white p-2 rounded-lg border border-slate-200/60">
                          ℹ️ La filigrana viene visualizzata in tempo reale in diagonale su tutte le foto della modella e salvata ad alta definizione nei download PDF e JPG.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Logo Presentazione Album (Basso Destra)</span>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBottomRightLogo"
                        checked={model.showBottomRightLogo || false}
                        onChange={(e) => handleFieldChange("showBottomRightLogo", e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                      />
                      <label htmlFor="showBottomRightLogo" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                        Mostra Logo in Basso a Destra
                      </label>
                    </div>
                    {model.showBottomRightLogo && (
                      <div className="bg-white p-3 border border-slate-100 rounded-lg space-y-3.5">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Altezza Logo: {model.bottomRightLogoHeight || 28}px</label>
                            <span className="text-[10px] font-semibold text-slate-400">Ottimale: 25px - 32px</span>
                          </div>
                          <input
                            type="range"
                            min="25"
                            max="32"
                            step="1"
                            value={model.bottomRightLogoHeight || 28}
                            onChange={(e) => handleFieldChange("bottomRightLogoHeight", parseInt(e.target.value, 10))}
                            className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          />
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Regola l'altezza in pixel per rendere il logo leggibile senza rubare l'attenzione dalla modella.
                          </p>
                        </div>

                        {/* Choice of Logo */}
                        <div className="border-t border-slate-100 pt-2.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="useShortLogoForBottomRight"
                            checked={model.useShortLogoForBottomRight || false}
                            onChange={(e) => handleFieldChange("useShortLogoForBottomRight", e.target.checked)}
                            className="h-3.5 w-3.5 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                          />
                          <label htmlFor="useShortLogoForBottomRight" className="text-[10px] font-bold text-slate-600 cursor-pointer select-none uppercase tracking-wider">
                            Preferisci Logo Breve (CP) se presente
                          </label>
                        </div>

                        {/* Avoid overlapping - hiding contact info */}
                        <div className="border-t border-slate-100 pt-2.5 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="hideContactsBlock"
                            checked={model.hideContactsBlock || false}
                            onChange={(e) => handleFieldChange("hideContactsBlock", e.target.checked)}
                            className="h-3.5 w-3.5 rounded-sm border-slate-300 text-slate-950 focus:ring-slate-950 cursor-pointer"
                          />
                          <label htmlFor="hideContactsBlock" className="text-[10px] font-bold text-amber-700 cursor-pointer select-none uppercase tracking-wider">
                            Nascondi Contatti / Indirizzo (Evita sovrapposizioni)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Logo / Testo Intestazione Centrale (Catalogo)</span>
                  <p className="text-[9px] text-slate-400">Inserisci un testo o carica un logo specifico da mostrare esattamente al centro della testata in tutti i layout (perfetto per cataloghi o presentazioni personalizzate).</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                    {/* Top Center Text */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Testo Centrato</label>
                      <input
                        type="text"
                        placeholder="es. PRESENTATION 2026/27"
                        value={model.topCenterText || ""}
                        onChange={(e) => handleFieldChange("topCenterText", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                      />
                    </div>

                    {/* Top Center Logo */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Logo Centrato</label>
                      <div className="flex items-center gap-2">
                        {model.topCenterLogo ? (
                          <div className="relative w-16 h-10 bg-white border border-slate-200 rounded-md p-1 flex items-center justify-center overflow-hidden">
                            <img src={model.topCenterLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => handleFieldChange("topCenterLogo", undefined)}
                              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors flex items-center justify-center"
                              title="Rimuovi"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2 h-2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex-grow">
                            <input
                              type="file"
                              accept="image/*"
                              id="top-center-logo-upload"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await resizeAndCompressImage(file, 400, 200, 0.85);
                                    handleFieldChange("topCenterLogo", compressed);
                                  } catch (err) {
                                    console.error("Failed to compress top center logo", err);
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleFieldChange("topCenterLogo", event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById("top-center-logo-upload")?.click()}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-1.5 px-2.5 rounded-md transition-colors text-center"
                            >
                              Carica Logo Centrato
                            </button>
                          </div>
                        )}
                        
                        {model.topCenterLogo && (
                          <div className="w-24">
                            <div className="text-[8px] font-bold text-slate-400 mb-0.5">ALTEZZA: {model.topCenterLogoHeight || 10}mm</div>
                            <input
                              type="range"
                              min="5"
                              max="20"
                              step="1"
                              value={model.topCenterLogoHeight || 10}
                              onChange={(e) => handleFieldChange("topCenterLogoHeight", parseInt(e.target.value, 10))}
                              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ALTEZZA (cm)</label>
                <input
                  type="text"
                  placeholder="es. 178"
                  value={model.height}
                  onChange={(e) => handleFieldChange("height", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">SENO / bust (cm)</label>
                <input
                  type="text"
                  placeholder="es. 85"
                  value={model.bust}
                  onChange={(e) => handleFieldChange("bust", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">VITA / waist (cm)</label>
                <input
                  type="text"
                  placeholder="es. 60"
                  value={model.waist}
                  onChange={(e) => handleFieldChange("waist", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">FIANCHI / hips (cm)</label>
                <input
                  type="text"
                  placeholder="es. 89"
                  value={model.hips}
                  onChange={(e) => handleFieldChange("hips", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">SCARPE / shoes</label>
                <input
                  type="text"
                  placeholder="es. 39"
                  value={model.shoes}
                  onChange={(e) => handleFieldChange("shoes", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">OCCHI / eyes</label>
                <input
                  type="text"
                  placeholder="es. Verdi / Green"
                  value={model.eyes}
                  onChange={(e) => handleFieldChange("eyes", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">CAPELLI / hair</label>
                <input
                  type="text"
                  placeholder="es. Castani / Brown"
                  value={model.hair}
                  onChange={(e) => handleFieldChange("hair", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">TAGLIA Sup. / S</label>
                <input
                  type="text"
                  placeholder="es. XS / S"
                  value={model.sizeUpper}
                  onChange={(e) => handleFieldChange("sizeUpper", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">TAGLIA Inf. / I</label>
                <input
                  type="text"
                  placeholder="es. 38 / 40"
                  value={model.sizeLower}
                  onChange={(e) => handleFieldChange("sizeLower", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4 pt-2 bg-gradient-to-br from-indigo-50/90 to-purple-50/70 p-3.5 rounded-xl border border-indigo-150 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <GitBranch size={14} className="text-indigo-600" />
                  Salvataggio & Versionamento
                </h4>
                <div className="flex items-center gap-1.5">
                  {autoSave && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-save ON
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs uppercase tracking-wide">
                    Versione {model.version || 1}
                  </span>
                  {model.updatedAt && (
                    <span className="text-[9px] text-slate-500 font-mono hidden sm:inline" title={new Date(model.updatedAt).toLocaleString("it-IT")}>
                      {new Date(model.updatedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>
              </div>

              {autoSave && (
                <div className="mb-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-emerald-900">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span>
                      {autoSaveStatus === "saving" 
                        ? "Salvataggio automatico su Firestore in corso..." 
                        : "Salvataggio automatico attivo: ogni modifica viene salvata su Firestore."}
                    </span>
                  </div>
                  {lastAutoSavedAt && (
                    <span className="text-[9.5px] text-emerald-700 font-mono shrink-0 ml-1">
                      {lastAutoSavedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                Puoi aggiornare la scheda attuale o creare una <strong>nuova versione (revisione)</strong> con foto, misure o layout differenti senza sovrascrivere lo storico.
              </p>

              {/* Version Note input */}
              <div className="mb-3">
                <label className="text-[10px] font-bold text-indigo-900 block mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Tag size={10} className="text-indigo-500" />
                  Nota o Etichetta Revisione (opzionale)
                </label>
                <input
                  type="text"
                  placeholder={`es. Foto nuova campagna, Misure aggiornate, v${(model.version || 1) + 1}...`}
                  value={model.versionNote || ""}
                  onChange={(e) => handleFieldChange("versionNote", e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Version History Selector if this model has other versions */}
              {(() => {
                const baseRoot = model.rootId || model.id;
                const currentName = (model.name || "").trim().toLowerCase();
                const relatedVersions = localProfiles.filter(p => 
                  (p.rootId && p.rootId === baseRoot) ||
                  (!p.rootId && p.id === baseRoot) ||
                  (currentName && p.name && p.name.trim().toLowerCase() === currentName)
                );

                if (relatedVersions.length > 1) {
                  // Sort by version ascending
                  const sorted = [...relatedVersions].sort((a, b) => (a.version || 1) - (b.version || 1));
                  return (
                    <div className="mb-3 bg-white/80 p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1">
                        <History size={11} className="text-slate-500" />
                        Tutte le revisioni di {model.name || "questo modello"} ({sorted.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto">
                        {sorted.map(rev => {
                          const isActive = rev.id === model.id;
                          return (
                            <button
                              key={rev.id}
                              type="button"
                              onClick={() => onSelectPreset(rev)}
                              className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                isActive 
                                  ? "bg-indigo-600 text-white shadow-2xs font-bold ring-1 ring-indigo-400" 
                                  : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200"
                              }`}
                              title={rev.versionNote ? `${rev.name} (v${rev.version || 1}) - ${rev.versionNote}` : `${rev.name} (v${rev.version || 1})`}
                            >
                              <span>v{rev.version || 1}</span>
                              {rev.versionNote && (
                                <span className="max-w-[80px] truncate text-[9px] opacity-85">({rev.versionNote})</span>
                              )}
                              {isActive && <span className="text-[8px] bg-indigo-700 px-1 rounded-xs">Attiva</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-2">
                {/* Save as New Version Button */}
                <button
                  type="button"
                  onClick={() => onSaveNewVersion ? onSaveNewVersion(model.versionNote) : onSaveLocal()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all hover:shadow cursor-pointer"
                  title="Salva lo stato attuale come una nuova revisione numerata (es. v2, v3), conservando la versione precedente intatta."
                >
                  <BookmarkPlus size={14} />
                  Salva come nuova versione (v{(model.version || 1) + 1})
                </button>

                {/* Overwrite / Update active version */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSaveLocal}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                    title={`Aggiorna e sovrascrive i dati della versione corrente v${model.version || 1}`}
                  >
                    <CheckCircle size={12} />
                    Aggiorna Versione Attuale (v{model.version || 1})
                  </button>

                  {onDuplicateLocal && (
                    <button
                      type="button"
                      onClick={() => onDuplicateLocal(model)}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="Duplica come modello del tutto separato"
                    >
                      <Copy size={12} />
                      Copia
                    </button>
                  )}
                </div>

                {/* Import / Export Card Quick Actions */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2">
                  {onOpenImportCardsModal && (
                    <button
                      type="button"
                      onClick={onOpenImportCardsModal}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                      title="Importa una card o profilo modella/o da file JSON, archivio catalogo, CSV o foto"
                    >
                      <FolderInput size={13} />
                      <span>Importa Card</span>
                    </button>
                  )}

                  {onExportActiveCardJson && (
                    <button
                      type="button"
                      onClick={onExportActiveCardJson}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-3xs"
                      title="Esporta questa scheda modella/o in file JSON scaricabile per condividerla"
                    >
                      <Download size={13} />
                      <span>Esporta Card (.json)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CARICA E ALLINEA FOTO */}
        {activeTab === "allineamento" && (() => {
          const currentLayout = model.layout || "classic";
          
          let showLeft = false;
          let showCenter = false;
          let showRight = false;
          let show4 = false;
          let show5 = false;
          let show6 = false;
          let show7 = false;
          let show8 = false;
          let show9 = false;
          let show10 = false;

          let labelLeft = "1. FOTO SINISTRA";
          let labelCenter = "2. FOTO CENTRALE";
          let labelRight = "3. FOTO DESTRA";
          let label4 = "4. QUARTA FOTO";
          let label5 = "5. QUINTA FOTO";
          let label6 = "6. SESTA FOTO";
          let label7 = "7. SETTIMA FOTO";
          let label8 = "8. OTTAVA FOTO";
          let label9 = "9. NONA FOTO";
          let label10 = "10. DECIMA FOTO";

          if (currentLayout === "classic") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            labelLeft = "1. FOTO SINISTRA (RITRATTO / PROFILO)";
            labelCenter = "2. FOTO CENTRO (TRE QUARTI)";
            labelRight = "3. FOTO DESTRA (INTERO)";
          } else if (currentLayout === "duo") {
            showLeft = true;
            showCenter = false; // Duo ONLY uses Left and Right
            showRight = true;
            labelLeft = "1. PRIMA FOTO - DI SINISTRA (RITRATTO / EDITORIAL)";
            labelRight = "2. SECONDA FOTO - DI DESTRA (CORPO INTERO / PRIMO PIANO)";
          } else if (currentLayout === "asymmetric-left") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            labelLeft = "1. FOTO SINISTRA GRANDE (COPPERTINA)";
            labelCenter = "2. FOTO IN ALTO A DESTRA (SECONDARIA A)";
            labelRight = "3. FOTO IN BASSO A DESTRA (SECONDARIA B)";
          } else if (currentLayout === "solo") {
            if (model.imageLeft && !model.imageCenter) {
              showLeft = true;
              showCenter = false;
              labelLeft = "FOTO DI SINISTRA (FOTO COPERTINA ATTIVA)";
            } else {
              showLeft = false;
              showCenter = true;
              labelCenter = "FOTO CENTRALE (FOTO COPERTINA ATTIVA)";
            }
            showRight = false;
          } else if (currentLayout === "grid-4") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            labelLeft = "1. FOTO IN ALTO A SINISTRA";
            labelCenter = "2. FOTO IN ALTO A DESTRA";
            labelRight = "3. FOTO IN BASSO A SINISTRA";
            label4 = "4. FOTO IN BASSO A DESTRA";
          } else if (currentLayout === "grid-6") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            show5 = true;
            show6 = true;
            labelLeft = "1. RITRATTO A (ALTO A SINISTRA)";
            labelCenter = "2. RITRATTO B (ALTO AL CENTRO)";
            labelRight = "3. DETTAGLIO (ALTO A DESTRA)";
            label4 = "4. MOOD A (BASSO A SINISTRA)";
            label5 = "5. MOOD B (BASSO AL CENTRO)";
            label6 = "6. INTERO (BASSO A DESTRA)";
          } else if (currentLayout === "editorial-6") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            show5 = true;
            show6 = true;
            labelLeft = "1. RITRATTO SINISTRA GRANDE (ESTREMO SINISTRA)";
            labelCenter = "2. FOTO MEZZA FIGURA CENTRALE (ACCANTO ALLE MISURE)";
            labelRight = "3. RITRATTO GRIGLIA DESTRA A (ALTO A SINISTRA)";
            label4 = "4. RITRATTO GRIGLIA DESTRA B (ALTO A DESTRA)";
            label5 = "5. RITRATTO GRIGLIA DESTRA C (BASSO A SINISTRA)";
            label6 = "6. RITRATTO GRIGLIA DESTRA D (BASSO A DESTRA)";
          } else if (currentLayout === "grid-10") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            show5 = true;
            show6 = true;
            show7 = true;
            show8 = true;
            show9 = true;
            show10 = true;
            labelLeft = "1. RITRATTO (RIGA 1 - POS. 1)";
            labelCenter = "2. RITRATTO (RIGA 1 - POS. 2)";
            labelRight = "3. RITRATTO (RIGA 1 - POS. 3)";
            label4 = "4. RITRATTO (RIGA 1 - POS. 4)";
            label5 = "5. RITRATTO (RIGA 1 - POS. 5)";
            label6 = "6. RITRATTO (RIGA 2 - POS. 1)";
            label7 = "7. RITRATTO (RIGA 2 - POS. 2)";
            label8 = "8. RITRATTO (RIGA 2 - POS. 3)";
            label9 = "9. RITRATTO (RIGA 2 - POS. 4)";
            label10 = "10. RITRATTO (RIGA 2 - POS. 5)";
          } else if (currentLayout === "cinematic-2") {
            showLeft = true;
            showCenter = true;
            labelLeft = "1. FOTO CINEMATICA (ALTO)";
            labelCenter = "2. FOTO CINEMATICA (BASSO)";
          } else if (currentLayout === "campaign-2") {
            showLeft = true;
            showCenter = true;
            labelLeft = "1. FOTO CAMPAGNA (SINISTRA)";
            labelCenter = "2. FOTO CAMPAGNA (DESTRA)";
          } else if (currentLayout === "campaign-2-portrait") {
            showLeft = true;
            showCenter = true;
            labelLeft = "1. FOTO CAMPAGNA VERTICALE (SINISTRA)";
            labelCenter = "2. FOTO CAMPAGNA VERTICALE (DESTRA)";
          } else if (currentLayout === "campaign-wedding") {
            showLeft = true;
            showCenter = true;
            labelLeft = "1. FOTO SINISTRA (STANDARD)";
            labelCenter = "2. FOTO DESTRA (CON CORNICE MARMO)";
          } else if (currentLayout === "campaign-3") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            labelLeft = "1. FOTO SINISTRA (TALL VERTICALE)";
            labelCenter = "2. FOTO CENTRO ALTO (ORIZZONTALE)";
            labelRight = "3. FOTO CENTRO BASSO (ORIZZONTALE)";
          } else if (currentLayout === "campaign-seamless") {
            showLeft = true;
            showCenter = true;
            labelLeft = "1. FOTO CAMPAGNA SINISTRA (ORIZZONTALE)";
            labelCenter = "2. FOTO CAMPAGNA DESTRA (ORIZZONTALE)";
          } else if (currentLayout === "campaign-tvc") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            labelLeft = "1. TVC STILL - IN ALTO A SINISTRA (ORIZZONTALE)";
            labelCenter = "2. TVC STILL - IN ALTO A DESTRA (ORIZZONTALE)";
            labelRight = "3. TVC STILL - IN BASSO AL CENTRO (ORIZZONTALE)";
          } else if (currentLayout === "campaign-tvc-4") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            labelLeft = "1. TVC STILL - IN ALTO A SINISTRA (ORIZZONTALE)";
            labelCenter = "2. TVC STILL - IN ALTO A DESTRA (ORIZZONTALE)";
            labelRight = "3. TVC STILL - IN BASSO A SINISTRA (ORIZZONTALE)";
            label4 = "4. TVC STILL - IN BASSO A DESTRA (ORIZZONTALE)";
          } else if (currentLayout === "campaign-solo") {
            showLeft = true;
            labelLeft = "FOTO CAMPAGNA (PRINCIPALE CENTRATA)";
          } else if (currentLayout === "campaign-brand-6") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            show5 = true;
            show6 = true;
            labelLeft = "1. FOTO ALTO SINISTRA (PORTRAIT)";
            labelCenter = "2. FOTO ALTO CENTRO (PORTRAIT)";
            labelRight = "3. FOTO ALTO DESTRA (PORTRAIT)";
            label4 = "4. FOTO BASSO SINISTRA (PORTRAIT)";
            label5 = "5. FOTO BASSO CENTRO (PORTRAIT)";
            label6 = "6. FOTO BASSO DESTRA (PORTRAIT)";
          } else if (currentLayout === "campaign-5-hybrid") {
            showLeft = true;
            showCenter = true;
            showRight = true;
            show4 = true;
            show5 = true;
            labelLeft = "1. FOTO SINISTRA GRANDE (PORTRAIT SU TUTTA L'ALTEZZA)";
            labelCenter = "2. FOTO GRIGLIA ALTO SINISTRA (ACCANTO A SINISTRA)";
            labelRight = "3. FOTO GRIGLIA ALTO DESTRA (ACCANTO A DESTRA)";
            label4 = "4. FOTO GRIGLIA BASSO SINISTRA (SOTTO FOTO 2)";
            label5 = "5. FOTO GRIGLIA BASSO DESTRA (SOTTO FOTO 3)";
          }

          const availableSlotsList = [
            { slot: "Left", label: labelLeft, hasImage: Boolean(model.imageLeft) },
            { slot: "Center", label: labelCenter, hasImage: Boolean(model.imageCenter) },
            { slot: "Right", label: labelRight, hasImage: Boolean(model.imageRight) },
            { slot: "4", label: label4, hasImage: Boolean(model.image4) },
            { slot: "5", label: label5, hasImage: Boolean(model.image5) },
            { slot: "6", label: label6, hasImage: Boolean(model.image6) },
            { slot: "7", label: label7, hasImage: Boolean(model.image7) },
            { slot: "8", label: label8, hasImage: Boolean(model.image8) },
            { slot: "9", label: label9, hasImage: Boolean(model.image9) },
            { slot: "10", label: label10, hasImage: Boolean(model.image10) },
          ].filter((s) => {
            if (s.slot === "Left") return showLeft;
            if (s.slot === "Center") return showCenter;
            if (s.slot === "Right") return showRight;
            if (s.slot === "4") return show4;
            if (s.slot === "5") return show5;
            if (s.slot === "6") return show6;
            if (s.slot === "7") return show7;
            if (s.slot === "8") return show8;
            if (s.slot === "9") return show9;
            if (s.slot === "10") return show10;
            return false;
          });

          const handleSwapSlots = (slotA: string, slotB: string) => {
            const getKeys = (s: string) => ({
              image: `image${s}` as keyof ModelData,
              zoom: `zoom${s}` as keyof ModelData,
              offsetX: `offsetX${s}` as keyof ModelData,
              offsetY: `offsetY${s}` as keyof ModelData,
              filter: `filter${s}` as keyof ModelData,
            });

            const a = getKeys(slotA);
            const b = getKeys(slotB);

            const updated: ModelData = {
              ...model,
              [a.image]: (model as any)[b.image] || "",
              [b.image]: (model as any)[a.image] || "",
              [a.zoom]: (model as any)[b.zoom] ?? 100,
              [b.zoom]: (model as any)[a.zoom] ?? 100,
              [a.offsetX]: (model as any)[b.offsetX] ?? 50,
              [b.offsetX]: (model as any)[a.offsetX] ?? 50,
              [a.offsetY]: (model as any)[b.offsetY] ?? 50,
              [b.offsetY]: (model as any)[a.offsetY] ?? 50,
              [a.filter]: (model as any)[b.filter] || "none",
              [b.filter]: (model as any)[a.filter] || "none",
            };

            onChangeModel(updated);
          };

          return (
            <div className="space-y-6">
              {/* BANNER REGIA MULTI-FOTO A 360° (Facoltativo / A discrezione dell'utente) */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-indigo-900/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Regia Multi-Foto a 360°
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                      Facoltativo & Manuale
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-lg">
                    Vuoi caricare più foto insieme e decidere tu l'ordine? Seleziona i file dal rullino o Mac, visualizza le miniature e assegna/sposta ciascun box a piacimento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMultiPhotoModal(true)}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-95 text-white shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles size={14} className="text-amber-300" />
                  <span>Carica Tutte le Foto Insieme</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-indigo-50/60 border border-amber-200/80 p-3.5 rounded-xl text-[11px] text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5 text-slate-800">
                    <span>💡 Allineamento & Proporzioni Viso</span>
                  </div>
                  <p className="text-slate-600 text-[10.5px]">
                    Tutte le foto mantengono le proporzioni originali senza allungarsi. Usa gli slider e i pulsanti automatici per centrare volti e allineare gli occhi a livello.
                  </p>
                </div>
                {onToggleGridOverlay && (
                  <button
                    type="button"
                    onClick={() => onToggleGridOverlay(!showGridOverlay)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      showGridOverlay
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 ring-2 ring-indigo-300"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300"
                    }`}
                    title="Attiva/Disattiva overlay di griglia (terzi, assi volti e millimetrica) sull'anteprima a fianco"
                  >
                    <Grid size={13} className={showGridOverlay ? "text-cyan-300" : "text-slate-500"} />
                    <span>{showGridOverlay ? "Griglia Attiva (ON)" : "Mostra Griglia Guida"}</span>
                  </button>
                )}
              </div>

              {/* BARRA AZIONI RAPIDE: ALLINEA TUTTE LE FOTO */}
              {(() => {
                const handleBatchAlign = (target: "centra-viso" | "occhi-livello" | "mezzo-busto" | "reset") => {
                  const updated = { ...model };
                  const slotList: Array<{ slot: "Left" | "Center" | "Right" | "4" | "5" | "6" | "7" | "8" | "9" | "10"; show: boolean; img?: string }> = [
                    { slot: "Left", show: showLeft, img: model.imageLeft },
                    { slot: "Center", show: showCenter, img: model.imageCenter },
                    { slot: "Right", show: showRight, img: model.imageRight },
                    { slot: "4", show: show4, img: model.image4 },
                    { slot: "5", show: show5, img: model.image5 },
                    { slot: "6", show: show6, img: model.image6 },
                    { slot: "7", show: show7, img: model.image7 },
                    { slot: "8", show: show8, img: model.image8 },
                    { slot: "9", show: show9, img: model.image9 },
                    { slot: "10", show: show10, img: model.image10 },
                  ];

                  let appliedCount = 0;
                  slotList.forEach(({ slot, show, img }) => {
                    if (!show || !img) return;
                    appliedCount++;
                    const zoomKey = `zoom${slot}` as keyof ModelData;
                    const offsetXKey = `offsetX${slot}` as keyof ModelData;
                    const offsetYKey = `offsetY${slot}` as keyof ModelData;

                    if (target === "centra-viso") {
                      (updated as any)[offsetXKey] = 50;
                      (updated as any)[offsetYKey] = 24;
                      (updated as any)[zoomKey] = 115;
                    } else if (target === "occhi-livello") {
                      (updated as any)[offsetXKey] = 50;
                      (updated as any)[offsetYKey] = 32;
                      (updated as any)[zoomKey] = 110;
                    } else if (target === "mezzo-busto") {
                      (updated as any)[offsetXKey] = 50;
                      (updated as any)[offsetYKey] = 38;
                      (updated as any)[zoomKey] = 100;
                    } else if (target === "reset") {
                      (updated as any)[offsetXKey] = 50;
                      (updated as any)[offsetYKey] = 50;
                      (updated as any)[zoomKey] = 100;
                    }
                  });

                  if (appliedCount === 0) {
                    setBatchStatusMessage("Nessuna foto presente negli slot attivi");
                    setTimeout(() => setBatchStatusMessage(null), 2500);
                    return;
                  }

                  onChangeModel(updated);
                  const msgMap = {
                    "centra-viso": `Viso centrato su ${appliedCount} foto`,
                    "occhi-livello": `Occhi allineati al 32% su ${appliedCount} foto`,
                    "mezzo-busto": `Mezzo busto applicato su ${appliedCount} foto`,
                    "reset": `Ripristinato 50/50 su ${appliedCount} foto`,
                  };
                  setBatchStatusMessage(msgMap[target]);
                  setTimeout(() => setBatchStatusMessage(null), 3000);
                };

                return (
                  <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Target size={14} className="text-indigo-600" />
                          Allineamento Automatico Complessivo (Tutte le Foto)
                        </span>
                        <p className="text-[10.5px] text-slate-500">
                          Applica istantaneamente lo stesso livello e centratura a tutti gli slot caricati nella scheda.
                        </p>
                      </div>
                      {batchStatusMessage && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1 shrink-0 animate-pulse">
                          <Check size={10} className="text-emerald-600" />
                          {batchStatusMessage}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleBatchAlign("centra-viso")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/90 border border-indigo-200 text-indigo-800 transition-all cursor-pointer shadow-3xs"
                        title="Centra orizzontalmente e posiziona il viso in alto al centro su tutte le foto attive"
                      >
                        <Target size={13} className="text-indigo-600" />
                        <span>Centra Viso su Tutte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBatchAlign("occhi-livello")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 transition-all cursor-pointer shadow-3xs"
                        title="Allinea lo sguardo a livello (32%) su tutte le foto per una perfetta linea visiva orizzontale"
                      >
                        <Eye size={13} className="text-amber-600" />
                        <span>Allinea Occhi a Livello su Tutte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBatchAlign("mezzo-busto")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 transition-all cursor-pointer shadow-3xs"
                        title="Imposta inquadratura mezzo busto su tutte le foto attive"
                      >
                        <User size={13} className="text-emerald-600" />
                        <span>Mezzo Busto su Tutte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBatchAlign("reset")}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer ml-auto"
                        title="Reimposta zoom a 100% e posizione a 50/50 su tutte le foto caricate"
                      >
                        <RotateCcw size={12} />
                        <span>Ripristina Tutto (50/50)</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* SEC 1: FOTO SINISTRA */}
              {showLeft && (
                <PhotoSlotCard
                  slot="Left"
                  label={labelLeft}
                  imageSrc={model.imageLeft}
                  zoom={model.zoomLeft ?? 100}
                  offsetX={model.offsetXLeft ?? 50}
                  offsetY={model.offsetYLeft ?? 50}
                  filter={model.filterLeft}
                  fileInputRef={fileLeftRef}
                  onTriggerUpload={() => triggerImageUpload("Left")}
                  onFileChange={(e) => handleImageFileChange("Left", e)}
                  onRemovePhoto={() => handleFieldChange("imageLeft", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("Left", targetSlot)}
                  recommendation={getImageRecommendation("Left", currentLayout)}
                />
              )}

              {/* SEC 2: FOTO CENTRALE */}
              {showCenter && (
                <PhotoSlotCard
                  slot="Center"
                  label={labelCenter}
                  imageSrc={model.imageCenter}
                  zoom={model.zoomCenter ?? 100}
                  offsetX={model.offsetXCenter ?? 50}
                  offsetY={model.offsetYCenter ?? 50}
                  filter={model.filterCenter}
                  fileInputRef={fileCenterRef}
                  onTriggerUpload={() => triggerImageUpload("Center")}
                  onFileChange={(e) => handleImageFileChange("Center", e)}
                  onRemovePhoto={() => handleFieldChange("imageCenter", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("Center", targetSlot)}
                  recommendation={getImageRecommendation("Center", currentLayout)}
                />
              )}

              {/* SEC 3: FOTO DESTRA */}
              {showRight && (
                <PhotoSlotCard
                  slot="Right"
                  label={labelRight}
                  imageSrc={model.imageRight}
                  zoom={model.zoomRight ?? 100}
                  offsetX={model.offsetXRight ?? 50}
                  offsetY={model.offsetYRight ?? 50}
                  filter={model.filterRight}
                  fileInputRef={fileRightRef}
                  onTriggerUpload={() => triggerImageUpload("Right")}
                  onFileChange={(e) => handleImageFileChange("Right", e)}
                  onRemovePhoto={() => handleFieldChange("imageRight", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("Right", targetSlot)}
                  recommendation={getImageRecommendation("Right", currentLayout)}
                />
              )}

              {/* SEC 4: FOTO 4 */}
              {show4 && (
                <PhotoSlotCard
                  slot="4"
                  label={label4}
                  imageSrc={model.image4}
                  zoom={model.zoom4 ?? 100}
                  offsetX={model.offsetX4 ?? 50}
                  offsetY={model.offsetY4 ?? 50}
                  filter={model.filter4}
                  fileInputRef={file4Ref}
                  onTriggerUpload={() => triggerImageUpload("4")}
                  onFileChange={(e) => handleImageFileChange("4", e)}
                  onRemovePhoto={() => handleFieldChange("image4", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("4", targetSlot)}
                  recommendation={getImageRecommendation("4", currentLayout)}
                />
              )}

              {/* SEC 5: FOTO 5 */}
              {show5 && (
                <PhotoSlotCard
                  slot="5"
                  label={label5}
                  imageSrc={model.image5}
                  zoom={model.zoom5 ?? 100}
                  offsetX={model.offsetX5 ?? 50}
                  offsetY={model.offsetY5 ?? 50}
                  filter={model.filter5}
                  fileInputRef={file5Ref}
                  onTriggerUpload={() => triggerImageUpload("5")}
                  onFileChange={(e) => handleImageFileChange("5", e)}
                  onRemovePhoto={() => handleFieldChange("image5", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("5", targetSlot)}
                  recommendation={getImageRecommendation("5", currentLayout)}
                />
              )}

              {/* SEC 6: FOTO 6 */}
              {show6 && (
                <PhotoSlotCard
                  slot="6"
                  label={label6}
                  imageSrc={model.image6}
                  zoom={model.zoom6 ?? 100}
                  offsetX={model.offsetX6 ?? 50}
                  offsetY={model.offsetY6 ?? 50}
                  filter={model.filter6}
                  fileInputRef={file6Ref}
                  onTriggerUpload={() => triggerImageUpload("6")}
                  onFileChange={(e) => handleImageFileChange("6", e)}
                  onRemovePhoto={() => handleFieldChange("image6", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("6", targetSlot)}
                  recommendation={getImageRecommendation("6", currentLayout)}
                />
              )}

              {/* SEC 7: FOTO 7 */}
              {show7 && (
                <PhotoSlotCard
                  slot="7"
                  label={label7}
                  imageSrc={model.image7}
                  zoom={model.zoom7 ?? 100}
                  offsetX={model.offsetX7 ?? 50}
                  offsetY={model.offsetY7 ?? 50}
                  filter={model.filter7}
                  fileInputRef={file7Ref}
                  onTriggerUpload={() => triggerImageUpload("7")}
                  onFileChange={(e) => handleImageFileChange("7", e)}
                  onRemovePhoto={() => handleFieldChange("image7", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("7", targetSlot)}
                  recommendation={getImageRecommendation("7", currentLayout)}
                />
              )}

              {/* SEC 8: FOTO 8 */}
              {show8 && (
                <PhotoSlotCard
                  slot="8"
                  label={label8}
                  imageSrc={model.image8}
                  zoom={model.zoom8 ?? 100}
                  offsetX={model.offsetX8 ?? 50}
                  offsetY={model.offsetY8 ?? 50}
                  filter={model.filter8}
                  fileInputRef={file8Ref}
                  onTriggerUpload={() => triggerImageUpload("8")}
                  onFileChange={(e) => handleImageFileChange("8", e)}
                  onRemovePhoto={() => handleFieldChange("image8", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("8", targetSlot)}
                  recommendation={getImageRecommendation("8", currentLayout)}
                />
              )}

              {/* SEC 9: FOTO 9 */}
              {show9 && (
                <PhotoSlotCard
                  slot="9"
                  label={label9}
                  imageSrc={model.image9}
                  zoom={model.zoom9 ?? 100}
                  offsetX={model.offsetX9 ?? 50}
                  offsetY={model.offsetY9 ?? 50}
                  filter={model.filter9}
                  fileInputRef={file9Ref}
                  onTriggerUpload={() => triggerImageUpload("9")}
                  onFileChange={(e) => handleImageFileChange("9", e)}
                  onRemovePhoto={() => handleFieldChange("image9", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("9", targetSlot)}
                  recommendation={getImageRecommendation("9", currentLayout)}
                />
              )}

              {/* SEC 10: FOTO 10 */}
              {show10 && (
                <PhotoSlotCard
                  slot="10"
                  label={label10}
                  imageSrc={model.image10}
                  zoom={model.zoom10 ?? 100}
                  offsetX={model.offsetX10 ?? 50}
                  offsetY={model.offsetY10 ?? 50}
                  filter={model.filter10}
                  fileInputRef={file10Ref}
                  onTriggerUpload={() => triggerImageUpload("10")}
                  onFileChange={(e) => handleImageFileChange("10", e)}
                  onRemovePhoto={() => handleFieldChange("image10", "")}
                  onFieldChange={handleFieldChange}
                  availableSlots={availableSlotsList}
                  onSwapWithSlot={(targetSlot) => handleSwapSlots("10", targetSlot)}
                  recommendation={getImageRecommendation("10", currentLayout)}
                />
              )}

              {/* Modale Regia Multi-Foto a 360° */}
              <MultiPhotoUploadModal
                isOpen={showMultiPhotoModal}
                onClose={() => setShowMultiPhotoModal(false)}
                model={model}
                activeSlots={availableSlotsList.map((s) => ({
                  slot: s.slot,
                  label: s.label,
                  currentImage: (model as any)[`image${s.slot}`],
                }))}
                onApplyPhotos={(assignments) => {
                  const updated = { ...model };
                  Object.entries(assignments).forEach(([slotKey, base64Url]) => {
                    const imageKey = `image${slotKey}` as keyof ModelData;
                    (updated as any)[imageKey] = base64Url;
                  });
                  onChangeModel(updated);
                }}
                showNotification={(msg, type) => {
                  setFilterFeedbackMsg(msg);
                  setTimeout(() => setFilterFeedbackMsg(null), 3500);
                }}
              />

            </div>
          );
        })()}

        {/* TAB: FILTRI STILE (EFFETTI PREDEFINITI FOTO PER COMPOSIT & PDF) */}
        {activeTab === "filtri" && (() => {
          const filteredPresets = selectedFilterCategory === "all"
            ? ARTISTIC_FILTERS
            : ARTISTIC_FILTERS.filter(f => f.category === selectedFilterCategory);

          return (
            <div className="space-y-5 text-left">
              
              {/* Barra di Navigazione Rapida & Uscita */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("allineamento")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-3xs"
                    title="Chiudi la schermata dei filtri e torna alla sezione Foto & Crop"
                  >
                    <EyeOff size={13} />
                    <span>Chiudi / Nascondi Filtri (Torna a Foto & Crop)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("dati")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                    title="Esci dai filtri e torna alla compilazione dei dati del modello"
                  >
                    <ArrowLeft size={13} />
                    <span>Dati Fisici</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Le modifiche ai filtri si applicano in tempo reale
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("stile")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
                    title="Vai alla sezione impostazioni stile scheda e PDF"
                  >
                    <span>Stile & PDF</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* 1. Header Banner con spiegazione e garanzia PDF */}
              <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4.5 shadow-md border border-indigo-800/60 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1.5 bg-indigo-500/30 border border-indigo-400/40 rounded-lg text-amber-300">
                        <Sparkles size={16} />
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        Filtri Stile Fotografici Predefiniti
                      </h3>
                      <span className="text-[10px] font-extrabold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        12 Effetti Moda
                      </span>
                    </div>
                    <p className="text-[11.5px] text-indigo-200/90 leading-relaxed max-w-xl">
                      Applica stili cromatici coordinati (come <strong>Bianco e Nero Artistico</strong>, <strong>Seppia Caldo</strong>, <strong>Vintage Retrò</strong> o <strong>Editorial Cool</strong>) alle immagini del composit prima della generazione del documento PDF ad alta risoluzione.
                    </p>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-400" />
                      Pronto per Stampa & PDF
                    </span>
                    <span className="text-[10px] text-indigo-300 font-medium">
                      {activeFilterSlotsCount > 0 
                        ? `${activeFilterSlotsCount} di ${activeSlots.length} foto con filtro` 
                        : "Colori originali (nessun filtro)"}
                    </span>
                  </div>
                </div>

                {/* Feedback message banner if user just clicked */}
                {filterFeedbackMsg && (
                  <div className="mt-3 py-1.5 px-3 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <Check size={14} className="text-emerald-300 shrink-0" />
                    <span>{filterFeedbackMsg}</span>
                  </div>
                )}
              </div>

              {/* 2. Barra delle Azioni Rapide (I filtri più richiesti con 1 clic) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Applicazione Rapida con 1 Clic (Tutte le Foto)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Consigliato per un composit armonioso e omogeneo
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyFilter("bw", "all")}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-black text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    title="Applica Bianco e Nero Artistico bilanciato su tutte le foto della scheda"
                  >
                    <span className="text-base leading-none">🖤</span>
                    <span>B&N Artistico</span>
                    <span className="text-[9px] text-slate-400 font-normal">Tutte le foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFilter("sepia", "all")}
                    className="p-2.5 rounded-xl border border-amber-800/80 bg-gradient-to-b from-amber-900 to-amber-950 hover:from-amber-850 text-amber-50 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    title="Applica Seppia Caldo d'archivio su tutte le foto della scheda"
                  >
                    <span className="text-base leading-none">🍂</span>
                    <span>Seppia Caldo</span>
                    <span className="text-[9px] text-amber-300/80 font-normal">Tutte le foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFilter("vintage", "all")}
                    className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    title="Applica Vintage Retrò stile anni '70 su tutte le foto della scheda"
                  >
                    <span className="text-base leading-none">🎞️</span>
                    <span>Vintage Retrò</span>
                    <span className="text-[9px] text-amber-800 font-normal">Tutte le foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFilter("warm", "all")}
                    className="p-2.5 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-950 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    title="Applica Golden Hour dorato su tutte le foto della scheda"
                  >
                    <span className="text-base leading-none">☀️</span>
                    <span>Golden Hour</span>
                    <span className="text-[9px] text-orange-800 font-normal">Tutte le foto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyFilter("none", "all")}
                    className="col-span-2 sm:col-span-1 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                    title="Ripristina i colori originali dello scatto senza filtri su tutte le foto"
                  >
                    <RotateCcw size={14} className="text-slate-500" />
                    <span>Ripristina Colori</span>
                    <span className="text-[9px] text-slate-400 font-normal">Originale</span>
                  </button>
                </div>
              </div>

              {/* 3. Selettore Ambito di Applicazione (Tutte vs Foto Singola) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                      Ambito di Applicazione del Filtro
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Scegli se applicare il preset contemporaneamente a tutte le foto oppure a un singolo scatto.
                    </p>
                  </div>

                  {/* Scope Selector Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFilterScope("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedFilterScope === "all"
                          ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                      }`}
                    >
                      <Layers size={13} />
                      <span>Tutte le Foto ({activeSlots.length})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-medium">oppure:</span>
                      <select
                        value={selectedFilterScope}
                        onChange={(e) => setSelectedFilterScope(e.target.value)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer focus:outline-hidden ${
                          selectedFilterScope !== "all"
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-300"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <option value="all">Seleziona foto singola...</option>
                        {activeSlots.map((s) => (
                          <option key={s.slot} value={s.slot}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {selectedFilterScope !== "all" && (
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium flex items-center justify-between">
                    <span>
                      Stai modificando il filtro unicamente per: <strong>{activeSlots.find(s => s.slot === selectedFilterScope)?.label || `Foto ${selectedFilterScope}`}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFilterScope("all")}
                      className="text-indigo-600 hover:text-indigo-800 underline font-bold cursor-pointer"
                    >
                      Torna a "Tutte le Foto"
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Categorie Filtri per Navigazione Veloce */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: "all", label: "Tutti i Filtri", count: ARTISTIC_FILTERS.length },
                  { id: "bn", label: "Bianco & Nero", count: ARTISTIC_FILTERS.filter(f => f.category === "bn").length },
                  { id: "vintage", label: "Vintage & Seppia", count: ARTISTIC_FILTERS.filter(f => f.category === "vintage").length },
                  { id: "editorial", label: "Editoriale Moda", count: ARTISTIC_FILTERS.filter(f => f.category === "editorial").length },
                  { id: "warm", label: "Toni Caldi", count: ARTISTIC_FILTERS.filter(f => f.category === "warm").length },
                ].map((cat) => {
                  const isCatActive = selectedFilterCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFilterCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCatActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isCatActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 5. Griglia Principale delle Schede Filtri Predefiniti con Anteprima Live */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPresets.map((f) => {
                  const isAllSelected = selectedFilterScope === "all";
                  let isActive = false;
                  if (isAllSelected) {
                    isActive = activeSlots.length > 0 && activeSlots.every(s => (s.filterVal || "none") === f.id);
                  } else {
                    const key = `filter${selectedFilterScope}` as keyof ModelData;
                    isActive = (model[key] || "none") === f.id;
                  }

                  const someActive = isAllSelected && !isActive && activeSlots.some(s => (s.filterVal || "none") === f.id);

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleApplyFilter(f.id)}
                      className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-indigo-400/60 scale-[1.01]"
                          : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 hover:border-indigo-200 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3 w-full">
                        {/* Swatch Live Preview Thumbnail con la foto del modello */}
                        <div className="relative w-15 h-15 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs group-hover:scale-103 transition-transform">
                          <img
                            src={previewImageSrc}
                            alt={f.name}
                            className="w-full h-full object-cover select-none pointer-events-none"
                            style={{ filter: f.css !== "none" ? f.css : undefined }}
                          />
                          {isActive && (
                            <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-xs">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Titolo e Descrizione */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-bold truncate block ${isActive ? "text-white" : "text-slate-900"}`}>
                              {f.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md inline-block ${
                              isActive ? "bg-white/20 text-white" : f.badgeColor
                            }`}>
                              {f.shortName}
                            </span>
                            {someActive && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                                Su alcune foto
                              </span>
                            )}
                          </div>

                          <p className={`text-[11px] mt-1.5 line-clamp-2 leading-snug ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}>
                            {f.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Info della Card */}
                      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[10.5px] font-semibold w-full ${
                        isActive ? "border-white/15 text-indigo-300" : "border-slate-100 text-slate-400 group-hover:text-indigo-600"
                      }`}>
                        <span>
                          {isActive 
                            ? (isAllSelected ? "✓ Attivo su tutte le foto" : `✓ Attivo su ${selectedFilterScope}`) 
                            : "Clicca per applicare"}
                        </span>
                        <span className="text-[9.5px] uppercase font-mono tracking-wider opacity-70">
                          {f.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 6. Dettaglio & Personalizzazione Singoli Slot */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Camera size={15} className="text-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                        Riepilogo Filtri per Singola Foto ({activeSlots.length} slot nel layout attivo)
                      </span>
                      <span className="text-[10.5px] text-slate-500">
                        Puoi anche personalizzare ciascuna foto singolarmente con un filtro differente.
                      </span>
                    </div>
                  </div>
                  {activeFilterSlotsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleApplyFilter("none", "all")}
                      className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
                    >
                      <RotateCcw size={12} />
                      Ripristina Tutte a Originale
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activeSlots.map((slotItem) => {
                    const currentVal = slotItem.filterVal || "none";
                    const isFiltered = currentVal !== "none";

                    return (
                      <div
                        key={slotItem.slot}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                          isFiltered ? "bg-indigo-50/40 border-indigo-200 ring-1 ring-indigo-100" : "bg-slate-50/70 border-slate-200/80"
                        }`}
                      >
                        {/* Mini slot thumbnail con filtro applicato */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200 relative shadow-2xs">
                          {slotItem.img ? (
                            <img
                              src={slotItem.img}
                              alt={slotItem.label}
                              className="w-full h-full object-cover select-none pointer-events-none"
                              style={{ filter: getFilterCss(currentVal) !== "none" ? getFilterCss(currentVal) : undefined }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9.5px] text-slate-400 font-bold bg-slate-100">
                              No Foto
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                            {slotItem.label}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <select
                              value={currentVal}
                              onChange={(e) => handleApplyFilter(e.target.value, slotItem.slot)}
                              className={`text-xs font-semibold py-1 px-2 rounded-lg border w-full cursor-pointer focus:outline-hidden ${
                                isFiltered 
                                  ? "bg-white border-indigo-300 text-indigo-950 font-bold" 
                                  : "bg-white border-slate-200 text-slate-700"
                              }`}
                            >
                              {ARTISTIC_FILTERS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </select>
                            {isFiltered && (
                              <button
                                type="button"
                                onClick={() => handleApplyFilter("none", slotItem.slot)}
                                className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                                title="Rimuovi filtro per questa foto"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. Nota informativa per esportazione PDF */}
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
                <span className="text-base leading-none">💡</span>
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">
                    Consiglio per la creazione del composit:
                  </span>
                  <span>
                    Per un book coerente e raffinato, consigliamo di applicare il medesimo stile a tutte le foto della scheda (ad esempio <strong>Bianco e Nero Artistico</strong> per polaroid pulite o <strong>Vintage Retrò</strong> per lookbook d'archivio). I filtri selezionati vengono mantenuti nei salvataggi automatici e inclusi nel download PDF.
                  </span>
                </div>
              </div>

              {/* 8. Pulsantiera di Fine Configurazione ed Uscita */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Filtri configurati con successo!
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Tutti i filtri scelti sono salvati e pronti per l'anteprima e la stampa PDF.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dati")}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User size={13} />
                    <span>Torna a Dati Fisici</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("allineamento")}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-all border border-white/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Move size={13} />
                    <span>Foto & Crop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("stile")}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Stile & PDF →</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })()}

        {/* TAB 3: IMPOSTAZIONI AZIENDA & STILE SCHEDA */}
        {activeTab === "stile" && (
          <div className="space-y-4">
            
            {/* SEZIONE SPECIALE: FILTRI STILE FOTO */}
            <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-white border border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-indigo-200 shadow-xs shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 tracking-wide">
                        Filtri Stile Fotografici Predefiniti
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        activeFilterSlotsCount > 0
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {activeFilterSlotsCount > 0 ? `${activeFilterSlotsCount} FOTO ATTIVE` : "NATURALE"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Personalizza le immagini con Bianco e Nero Artistico, Seppia Caldo, Vintage Retrò o toni Editorial prima della generazione PDF.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("filtri")}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <span>Gestisci Filtri Stile</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            
            {/* SEZIONE 1: SALVATAGGIO AUTOMATICO CLOUD (AUTO-SAVE CHANGES) */}
            <div className="bg-gradient-to-r from-emerald-50/90 via-white to-indigo-50/80 border border-emerald-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl transition-all shadow-xs shrink-0 ${
                    autoSave 
                      ? "bg-emerald-600 text-white shadow-emerald-200" 
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    <Cloud size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 tracking-wide">
                        Salvataggio Automatico (Auto-save changes)
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        autoSave 
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {autoSave ? "ATTIVO" : "DISATTIVATO"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Salva automaticamente lo stato del modello su Firestore in tempo reale senza richiedere un clic manuale sul pulsante di salvataggio.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0" title={autoSave ? "Disattiva salvataggio automatico" : "Attiva salvataggio automatico"}>
                  <input
                    type="checkbox"
                    id="auto-save-changes-toggle"
                    checked={autoSave ?? true}
                    onChange={(e) => onToggleAutoSave?.(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                </label>
              </div>

              {/* Status footer inside toggle card */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-150 text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  {autoSave ? (
                    <>
                      {autoSaveStatus === "saving" ? (
                        <span className="flex items-center gap-1.5 text-amber-700 font-semibold animate-pulse">
                          <RefreshCw size={12} className="animate-spin text-amber-600" />
                          Salvataggio automatico su Firestore in corso...
                        </span>
                      ) : autoSaveStatus === "error" ? (
                        <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                          <AlertCircle size={12} className="text-red-500" />
                          Errore durante il salvataggio automatico nel Cloud
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <CheckCircle size={12} className="text-emerald-600" />
                          Sincronizzazione Cloud attiva (Firestore)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">
                      Salvataggio manuale: clicca "Aggiorna" o "Salva come nuova versione" per registrare le modifiche.
                    </span>
                  )}
                </div>

                {lastAutoSavedAt && autoSave && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Ultimo sync: {lastAutoSavedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Layout selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Layout Composizione Foto
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Classic */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "classic")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    (model.layout || "classic") === "classic"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-1/3 bg-slate-400 rounded-2xs h-full" />
                    <div className="w-1/3 bg-slate-400 rounded-2xs h-full" />
                    <div className="w-1/3 bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Classico (3 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Profilo, 3/4, Intero</span>
                </button>

                {/* 2. Duo */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "duo")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "duo"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-1/2 bg-slate-400 rounded-2xs h-full" />
                    <div className="w-1/2 bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Duo (2 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Due grandi ritratti</span>
                </button>

                {/* 3. Asymmetric Left */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "asymmetric-left")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "asymmetric-left"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-1/2 bg-slate-400 rounded-2xs h-full" />
                    <div className="w-1/2 flex flex-col gap-0.5 h-full">
                      <div className="bg-slate-400 rounded-2xs h-[11px] w-full" />
                      <div className="bg-slate-400 rounded-2xs h-[11px] w-full" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Asimmetrico</span>
                  <span className="text-[9px] opacity-70 block">Copertina + 2 orizzontali</span>
                </button>

                {/* 4. Solo */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "solo")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "solo"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-full bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Spotlight (Solo 1)</span>
                  <span className="text-[9px] opacity-70 block">Singola gigante</span>
                </button>

                {/* 5. Grid 4 (2x2) */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "grid-4")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "grid-4"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5 w-12 h-6 mb-1.5 opacity-80">
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Grid 2x2 (4 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Mosaico (4 Immagini)</span>
                </button>

                {/* 6. Grid 6 (3x2) */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "grid-6")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "grid-6"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-0.5 w-12 h-6 mb-1.5 opacity-80">
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11px]" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Grid 3x2 (6 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Auraa Style (6 Immagini)</span>
                </button>

                {/* 7. Editorial 6 */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "editorial-6")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "editorial-6"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-[2px] w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-[12px] bg-slate-400 rounded-2xs h-full" />
                    <div className="w-[10px] bg-slate-300 rounded-2xs h-[18px] self-center" />
                    <div className="flex-1 grid grid-cols-2 gap-[1px] h-full">
                      <div className="bg-slate-400 rounded-2xs h-[11px]" />
                      <div className="bg-slate-400 rounded-2xs h-[11px]" />
                      <div className="bg-slate-400 rounded-2xs h-[11px]" />
                      <div className="bg-slate-400 rounded-2xs h-[11px]" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Editoriale (6 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Scheda Tecnica + 6 Foto</span>
                </button>

                {/* 8. Grid 10 */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "grid-10")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "grid-10"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="grid grid-cols-5 gap-0.5 w-12 h-6 mb-1.5 opacity-80">
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                    <div className="bg-slate-400 rounded-2xs h-[11.5px]" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Grid 5x2 (10 Foto)</span>
                  <span className="text-[9px] opacity-70 block">Layout Griglia 10 Foto</span>
                </button>

                {/* 9. Cinematic Duo */}
                <button
                  type="button"
                  onClick={() => handleFieldChange("layout", "cinematic-2")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "cinematic-2"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80">
                    <div className="w-[12px] bg-slate-300 rounded-2xs h-full" />
                    <div className="flex-1 flex flex-col gap-0.5 h-full">
                      <div className="bg-slate-400 rounded-2xs h-[11px] w-full" />
                      <div className="bg-slate-400 rounded-2xs h-[11px] w-full" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Duo Cinematico</span>
                  <span className="text-[9px] opacity-70 block">2 foto panoramiche + Misure</span>
                </button>

                {/* 10. Campaign Duo */}
                <button
                  type="button"
                  id="layout-btn-campaign-2"
                  onClick={() => handleFieldChange("layout", "campaign-2")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-2"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1.5 w-12 h-6 mb-1.5 opacity-80 justify-center">
                    <div className="w-[19px] bg-slate-400 rounded-2xs h-full" />
                    <div className="w-[19px] bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Duo Orizzontale</span>
                  <span className="text-[9px] opacity-70 block">2 foto landscape + Titolo</span>
                </button>

                {/* 10b. Campaign Duo Portrait */}
                <button
                  type="button"
                  id="layout-btn-campaign-2-portrait"
                  onClick={() => handleFieldChange("layout", "campaign-2-portrait")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-2-portrait"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1.5 w-12 h-6 mb-1.5 opacity-80 justify-center">
                    <div className="w-[15px] bg-slate-400 rounded-2xs h-full" />
                    <div className="w-[15px] bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Duo Verticale (Nuovo!)</span>
                  <span className="text-[9px] opacity-70 block">2 foto portrait + Titolo</span>
                </button>

                {/* 11. Campaign Wedding */}
                <button
                  type="button"
                  id="layout-btn-campaign-wedding"
                  onClick={() => handleFieldChange("layout", "campaign-wedding")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-wedding"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1.5 w-12 h-6 mb-1.5 opacity-80 justify-center">
                    <div className="w-[21px] bg-slate-300 rounded-2xs h-full" />
                    <div className="w-[21px] bg-slate-400 rounded-2xs border border-slate-200 h-full flex items-center justify-center text-[5px] text-slate-500 font-bold bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-200 to-slate-300">M</div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Campagna Wedding</span>
                  <span className="text-[9px] opacity-70 block">Con texture marmo + Didascalia</span>
                </button>

                {/* 12. Campaign 3 (Royal Enfield Style) */}
                <button
                  type="button"
                  id="layout-btn-campaign-3"
                  onClick={() => handleFieldChange("layout", "campaign-3")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-3"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1 w-12 h-6 mb-1.5 opacity-80 justify-start">
                    <div className="w-[14px] bg-slate-400 rounded-3xs h-full" />
                    <div className="w-[20px] flex flex-col gap-0.5 h-full">
                      <div className="bg-slate-400 rounded-3xs grow" />
                      <div className="bg-slate-400 rounded-3xs grow" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Campagna Touring</span>
                  <span className="text-[9px] opacity-70 block">3 foto + Info colonna destra</span>
                </button>

                {/* 13. Campaign Seamless */}
                <button
                  type="button"
                  id="layout-btn-campaign-seamless"
                  onClick={() => handleFieldChange("layout", "campaign-seamless")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-seamless"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex w-12 h-6 mb-1.5 opacity-80 justify-center gap-0">
                    <div className="w-[24px] bg-slate-400 rounded-l-2xs h-full" />
                    <div className="w-[24px] bg-slate-400 rounded-r-2xs h-full border-l border-white" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Campagna Seamless</span>
                  <span className="text-[9px] opacity-70 block">Duo panoramico senza spazio</span>
                </button>

                {/* 14. Campaign TVC */}
                <button
                  type="button"
                  id="layout-btn-campaign-tvc"
                  onClick={() => handleFieldChange("layout", "campaign-tvc")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-tvc"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-[38px] h-6 mb-1.5 opacity-80 justify-center mx-auto">
                    <div className="flex gap-0.5 justify-center w-full h-[11px]">
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                    </div>
                    <div className="w-[18px] bg-slate-400 rounded-3xs h-[11px] self-center" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Vito Movie TVC</span>
                  <span className="text-[9px] opacity-70 block">Showcase 3 Still Video</span>
                </button>

                {/* 15. Campaign Solo */}
                <button
                  type="button"
                  id="layout-btn-campaign-solo"
                  onClick={() => handleFieldChange("layout", "campaign-solo")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-solo"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex w-12 h-6 mb-1.5 opacity-80 justify-center">
                    <div className="w-[24px] bg-slate-400 rounded-2xs h-full" />
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Campagna Singola</span>
                  <span className="text-[9px] opacity-70 block">1 grande foto centrata + Titolo</span>
                </button>

                {/* 16. Campaign TVC 4 */}
                <button
                  type="button"
                  id="layout-btn-campaign-tvc-4"
                  onClick={() => handleFieldChange("layout", "campaign-tvc-4")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-tvc-4"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-[38px] h-6 mb-1.5 opacity-80 justify-center mx-auto">
                    <div className="flex gap-0.5 justify-center w-full h-[11px]">
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                    </div>
                    <div className="flex gap-0.5 justify-center w-full h-[11px]">
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                      <div className="w-[18px] bg-slate-400 rounded-3xs h-full" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Vito Movie TVC 2x2</span>
                  <span className="text-[9px] opacity-70 block">Griglia 4 Still Video (2x2)</span>
                </button>

                {/* 17. Campaign Brand 6 */}
                <button
                  type="button"
                  id="layout-btn-campaign-brand-6"
                  onClick={() => handleFieldChange("layout", "campaign-brand-6")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-brand-6"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1.5 w-full h-6 mb-1.5 opacity-80 justify-center items-center">
                    {/* Left text representation */}
                    <div className="flex flex-col gap-0.5 w-2/5">
                      <div className="h-1 bg-slate-400 rounded-full w-full" />
                      <div className="h-[0.5px] bg-slate-400 rounded-full w-[80%]" />
                    </div>
                    {/* Right 3x2 Grid */}
                    <div className="flex flex-col gap-0.5 w-3/5 h-full justify-center">
                      <div className="flex gap-0.5 justify-center w-full h-[11px]">
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                      </div>
                      <div className="flex gap-0.5 justify-center w-full h-[11px]">
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[8px] bg-slate-400 rounded-3xs h-full" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Royal Enfield 3x2</span>
                  <span className="text-[9px] opacity-70 block">Griglia 6 Foto + Spazio Testi</span>
                </button>

                {/* 18. Campaign 5 Hybrid */}
                <button
                  type="button"
                  id="layout-btn-campaign-5-hybrid"
                  onClick={() => handleFieldChange("layout", "campaign-5-hybrid")}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-[84px] transition-all cursor-pointer ${
                    model.layout === "campaign-5-hybrid"
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex gap-1.5 w-full h-6 mb-1.5 opacity-80 justify-center items-center">
                    {/* Left big item */}
                    <div className="w-[18px] bg-slate-400 rounded-2xs h-[23px]" />
                    {/* Right 2x2 grid */}
                    <div className="flex flex-col gap-0.5 w-[25px] h-full justify-center">
                      <div className="flex gap-0.5 justify-center w-full h-[11px]">
                        <div className="w-[10px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[10px] bg-slate-400 rounded-3xs h-full" />
                      </div>
                      <div className="flex gap-0.5 justify-center w-full h-[11px]">
                        <div className="w-[10px] bg-slate-400 rounded-3xs h-full" />
                        <div className="w-[10px] bg-slate-400 rounded-3xs h-full" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold block leading-none">Campaign 5 Hybrid</span>
                  <span className="text-[9px] opacity-70 block">Bento Grid: 1 Grande + 4 (2x2)</span>
                </button>
              </div>
            </div>

            <hr className="border-slate-100 my-1" />

            {/* Header Titles */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Titolo Testata Scheda
              </label>
              <input
                type="text"
                placeholder="es. PORTRAIT / THREE-QUARTERS / FULL BODY MODELS"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-800"
              />
            </div>

            {/* Typography Theme */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Stile Carattere (Font Tipografia)</span>
                </label>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {fontFamily === "sans" && "Inter (Modern Minimal)"}
                  {fontFamily === "display" && "Space Grotesk (High-Tech)"}
                  {fontFamily === "serif" && "Playfair (Editorial Serif)"}
                  {fontFamily === "cormorant" && "Cormorant (Vogue Haute Couture)"}
                  {fontFamily === "montserrat" && "Montserrat (Clean Bold)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { id: "sans" as const, name: "Inter", sub: "Minimal Sans", sample: "Vogue", fontClass: "font-sans" },
                  { id: "display" as const, name: "Space Gr.", sub: "High-Tech", sample: "SPACE", fontClass: "font-display font-medium" },
                  { id: "serif" as const, name: "Playfair", sub: "Editorial Serif", sample: "Haute", fontClass: "font-serif italic" },
                  { id: "cormorant" as const, name: "Cormorant", sub: "Haute Couture", sample: "Couture", fontClass: "font-cormorant italic" },
                  { id: "montserrat" as const, name: "Montserrat", sub: "Clean Bold", sample: "MODA", fontClass: "font-montserrat font-bold" },
                ].map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onSelectFontFamily(f.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-indigo-400 scale-[1.02]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div>
                        <span className={`text-base block truncate leading-tight ${f.fontClass} ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {f.sample}
                        </span>
                        <span className={`text-xs font-bold block mt-1 ${isSelected ? "text-white" : "text-slate-800"}`}>
                          {f.name}
                        </span>
                      </div>
                      <span className={`text-[9.5px] block mt-1.5 truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {f.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Backplate colors */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Colore Sfondo Retro-Foto
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: "silver", label: "Silver", hash: "#e2e8f0" },
                  { key: "charcoal", label: "Dark", hash: "#334155" },
                  { key: "beige", label: "Beige", hash: "#f5f5dc" },
                  { key: "gold", label: "Ivory", hash: "#faf7f0" },
                  { key: "white", label: "White", hash: "#ffffff" },
                ].map((col) => (
                  <button
                    key={col.key}
                    onClick={() => onSelectThemeColor(col.key as any)}
                    title={col.label}
                    className={`h-8 rounded-lg border transition-all flex items-center justify-center relative ${
                      themeColor === col.key ? "ring-2 ring-slate-900 scale-105" : "border-slate-200 hover:scale-102"
                    }`}
                    style={{ backgroundColor: col.hash }}
                  >
                    {themeColor === col.key && (
                      <span className={`w-1.5 h-1.5 rounded-full ${col.key === "charcoal" ? "bg-white" : "bg-slate-900"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 my-2" />

            {/* Agency Details settings */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Dati Agenzia (Informazioni Verticali)
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Nome Agenzia</label>
                  <input
                    type="text"
                    value={agency.name}
                    onChange={(e) => onChangeAgency({ ...agency, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Indirizzo</label>
                  <input
                    type="text"
                    value={agency.address}
                    onChange={(e) => onChangeAgency({ ...agency, address: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Sede / CAP</label>
                  <input
                    type="text"
                    value={agency.city}
                    onChange={(e) => onChangeAgency({ ...agency, city: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Telefono</label>
                    <input
                      type="text"
                      value={agency.phone}
                      onChange={(e) => onChangeAgency({ ...agency, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Sito Web</label>
                    <input
                      type="text"
                      value={agency.web}
                      onChange={(e) => onChangeAgency({ ...agency, web: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Indirizzo e-mail</label>
                  <input
                    type="text"
                    value={agency.email}
                    onChange={(e) => onChangeAgency({ ...agency, email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Stagione / Anno Portfolio (es. 2026/27)</label>
                  <input
                    type="text"
                    value={agency.portfolioDate || ""}
                    onChange={(e) => onChangeAgency({ ...agency, portfolioDate: e.target.value })}
                    placeholder="2026/27"
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-700 block mb-1.5">Link Social Agenzia</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block">Instagram Link</label>
                      <input
                        type="text"
                        value={agency.instagram || ""}
                        onChange={(e) => onChangeAgency({ ...agency, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">WhatsApp Link</label>
                      <input
                        type="text"
                        value={agency.whatsapp || ""}
                        onChange={(e) => onChangeAgency({ ...agency, whatsapp: e.target.value })}
                        placeholder="https://wa.me/..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    <div>
                      <label className="text-[9px] text-slate-500 block">Facebook</label>
                      <input
                        type="text"
                        value={agency.facebook || ""}
                        onChange={(e) => onChangeAgency({ ...agency, facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[10px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Threads</label>
                      <input
                        type="text"
                        value={agency.threads || ""}
                        onChange={(e) => onChangeAgency({ ...agency, threads: e.target.value })}
                        placeholder="https://threads.net/..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[10px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block">Pinterest</label>
                      <input
                        type="text"
                        value={agency.pinterest || ""}
                        onChange={(e) => onChangeAgency({ ...agency, pinterest: e.target.value })}
                        placeholder="https://pinterest.com/..."
                        className="w-full bg-white border border-slate-200 rounded-lg py-1 px-1.5 text-[10px] text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[10px] text-slate-500 block font-semibold mb-1">Logo Personalizzato dell'Agenzia (Esteso)</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150 mb-3">
                    <div className="w-28 h-12 bg-white rounded-md border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner p-1">
                      {agency.logo ? (
                        <img src={agency.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="flex flex-col select-none pointer-events-none w-[96px]" style={{ fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                          <div className="text-[15px] leading-none flex items-center select-none font-light tracking-[0.03em] justify-center" style={{ fontWeight: 300 }}>
                            <span className="text-black uppercase">COSMO</span>
                            <span className="text-[#b11030] uppercase">POLITAN</span>
                          </div>
                          <div className="w-full flex justify-between text-[4.1px] leading-none mt-[3px] select-none font-light">
                            {(() => {
                              const previewChars = [
                                ...("moda".split("").map(char => ({ char, color: "text-[#b11030]" }))),
                                ...("eventi".split("").map(char => ({ char, color: "text-black" }))),
                                ...("pubb".split("").map(char => ({ char, color: "text-[#b11030]" }))),
                                ...("licitàcomunicazione".split("").map(char => ({ char, color: "text-black" })))
                              ];
                              return previewChars.map((item, index) => (
                                <span key={index} className={`${item.color} lowercase`}>
                                  {item.char}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col gap-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="agency-logo-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await resizeAndCompressImage(file, 400, 200, 0.85);
                              onChangeAgency({ ...agency, logo: compressed });
                            } catch (err) {
                              console.error("Failed to compress logo", err);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  onChangeAgency({ ...agency, logo: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => document.getElementById("agency-logo-upload")?.click()}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-1 px-2 rounded-md transition-colors text-center"
                        >
                          Carica Logo Esteso
                        </button>
                        {agency.logo && (
                          <button
                            type="button"
                            onClick={() => onChangeAgency({ ...agency, logo: undefined })}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[10px] px-2 py-1 rounded-md transition-colors"
                          >
                            Restaura Default
                          </button>
                        )}
                      </div>
                      <p className="text-[8px] text-slate-400">Trascina o carica il file del tuo brand principale (es. versione estesa)</p>
                    </div>
                  </div>

                  <label className="text-[10px] text-slate-500 block font-semibold mb-1">Logo Breve / Simbolo dell'Agenzia (es. CP)</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    <div className="w-28 h-12 bg-white rounded-md border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative shadow-inner p-1">
                      {agency.logoBreve ? (
                        <img src={agency.logoBreve} alt="Logo Breve" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-[16px] font-black text-slate-300 select-none tracking-widest font-mono">
                          CP
                        </div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col gap-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="agency-short-logo-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await resizeAndCompressImage(file, 200, 200, 0.85);
                              onChangeAgency({ ...agency, logoBreve: compressed });
                            } catch (err) {
                              console.error("Failed to compress short logo", err);
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  onChangeAgency({ ...agency, logoBreve: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => document.getElementById("agency-short-logo-upload")?.click()}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-1 px-2 rounded-md transition-colors text-center"
                        >
                          Carica Logo Breve
                        </button>
                        {agency.logoBreve && (
                          <button
                            type="button"
                            onClick={() => onChangeAgency({ ...agency, logoBreve: undefined })}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[10px] px-2 py-1 rounded-md transition-colors"
                          >
                            Rimuovi Logo Breve
                          </button>
                        )}
                      </div>
                      <p className="text-[8px] text-slate-400">Inserisci una versione ridotta (es. il cerchio con le sole lettere CP) per album o layout ad alta densità</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: DATABASE PROFILI SALVATI LOCALE */}
        {activeTab === "salvati" && (
          <div className="space-y-4">
            {/* Cloud Quota & Local Mode Notice Banner */}
            {cloudQuotaExceeded && (
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs text-left">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>Stato Database Cloud: Modalità Locale Protetta Attiva</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Il database Cloud Firebase ha raggiunto il limite gratuito di lettura di Google (50.000 letture/giorno).
                    <strong> Tutte le tue card e le revisioni create sono al sicuro nella memoria locale:</strong> puoi continuare a visualizzarle, modificarle, esportare in PDF e scaricare il backup JSON completo. La sincronizzazione Cloud automatica riprenderà al reset della quota.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2 text-left">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch size={13} className="text-indigo-600" />
                Profili & Revisioni ({localProfiles.length})
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenImportCardsModal && (
                  <button
                    type="button"
                    onClick={onOpenImportCardsModal}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10.5px] font-bold shadow-3xs transition-all cursor-pointer"
                    title="Importa card da file JSON, archivio catalogo, CSV o foto"
                  >
                    <FolderInput size={11} />
                    <span>Importa Card</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowBatchRenameModal(true)}
                  disabled={localProfiles.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-[10.5px] font-bold shadow-3xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Rinomina in blocco i modelli con prefisso stagionale (es. SS25, FW25, Cruise) o data"
                >
                  <Tag size={11} />
                  <span>Rinomina per Stagione</span>
                </button>
                {onExportCatalogBackupJson && localProfiles.length > 0 && (
                  <button
                    type="button"
                    onClick={onExportCatalogBackupJson}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10.5px] font-bold shadow-3xs transition-all cursor-pointer"
                    title="Scarica il backup JSON di tutte le schede salvate nel database"
                  >
                    <Download size={11} />
                    <span>Backup JSON</span>
                  </button>
                )}
                {onToggleMultiExport && (
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={showMultiExport}
                      onChange={(e) => onToggleMultiExport(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[10px] font-bold text-indigo-700 whitespace-nowrap">
                      CONTIENE CATALOGO (ATTIVO)
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Quick Catalog Tag Info Banner if any models are tagged */}
            {(() => {
              const catalogSelectedCount = localProfiles.filter(p => selectedModelIds.includes(p.id)).length;
              if (catalogSelectedCount === 0) return null;
              return (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/90 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                      <BookmarkCheck size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>{catalogSelectedCount} {catalogSelectedCount === 1 ? "Scheda contrassegnata" : "Schede contrassegnate"} per il Catalogo</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                          Tag Attivo
                        </span>
                      </div>
                      <p className="text-[10.5px] text-emerald-800 leading-tight mt-0.5">
                        I profili con il tag <strong className="font-semibold text-emerald-900">"Nel Catalogo ✓"</strong> verranno inclusi nell'esportazione PDF multi-pagina.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onToggleMultiExport && (
                      <button
                        type="button"
                        onClick={() => onToggleMultiExport(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer"
                        title="Apri l'esportatore del catalogo multi-pagina"
                      >
                        <BookOpen size={12} />
                        <span>Crea Catalogo PDF ({catalogSelectedCount})</span>
                      </button>
                    )}
                    {onDeselectAllModelIds && (
                      <button
                        type="button"
                        onClick={() => onDeselectAllModelIds()}
                        className="text-[10.5px] text-slate-500 hover:text-red-600 hover:underline px-1.5 py-1 font-medium transition cursor-pointer"
                        title="Deseleziona tutte le schede dal catalogo"
                      >
                        Rimuovi tutti i tag
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Quick Search & Advanced Filtering Controls */}
            {localProfiles.length > 0 && (
              <div className="space-y-2.5">
                {/* Search Bar + Toggle Filtri Avanzati */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cerca per nome, tag [SS26], misure (es. 178, 39, verde)..."
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-3xs"
                    />
                    {dbSearch && (
                      <button
                        type="button"
                        onClick={() => setDbSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Cancella ricerca"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Toggle Filtri Avanzati */}
                  <button
                    type="button"
                    onClick={() => setDbShowAdvancedFilters(prev => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs border ${
                      dbShowAdvancedFilters || activeAdvancedFiltersCount > 0
                        ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300/50"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                    title="Apri o chiudi i filtri avanzati per categoria, tag e data"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Filtri</span>
                    {activeAdvancedFiltersCount > 0 && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-3xs">
                        {activeAdvancedFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Pulsante Azzera se attivo */}
                  {activeAdvancedFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetAllDbFilters}
                      className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                      title="Ripristina tutti i filtri e mostra tutti i modelli"
                    >
                      <FilterX size={13} />
                      <span className="hidden sm:inline">Azzera</span>
                    </button>
                  )}
                </div>

                {/* Pannello Filtri Avanzati (Espandibile o Attivo) */}
                {(dbShowAdvancedFilters || activeAdvancedFiltersCount > 0) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 text-left shadow-2xs animate-in fade-in duration-150">
                    
                    {/* 1. FILTRO PER CATEGORIA (Genere / Ruolo) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <User size={11} className="text-indigo-600" /> Categoria Modelli:
                        </label>
                        {dbCategoryFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setDbCategoryFilter("all")}
                            className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                          >
                            Mostra tutte
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "all", label: "Tutte le Categorie", count: localProfiles.length },
                          { id: "woman", label: "Donne (Model Woman)", count: localProfiles.filter(p => matchGenderCategory(p, "woman")).length },
                          { id: "man", label: "Uomini (Model Man)", count: localProfiles.filter(p => matchGenderCategory(p, "man")).length },
                          { id: "child-woman", label: "Bambine (Child Woman)", count: localProfiles.filter(p => matchGenderCategory(p, "child-woman")).length },
                          { id: "child-man", label: "Bambini (Child Man)", count: localProfiles.filter(p => matchGenderCategory(p, "child-man")).length },
                        ].map((cat) => {
                          const isActive = dbCategoryFilter === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setDbCategoryFilter(cat.id as any)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                                isActive
                                  ? "bg-slate-900 text-white shadow-3xs"
                                  : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                              }`}
                            >
                              <span>{cat.label}</span>
                              <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                                isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                {cat.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. FILTRO PER TAG & CATALOGO */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Tag size={11} className="text-emerald-600" /> Tag & Stato Catalogo:
                        </label>
                        {dbTagFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setDbTagFilter("all")}
                            className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                          >
                            Tutti i tag
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button
                          type="button"
                          onClick={() => setDbTagFilter("all")}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                            dbTagFilter === "all"
                              ? "bg-indigo-600 text-white shadow-3xs"
                              : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                          }`}
                        >
                          Tutti i Profili ({localProfiles.length})
                        </button>
                        
                        {/* Tag Catalogo Esportabile */}
                        <button
                          type="button"
                          onClick={() => setDbTagFilter("catalog_only")}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                            dbTagFilter === "catalog_only"
                              ? "bg-emerald-600 text-white shadow-3xs"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          <BookmarkCheck size={11} />
                          <span>Nel Catalogo ({localProfiles.filter(p => selectedModelIds.includes(p.id)).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDbTagFilter("no_catalog")}
                          className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                            dbTagFilter === "no_catalog"
                              ? "bg-slate-800 text-white shadow-3xs"
                              : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-200"
                          }`}
                        >
                          Non nel Catalogo
                        </button>

                        {/* Tag Stagionali Rilevati (es. SS26, FW26, Cruise) */}
                        {availableSeasonalTags.length > 0 && (
                          <>
                            <span className="text-[10px] text-slate-400 font-bold ml-1 mr-0.5">• Stagioni:</span>
                            {availableSeasonalTags.map((stagione) => {
                              const isActive = dbTagFilter.toUpperCase() === stagione.toUpperCase();
                              const count = localProfiles.filter(p => (p.name || "").toUpperCase().includes(stagione.toUpperCase())).length;
                              return (
                                <button
                                  key={stagione}
                                  type="button"
                                  onClick={() => setDbTagFilter(isActive ? "all" : stagione)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-purple-600 text-white shadow-3xs"
                                      : "bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200"
                                  }`}
                                  title={`Filtra profili con tag [${stagione}]`}
                                >
                                  <span>[{stagione}]</span>
                                  <span className="text-[9px] opacity-80">({count})</span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3. FILTRO PER DATA CREAZIONE/MODIFICA & ORDINAMENTO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/80">
                      {/* Filtro Data */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar size={11} className="text-amber-600" /> Data di Creazione / Modifica:
                        </label>
                        <select
                          value={dbDateFilter}
                          onChange={(e) => setDbDateFilter(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-3xs cursor-pointer"
                        >
                          <option value="all">📅 Qualsiasi Data (Tutti i profili)</option>
                          <option value="today">⚡ Oggi / Ultime 24 ore</option>
                          <option value="week">🗓️ Ultimi 7 giorni</option>
                          <option value="month">📆 Questo Mese (ultimi 30 gg)</option>
                          <option value="year_2026">✨ Anno 2026</option>
                          <option value="year_2025">📁 Anno 2025</option>
                        </select>
                      </div>

                      {/* Ordinamento */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <ArrowUpDown size={11} className="text-indigo-600" /> Ordinamento Elenco:
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetSortOrder("alpha-asc")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              dbSortOrder === "alpha-asc"
                                ? "bg-slate-900 text-white shadow-3xs"
                                : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                            title="Alfabetico A → Z"
                          >
                            <SortAsc size={12} />
                            <span>A → Z</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetSortOrder("alpha-desc")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              dbSortOrder === "alpha-desc"
                                ? "bg-slate-900 text-white shadow-3xs"
                                : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                            title="Alfabetico Z → A"
                          >
                            <SortDesc size={12} />
                            <span>Z → A</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetSortOrder("date-desc")}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              dbSortOrder === "date-desc"
                                ? "bg-slate-900 text-white shadow-3xs"
                                : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                            title="Più recenti per primi"
                          >
                            <Clock size={11} />
                            <span>Recenti</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {localProfiles.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400">
                <User className="mx-auto text-slate-300 stroke-1 mb-2" size={32} />
                <p className="text-xs font-medium">Nessun modello salvato ancora.</p>
                <p className="text-[10px] mt-1 text-slate-400">Inserisci i dati fisici di un modello/a e premi "Salva come nuova versione" o "Aggiorna" per memorizzarlo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const filtered = localProfiles.filter(p => {
                    if (!matchTagFilter(p)) return false;
                    if (!matchDateFilter(p)) return false;
                    if (!matchSearchQuery(p)) return false;
                    return true;
                  });

                  const sortProfilesList = (items: ModelData[]) => {
                    return [...items].sort((a, b) => {
                      const nameA = (a.name || "").trim().toLowerCase();
                      const nameB = (b.name || "").trim().toLowerCase();
                      if (dbSortOrder === "alpha-asc") {
                        const cmp = nameA.localeCompare(nameB, "it", { sensitivity: "base", numeric: true });
                        if (cmp !== 0) return cmp;
                        return (b.version || 1) - (a.version || 1);
                      }
                      if (dbSortOrder === "alpha-desc") {
                        const cmp = nameB.localeCompare(nameA, "it", { sensitivity: "base", numeric: true });
                        if (cmp !== 0) return cmp;
                        return (b.version || 1) - (a.version || 1);
                      }
                      if (dbSortOrder === "date-asc") {
                        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                        if (timeA !== timeB) return timeA - timeB;
                        return nameA.localeCompare(nameB, "it", { sensitivity: "base", numeric: true });
                      }
                      // date-desc
                      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
                      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
                      if (timeA !== timeB) return timeB - timeA;
                      return nameA.localeCompare(nameB, "it", { sensitivity: "base", numeric: true });
                    });
                  };

                  const allSections = [
                    { id: "woman", label: "model woman", allCatItems: localProfiles.filter(p => matchGenderCategory(p, "woman")), items: sortProfilesList(filtered.filter(p => matchGenderCategory(p, "woman"))) },
                    { id: "man", label: "model man", allCatItems: localProfiles.filter(p => matchGenderCategory(p, "man")), items: sortProfilesList(filtered.filter(p => matchGenderCategory(p, "man"))) },
                    { id: "child-woman", label: "child model woman", allCatItems: localProfiles.filter(p => matchGenderCategory(p, "child-woman")), items: sortProfilesList(filtered.filter(p => matchGenderCategory(p, "child-woman"))) },
                    { id: "child-man", label: "child model man", allCatItems: localProfiles.filter(p => matchGenderCategory(p, "child-man")), items: sortProfilesList(filtered.filter(p => matchGenderCategory(p, "child-man"))) },
                  ];

                  const sections = allSections.filter(sec => dbCategoryFilter === "all" || dbCategoryFilter === sec.id);
                  const totalResultsCount = filtered.length;

                  return (
                    <div className="space-y-4">
                      {/* Active Filters Status Bar */}
                      {activeAdvancedFiltersCount > 0 && (
                        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-left shadow-3xs">
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-indigo-950 font-medium">
                            <span className="font-bold">Risultati:</span>
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {totalResultsCount} su {localProfiles.length}
                            </span>
                            
                            {/* Filter Chips */}
                            {dbSearch && (
                              <button
                                type="button"
                                onClick={() => setDbSearch("")}
                                className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-indigo-900 hover:text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                                title="Rimuovi filtro ricerca"
                              >
                                <span>Cerca: "{dbSearch}"</span>
                                <X size={10} />
                              </button>
                            )}

                            {dbCategoryFilter !== "all" && (
                              <button
                                type="button"
                                onClick={() => setDbCategoryFilter("all")}
                                className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-indigo-900 hover:text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                                title="Rimuovi filtro categoria"
                              >
                                <span>Cat: {dbCategoryFilter}</span>
                                <X size={10} />
                              </button>
                            )}

                            {dbTagFilter !== "all" && (
                              <button
                                type="button"
                                onClick={() => setDbTagFilter("all")}
                                className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-indigo-900 hover:text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                                title="Rimuovi filtro tag"
                              >
                                <span>Tag: {dbTagFilter === "catalog_only" ? "Nel Catalogo" : dbTagFilter === "no_catalog" ? "Non nel Catalogo" : dbTagFilter}</span>
                                <X size={10} />
                              </button>
                            )}

                            {dbDateFilter !== "all" && (
                              <button
                                type="button"
                                onClick={() => setDbDateFilter("all")}
                                className="inline-flex items-center gap-1 bg-white hover:bg-rose-50 text-indigo-900 hover:text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                                title="Rimuovi filtro data"
                              >
                                <span>Data: {dbDateFilter}</span>
                                <X size={10} />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleResetAllDbFilters}
                            className="text-[10.5px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            Azzera tutti i filtri
                          </button>
                        </div>
                      )}

                      {totalResultsCount === 0 ? (
                        <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                          <FilterX className="mx-auto text-slate-300 stroke-1" size={36} />
                          <div>
                            <p className="text-xs font-bold text-slate-700">Nessun profilo corrisponde ai filtri selezionati</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Prova a modificare i termini di ricerca o azzera i filtri attivi.</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleResetAllDbFilters}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                          >
                            <RotateCcw size={12} />
                            <span>Azzera tutti i filtri</span>
                          </button>
                        </div>
                      ) : (
                        sections.map((section) => {
                          const catAllIds = section.allCatItems.map(p => p.id);
                          const catTaggedCount = section.allCatItems.filter(p => selectedModelIds.includes(p.id)).length;
                          const allTagged = catTaggedCount === catAllIds.length && catAllIds.length > 0;

                    return (
                      <div key={section.id} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden text-left">
                        <div className="bg-slate-100 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                              {section.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-1.5 py-0.2 rounded-md font-semibold">
                              {dbSortOrder === "alpha-asc" && "🔤 A → Z"}
                              {dbSortOrder === "alpha-desc" && "🔤 Z → A"}
                              {dbSortOrder === "date-desc" && "📅 Più recenti"}
                              {dbSortOrder === "date-asc" && "📅 Meno recenti"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {catTaggedCount > 0 && (
                              <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-3xs" title={`${catTaggedCount} card con tag Catalogo in questa categoria`}>
                                <BookmarkCheck size={10} className="text-emerald-700" />
                                <span>{catTaggedCount} nel catalogo</span>
                              </span>
                            )}
                            {section.allCatItems.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (allTagged) {
                                    onDeselectAllModelIds?.(catAllIds);
                                  } else {
                                    onSelectAllModelIds?.(catAllIds);
                                  }
                                }}
                                className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition cursor-pointer shadow-3xs"
                                title={allTagged ? "Rimuovi tag catalogo da tutte le schede di questa categoria" : "Tagga tutte le schede di questa categoria per il catalogo"}
                              >
                                {allTagged ? "Deseleziona cat." : `+ Tagga cat. (${catAllIds.length - catTaggedCount})`}
                              </button>
                            )}
                            <span className="text-[10px] bg-slate-200 font-bold px-2 py-0.5 rounded-full text-slate-700">
                              {section.items.length}
                            </span>
                          </div>
                        </div>

                        <div className="p-2 space-y-1.5 bg-white">
                          {section.items.length === 0 ? (
                            <p className="text-[10.5px] text-slate-400 italic text-center py-2.5">
                              {dbTagFilter === "catalog_only"
                                ? "Nessuna scheda in questa categoria ha il tag Catalogo."
                                : activeAdvancedFiltersCount > 0
                                ? "Nessuna corrispondenza per i filtri selezionati"
                                : "Nessun profilo in questa categoria"}
                            </p>
                          ) : (
                            section.items.map((p) => {
                              const isCurrentActive = model.id === p.id;
                              const isTaggedInCatalog = selectedModelIds.includes(p.id);
                              const baseRoot = p.rootId || p.id;
                              const siblingVersions = localProfiles.filter(other => 
                                (other.rootId && other.rootId === baseRoot) ||
                                (!other.rootId && other.id === baseRoot) ||
                                (p.name && other.name && other.name.trim().toLowerCase() === p.name.trim().toLowerCase())
                              );

                              return (
                                <div 
                                  key={p.id}
                                  className={`flex justify-between items-center p-2.5 rounded-lg border transition-all cursor-pointer group ${
                                    isCurrentActive
                                      ? "bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-200 shadow-2xs"
                                      : isTaggedInCatalog
                                      ? "bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/60"
                                      : "bg-slate-50 border-slate-150 hover:border-slate-300 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <div 
                                    onClick={() => onSelectPreset(p)}
                                    className="flex-1 min-w-0"
                                  >
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800 text-xs tracking-wider block uppercase group-hover:text-indigo-600 transition-colors truncate">
                                        {p.name || "Senza Nome"}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                        isCurrentActive ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"
                                      }`}>
                                        v{p.version || 1}
                                      </span>
                                      {isCurrentActive && (
                                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 uppercase">
                                          Attiva
                                        </span>
                                      )}
                                      {isTaggedInCatalog && (
                                        <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-3xs" title="Questa modella ha il tag per essere inclusa nel catalogo PDF">
                                          <BookmarkCheck size={9} className="text-emerald-700" />
                                          <span>Nel Catalogo</span>
                                        </span>
                                      )}
                                      {siblingVersions.length > 1 && (
                                        <span className="text-[8px] text-slate-400 font-mono" title={`${siblingVersions.length} revisioni disponibili`}>
                                          ({siblingVersions.length} rev)
                                        </span>
                                      )}
                                    </div>

                                    {p.versionNote && (
                                      <p className="text-[10px] text-indigo-600/90 truncate font-medium mt-0.5">
                                        🏷️ {p.versionNote}
                                      </p>
                                    )}

                                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                      H: {p.height || "—"} cm / S: {p.shoes || "—"} / B: {p.bust || "—"}
                                      {p.updatedAt && (
                                        <span className="text-slate-400 ml-1.5">
                                          • {new Date(p.updatedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Right Actions: Catalog Tag + Delete */}
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSelectModelId?.(p.id);
                                      }}
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer shadow-3xs ${
                                        isTaggedInCatalog
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 ring-2 ring-emerald-300/60"
                                          : "bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300"
                                      }`}
                                      title={isTaggedInCatalog ? "Rimuovi tag catalogo da questa card" : "Aggiungi tag per includere questa card nel catalogo PDF"}
                                    >
                                      {isTaggedInCatalog ? (
                                        <>
                                          <BookmarkCheck size={12} className="text-white" />
                                          <span className="whitespace-nowrap">Nel Catalogo ✓</span>
                                        </>
                                      ) : (
                                        <>
                                          <BookmarkPlus size={12} className="text-slate-400 group-hover:text-indigo-600" />
                                          <span className="whitespace-nowrap">+ Tag Catalogo</span>
                                        </>
                                      )}
                                    </button>

                                    {deleteConfirmId === p.id ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteLocal(p.id);
                                            setDeleteConfirmId(null);
                                          }}
                                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-[10px] text-white rounded font-bold uppercase transition cursor-pointer"
                                          title="Conferma eliminazione"
                                        >
                                          Sì
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmId(null);
                                          }}
                                          className="px-2 py-0.5 bg-slate-500 hover:bg-slate-600 text-[10px] text-white rounded font-bold uppercase transition cursor-pointer"
                                          title="Annulla"
                                        >
                                          No
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmId(p.id);
                                        }}
                                        title={`Elimina questa revisione (v${p.version || 1})`}
                                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      )}

            <div className="rounded-lg p-3 bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
              📌 Ogni modello supporta revisioni numerate progressive (v1, v2, v3...). Puoi creare quante versioni desideri per documentare aggiornamenti fisici, test o layout di campagna diversi nel database cloud Firebase.
            </div>
          </div>
        )}

      </div>

      {/* Batch Rename Modal for Agency Season Organization */}
      <BatchRenameModal
        isOpen={showBatchRenameModal}
        onClose={() => setShowBatchRenameModal(false)}
        localProfiles={localProfiles}
        onBatchRename={onBatchRenameProfiles || (async () => {})}
      />
    </div>
  );
};
