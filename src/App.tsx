import { useState, useEffect, useRef } from "react";
import { ModelData, AgencyInfo } from "./types";
import { SAMPLE_MODELS, DEFAULT_AGENCY } from "./sampleData";
import { ModelCard } from "./components/ModelCard";
import { ModelForm } from "./components/ModelForm";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot
} from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "./firebase";
import { 
  Download, 
  Printer, 
  Eye, 
  EyeOff,
  Plus, 
  FolderHeart,
  Grid,
  Info,
  Layers,
  ChevronRight,
  Sparkles,
  Smartphone,
  Tablet,
  Laptop,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  X,
  FileUp,
  Instagram,
  ExternalLink
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Vector SVG definitions for high-definition social symbols
const SVG_INSTAGRAM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="url(#igGrad)" /><defs><linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f9ce34" /><stop offset="50%" stop-color="#ee2a7b" /><stop offset="100%" stop-color="#6228d7" /></linearGradient></defs><g transform="translate(10, 10)"><rect x="1" y="1" width="18" height="18" rx="5" ry="5" stroke="white" stroke-width="1.8" fill="none" /><circle cx="10" cy="10" r="3.5" stroke="white" stroke-width="1.8" fill="none" /><circle cx="14.5" cy="5.5" r="1" fill="white" /></g></svg>`;

const SVG_WHATSAPP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#25D366" /><g transform="translate(10, 10) scale(0.83)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="white" /></g></svg>`;

const SVG_FACEBOOK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#1877F2" /><path d="M24 20h-3v8h-3v-8h-2v-3h2v-2c0-2 1-3.5 3.5-3.5H24v3h-1.5c-1 0-1 .5-1 1v1.5H24l-.5 3z" fill="white" /></svg>`;

const SVG_THREADS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="black" /><g transform="translate(10, 10) scale(0.83)"><path d="M12.2 2C6.55 2 2 6.55 2 12.2s4.55 10.2 10.2 10.2c2.6 0 4.9-.96 6.7-2.55l-1.35-1.4c-1.4 1.25-3.2 2-5.35 2-5.65 0-9.2-3.55-9.2-8.2s3.55-8.2 8.2-8.2c4.4 0 7.85 3.15 8.15 7.55c.15 2.2-.6 3.65-1.9 4.1c-.8.25-1.65-.05-2.05-.75c-.95.9-2.1 1.25-3.3 1.1c-1.85-.25-3.15-1.75-3.1-3.65c.05-1.9 1.55-3.35 3.4-3.4c1 .05 1.9.45 2.55 1.15V11c0-1.85 1.15-3.1 2.9-3.05c1.45.05 2.3.9 2.5 2.35c.4 4.55-2.6 8.5-7.75 8.5c-3.1 0-5.65-2.35-5.95-5.35h-1.9c.3 3.95 3.65 7.15 7.85 7.15c6.2 0 10.2-4.95 9.4-11.2C22.25 5 17.85 2 12.2 2zm-1.75 12.35c1-.1 1.7-.8 1.85-1.7c.15-.9-.45-1.7-1.4-1.8c-.95-.1-1.85.5-2 1.4c-.15.95.55 1.95 1.55 2.1z" fill="white" /></g></svg>`;

const SVG_PINTEREST = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#BD081C" /><g transform="translate(10, 10) scale(0.83)"><path d="M12 2C6.478 2 2 6.478 2 12c0 4.17 2.555 7.73 6.195 9.176-.046-.777-.087-1.977.018-2.83.095-.77 1.61-6.83 1.61-6.83s-.413-.827-.413-2.046c0-1.92 1.11-3.35 2.494-3.35 1.176 0 1.744.883 1.744 1.94 0 1.18-.752 2.95-1.14 4.59-.326 1.374.693 2.495 2.048 2.495 2.46 0 4.127-3.13 4.127-6.86 0-2.822-1.895-4.94-5.385-4.94-3.95 0-6.425 2.936-6.425 6.243 0 1.14.334 1.956.86 2.576.24.283.273.396.186.72-.06.23-.2.83-.26 1.056-.086.33-.356.446-.653.323-1.82-.756-2.67-2.776-2.67-5.023 0-3.73 3.16-8.212 9.35-8.212 5.013 0 8.312 3.626 8.312 7.514 0 5.166-2.863 9.014-7.07 9.014-1.42 0-2.756-.764-3.21-1.636 0 0-.763 3.037-.925 3.654-.277 1.05-.83 2.094-1.346 2.906 1.037.3 2.13.463 3.264.463 5.522 0 10-4.477 10-10S17.522 2 12 2z" fill="white" /></g></svg>`;

const caricaIconaSvg = (svgMarkup: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgMarkup)));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(0, 0, 0, 0)";
          ctx.clearRect(0, 0, 80, 80);
          ctx.drawImage(img, 0, 0, 80, 80);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve("");
        }
      };
      img.onerror = () => resolve("");
    } catch {
      resolve("");
    }
  });
};

export const disegnaModellaSuPDF = async (
  pdf: jsPDF,
  datiModella: any,
  indexPagina: number,
  totalPagine: number,
  socialScelti: { url: string; base64: string }[],
  agency: any
) => {
  const hasExternalData = datiModella && typeof datiModella === "object";
  const resolvedDati = hasExternalData ? datiModella : null;

  const nomeModella = (resolvedDati?.nome || resolvedDati?.name || "MARIA V.").toUpperCase();
  const layout = resolvedDati?.layout || "classic";

  const foto1 = resolvedDati?.foto1 || resolvedDati?.imageLeft || "";
  const foto2 = resolvedDati?.foto2 || resolvedDati?.imageCenter || "";
  const foto3 = resolvedDati?.foto3 || resolvedDati?.imageRight || "";
  const foto4 = resolvedDati?.foto4 || resolvedDati?.image4 || "";
  const foto5 = resolvedDati?.foto5 || resolvedDati?.image5 || "";
  const foto6 = resolvedDati?.foto6 || resolvedDati?.image6 || "";

  const altezza = resolvedDati?.altezza || resolvedDati?.height || "—";
  const seno = resolvedDati?.seno || resolvedDati?.bust || "—";
  const vita = resolvedDati?.vita || resolvedDati?.waist || "—";
  const fianchi = resolvedDati?.fianchi || resolvedDati?.hips || "—";
  const scarpe = resolvedDati?.scarpe || resolvedDati?.shoes || "—";
  const occhi = resolvedDati?.occhi || resolvedDati?.eyes || "—";
  const capelli = resolvedDati?.capelli || resolvedDati?.hair || "—";

  const upperSize = resolvedDati?.sizeUpper ? `${resolvedDati.sizeUpper}` : "—";
  const lowerSize = resolvedDati?.sizeLower ? `${resolvedDati.sizeLower}` : "—";
  const tagliaDefault = upperSize !== "—" && lowerSize !== "—" ? `${upperSize} / ${lowerSize}` : "—";
  const taglia = resolvedDati?.taglia || tagliaDefault;

  const formatCm = (val: any) => {
    if (val === undefined || val === null || val === "—") return "—";
    const sVal = String(val).trim();
    if (!sVal) return "—";
    return sVal.includes("cm") ? sVal : `${sVal} cm`;
  };

  const resolvedAltezza = formatCm(altezza);
  const resolvedSeno = formatCm(seno);
  const resolvedVita = formatCm(vita);
  const resolvedFianchi = formatCm(fianchi);
  const resolvedScarpe = String(scarpe || "—");
  const resolvedOcchi = String(occhi || "—");
  const resolvedCapelli = String(capelli || "—");
  const resolvedTaglia = String(taglia || "—");

  const elaboraImmagineCover = (url: string, targetWidth: number, targetHeight: number): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!url) { resolve(null); return; }
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth * 4;  // High Definition
        canvas.height = targetHeight * 4;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(null); return; }

        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sx, sy, sw, sh;

        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => resolve(null);
      img.src = url;
      setTimeout(() => resolve(null), 3000);
    });
  };

  const getDimensioniSlot = (slotName: string): { w: number, h: number } => {
    const l = layout || "classic";
    if (l === "classic") {
      return { w: 84, h: 114 };
    }
    if (l === "duo") {
      return { w: 129, h: 114 };
    }
    if (l === "asymmetric-left") {
      if (slotName === "Left") return { w: 131, h: 114 };
      return { w: 131, h: 54.5 };
    }
    if (l === "solo") {
      return { w: 160, h: 114 };
    }
    if (l === "grid-4") {
      return { w: 131, h: 54.5 };
    }
    if (l === "grid-6") {
      return { w: 84, h: 54.5 };
    }
    if (l === "editorial-6") {
      if (slotName === "Left") return { w: 74, h: 125 };
      if (slotName === "Center") return { w: 56, h: 125 };
      return { w: 38, h: 55.5 };
    }
    return { w: 84, h: 114 };
  };

  const promsElaborate = [
    elaboraImmagineCover(foto1, getDimensioniSlot("Left").w, getDimensioniSlot("Left").h),
    elaboraImmagineCover(foto2, getDimensioniSlot("Center").w, getDimensioniSlot("Center").h),
    elaboraImmagineCover(foto3, getDimensioniSlot("Right").w, getDimensioniSlot("Right").h),
    elaboraImmagineCover(foto4, getDimensioniSlot("image4").w, getDimensioniSlot("image4").h),
    elaboraImmagineCover(foto5, getDimensioniSlot("image5").w, getDimensioniSlot("image5").h),
    elaboraImmagineCover(foto6, getDimensioniSlot("image6").w, getDimensioniSlot("image6").h),
  ];

  const immaginiElaborate = await Promise.all(promsElaborate);

  // Agency Header Big
  pdf.setTextColor(3, 7, 18);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.text("COSMOPOLITAN", 15, 18);
  
  pdf.setTextColor(190, 24, 74); // Bordeaux
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text("moda e v e n t i p u b b l i c i t à c o m u n i c a z i o n e", 15, 22);

  // Model Name Right
  pdf.setTextColor(3, 7, 18);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(28);
  pdf.text(nomeModella, 282, 18, { align: "right" });

  pdf.setTextColor(75, 85, 99);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  const cardTitle = resolvedDati?.title || "PORTRAIT / THREE-QUARTERS / FULL BODY MODELS";
  pdf.text(cardTitle.toUpperCase(), 15, 29);
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  const agencyName = agency?.name || "COSMOPOLITAN AGENCY";
  const agencyPhone = agency?.phone || "333.59.64.357";
  const agencyAddress = agency?.address || "VIA DELLA REPUBBLICA N°61";
  const agencyCity = agency?.city || "BISCEGLIE (BT) 76011";
  const agencyEmail = agency?.email || "info@cosmopolitanagency.it";
  const agencyWeb = agency?.web || "www.cosmopolitanagency.it";
  const portfolioDate = agency?.portfolioDate || "2026/27";

  pdf.text(`${agencyName.toUpperCase()} • MODELLI ITALIA • TEL. ${agencyPhone}`, 15, 33);
  pdf.text(`${agencyAddress.toUpperCase()} • ${agencyCity.toUpperCase()}`, 15, 37);
  
  pdf.setTextColor(29, 78, 216); // Blu elegante
  pdf.text(`${agencyEmail} • ${agencyWeb}`, 15, 41);

  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(`MODEL PORTFOLIO INDEX • ${portfolioDate}`, 282, 24, { align: "right" });

  // Social icons click links
  if (socialScelti.length > 0) {
    const sizeIcona = 4.2;
    const spaziaturaIcona = 1.8;
    const larghezzaTotale = (socialScelti.length * sizeIcona) + ((socialScelti.length - 1) * spaziaturaIcona);
    let xCorrente = 282 - larghezzaTotale;
    const yIcone = 27;

    for (const social of socialScelti) {
      pdf.addImage(social.base64, "PNG", xCorrente, yIcone, sizeIcona, sizeIcona);
      pdf.link(xCorrente, yIcone, sizeIcona, sizeIcona, { url: social.url });
      xCorrente += sizeIcona + spaziaturaIcona;
    }
  }

  // Thin split line
  pdf.setDrawColor(3, 7, 18);
  pdf.setLineWidth(0.4);
  pdf.line(15, 45, 282, 45);

  const drawImageWithPlaceholder = (imgData: string | null, x: number, y: number, w: number, h: number, defaultTerm: string) => {
    pdf.setDrawColor(229, 231, 235);
    pdf.setFillColor(243, 244, 246);
    pdf.rect(x, y, w, h, "F");

    if (imgData) {
      pdf.addImage(imgData, "JPEG", x, y, w, h);
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(defaultTerm, x + (w / 2), y + (h / 2), { align: "center" });
    }
  };

  const drawLabel = (label: string, x: number, y: number, w: number) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    pdf.text(label, x + (w / 2), y, { align: "center" });
  };

  const yFoto = 50;

  if (layout === "classic") {
    const w = 84;
    const h = 114;
    const gap = 5;
    const xs = [15, 15 + w + gap, 15 + (w * 2) + (gap * 2)];
    const etichette = ["PORTRAIT / PROFILE", "THREE-QUARTERS", "FULL BODY"];
    const images = [immaginiElaborate[0], immaginiElaborate[1], immaginiElaborate[2]];

    for (let i = 0; i < 3; i++) {
      drawImageWithPlaceholder(images[i], xs[i], yFoto, w, h, "Foto non disponibile");
      drawLabel(etichette[i], xs[i], yFoto + h + 5, w);
    }

  } else if (layout === "duo") {
    const w = 129;
    const h = 114;
    const gap = 9;
    const xs = [15, 15 + w + gap];
    const etichette = ["PORTRAIT / MAIN", "THREE-QUARTERS / ALTERNATIVE"];
    const images = [immaginiElaborate[0], immaginiElaborate[1]];

    for (let i = 0; i < 2; i++) {
      drawImageWithPlaceholder(images[i], xs[i], yFoto, w, h, "Foto non disponibile");
      drawLabel(etichette[i], xs[i], yFoto + h + 5, w);
    }

  } else if (layout === "asymmetric-left") {
    const wLeft = 131;
    const hLeft = 114;
    drawImageWithPlaceholder(immaginiElaborate[0], 15, yFoto, wLeft, hLeft, "Foto Copertina");
    drawLabel("EDITORIAL COVER", 15, yFoto + hLeft + 5, wLeft);

    const wRight = 131;
    const hRight = 54.5;
    drawImageWithPlaceholder(immaginiElaborate[1], 151, yFoto, wRight, hRight, "Mezza Figura");
    drawLabel("THREE-QUARTERS", 151, yFoto + hRight + 4, wRight);

    drawImageWithPlaceholder(immaginiElaborate[2], 151, yFoto + hRight + 5, wRight, hRight, "Intero");
    drawLabel("FULL BODY", 151, yFoto + hRight * 2 + 9, wRight);

  } else if (layout === "solo") {
    const w = 160;
    const h = 114;
    const x = (297 - w) / 2;
    drawImageWithPlaceholder(immaginiElaborate[1] || immaginiElaborate[0], x, yFoto, w, h, "Solo Portrait");
    drawLabel("CLOSE UP / ARTISTIC PORTRAIT", x, yFoto + h + 5, w);

  } else if (layout === "grid-4") {
    const w = 131;
    const h = 54.5;
    drawImageWithPlaceholder(immaginiElaborate[0], 15, yFoto, w, h, "Foto 1");
    drawLabel("PORTRAIT / MOOD A", 15, yFoto + h + 4, w);

    drawImageWithPlaceholder(immaginiElaborate[1], 151, yFoto, w, h, "Foto 2");
    drawLabel("MOOD B", 151, yFoto + h + 4, w);

    drawImageWithPlaceholder(immaginiElaborate[2], 15, yFoto + h + 5, w, h, "Foto 3");
    drawLabel("FULL BODY / MOOD C", 15, yFoto + h * 2 + 9, w);

    drawImageWithPlaceholder(immaginiElaborate[3], 151, yFoto + h + 5, w, h, "Foto 4");
    drawLabel("CLOSE UP / MOOD D", 151, yFoto + h * 2 + 9, w);

  } else if (layout === "grid-6") {
    const w = 84;
    const h = 54.5;
    const colsX = [15, 104, 193];
    const etichette = ["1. RITRATTO A", "2. RITRATTO B", "3. MOOD A", "4. MOOD B", "5. MOOD C", "6. INTERO"];
    
    drawImageWithPlaceholder(immaginiElaborate[0], colsX[0], yFoto, w, h, "Foto 1");
    drawImageWithPlaceholder(immaginiElaborate[1], colsX[1], yFoto, w, h, "Foto 2");
    drawImageWithPlaceholder(immaginiElaborate[2], colsX[2], yFoto, w, h, "Foto 3");

    drawImageWithPlaceholder(immaginiElaborate[3], colsX[0], yFoto + h + 5, w, h, "Foto 4");
    drawImageWithPlaceholder(immaginiElaborate[4], colsX[1], yFoto + h + 5, w, h, "Foto 5");
    drawImageWithPlaceholder(immaginiElaborate[5], colsX[2], yFoto + h + 5, w, h, "Foto 6");

    for (let c = 0; c < 3; c++) {
      drawLabel(etichette[c], colsX[c], yFoto + h + 4, w);
      drawLabel(etichette[c + 3], colsX[c], yFoto + h * 2 + 9, w);
    }

  } else if (layout === "editorial-6") {
    const wLeft = 74;
    const hLeft = 125;
    drawImageWithPlaceholder(immaginiElaborate[0], 15, yFoto, wLeft, hLeft, "Cover Profile");
    drawLabel("COVER PROFILE", 15, yFoto + hLeft + 4, wLeft);

    const wCenter = 56;
    const hCenter = 125;
    drawImageWithPlaceholder(immaginiElaborate[1], 145, yFoto, wCenter, hCenter, "Editorial Portrait");
    drawLabel("EDITORIAL HIGHLIGHT", 145, yFoto + hCenter + 4, wCenter);

    const wGrid = 38;
    const hGrid = 55.5;
    const xGridL = 203;
    const xGridR = 244;
    drawImageWithPlaceholder(immaginiElaborate[2], xGridL, yFoto, wGrid, hGrid, "Foto 3");
    drawImageWithPlaceholder(immaginiElaborate[3], xGridR, yFoto, wGrid, hGrid, "Foto 4");

    const yGridBottom = yFoto + hGrid + 14;
    drawImageWithPlaceholder(immaginiElaborate[4], xGridL, yGridBottom, wGrid, hGrid, "Foto 5");
    drawImageWithPlaceholder(immaginiElaborate[5], xGridR, yGridBottom, wGrid, hGrid, "Foto 6");

    pdf.setDrawColor(3, 7, 18);
    pdf.setLineWidth(0.4);
    pdf.line(92 + 10, 75, 92 + 40, 75);
    
    pdf.setTextColor(3, 7, 18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    const displayName = nomeModella.length > 15 ? nomeModella.substring(0, 15) + "..." : nomeModella;
    pdf.text(displayName, 92 + 25, 83, { align: "center" });

    pdf.line(92 + 10, 88, 92 + 40, 88);

    pdf.setDrawColor(120, 120, 120);
    pdf.line(92 + 25, 95, 92 + 25, 101);
    pdf.line(92 + 21, 98, 92 + 29, 98);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    
    const outputFtIn = (cmStr: string) => {
      const cm = parseFloat(cmStr);
      if (isNaN(cm)) return "";
      const totIn = cm / 2.54;
      const ft = Math.floor(totIn / 12);
      const _inch = Math.round((totIn % 12) * 2) / 2;
      return `${ft}'${_inch}"`;
    };

    const outputInches = (cmStr: string) => {
      const cm = parseFloat(cmStr);
      if (isNaN(cm)) return "";
      return `${Math.round(cm / 2.54)}"`;
    };

    const details = [
      `Height : ${resolvedAltezza} ${altezza !== "—" ? "/ " + outputFtIn(String(altezza)) : ""}`,
      `Bust : ${resolvedSeno} ${seno !== "—" ? "/ " + outputInches(String(seno)) : ""}`,
      `Waist : ${resolvedVita} ${vita !== "—" ? "/ " + outputInches(String(vita)) : ""}`,
      `Hips : ${resolvedFianchi} ${fianchi !== "—" ? "/ " + outputInches(String(fianchi)) : ""}`,
      resolvedScarpe !== "—" ? `Shoes : ${resolvedScarpe}` : "",
      resolvedCapelli !== "—" ? `${resolvedCapelli} Hair` : "",
      resolvedOcchi !== "—" ? `${resolvedOcchi} Eyes` : ""
    ].filter(Boolean);

    let dyText = 108;
    details.forEach(text => {
      pdf.text(text, 92 + 25, dyText, { align: "center" });
      dyText += 5.5;
    });

    pdf.line(92 + 21, dyText + 2, 92 + 29, dyText + 2);
    pdf.line(92 + 25, dyText, 92 + 25, dyText + 5);
  }

  if (layout !== "editorial-6") {
    const yBarra = 180;
    const altezzaBarra = 15;
    pdf.setFillColor(3, 7, 18);
    pdf.rect(15, yBarra, 267, altezzaBarra, "F");

    const colonneDati = [
      { t: "ALTEZZA/HEIGHT", v: resolvedAltezza, x: 20 },
      { t: "SENO/BUST", v: resolvedSeno, x: 53 },
      { t: "VITA/WAIST", v: resolvedVita, x: 86 },
      { t: "FIANCHI/HIPS", v: resolvedFianchi, x: 119 },
      { t: "SCARPE/SHOES", v: resolvedScarpe, x: 152 },
      { t: "OCCHI/EYES", v: resolvedOcchi, x: 185 },
      { t: "CAPELLI/HAIR", v: resolvedCapelli, x: 218 }
    ];

    colonneDati.forEach((col, idx) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(5.5);
      pdf.setTextColor(156, 163, 175);
      pdf.text(col.t, col.x, yBarra + 5);
      
      pdf.setFont("helvetica", "bold");
      let currentFontSize = 8;
      pdf.setFontSize(currentFontSize);
      
      // Calculate max width before overlapping next column (columns are spaced ~33mm, let's keep it safe at 28-29mm)
      const maxWidth = idx === colonneDati.length - 1 ? 28 : 29;
      while (pdf.getTextWidth(col.v) > maxWidth && currentFontSize > 4.5) {
        currentFontSize -= 0.5;
        pdf.setFontSize(currentFontSize);
      }
      
      pdf.setTextColor(255, 255, 255);
      pdf.text(col.v, col.x, yBarra + 11);
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    pdf.setTextColor(156, 163, 175);
    pdf.text("TAGLIA S/I SIZE", 251, yBarra + 5);
    
    pdf.setFont("helvetica", "bold");
    let tagliaFontSize = 8;
    pdf.setFontSize(tagliaFontSize);
    
    const maxTagliaWidth = 26; // Safe printable width until the end
    while (pdf.getTextWidth(resolvedTaglia) > maxTagliaWidth && tagliaFontSize > 4.5) {
      tagliaFontSize -= 0.5;
      pdf.setFontSize(tagliaFontSize);
    }
    
    pdf.setTextColor(250, 204, 21);
    pdf.text(resolvedTaglia, 251, yBarra + 11);
  }
};

const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Errore nel caricamento del motore PDF"));
    document.head.appendChild(script);
  });
};

export const convertPdfToImage = async (file: File): Promise<string> => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);
  
  // High Scale for HD rendering
  const viewport = page.getViewport({ scale: 2.5 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Can't obtain canvas context 2D");
  
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.95);
};

const elaboraImmagineCoverPerPDF = (url: string, targetWidth: number, targetHeight: number): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth * 4;  // High Definition
      canvas.height = targetHeight * 4;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;
      let sx, sy, sw, sh;

      if (imgRatio > targetRatio) {
        sh = img.height;
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / targetRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = () => resolve(null);
    img.src = url;
    setTimeout(() => resolve(null), 3000);
  });
};

export const gestisciDownloadCatalogo = async (
  listaModelle: any[],
  agency: any,
  setIsGenerating?: (val: boolean) => void,
  setLoading?: (val: boolean) => void,
  opzioni?: {
    includeCover?: boolean;
    includeBackCover?: boolean;
    coverTitleText?: string;
    coverSubtitleText?: string;
    coverDescText?: string;
    coverImageFile?: string;
    backCoverImageFile?: string;
    backCoverText?: string;
    backCoverCitiesText?: string;
    backCoverFooterText?: string;
    fontFamily?: string;
  }
) => {
  try {
    if (!listaModelle || listaModelle.length === 0) {
      alert("Seleziona almeno una scheda per generare il catalogo.");
      return;
    }

    if (typeof setIsGenerating === "function") setIsGenerating(true);
    if (typeof setLoading === "function") setLoading(true);

    const socialScelti: { url: string; base64: string }[] = [];
    if (agency) {
      const proms: Promise<void>[] = [];
      if (agency.instagram) {
        proms.push(caricaIconaSvg(SVG_INSTAGRAM).then(b64 => { if (b64) socialScelti.push({ url: agency.instagram, base64: b64 }); }));
      }
      if (agency.whatsapp) {
        proms.push(caricaIconaSvg(SVG_WHATSAPP).then(b64 => { if (b64) socialScelti.push({ url: agency.whatsapp, base64: b64 }); }));
      }
      if (agency.facebook) {
        proms.push(caricaIconaSvg(SVG_FACEBOOK).then(b64 => { if (b64) socialScelti.push({ url: agency.facebook, base64: b64 }); }));
      }
      if (agency.threads) {
        proms.push(caricaIconaSvg(SVG_THREADS).then(b64 => { if (b64) socialScelti.push({ url: agency.threads, base64: b64 }); }));
      }
      if (agency.pinterest) {
        proms.push(caricaIconaSvg(SVG_PINTEREST).then(b64 => { if (b64) socialScelti.push({ url: agency.pinterest, base64: b64 }); }));
      }
      await Promise.all(proms);
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    let isFirstPage = true;

    // --- 1. INTRO COVER PAGE ---
    if (opzioni?.includeCover) {
      isFirstPage = false;
      // Background full color
      pdf.setFillColor(15, 23, 42); 
      pdf.rect(0, 0, 297, 210, "F");

      // Cover picture (Left 60%)
      const coverImgSrc = opzioni?.coverImageFile;
      if (coverImgSrc) {
        const croppedImg = await elaboraImmagineCoverPerPDF(coverImgSrc, 178.2, 210);
        if (croppedImg) {
          pdf.addImage(croppedImg, "JPEG", 0, 0, 178.2, 210);
        } else {
          pdf.setFillColor(17, 24, 39);
          pdf.rect(0, 0, 178.2, 210, "F");
        }
      } else {
        pdf.setFillColor(17, 24, 39);
        pdf.rect(0, 0, 178.2, 210, "F");
      }

      // Sidebar Right (40%)
      pdf.setFillColor(11, 15, 25);
      pdf.rect(178.2, 0, 118.8, 210, "F");

      // Title & Branding texts
      const agencyName = (agency?.name || "COSMOPOLITAN").toUpperCase();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(agencyName, 193.3, 28);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(129, 140, 248); // Indigo-400
      const cityText = `${agency?.city?.toUpperCase() || "ITALY"} • ${agency?.portfolioDate || "PORTFOLIO"}`;
      pdf.text(cityText, 193.3, 33);

      pdf.setDrawColor(255, 255, 255, 0.15);
      pdf.setLineWidth(0.3);
      pdf.line(193.3, 38, 282, 38);

      // Label and large custom title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(156, 163, 175);
      const subTitle = opzioni?.coverSubtitleText || "PORTFOLIO COMPOSIT UFFICIALE";
      pdf.text(subTitle.toUpperCase(), 193.3, 85);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(255, 255, 255);
      const titleText = opzioni?.coverTitleText || "FASHION BOOK";
      const splitTitle = pdf.splitTextToSize(titleText.toUpperCase(), 90);
      pdf.text(splitTitle, 193.3, 95);

      const yAccentLine = 95 + (Array.isArray(splitTitle) ? splitTitle.length * 8 : 10);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(193.3, yAccentLine, 12, 1, "F");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      const descText = opzioni?.coverDescText || "Raccolta dei composit fotografici e dati tecnici dei modelli professionisti per la stagione corrente.";
      const splitDesc = pdf.splitTextToSize(descText, 90);
      pdf.text(splitDesc, 193.3, yAccentLine + 10);

      // Bottom info
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(agencyName, 193.3, 168);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(156, 163, 175);
      pdf.text(agency?.address?.toUpperCase() || "", 193.3, 173);
      pdf.text((agency?.web || "").toUpperCase(), 193.3, 178);
      pdf.text((agency?.email || "").toUpperCase(), 193.3, 183);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(129, 140, 248);
      let contactLineY = 189;
      if (agency?.instagram) {
        pdf.text(`IG: @${agency.instagram.toUpperCase()}`, 193.3, contactLineY);
        contactLineY += 5;
      }
      if (agency?.whatsapp) {
        pdf.text(`WA: ${agency.whatsapp}`, 193.3, contactLineY);
      }
    }

    // --- 2. MODELS CARDS ---
    for (let index = 0; index < listaModelle.length; index++) {
      const datiModella = listaModelle[index];
      if (!isFirstPage) {
        pdf.addPage([297, 210], "landscape");
      } else {
        isFirstPage = false;
      }
      await disegnaModellaSuPDF(pdf, datiModella, index, listaModelle.length, socialScelti, agency);
    }

    // --- 3. OUTRO BACK COVER PAGE ---
    if (opzioni?.includeBackCover) {
      pdf.addPage([297, 210], "landscape");

      if (opzioni?.backCoverImageFile) {
        const processedBackBg = await elaboraImmagineCoverPerPDF(opzioni.backCoverImageFile, 297, 210);
        if (processedBackBg) {
          pdf.addImage(processedBackBg, "JPEG", 0, 0, 297, 210);
          pdf.setFillColor(15, 23, 42);
          pdf.rect(48.5, 35, 200, 140, "F");
        } else {
          pdf.setFillColor(15, 23, 42);
          pdf.rect(0, 0, 297, 210, "F");
        }
      } else {
        pdf.setFillColor(15, 23, 42);
        pdf.rect(0, 0, 297, 210, "F");
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text((agency?.name || "COSMOPOLITAN").toUpperCase(), 148.5, 65, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(156, 163, 175);
      const citiesText = opzioni?.backCoverCitiesText || "MILANO • PARIGI • LONDRA • NEW YORK";
      pdf.text(citiesText.toUpperCase(), 148.5, 74, { align: "center" });

      pdf.setDrawColor(255, 255, 255, 0.25);
      pdf.setLineWidth(0.4);
      pdf.line(138.5, 80, 158.5, 80);

      const finalMsg = opzioni?.backCoverText || "Grazie per la visione. Per prenotazioni o contatti rivolgersi ai riferimenti indicati.";
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(229, 231, 235);
      const splitMsg = pdf.splitTextToSize(finalMsg, 160);
      pdf.text(splitMsg, 148.5, 95, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      let bottomY = 130;
      if (agency?.address) {
        pdf.text(`${agency.address.toUpperCase()} • ${agency.city?.toUpperCase() || ""}`, 148.5, bottomY, { align: "center" });
        bottomY += 6;
      }
      pdf.text(`WEB: ${agency?.web || ""} • EMAIL: ${agency?.email || ""}`, 148.5, bottomY, { align: "center" });
      bottomY += 6;
      if (agency?.phone) {
        pdf.text(`TEL: ${agency.phone}`, 148.5, bottomY, { align: "center" });
      }

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      const footerText = opzioni?.backCoverFooterText || "GRAZIE PER L'ATTENZIONE • PORTFOLIO CATALOGO UFFICIALE";
      pdf.text(`${footerText.toUpperCase()} ${new Date().getFullYear()}`, 148.5, 185, { align: "center" });
    }

    pdf.save(`Catalogo_Modelle_Cosmopolitan.pdf`);

  } catch (errore) {
    console.error("Errore nella generazione del catalogo:", errore);
  } finally {
    if (typeof setIsGenerating === "function") setIsGenerating(false);
    if (typeof setLoading === "function") setLoading(false);
  }
};

export default function App() {
  // Model state (current active model)
  const [model, setModel] = useState<ModelData>({ ...SAMPLE_MODELS[0] });

  // Undo / Redo history state
  const [past, setPast] = useState<ModelData[]>([]);
  const [future, setFuture] = useState<ModelData[]>([]);

  // We keep a ref of the model state that is currently "committed" in the history
  const lastSavedModelRef = useRef<ModelData>({ ...SAMPLE_MODELS[0] });
  const timeoutRef = useRef<any>(null);

  // Helper to commit current state immediately to history (e.g. before preset changes or form clears)
  const commitHistoryImmediately = (nextModel: ModelData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Only save if different
    if (JSON.stringify(lastSavedModelRef.current) !== JSON.stringify(model)) {
      setPast((prev) => {
        const updated = [...prev, lastSavedModelRef.current];
        if (updated.length > 40) updated.shift();
        return updated;
      });
    }
    setFuture([]);
    lastSavedModelRef.current = nextModel;
  };

  // Custom setter that handles history with debouncing to prevent spamming undo stack during typing or sliding
  const setModelWithHistory = (newValOrFunc: ModelData | ((prev: ModelData) => ModelData)) => {
    const nextModel = typeof newValOrFunc === "function" ? newValOrFunc(model) : newValOrFunc;
    
    // Update the state immediately for visual responsiveness
    setModel(nextModel);

    // Clear future list as a new user modification breaks the redo chain
    setFuture([]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const stableStart = lastSavedModelRef.current;

    timeoutRef.current = setTimeout(() => {
      if (JSON.stringify(stableStart) !== JSON.stringify(nextModel)) {
        setPast((prevPast) => {
          const updated = [...prevPast, stableStart];
          if (updated.length > 40) {
            updated.shift();
          }
          return updated;
        });
        lastSavedModelRef.current = nextModel;
      }
    }, 800);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const previous = past[past.length - 1];
    const current = model;

    setFuture((prev) => [current, ...prev]);
    setPast((prev) => prev.slice(0, prev.length - 1));

    setModel(previous);
    lastSavedModelRef.current = previous;

    showNotification("Modifica annullata (Undo)", "info");
  };

  const handleRedo = () => {
    if (future.length === 0) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const next = future[0];
    const current = model;

    setPast((prev) => [...prev, current]);
    setFuture((prev) => prev.slice(1));

    setModel(next);
    lastSavedModelRef.current = next;

    showNotification("Modifica ripristinata (Redo)", "info");
  };

  // Keyboard shortcut listener for standard Ctrl+Z / Ctrl+Y / Cmd+Shift+Z undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [past, future, model]);
  
  // Custom title for the card
  const [title, setTitle] = useState("PORTRAIT / THREE-QUARTERS / FULL BODY MODELS");
  
  // Custom styling settings
  const [themeColor, setThemeColor] = useState<"silver" | "charcoal" | "beige" | "gold" | "white">("silver");
  const [fontFamily, setFontFamily] = useState<"serif" | "display" | "sans">("sans");
  
  // Agency Information
  const [agency, setAgency] = useState<AgencyInfo>({ ...DEFAULT_AGENCY });
  
  // Local Database of characters (localStorage key)
  const [localProfiles, setLocalProfiles] = useState<ModelData[]>([]);
  
  // Notification States
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  // Preview Scale Adjuster (for multi-device compatibility)
  const [previewScale, setPreviewScale] = useState<number>(0.85);
  const [autoScale, setAutoScale] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(true);

  // Multi-composit selection & export states
  const [showMultiExport, setShowMultiExport] = useState<boolean>(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [isExportingMulti, setIsExportingMulti] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportingProfiles, setExportingProfiles] = useState<ModelData[] | null>(null);
  const [exportingAgency, setExportingAgency] = useState<AgencyInfo | null>(null);

  // States for download fallback support preview popup modal
  const [exportedImageUrl, setExportedImageUrl] = useState<string | null>(null);
  const [exportedType, setExportedType] = useState<"JPG" | "PDF">("JPG");
  const [exportedFileName, setExportedFileName] = useState<string>("");
  const [isExportOverlayOpen, setIsExportOverlayOpen] = useState<boolean>(false);

  // Cover page & back cover configuration
  const [includeCover, setIncludeCover] = useState<boolean>(false);
  const [includeBackCover, setIncludeBackCover] = useState<boolean>(false);
  const [coverTitleText, setCoverTitleText] = useState<string>("COLLEZIONE MODELLI");
  const [coverSubtitleText, setCoverSubtitleText] = useState<string>("PORTFOLIO COMPOSIT UFFICIALE");
  const [coverDescText, setCoverDescText] = useState<string>("Raccolta dei composit fotografici e dati tecnici dei modelli professionisti per la stagione corrente.");
  const [coverImageFile, setCoverImageFile] = useState<string>("");
  const [backCoverImageFile, setBackCoverImageFile] = useState<string>("");
  const [backCoverText, setBackCoverText] = useState<string>("Grazie per la visione. Per prenotazioni o contatti rivolgersi ai riferimenti indicati.");
  const [backCoverCitiesText, setBackCoverCitiesText] = useState<string>("MILANO • PARIGI • LONDRA • NEW YORK");
  const [backCoverFooterText, setBackCoverFooterText] = useState<string>("GRAZIE PER L'ATTENZIONE • PORTFOLIO CATALOGO UFFICIALE");

  // Toggle states for instructions and iframe warning sections
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showIframeWarning, setShowIframeWarning] = useState<boolean>(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);

  // Automatically select all profiles when loaded
  useEffect(() => {
    if (localProfiles.length > 0 && selectedModelIds.length === 0) {
      setSelectedModelIds(localProfiles.map(p => p.id));
    }
  }, [localProfiles]);

  // Real-time synchronization with Firestore on mount
  useEffect(() => {
    // 1. Initial quick load from local storage cache for immediate display
    try {
      const cachedModels = localStorage.getItem("fashion_catalog_profiles");
      if (cachedModels) {
        setLocalProfiles(JSON.parse(cachedModels));
      }
      const cachedAgency = localStorage.getItem("fashion_catalog_agency");
      if (cachedAgency) {
        setAgency(JSON.parse(cachedAgency));
      }
    } catch (e) {
      console.warn("Could not read local persistence cache on mount", e);
    }

    // 2. Real-time subscribe to models collection
    const modelsCollection = "models";
    const unsubModels = onSnapshot(
      collection(db, modelsCollection),
      async (snapshot) => {
        try {
          const list: ModelData[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ModelData);
          });

          if (list.length === 0) {
            console.log("Firestore empty, seeding database with standard profiles...");
            // Seed base presets
            for (const sample of SAMPLE_MODELS) {
              await setDoc(doc(db, modelsCollection, sample.id), sample);
            }
          } else {
            setLocalProfiles(list);
            localStorage.setItem("fashion_catalog_profiles", JSON.stringify(list));
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, modelsCollection);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, modelsCollection);
      }
    );

    // 3. Real-time subscribe to agency settings
    const agencyDocPath = "agency/current";
    const unsubAgency = onSnapshot(
      doc(db, "agency", "current"),
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data() as AgencyInfo;
            setAgency(data);
            localStorage.setItem("fashion_catalog_agency", JSON.stringify(data));
          } else {
            console.log("Firestore agency empty, seeding default agency details...");
            await setDoc(doc(db, "agency", "current"), DEFAULT_AGENCY);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, agencyDocPath);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, agencyDocPath);
      }
    );

    // Dynamic scale listener for multi-device responsive preview fit
    const handleResize = () => {
      if (autoScale) {
        const width = window.innerWidth;
        if (width < 640) {
          setPreviewScale(0.33); // Fits beautifully on iPhone screens
        } else if (width < 768) {
          setPreviewScale(0.45); // Portrait mobile / landscape
        } else if (width < 1024) {
          setPreviewScale(0.68); // iPad
        } else if (width < 1440) {
          setPreviewScale(0.85); // Small laptops
        } else {
          setPreviewScale(0.95); // High-res MacBook displays
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsubModels();
      unsubAgency();
      window.removeEventListener("resize", handleResize);
    };
  }, [autoScale]);

  // Sync agency changes to Firestore when modified by the user
  useEffect(() => {
    if (agency) {
      localStorage.setItem("fashion_catalog_agency", JSON.stringify(agency));
      
      const syncAgency = setTimeout(async () => {
        try {
          await setDoc(doc(db, "agency", "current"), agency);
        } catch (e) {
          console.error("Failed to update agency configuration in Firestore", e);
        }
      }, 500); // 500ms debounce to avoid spam while typing
      
      return () => clearTimeout(syncAgency);
    }
  }, [agency]);

  // Utility to show beautiful alerts programmatically
  const showNotification = (msg: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ message: msg, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Preset loading
  const handleSelectPreset = (p: ModelData) => {
    commitHistoryImmediately({ ...p });
    setModel({ ...p });
    showNotification(`Caricato portfolio di ${p.name}`, "success");
  };

  // Clear Form / Create New
  const handleClearForm = () => {
    const emptyModel: ModelData = {
      id: Date.now().toString(),
      name: "",
      height: "",
      bust: "",
      waist: "",
      hips: "",
      shoes: "",
      eyes: "",
      hair: "",
      sizeUpper: "",
      sizeLower: "",
      imageLeft: "",
      imageCenter: "",
      imageRight: "",
      zoomLeft: 100,
      zoomCenter: 100,
      zoomRight: 100,
      offsetXLeft: 50,
      offsetYLeft: 50,
      offsetXCenter: 50,
      offsetYCenter: 50,
      offsetXRight: 50,
      offsetYRight: 50,
      gender: "model woman",
    };
    commitHistoryImmediately(emptyModel);
    setModel(emptyModel);
    showNotification("Modulo reimpostato per inserire dati vuoti", "info");
  };

  // Save profile to Firestore Cloud Database
  const handleSaveLocal = async () => {
    if (!model.name.trim()) {
      showNotification("Assegna almeno un Nome per salvare il profilo nel database!", "error");
      return;
    }

    let docId = model.id;
    // Generate a valid, clean, unique Firestore document ID if it is temporary or simple sequence
    if (!docId || docId.startsWith("temp_") || !isNaN(Number(docId)) || ["1", "2", "3"].includes(docId)) {
      docId = "model_" + Date.now().toString();
    }

    const targetModel: ModelData = {
      ...model,
      id: docId
    };

    try {
      showNotification(`Salvataggio del profilo di ${targetModel.name} nel Cloud...`, "info");
      
      // Save directly to Firestore models collection
      await setDoc(doc(db, "models", docId), targetModel);
      
      // Keep state and history perfectly synchronized
      commitHistoryImmediately(targetModel);
      setModel(targetModel);
      
      showNotification(`Profilo di ${targetModel.name} salvato nel cloud database Firestore!`, "success");
    } catch (e) {
      showNotification("Errore di scrittura nel Database Cloud. Verifica la connessione.", "error");
      handleFirestoreError(e, OperationType.WRITE, `models/${docId}`);
    }
  };

  // Delete profile from Firestore Cloud Database
  const handleDeleteLocal = async (idToDelete: string) => {
    try {
      showNotification("Eliminazione in corso...", "info");
      
      // Delete document from Firestore models collection
      await deleteDoc(doc(db, "models", idToDelete));
      
      // Also remove from selected IDs list
      setSelectedModelIds((prev) => prev.filter((id) => id !== idToDelete));
      showNotification("Profilo rimosso con successo dal database Cloud", "success");
      
      // Switch active model if we deleted the current active one
      const filtered = localProfiles.filter(p => p.id !== idToDelete);
      if (model.id === idToDelete) {
        if (filtered.length > 0) {
          commitHistoryImmediately(filtered[0]);
          setModel(filtered[0]);
        } else if (SAMPLE_MODELS.length > 0) {
          commitHistoryImmediately(SAMPLE_MODELS[0]);
          setModel(SAMPLE_MODELS[0]);
        }
      }
    } catch (e) {
      showNotification("Impossibile eliminare il profilo dal cloud database.", "error");
      handleFirestoreError(e, OperationType.DELETE, `models/${idToDelete}`);
    }
  };

  const handleDuplicateLocal = async (sourceModel: ModelData) => {
    if (!sourceModel.name.trim()) {
      showNotification("Assegna almeno un Nome prima di duplicare!", "error");
      return;
    }
    const suffix = " Bis";
    const newName = sourceModel.name.endsWith(suffix) ? sourceModel.name : sourceModel.name + suffix;
    const newId = "model_" + Date.now().toString();
    const duplicatedModel: ModelData = {
      ...sourceModel,
      id: newId,
      name: newName,
    };

    try {
      showNotification(`Duplicazione di ${sourceModel.name} in corso...`, "info");
      await setDoc(doc(db, "models", newId), duplicatedModel);
      
      // Update local history and current states
      commitHistoryImmediately(duplicatedModel);
      setModel(duplicatedModel);
      showNotification(`Copia creata come "${duplicatedModel.name}"!`, "success");
    } catch (e) {
      showNotification("Errore durate la duplicazione del profilo nel Cloud.", "error");
      handleFirestoreError(e, OperationType.WRITE, `models/${newId}`);
    }
  };

  // Safe base64 SVG warning placeholder for images that fail CORS conversion to avoid tainting html2canvas
  const getCorsPlaceholderSvg = (): string => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/><circle cx="150" cy="150" r="30" fill="#fee2e2"/><path d="M150 135v20M150 162h.01" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/><text x="50%" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="13" fill="#1e293b" dominant-baseline="middle" text-anchor="middle">Immagine protetta da CORS</text><text x="50%" y="250" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748b" dominant-baseline="middle" text-anchor="middle">Il sito hosting blocca il download</text><text x="50%" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#64748b" dominant-baseline="middle" text-anchor="middle">Soluzione: Carica foto dal computer</text></svg>`;
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgString)))}`;
  };

  const sanitizeResolvedModel = (m: ModelData): { sanitized: ModelData; hasCorsBlocks: boolean } => {
    let hasCorsBlocks = false;
    const placeholder = getCorsPlaceholderSvg();

    const checkAndReplace = (url: string | undefined): string => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;
      // If it still hasn't been converted to base64, we MUST replace it with a safe placeholder
      // to avoid tainting html2canvas and causing SecurityError!
      hasCorsBlocks = true;
      return placeholder;
    };

    return {
      sanitized: {
        ...m,
        imageLeft: checkAndReplace(m.imageLeft),
        imageCenter: checkAndReplace(m.imageCenter),
        imageRight: checkAndReplace(m.imageRight),
        image4: checkAndReplace(m.image4),
        image5: checkAndReplace(m.image5),
        image6: checkAndReplace(m.image6),
      },
      hasCorsBlocks
    };
  };

  const sanitizeResolvedAgency = (ag: AgencyInfo): AgencyInfo => {
    if (!ag.logo) return ag;
    if (ag.logo.startsWith("data:")) return ag;
    // URL failed CORS, use empty string to trigger elegant built-in text logo fallback
    return {
      ...ag,
      logo: ""
    };
  };

  // Helper to convert any image URL to a safe base64 Data URL to prevent CORS/Taint errors during Canvas generation
  const convertUrlToBase64 = async (url: string | undefined): Promise<string> => {
    if (!url) return "";
    if (url.startsWith("data:")) return url; // Already base64 encoded
    
    // Resolve blob or local object URLs directly
    if (url.startsWith("blob:")) {
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const blob = await resp.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") resolve(reader.result);
              else reject(new Error("Failed blob conversion"));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch (e) {
        console.error("Blob url to base64 fetch failed:", e);
      }
      return url;
    }

    // Force CORS cache-busting checks for remote HTTP/HTTPS images
    const corsUrl = url.includes("?") ? `${url}&cb_cors=1` : `${url}?cb_cors=1`;

    // Strategy 1: Attempt DIRECT fetch first with cache buster
    try {
      const resp = await fetch(corsUrl, { method: "GET" });
      if (resp.ok) {
        const blob = await resp.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to convert slice to string"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.log(`Direct fetch base64 conversion failed (likely CORS), trying proxy fallback for: ${corsUrl}`, e);
    }

    // Strategy 2: Attempt fetch via free CORS-enabling proxy (weserv) with cache buster appended
    let targetUrl = corsUrl;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const encodedUrl = encodeURIComponent(url);
      targetUrl = `https://images.weserv.nl/?url=${encodedUrl}&w=900&il&cb_cors=1`;
    }

    try {
      const resp = await fetch(targetUrl, { method: "GET" });
      if (resp.ok) {
        const blob = await resp.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to convert slice to string"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn(`Proxy base64 conversion failed for: ${targetUrl}`, e);
    }

    // Strategy 3: Fallback draw using standard Image element with cache-buster and crossOrigin
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const b64 = canvas.toDataURL("image/jpeg", 0.95);
            resolve(b64);
            return;
          }
        } catch (e) {
          console.warn("Errore d'esportazione canvas per la conversione Base64", e);
        }
        resolve(""); // Fallback empty to prevent canvas tainting upstream
      };
      
      img.onerror = (err) => {
        console.warn(`All Base64 conversion methods failed for URL: ${url}`, err);
        resolve(""); // Fallback empty to prevent canvas tainting upstream
      };
      
      img.src = corsUrl; // Try loading the cache-busting URL to bypass non-CORS cached images
    });
  };

  const convertModelImagesToBase64 = async (m: ModelData): Promise<ModelData> => {
    const [
      imageLeft,
      imageCenter,
      imageRight,
      image4,
      image5,
      image6
    ] = await Promise.all([
      convertUrlToBase64(m.imageLeft),
      convertUrlToBase64(m.imageCenter),
      convertUrlToBase64(m.imageRight),
      convertUrlToBase64(m.image4),
      convertUrlToBase64(m.image5),
      convertUrlToBase64(m.image6)
    ]);

    return {
      ...m,
      imageLeft,
      imageCenter,
      imageRight,
      image4,
      image5,
      image6
    };
  };

  const convertAgencyLogoToBase64 = async (ag: AgencyInfo): Promise<AgencyInfo> => {
    if (!ag.logo) return ag;
    const logoB64 = await convertUrlToBase64(ag.logo);
    return {
      ...ag,
      logo: logoB64
    };
  };

  // Helper to wait until all images inside an element are fully loaded in the browser DOM
  const waitForImagesToLoad = (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll("img"));
    console.log(`[PDF Export] Trovate ${images.length} immagini nel DOM. Attesa del caricamento...`);
    const promises = images.map((img, idx) => {
      // If the image is already completely loaded and has naturalWidth, it's done
      if (img.complete && img.naturalWidth !== 0) {
        console.log(`[PDF Export] Immagine ${idx + 1}/${images.length} già caricata: ${img.src.substring(0, 80)}...`);
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => {
          console.log(`[PDF Export] Immagine ${idx + 1}/${images.length} caricata con successo!`);
          resolve();
        };
        img.onerror = (err) => {
          console.warn(`[PDF Export] Errore di caricamento per l'immagine ${idx + 1}/${images.length}: ${img.src.substring(0, 80)}...`, err);
          resolve(); // Resolve anyway to avoid blocking export indefinitely
        };
      });
    });
    return Promise.all(promises).then(() => {
      console.log("[PDF Export] Tutte le immagini nel DOM sono pronte.");
    });
  };

  // JPG Export logic using html2canvas in premium high quality!
  const handleExportJPG = async () => {
    // -----------------------------------------------------------------
    // CASE A: MULTI-EXPORT CATALOG MODE (Consecutive high-res downloads)
    // -----------------------------------------------------------------
    if (showMultiExport) {
      if (selectedModelIds.length === 0) {
        showNotification("Seleziona almeno un profilo modello da includere!", "error");
        return;
      }

      showNotification(`Conversione immagini, attendere...`, "info");
      
      const targetProfiles = localProfiles.length > 0 ? localProfiles : SAMPLE_MODELS;
      let sequence = 1;

      try {
        // Resolve all selected profiles with conversion and full/safe sanitization to prevent canvas tainting
        const resolvedProfiles = await Promise.all(
          targetProfiles.map(async (p) => {
            if (selectedModelIds.includes(p.id)) {
              const rawResolved = await convertModelImagesToBase64(p);
              const { sanitized } = sanitizeResolvedModel(rawResolved);
              return sanitized;
            }
            return p;
          })
        );

        const rawAgency = await convertAgencyLogoToBase64(agency);
        const resolvedAgency = sanitizeResolvedAgency(rawAgency);

        // Temporarily store in React state so that the hidden cards render base64 strings
        setExportingProfiles(resolvedProfiles);
        setExportingAgency(resolvedAgency);

        console.log("[JPG Multi Export] Profili convertiti. Allineamento del DOM nascosto con immagini Base64...");
        const hiddenContainer = document.getElementById("hidden-multi-cards");
        if (hiddenContainer) {
          let multiDomUpdated = false;
          for (let attempt = 0; attempt < 30; attempt++) {
            const imgs = Array.from(hiddenContainer.querySelectorAll("img"));
            const allUpdated = imgs.every(img => !img.src || img.src.startsWith("data:") || img.src.startsWith("blob:"));
            if (allUpdated && imgs.length > 0) {
              multiDomUpdated = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 80));
          }
        }

        // Delay to allow DOM repaint to be complete and fully pixel-perfect
        await new Promise((resolve) => setTimeout(resolve, 200));

        showNotification(`Preparazione download consecutivo delle immagini JPG...`, "info");
        // 1. Process COVER page (if enabled)
        if (includeCover) {
          const coverElement = document.getElementById("multi-cover-page");
          if (coverElement) {
            showNotification(`Esportazione Copertina JPG (${sequence})...`, "info");
            await waitForImagesToLoad(coverElement);
            await new Promise((resolve) => setTimeout(resolve, 150));
            
            const canvas = await html2canvas(coverElement, {
              scale: 3.0,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#0f172a",
              logging: true,
            });
            
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const downloadLink = document.createElement("a");
            downloadLink.download = `card-${sequence}-Copertina.jpg`;
            downloadLink.href = imgData;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            sequence++;
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        }

        // 2. Process each CHOSEN model card
        for (let i = 0; i < selectedModelIds.length; i++) {
          const mId = selectedModelIds[i];
          const m = targetProfiles.find(p => p.id === mId);
          const name = m ? m.name : `Scheda_${i + 1}`;
          
          const cardElement = document.getElementById(`multi-card-${mId}`);
          if (!cardElement) {
            console.error(`[JPG Multi Export] Elemento 'multi-card-${mId}' non trovato nel DOM!`);
            continue;
          }

          showNotification(`Esportazione JPG (${sequence}): ${name}...`, "info");
          await waitForImagesToLoad(cardElement);
          await new Promise((resolve) => setTimeout(resolve, 150));

          let canvas: HTMLCanvasElement;
          try {
            canvas = await html2canvas(cardElement, {
              scale: 3.0,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              logging: true,
            });
          } catch (err) {
            console.warn(`[JPG Multi Export] Fallback scale for ${name}`, err);
            canvas = await html2canvas(cardElement, {
              scale: 2.0,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#ffffff",
              logging: true,
            });
          }

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const downloadLink = document.createElement("a");
          const cleanName = name ? name.trim().replace(/\s+/g, "_") : `model_${i + 1}`;
          downloadLink.download = `card-${sequence}-${cleanName}.jpg`;
          downloadLink.href = imgData;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          sequence++;
          await new Promise((resolve) => setTimeout(resolve, 350));
        }

        // 3. Process BACK COVER page (if enabled)
        if (includeBackCover) {
          const backCoverElement = document.getElementById("multi-back-cover-page");
          if (backCoverElement) {
            showNotification(`Esportazione Retro Copertina JPG (${sequence})...`, "info");
            await waitForImagesToLoad(backCoverElement);
            await new Promise((resolve) => setTimeout(resolve, 150));
            
            const canvas = await html2canvas(backCoverElement, {
              scale: 3.0,
              useCORS: true,
              allowTaint: true,
              backgroundColor: "#0f172a",
              logging: true,
            });
            
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const downloadLink = document.createElement("a");
            downloadLink.download = `card-${sequence}-Retro.jpg`;
            downloadLink.href = imgData;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        }

        showNotification("Tutte le schede sono state scaricate come immagini ad alta risoluzione!", "success");
      } catch (err) {
        console.error("[JPG Multi Export Err]:", err);
        showNotification("Errore durante l'esportazione consecutiva dei file JPG.", "error");
      } finally {
        setExportingProfiles(null);
        setExportingAgency(null);
      }
      return;
    }

    // -----------------------------------------------------------------
    // CASE B: SINGLE CURRENT PROFILE EXPORT
    // -----------------------------------------------------------------
    const cardElement = document.getElementById("composit-card");
    if (!cardElement) {
      console.error("[JPG Export] Elemento DOM 'composit-card' non trovato!");
      showNotification("Errore di esportazione JPG: elemento grafico non trovato.", "error");
      return;
    }

    showNotification(`Conversione immagini, attendere...`, "info");

    const originalModel = { ...model };
    const originalAgency = { ...agency };

    const parentElement = cardElement.parentElement;
    const originalParentTransform = parentElement ? parentElement.style.transform : "";
    const originalParentMargin = parentElement ? parentElement.style.margin : "";
    const originalParentTransition = parentElement ? parentElement.style.transition : "";

    // Declare placeholder variables to guarantee recovery works correctly under catch blocks
    let originalTransition = cardElement.style.transition;
    let originalTransform = cardElement.style.transform;
    let originalBoxShadow = cardElement.style.boxShadow;

    try {
      console.log("[JPG Export] Inizio caricamento asincrono...");
      const [resolvedModel, resolvedAgency] = await Promise.all([
        convertModelImagesToBase64(model),
        convertAgencyLogoToBase64(agency)
      ]);

      const { sanitized: sanitizedModel, hasCorsBlocks } = sanitizeResolvedModel(resolvedModel);
      const sanitizedAgency = sanitizeResolvedAgency(resolvedAgency);

      setModel(sanitizedModel);
      setAgency(sanitizedAgency);

      if (hasCorsBlocks) {
        showNotification("Nota: foto protette da CORS sostituite con segnaposto di sicurezza.", "info");
      }

      console.log("[JPG Export] React state aggiornato. Allineamento...");
      let domUpdated = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const imgs = Array.from(cardElement.querySelectorAll("img"));
        const allUpdated = imgs.every(img => !img.src || img.src.startsWith("data:") || img.src.startsWith("blob:"));
        if (allUpdated && imgs.length > 0) {
          domUpdated = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      await waitForImagesToLoad(cardElement);
      await new Promise((resolve) => setTimeout(resolve, 150));

      showNotification(`Generazione file JPG in corso, attendere...`, "info");

      originalTransition = cardElement.style.transition;
      originalTransform = cardElement.style.transform;
      originalBoxShadow = cardElement.style.boxShadow;
      
      cardElement.style.transition = "none";
      cardElement.style.transform = "none";
      cardElement.style.boxShadow = "none";

      if (parentElement) {
        parentElement.style.transform = "none";
        parentElement.style.margin = "0";
        parentElement.style.transition = "none";
      }

      let canvas: HTMLCanvasElement;

      console.log("[JPG Export] Avvio rendering con html2canvas...");
      try {
        canvas = await html2canvas(cardElement, {
          scale: 3.0, // Scale 3.0 high-resolution
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: true,
          width: cardElement.offsetWidth,   // Dynamic size prevents cropping perfectly
          height: cardElement.offsetHeight, // Dynamic size prevents cropping perfectly
        });
        
        canvas.toDataURL("image/jpeg", 0.95);
      } catch (err: any) {
        console.warn("[JPG Export] Fallback scale 2.0...", err);
        canvas = await html2canvas(cardElement, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: true,
          width: cardElement.offsetWidth,
          height: cardElement.offsetHeight,
        });
      }

      cardElement.style.transition = originalTransition;
      cardElement.style.transform = originalTransform;
      cardElement.style.boxShadow = originalBoxShadow;

      if (parentElement) {
        parentElement.style.transform = originalParentTransform;
        parentElement.style.margin = originalParentMargin;
        parentElement.style.transition = originalParentTransition;
      }

      setModel(originalModel);
      setAgency(originalAgency);

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const downloadLink = document.createElement("a");
      const cleanName = model.name ? model.name.trim().replace(/\s+/g, "_") : "Modella";
      const fileName = `Composit_${cleanName}.jpg`;
      downloadLink.download = fileName;
      downloadLink.href = imgData;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Save for on-screen dialogue fallbacks in sandbox iframe limits
      setExportedImageUrl(imgData);
      setExportedType("JPG");
      setExportedFileName(fileName);
      setIsExportOverlayOpen(true);
      
      showNotification(`File JPG scaricato con successo!`, "success");
    } catch (e: any) {
      console.error("🔍 DETAILED JPG EXPORT EXCEPTION:", e);
      
      cardElement.style.transition = originalTransition;
      cardElement.style.transform = originalTransform;
      cardElement.style.boxShadow = originalBoxShadow;

      if (parentElement) {
        parentElement.style.transform = originalParentTransform;
        parentElement.style.margin = originalParentMargin;
        parentElement.style.transition = originalParentTransition;
      }
      
      setModel(originalModel);
      setAgency(originalAgency);
      
      showNotification("Errore durante l'esportazione JPG.", "error");
    }
  };

  const gestisciDownloadComposit = async (datiModella?: any) => {
    const hasExternalData = datiModella && typeof datiModella === "object" && !("target" in datiModella) && !("nativeEvent" in datiModella);
    const resolvedDati = hasExternalData ? datiModella : model;

    showNotification("Generazione documento PDF in corso...", "info");

    try {
      const socialScelti: { url: string; base64: string }[] = [];
      if (agency) {
        const proms: Promise<void>[] = [];
        if (agency.instagram) {
          proms.push(caricaIconaSvg(SVG_INSTAGRAM).then(b64 => { if (b64) socialScelti.push({ url: agency.instagram, base64: b64 }); }));
        }
        if (agency.whatsapp) {
          proms.push(caricaIconaSvg(SVG_WHATSAPP).then(b64 => { if (b64) socialScelti.push({ url: agency.whatsapp, base64: b64 }); }));
        }
        if (agency.facebook) {
          proms.push(caricaIconaSvg(SVG_FACEBOOK).then(b64 => { if (b64) socialScelti.push({ url: agency.facebook, base64: b64 }); }));
        }
        if (agency.threads) {
          proms.push(caricaIconaSvg(SVG_THREADS).then(b64 => { if (b64) socialScelti.push({ url: agency.threads, base64: b64 }); }));
        }
        if (agency.pinterest) {
          proms.push(caricaIconaSvg(SVG_PINTEREST).then(b64 => { if (b64) socialScelti.push({ url: agency.pinterest, base64: b64 }); }));
        }
        await Promise.all(proms);
      }

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      await disegnaModellaSuPDF(pdf, resolvedDati, 0, 1, socialScelti, agency);

      const nomeFattibile = (resolvedDati?.nome || resolvedDati?.name || "MARIA_V").replace(/\s+/g, "_");
      pdf.save(`Scheda_Composit_${nomeFattibile}.pdf`);
      showNotification("PDF salvato con successo!", "success");

    } catch (errore) {
      console.error("Errore nel calcolo delle proporzioni o generazione:", errore);
      showNotification("Errore nel download del PDF.", "error");
    } finally {
      if (typeof (window as any).setIsGenerating === "function") (window as any).setIsGenerating(false);
      if (typeof (window as any).setLoading === "function") (window as any).setLoading(false);
    }
  };

  const handleExportPDF = async (paperSize: "A4" | "A3") => {
    gestisciDownloadComposit();
  };

  // Helper to determine cover image src (uploaded base64 or fallback to first model's imageCenter)
  const getCoverImageSrc = (): string => {
    if (coverImageFile) {
      return coverImageFile;
    }
    // Fallback to the first selected model's main/center picture
    if (selectedModelIds.length > 0) {
      const targetProfiles = localProfiles.length > 0 ? localProfiles : SAMPLE_MODELS;
      const firstId = selectedModelIds[0];
      // Check if we have the converted base64 exporting version for safety, or normal
      const exportingM = exportingProfiles?.find(p => p.id === firstId);
      if (exportingM && exportingM.imageCenter) {
        return exportingM.imageCenter;
      }
      const normalM = targetProfiles.find(p => p.id === firstId);
      if (normalM && normalM.imageCenter) {
        return normalM.imageCenter;
      }
    }
    return "";
  };

  // PDF Export logic for multiple boards together
  const handleExportMultiPDF = async (paperSize: "A4" | "A3") => {
    if (selectedModelIds.length === 0) {
      showNotification("Seleziona almeno un profilo da includere nel file multi-scheda!", "error");
      return;
    }

    setIsExportingMulti(true);
    showNotification(`Inizio esportazione di ${selectedModelIds.length} schede in ${paperSize}...`, "info");
    setExportProgress(`Generazione catalogo in corso...`);

    try {
      console.log(`[Multi-PDF Export] Inizio esportazione per ${selectedModelIds.length} schede con gestisciDownloadCatalogo...`);
      const targetProfiles = localProfiles.length > 0 ? localProfiles : SAMPLE_MODELS;
      const selectedModels = targetProfiles.filter(p => selectedModelIds.includes(p.id));

      await gestisciDownloadCatalogo(
        selectedModels,
        agency,
        (v: boolean) => setIsExportingMulti(v),
        (v: boolean) => {},
        {
          includeCover,
          includeBackCover,
          coverTitleText,
          coverSubtitleText,
          coverDescText,
          coverImageFile: getCoverImageSrc(),
          backCoverImageFile: backCoverImageFile || "",
          backCoverText: backCoverText || "",
          backCoverCitiesText,
          backCoverFooterText,
          fontFamily
        }
      );

      showNotification(`File PDF Multi-Scheda salvato con successo!`, "success");
    } catch (e: any) {
      console.error("🔍 DETAILED MULTI-PDF EXPORT EXCEPTION:", e);
      showNotification(`Errore di creazione catalogo PDF.`, "error");
    } finally {
      setIsExportingMulti(false);
      setExportProgress("");
    }
  };

  // Safe direct printer command with detection of sandbox iframe constraints
  const handlePrint = () => {
    try {
      const isIframe = window.self !== window.top;
      if (isIframe) {
        showNotification(
          "La stampa diretta è bloccata nell'anteprima protetta. Clicca su 'Apri in una nuova scheda' in alto a destra per stampare direttamente col browser!",
          "error"
        );
      }
      window.print();
    } catch (e) {
      console.error("Print permission error:", e);
      showNotification(
        "Stampa bloccata. Apri il sito in una nuova scheda usando l'icona in alto a destra per sbloccarla, oppure scarica il PDF!",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      
      {/* Top Navigation / App Title Bar */}
      <header className="bg-white border-b border-slate-100 py-3 px-6 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-center">
            <Layers size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              COSMOPOLITAN AGENZIA
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Model Composite Landscape Studio (A4)</p>
          </div>
        </div>

        {/* Toggle Form and Studio Badge Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowForm(!showForm);
              showNotification(
                showForm 
                  ? "Pannello compilazione nascosto!" 
                  : "Pannello compilazione mostrato!", 
                "info"
              );
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
              showForm 
                ? "text-slate-700 bg-slate-100 hover:bg-slate-200" 
                : "text-white bg-indigo-600 hover:bg-indigo-700"
            }`}
            title={showForm ? "Nascondi pannello di compilazione" : "Mostra pannello di compilazione"}
          >
            {showForm ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showForm ? "Nascondi Editor" : "Mostra Editor"}</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Studio Mode</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Editor (5 Cols on Large View) */}
        {showForm && (
          <div className="lg:col-span-5 h-full">
            <ModelForm
              model={model}
              onChangeModel={setModelWithHistory}
              agency={agency}
              onChangeAgency={setAgency}
              title={title}
              onChangeTitle={setTitle}
              presets={SAMPLE_MODELS}
              onSelectPreset={handleSelectPreset}
              themeColor={themeColor}
              onSelectThemeColor={setThemeColor}
              fontFamily={fontFamily}
              onSelectFontFamily={setFontFamily}
              onClearForm={handleClearForm}
              localProfiles={localProfiles}
              onSaveLocal={handleSaveLocal}
              onDeleteLocal={handleDeleteLocal}
              onDuplicateLocal={handleDuplicateLocal}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              showMultiExport={showMultiExport}
              onToggleMultiExport={setShowMultiExport}
            />
          </div>
        )}

        {/* Right Column: Dynamic Preview Panel (7 Cols on Large View, 12 if screen is expanded) */}
        <div className={`${showForm ? "lg:col-span-7" : "lg:col-span-12"} flex flex-col items-center gap-6 transition-all duration-300`}>
          
          {/* Conditional warning if rendered within an iframe, providing direct pop-out access to guarantee successful downloads on iOS/Safari/Chrome */}
          {typeof window !== "undefined" && window.self !== window.top && showIframeWarning && (
            <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-left flex items-start gap-3 shadow-2xs">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 font-medium">
                <span className="text-xs font-bold text-amber-900 block">⚠️ Restrizione di Sicurezza Browser (iFrame Rilevato)</span>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Ti trovi all'interno dell'anteprima integrata e protetta del software. A causa delle restrizioni di sicurezza del browser sull'iFrame, l'esportazione di file PDF o JPG potrebbe venire bloccata senza scaricare nulla.
                  <strong className="block mt-1 font-semibold text-amber-900">
                    Soluzione infallibile: Clicca sul pulsante qui sotto per aprire il software a schermo intero in una nuova pagina web sicura, dove l'esportazione e tutti i download funzionano perfettamente al 100%!
                  </strong>
                </p>
                <button
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="mt-2 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-2 px-4 rounded-xl shadow-xs transition-all pointer-events-auto cursor-pointer"
                >
                  <ExternalLink size={12} />
                  Apri in Nuova Scheda per Scaricare PDF
                </button>
              </div>
            </div>
          )}

          {/* Main Action Controllers (Print & PDF Exports) */}
          <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Download size={14} className="text-indigo-600" />
                  Opzioni di Esportazione
                </h3>
                <p className="text-[11px] text-slate-500">Salva in alta risoluzione pronta per la stampa o l'invio via e-mail.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={gestisciDownloadComposit}
                  className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Genera documento PDF basato sulle esatte proporzioni della scheda tecnica"
                >
                  <Download size={13} />
                  Scarica PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Stampa diretta con stili tipografici per foglio A4 orizzontale"
                >
                  <Printer size={13} />
                  Stampa
                </button>
              </div>
            </div>

            {/* Support and Info Toggles */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-150">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Strumenti di Aiuto:</span>
              
              {typeof window !== "undefined" && window.self !== window.top && (
                <button
                  type="button"
                  onClick={() => {
                    setShowIframeWarning(!showIframeWarning);
                    showNotification(
                      showIframeWarning ? "Avviso iFrame nascosto" : "Avviso iFrame visibile",
                      "info"
                    );
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    showIframeWarning
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <AlertCircle size={11} className={showIframeWarning ? "text-amber-600" : "text-slate-400"} />
                  {showIframeWarning ? "Nascondi Avviso iFrame" : "Mostra Avviso iFrame"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowQuickGuide(!showQuickGuide);
                  showNotification(
                    showQuickGuide ? "Guida rapida nascosta" : "Guida rapida visibile",
                    "info"
                  );
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  showQuickGuide
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Info size={11} className={showQuickGuide ? "text-indigo-600" : "text-slate-400"} />
                {showQuickGuide ? "Nascondi Guida Piattaforma" : "Mostra Guida Piattaforma"}
              </button>
            </div>
          </div>

          {/* MULTI_CARD PDF COMPILER */}
          {showMultiExport && (
            <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-655 font-bold" />
                    Esportazione Multi-Scheda (Catalogo)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Seleziona i profili dal database locale per generare un unico file PDF multi-pagina.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedModelIds((localProfiles.length > 0 ? localProfiles : SAMPLE_MODELS).map(p => p.id))}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Seleziona Tutti
                  </button>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedModelIds([])}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
                  >
                    Deseleziona
                  </button>
                </div>
              </div>

              {(localProfiles.length === 0) ? (
                <p className="text-[11px] text-slate-400 italic text-center py-2">
                  Nessun profilo caricato nel database locale.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Checkbox selector list */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar-y">
                    {localProfiles.map((p) => {
                      const isChecked = selectedModelIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`group relative flex items-center justify-between p-1.5 rounded-xl border text-left transition-all ${
                            isChecked 
                              ? "bg-slate-900 border-slate-950 text-white shadow-xs" 
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                          }`}
                        >
                          <label className="flex items-center gap-2 flex-1 cursor-pointer select-none min-w-0 py-1 pl-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedModelIds(prev => [...prev, p.id]);
                                } else {
                                  setSelectedModelIds(prev => prev.filter(id => id !== p.id));
                                }
                              }}
                              className="rounded text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                            />
                            <div className="truncate flex-1">
                              <span className="text-xs font-bold block truncate">{p.name || "Senza Nome"}</span>
                              <span className={`text-[9px] font-mono block ${isChecked ? "text-slate-300" : "text-slate-400"}`}>
                                {p.height ? `${p.height}cm` : "—"} • {p.eyes || "—"}
                              </span>
                            </div>
                          </label>
                          {deleteConfirmId === p.id ? (
                            <div className="flex items-center gap-1 z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteLocal(p.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-[9px] text-white rounded font-bold uppercase transition"
                                title="Conferma"
                              >
                                sì
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 bg-slate-500 hover:bg-slate-600 text-[9px] text-white rounded font-bold uppercase transition"
                                title="Annulla"
                              >
                                no
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteConfirmId(p.id);
                              }}
                              className={`p-1.5 rounded-lg transition-all ${
                                isChecked
                                  ? "text-red-400 hover:text-red-350 hover:bg-white/15"
                                  : "text-red-500 hover:text-red-700 hover:bg-red-50"
                              } md:opacity-0 md:group-hover:opacity-100 focus:opacity-100`}
                              title="Elimina definitiva questa scheda"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* COPERTINE ESTENSION CATALOGO OPTIONS */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-left">
                      Estensioni Catalogo (Impaginazione)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200/50 rounded-xl p-2.5 text-left">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeCover}
                          onChange={(e) => setIncludeCover(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                        />
                        <div className="leading-tight">
                          <span className="text-[11px] font-bold text-slate-700 block">Intro Copertina</span>
                          <span className="text-[9px] text-slate-400">Copertina iniziale con foto e brand</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeBackCover}
                          onChange={(e) => setIncludeBackCover(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                        />
                        <div className="leading-tight">
                          <span className="text-[11px] font-bold text-slate-700 block">Copertina Chiusura</span>
                          <span className="text-[9px] text-slate-400">Contatti finali e loghi social</span>
                        </div>
                      </label>
                    </div>

                    {includeCover && (
                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-left space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Titolo Principale</label>
                            <input
                              type="text"
                              value={coverTitleText}
                              onChange={(e) => setCoverTitleText(e.target.value)}
                              className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              placeholder="es. BOOK MODELLO"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Sottotitolo</label>
                            <input
                              type="text"
                              value={coverSubtitleText}
                              onChange={(e) => setCoverSubtitleText(e.target.value)}
                              className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              placeholder="es. SPRING / SUMMER"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase">Descrizione Copertina</label>
                          <textarea
                            value={coverDescText}
                            onChange={(e) => setCoverDescText(e.target.value)}
                            rows={2}
                            className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            placeholder="Raccolta dei composit..."
                          />
                        </div>

                        <div className="space-y-1.5 border-t border-slate-250 pt-2.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Foto Copertina</label>
                          <div className="flex items-center gap-3">
                            {coverImageFile ? (
                              <div className="relative h-12 w-12 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0">
                                <img src={coverImageFile} alt="cover preview" className="h-full w-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setCoverImageFile("")}
                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center flex-shrink-0 italic font-mono uppercase">
                                Auto
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                id="cover-upload-input"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.type === "application/pdf") {
                                      showNotification("Sintesi e conversione PDF in corso...", "info");
                                      try {
                                        const b64 = await convertPdfToImage(file);
                                        setCoverImageFile(b64);
                                        showNotification("PDF convertito e impostato come sfondo copertina!", "success");
                                      } catch (err: any) {
                                        showNotification("Impossibile convertire il PDF: " + err.message, "error");
                                      }
                                    } else {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const result = reader.result as string;
                                        setCoverImageFile(result);
                                        showNotification("Sfondo copertina caricato con successo!", "success");
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                              <label 
                                htmlFor="cover-upload-input" 
                                className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                <FileUp size={11} className="text-slate-500" />
                                Carica foto o PDF
                              </label>
                              <p className="text-[8px] text-slate-400 mt-1 leading-tight">
                                Carica foto (PNG/JPG) o un documento PDF. Se lasci vuoto, userà la foto centrale della prima scheda.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {includeBackCover && (
                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-left space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase">Messaggio finale di ringraziamento</label>
                          <textarea
                            value={backCoverText}
                            onChange={(e) => setBackCoverText(e.target.value)}
                            rows={2}
                            className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            placeholder="es. Grazie per la visione. Per prenotazioni o contatti..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Città in evidenza</label>
                            <input
                              type="text"
                              value={backCoverCitiesText}
                              onChange={(e) => setBackCoverCitiesText(e.target.value)}
                              className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              placeholder="es. MILANO • PARIGI • LONDRA"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Piè di pagina (Footer)</label>
                            <input
                              type="text"
                              value={backCoverFooterText}
                              onChange={(e) => setBackCoverFooterText(e.target.value)}
                              className="w-full text-[11px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              placeholder="es. GRAZIE PER L'ATTENZIONE"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t border-slate-250 pt-2.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Sfondo Copertina Chiusura</label>
                          <div className="flex items-center gap-3">
                            {backCoverImageFile ? (
                              <div className="relative h-12 w-12 rounded-lg bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0">
                                <img src={backCoverImageFile} alt="back cover preview" className="h-full w-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setBackCoverImageFile("")}
                                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 transition"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 text-center flex-shrink-0 italic font-mono uppercase">
                                Auto
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                id="back-cover-upload-input"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    if (file.type === "application/pdf") {
                                      showNotification("Sintesi e conversione PDF in corso...", "info");
                                      try {
                                        const b64 = await convertPdfToImage(file);
                                        setBackCoverImageFile(b64);
                                        showNotification("PDF convertito e impostato come sfondo di chiusura!", "success");
                                      } catch (err: any) {
                                        showNotification("Impossibile convertire il PDF: " + err.message, "error");
                                      }
                                    } else {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        const result = reader.result as string;
                                        setBackCoverImageFile(result);
                                        showNotification("Sfondo copertina chiusura caricato con successo!", "success");
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                              />
                              <label 
                                htmlFor="back-cover-upload-input" 
                                className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-[11px] font-bold text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                <FileUp size={11} className="text-slate-500" />
                                Carica foto o PDF
                              </label>
                              <p className="text-[8px] text-slate-400 mt-1 leading-tight">
                                Carica foto (PNG/JPG) o un documento PDF. Sarà renderizzato come background eleganti nella chiusura.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PDF generation feedback */}
                  {isExportingMulti && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-2.5 flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 animate-pulse">
                        {exportProgress}
                      </span>
                    </div>
                  )}

                  {/* Download Actions for Multi Card PDF */}
                  <div className="mt-1">
                    <button
                      type="button"
                      disabled={isExportingMulti || selectedModelIds.length === 0}
                      onClick={() => handleExportMultiPDF("A4")}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Crea un unico PDF con tutte le schede selezionate in formato A4"
                    >
                      <Download size={14} />
                      Scarica Catalogo PDF (A4) ({selectedModelIds.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Screen Scaling and View controls - vital for MAC, IPAD & IPHONE */}
          <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="text-slate-500">
                {previewScale <= 0.4 ? <Smartphone size={16} /> : previewScale <= 0.7 ? <Tablet size={16} /> : <Laptop size={16} />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Scala Anteprima</span>
                <span className="text-[10px] text-slate-400">Modifica visualizzazione per adattare allo schermo</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Manual Toggles */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-[10px] font-semibold text-slate-600">
                <button 
                  onClick={() => { setAutoScale(false); setPreviewScale(0.33); }}
                  className={`px-2 py-1 rounded-md ${previewScale === 0.33 && !autoScale ? "bg-white text-slate-900 shadow-3xs" : ""}`}
                >
                  iPhone
                </button>
                <button 
                  onClick={() => { setAutoScale(false); setPreviewScale(0.68); }}
                  className={`px-2 py-1 rounded-md ${previewScale === 0.68 && !autoScale ? "bg-white text-slate-900 shadow-3xs" : ""}`}
                >
                  iPad
                </button>
                <button 
                  onClick={() => { setAutoScale(false); setPreviewScale(0.85); }}
                  className={`px-2 py-1 rounded-md ${previewScale === 0.85 && !autoScale ? "bg-white text-slate-900 shadow-3xs" : ""}`}
                >
                  Desktop
                </button>
                <button 
                  onClick={() => setAutoScale(true)}
                  className={`px-2 py-1 rounded-md ${autoScale ? "bg-slate-900 text-white shadow-3xs" : ""}`}
                >
                  Auto ({Math.round(previewScale * 100)}%)
                </button>
              </div>

              {/* Slider adjustment */}
              <input
                type="range"
                min="0.3"
                max="1.2"
                step="0.01"
                value={previewScale}
                onChange={(e) => {
                  setAutoScale(false);
                  setPreviewScale(parseFloat(e.target.value));
                }}
                className="w-24 accent-slate-900 hidden sm:block"
              />
            </div>
          </div>

          {/* Actual Scaled Card Preview viewport */}
          <div className="w-full flex justify-center items-center overflow-auto py-8 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner no-scrollbar min-h-[420px]">
            <div 
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "center center",
                width: "297mm",
                height: "210mm",
                margin: `calc((210mm * (${previewScale} - 1)) / 2) calc((297mm * (${previewScale} - 1)) / 2)`,
                transition: "transform 0.15s ease-out",
              }}
              className="flex-shrink-0"
            >
              <ModelCard
                model={model}
                agency={agency}
                title={title}
                themeColor={themeColor}
                fontFamily={fontFamily}
              />
            </div>
          </div>

          {/* Guidelines and instructions footer card */}
          {showQuickGuide && (
            <div className="w-full bg-slate-100 rounded-xl p-4 text-slate-500 text-[11px] space-y-2.5 border border-slate-200/50">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Info size={12} className="text-amber-500" />
                Guida Rapida all'Uso della Piattaforma
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Modifica Istantanea</strong>: Cambia i dati fisici come altezza, seno, vita, fianchi, capelli o scarpe. Il composit si aggiorna istantaneamente.</li>
                <li><strong>Mantiene le Proporzioni</strong>: Qualsiasi fotografia tu carichi viene posizionata elegantemente nel rispettivo riquadro senza distorsioni o allungamenti.</li>
                <li><strong>Allineamento Manuale</strong>: Nella scheda <em>"Allinea Foto"</em>, regola il livello di Zoom e sposta l'inquadratura orizzontalmente o verticalmente per centrare perfettamente il volto dei tuoi modelli.</li>
                <li><strong>Database Locale</strong>: Salva più schede tecniche simultaneamente! Puoi recuperarle in qualsiasi momento sul tuo dispositivo semplicemente cliccando il loro nome.</li>
                <li className="text-amber-800">
                  <strong>Risoluzione errori PDF ed Estensioni</strong>: Se riscontri errori durante il download del PDF, controlla questi fattori:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[10px] text-slate-600">
                    <li><strong>Estensione Immagine (es. HEIC da iPhone)</strong>: I browser web non supportano nativamente il formato HEIC dei moderni iPhone, o formati RAW/TIFF. Assicurati che le foto siano in formati web standard come <strong>JPG, JPEG, PNG o WEBP</strong>.</li>
                    <li><strong>Blocco CORS (Incolla da URL)</strong>: Se inserisci link di foto presi da siti web esterni, i browser ne bloccano la generazione PDF per sicurezza (CORS). Risolvi sempre caricando le foto con il tasto <strong>"Sfoglia / Carica"</strong> dal tuo dispositivo (le converte in Base64 locale e sicuro).</li>
                    <li><strong>Peso delle Foto</strong>: Foto grezze molto pesanti (es. scattate da fotocamere reflex professionali e non compresse, &gt; 10MB) possono saturare la memoria del browser. Consigliamo di salvarle in qualità ottimizzata per il web.</li>
                  </ul>
                </li>
              </ul>
            </div>
          )}

        </div>

      </main>

      {/* Slide-in Notifications Toast */}
      {notification.visible && (
        <div 
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 py-3 px-5 rounded-xl shadow-lg border transition-all duration-300 transform scale-100 translate-y-0 ${
            notification.type === "success" 
              ? "bg-slate-900 border-emerald-500/30 text-white" 
              : notification.type === "error"
              ? "bg-red-950 border-red-500/30 text-red-100"
              : "bg-slate-900 border-slate-800 text-slate-100"
          }`}
        >
          {notification.type === "success" ? (
            <div className="bg-emerald-500 text-white p-1 rounded-full"><Check size={12} /></div>
          ) : (
            <div className="bg-amber-500 text-slate-950 p-1 rounded-full"><AlertCircle size={12} /></div>
          )}
          <span className="text-xs font-semibold tracking-wide">{notification.message}</span>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-100 py-3 text-center text-[10px] text-slate-400 mt-auto">
        <span>© {new Date().getFullYear()} Cosmopolitan Agenzia Moda. Sviluppato per Mac, iPad e iPhone.</span>
      </footer>

      {/* Hidden Div for exporting multi-composit page capturing */}
      {(selectedModelIds.length > 0 || includeCover || includeBackCover) && (
        <div id="hidden-multi-cards" className="absolute left-[-9999px] top-0 overflow-hidden pointer-events-none" style={{ width: "297mm" }}>
          
          {/* COVER PAGE (Intro) */}
          {includeCover && (
            <div id="multi-cover-page" style={{ width: "297mm", height: "210mm" }} className="bg-slate-950 text-white p-0 overflow-hidden relative font-sans flex text-left">
              {/* Left side: Cover photo (60% width) */}
              <div className="w-[60%] h-full relative overflow-hidden bg-slate-900 flex items-center justify-center border-r border-slate-800">
                {getCoverImageSrc() ? (
                  <img src={getCoverImageSrc()} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-slate-600 text-xs text-center p-8 uppercase tracking-widest font-mono">
                    <Layers size={40} className="mx-auto mb-4 text-slate-700 animate-pulse" />
                    Nessuna Foto Copertina
                  </div>
                )}
                {/* Elegant subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-950/45"></div>
              </div>
              
              {/* Right side: Editorial text and info (40% width) */}
              <div className="w-[40%] h-full bg-slate-950 p-12 flex flex-col justify-between relative">
                {/* Top Header BRAND */}
                <div className="space-y-3 border-b border-white/10 pb-6">
                  {(exportingAgency?.logo || agency.logo) ? (
                    <img src={exportingAgency?.logo || agency.logo || ""} alt="Logo" className="max-h-[35px] max-w-full object-contain mb-2" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-sm font-black tracking-[0.25em] uppercase">
                      {agency.name || "COSMOPOLITAN AGENCY"}
                    </span>
                  )}
                  <p className="text-[9px] tracking-[0.3em] text-indigo-400 font-bold uppercase font-mono">
                    {agency.city || "ITALY"} • {agency.portfolioDate || "PORTFOLIO"}
                  </p>
                </div>

                {/* Giant Title Middle */}
                <div className="my-auto space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 block font-mono">
                    {coverSubtitleText || "PROFESSIONAL CATALOG"}
                  </span>
                  <h1 className="text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-none leading-[1.1]" style={{ fontFamily: fontFamily === "mono" ? "JetBrains Mono" : "Inter" }}>
                    {coverTitleText || "FASHION BOOK"}
                  </h1>
                  <div className="h-[2.5px] w-12 bg-white"></div>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                    {coverDescText}
                  </p>
                </div>

                {/* Bottom contact line */}
                <div className="space-y-4 border-t border-white/10 pt-6 text-[10px] text-slate-400 font-mono">
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-white uppercase tracking-wider text-[11px]">{agency.name || "COSMOPOLITAN"}</p>
                    <p className="truncate opacity-80">{agency.address} - {agency.city}</p>
                    <p className="opacity-80">{agency.web} • {agency.email}</p>
                  </div>

                  {/* Social handles mini list */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                    {agency.instagram && (
                      <span className="flex items-center gap-1 font-mono uppercase text-[9px] text-indigo-300">
                        <Instagram size={10} /> @{agency.instagram}
                      </span>
                    )}
                    {agency.whatsapp && (
                      <span className="flex items-center gap-1 font-mono uppercase text-[9px] text-emerald-400">
                        <Smartphone size={10} /> {agency.whatsapp}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHOSEN MODEL COMPOSITS */}
          {selectedModelIds.map((mId) => {
            // Prefer the Base64 converted exportingProfiles if available
            let m = exportingProfiles?.find(p => p.id === mId);
            if (!m) {
              m = (localProfiles.length > 0 ? localProfiles : SAMPLE_MODELS).find(p => p.id === mId);
            }
            if (!m) return null;
            return (
              <div key={m.id} id={`multi-card-${m.id}`} style={{ width: "297mm", height: "210mm" }} className="bg-white p-0 overflow-hidden relative">
                <ModelCard
                  id={`multi-composit-card-${m.id}`}
                  model={m}
                  agency={exportingAgency || agency}
                  title={title}
                  themeColor={themeColor}
                  fontFamily={fontFamily}
                />
              </div>
            );
          })}

          {/* BACK COVER PAGE */}
          {includeBackCover && (
            <div id="multi-back-cover-page" style={{ width: "297mm", height: "210mm" }} className="bg-slate-900 text-white overflow-hidden relative font-sans flex flex-col justify-between items-center text-center p-16">
              {/* Elegant central layout */}
              <div className="my-auto max-w-2xl space-y-8">
                <div className="flex justify-center mb-6">
                  {(exportingAgency?.logo || agency.logo) ? (
                    <img src={exportingAgency?.logo || agency.logo || ""} alt="Logo" className="max-h-[50px] max-w-full object-contain filter invert brightness-200" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl font-black tracking-[0.4em] uppercase">
                      {agency.name || "COSMOPOLITAN"}
                    </span>
                  )}
                </div>

                <p className="text-xs tracking-[0.35em] text-slate-400 uppercase font-mono">
                  {backCoverCitiesText}
                </p>

                <div className="h-[1px] w-24 bg-white/20 mx-auto"></div>

                {backCoverText && (
                  <p className="text-sm italic text-slate-200 font-serif leading-relaxed max-w-xl mx-auto py-1">
                    "{backCoverText}"
                  </p>
                )}

                <div className="space-y-3 font-mono text-[11px] text-slate-300 font-bold">
                  <p className="text-sm font-bold text-white tracking-wider uppercase pr-1">{agency.name || "COSMOPOLITAN AGENCY"}</p>
                  <p>{agency.address ? `${agency.address}, ` : ""}{agency.city || ""}</p>
                  <p>Sito web: <span className="text-indigo-300">{agency.web || "www.example.com"}</span> • Email: <span className="text-indigo-300">{agency.email || "info@example.com"}</span></p>
                  {agency.phone && <p>Telefono: <span className="text-slate-100">{agency.phone}</span></p>}
                </div>

                {/* Row of social badges */}
                <div className="flex justify-center gap-6 pt-4">
                  {agency.instagram && (
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono text-indigo-200">
                      <Instagram size={12} />
                      <span>@{agency.instagram}</span>
                    </div>
                  )}
                  {agency.whatsapp && (
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-300">
                      <Smartphone size={12} />
                      <span>{agency.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom luxury signature */}
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-mono">
                {backCoverFooterText} {new Date().getFullYear()}
              </div>
            </div>
          )}

        </div>
      )}

      {/* GORGEOUS EXPORT PREVIEW MODAL OVERLAY (Bypasses iframe download sandbox restrictions seamlessly) */}
      {isExportOverlayOpen && exportedImageUrl && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300"
          id="export-dialog-container"
          onClick={(e) => {
            if (e.target === document.getElementById("export-dialog-container")) {
              setIsExportOverlayOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-full">
                  <ExternalLink size={16} />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">Composit Generata con Successo!</h3>
                  <p className="text-[9px] text-slate-500 font-mono select-all truncate max-w-[280px] sm:max-w-[380px]">{exportedFileName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportOverlayOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                title="Chiudi"
                id="close-export-dialog-btn"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center gap-5">
              {/* Alert advice badge */}
              <div className="w-full bg-amber-50/70 border border-amber-200/50 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-left">
                  <span className="text-[11px] font-bold text-amber-950 block">⚠️ RESTRIZIONI DI SCARICAMENTO DELL'ANTENNA (iFrame)</span>
                  <span className="text-[10px] text-amber-900 leading-relaxed block mt-1">
                    I browser moderni proteggono l'utente limitando i download automatici eseguiti da finestre integrate (iFrame).
                    Nessun problema! Puoi salvare la tua composizione in qualità HD in un istante:
                  </span>
                  <ul className="text-[10px] text-amber-950 list-disc ml-4 mt-2 space-y-1">
                    <li><strong>Da Computer (PC/Mac):</strong> Fai click destro sulla scheda in basso e seleziona <strong>"Salva immagine con nome..."</strong>.</li>
                    <li><strong>Da Smartphone / Tablet:</strong> Tieni premuto molto a lungo sulla scheda in basso e seleziona <strong>"Aggiungi a Foto"</strong> o <strong>"Scarica file"</strong>.</li>
                    <li><strong>Alternativa:</strong> Clicca sull'icona <strong>"Apri in una nuova scheda"</strong> (in alto a destra in questa applicazione) per sbloccare i download automatici ordinari del browser!</li>
                  </ul>
                </div>
              </div>

              {/* High-definition Image Render Box */}
              <div className="relative group border-4 border-slate-100 shadow-md rounded-2xl bg-slate-50 overflow-hidden w-full max-w-[540px] aspect-[1.414] flex items-center justify-center hover:border-indigo-100 transition-all">
                <img
                  src={exportedImageUrl}
                  alt="Esportazione Finale Composit"
                  className="w-full h-full object-contain select-all cursor-pointer"
                  title="Fai click destro o tieni premuto a lungo per salvare l'immagine sul tuo dispositivo!"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating guide hint */}
                <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all p-4 pointer-events-none text-center">
                  <span className="text-white text-[10px] font-bold tracking-wider uppercase font-mono bg-slate-950/80 px-4 py-2 rounded-xl backdrop-blur-xs">
                    💡 Click Destro o Trazione Prolungata per Salvare
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setIsExportOverlayOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
              >
                Chiudi
              </button>
              
              <a
                href={exportedImageUrl}
                download={exportedFileName}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                id="modal-force-download-link"
              >
                <Download size={14} />
                Forza Download Standard
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
