import React, { createContext, useContext } from "react";
import { ModelData, AgencyInfo } from "../types";

export const WatermarkContext = createContext<{ showWatermark: boolean; watermarkText: string }>({
  showWatermark: false,
  watermarkText: "",
});

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
  const { showWatermark, watermarkText } = useContext(WatermarkContext);
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
    <div className="absolute inset-0 w-full h-full">
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
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-20 overflow-hidden">
          <div className="transform -rotate-[32deg] whitespace-nowrap select-none pointer-events-none text-white/20 font-black text-xs sm:text-sm md:text-[20px] tracking-[0.25em] uppercase px-4 py-1 border border-white/10 rounded-sm bg-black/5 backdrop-blur-[0.5px] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {watermarkText}
          </div>
        </div>
      )}
    </div>
  );
};

// Pure, high-fidelity vector representation of the official Cosmopolitan brand logo
const CosmopolitanTextLogo: React.FC<{ variant?: "normal" | "small" | "tiny"; themeColor?: string }> = ({ variant = "normal", themeColor }) => {
  const isDark = themeColor === "charcoal";
  const mainTextColor = isDark ? "text-slate-100" : "text-black";
  const bordeauxColor = "text-[#b11030]";

  const subtitleChars = [
    ...("moda".split("").map(char => ({ char, color: bordeauxColor }))),
    ...("eventi".split("").map(char => ({ char, color: mainTextColor }))),
    ...("pubblicità".split("").map(char => ({ char, color: bordeauxColor }))),
    ...("comunicazione".split("").map(char => ({ char, color: mainTextColor })))
  ];

  const mainSize = variant === "tiny" ? "text-[13px]" : variant === "small" ? "text-[18px]" : "text-[26px]";
  const subSize = variant === "tiny" ? "text-[4.2px]" : variant === "small" ? "text-[5.5px]" : "text-[7.2px]";

  return (
    <div className="flex flex-col select-none pointer-events-none flex-shrink-0 text-left w-fit" style={{ fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div className={`${mainSize} leading-none flex items-center select-none font-light tracking-[0.03em]`} style={{ fontWeight: 300 }}>
        <span className={`${mainTextColor} uppercase`}>COSMO</span>
        <span className="text-[#b11030] uppercase">POLITAN</span>
      </div>
      <div className={`w-full flex justify-between ${subSize} leading-none mt-1 select-none font-light lowercase`} style={{ fontWeight: 300 }}>
        {subtitleChars.map((item, index) => (
          <span key={index} className={item.color}>
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

  const watermarkValue = React.useMemo(() => ({
    showWatermark: !!model.showWatermark,
    watermarkText: model.watermarkText || model.name || "COSMOPOLITAN",
  }), [model.showWatermark, model.watermarkText, model.name]);

  if (layout === "campaign-5-hybrid") {
    return (
      <WatermarkContext.Provider value={watermarkValue}>
        <div
          id={id}
          className={`print-container relative flex flex-col justify-between select-none overflow-hidden ${fontStyles[fontFamily]} ${bgThemes[themeColor]}`}
          style={{
            width: "297mm",
            height: "210mm",
            padding: "12mm 12mm", // Beautiful clean margins for Campaign layout
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            boxSizing: "border-box",
            border: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Beautiful Bento Grid of 5 photos: 1 tall left, 4 in a 2x2 grid on right */}
          <div className="flex gap-[5mm] w-full" style={{ height: "155mm" }}>
            {/* Left tall photo */}
            <div 
              className="bg-white p-0.5 shadow-md border border-slate-200/80 w-[120mm] h-[155mm] transition-all duration-300 hover:shadow-lg relative flex flex-col"
            >
              <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                {model.imageLeft ? (
                  <CardImage
                    src={model.imageLeft}
                    alt="Left Main Campaign"
                    zoom={model.zoomLeft}
                    offsetX={model.offsetXLeft}
                    offsetY={model.offsetYLeft}
                  />
                ) : (
                  <div className="text-center p-2">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Foto Sinistra Grande</p>
                    <p className="text-[8px] text-stone-400">Carica Foto Sinistra</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 2x2 grid */}
            <div className="grid grid-cols-2 gap-x-[4mm] gap-y-[4mm] w-[148mm] h-[155mm]">
              {/* Photo 2 (Center) */}
              <div className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg relative flex flex-col h-[75.5mm] overflow-hidden">
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.imageCenter ? (
                    <CardImage
                      src={model.imageCenter}
                      alt="Grid Photo 2"
                      zoom={model.zoomCenter}
                      offsetX={model.offsetXCenter}
                      offsetY={model.offsetYCenter}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 2 (Alto Sinistra)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo 3 (Right) */}
              <div className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg relative flex flex-col h-[75.5mm] overflow-hidden">
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.imageRight ? (
                    <CardImage
                      src={model.imageRight}
                      alt="Grid Photo 3"
                      zoom={model.zoomRight}
                      offsetX={model.offsetXRight}
                      offsetY={model.offsetYRight}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 3 (Alto Destra)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo 4 (Image4) */}
              <div className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg relative flex flex-col h-[75.5mm] overflow-hidden">
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.image4 ? (
                    <CardImage
                      src={model.image4}
                      alt="Grid Photo 4"
                      zoom={model.zoom4}
                      offsetX={model.offsetX4}
                      offsetY={model.offsetY4}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 4 (Basso Sinistra)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo 5 (Image5) */}
              <div className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg relative flex flex-col h-[75.5mm] overflow-hidden">
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.image5 ? (
                    <CardImage
                      src={model.image5}
                      alt="Grid Photo 5"
                      zoom={model.zoom5}
                      offsetX={model.offsetX5}
                      offsetY={model.offsetY5}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 5 (Basso Destra)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Model Name centered under left photo */}
          <div className="flex flex-col items-center justify-center mt-2" style={{ width: "120mm" }}>
            <h2 className={`text-[17px] font-extrabold uppercase tracking-[0.2em] ${textThemes[themeColor]} leading-none`}>
              {model.name || "NOME MODELLO"}
            </h2>
            {model.customCaption && (
              <span className={`text-[9px] font-mono ${labelThemes[themeColor]} tracking-widest uppercase mt-1`}>
                {model.customCaption.startsWith("@") ? model.customCaption : `@${model.customCaption}`}
              </span>
            )}
          </div>

          {/* Bottom Footer bar (Responsive layout colors) */}
          <div className="flex justify-between items-end w-full border-t border-current/15 pt-2 pb-1 mt-auto">
            {/* Left side: Horizontal specifications */}
            <div className={`flex items-center gap-4 text-[10px] ${labelThemes[themeColor]} tracking-wide`}>
              {model.height && (
                <span className="uppercase">Height <strong className={`${textThemes[themeColor]} font-bold`}>{model.height}</strong></span>
              )}
              {model.bust && (
                <span className="uppercase">Bust <strong className={`${textThemes[themeColor]} font-bold`}>{model.bust}</strong></span>
              )}
              {model.waist && (
                <span className="uppercase">Waist <strong className={`${textThemes[themeColor]} font-bold`}>{model.waist}</strong></span>
              )}
              {model.hips && (
                <span className="uppercase">Hips <strong className={`${textThemes[themeColor]} font-bold`}>{model.hips}</strong></span>
              )}
              {model.shoes && (
                <span className="uppercase">Shoes <strong className={`${textThemes[themeColor]} font-bold`}>{model.shoes}</strong></span>
              )}
              {model.hair && (
                <span className="uppercase">Hair <strong className={`${textThemes[themeColor]} font-bold`}>{model.hair}</strong></span>
              )}
              {model.eyes && (
                <span className="uppercase">Eyes <strong className={`${textThemes[themeColor]} font-bold`}>{model.eyes}</strong></span>
              )}
            </div>

            {/* Right side: Agency details and Logo stacked vertically */}
            <div className="flex flex-col items-end gap-1 text-right max-w-[120mm]">
              {agency.logo ? (
                <img 
                  src={agency.logo} 
                  alt="Brand Logo" 
                  style={{ height: model.bottomRightLogoHeight ? `${model.bottomRightLogoHeight}px` : "28px" }}
                  className="w-auto object-contain flex-shrink-0 mb-0.5"
                  referrerPolicy="no-referrer"
                  crossOrigin={getCrossOrigin(agency.logo)}
                />
              ) : (
                <div className="mb-0.5">
                  <CosmopolitanTextLogo variant="small" themeColor={themeColor} />
                </div>
              )}
              {(() => {
                const agencyAddress = agency.address || "via della Repubblica n°61";
                const agencyCity = agency.city || "Bisceglie (bt) 76011";
                const line1Str = `ADDRESS: ${agencyAddress}, ${agencyCity}`.toUpperCase();

                const parts = [];
                if (agency.phone) parts.push(`TEL: ${agency.phone}`);
                if (agency.email) parts.push(`EMAIL: ${agency.email}`);
                if (agency.web) parts.push(`WEB: ${agency.web}`);
                const line2Str = parts.join(" / ").toUpperCase();

                return !model.hideContactsBlock ? (
                  <div className="flex flex-col items-end mt-1.5 font-sans select-none text-right">
                    {/* Line 1: Address (enlarged/spaced) */}
                    <div 
                      className={`text-[8px] font-bold uppercase ${textThemes[themeColor]} leading-none`}
                      style={{ letterSpacing: "0.14em" }}
                    >
                      {line1Str}
                    </div>
                    {/* Line 2: Contact info (narrower/smaller characters) */}
                    <div 
                      className={`text-[5.6px] font-semibold uppercase mt-1 ${labelThemes[themeColor]} leading-none`}
                      style={{ letterSpacing: "0.06em" }}
                    >
                      {line2Str}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </WatermarkContext.Provider>
    );
  }



  return (
    <WatermarkContext.Provider value={watermarkValue}>
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
      {/* Top Center custom presentation text or logo */}
      {(model.topCenterText || model.topCenterLogo) && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center gap-1 z-40 pointer-events-none select-none max-w-[280px]"
          style={{ top: "8mm" }}
        >
          {model.topCenterLogo && (
            <img
              src={model.topCenterLogo}
              alt="Top Center Logo"
              className="object-contain"
              style={{ height: `${model.topCenterLogoHeight || 10}mm` }}
              referrerPolicy="no-referrer"
              crossOrigin={getCrossOrigin(model.topCenterLogo)}
            />
          )}
          {model.topCenterText && (
            <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-slate-800 leading-none">
              {model.topCenterText}
            </span>
          )}
        </div>
      )}

      {/* High Density Elegant Header Bar */}
      {layout === "campaign-solo" ? (
        <header className="relative z-30 flex justify-center items-center pt-3 pb-5 w-full select-none pointer-events-none">
          <h2 className="text-[26px] font-serif uppercase tracking-[0.25em] text-slate-900 font-extrabold leading-none">
            {model.campaignName || "CONDÉ NAST"}
          </h2>
        </header>
      ) : (
        <header className={`relative z-30 flex justify-between items-start pb-4 w-full ${["campaign-3", "campaign-brand-6", "campaign-tvc", "campaign-tvc-4"].includes(layout) ? "" : "border-b-2 border-black"}`}>
        <div className="flex flex-col items-start text-left gap-2.5">
          {/* Brand Logo integration */}
          {!model.hideHeaderLogo && (
            agency.logo ? (
              <img 
                src={agency.logo} 
                alt="Brand Logo" 
                className="h-10 w-auto object-contain flex-shrink-0 max-w-[170px]"
                referrerPolicy="no-referrer"
                crossOrigin={getCrossOrigin(agency.logo)}
              />
            ) : (
              <CosmopolitanTextLogo />
            )
          )}

          <div className="flex flex-col">
            {!model.hideHeaderCategory && (
              <h2 className="text-[10px] font-bold tracking-[0.35em] uppercase text-slate-800 mb-1 leading-none">
                {title || "PORTRAIT / THREE-QUARTERS / FULL BODY MODELS"}
              </h2>
            )}
            <p className="text-[9px] leading-tight text-slate-500 font-mono uppercase tracking-wider mt-0.5">
              {!model.hideHeaderContacts1 && (
                <>
                  {agency.name} • MODELLI ITALIA • TEL. {agency.phone || "333.59.64.357"}
                  <br />
                </>
              )}
              {!model.hideHeaderContacts2 && (
                <>
                  {agency.address} • {agency.city}
                  <br />
                </>
              )}
              {!model.hideHeaderContacts3 && (
                <>
                  <a href={`mailto:${agency.email || "info@cosmopolitanagency.it"}`} className="text-blue-600 hover:text-blue-800 underline font-semibold lowercase pointer-events-auto select-text">{agency.email || "info@cosmopolitanagency.it"}</a> • <a href={(agency.web && (agency.web.startsWith("http://") || agency.web.startsWith("https://"))) ? agency.web : `https://${agency.web || "www.cosmopolitanagency.it"}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-semibold lowercase pointer-events-auto select-text">{agency.web || "www.cosmopolitanagency.it"}</a>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end text-right">
          {!model.hideHeaderName && (
            <h1 className="text-4xl font-serif italic tracking-tight uppercase leading-none text-slate-900 font-bold">
              {model.name || "NOME MODELLA"}
            </h1>
          )}
          {!model.hideHeaderIndex && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1.5">
              Model Portfolio Index • {agency.portfolioDate || "2026/27"}
            </p>
          )}

          {/* Discreet Row of Social Logos with custom brand color styling on hover */}
          {!model.hideSocialIcons && (
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
          )}
        </div>
      </header>
      )}

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
            <div className="flex justify-between items-center w-full gap-0 select-none">
              {/* Column 1: Left tall photo */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "80mm", height: "135mm" }}
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
                        <p className="text-[8px] text-stone-400">Carica Foto</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: Tech Specs & Spaced Model Name */}
              <div 
                className="flex flex-col justify-center items-center py-2 self-stretch bg-white select-none"
                style={{ width: "40mm", height: "135mm", marginLeft: "2mm", marginRight: "2mm" }}
              >
                {/* Tracked out model name with auto-scaling to prevent wrapping */}
                {(() => {
                  const name = (model.name || "NOME").toUpperCase();
                  const len = name.length;
                  let fontSize = "18px";
                  let letterSpacing = "0.22em";
                  if (len > 12) {
                    fontSize = "11px";
                    letterSpacing = "0.08em";
                  } else if (len > 9) {
                    fontSize = "13px";
                    letterSpacing = "0.14em";
                  } else if (len > 7) {
                    fontSize = "15px";
                    letterSpacing = "0.18em";
                  } else if (len > 5) {
                    fontSize = "16px";
                    letterSpacing = "0.20em";
                  }
                  return (
                    <h3 
                      className="font-serif uppercase text-slate-900 font-extrabold text-center py-0.5 leading-none whitespace-nowrap"
                      style={{ fontSize, letterSpacing }}
                    >
                      {name}
                    </h3>
                  );
                })()}

                {/* Decorative top cross motif */}
                <div className="flex flex-col items-center mt-4 mb-2 select-none">
                  <div className="w-[1px] h-[6mm] bg-slate-400" />
                  <div className="w-[8mm] h-[1px] bg-slate-400" />
                </div>

                {/* Centered measurements stats list */}
                <div 
                  className="flex flex-col items-center justify-center space-y-1.5 text-center text-slate-900 font-sans text-[9px] leading-snug my-2 select-none w-full"
                  style={{ letterSpacing: "0.04em" }}
                >
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
                    Hip : {model.hips ? `${model.hips}cm` : "—"} {model.hips && ` / ${Math.round(parseFloat(model.hips) / 2.54)}"`}
                  </div>
                  {model.hair && (
                    <div className="capitalize">{model.hair} Hair</div>
                  )}
                  {model.eyes && (
                    <div className="capitalize">{model.eyes} Eyes</div>
                  )}
                </div>

                {/* Decorative bottom cross motif */}
                <div className="flex flex-col items-center mt-2 select-none">
                  <div className="w-[8mm] h-[1px] bg-slate-400" />
                  <div className="w-[1px] h-[6mm] bg-slate-400" />
                </div>
              </div>

              {/* Column 3: Center tall portrait next to specs */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                  style={{ width: "66mm", height: "135mm" }}
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
                        <p className="text-[8px] text-stone-400">Carica Foto</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 4: 2x2 collage of 4 standard portraits on the far right */}
              <div 
                className="grid grid-cols-2"
                style={{ width: "81.5mm", height: "135mm", marginLeft: "1.5mm", gap: "1.5mm" }}
              >
                {/* Grid Item 1: imageRight */}
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-white p-0.5 shadow-sm border border-slate-200/60 transition-all duration-300 w-[40mm] h-[66.75mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
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
                    className="bg-white p-0.5 shadow-sm border border-slate-200/60 transition-all duration-300 w-[40mm] h-[66.75mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
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
                    className="bg-white p-0.5 shadow-sm border border-slate-200/60 transition-all duration-300 w-[40mm] h-[66.75mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
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
                    className="bg-white p-0.5 shadow-sm border border-slate-200/60 transition-all duration-300 w-[40mm] h-[66.75mm] overflow-hidden relative bg-slate-100 flex items-center justify-center"
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
            </div>
          )}

          {/* GRID-10 5x2 LAYOUT (10 IMAGES) */}
          {layout === "grid-10" && (
            <div className="grid grid-cols-5 gap-x-[2.2mm] gap-y-[2.2mm] justify-center items-center w-full">
              {/* 1. imageLeft */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Grid 10 - 1"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 1</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. imageCenter */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Grid 10 - 2"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 2</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. imageRight */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Grid 10 - 3"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 3</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. image4 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image4 ? (
                      <CardImage
                        src={model.image4}
                        alt="Grid 10 - 4"
                        zoom={model.zoom4}
                        offsetX={model.offsetX4}
                        offsetY={model.offsetY4}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 4</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. image5 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image5 ? (
                      <CardImage
                        src={model.image5}
                        alt="Grid 10 - 5"
                        zoom={model.zoom5}
                        offsetX={model.offsetX5}
                        offsetY={model.offsetY5}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 5</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. image6 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image6 ? (
                      <CardImage
                        src={model.image6}
                        alt="Grid 10 - 6"
                        zoom={model.zoom6}
                        offsetX={model.offsetX6}
                        offsetY={model.offsetY6}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 6</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 7. image7 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image7 ? (
                      <CardImage
                        src={model.image7}
                        alt="Grid 10 - 7"
                        zoom={model.zoom7}
                        offsetX={model.offsetX7}
                        offsetY={model.offsetY7}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 7</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 8. image8 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image8 ? (
                      <CardImage
                        src={model.image8}
                        alt="Grid 10 - 8"
                        zoom={model.zoom8}
                        offsetX={model.offsetX8}
                        offsetY={model.offsetY8}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 8</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 9. image9 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image9 ? (
                      <CardImage
                        src={model.image9}
                        alt="Grid 10 - 9"
                        zoom={model.zoom9}
                        offsetX={model.offsetX9}
                        offsetY={model.offsetY9}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 9</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 10. image10 */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-0.5 shadow-xs border border-slate-200 transition-all duration-300 hover:shadow-sm flex flex-col justify-between"
                  style={{ width: "52mm", height: "61mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-50 flex items-center justify-center">
                    {model.image10 ? (
                      <CardImage
                        src={model.image10}
                        alt="Grid 10 - 10"
                        zoom={model.zoom10}
                        offsetX={model.offsetX10}
                        offsetY={model.offsetY10}
                      />
                    ) : (
                      <p className="text-[8px] text-stone-400 uppercase font-semibold">Foto 10</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CINEMATIC DUO (2 WIDE LANDSCAPE PHOTOS + SPECS COLUMN) */}
          {layout === "cinematic-2" && (
            <>
              {/* Left Column: Stats & Model Name */}
              <div 
                className="flex flex-col justify-center items-center px-2 py-4 self-stretch bg-white border border-slate-100/50 rounded-lg shadow-sm"
                style={{ width: "87mm", height: "125mm" }}
              >
                {/* Decorative Line above Name */}
                <div className="w-20 h-[1.2px] bg-slate-950 mb-1" />
                
                {/* Model Name */}
                <h3 className="text-[20px] font-serif uppercase tracking-[0.22em] text-slate-950 font-extrabold text-center py-0.5 leading-none">
                  {model.name || "NOME"}
                </h3>

                {/* Decorative Line under Name */}
                <div className="w-20 h-[1.2px] bg-slate-950 mt-1" />

                {/* Stylized inverted T (top cross motif) */}
                <div className="flex flex-col items-center mt-3 mb-3 select-none">
                  <div className="w-[1px] h-5 bg-slate-800" />
                  <div className="w-8 h-[1px] bg-slate-800" />
                </div>

                {/* Characteristics block */}
                <div className="flex flex-col items-center justify-center space-y-1.5 text-center text-slate-900 font-sans text-[10px] tracking-wide leading-relaxed my-2">
                  <div className="font-medium text-slate-800">
                    Height : {model.height ? `${model.height}cm` : "—"} {model.height && ` / ${(() => {
                      const cm = parseFloat(model.height);
                      if (isNaN(cm)) return "";
                      const totIn = cm / 2.54;
                      const ft = Math.floor(totIn / 12);
                      const inch = Math.round((totIn % 12) * 2) / 2;
                      return `${ft}'${inch}"`;
                    })()}`}
                  </div>
                  <div className="font-medium text-slate-800">
                    Bust {model.bust ? `${model.bust}cm` : "—"} {model.bust && ` / ${Math.round(parseFloat(model.bust) / 2.54)}"`}
                  </div>
                  <div className="font-medium text-slate-800">
                    Waist {model.waist ? `${model.waist}cm` : "—"} {model.waist && ` / ${Math.round(parseFloat(model.waist) / 2.54)}"`}
                  </div>
                  <div className="font-medium text-slate-800">
                    Hips {model.hips ? `${model.hips}cm` : "—"} {model.hips && ` / ${Math.round(parseFloat(model.hips) / 2.54)}"`}
                  </div>
                  {model.shoes && (
                    <div className="font-medium text-slate-800">Shoe: {model.shoes}</div>
                  )}
                  {model.hair && (
                    <div className="capitalize font-medium text-slate-800">{model.hair} Hair</div>
                  )}
                  {model.eyes && (
                    <div className="capitalize font-medium text-slate-800">{model.eyes} Eyes</div>
                  )}
                </div>

                {/* Stylized T (bottom cross motif) */}
                <div className="flex flex-col items-center mt-3 select-none">
                  <div className="w-8 h-[1px] bg-slate-800" />
                  <div className="w-[1px] h-5 bg-slate-800" />
                </div>
              </div>

              {/* Right Column: 2 stacked landscape images */}
              <div 
                className="flex flex-col justify-between"
                style={{ width: "183mm", height: "125mm" }}
              >
                {/* Top Image: imageLeft */}
                <div className="relative group">
                  <div 
                    className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden relative bg-slate-100"
                    style={{ width: "183mm", height: "61mm" }}
                  >
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Cinematic Portrait Top"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-2">
                        <div>
                          <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto Cinematica Alto</p>
                          <p className="text-[9px] text-stone-400 mt-0.5">Carica Foto Sinistra</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Image: imageCenter */}
                <div className="relative group">
                  <div 
                    className="bg-white p-0.5 shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden relative bg-slate-100"
                    style={{ width: "183mm", height: "61mm" }}
                  >
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Cinematic Portrait Bottom"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-2">
                        <div>
                          <p className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">Foto Cinematica Basso</p>
                          <p className="text-[9px] text-stone-400 mt-0.5">Carica Foto Centro</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CAMPAIGN DUO LAYOUT (2 HORIZONTAL/SQUARE CAMPAIGN PHOTOS SIDE-BY-SIDE + CENTERED LABEL) */}
          {layout === "campaign-2" && (
            <div className="flex flex-col items-center w-full gap-4 pb-2">
              <div className="flex justify-center items-center gap-[4mm]">
                {/* Left Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                    style={{ width: "131mm", height: "115mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Campaign Left"
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
                    </div>
                  </div>
                </div>

                {/* Right Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                    style={{ width: "131mm", height: "115mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Campaign Right"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Destra</p>
                          <p className="text-[10px] text-stone-400 mt-1">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Centered Campaign Caption */}
              <div className="text-center mt-3 mb-1 select-none">
                <span className="text-[13px] font-sans font-extrabold uppercase tracking-[0.25em] text-slate-900 border-t border-slate-300 pt-1 px-4 inline-block">
                  {model.customCaption 
                    ? model.customCaption.toUpperCase() 
                    : (model.campaignName 
                        ? (model.name ? `${model.name.toUpperCase()} FOR ${model.campaignName.toUpperCase()}` : `MODEL FOR ${model.campaignName.toUpperCase()}`)
                        : (model.name ? `${model.name.toUpperCase()} CAMPAIGN` : "MODEL CAMPAIGN"))}
                </span>
              </div>
            </div>
          )}

          {/* CAMPAIGN DUO PORTRAIT LAYOUT */}
          {layout === "campaign-2-portrait" && (
            <div className="flex flex-col items-center w-full gap-4 pb-2">
              <div className="flex justify-center items-center gap-[6mm]">
                {/* Left Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                    style={{ width: "125mm", height: "140mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Campaign Left Portrait"
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
                    </div>
                  </div>
                </div>

                {/* Right Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                    style={{ width: "125mm", height: "140mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Campaign Center Portrait"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Destra</p>
                          <p className="text-[10px] text-stone-400 mt-1">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Centered Campaign Caption */}
              <div className="text-center mt-3 mb-1 select-none">
                <span className="text-[13px] font-sans font-extrabold uppercase tracking-[0.25em] text-slate-900 border-t border-slate-300 pt-1 px-4 inline-block">
                  {model.customCaption 
                    ? model.customCaption.toUpperCase() 
                    : (model.campaignName 
                        ? (model.name ? `${model.name.toUpperCase()} FOR ${model.campaignName.toUpperCase()}` : `MODEL FOR ${model.campaignName.toUpperCase()}`)
                        : (model.name ? `${model.name.toUpperCase()} CAMPAIGN` : "MODEL CAMPAIGN"))}
                </span>
              </div>
            </div>
          )}

          {/* WEDDING CAMPAIGN DUO LAYOUT (1 RAW WEDDING PHOTO + 1 MATTE-FRAMED WEDDING PHOTO WITH SUBTLE BLUE-GREY MARBLE PATTERN) */}
          {layout === "campaign-wedding" && (
            <div className="flex flex-col items-center w-full gap-4 pb-2">
              <div className="flex justify-center items-center gap-[4mm]">
                {/* Left Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                    style={{ width: "131mm", height: "115mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Wedding Campaign Left"
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
                    </div>
                  </div>
                </div>

                {/* Right Photo inside beautiful custom crafted Marble Matte border */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="p-4 hover:p-4.5 shadow-lg border border-slate-200/85 transition-all duration-300 hover:shadow-xl flex flex-col justify-center items-center relative"
                    style={{ 
                      width: "131mm", 
                      height: "115mm",
                      background: "radial-gradient(circle, #faf9f6 0%, #f0ede6 75%, #e1ddd5 100%)",
                      boxShadow: "inset 0 0 30px rgba(0,0,0,0.05), 0 10px 25px -5px rgba(0,0,0,0.08)"
                    }}
                  >
                    {/* Subtle aesthetic watercolor-like cloud overlays to create elegant depth */}
                    <div className="absolute inset-0 opacity-[0.14] pointer-events-none mix-blend-multiply bg-[radial-gradient(circle_at_20%_25%,_var(--tw-gradient-stops))] from-blue-300 via-stone-400 to-amber-200" />
                    
                    {/* Concentric subtle inset frame lines */}
                    <div className="absolute inset-[3mm] border border-slate-350/30 pointer-events-none" />

                    {/* Inner Picture Mount / Black Thin Frame */}
                    <div className="w-[100mm] h-[85mm] bg-slate-900 border border-slate-950/40 shadow-md overflow-hidden relative flex items-center justify-center z-10">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Wedding Campaign Right"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-[12px] text-stone-200 uppercase tracking-widest font-bold">Foto di Destra</p>
                          <p className="text-[10px] text-stone-400 mt-1">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Centered Campaign Caption */}
              <div className="text-center mt-3 mb-1 select-none">
                <span className="text-[13px] font-sans font-extrabold uppercase tracking-[0.25em] text-slate-900 border-t border-slate-300 pt-1 px-4 inline-block">
                  {model.customCaption 
                    ? model.customCaption.toUpperCase() 
                    : (model.name 
                        ? `${model.name.toUpperCase()} FOR ${(model.campaignName || "WEDDING ASIA").toUpperCase()}` 
                        : `MODEL FOR ${(model.campaignName || "WEDDING ASIA").toUpperCase()}`)}
                </span>
              </div>
            </div>
          )}

          {/* TRIPLE ROYAL ENFIELD CAMPAIGN LAYOUT */}
          {layout === "campaign-3" && (
            <div className="flex justify-between items-center w-full gap-[4mm] pb-2 text-slate-900 pr-4">
              {/* Left Photo */}
              <div 
                className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between shrink-0 mb-4"
                style={{ width: "76mm", height: "138mm" }}
              >
                <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                  {model.imageLeft ? (
                    <CardImage
                      src={model.imageLeft}
                      alt="Left Tall"
                      zoom={model.zoomLeft}
                      offsetX={model.offsetXLeft}
                      offsetY={model.offsetYLeft}
                    />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Foto di Sinistra</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Stack Photos */}
              <div className="flex flex-col gap-[3mm] shrink-0 mb-4">
                {/* Top Photo */}
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl"
                  style={{ width: "76mm", height: "67.5mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageCenter ? (
                      <CardImage
                        src={model.imageCenter}
                        alt="Center Top"
                        zoom={model.zoomCenter}
                        offsetX={model.offsetXCenter}
                        offsetY={model.offsetYCenter}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Foto Centro Alto</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Photo */}
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl"
                  style={{ width: "76mm", height: "67.5mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageRight ? (
                      <CardImage
                        src={model.imageRight}
                        alt="Center Bottom"
                        zoom={model.zoomRight}
                        offsetX={model.offsetXRight}
                        offsetY={model.offsetYRight}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Foto Centro Basso</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Specifications Column */}
              <div className="flex flex-col items-center justify-center flex-grow py-4 select-none">
                {/* Brand / Campaign Name Title */}
                <div className="text-center font-sans font-extrabold uppercase tracking-[0.2em] text-[16px] text-slate-950 mb-4 leading-tight">
                  {(() => {
                    let clientTitleLine1 = "ROYAL ENFIELD";
                    let clientTitleLine2 = "CAMPAIGN";
                    if (model.campaignName) {
                      if (model.campaignName.includes("|")) {
                        const parts = model.campaignName.split("|");
                        clientTitleLine1 = parts[0].trim();
                        clientTitleLine2 = parts.slice(1).join(" ").trim();
                      } else {
                        const parts = model.campaignName.trim().split(/\s+/);
                        if (parts.length > 1) {
                          clientTitleLine1 = parts.slice(0, parts.length - 1).join(" ");
                          clientTitleLine2 = parts[parts.length - 1];
                        } else {
                          clientTitleLine1 = parts[0];
                          clientTitleLine2 = "CAMPAIGN";
                        }
                      }
                    }
                    return (
                      <>
                        <div className="font-sans font-black tracking-[0.22em] text-slate-900 block">{clientTitleLine1}</div>
                        <div className="font-sans font-black tracking-[0.22em] text-slate-900 block">{clientTitleLine2}</div>
                      </>
                    );
                  })()}
                </div>

                {/* Divider Line above name */}
                <div className="w-[50mm] h-[0.5px] bg-slate-300 mb-2" />

                {/* Model name with stylish letter spacing */}
                <div className="text-center font-serif text-[22px] font-normal text-slate-900 uppercase tracking-[0.3em] pl-[0.3em] py-1">
                  {model.name || "JENNA"}
                </div>

                {/* Divider Line below name */}
                <div className="w-[50mm] h-[0.5px] bg-slate-300 mt-2" />

                {/* Downward pointing T-motif */}
                <div className="flex flex-col items-center mt-3 mb-2">
                  <div className="w-[0.8px] h-[14mm] bg-slate-900" />
                  <div className="w-[14mm] h-[0.8px] bg-slate-900" />
                </div>

                {/* Specifications details */}
                <div className="flex flex-col items-center text-center gap-1 font-sans text-[10.5px] font-medium text-slate-850 leading-normal">
                  <div>Height : {model.height ? `${model.height}cm` : "—"} {model.height ? `/ ${Math.floor(parseFloat(model.height) / 30.48)}'${Math.round((parseFloat(model.height) % 30.48) / 2.54)}"` : ""}</div>
                  <div>Bust {model.bust ? `${model.bust}cm` : "—"} {model.bust ? `/ ${Math.round(parseFloat(model.bust) / 2.54)}"` : ""}</div>
                  <div>Waist {model.waist ? `${model.waist}cm` : "—"} {model.waist ? `/ ${Math.round(parseFloat(model.waist) / 2.54)}"` : ""}</div>
                  <div>Hips {model.hips ? `${model.hips}cm` : "—"} {model.hips ? `/ ${Math.round(parseFloat(model.hips) / 2.54)}"` : ""}</div>
                  {model.shoes ? <div>Shoe: {model.shoes}</div> : null}
                  {model.hair ? <div>{model.hair} Hair</div> : null}
                  {model.eyes ? <div>{model.eyes} Eyes</div> : null}
                </div>

                {/* Upward pointing T-motif */}
                <div className="flex flex-col items-center mt-3">
                  <div className="w-[14mm] h-[0.8px] bg-slate-900" />
                  <div className="w-[0.8px] h-[11mm] bg-slate-900" />
                </div>
              </div>
            </div>
          )}

          {/* SEAMLESS DUAL CAMPAIGN LAYOUT */}
          {layout === "campaign-seamless" && (
            <div className="flex flex-col items-center w-full pb-2">
              <div className="flex justify-center items-center gap-0">
                {/* Left Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-[0.3mm] hover:p-[0.5mm] shadow-md border-r border-slate-100 transition-all duration-300 flex flex-col justify-between"
                    style={{ width: "133.5mm", height: "140mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Campaign Left Seamless"
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
                    </div>
                  </div>
                </div>

                {/* Right Photo */}
                <div className="relative group flex flex-col items-center">
                  <div 
                    className="bg-white p-[0.3mm] hover:p-[0.5mm] shadow-md transition-all duration-300 flex flex-col justify-between"
                    style={{ width: "133.5mm", height: "140mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Campaign Right Seamless"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Destra</p>
                          <p className="text-[10px] text-stone-400 mt-1">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MOVIE/TVC VIDEO STILLS SHOWCASE LAYOUT (16:9 STILLS) */}
          {layout === "campaign-tvc" && (
            <div className="flex flex-col items-center w-full pb-4 text-slate-900 select-none">
              {/* Row 1: Two Stills side-by-side */}
              <div className="flex justify-center items-center w-full gap-[12mm] px-4">
                {/* Top-Left Still */}
                <div className="flex flex-col items-center">
                  {/* Caption above layout */}
                  <div className="text-center mb-1.5 min-h-[34px] flex flex-col justify-end">
                    <span className="text-[9.5px] font-sans font-medium text-stone-500 uppercase tracking-widest block leading-tight">
                      {(model.name || "MODEL").toUpperCase()} FEATURED IN
                    </span>
                    <span className="text-[12px] font-sans font-extrabold uppercase tracking-wide text-stone-900 block leading-tight">
                      {model.tvcLabelLeft || "MAHINDRA TVC"}
                    </span>
                  </div>
                  
                  {/* Image Container 122mm x 68.6mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "122mm", height: "68.6mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Video Still Left"
                          zoom={model.zoomLeft}
                          offsetX={model.offsetXLeft}
                          offsetY={model.offsetYLeft}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still Sinistra</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Sinistra</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top-Right Still */}
                <div className="flex flex-col items-center">
                  {/* Caption above layout */}
                  <div className="text-center mb-1.5 min-h-[34px] flex flex-col justify-end">
                    <span className="text-[9.5px] font-sans font-medium text-stone-500 uppercase tracking-widest block leading-tight">
                      {(model.name || "MODEL").toUpperCase()} FEATURED IN
                    </span>
                    <span className="text-[12px] font-sans font-extrabold uppercase tracking-wide text-stone-900 block leading-tight">
                      {model.tvcLabelCenter || "TATA HOUSING TVC"}
                    </span>
                  </div>

                  {/* Image Container 122mm x 68.6mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "122mm", height: "68.6mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Video Still Center"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still Centro</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Bottom Center centered Single Still */}
              <div className="flex justify-center items-center w-full mt-6">
                <div className="flex flex-col items-center">
                  {/* Caption above bottom layout */}
                  <div className="text-center mb-1.5 min-h-[34px] flex flex-col justify-end">
                    <span className="text-[9.5px] font-sans font-medium text-stone-500 uppercase tracking-widest block leading-tight">
                      {(model.name || "MODEL").toUpperCase()} FEATURED IN
                    </span>
                    <span className="text-[12px] font-sans font-extrabold uppercase tracking-wide text-stone-900 block leading-tight">
                      {model.tvcLabelRight || "KERALA TOURISM TVC"}
                    </span>
                  </div>

                  {/* Image Container 122mm x 68.6mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "122mm", height: "68.6mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageRight ? (
                        <CardImage
                          src={model.imageRight}
                          alt="Video Still Right"
                          zoom={model.zoomRight}
                          offsetX={model.offsetXRight}
                          offsetY={model.offsetYRight}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still Centro-Basso</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Centro-Basso</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2x2 MOVIE/TVC GRID LAYOUT */}
          {layout === "campaign-tvc-4" && (
            <div className="flex flex-col items-center w-full pb-3 text-slate-900 select-none">
              
              {/* Row 1: Two Stills with label ABOVE */}
              <div className="flex justify-center items-end w-full gap-[12mm] px-4">
                
                {/* Top-Left Still */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-1.5 min-h-[16px] flex flex-col justify-end">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-[0.12em] text-stone-900 block leading-tight">
                      {(() => {
                        const base = model.tvcLabelLeft || "OPPO RENO 2";
                        if (base.includes("FEATURED")) return base.toUpperCase();
                        return `${(model.name || "MODEL").toUpperCase()} FEATURED IN ${base.toUpperCase()}`;
                      })()}
                    </span>
                  </div>
                  
                  {/* Image Container 116mm x 65.25mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "116mm", height: "65.25mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Video Still Top-Left"
                          zoom={model.zoomLeft}
                          offsetX={model.offsetXLeft}
                          offsetY={model.offsetYLeft}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still 1 (Top-Left)</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Sinistra</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top-Right Still */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-1.5 min-h-[16px] flex flex-col justify-end">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-[0.12em] text-stone-900 block leading-tight">
                      {(() => {
                        const base = model.tvcLabelCenter || "YARDLEY TVC";
                        if (base.includes("FEATURED")) return base.toUpperCase();
                        return `${(model.name || "MODEL").toUpperCase()} FEATURED IN ${base.toUpperCase()}`;
                      })()}
                    </span>
                  </div>
                  
                  {/* Image Container 116mm x 65.25mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "116mm", height: "65.25mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Video Still Top-Right"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still 2 (Top-Right)</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Two Stills with label BELOW */}
              <div className="flex justify-center items-start w-full gap-[12mm] px-4 mt-[8mm]">
                
                {/* Bottom-Left Still */}
                <div className="flex flex-col items-center">
                  {/* Image Container 116mm x 65.25mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "116mm", height: "65.25mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.imageRight ? (
                        <CardImage
                          src={model.imageRight}
                          alt="Video Still Bottom-Left"
                          zoom={model.zoomRight}
                          offsetX={model.offsetXRight}
                          offsetY={model.offsetYRight}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still 3 (Bottom-Left)</p>
                          <p className="text-[8px] text-stone-400">Carica Foto Destra</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-2 min-h-[16px] flex flex-col justify-start">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-[0.12em] text-stone-900 block leading-tight">
                      {(() => {
                        const base = model.tvcLabelRight || "VIVO TVC";
                        if (base.includes("FEATURED")) return base.toUpperCase();
                        return `${(model.name || "MODEL").toUpperCase()} FEATURED IN ${base.toUpperCase()}`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Bottom-Right Still */}
                <div className="flex flex-col items-center">
                  {/* Image Container 116mm x 65.25mm */}
                  <div 
                    className="bg-white p-1 hover:p-1.5 shadow-md border border-stone-200/60 transition-all duration-300 hover:shadow-lg flex flex-col"
                    style={{ width: "116mm", height: "65.25mm" }}
                  >
                    <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                      {model.image4 ? (
                        <CardImage
                          src={model.image4}
                          alt="Video Still Bottom-Right"
                          zoom={model.zoom4}
                          offsetX={model.offsetX4}
                          offsetY={model.offsetY4}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Still 4 (Bottom-Right)</p>
                          <p className="text-[8px] text-stone-400">Carica Foto 4</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-2 min-h-[16px] flex flex-col justify-start">
                    <span className="text-[10px] font-sans font-extrabold uppercase tracking-[0.12em] text-stone-900 block leading-tight">
                      {(() => {
                        const base = model.tvcLabel4 || "SAMSONITE TVC";
                        if (base.includes("FEATURED")) return base.toUpperCase();
                        return `${(model.name || "MODEL").toUpperCase()} FEATURED IN ${base.toUpperCase()}`;
                      })()}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {layout === "campaign-solo" && (
            <div className="flex flex-col items-center justify-center w-full pb-4 text-slate-900 select-none">
              {/* Single centered Campaign Photo */}
              <div className="relative group flex flex-col items-center">
                <div 
                  className="bg-white p-1 hover:p-1.5 shadow-lg border border-slate-200/60 transition-all duration-300 hover:shadow-xl flex flex-col justify-between"
                  style={{ width: "150mm", height: "135mm" }}
                >
                  <div className="w-full h-full overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    {model.imageLeft ? (
                      <CardImage
                        src={model.imageLeft}
                        alt="Campaign Single Centered"
                        zoom={model.zoomLeft}
                        offsetX={model.offsetXLeft}
                        offsetY={model.offsetYLeft}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-[12px] text-stone-500 uppercase tracking-widest font-bold">Foto di Campagna</p>
                        <p className="text-[10px] text-stone-400 mt-1">Carica Foto Principale</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Centered Campaign Caption */}
              <div className="text-center mt-6 select-none">
                <span className="text-[13px] font-sans font-extrabold uppercase tracking-[0.25em] text-slate-900 border-t border-slate-300 pt-1.5 px-6 inline-block leading-none">
                  {model.customCaption 
                    ? model.customCaption.toUpperCase() 
                    : (model.campaignName 
                        ? (model.name ? `${model.name.toUpperCase()} FOR ${model.campaignName.toUpperCase()}` : `MODEL FOR ${model.campaignName.toUpperCase()}`)
                        : (model.name ? `${model.name.toUpperCase()} CAMPAIGN` : "MODEL CAMPAIGN"))}
                </span>
              </div>
            </div>
          )}

          {/* ROYAL ENFIELD 3x2 LOOKBOOK / BRAND LAYOUT */}
          {layout === "campaign-brand-6" && (
            <div className="absolute inset-0 w-full h-full flex select-none text-slate-900">
              
              {/* Grey panel on the right side */}
              <div 
                className="absolute top-0 bottom-0 right-0 bg-[#e6e6e6]"
                style={{ left: "179mm" }}
              />

              {/* Left Side: Elegant Double Text Blocks with Horizontal Divider */}
              <div 
                className="absolute flex flex-col items-center justify-center text-center"
                style={{ left: "0", width: "133mm", top: "35mm", bottom: "0" }}
              >
                <div className="flex flex-col items-center justify-center max-w-[110mm]">
                  {/* Block 1 (Top) */}
                  <div className="flex flex-col items-center mb-[14mm]">
                    <h2 className="text-[25px] font-sans font-light uppercase tracking-[0.16em] text-black leading-tight">
                      {model.campaignName || "ROYAL ENFIELD"}
                    </h2>
                    <p className="text-[21px] font-sans font-light uppercase tracking-[0.16em] text-black mt-1 leading-none">
                      {model.tvcLabelLeft || "CAMPAIGN"}
                    </p>
                  </div>

                  {/* Divider Line */}
                  <div className="w-[85mm] h-[1.8px] bg-black mb-[14mm]" />

                  {/* Block 2 (Bottom) */}
                  <div className="flex flex-col items-center">
                    <h2 className="text-[25px] font-sans font-light uppercase tracking-[0.16em] text-black leading-tight">
                      {model.customCaption || "ROYAL ENFIELD"}
                    </h2>
                    <p className="text-[21px] font-sans font-light uppercase tracking-[0.16em] text-black mt-1 leading-none">
                      {model.tvcLabelCenter || "CAMPAIGN"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side Image Grid: 3 columns, 2 rows */}
              <div 
                className="absolute"
                style={{ left: "133mm", top: "44mm", width: "148mm", height: "122mm" }}
              >
                <div className="grid grid-cols-3 gap-y-[6mm] gap-x-[4mm] w-full h-full">
                  
                  {/* Col 1 Row 1 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.imageLeft ? (
                        <CardImage
                          src={model.imageLeft}
                          alt="Layout 6 Img 1"
                          zoom={model.zoomLeft}
                          offsetX={model.offsetXLeft}
                          offsetY={model.offsetYLeft}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 1</p>
                          <p className="text-[6px] text-stone-400">Alto Sinistra</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2 Row 1 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.imageCenter ? (
                        <CardImage
                          src={model.imageCenter}
                          alt="Layout 6 Img 2"
                          zoom={model.zoomCenter}
                          offsetX={model.offsetXCenter}
                          offsetY={model.offsetYCenter}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 2</p>
                          <p className="text-[6px] text-stone-400">Alto Centro</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 3 Row 1 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.imageRight ? (
                        <CardImage
                          src={model.imageRight}
                          alt="Layout 6 Img 3"
                          zoom={model.zoomRight}
                          offsetX={model.offsetXRight}
                          offsetY={model.offsetYRight}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 3</p>
                          <p className="text-[6px] text-stone-400">Alto Destra</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 1 Row 2 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.image4 ? (
                        <CardImage
                          src={model.image4}
                          alt="Layout 6 Img 4"
                          zoom={model.zoom4}
                          offsetX={model.offsetX4}
                          offsetY={model.offsetY4}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 4</p>
                          <p className="text-[6px] text-stone-400">Basso Sinistra</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2 Row 2 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.image5 ? (
                        <CardImage
                          src={model.image5}
                          alt="Layout 6 Img 5"
                          zoom={model.zoom5}
                          offsetX={model.offsetX5}
                          offsetY={model.offsetY5}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 5</p>
                          <p className="text-[6px] text-stone-400">Basso Centro</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 3 Row 2 */}
                  <div className="bg-white p-0.5 hover:p-1 shadow-md border border-stone-200/40 relative flex flex-col justify-between w-[44mm] h-[58mm] z-10">
                    <div className="w-full h-full overflow-hidden relative bg-slate-150 flex items-center justify-center">
                      {model.image6 ? (
                        <CardImage
                          src={model.image6}
                          alt="Layout 6 Img 6"
                          zoom={model.zoom6}
                          offsetX={model.offsetX6}
                          offsetY={model.offsetY6}
                        />
                      ) : (
                        <div className="text-center p-2">
                          <p className="text-[8px] text-stone-500 font-bold uppercase">Foto 6</p>
                          <p className="text-[6px] text-stone-400">Basso Destra</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}



        </div>
      </div>

      {/* High Density Professional Characteristics Footer block */}
      {!model.hideSpecsBar && layout !== "campaign-brand-6" && layout !== "campaign-5-hybrid" && layout !== "editorial-6" ? (
        <footer className={model.specsBarWhiteBg ? "bg-white text-slate-950 rounded-md p-4 mt-2" : "bg-slate-950 text-white rounded-md p-4 mt-2 shadow-lg border border-slate-800"}>
          <div className="grid grid-cols-8 gap-1.5 text-left w-full">
            {/* H 1 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>ALTEZZA/height</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`}>
                {model.height ? `${model.height} cm` : "—"}
              </span>
            </div>

            {/* H 2 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>SENO/bust</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`}>
                {model.bust ? `${model.bust} cm` : "—"}
              </span>
            </div>

            {/* H 3 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>VITA/waist</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`}>
                {model.waist ? `${model.waist} cm` : "—"}
              </span>
            </div>

            {/* H 4 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>FIANCHI/hips</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`}>
                {model.hips ? `${model.hips} cm` : "—"}
              </span>
            </div>

            {/* H 5 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>SCARPE/shoes</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`}>
                {model.shoes || "—"}
              </span>
            </div>

            {/* H 6 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>OCCHI/eyes</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`} title={model.eyes}>
                {model.eyes || "—"}
              </span>
            </div>

            {/* H 7 */}
            <div className={`flex flex-col pl-2 ${model.specsBarWhiteBg ? "" : "border-r border-slate-800/80"}`}>
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>CAPELLI/hair</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-slate-950" : "text-white"}`} title={model.hair}>
                {model.hair || "—"}
              </span>
            </div>

            {/* H 8 */}
            <div className="flex flex-col pl-2">
              <span className={`text-[8px] font-semibold uppercase tracking-wider block ${model.specsBarWhiteBg ? "text-slate-500" : "text-slate-400"}`}>TAGLIA S/I size</span>
              <span className={`text-sm font-bold tracking-tight block mt-0.5 truncate ${model.specsBarWhiteBg ? "text-amber-600" : "text-amber-400"}`}>
                {model.sizeUpper ? `${model.sizeUpper}` : "—"} / {model.sizeLower ? `${model.sizeLower}` : "—"}
              </span>
            </div>
          </div>
        </footer>
      ) : model.customFooterText ? (
        <footer className={`rounded-md py-4 px-6 mt-2 flex justify-center items-center text-center ${
          model.customFooterWhiteBg 
            ? "bg-white text-slate-900 border-none shadow-none" 
            : "bg-slate-950 text-white border border-slate-800 shadow-sm"
        }`}>
          <span className={`text-[12px] font-sans font-bold tracking-[0.2em] uppercase leading-none ${
            model.customFooterWhiteBg ? "text-slate-900" : "text-white"
          }`}>
            {model.customFooterText}
          </span>
        </footer>
      ) : null}

      {/* Optional bottom-right album logo */}
      {model.showBottomRightLogo && (() => {
        const selectedLogo = (model.useShortLogoForBottomRight && agency.logoBreve) ? agency.logoBreve : agency.logo;
        if (!selectedLogo) return null;
        return (
          <div 
            className="absolute bottom-4 right-6 z-40 pointer-events-none flex items-center justify-end select-none"
            style={{ height: `${model.bottomRightLogoHeight || 28}px` }}
          >
            <img 
              src={selectedLogo} 
              alt="Album Bottom Right Logo" 
              className="object-contain h-full w-auto max-h-full"
              referrerPolicy="no-referrer"
              crossOrigin={getCrossOrigin(selectedLogo)}
            />
          </div>
        );
      })()}

    </div>
    </WatermarkContext.Provider>
  );
};
