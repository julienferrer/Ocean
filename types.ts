
export type OceanState = 'CALM' | 'STORMY' | 'CLEAR' | 'BOSS_BATTLE';
export type ZoneId = 'SURFACE' | 'DIAMOND_PIT' | 'ABYSSAL_VOID';

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
  chance: number; // 0 to 1
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

export type BaitId = 'NONE' | 'BREAD' | 'STANDARD' | 'DELUXE' | 'GLOW' | 'ABYSSAL' | 'FERMENTED' | 'PHEROMONES' | 'TECH' | 'SIREN_NECTAR' | 'SINGULARITY' | 'FALLEN_STAR' | 'VOID_ESSENCE';

export interface Bait {
  id: BaitId;
  name: string;
  description: string;
  price: number;
  icon: string;
  zone: 1 | 2;
}

export const BAITS: Bait[] = [
  // Zone 1
  { id: 'BREAD', name: 'Miettes de pain', description: 'Chance de spawn +2%', price: 250, icon: 'fa-bread-slice', zone: 1 },
  { id: 'STANDARD', name: 'Appât standard', description: 'Chance de spawn +5%', price: 1500, icon: 'fa-box', zone: 1 },
  { id: 'DELUXE', name: 'Appât de luxe', description: 'Chance de spawn +15%', price: 5000, icon: 'fa-gem', zone: 1 },
  { id: 'GLOW', name: 'Appât phosphorescent', description: '+30% de spawn sous l\'orage', price: 8000, icon: 'fa-lightbulb', zone: 1 },
  { id: 'ABYSSAL', name: 'Appât abyssal', description: 'Rares & Légendaires +25%', price: 12000, icon: 'fa-skull', zone: 1 },
  { id: 'FERMENTED', name: 'Appât fermenté', description: 'Attire 2 créatures d\'un coup', price: 20000, icon: 'fa-vial-circle-check', zone: 1 },
  { id: 'PHEROMONES', name: 'Phéromones marines', description: 'Légendaires +10%', price: 25000, icon: 'fa-flask-vial', zone: 1 },
  { id: 'TECH', name: 'Appât technologique', description: 'Scan auto de la créature', price: 50000, icon: 'fa-microchip', zone: 1 },
  // Zone 2 (Diamond Pit)
  { id: 'SIREN_NECTAR', name: 'Nectar de Sirène', description: 'Attire les mythiques de la zone 2', price: 150000, icon: 'fa-droplet', zone: 2 },
  { id: 'SINGULARITY', name: 'Appât à Singularité', description: 'Déforme l\'espace pour attirer le rare', price: 250000, icon: 'fa-circle-dot', zone: 2 },
  { id: 'FALLEN_STAR', name: 'Cœur d\'Étoile Déchue', description: 'Brille d\'une aura divine (+50% Mythique)', price: 400000, icon: 'fa-star', zone: 2 },
  { id: 'VOID_ESSENCE', name: 'Essence du Vide', description: 'Invoque les créatures du néant absolu', price: 500000, icon: 'fa-ghost', zone: 2 },
];
