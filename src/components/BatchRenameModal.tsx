import React, { useState, useMemo } from "react";
import { ModelData, BatchRenameOptions } from "../types";
import { 
  Tag, 
  X, 
  Check, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Eraser,
  ArrowRight,
  Search,
  AlertCircle
} from "lucide-react";

interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  localProfiles: ModelData[];
  onBatchRename: (options: BatchRenameOptions) => Promise<void>;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  onClose,
  localProfiles,
  onBatchRename,
}) => {
  // Season / Tag input state
  const [tag, setTag] = useState<string>("SS26");
  const [format, setFormat] = useState<"bracket" | "hyphen" | "underscore" | "space">("bracket");
  const [stripPrevious, setStripPrevious] = useState<boolean>(true);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => localProfiles.map((p) => p.id));
  const [categoryFilter, setCategoryFilter] = useState<"all" | "woman" | "man" | "child">("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selectedIds when localProfiles change if empty
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(localProfiles.map((p) => p.id));
      setErrorMessage(null);
    }
  }, [isOpen, localProfiles]);

  // Current year & month for quick tags
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currentDateFull = today.toISOString().split("T")[0];

  // Fashion season presets
  const SEASON_PRESETS = [
    { label: "SS26", desc: "Spring/Summer 2026", tag: "SS26" },
    { label: "FW26", desc: "Fall/Winter 2026", tag: "FW26" },
    { label: "SS25", desc: "Spring/Summer 2025", tag: "SS25" },
    { label: "FW25", desc: "Fall/Winter 2025", tag: "FW25" },
    { label: "CRUISE 26", desc: "Resort & Cruise 2026", tag: "CRUISE 26" },
    { label: "CASTING 26", desc: "Selezione Casting", tag: "CASTING 26" },
    { label: currentYearMonth, desc: "Mese Corrente", tag: currentYearMonth },
    { label: currentDateFull, desc: "Data Odierna", tag: currentDateFull },
  ];

  // Helper function to format a name based on current settings
  const computeNewName = (currentName: string): string => {
    let base = currentName.trim();
    if (stripPrevious) {
      // Remove previous bracket tags like [SS25], [FW25], [2026-09] or prefixes like SS25 - or 2026-09 -
      base = base.replace(/^(\[[^\]]+\]\s*|\b(SS|FW|AW|RESORT|CRUISE|SEASON|CASTING)\s*\d{2,4}\s*[-_:]?\s*|\b\d{4}[-_/]\d{2}([-_/]\d{2})?\s*[-_:]?\s*)/i, "").trim();
      // Also remove leading hyphens/underscores if any left
      base = base.replace(/^[-_:]\s*/, "").trim();
    }
    if (!base) base = "MODELLO";

    const cleanTag = tag.trim().toUpperCase();
    if (!cleanTag) return base;

    if (format === "bracket") {
      return `[${cleanTag}] ${base}`;
    } else if (format === "hyphen") {
      return `${cleanTag} - ${base}`;
    } else if (format === "underscore") {
      return `${cleanTag}_${base}`;
    } else {
      return `${cleanTag} ${base}`;
    }
  };

  // Filtered profiles for the selection checklist
  const visibleProfiles = useMemo(() => {
    return localProfiles.filter((p) => {
      // Category filter
      if (categoryFilter === "woman" && p.gender && p.gender !== "model woman") return false;
      if (categoryFilter === "man" && p.gender !== "model man") return false;
      if (categoryFilter === "child" && p.gender !== "child model woman" && p.gender !== "child model man") return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesNote = (p.versionNote || "").toLowerCase().includes(q);
        return matchesName || matchesNote;
      }
      return true;
    });
  }, [localProfiles, categoryFilter, searchQuery]);

  const handleSelectAllVisible = () => {
    const visibleIds = visibleProfiles.map((p) => p.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAllVisible = () => {
    const visibleIdSet = new Set(visibleProfiles.map((p) => p.id));
    setSelectedIds((prev) => prev.filter((id) => !visibleIdSet.has(id)));
  };

  const toggleSelectProfile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage("Seleziona almeno un profilo dall'elenco per applicare la ridenominazione.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onBatchRename({
        profileIds: selectedIds,
        tag: tag.trim().toUpperCase(),
        format,
        stripPrevious,
      });
      onClose();
    } catch (err) {
      console.error("Batch rename error in modal:", err);
      setErrorMessage("Errore durante l'applicazione dei tag. Riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick action: Clear/Strip previous seasonal tags without adding a new tag
  const handleStripAllTagsOnly = async () => {
    if (selectedIds.length === 0) {
      setErrorMessage("Seleziona almeno un profilo dall'elenco da pulire.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onBatchRename({
        profileIds: selectedIds,
        tag: "",
        format: "bracket",
        stripPrevious: true,
      });
      onClose();
    } catch (err) {
      console.error("Error clearing tags:", err);
      setErrorMessage("Errore durante la pulizia dei tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-rename-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-150 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Tag size={18} />
            </div>
            <div>
              <h3 id="batch-rename-title" className="text-sm font-bold tracking-wide uppercase flex items-center gap-2">
                <span>Rinomina Profili per Stagione & Tag</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono border border-indigo-400/30">
                  Database Locale
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Organizza e archivia i modelli aggiungendo in blocco un prefisso di stagione (es. SS25, FW25, Cruise) o data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 no-scrollbar-y">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {/* Section 1: Presets Stagionali */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              1. Scegli una Stagione Moda o Data Rapida
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SEASON_PRESETS.map((item) => {
                const isActive = tag.toUpperCase() === item.tag.toUpperCase();
                return (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setTag(item.tag)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                    title={item.desc}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[9px] opacity-75 font-normal ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                      ({item.desc.split(" ")[0]})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Input Tag Personalizzato & Stile Prefisso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Tag or Date Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Tag o Data da Applicare:</span>
                <span className="text-[10px] text-slate-400 font-normal">es. SS26, FW26, CASTING</span>
              </label>
              <div className="relative">
                <Tag size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="es. SS26 o 2026-09"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Prefix Format Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Formato del Prefisso:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormat("bracket")}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    format === "bracket"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  [{tag || "TAG"}] NOME
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("hyphen")}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    format === "hyphen"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag || "TAG"} - NOME
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("underscore")}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    format === "underscore"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag || "TAG"}_NOME
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("space")}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                    format === "space"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tag || "TAG"} NOME
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Opzione Pulizia Intelligente */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stripPrevious}
                onChange={(e) => setStripPrevious(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer accent-indigo-600"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Pulisci e sostituisci prefissi stagionali o date precedenti
                </span>
                <span className="text-[10px] text-slate-500">
                  Rimuove tag precedenti (es. [SS25] o [FW25]) evitando accumuli multipli.
                </span>
              </div>
            </label>

            <button
              type="button"
              onClick={handleStripAllTagsOnly}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer shrink-0 self-start sm:self-auto py-1 px-2 rounded-md hover:bg-indigo-100/60 transition"
              title="Rimuovi tutti i prefissi stagionali dai profili selezionati e ripristina i nomi originali"
            >
              <Eraser size={12} />
              Rimuovi solo prefissi (Pulisci)
            </button>
          </div>

          {/* Section 4: Selezione & Anteprima Live dei Modelli */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-indigo-600" />
                  2. Seleziona i Modelli da Rinominare ({selectedIds.length}/{localProfiles.length})
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Seleziona Visibili
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllVisible}
                  className="font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Deseleziona
                </button>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    categoryFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tutti ({localProfiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("woman")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    categoryFilter === "woman" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Donne
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("man")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    categoryFilter === "man" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Uomini
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("child")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    categoryFilter === "child" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bambini
                </button>
              </div>

              <div className="relative flex-1">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filtra per nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Checklist with Live Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto no-scrollbar-y bg-slate-50/50">
              {visibleProfiles.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Nessun profilo trovato con i filtri correnti.
                </div>
              ) : (
                <div className="divide-y divide-slate-150">
                  {visibleProfiles.map((p) => {
                    const isChecked = selectedIds.includes(p.id);
                    const newNamePreview = computeNewName(p.name);
                    const hasChanged = newNamePreview !== p.name;

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleSelectProfile(p.id)}
                        className={`flex items-center gap-3 px-3 py-2 text-xs transition-colors cursor-pointer ${
                          isChecked ? "bg-indigo-50/60 hover:bg-indigo-50" : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container onClick
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer accent-indigo-600 shrink-0"
                        />

                        {/* Model thumbnail or placeholder */}
                        <div className="w-8 h-8 rounded-md bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 flex items-center justify-center">
                          {p.imageLeft || p.imageCenter ? (
                            <img
                              src={p.imageLeft || p.imageCenter}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono font-bold">
                              {p.name?.charAt(0) || "M"}
                            </span>
                          )}
                        </div>

                        {/* Current Name vs New Name Preview */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3 items-center">
                          <div className="truncate">
                            <span className="text-slate-500 font-medium truncate block text-[11px]">
                              {p.name || "Senza Nome"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              v{p.version || 1} • {p.gender || "model woman"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 truncate">
                            <ArrowRight size={11} className="text-slate-400 shrink-0 hidden sm:block" />
                            <span className={`text-[11px] font-bold truncate ${
                              isChecked 
                                ? (hasChanged ? "text-indigo-700 font-bold" : "text-slate-700") 
                                : "text-slate-400 line-through"
                            }`}>
                              {newNamePreview}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {isChecked ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Selezionato
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                              Escluso
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50">
          <div className="text-[11px] text-slate-500">
            {selectedIds.length === 0 ? (
              <span className="text-amber-600 font-medium">Seleziona almeno un profilo per procedere.</span>
            ) : (
              <span>
                Verranno rinominati <strong className="text-slate-800">{selectedIds.length}</strong> profili su {localProfiles.length} con prefisso <strong className="text-indigo-700">[{tag.trim().toUpperCase() || "TAG"}]</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSubmitting || selectedIds.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Salvataggio nel Cloud...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Conferma e Rinomina ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
