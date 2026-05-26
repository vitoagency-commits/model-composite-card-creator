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
  layout?: "classic" | "duo" | "asymmetric-left" | "solo" | "grid-4" | "grid-6" | "editorial-6";
  
  // Extra fields for 4 and 6 image layouts
  image4?: string;
  image5?: string;
  image6?: string;
  zoom4?: number;
  zoom5?: number;
  zoom6?: number;
  offsetX4?: number;
  offsetY4?: number;
  offsetX5?: number;
  offsetY5?: number;
  offsetX6?: number;
  offsetY6?: number;
  gender?: "model woman" | "model man" | "child model woman" | "child model man";
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
