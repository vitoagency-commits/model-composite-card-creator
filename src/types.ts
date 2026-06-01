export interface ModelData {
  id: string;
  name: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  shoes: string;
  eyes: string;
  hair: string;
  sizeUpper: string; // Taglia Superiore (e.g., S)
  sizeLower: string; // Taglia Inferiore (e.g., I)
  imageLeft: string; // base64 or URL
  imageCenter: string; // base64 or URL
  imageRight: string; // base64 or URL
  
  // Image position adjustments for perfect cropping
  zoomLeft: number;
  zoomCenter: number;
  zoomRight: number;
  offsetXLeft: number;
  offsetYLeft: number;
  offsetXCenter: number;
  offsetYCenter: number;
  offsetXRight: number;
  offsetYRight: number;
  layout?: "classic" | "duo" | "asymmetric-left" | "solo" | "grid-4" | "grid-6" | "editorial-6" | "grid-10" | "cinematic-2" | "campaign-2" | "campaign-2-portrait" | "campaign-wedding" | "campaign-3" | "campaign-seamless" | "campaign-tvc" | "campaign-solo" | "campaign-tvc-4" | "campaign-brand-6";
  campaignName?: string;
  customCaption?: string;
  tvcLabelLeft?: string;
  tvcLabelCenter?: string;
  tvcLabelRight?: string;
  tvcLabel4?: string;
  
  // Extra fields for 4 and 6 image layouts
  image4?: string;
  image5?: string;
  image6?: string;
  image7?: string;
  image8?: string;
  image9?: string;
  image10?: string;
  zoom4?: number;
  zoom5?: number;
  zoom6?: number;
  zoom7?: number;
  zoom8?: number;
  zoom9?: number;
  zoom10?: number;
  offsetX4?: number;
  offsetY4?: number;
  offsetX5?: number;
  offsetY5?: number;
  offsetX6?: number;
  offsetY6?: number;
  offsetX7?: number;
  offsetY7?: number;
  offsetX8?: number;
  offsetY8?: number;
  offsetX9?: number;
  offsetY9?: number;
  offsetX10?: number;
  offsetY10?: number;
  gender?: "model woman" | "model man" | "child model woman" | "child model man";
  hideSpecsBar?: boolean;
  hideHeaderName?: boolean;
  hideHeaderIndex?: boolean;
  hideSocialIcons?: boolean;
  hideHeaderLogo?: boolean;
  hideHeaderCategory?: boolean;
  hideHeaderContacts1?: boolean;
  hideHeaderContacts2?: boolean;
  hideHeaderContacts3?: boolean;
  customFooterText?: string;
  customFooterWhiteBg?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
}

export interface AgencyInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  web: string;
  email: string;
  portfolioDate?: string;
  logo?: string;
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  threads?: string;
  pinterest?: string;
}
