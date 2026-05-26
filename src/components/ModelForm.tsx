import React, { useRef } from "react";
import { ModelData, AgencyInfo } from "../types";
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
  Heart,
  ZoomIn,
  CheckCircle,
  PlusCircle,
  Maximize2,
  Undo,
  Redo,
  Copy
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
  fontFamily: "serif" | "display" | "sans";
  onSelectFontFamily: (font: "serif" | "display" | "sans") => void;
  onClearForm: () => void;
  localProfiles: ModelData[];
  onSaveLocal: () => void;
  onDeleteLocal: (id: string) => void;
  onDuplicateLocal?: (model: ModelData) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showMultiExport?: boolean;
  onToggleMultiExport?: (val: boolean) => void;
}

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
  onDeleteLocal,
  onDuplicateLocal,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  showMultiExport = false,
  onToggleMultiExport,
}) => {
  const [activeTab, setActiveTab] = React.useState<"dati" | "allineamento" | "stile" | "salvati">("dati");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  
  // Refs for file uploads
  const fileLeftRef = useRef<HTMLInputElement>(null);
  const fileCenterRef = useRef<HTMLInputElement>(null);
  const fileRightRef = useRef<HTMLInputElement>(null);
  const file4Ref = useRef<HTMLInputElement>(null);
  const file5Ref = useRef<HTMLInputElement>(null);
  const file6Ref = useRef<HTMLInputElement>(null);

  // Form field changes
  const handleFieldChange = (field: keyof ModelData, value: string | number) => {
    onChangeModel({
      ...model,
      [field]: value,
    });
  };

  // Helper for image recommended sizes
  const getImageRecommendation = (slot: "Left" | "Center" | "Right" | "4" | "5" | "6", layout: string) => {
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
    return { minWidth: 1000, minHeight: 1000, orientation: "Qualsiasi", ratio: "Flessibile", notes: "Usa foto ad alta definizione." };
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
  const handleImageFileChange = async (slot: "Left" | "Center" | "Right" | "4" | "5" | "6", e: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  };

  // Trigger file click
  const triggerImageUpload = (slot: "Left" | "Center" | "Right" | "4" | "5" | "6") => {
    if (slot === "Left" && fileLeftRef.current) fileLeftRef.current.click();
    if (slot === "Center" && fileCenterRef.current) fileCenterRef.current.click();
    if (slot === "Right" && fileRightRef.current) fileRightRef.current.click();
    if (slot === "4" && file4Ref.current) file4Ref.current.click();
    if (slot === "5" && file5Ref.current) file5Ref.current.click();
    if (slot === "6" && file6Ref.current) file6Ref.current.click();
  };

  // Preset triggers
  const handleUrlPaste = (slot: "Left" | "Center" | "Right", url: string) => {
    handleFieldChange(`image${slot}` as keyof ModelData, url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full bg-slate-50/50">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 bg-white p-1 gap-1 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("dati")}
          className={`flex-1 py-3 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "dati" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <User size={13} />
          Dati Fisici
        </button>
        <button
          onClick={() => setActiveTab("allineamento")}
          className={`flex-1 py-3 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "allineamento" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Move size={13} />
          Allinea Foto
        </button>
        <button
          onClick={() => setActiveTab("stile")}
          className={`flex-1 py-3 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "stile" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Settings size={13} />
          Azienda/Stile
        </button>
        <button
          onClick={() => setActiveTab("salvati")}
          className={`flex-1 py-3 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "salvati" 
              ? "bg-slate-900 text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Layers size={13} />
          Database
          {localProfiles.length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
              {localProfiles.length}
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
            
            {/* Quick Template Presets */}
            <div>
              <label className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-2">
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

            <div className="mt-4 pt-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <PlusCircle size={13} />
                Salva nel database locale!
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 mb-2.5">
                Puoi memorizzare i dettagli fisici di questa modella/o per ricaricarli rapidamente in futuro dalla scheda "Database".
              </p>
              <div className="space-y-2">
                <button
                  onClick={onSaveLocal}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <CheckCircle size={12} />
                  Salva Profilo Attuale
                </button>
                {onDuplicateLocal && (
                  <button
                    onClick={() => onDuplicateLocal(model)}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                    title="Crea una copia indipendente per usare foto e layout diversi per la stessa persona"
                  >
                    <Copy size={12} />
                    Duplica e Crea Copia
                  </button>
                )}
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

          let labelLeft = "1. FOTO SINISTRA";
          let labelCenter = "2. FOTO CENTRALE";
          let labelRight = "3. FOTO DESTRA";
          let label4 = "4. QUARTA FOTO";
          let label5 = "5. QUINTA FOTO";
          let label6 = "6. SESTA FOTO";

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
          }

          return (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-[11px] text-amber-900">
                💡 <strong>Allineamento automatico senza deformare</strong>: Tutte le foto si ridimensionano mantenendo la proporzione. Usa gli slider sottostanti per poggiare il viso o il busto esattamente come desideri!
              </div>

              {/* SEC 1: FOTO SINISTRA */}
              {showLeft && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {labelLeft}
                    </span>
                    {model.imageLeft && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("Left")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={fileLeftRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("Left", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("Left", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoomLeft ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoomLeft", 100);
                          handleFieldChange("offsetXLeft", 50);
                          handleFieldChange("offsetYLeft", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoomLeft ?? 100}
                      onChange={(e) => handleFieldChange("zoomLeft", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetXLeft ?? 50}
                          onChange={(e) => handleFieldChange("offsetXLeft", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetYLeft ?? 50}
                          onChange={(e) => handleFieldChange("offsetYLeft", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEC 2: FOTO CENTRALE */}
              {showCenter && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {labelCenter}
                    </span>
                    {model.imageCenter && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("Center")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={fileCenterRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("Center", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("Center", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoomCenter ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoomCenter", 100);
                          handleFieldChange("offsetXCenter", 50);
                          handleFieldChange("offsetYCenter", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoomCenter ?? 100}
                      onChange={(e) => handleFieldChange("zoomCenter", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetXCenter ?? 50}
                          onChange={(e) => handleFieldChange("offsetXCenter", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetYCenter ?? 50}
                          onChange={(e) => handleFieldChange("offsetYCenter", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEC 3: FOTO DESTRA */}
              {showRight && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {labelRight}
                    </span>
                    {model.imageRight && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("Right")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={fileRightRef}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("Right", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("Right", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoomRight ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoomRight", 100);
                          handleFieldChange("offsetXRight", 50);
                          handleFieldChange("offsetYRight", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoomRight ?? 100}
                      onChange={(e) => handleFieldChange("zoomRight", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetXRight ?? 50}
                          onChange={(e) => handleFieldChange("offsetXRight", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetYRight ?? 50}
                          onChange={(e) => handleFieldChange("offsetYRight", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEC 4: FOTO 4 */}
              {show4 && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {label4}
                    </span>
                    {model.image4 && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("4")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={file4Ref}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("4", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("4", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoom4 ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoom4", 100);
                          handleFieldChange("offsetX4", 50);
                          handleFieldChange("offsetY4", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoom4 ?? 100}
                      onChange={(e) => handleFieldChange("zoom4", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetX4 ?? 50}
                          onChange={(e) => handleFieldChange("offsetX4", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetY4 ?? 50}
                          onChange={(e) => handleFieldChange("offsetY4", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEC 5: FOTO 5 */}
              {show5 && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {label5}
                    </span>
                    {model.image5 && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("5")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={file5Ref}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("5", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("5", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoom5 ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoom5", 100);
                          handleFieldChange("offsetX5", 50);
                          handleFieldChange("offsetY5", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoom5 ?? 100}
                      onChange={(e) => handleFieldChange("zoom5", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetX5 ?? 50}
                          onChange={(e) => handleFieldChange("offsetX5", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetY5 ?? 50}
                          onChange={(e) => handleFieldChange("offsetY5", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SEC 6: FOTO 6 */}
              {show6 && (
                <div className="border border-slate-100 rounded-xl bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                      {label6}
                    </span>
                    {model.image6 && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                        Caricata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerImageUpload("6")}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Upload size={14} />
                      Sfoglia File PC / Mac
                    </button>
                    <input
                      type="file"
                      ref={file6Ref}
                      accept="image/*"
                      onChange={(e) => handleImageFileChange("6", e)}
                      className="hidden"
                    />
                  </div>

                  {/* Dimensioni Consigliate */}
                  {(() => {
                    const rec = getImageRecommendation("6", currentLayout);
                    return (
                      <div className="bg-slate-50 border border-slate-100/60 px-3 py-2 rounded-lg space-y-1 block text-left">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[8.5px]">Consigliato:</span>
                          <span className="font-mono font-bold text-slate-800 bg-slate-200/80 px-1 rounded-2xs text-[10px]">
                            {rec.minWidth} × {rec.minHeight} px
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-1 rounded-2xs text-[9.5px] font-semibold">
                            {rec.ratio} ({rec.orientation})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {rec.notes}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span className="flex items-center gap-1"><ZoomIn size={12} /> Zoom: {model.zoom6 ?? 100}%</span>
                      <button 
                        onClick={() => {
                          handleFieldChange("zoom6", 100);
                          handleFieldChange("offsetX6", 50);
                          handleFieldChange("offsetY6", 50);
                        }} 
                        className="text-red-500 hover:underline text-[10px]"
                      >
                        Reset
                      </button>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={model.zoom6 ?? 100}
                      onChange={(e) => handleFieldChange("zoom6", parseInt(e.target.value))}
                      className="w-full accent-slate-900"
                    />

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span>Sposta Orizzontale (X)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetX6 ?? 50}
                          onChange={(e) => handleFieldChange("offsetX6", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                      <div>
                        <span>Sposta Verticale (Y)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={model.offsetY6 ?? 50}
                          onChange={(e) => handleFieldChange("offsetY6", parseInt(e.target.value))}
                          className="w-full accent-slate-600 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* TAB 3: IMPOSTAZIONI AZIENDA & STILE SCHEDA */}
        {activeTab === "stile" && (
          <div className="space-y-4">
            
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
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Stile Tipografia
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSelectFontFamily("sans")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                    fontFamily === "sans"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-sans block">Inter</span>
                </button>
                <button
                  onClick={() => onSelectFontFamily("display")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                    fontFamily === "display"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-display block">Space Gr.</span>
                </button>
                <button
                  onClick={() => onSelectFontFamily("serif")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                    fontFamily === "serif"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-serif block">Editorial</span>
                </button>
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
                  <label className="text-[10px] text-slate-500 block font-semibold mb-1">Logo Personalizzato dell'Agenzia</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
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
                          Carica Logo
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
                      <p className="text-[8px] text-slate-400">Trascina o carica il file del tuo brand (es. l'immagine circolare caricata in chat)</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2 text-left">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Profili Salvati nel Browser ({localProfiles.length})
              </h4>
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

            {localProfiles.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white text-slate-400">
                <User className="mx-auto text-slate-300 stroke-1 mb-2" size={32} />
                <p className="text-xs font-medium">Nessun modello salvato ancora.</p>
                <p className="text-[10px] mt-1 text-slate-400">Inserisci i dati fisici di un modello/a e premi il pulsante "Salva" per memorizzarlo in questa lista.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { id: "woman", label: "model woman", count: localProfiles.filter(p => !p.gender || p.gender === "model woman").length, items: localProfiles.filter(p => !p.gender || p.gender === "model woman") },
                  { id: "man", label: "model man", count: localProfiles.filter(p => p.gender === "model man").length, items: localProfiles.filter(p => p.gender === "model man") },
                  { id: "child-woman", label: "child model woman", count: localProfiles.filter(p => p.gender === "child model woman").length, items: localProfiles.filter(p => p.gender === "child model woman") },
                  { id: "child-man", label: "child model man", count: localProfiles.filter(p => p.gender === "child model man").length, items: localProfiles.filter(p => p.gender === "child model man") },
                ].map((section) => (
                  <div key={section.id} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden text-left">
                    <div className="bg-slate-100 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {section.label}
                      </span>
                      <span className="text-[10px] bg-slate-200 font-bold px-2 py-0.5 rounded-full text-slate-600">
                        {section.count}
                      </span>
                    </div>
                    <div className="p-2 space-y-1.5 bg-white">
                      {section.items.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-2">Nessun profilo in questa categoria</p>
                      ) : (
                        section.items.map((p) => (
                          <div 
                            key={p.id}
                            className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
                          >
                            <div 
                              onClick={() => onSelectPreset(p)}
                              className="flex-1 min-w-0"
                            >
                              <span className="font-semibold text-slate-800 text-xs tracking-wider block uppercase group-hover:text-indigo-600 transition-colors">
                                {p.name || "Senza Nome"}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                H: {p.height || "—"} cm / S: {p.shoes || "—"} / B: {p.bust || "—"}
                              </span>
                            </div>
                            {deleteConfirmId === p.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLocal(p.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-[10px] text-white rounded font-bold uppercase transition"
                                  title="Conferma"
                                >
                                  Sì
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-2 py-0.5 bg-slate-500 hover:bg-slate-600 text-[10px] text-white rounded font-bold uppercase transition"
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
                                title="Elimina Profilo"
                                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg p-3 bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
              📌 I profili sono memorizzati in tempo reale nel database cloud Google Firebase Firestore. Questo sincronizza all'istante i profili su Mac, iPad o iPhone con una cache locale ultra-veloce.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
