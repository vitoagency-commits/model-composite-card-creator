import React, { useState, useEffect, useRef } from "react";
import { ModelData, AgencyInfo } from "../types";
import { 
  X, 
  Share2, 
  Send, 
  Mail, 
  Check, 
  Smartphone, 
  Sparkles, 
  FileText, 
  Download,
  BookOpen,
  Laptop,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  Copy,
  AlertCircle,
  Phone
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelData;
  agency: AgencyInfo;
  bookModelCount: number;
  onGenerateCardPdfBlob: () => Promise<{ blob: Blob; fileName: string } | null>;
  onGenerateBookPdfBlob: () => Promise<{ blob: Blob; fileName: string } | null>;
  showNotification: (msg: string, type?: "success" | "info" | "error") => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  model,
  agency,
  bookModelCount,
  onGenerateCardPdfBlob,
  onGenerateBookPdfBlob,
  showNotification,
}) => {
  const [shareTarget, setShareTarget] = useState<"card" | "book">("card");
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyFile, setReadyFile] = useState<{ file: File; url: string; fileName: string } | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
    }
  }, []);

  // Reset ready file when target changes
  useEffect(() => {
    setReadyFile(null);
  }, [shareTarget, model.id]);

  if (!isOpen) return null;

  const modelName = model.name ? model.name.trim().toUpperCase() : "MODELLO";

  // Pre-generate PDF so that subsequent clicks are IMMEDIATE synchronous user gestures
  const generatePdfNow = async (): Promise<{ file: File; url: string; fileName: string } | null> => {
    if (readyFile) return readyFile;
    setIsGenerating(true);
    showNotification("Generazione e ottimizzazione del documento PDF in corso...", "info");

    try {
      const result = shareTarget === "card" 
        ? await onGenerateCardPdfBlob() 
        : await onGenerateBookPdfBlob();

      if (!result) {
        showNotification("Impossibile generare il PDF. Riprova.", "error");
        setIsGenerating(false);
        return null;
      }

      const { blob, fileName } = result;
      const file = new File([blob], fileName, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const ready = { file, url, fileName };
      setReadyFile(ready);
      return ready;
    } catch (e) {
      console.error("PDF generation failed:", e);
      showNotification("Errore durante la creazione del PDF.", "error");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Immediate Native Share (Apple AirDrop, WhatsApp file, Mail file)
  const handleNativeShare = async () => {
    let current = readyFile;
    if (!current) {
      current = await generatePdfNow();
      if (!current) return;
    }

    const { file, fileName, url } = current;

    // Check if browser allows sharing files natively
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Scheda Modello PDF: ${fileName} - ${agency.name || "Cosmopolitan Agency"}`,
        });
        showNotification("File inviato con successo!", "success");
        onClose();
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return; // User closed sheet
        console.warn("Native share error, falling back to download:", err);
      }
    }

    // Direct download fallback if native share is blocked (e.g. desktop browser or iframe)
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`File PDF (${fileName}) scaricato sul tuo dispositivo!`, "success");
  };

  // Direct WhatsApp Connection
  const handleWhatsAppShare = async () => {
    let current = readyFile;
    if (!current) {
      current = await generatePdfNow();
    }

    // Always trigger download of the PDF so the user has the file ready to attach
    if (current) {
      const a = document.createElement("a");
      a.href = current.url;
      a.download = current.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Prepare message text
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
    const msg = [
      `*${agency.name || "COSMOPOLITAN AGENZIA"}*`,
      shareTarget === "card" 
        ? `Ecco la Scheda Composit di *${modelName}*:`
        : `Ecco il *Book Catalogo Modelli* (${bookModelCount} modelli):`,
      model.height ? `• Altezza: ${model.height} cm` : "",
      model.bust ? `• Misure: ${model.bust}-${model.waist || ""}-${model.hips || ""}` : "",
      model.shoes ? `• Scarpe: ${model.shoes}` : "",
      model.eyes ? `• Occhi: ${model.eyes} | Capelli: ${model.hair || ""}` : "",
      agency.phone ? `Contatto: ${agency.phone}` : "",
      `\n📎 *Ho allegato il file PDF (${current?.fileName || "scheda.pdf"}) ad alta risoluzione.*`
    ].filter(Boolean).join("\n");

    const encodedText = encodeURIComponent(msg);
    let waUrl = "";

    // If phone number provided, open direct conversation
    if (cleanPhone.length >= 6) {
      const fullPhone = cleanPhone.startsWith("39") ? cleanPhone : cleanPhone.length === 10 ? `39${cleanPhone}` : cleanPhone;
      waUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
    } else {
      waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    // Open WhatsApp
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    showNotification("WhatsApp aperto e PDF scaricato! Invia il messaggio e allega il file PDF.", "success");
  };

  // Direct Email Connection
  const handleEmailShare = async () => {
    let current = readyFile;
    if (!current) {
      current = await generatePdfNow();
    }

    // Always trigger download of the PDF so the user has the file ready to attach
    if (current) {
      const a = document.createElement("a");
      a.href = current.url;
      a.download = current.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    const subject = encodeURIComponent(
      shareTarget === "card" 
        ? `Scheda Composit: ${modelName} - ${agency.name || "Cosmopolitan Agency"}`
        : `Book Catalogo Completo (${bookModelCount} Modelli) - ${agency.name || "Cosmopolitan Agency"}`
    );

    const bodyText = [
      `Gentile cliente,`,
      ``,
      shareTarget === "card" 
        ? `in allegato le trasmettiamo la scheda tecnica Composit aggiornata di ${modelName}.`
        : `in allegato le trasmettiamo il Book Catalogo completo dell'agenzia (${bookModelCount} modelli).`,
      ``,
      `Dati & Misure del Modello:`,
      model.height ? `- Altezza: ${model.height} cm` : "",
      model.bust ? `- Busto/Seno: ${model.bust}` : "",
      model.waist ? `- Vita: ${model.waist}` : "",
      model.hips ? `- Fianchi: ${model.hips}` : "",
      model.shoes ? `- Scarpe: ${model.shoes}` : "",
      model.eyes ? `- Occhi: ${model.eyes} | Capelli: ${model.hair}` : "",
      ``,
      `Restiamo a completa disposizione per casting, opzioni e disponibilità date.`,
      ``,
      `Cordiali saluti,`,
      `${agency.name || "Cosmopolitan Agency"}`,
      `${agency.phone || ""}`,
      `${agency.email || ""}`,
      `${agency.web || ""}`
    ].filter(line => line !== undefined).join("\n");

    const mailtoUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

    // Trigger mail client
    window.location.href = mailtoUrl;
    showNotification("Client E-mail aperto e PDF scaricato! Trascina o allega il file PDF.", "success");
  };

  // Copy structured text summary to clipboard
  const handleCopySummary = () => {
    const summary = [
      `*${agency.name || "COSMOPOLITAN AGENZIA"}*`,
      `Scheda Modella: ${modelName}`,
      model.height ? `Altezza: ${model.height} cm` : "",
      model.bust ? `Misure: ${model.bust}-${model.waist || ""}-${model.hips || ""}` : "",
      model.shoes ? `Scarpe: ${model.shoes}` : "",
      model.eyes ? `Occhi: ${model.eyes} | Capelli: ${model.hair || ""}` : "",
      agency.phone ? `Tel: ${agency.phone}` : "",
      agency.web ? `Web: ${agency.web}` : ""
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(summary).then(() => {
      setCopiedSummary(true);
      showNotification("Dati modella copiati negli appunti!", "success");
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col text-left my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase text-white">
                Invia Documento PDF
              </h3>
              <p className="text-[11px] text-slate-300">
                Collegamento Diretto con <strong>WhatsApp</strong>, <strong>E-mail</strong> e <strong>AirDrop</strong>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* Iframe Warning Notice (Important for preview users) */}
          {isIframe && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-[11px] text-amber-900 flex items-start gap-2.5 shadow-2xs">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">⚠️ Anteprima Protetta Rilevata</span>
                <p className="text-amber-800 leading-relaxed text-[10.5px]">
                  All'interno dell'anteprima integrata, i browser possono bloccare l'apertura automatica di WhatsApp e Mail per sicurezza.
                  Apri l'app a schermo intero per sbloccare tutti i collegamenti diretti:
                </p>
                <a
                  href={typeof window !== "undefined" ? window.location.href : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[10.5px] transition-all shadow-3xs"
                >
                  <ExternalLink size={12} />
                  <span>Apri a Schermo Intero in Nuova Scheda</span>
                </a>
              </div>
            </div>
          )}

          {/* 1. SELEZIONE DOCUMENTO (Scheda Singola vs Book Catalogo) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Scegli cosa vuoi inviare:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShareTarget("card")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  shareTarget === "card"
                    ? "bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${shareTarget === "card" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                    <FileText size={16} />
                  </div>
                  {shareTarget === "card" && <CheckCircle2 size={16} className="text-indigo-600" />}
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black text-slate-900 block truncate">
                    Scheda Composit Singola
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {modelName} (PDF A4)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShareTarget("book")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  shareTarget === "book"
                    ? "bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${shareTarget === "book" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
                    <BookOpen size={16} />
                  </div>
                  {shareTarget === "book" && <CheckCircle2 size={16} className="text-indigo-600" />}
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-black text-slate-900 block truncate">
                    Book Catalogo Completo
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    PDF {bookModelCount} {bookModelCount === 1 ? "modello" : "modelli"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. CANALE DIRETTO: WHATSAPP */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send size={15} />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 uppercase block">
                    Invia con WhatsApp
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Apre la chat con testo formattato e scarica il file PDF da allegare
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Phone Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Phone size={10} />
                Numero WhatsApp Destinatario (Opzionale):
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Es. 3401234567 oppure +39..."
                className="w-full text-xs font-bold text-slate-800 bg-white border border-emerald-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <span className="text-[9.5px] text-emerald-700 block">
                Se lasci vuoto, WhatsApp ti chiederà a quale contatto o gruppo vuoi inviarlo.
              </span>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleWhatsAppShare}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send size={14} />
              <span>
                {isGenerating 
                  ? "Creazione PDF in corso..." 
                  : phoneNumber 
                    ? `Apri Chat WhatsApp con ${phoneNumber}` 
                    : "Apri WhatsApp e Invia PDF"}
              </span>
            </button>
          </div>

          {/* 3. CANALE DIRETTO: E-MAIL */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 text-left shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Mail size={15} />
              </div>
              <div>
                <span className="text-xs font-black text-sky-950 uppercase block">
                  Invia via E-mail
                </span>
                <span className="text-[10px] text-sky-700">
                  Compila oggetto, testo con misure e scarica il PDF da allegare
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleEmailShare}
              className="w-full bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail size={14} />
              <span>
                {isGenerating ? "Creazione PDF in corso..." : "Apri la tua E-mail e Invia PDF"}
              </span>
            </button>
          </div>

          {/* 4. APPLE AIRDROP & NATIVE OS SHARE SHEET (iOS / iPadOS / macOS) */}
          <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 text-left shadow-2xs space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                  Condivisione di Sistema Apple / AirDrop
                </span>
              </div>
              <p className="text-[10.5px] text-indigo-900/80 leading-relaxed">
                Su iPhone, iPad e Mac apre il menu di sistema iOS per passare il file PDF al volo tramite <strong>AirDrop</strong>, <strong>Messaggi</strong> o salvare nei <strong>File</strong>.
              </p>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleNativeShare}
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={14} />
              <span>
                {isGenerating ? "Creazione PDF..." : "Apri Menu di Sistema / AirDrop"}
              </span>
            </button>

            <div className="flex items-center justify-center gap-3 text-[10px] text-indigo-800/80 font-semibold">
              <span className="flex items-center gap-1"><Laptop size={11} /> AirDrop Mac</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Smartphone size={11} /> iPhone / iPad</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Download size={11} /> Download Diretto</span>
            </div>
          </div>

          {/* 5. COPIA TESTO & MISURE NEGLI APPUNTI */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                Copia Misure e Dati Modella
              </span>
              <span className="text-[10px] text-slate-500 block">
                Copia il testo formattato da incollare in qualsiasi chat
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer"
            >
              {copiedSummary ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedSummary ? "Copiato!" : "Copia Testo"}</span>
            </button>
          </div>

          {/* Spiegazione tecnica trasparente */}
          <div className="rounded-xl p-3 bg-slate-100/70 border border-slate-200 text-[10px] text-slate-600 space-y-1">
            <span className="font-bold flex items-center gap-1 text-slate-700">
              <Paperclip size={11} className="text-indigo-600" />
              Come funziona l'invio su WhatsApp & E-mail:
            </span>
            <p className="leading-relaxed">
              I protocolli di sicurezza web dei browser non consentono ad alcuna pagina web di iniettare automaticamente un file binario all'interno del computer o dello smartphone senza il tuo consenso. Per questo motivo, cliccando su WhatsApp o E-mail, il software <strong>apre direttamente l'applicazione con il messaggio precompilato</strong> e contemporaneamente <strong>ti prepara il file PDF</strong> pronto per essere inviato o trascinato nella chat.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-150 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>{agency.name || "Cosmopolitan Agency"} • Studio Model Management</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition cursor-pointer shadow-3xs"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
