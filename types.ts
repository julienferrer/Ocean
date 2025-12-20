
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
  { id: 'BREAD', name: 'Pain Rassis', price: 50, description: 'Attire les petites créatures de surface.', icon: 'fa-bread-slice', zone: 1 },
  { id: 'STANDARD', name: 'Appât Standard', price: 200, description: 'Efficace pour les poissons communs.', icon: 'fa-fish', zone: 1 },
  { id: 'DELUXE', name: 'Mélange Deluxe', price: 600, description: 'Augmente nettement la rareté des captures.', icon: 'fa-shrimp', zone: 1 },
  { id: 'FERMENTED', name: 'Appât Fermenté', price: 1200, description: 'Une odeur forte qui attire les prédateurs.', icon: 'fa-vial', zone: 1 },
  { id: 'GLOW', name: 'Plancton Lumineux', price: 2000, description: 'Indispensable pour les zones sombres.', icon: 'fa-bolt', zone: 2 },
  { id: 'PHEROMONES', name: 'Phéromones Marines', price: 4000, description: 'Attire les spécimens les plus rares.', icon: 'fa-dna', zone: 2 },
  { id: 'ABYSSAL', name: 'Essence Profonde', price: 8000, description: 'Attire les monstres des abysses.', icon: 'fa-flask', zone: 2 },
  { id: 'SIREN_NECTAR', name: 'Nectar de Sirène', price: 15000, description: 'Un parfum irrésistible venu des profondeurs.', icon: 'fa-wine-bottle', zone: 2 },
  { id: 'TECH', name: 'Appât Magnétique', price: 25000, description: 'Technologie avancée pour poissons métalliques.', icon: 'fa-microchip', zone: 2 },
  { id: 'VOID_ESSENCE', name: 'Essence du Néant', price: 50000, description: 'Une substance noire qui attire le spectral.', icon: 'fa-moon', zone: 3 },
  { id: 'FALLEN_STAR', name: 'Étoile Tombée', price: 100000, description: 'Un éclat céleste pour attirer le divin.', icon: 'fa-star', zone: 3 },
  { id: 'SINGULARITY', name: 'Singularité', price: 250000, description: 'Déchire le voile de la réalité marine.', icon: 'fa-atom', zone: 3 }
];
