
export type OceanState = 'CALM' | 'STORMY' | 'CLEAR';
export type ZoneId = 'SURFACE' | 'DIAMOND_PIT' | 'ABYSSAL_VOID';
export type BaitId = 'NONE' | 'BREAD' | 'STANDARD' | 'DELUXE' | 'GLOW' | 'ABYSSAL' | 'FERMENTED' | 'PHEROMONES' | 'TECH' | 'SIREN_NECTAR' | 'SINGULARITY' | 'FALLEN_STAR' | 'VOID_ESSENCE';

export interface SeaMessage {
  text: string;
  author: string;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface CreatureData {
  name: string;
  chance: number;
  value: number;
  color: ColorRGB;
  baseSize: number;
  widthRatio: number;
  speed: number;
  zone: ZoneId;
}

export interface CapturedItem {
  name: string;
  value: number;
  chance: number;
  timestamp: number;
}

export interface BaitData {
  id: BaitId;
  name: string;
  price: number;
  description: string;
  icon: string;
  zone: number;
}

export const BAITS: BaitData[] = [
  { id: 'BREAD', name: 'Pain Rassis', price: 100, description: 'Attire les petites créatures de surface.', icon: 'fa-bread-slice', zone: 1 },
  { id: 'STANDARD', name: 'Appât Standard', price: 300, description: 'Efficace pour les poissons communs.', icon: 'fa-fish', zone: 1 },
  { id: 'DELUXE', name: 'Mélange Deluxe', price: 800, description: 'Augmente nettement la rareté des captures.', icon: 'fa-shrimp', zone: 1 },
  { id: 'GLOW', name: 'Plancton Lumineux', price: 1500, description: 'Idéal pendant les tempêtes.', icon: 'fa-sun', zone: 1 },
  { id: 'ABYSSAL', name: 'Essence Profonde', price: 3000, description: 'Nécessaire pour les abysses.', icon: 'fa-flask', zone: 2 },
  { id: 'VOID_ESSENCE', name: 'Essence du Néant', price: 10000, description: 'Attire les créatures légendaires.', icon: 'fa-vial-circle-check', zone: 2 }
];
