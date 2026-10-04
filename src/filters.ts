export interface ArtisticFilter {
  id: string;
  name: string;
  shortName: string;
  description: string;
  css: string;
  badgeColor: string;
  category: "natural" | "bn" | "vintage" | "editorial" | "warm";
  sampleTone: string;
}

export const ARTISTIC_FILTERS: ArtisticFilter[] = [
  {
    id: "none",
    name: "Naturale (Originale)",
    shortName: "Naturale",
    description: "Colori e contrasti originali dello scatto senza alcuna alterazione cromatica",
    css: "none",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    category: "natural",
    sampleTone: "#94a3b8",
  },
  {
    id: "bw",
    name: "Bianco e Nero Artistico",
    shortName: "B&N Artistico",
    description: "Elegante bianco e nero bilanciato, ideale per composit moda, polaroid ed editoriali",
    css: "grayscale(100%) contrast(115%) brightness(102%)",
    badgeColor: "bg-stone-900 text-stone-100 border-stone-800",
    category: "bn",
    sampleTone: "#475569",
  },
  {
    id: "noir",
    name: "B&N Noir Drammatico",
    shortName: "B&N Noir",
    description: "Bianco e nero cinematografico ad alto contrasto con ombre marcate e neri profondi",
    css: "grayscale(100%) contrast(145%) brightness(92%)",
    badgeColor: "bg-black text-white border-zinc-700",
    category: "bn",
    sampleTone: "#0f172a",
  },
  {
    id: "silver",
    name: "Silver Screen B&N",
    shortName: "Silver Screen",
    description: "Ritratti argentati morbidi e luminosi ispirati all'epoca d'oro del cinema classico",
    css: "grayscale(100%) brightness(110%) contrast(98%)",
    badgeColor: "bg-zinc-800 text-zinc-100 border-zinc-600",
    category: "bn",
    sampleTone: "#64748b",
  },
  {
    id: "sepia",
    name: "Seppia Caldo Archivio",
    shortName: "Seppia",
    description: "Classico effetto seppia fotografico per un look d'archivio e ritratti d'epoca raffinati",
    css: "sepia(75%) contrast(102%) brightness(95%)",
    badgeColor: "bg-amber-900/80 text-amber-100 border-amber-800",
    category: "vintage",
    sampleTone: "#78350f",
  },
  {
    id: "vintage",
    name: "Vintage Retrò Anni '70",
    shortName: "Vintage",
    description: "Tonalità calde d'epoca con leggera desaturazione analogica e grana morbida",
    css: "sepia(35%) contrast(105%) brightness(102%) saturate(85%) hue-rotate(-10deg)",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    category: "vintage",
    sampleTone: "#b45309",
  },
  {
    id: "cool",
    name: "Editorial Cool Scandinavo",
    shortName: "Editorial Cool",
    description: "Toni freddi moderni con accenti ciano/blu ideali per lookbook contemporanei e street style",
    css: "saturate(85%) hue-rotate(15deg) contrast(110%)",
    badgeColor: "bg-cyan-100 text-cyan-900 border-cyan-300",
    category: "editorial",
    sampleTone: "#0e7490",
  },
  {
    id: "warm",
    name: "Golden Hour Dorato",
    shortName: "Golden Hour",
    description: "Luce dorata radiosa con toni pelle caldi, solari e riflessi ambrati",
    css: "sepia(20%) saturate(125%) brightness(105%) contrast(105%)",
    badgeColor: "bg-orange-100 text-orange-950 border-orange-300",
    category: "warm",
    sampleTone: "#c2410c",
  },
  {
    id: "matte",
    name: "Matte Film Vellutato",
    shortName: "Matte Film",
    description: "Pellicola opaca a contrasto morbido con ombre vellutate stile rivista Vogue",
    css: "contrast(90%) brightness(110%) saturate(90%)",
    badgeColor: "bg-rose-100/70 text-rose-900 border-rose-300",
    category: "editorial",
    sampleTone: "#be185d",
  },
  {
    id: "dramatic",
    name: "Drammatico Alta Moda",
    shortName: "Drammatico",
    description: "Colori intensi, micro-contrasto pronunciato per copertine e campagne pubblicitarie",
    css: "contrast(135%) saturate(120%) brightness(95%)",
    badgeColor: "bg-purple-100 text-purple-950 border-purple-300",
    category: "editorial",
    sampleTone: "#6b21a8",
  },
  {
    id: "faded",
    name: "Faded Look Minimalista",
    shortName: "Faded Look",
    description: "Ombre schiarite e desaturazione pulita per un look magazine minimalista e sofisticato",
    css: "contrast(85%) brightness(115%) saturate(80%)",
    badgeColor: "bg-zinc-200 text-zinc-800 border-zinc-300",
    category: "editorial",
    sampleTone: "#52525b",
  },
  {
    id: "vibrant",
    name: "Vibrant Fashion Look",
    shortName: "Vibrant",
    description: "Saturazione vivace e nitidezza brillante per esaltare i colori dei tessuti e del trucco",
    css: "saturate(135%) contrast(108%) brightness(102%)",
    badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
    category: "editorial",
    sampleTone: "#047857",
  },
];

export const getFilterCss = (filterId?: string): string => {
  if (!filterId || filterId === "none") return "none";
  const found = ARTISTIC_FILTERS.find((f) => f.id === filterId);
  return found ? found.css : "none";
};

export const getFilterName = (filterId?: string): string => {
  if (!filterId || filterId === "none") return "Naturale";
  const found = ARTISTIC_FILTERS.find((f) => f.id === filterId);
  return found ? found.name : "Naturale";
};

export const getFilterById = (filterId?: string): ArtisticFilter => {
  if (!filterId || filterId === "none") return ARTISTIC_FILTERS[0];
  const found = ARTISTIC_FILTERS.find((f) => f.id === filterId);
  return found || ARTISTIC_FILTERS[0];
};
