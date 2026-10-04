import React, { useState, useRef } from "react";
import { ModelData } from "../types";
import { 
  X, 
  Upload, 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Check, 
  Sparkles, 
  Image as ImageIcon,
  Layers,
  ArrowDownUp,
  RotateCcw
} from "lucide-react";

export interface StagedPhoto {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  width?: number;
  height?: number;
  orientation: "portrait" | "landscape" | "square";
  targetSlot: string; // e.g. "Left", "Center", "Right", "4", "5", etc.
}

interface MultiPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelData;
  activeSlots: Array<{
    slot: string;
    label: string;
    currentImage?: string;
  }>;
  onApplyPhotos: (assignments: Record<string, string>) => void;
  showNotification: (msg: string, type?: "success" | "info" | "error") => void;
}

export const MultiPhotoUploadModal: React.FC<MultiPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  model,
  activeSlots,
  onApplyPhotos,
  showNotification,
}) => {
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to compress and convert file to base64
  const compressImage = (file: File): Promise<{ base64: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > maxWidth) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            }
          } else {
            if (h > maxHeight) {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            resolve({ base64: compressed, width: img.width, height: img.height });
          } else {
            resolve({ base64: raw, width: img.width, height: img.height });
          }
        };
        img.onerror = () => resolve({ base64: raw, width: 800, height: 1200 });
        img.src = raw;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedPhoto[] = [];

    // Determine currently assigned slots in staging
    const alreadyAssignedSlots = new Set(stagedPhotos.map((p) => p.targetSlot));
    const availableSlots = activeSlots.map((s) => s.slot);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { base64, width, height } = await compressImage(file);
        const orientation: "portrait" | "landscape" | "square" = 
          width === height ? "square" : width < height ? "portrait" : "landscape";

        // Assign to first available unassigned slot or unassigned
        let assignedSlot = availableSlots.find((s) => !alreadyAssignedSlots.has(s)) || "";
        if (assignedSlot) {
          alreadyAssignedSlots.add(assignedSlot);
        }

        newStaged.push({
          id: `staged_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          file,
          previewUrl: base64,
          name: file.name,
          width,
          height,
          orientation,
          targetSlot: assignedSlot || (availableSlots[0] || "Left"),
        });
      } catch (err) {
        console.error("Error processing file", file.name, err);
      }
    }

    setStagedPhotos((prev) => [...prev, ...newStaged]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Move photo left/right in staging order
  const movePhoto = (index: number, direction: "prev" | "next") => {
    const newIdx = direction === "prev" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= stagedPhotos.length) return;

    const updated = [...stagedPhotos];
    // Swap positions
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    // Also swap their assigned target slots to maintain physical position
    const tempSlot = updated[index].targetSlot;
    updated[index].targetSlot = updated[newIdx].targetSlot;
    updated[newIdx].targetSlot = tempSlot;

    setStagedPhotos(updated);
  };

  // Change slot for a specific staged photo
  const changeTargetSlot = (photoId: string, newSlot: string) => {
    setStagedPhotos((prev) => {
      // If another photo already has this slot, swap them!
      const currentPhoto = prev.find((p) => p.id === photoId);
      if (!currentPhoto) return prev;
      const oldSlot = currentPhoto.targetSlot;

      return prev.map((p) => {
        if (p.id === photoId) {
          return { ...p, targetSlot: newSlot };
        }
        if (p.targetSlot === newSlot) {
          // Swap with the displaced photo
          return { ...p, targetSlot: oldSlot };
        }
        return p;
      });
    });
  };

  // Remove a photo from staging
  const removeStagedPhoto = (id: string) => {
    setStagedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Clear all staged photos
  const handleClearAll = () => {
    setStagedPhotos([]);
  };

  // Apply to model only at user's explicit discretion
  const handleApply = () => {
    if (stagedPhotos.length === 0) {
      showNotification("Seleziona almeno una foto prima di applicare.", "info");
      return;
    }

    const assignments: Record<string, string> = {};
    stagedPhotos.forEach((p) => {
      if (p.targetSlot && p.previewUrl) {
        assignments[p.targetSlot] = p.previewUrl;
      }
    });

    onApplyPhotos(assignments);
    showNotification(`${stagedPhotos.length} foto assegnate con successo ai box del Composit!`, "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Regia Multi-Foto a 360°
              </h2>
              <p className="text-[11px] text-slate-300">
                Carica più foto insieme, decidi tu dove collocarle e spostale a piacimento prima di applicarle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Chiudi"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* File Picker Drop Area */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFilesSelected}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mb-3">
                <Upload size={22} />
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                Clicca per selezionare più foto dal tuo dispositivo
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                Supporta rullino foto Apple, JPG, PNG e WEBP. Puoi scegliere 2, 3, 4 o più foto in blocco.
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-white border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-xl shadow-3xs">
                Scegli File Multipli
              </span>
            </div>
          </div>

          {/* Staging Area (Photos loaded and ready to be organized) */}
          {stagedPhotos.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Foto Selezionate ({stagedPhotos.length})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                    Regia Manuale
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Svuota selezione</span>
                </button>
              </div>

              {/* Photo Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {stagedPhotos.map((photo, index) => {
                  const assignedSlotObj = activeSlots.find((s) => s.slot === photo.targetSlot);

                  return (
                    <div 
                      key={photo.id}
                      className="border border-slate-200 rounded-2xl p-3 bg-white shadow-2xs space-y-3 relative group"
                    >
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
                        <img 
                          src={photo.previewUrl} 
                          alt={photo.name} 
                          className="w-full h-full object-cover" 
                        />
                        
                        {/* Orientation Badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                          {photo.orientation === "portrait" ? "Verticale (3:4)" : photo.orientation === "landscape" ? "Orizzontale" : "Quadrata"}
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeStagedPhoto(photo.id)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Rimuovi da questa selezione"
                        >
                          <X size={12} />
                        </button>

                        {/* Order shifter buttons */}
                        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePhoto(index, "prev")}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Sposta a sinistra"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-md">
                            #{index + 1}
                          </span>
                          <button
                            type="button"
                            disabled={index === stagedPhotos.length - 1}
                            onClick={() => movePhoto(index, "next")}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-black text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Sposta a destra"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Manual Slot Assignment Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Assegna al Box del Composit:
                        </label>
                        <select
                          value={photo.targetSlot}
                          onChange={(e) => changeTargetSlot(photo.id, e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all cursor-pointer"
                        >
                          {activeSlots.map((s) => (
                            <option key={s.slot} value={s.slot}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-200/60 flex items-center justify-center text-slate-500">
                <Layers size={18} />
              </div>
              <p className="text-xs font-bold text-slate-700">Nessuna foto ancora in regia</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Clicca sull'area sopra per caricare le foto dal tuo dispositivo. Potrai assegnarle liberamente ai box del modello.
              </p>
            </div>
          )}

          {/* Current Slots Overview Guide */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-[11px] text-amber-950 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-900">
              💡 Controllo Totale a 360° (Nessuna Assegnazione Forzata):
            </span>
            <p className="text-amber-800 leading-relaxed">
              Le foto verranno applicate alla modella <strong>soltanto quando cliccherai su "Applica Assegnazioni al Composit"</strong>. 
              Puoi cambiare liberamente il box di destinazione di ogni foto tramite il menu a tendina o le frecce di spostamento.
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Annulla (Nessuna Modifica)
          </button>

          <button
            type="button"
            disabled={stagedPhotos.length === 0 || isProcessing}
            onClick={handleApply}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check size={14} />
            <span>Applica Assegnazioni al Composit ({stagedPhotos.length} foto)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
