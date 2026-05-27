import React from "react";
import { ModelData, AgencyInfo } from "../types";

interface ModelCardProps {
  model: ModelData;
  agency: AgencyInfo;
  title: string;
  themeColor: "silver" | "charcoal" | "beige" | "gold" | "white";
  fontFamily: "serif" | "display" | "sans";
  id?: string;
}

interface CardImageProps {
  src: string;
  alt: string;
  zoom: number | undefined;
  offsetX: number | undefined;
  offsetY: number | undefined;
}

const CardImage: React.FC<CardImageProps> = ({ src, alt, zoom, offsetX, offsetY }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = src;
  }, [src]);

  const activeZoom = (zoom !== undefined && !isNaN(zoom)) ? zoom : 100;
  const activeOffsetX = (offsetX !== undefined && !isNaN(offsetX)) ? offsetX : 50;
  const activeOffsetY = (offsetY !== undefined && !isNaN(offsetY)) ? offsetY : 50;

  const scale = activeZoom / 100;
  const isContain = activeZoom < 100;

  let bgSizeStyle = "cover";
  let bgPositionStyle = `${activeOffsetX}% ${activeOffsetY}%`;

  if (dimensions.width > 0 && dimensions.height > 0 && aspectRatio !== null) {
    const containerRatio = dimensions.width / dimensions.height;
    let wImg = 0;
    let hImg = 0;

    if (!isContain) {
      if (aspectRatio > containerRatio) {
        hImg = dimensions.height * scale;
        wImg = hImg * aspectRatio;
      } else {
        wImg = dimensions.width * scale;
        hImg = wImg / aspectRatio;
      }
    } else {
      if (aspectRatio > containerRatio) {
        wImg = dimensions.width * scale;
        hImg = wImg / aspectRatio;
      } else {
        hImg = dimensions.height * scale;
        wImg = hImg * aspectRatio;
      }
    }

    bgSizeStyle = `${wImg}px ${hImg}px`;
  }

  const escapedSrc = src ? src.replace(/"/g, '\\"') : "";

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className="absolute inset-0 select-none bg-no-repeat w-full h-full bg-center"
      style={{
        backgroundImage: src ? `url("${escapedSrc}")` : undefined,
        backgroundSize: bgSizeStyle,
        backgroundPosition: bgPositionStyle,
        transition: "background-size 0.05s ease-out, background-position 0.05s ease-out",
      }}
    />
  );
};

// Pure, high-fidelity vector representation of the official Cosmopolitan brand logo
const CosmopolitanTextLogo: React.FC = () => {
  // Split "modaeventipubblicitàcomunicazione" into individual characters with their respective colors
  const subtitleChars = [
    ...("moda".split("").map(char => ({ char, color: "text-[#b11030]" }))),
    ...("eventi".split("").map(char => ({ char, color: "text-black" }))),
    ...("pubb".split("").map(char => ({ char, color: "text-[#b11030]" }))),
    ...("licitàcomunicazione".split("").map(char => ({ char, color: "text-black" })))
  ];

  return (
    <div className="flex flex-col select-none pointer-events-none flex-shrink-0 text-left w-fit" style={{ fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className="text-[26px] leading-none flex items-center select-none font-light tracking-[0.03em]" style={{ fontWeight: 300 }}>
        <span className="text-black uppercase">COSMO</span>
        <span className="text-[#b11030] uppercase">POLITAN</span>
      </div>
      <div className="w-full flex justify-between text-[7px] leading-none mt-1 select-none font-light" style={{ fontWeight: 300 }}>
        {subtitleChars.map((item, index) => (
          <span key={index} className={`${item.color} lowercase`}>
            {item.char}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  agency,
  title,
  themeColor,
  fontFamily,
  id = "composit-card",
}) => {
  // Theme color mapping
  const bgThemes = {
    silver: "bg-[#e2e8f0]", // slate-200
    charcoal: "bg-[#334155]", // slate-700
    beige: "bg-[#f5f5dc] border border-[#e4e4cd]", // classic vintage
    gold: "bg-[#faf7f0] border border-[#e6dfd1]", // champagne / warm ivory
    white: "bg-white border border-[#e2e8f0]",
  };

  const textThemes = {
    silver: "text-slate-800",
    charcoal: "text-slate-100",
    beige: "text-amber-950",
    gold: "text-stone-800",
    white: "text-neutral-800",
  };

  const labelThemes = {
    silver: "text-slate-500",
    charcoal: "text-slate-400",
    beige: "text-amber-800/80",
    gold: "text-stone-500",
    white: "text-neutral-500",
  };

  // Font family mapping
  const fontStyles = {
    serif: "font-serif",
    display: "font-display",
    sans: "font-sans",
  };

  // Helper to determine crossOrigin safely
  const getCrossOrigin = (src: string | undefined): "anonymous" | undefined => {
    if (!src) return undefined;
    if (src.startsWith("data:") || src.startsWith("blob:")) return undefined;
    return "anonymous";
  };

  // Helper to render image inline styling with robust zoom & offset controls
  const getImageStyle = (zoom: number | undefined, offsetX: number | undefined, offsetY: number | undefined) => {
    // Allows zoom/scale below 100% (min 30%) to enable rimpicciolire/shrinking of oversized views
    const activeZoom = (zoom !== undefined && !isNaN(zoom)) ? zoom : 100;
    const activeOffsetX = (offsetX !== undefined && !isNaN(offsetX)) ? offsetX : 50;
    const activeOffsetY = (offsetY !== undefined && !isNaN(offsetY)) ? offsetY : 50;

    // Scale representation (e.g. 100% -> 1.0, 30% -> 0.3)
    const scale = activeZoom / 100;
    
    // We use CSS object-position to shift the underlying photo inside the crop container
    // and fixed scale around center center to zoom in/out cleanly. This decouples the panning
    // from the zoom focal point, allowing smooth, predictable horizontal & vertical shifting regardless of aspect ratio!
    // Switch to "contain" when zoom < 100 so the portrait photo fits entirely inside 
    // the wide container without physical top/bottom cropping. 100% or above uses "cover"
    // to fill the entire container beautifully.
    const isContain = activeZoom < 100;

    return {
      objectFit: (isContain ? "contain" : "cover") as "contain" | "cover",
      objectPosition: `${activeOffsetX}% ${activeOffsetY}%`,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
      transition: "transform 0.1s ease-out, object-position 0.1s ease-out",
    };
  };

  const layout = model.layout || "classic";

  return (
    <div
      id={id}
      className={`print-container bg-white relative flex flex-col justify-between select-none overflow-hidden ${fontStyles[fontFamily]}`}
      style={{
        width: "297mm",
        height: "210mm",
        padding: "8mm 12mm", // Precise A4 Margins to fit A4 perfectly
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        boxSizing: "border-box",
        border: "1px solid rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* High Density Elegant Header Bar */}
      <header className="flex justify-between items-start pb-4 border-b-2 border-black w-full">
        <div className="flex flex-col items-start text-left gap-2.5">
          {/* Brand Logo integration */}
          {agency.logo ? (
            <img 
              src={agency.logo} 
              alt="Brand Logo" 
              className="h-10 w-auto object-contain flex-shrink-0 max-w-[170px]"
              referrerPolicy="no-referrer"
              crossOrigin={getCrossOrigin(agency.logo)}
            />
          ) : (
            <CosmopolitanTextLogo />
          )}

          <div className="flex flex-col">
            <h2 className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-800 mb-1 leading-none">
              {title || "PORTRAIT / THREE-QUARTERS / FULL BODY MODELS"}
            </h2>
            <p className="text-[9px] leading-tight text-slate-500 font-mono uppercase tracking-wider mt-0.5">
              {agency.name} • MODELLI ITALIA • TEL. {agency.phone || "333.59.64.357"}<br />
              {agency.address} • {agency.city}<br />
              <a href={`mailto:${agency.email || "info@cosmopolitanagency.it"}`} className="text-blue-600 hover:text-blue-800 underline font-semibold lowercase pointer-events-auto select-text">{agency.email || "info@cosmopolitanagency.it"}</a> • <a href={(agency.web && (agency.web.startsWith("http://") || agency.web.startsWith("https://"))) ? agency.web : `https://${agency.web || "www.cosmopolitanagency.it"}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-semibold lowercase pointer-events-auto select-text">{agency.web || "www.cosmopolitanagency.it"}</a>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end text-right">
          <h1 className="text-4xl font-serif italic tracking-tight uppercase leading-none text-slate-900 font-bold">
            {model.name || "NOME MODELLA"}
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1.5">
            Model Portfolio Index • {agency.portfolioDate || "2026/27"}
          </p>

          {/* Discreet Row of Social Logos with custom brand color styling on hover */}
          <div className="flex items-center gap-2 mt-2.5 pointer-events-auto select-none justify-end">
            {agency.instagram && (
              <a
                href={agency.instagram}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-50 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-red-500 hover:to-purple-600 text-slate-400 hover:text-white border border-slate-200 hover:border-transparent transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            )}
            {agency.whatsapp && (
              <a
                href={agency.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-50 hover:bg-[#25D366] text-slate-400 hover:text-white border border-slate-200 hover:border-transparent transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.614 1.437 5.178L2 22l4.96-1.301c1.513.824 3.213 1.258 4.953 1.258h.005C17.52 21.957 22 17.478 22 11.954c0-2.677-1.042-5.193-2.932-7.086C17.177 2.977 14.664 1.957 12.004 2z M17.41 15.013c-.296-.148-1.751-.864-2.022-.963c-.27-.099-.468-.148-.665.148c-.197.296-.764.963-.936 1.16c-.172.198-.344.223-.64.075c-.297-.148-1.25-.461-2.382-1.472c-.881-.786-1.476-1.757-1.649-2.053c-.172-.297-.018-.458.13-.605c.134-.132.297-.346.446-.519c.148-.173.197-.297.296-.495c.099-.198.05-.371-.025-.519c-.074-.148-.665-1.605-.911-2.199c-.24-.577-.483-.499-.665-.508c-.172-.008-.37-.01-.567-.01c-.197 0-.518.074-.789.371c-.27.296-1.035 1.013-1.035 2.47c0 1.458 1.059 2.866 1.207 3.064c.148.197 2.085 3.184 5.051 4.464c.705.304 1.256.486 1.685.622c.708.225 1.353.193 1.861.117c.567-.085 1.751-.716 1.998-1.408c.246-.692.246-1.284.172-1.408c-.074-.124-.27-.198-.567-.346z"/>
                </svg>
              </a>
            )}
            {agency.facebook && (
              <a
                href={agency.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-50 hover:bg-[#1877F2] text-slate-400 hover:text-white border border-slate-200 hover:border-transparent transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
            )}
            {agency.threads && (
              <a
                href={agency.threads}
                target="_blank"
                rel="noopener noreferrer"
                title="Threads"
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-50 hover:bg-black text-slate-400 hover:text-white border border-slate-200 hover:border-transparent transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M12.2 2C6.55 2 2 6.55 2 12.2s4.55 10.2 10.2 10.2c2.6 0 4.9-.96 6.7-2.55l-1.35-1.4c-1.4 1.25-3.2 2-5.35 2c-4.65 0-8.2-3.55-8.2-8.2s3.55-8.2 8.2-8.2c4.4 0 7.85 3.15 8.15 7.55c.15 2.2-.6 3.65-1.9 4.1c-.8.25-1.65-.05-2.05-.75c-.95.9-2.1 1.25-3.3 1.1c-1.85-.25-3.15-1.75-3.1-3.65c.05-1.9 1.55-3.35 3.4-3.4c1 .05 1.9.45 2.55 1.15V11c0-1.85 1.15-3.1 2.9-3.05c1.45.05 2.3.9 2.5 2.35c.4 4.55-2.6 8.5-7.75 8.5c-3.1 0-5.65-2.35-5.95-5.35h-1.9c.3 3.95 3.65 7.15 7.85 7.15c6.2 0 10.2-4.95 9.4-11.2C22.25 5 17.85 2 12.2 2zm-1.75 12.35c1-.1 1.7-.8 1.85-1.7c.15-.9-.45-1.7-1.4-1.8c-.95-.1-1.85.5-2 1.4c-.15.95.55 1.95 1.55 2.1z" />
                </svg>
              </a>
            )}
            {agency.pinterest && (
              <a
                href={agency.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                title="Pinterest"
                className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-slate-50 hover:bg-[#BD081C] text-slate-400 hover:text-white border border-slate-200 hover:border-transparent transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M12 2C6.478 2 2 6.478 2 12c0 4.17 2.555 7.73 6.195 9.176-.046-.777-.087-1.977.018-2.83.095-.77 1.61-6.83 1.61-6.83s-.413-.827-.413-2.046c0-1.92 1.11-3.35 2.494-3.35 1.176 0 1.744.883 1.744 1.94 0 1.18-.752 2.95-1.14 4.59-.326 1.374.693 2.495 2.048 2.495 2.46 0 4.127-3.13 4.127-6.86 0-2.822-1.895-4.94-5.385-4.94-3.95 0-6.425 2.936-6.425 6.243 0 1.14.334 1.956.86 2.576.24.283.273.396.186.72-.06.23-.2.83-.26 1.056-.086.33-.356.446-.653.323-1.82-.756-2.67-2.776-2.67-5.023 0-3.73 3.16-8.212 9.35-8.212 5.013 0 8.312 3.626 8.312 7.514 0 5.166-2.863 9.014-7.07 9.014-1.42 0-2.756-.764-3.21-1.636 0 0-.763 3.037-.925 3.654-.277 1.05-.83 2.094-1.346 2.906 1.037.3 2.13.463 3.264.463 5.522 0 10-4.477 10-10S17.522 2 12 2z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main 3 Sections with Images - Simulates High Density Layout */}
      <div className={`w-full flex-grow flex items-center justify-center p-1 my-1 rounded-sm transition-colors ${bgThemes[themeColor]}`}>
        <div className="w-full max-w-[273mm] flex items-end justify-center px-1 gap-[3mm]">          {/* CLASSIC 3-PHOTO LAYOUT */}
          {layout === "classic" && (
            <>
              {/* Section 1: Portrait */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                  style={{ width: "87mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Portrait Left"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Primo Piano</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Sinistra</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1">
                  PORTRAIT / PROFILE
                </span>
              </div>

              {/* Section 2: Three-Quarters */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-xl border-2 border-slate-900 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between scale-[1.01]"
                  style={{ width: "87mm", height: "128mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Center Three-quarters"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-slate-800 uppercase tracking-widest font-bold">Mezza Figura</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Centrale</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-slate-900 mt-1">
                  THREE-QUARTERS
                </span>
              </div>

              {/* Section 3: Full Body */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                  style={{ width: "87mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Right Full body"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Figura Intera</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Destra</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1">
                  FULL BODY
                </span>
              </div>
            </>
          )}

          {/* DUO 2-PHOTO LAYOUT */}
          {layout === "duo" && (
            <>
              {/* Left Photo of Duo */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                  style={{ width: "132mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Portrait Left"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Sinistra</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Sinistra</p>
                      </div>
                    )}
                    {/* Removed overlay badge for clean layout */}
                  </div>
                </div>
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1">
                  PORTRAIT / SPECIAL EDITORIAL
                </span>
              </div>

              {/* Right Photo of Duo */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-xl border-2 border-slate-900 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between scale-[1.01]"
                  style={{ width: "132mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Right Portrait"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Destra</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Destra</p>
                      </div>
                    )}
                    {/* Removed overlay badge for clean layout */}
                  </div>
                </div>
                <span className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-slate-900 mt-1">
                  FULL BODY / COMPOSIT HIGHLIGHT
                </span>
              </div>
            </>
          )}

          {/* ASYMMETRIC LEFT TALL LAYOUT */}
          {layout === "asymmetric-left" && (
            <>
              {/* Left Tall Photo */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                  style={{ width: "132mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Cover Left"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto Principale</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Sinistra</p>
                      </div>
                    )}
                    {/* Removed overlay badge for clean layout */}
                  </div>
                </div>
                <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-slate-500 mt-1">
                  EDITORIAL FEATURE
                </span>
              </div>

              {/* Right Stacked 2 Columns */}
              <div className="flex flex-col gap-[3mm]">
                {/* Top Center photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-slate-200/60 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                    style={{ width: "132mm", height: "55mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Center landscape"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-bold">Foto Centrale</p>
                          <p className="text-[9px] text-stone-400">Carica Foto Centrale</p>
                        </div>
                      )}
                      {/* Removed overlay badge for clean layout */}
                    </div>
                  </div>
                  <span className="text-[7.5px] font-medium uppercase tracking-[0.2em] text-slate-500 mt-0.5">
                    PROFILE CLOSE-UP
                  </span>
                </div>

                {/* Bottom Right photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-slate-200/60 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                    style={{ width: "132mm", height: "55mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageRight ? (
                        <CardImage
                          src={model.imageRight}
                          alt="Right landscape"
                          zoom={model.zoomRight}
                          offsetX={model.offsetXRight}
                          offsetY={model.offsetYRight}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[11px] text-stone-500 uppercase tracking-wider font-bold">Foto Destra</p>
                          <p className="text-[9px] text-stone-400">Carica Foto Destra</p>
                        </div>
                      )}
                      {/* Removed overlay badge for clean layout */}
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-800 mt-0.5">
                    ACTION / MOOD SHOT
                  </span>
                </div>
              </div>
            </>
          )}

          {/* SOLO HIGHLIGHT LAYOUT */}
          {layout === "solo" && (
            <div className="relative group flex flex-col items-center">
              <div 
                className="bg-white p-1 hover:p-1.5 shadow-2xl border-2 border-slate-950 transition-all duration-300 hover:shadow-3xl flex flex-col justify-between"
                style={{ width: "269mm", height: "125mm" }}
              >
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.imageCenter ? (
                    <CardImage
                      src={model.imageCenter}
                      alt="Solo Highlight"
                      zoom={model.zoomCenter}
                      offsetX={model.offsetXCenter}
                      offsetY={model.offsetYCenter}
                    />
                  ) : model.imageLeft ? (
                    <CardImage
                      src={model.imageLeft}
                      alt="Solo Highlight"
                      zoom={model.zoomLeft}
                      offsetX={model.offsetXLeft}
                      offsetY={model.offsetYLeft}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-[13px] text-slate-800 uppercase tracking-widest font-extrabold">Copertina Singola / Lookbook</p>
                      <p className="text-[11px] text-stone-400 mt-1.5">Carica Foto Centrale (o Sinistra) per visualizzarla in questo spazio gigante</p>
                    </div>
                  )}
                  {/* Removed overlay badge for clean layout */}
                </div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900 mt-1">
                PORTFOLIO STAR PIECE
              </span>
            </div>
          )}

          {/* GRID-4 2x2 LAYOUT (4 IMAGES) */}
          {layout === "grid-4" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 justify-center items-center">
              {/* 1. Left (Top-Left) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "132mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Grid 1"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto 1</p>
                        <p className="text-[9px] text-stone-400">Inserisci Foto Sinistra</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5">PORTRAIT SHOT</span>
              </div>

              {/* 2. Center (Top-Right) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "132mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Grid 2"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto 2</p>
                        <p className="text-[9px] text-stone-400">Inserisci Foto Centro</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5">DETAIL SHOT</span>
              </div>

              {/* 3. Right (Bottom-Left) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "132mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Grid 3"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto 3</p>
                        <p className="text-[9px] text-stone-400">Inserisci Foto Destra</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5">FULL LENGTH</span>
              </div>

              {/* 4. Image4 (Bottom-Right) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "132mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.image4 ? (
                      <CardImage
                        src={model.image4}
                        alt="Grid 4"
                        zoom={model.zoom4}
                        offsetX={model.offsetX4}
                        offsetY={model.offsetY4}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto 4</p>
                        <p className="text-[9px] text-stone-400">Inserisci Foto 4</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5">MOOD SHOT</span>
              </div>
            </div>
          )}

          {/* GRID-6 3x2 LAYOUT (6 IMAGES) */}
          {layout === "grid-6" && (
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-2.5 justify-center items-center">
              {/* 1. Left (Top-Left) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Grid 6 - 1"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto 1</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">PORTRAIT A</span>
              </div>

              {/* 2. Center (Top-Center) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Grid 6 - 2"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto 2</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">PORTRAIT B</span>
              </div>

              {/* 3. Right (Top-Right) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Grid 6 - 3"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto 3</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">DETAIL SHOT</span>
              </div>

              {/* 4. Image4 (Bottom-Left) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.image4 ? (
                      <CardImage
                        src={model.image4}
                        alt="Grid 6 - 4"
                        zoom={model.zoom4}
                        offsetX={model.offsetX4}
                        offsetY={model.offsetY4}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto 4</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">MOOD A</span>
              </div>

              {/* 5. Image5 (Bottom-Center) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.image5 ? (
                      <CardImage
                        src={model.image5}
                        alt="Grid 6 - 5"
                        zoom={model.zoom5}
                        offsetX={model.offsetX5}
                        offsetY={model.offsetY5}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto 5</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">MOOD B</span>
              </div>

              {/* 6. Image6 (Bottom-Right) */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
                  style={{ width: "87mm", height: "55mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.image6 ? (
                      <CardImage
                        src={model.image6}
                        alt="Grid 6 - 6"
                        zoom={model.zoom6}
                        offsetX={model.offsetX6}
                        offsetY={model.offsetY6}
                      />
                    ) : (
                      <div className="text-center p-1">
                        <p className="text-[10px] text-stone-500 font-bold">Foto 6</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[6.5px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">FULL LENGTH</span>
              </div>
            </div>
          )}

          {/* EDITORIAL-6 HIGH-END LAYOUT WITH INTEGRATED CARD SPECS */}
          {layout === "editorial-6" && (
            <>
              {/* Section 1: Tall photo on the left */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "74mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Left Tall Editorial"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto Sinistra</p>
                        <p className="text-[8px] text-stone-400">Carica Foto Sinistra</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7px] font-semibold uppercase tracking-[0.15em] text-slate-500 mt-0.5">COVER PROFILE</span>
              </div>

              {/* Section 2: Measurements / Card Tech Specs & Name */}
              <div 
                className="flex flex-col justify-center items-center px-1 py-1.5 self-stretch bg-white"
                style={{ width: "50mm" }}
              >
                {/* Decorative Line above Name */}
                <div className="w-16 h-[1.2px] bg-slate-950 mb-1" />
                
                {/* Model Name */}
                <h3 className="text-[17px] font-serif uppercase tracking-[0.2em] text-slate-900 font-extrabold text-center py-0.5 leading-none">
                  {model.name || "NOME"}
                </h3>

                {/* Decorative Line under Name */}
                <div className="w-16 h-[1.2px] bg-slate-950 mt-1" />

                {/* Decorative top cross motif */}
                <div className="flex flex-col items-center mt-2.5 mb-1.5 select-none">
                  <div className="w-[1px] h-4 bg-slate-650" />
                  <div className="w-6 h-[1px] bg-slate-650" />
                </div>

                {/* Centered characteristics stack to mimic the image */}
                <div className="flex flex-col items-center justify-center space-y-1 text-center text-slate-900 font-sans text-[9px] tracking-wide leading-tight my-1">
                  <div>
                    Height : {model.height ? `${model.height}cm` : "—"} {model.height && ` / ${(() => {
                      const cm = parseFloat(model.height);
                      if (isNaN(cm)) return "";
                      const totIn = cm / 2.54;
                      const ft = Math.floor(totIn / 12);
                      const inch = Math.round((totIn % 12) * 2) / 2;
                      return `${ft}'${inch}"`;
                    })()}`}
                  </div>
                  <div>
                    Bust : {model.bust ? `${model.bust}cm` : "—"} {model.bust && ` / ${Math.round(parseFloat(model.bust) / 2.54)}"`}
                  </div>
                  <div>
                    Waist : {model.waist ? `${model.waist}cm` : "—"} {model.waist && ` / ${Math.round(parseFloat(model.waist) / 2.54)}"`}
                  </div>
                  <div>
                    Hips : {model.hips ? `${model.hips}cm` : "—"} {model.hips && ` / ${Math.round(parseFloat(model.hips) / 2.54)}"`}
                  </div>
                  {model.shoes && (
                    <div>Shoes: {model.shoes}</div>
                  )}
                  {model.hair && (
                    <div className="capitalize">{model.hair} Hair</div>
                  )}
                  {model.eyes && (
                    <div className="capitalize">{model.eyes} Eyes</div>
                  )}
                </div>

                {/* Decorative bottom cross motif */}
                <div className="flex flex-col items-center mt-1.5 select-none">
                  <div className="w-6 h-[1px] bg-slate-650" />
                  <div className="w-[1px] h-4 bg-slate-650" />
                </div>
              </div>

              {/* Section 3: Central vertically-oriented portrait next to specs */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "56mm", height: "125mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Center Editorial Portrait"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto Centro</p>
                        <p className="text-[8px] text-stone-400">Carica Foto Centro</p>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[7px] font-semibold uppercase tracking-[0.15em] text-slate-500 mt-0.5">EDITORIAL HIGHLIGHT</span>
              </div>

              {/* Section 4: 2x2 collage of 4 standard portraits on the far right */}
              <div 
                className="grid grid-cols-2 gap-x-[3mm] gap-y-[3mm]"
                style={{ width: "79mm", height: "125mm" }}
              >
                {/* Grid Item 1: imageRight */}
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-white p-0.5 shadow-xs border border-slate-200/60 transition-all duration-300 w-[38mm] h-[55.5mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
                  >
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Editorial grid 1"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <p className="text-[7px] text-stone-400 uppercase font-semibold">Foto 3</p>
                    )}
                  </div>
                </div>

                {/* Grid Item 2: image4 */}
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-white p-0.5 shadow-xs border border-slate-200/60 transition-all duration-300 w-[38mm] h-[55.5mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
                  >
                    {model.image4 ? (
                      <CardImage
                        src={model.image4}
                        alt="Editorial grid 2"
                        zoom={model.zoom4}
                        offsetX={model.offsetX4}
                        offsetY={model.offsetY4}
                      />
                    ) : (
                      <p className="text-[7px] text-stone-400 uppercase font-semibold">Foto 4</p>
                    )}
                  </div>
                </div>

                {/* Grid Item 3: image5 */}
                <div className="flex flex-col items-center animate-fade-in">
                  <div 
                    className="bg-white p-0.5 shadow-xs border border-slate-200/60 transition-all duration-300 w-[38mm] h-[55.5mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
                  >
                    {model.image5 ? (
                      <CardImage
                        src={model.image5}
                        alt="Editorial grid 3"
                        zoom={model.zoom5}
                        offsetX={model.offsetX5}
                        offsetY={model.offsetY5}
                      />
                    ) : (
                      <p className="text-[7px] text-stone-400 uppercase font-semibold">Foto 5</p>
                    )}
                  </div>
                </div>

                {/* Grid Item 4: image6 */}
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-white p-0.5 shadow-xs border border-slate-200/60 transition-all duration-300 w-[38mm] h-[55.5mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
                  >
                    {model.image6 ? (
                      <CardImage
                        src={model.image6}
                        alt="Editorial grid 4"
                        zoom={model.zoom6}
                        offsetX={model.offsetX6}
                        offsetY={model.offsetY6}
                      />
                    ) : (
                      <p className="text-[7px] text-stone-400 uppercase font-semibold">Foto 6</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* High Density Professional Characteristics Footer block */}
      <footer className="bg-slate-950 text-white rounded-md p-4 mt-2 shadow-lg border border-slate-800">
        <div className="grid grid-cols-8 gap-1.5 text-left w-full">
          {/* H 1 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">ALTEZZA/height</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
              {model.height ? `${model.height} cm` : "—"}
            </span>
          </div>

          {/* H 2 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">SENO/bust</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
              {model.bust ? `${model.bust} cm` : "—"}
            </span>
          </div>

          {/* H 3 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">VITA/waist</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
              {model.waist ? `${model.waist} cm` : "—"}
            </span>
          </div>

          {/* H 4 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">FIANCHI/hips</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
              {model.hips ? `${model.hips} cm` : "—"}
            </span>
          </div>

          {/* H 5 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">SCARPE/shoes</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate">
              {model.shoes || "—"}
            </span>
          </div>

          {/* H 6 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">OCCHI/eyes</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate" title={model.eyes}>
              {model.eyes || "—"}
            </span>
          </div>

          {/* H 7 */}
          <div className="flex flex-col pl-2 border-r border-slate-800/80">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">CAPELLI/hair</span>
            <span className="text-sm font-bold tracking-tight text-white block mt-0.5 truncate" title={model.hair}>
              {model.hair || "—"}
            </span>
          </div>

          {/* H 8 */}
          <div className="flex flex-col pl-2">
            <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider block">TAGLIA S/I size</span>
            <span className="text-sm font-bold tracking-tight text-amber-400 block mt-0.5 truncate">
              {model.sizeUpper ? `${model.sizeUpper}` : "—"} / {model.sizeLower ? `${model.sizeLower}` : "—"}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
