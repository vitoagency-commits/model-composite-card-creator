import React, { useState, useRef, useMemo, ChangeEvent } from "react";
import { ModelData, ConflictResolution, CardImportTarget, AgencyInfo } from "../types";
import { 
  FileUp, 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  AlertCircle, 
  Download, 
  Upload, 
  FileCode, 
  Image as ImageIcon, 
  ArrowRight, 
  Trash2, 
  User, 
  RefreshCw,
  FolderInput,
  CheckCircle2,
  Copy
} from "lucide-react";

interface ImportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  localProfiles: ModelData[];
  currentModel: ModelData;
  onImportCards: (
    cards: ModelData[],
    targetMode: CardImportTarget,
    conflictMode: ConflictResolution
  ) => Promise<void>;
  agency?: AgencyInfo;
}

export const ImportCardModal: React.FC<ImportCardModalProps> = ({
  isOpen,
  onClose,
  localProfiles,
  currentModel,
  onImportCards,
  agency,
}) => {
  // Navigation & tabs
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "quick_photo" | "demo">("file");
  
  // File drag & drop states
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Raw paste area
  const [pasteText, setPasteText] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Parsed cards state
  const [parsedCards, setParsedCards] = useState<ModelData[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Import configuration
  const [targetMode, setTargetMode] = useState<CardImportTarget>("both");
  const [conflictMode, setConflictMode] = useState<ConflictResolution>("new_version");
  const [isProcessing, setIsProcessing] = useState(false);

  // Quick photo card creation state
  const [quickName, setQuickName] = useState("");
  const [quickGender, setQuickGender] = useState<"model woman" | "model man" | "child model woman" | "child model man">("model woman");
  const [quickHeight, setQuickHeight] = useState("178");
  const [quickBust, setQuickBust] = useState("85");
  const [quickWaist, setQuickWaist] = useState("60");
  const [quickHips, setQuickHips] = useState("89");
  const [quickShoes, setQuickShoes] = useState("39");
  const [quickEyes, setQuickEyes] = useState("Verdi");
  const [quickHair, setQuickHair] = useState("Castani");
  const [quickImgLeft, setQuickImgLeft] = useState<string>("");
  const [quickImgCenter, setQuickImgCenter] = useState<string>("");
  const [quickImgRight, setQuickImgRight] = useState<string>("");

  // Reset when opening
  React.useEffect(() => {
    if (isOpen) {
      setParseError(null);
      setParsedCards([]);
      setSelectedCardIds([]);
      setSelectedFileName("");
      setPasteText("");
    }
  }, [isOpen]);

  // Check if any parsed cards conflict with existing local profiles
  const hasExistingConflict = useMemo(() => {
    if (parsedCards.length === 0) return false;
    const existingNames = new Set(localProfiles.map(p => p.name.trim().toLowerCase()));
    return parsedCards.some(c => existingNames.has(c.name.trim().toLowerCase()));
  }, [parsedCards, localProfiles]);

  // Comprehensive card normalizer
  const normalizeCardObject = (raw: any, index = 0): ModelData | null => {
    if (!raw || typeof raw !== "object") return null;

    // Detect name (support English & Italian aliases)
    const name = String(raw.name || raw.nome || raw.modelName || raw.modella || raw.modello || "").trim();
    if (!name) return null;

    // Detect gender
    let gender: "model woman" | "model man" | "child model woman" | "child model man" = "model woman";
    const rawGender = String(raw.gender || raw.genere || raw.category || raw.categoria || "").toLowerCase();
    if (rawGender.includes("child") && rawGender.includes("man")) {
      gender = "child model man";
    } else if (rawGender.includes("child") || rawGender.includes("bambin")) {
      gender = "child model woman";
    } else if (rawGender.includes("man") || rawGender.includes("uomo") || rawGender.includes("masch")) {
      gender = "model man";
    } else {
      gender = "model woman";
    }

    // Detect layout
    const validLayouts = [
      "classic", "duo", "asymmetric-left", "solo", "grid-4", "grid-6", 
      "editorial-6", "grid-10", "cinematic-2", "campaign-2", "campaign-2-portrait", 
      "campaign-wedding", "campaign-3", "campaign-seamless", "campaign-tvc", 
      "campaign-solo", "campaign-tvc-4", "campaign-brand-6", "campaign-5-hybrid"
    ];
    const layout = validLayouts.includes(raw.layout) ? raw.layout : "classic";

    // Detect images (support direct props or array)
    let imgLeft = raw.imageLeft || raw.fotoSinistra || raw.foto1 || "";
    let imgCenter = raw.imageCenter || raw.fotoCentro || raw.foto2 || raw.mainImage || raw.coverImage || "";
    let imgRight = raw.imageRight || raw.fotoDestra || raw.foto3 || "";
    let img4 = raw.image4 || raw.foto4 || "";
    let img5 = raw.image5 || raw.foto5 || "";
    let img6 = raw.image6 || raw.foto6 || "";

    if (Array.isArray(raw.images || raw.immagini || raw.photos || raw.foto)) {
      const arr = (raw.images || raw.immagini || raw.photos || raw.foto) as string[];
      if (!imgLeft && arr[0]) imgLeft = arr[0];
      if (!imgCenter && arr[1]) imgCenter = arr[1];
      if (!imgRight && arr[2]) imgRight = arr[2];
      if (!img4 && arr[3]) img4 = arr[3];
      if (!img5 && arr[4]) img5 = arr[4];
      if (!img6 && arr[5]) img6 = arr[5];
    }

    const newId = raw.id && typeof raw.id === "string" && !raw.id.startsWith("temp_") 
      ? raw.id 
      : `imported_${Date.now()}_${index}`;

    const numOr = (val: any, fallback: number) => {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? fallback : parsed;
    };

    return {
      id: newId,
      name,
      height: String(raw.height || raw.altezza || "").replace(/cm/i, "").trim(),
      bust: String(raw.bust || raw.seno || "").replace(/cm/i, "").trim(),
      waist: String(raw.waist || raw.vita || "").replace(/cm/i, "").trim(),
      hips: String(raw.hips || raw.fianchi || "").replace(/cm/i, "").trim(),
      shoes: String(raw.shoes || raw.scarpe || "").trim(),
      eyes: String(raw.eyes || raw.occhi || "").trim(),
      hair: String(raw.hair || raw.capelli || "").trim(),
      sizeUpper: String(raw.sizeUpper || raw.tagliaSuperiore || raw.upperSize || "").trim(),
      sizeLower: String(raw.sizeLower || raw.tagliaInferiore || raw.lowerSize || "").trim(),
      imageLeft: imgLeft,
      imageCenter: imgCenter,
      imageRight: imgRight,
      zoomLeft: numOr(raw.zoomLeft, 100),
      zoomCenter: numOr(raw.zoomCenter, 100),
      zoomRight: numOr(raw.zoomRight, 100),
      offsetXLeft: numOr(raw.offsetXLeft, 50),
      offsetYLeft: numOr(raw.offsetYLeft, 50),
      offsetXCenter: numOr(raw.offsetXCenter, 50),
      offsetYCenter: numOr(raw.offsetYCenter, 50),
      offsetXRight: numOr(raw.offsetXRight, 50),
      offsetYRight: numOr(raw.offsetYRight, 50),
      layout,
      campaignName: raw.campaignName || "",
      customCaption: raw.customCaption || "",
      image4: img4,
      image5: img5,
      image6: img6,
      zoom4: numOr(raw.zoom4, 100),
      zoom5: numOr(raw.zoom5, 100),
      zoom6: numOr(raw.zoom6, 100),
      offsetX4: numOr(raw.offsetX4, 50),
      offsetY4: numOr(raw.offsetY4, 50),
      offsetX5: numOr(raw.offsetX5, 50),
      offsetY5: numOr(raw.offsetY5, 50),
      offsetX6: numOr(raw.offsetX6, 50),
      offsetY6: numOr(raw.offsetY6, 50),
      gender,
      version: typeof raw.version === "number" ? raw.version : 1,
      rootId: raw.rootId || newId,
      versionNote: raw.versionNote || "Importato da card esterna",
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filterLeft: raw.filterLeft,
      filterCenter: raw.filterCenter,
      filterRight: raw.filterRight,
      filter4: raw.filter4,
      filter5: raw.filter5,
      filter6: raw.filter6,
    };
  };

  // Parser for CSV / TSV text
  const parseCsvText = (csvString: string): ModelData[] => {
    const lines = csvString.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));

    const cards: ModelData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^['"]|['"]$/g, ""));
      if (cols.length < 2) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] || "";
      });

      const card = normalizeCardObject(obj, i);
      if (card) cards.push(card);
    }
    return cards;
  };

  // Central parser function that parses JSON, bundles, or CSV
  const processRawString = (content: string, fileName?: string): boolean => {
    setParseError(null);
    const trimmed = content.trim();

    if (!trimmed) {
      setParseError("Il file o il testo inserito è vuoto.");
      return false;
    }

    // Try parsing as JSON first
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        let candidates: any[] = [];

        if (Array.isArray(parsed)) {
          candidates = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.cards)) {
            candidates = parsed.cards;
          } else if (Array.isArray(parsed.models)) {
            candidates = parsed.models;
          } else if (Array.isArray(parsed.profiles)) {
            candidates = parsed.profiles;
          } else if (parsed.card) {
            candidates = [parsed.card];
          } else if (parsed.model) {
            candidates = [parsed.model];
          } else if (parsed.profile) {
            candidates = [parsed.profile];
          } else {
            candidates = [parsed];
          }
        }

        const validCards: ModelData[] = [];
        candidates.forEach((cand, idx) => {
          const norm = normalizeCardObject(cand, idx);
          if (norm) validCards.push(norm);
        });

        if (validCards.length === 0) {
          setParseError("Nessuna informazione di card o modello valida trovata nel JSON. Assicurati che contenga almeno il nome del modello (es. 'name' o 'nome').");
          return false;
        }

        setParsedCards(validCards);
        setSelectedCardIds(validCards.map(c => c.id));
        if (fileName) setSelectedFileName(fileName);
        return true;
      } catch (err: any) {
        console.error("JSON parsing error:", err);
        setParseError(`Errore di sintassi JSON: ${err?.message || "formato non valido"}`);
        return false;
      }
    }

    // Fallback: try parsing as CSV/TSV table
    const csvCards = parseCsvText(trimmed);
    if (csvCards.length > 0) {
      setParsedCards(csvCards);
      setSelectedCardIds(csvCards.map(c => c.id));
      if (fileName) setSelectedFileName(fileName);
      return true;
    }

    setParseError("Formato non riconosciuto. Carica un file .JSON valido o una tabella CSV con intestazioni (Nome, Altezza, Seno, Vita, Fianchi, Scarpe).");
    return false;
  };

  // Handle file drop & selection
  const handleFileUpload = (file: File) => {
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processRawString(content, file.name);
    };
    reader.onerror = () => {
      setParseError("Impossibile leggere il file selezionato dal disco.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Demo card generator for 1-click test
  const handleLoadDemoCard = () => {
    const demoCard: ModelData = {
      id: `imported_demo_${Date.now()}`,
      name: "GIULIA S. (IMPORTATA)",
      height: "179",
      bust: "86",
      waist: "61",
      hips: "90",
      shoes: "39",
      eyes: "Nocciola / Hazel",
      hair: "Castano Chiaro",
      sizeUpper: "S",
      sizeLower: "38 / 40",
      imageLeft: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop",
      imageCenter: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
      imageRight: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
      zoomLeft: 100,
      zoomCenter: 105,
      zoomRight: 100,
      offsetXLeft: 50,
      offsetYLeft: 35,
      offsetXCenter: 50,
      offsetYCenter: 25,
      offsetXRight: 50,
      offsetYRight: 35,
      layout: "classic",
      campaignName: "SUMMER EDITORIAL",
      customCaption: "Official Agency Card 2026",
      gender: "model woman",
      version: 1,
      rootId: `root_${Date.now()}`,
      versionNote: "Card di test demo importata",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setParsedCards([demoCard]);
    setSelectedCardIds([demoCard.id]);
    setSelectedFileName("card_demo_giulia_s.json");
    setParseError(null);
  };

  // Download example JSON card file
  const handleDownloadSampleJson = () => {
    const sample = {
      formatVersion: "1.0",
      exportedAt: new Date().toISOString(),
      generator: "Cosmopolitan Agency Model Studio",
      card: {
        name: "ELENA ROSSI",
        gender: "model woman",
        layout: "classic",
        height: "178",
        bust: "85",
        waist: "60",
        hips: "89",
        shoes: "39",
        eyes: "Verdi / Green",
        hair: "Castani / Brown",
        sizeUpper: "S",
        sizeLower: "38 / 40",
        campaignName: "VOGUE EDITORIAL",
        customCaption: "Milano Fashion Week",
        imageLeft: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
        imageCenter: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop",
        imageRight: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
        zoomLeft: 100,
        zoomCenter: 100,
        zoomRight: 100,
        offsetXLeft: 50,
        offsetYLeft: 35,
        offsetXCenter: 50,
        offsetYCenter: 25,
        offsetXRight: 50,
        offsetYRight: 35
      }
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "card_esempio_modella.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick photo card submit
  const handleQuickPhotoSubmit = () => {
    if (!quickName.trim()) {
      setParseError("Inserisci almeno il Nome della modella o modello!");
      return;
    }

    const newCard: ModelData = {
      id: `imported_photo_${Date.now()}`,
      name: quickName.trim().toUpperCase(),
      height: quickHeight.trim(),
      bust: quickBust.trim(),
      waist: quickWaist.trim(),
      hips: quickHips.trim(),
      shoes: quickShoes.trim(),
      eyes: quickEyes.trim(),
      hair: quickHair.trim(),
      sizeUpper: "S",
      sizeLower: "38",
      imageLeft: quickImgLeft,
      imageCenter: quickImgCenter,
      imageRight: quickImgRight,
      zoomLeft: 100,
      zoomCenter: 100,
      zoomRight: 100,
      offsetXLeft: 50,
      offsetYLeft: 50,
      offsetXCenter: 50,
      offsetYCenter: 50,
      offsetXRight: 50,
      offsetYRight: 50,
      layout: "classic",
      gender: quickGender,
      version: 1,
      rootId: `root_${Date.now()}`,
      versionNote: "Card creata rapidamente da foto importate",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setParsedCards([newCard]);
    setSelectedCardIds([newCard.id]);
    setSelectedFileName(`${quickName.trim().toLowerCase()}_card.json`);
    setParseError(null);
  };

  // Image reader helper for Quick Photo tab
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit the selected cards to App.tsx
  const handleConfirmImport = async () => {
    const cardsToImport = parsedCards.filter(c => selectedCardIds.includes(c.id));
    if (cardsToImport.length === 0) {
      setParseError("Seleziona almeno una card da importare!");
      return;
    }

    setIsProcessing(true);
    try {
      await onImportCards(cardsToImport, targetMode, conflictMode);
      onClose();
    } catch (err: any) {
      console.error("Import error:", err);
      setParseError(`Errore durante l'importazione: ${err?.message || "errore sconosciuto"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl border border-indigo-400/30">
              <FolderInput size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider uppercase flex items-center gap-2">
                <span>Importa Card Composit</span>
                <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  JSON / DATI
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Carica schede modella/o da file JSON, archivio catalogo, testo o foto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-left">
          
          {/* If cards are not yet parsed, show the input sources tabs */}
          {parsedCards.length === 0 ? (
            <>
              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-200 gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab("file"); setParseError(null); }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "file"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileUp size={14} />
                  <span>Carica File (.json / .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("paste"); setParseError(null); }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "paste"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileCode size={14} />
                  <span>Incolla JSON / Testo</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("quick_photo"); setParseError(null); }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "quick_photo"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>Card da Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab("demo"); setParseError(null); }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "demo"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles size={14} />
                  <span>Template & Demo</span>
                </button>
              </div>

              {/* Tab 1: File Upload / Drag & Drop */}
              {activeTab === "file" && (
                <div className="space-y-3 pt-2">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                      dragOver 
                        ? "border-indigo-500 bg-indigo-50/70 scale-[1.01]" 
                        : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />

                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Upload size={28} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Trascina qui il file della card oppure <span className="text-indigo-600 underline">sfoglia</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supporta file <strong className="text-slate-700">.JSON</strong> (card singola o archivio catalogo) e tabelle <strong className="text-slate-700">.CSV</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">card_elena.json</span>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md">catalogo_completo.json</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo-600" />
                      Vuoi testare subito l'importazione senza cercare un file?
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadDemoCard}
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Carica Card Demo
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste JSON / Text */}
              {activeTab === "paste" && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-600">
                    Incolla direttamente qui il codice JSON esportato da un'altra postazione o le misure della modella:
                  </p>
                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder='{\n  "name": "MARIA V.",\n  "height": "178",\n  "bust": "85",\n  "waist": "60",\n  "hips": "89",\n  "shoes": "39",\n  "eyes": "Verdi",\n  "hair": "Castani"\n}'
                    className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPasteText(JSON.stringify({
                          name: "SOFIA B.",
                          gender: "model woman",
                          height: "179",
                          bust: "86",
                          waist: "60",
                          hips: "90",
                          shoes: "39",
                          eyes: "Azzurri",
                          hair: "Biondi",
                          layout: "classic"
                        }, null, 2));
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                    >
                      Inserisci Esempio Veloce
                    </button>

                    <button
                      type="button"
                      disabled={!pasteText.trim()}
                      onClick={() => processRawString(pasteText, "dati_incollati.json")}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Analizza Dati Incollati</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Quick Photo Card */}
              {activeTab === "quick_photo" && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-600">
                    Crea istantaneamente una nuova card caricando direttamente da 1 a 3 fotografie e inserendo i dati fisici:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">NOME MODELLA/O *</label>
                      <input
                        type="text"
                        placeholder="Es. CHIARA N."
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">CATEGORIA</label>
                      <select
                        value={quickGender}
                        onChange={(e) => setQuickGender(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="model woman">Model Woman</option>
                        <option value="model man">Model Man</option>
                        <option value="child model woman">Child Model Woman</option>
                        <option value="child model man">Child Model Man</option>
                      </select>
                    </div>
                  </div>

                  {/* Physical measurements grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">ALTEZZA</label>
                      <input
                        type="text"
                        value={quickHeight}
                        onChange={(e) => setQuickHeight(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">SENO</label>
                      <input
                        type="text"
                        value={quickBust}
                        onChange={(e) => setQuickBust(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">VITA</label>
                      <input
                        type="text"
                        value={quickWaist}
                        onChange={(e) => setQuickWaist(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">FIANCHI</label>
                      <input
                        type="text"
                        value={quickHips}
                        onChange={(e) => setQuickHips(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">SCARPE</label>
                      <input
                        type="text"
                        value={quickShoes}
                        onChange={(e) => setQuickShoes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">OCCHI</label>
                      <input
                        type="text"
                        value={quickEyes}
                        onChange={(e) => setQuickEyes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-600 block">CAPELLI</label>
                      <input
                        type="text"
                        value={quickHair}
                        onChange={(e) => setQuickHair(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-center"
                      />
                    </div>
                  </div>

                  {/* 3 Photos slot */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {/* Left photo */}
                    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1.5">Foto Sinistra</span>
                      <div className="w-16 h-20 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {quickImgLeft ? (
                          <img src={quickImgLeft} alt="Left" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <label className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[9px] py-1 px-2 rounded cursor-pointer w-full">
                        <span>Scegli Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, setQuickImgLeft)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Center photo */}
                    <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-2.5 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold text-indigo-700 block mb-1.5">Foto Centro (Cover)</span>
                      <div className="w-16 h-20 bg-indigo-100 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {quickImgCenter ? (
                          <img src={quickImgCenter} alt="Center" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-indigo-400" />
                        )}
                      </div>
                      <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[9px] py-1 px-2 rounded cursor-pointer w-full">
                        <span>Scegli Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, setQuickImgCenter)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Right photo */}
                    <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-600 block mb-1.5">Foto Destra</span>
                      <div className="w-16 h-20 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                        {quickImgRight ? (
                          <img src={quickImgRight} alt="Right" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-400" />
                        )}
                      </div>
                      <label className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[9px] py-1 px-2 rounded cursor-pointer w-full">
                        <span>Scegli Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, setQuickImgRight)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleQuickPhotoSubmit}
                      disabled={!quickName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Genera Anteprima Card</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Template & Demo */}
              {activeTab === "demo" && (
                <div className="space-y-4 pt-2">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-600" />
                        Test Rapido con Card Demo Ufficiale
                      </h4>
                      <p className="text-[11px] text-indigo-700">
                        Carica una card completa di fotografie professionali in alta definizione e misure standard pronte per testare l'importazione in 1 click.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadDemoCard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Carica Card Demo
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Download size={14} className="text-slate-600" />
                        Scarica File JSON di Esempio
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Scarica un file modello (.json) formattato correttamente per condividere schede tra agenzie o compilare in batch.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSampleJson}
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold py-2 px-4 rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Scarica Template JSON
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* REVIEW & CONFIRMATION SCREEN (When cards have been parsed) */
            <div className="space-y-4">
              
              {/* Success badge with count & reset button */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    {parsedCards.length === 1 
                      ? `1 Card rilevata con successo: "${parsedCards[0].name}"` 
                      : `${parsedCards.length} Card rilevate nel pacchetto`}
                  </span>
                  {selectedFileName && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedFileName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedCards([]);
                    setSelectedCardIds([]);
                    setSelectedFileName("");
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cambia file / Ricarica
                </button>
              </div>

              {/* Conflict notice if any model name matches an existing one in localProfiles */}
              {hasExistingConflict && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-800 space-y-1 leading-tight">
                    <strong className="font-bold text-amber-950 block">Nota di corrispondenza database:</strong>
                    Una o più card importate hanno lo stesso nome di profili già presenti nel database. Scegli sotto se creare una nuova versione progressiva (v2, v3...), un profilo separato o sovrascrivere.
                  </div>
                </div>
              )}

              {/* Cards List Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1 uppercase tracking-wider">
                  <span>Schede Pronte ({selectedCardIds.length} di {parsedCards.length} selezionate)</span>
                  {parsedCards.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCardIds(parsedCards.map(c => c.id))}
                        className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Seleziona Tutti
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCardIds([])}
                        className="text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Deseleziona
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {parsedCards.map((card) => {
                    const isSelected = selectedCardIds.includes(card.id);
                    const hasConflict = localProfiles.some(p => p.name.trim().toLowerCase() === card.name.trim().toLowerCase());
                    const photoThumbnail = card.imageCenter || card.imageLeft || card.imageRight;

                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          setSelectedCardIds(prev => 
                            prev.includes(card.id) 
                              ? prev.filter(id => id !== card.id)
                              : [...prev, card.id]
                          );
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected 
                            ? "bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200" 
                            : "bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />

                        {/* Photo Thumbnail */}
                        <div className="w-11 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                          {photoThumbnail ? (
                            <img 
                              src={photoThumbnail} 
                              alt={card.name} 
                              className="w-full h-full object-cover" 
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={18} className="text-slate-400" />
                          )}
                        </div>

                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 tracking-wider truncate uppercase">
                              {card.name}
                            </span>
                            <span className="text-[9px] font-semibold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded uppercase">
                              {card.gender || "model woman"}
                            </span>
                            <span className="text-[9px] font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                              layout: {card.layout || "classic"}
                            </span>
                            {hasConflict && (
                              <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded uppercase">
                                In Archivio
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>H: {card.height || "—"} cm</span>
                            <span>•</span>
                            <span>B: {card.bust || "—"}</span>
                            <span>•</span>
                            <span>W: {card.waist || "—"}</span>
                            <span>•</span>
                            <span>H: {card.hips || "—"}</span>
                            <span>•</span>
                            <span>S: {card.shoes || "—"}</span>
                            {card.eyes && <span>• Occhi: {card.eyes}</span>}
                            {card.hair && <span>• Capelli: {card.hair}</span>}
                          </div>

                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {[card.imageLeft, card.imageCenter, card.imageRight, card.image4, card.image5, card.image6].filter(Boolean).length} fotografie allegate
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Destination Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Destinazione di Importazione
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      targetMode === "both" ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50"
                    }`}>
                      <input
                        type="radio"
                        name="importTarget"
                        value="both"
                        checked={targetMode === "both"}
                        onChange={() => setTargetMode("both")}
                        className="accent-indigo-600"
                      />
                      <div className="text-[11px] leading-tight">
                        <span>Editor + Database</span>
                        <span className="block text-[9px] text-slate-500 font-normal">Consigliato</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      targetMode === "editor" ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50"
                    }`}>
                      <input
                        type="radio"
                        name="importTarget"
                        value="editor"
                        checked={targetMode === "editor"}
                        onChange={() => setTargetMode("editor")}
                        className="accent-indigo-600"
                      />
                      <div className="text-[11px] leading-tight">
                        <span>Solo nell'Editor</span>
                        <span className="block text-[9px] text-slate-500 font-normal">Per stampa immediata</span>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      targetMode === "database" ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50"
                    }`}>
                      <input
                        type="radio"
                        name="importTarget"
                        value="database"
                        checked={targetMode === "database"}
                        onChange={() => setTargetMode("database")}
                        className="accent-indigo-600"
                      />
                      <div className="text-[11px] leading-tight">
                        <span>Solo nel Database</span>
                        <span className="block text-[9px] text-slate-500 font-normal">Salva senza aprire</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conflict resolution option (always configurable, highlighted if conflicts exist) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Se il modello esiste già nel database:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      conflictMode === "new_version" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-900" : "bg-white border-slate-200 text-slate-600"
                    }`}>
                      <input
                        type="radio"
                        name="conflictRes"
                        value="new_version"
                        checked={conflictMode === "new_version"}
                        onChange={() => setConflictMode("new_version")}
                        className="accent-indigo-600"
                      />
                      <span className="text-[10px]">Crea Nuova Versione (v+1)</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      conflictMode === "new_model" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-900" : "bg-white border-slate-200 text-slate-600"
                    }`}>
                      <input
                        type="radio"
                        name="conflictRes"
                        value="new_model"
                        checked={conflictMode === "new_model"}
                        onChange={() => setConflictMode("new_model")}
                        className="accent-indigo-600"
                      />
                      <span className="text-[10px]">Crea Profilo Indipendente</span>
                    </label>

                    <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                      conflictMode === "overwrite" ? "bg-indigo-50 border-indigo-300 font-semibold text-indigo-900" : "bg-white border-slate-200 text-slate-600"
                    }`}>
                      <input
                        type="radio"
                        name="conflictRes"
                        value="overwrite"
                        checked={conflictMode === "overwrite"}
                        onChange={() => setConflictMode("overwrite")}
                        className="accent-indigo-600"
                      />
                      <span className="text-[10px]">Sovrascrivi Dati Esistenti</span>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Error Message Box */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{parseError}</div>
              <button
                type="button"
                onClick={() => setParseError(null)}
                className="text-red-400 hover:text-red-700 p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Annulla
          </button>

          {parsedCards.length > 0 ? (
            <button
              type="button"
              disabled={isProcessing || selectedCardIds.length === 0}
              onClick={handleConfirmImport}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Salvataggio nel Cloud in corso...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Importa {selectedCardIds.length} {selectedCardIds.length === 1 ? "Card" : "Card"}</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Seleziona o incolla un file per procedere
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
