
import React, { useState, useEffect, useCallback, useRef } from 'react';
import WaterCanvas, { CREATURE_SPECS } from './components/WaterCanvas';
import { getSeaWisdom } from './services/geminiService';
import { SeaMessage, OceanState, CapturedItem, BaitId, BAITS, ZoneId } from './types';

const BAIT_DURATION = 30000;
const DIAMOND_PIT_PRICE = 5000;
const BOSS_FEE = 25000;

const App: React.FC = () => {
  const [oceanState, setOceanState] = useState<OceanState>('CALM');
  const [currentZone, setCurrentZone] = useState<ZoneId>('SURFACE');
  const [bossHealth, setBossHealth] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // État persistant avec gestion d'erreur pour le SSR/LocalStorage
  const [gold, setGold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sea_gold');
      return saved ? parseInt(saved) : 0;
    } catch (e) { return 0; }
  });
  
  const [unlockedZones, setUnlockedZones] = useState<ZoneId[]>(() => {
    try {
      const saved = localStorage.getItem('sea_zones');
      return saved ? JSON.parse(saved) : ['SURFACE'];
    } catch (e) { return ['SURFACE']; }
  });

  const [capturedSpecies, setCapturedSpecies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sea_album');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [inventory, setInventory] = useState<Record<BaitId, number>>(() => {
    try {
      const saved = localStorage.getItem('sea_inventory');
      return saved ? JSON.parse(saved) : {
          NONE: 0, BREAD: 0, STANDARD: 0, DELUXE: 0, GLOW: 0, ABYSSAL: 0, FERMENTED: 0, PHEROMONES: 0, TECH: 0,
          SIREN_NECTAR: 0, SINGULARITY: 0, FALLEN_STAR: 0, VOID_ESSENCE: 0
      };
    } catch (e) {
      return {
        NONE: 0, BREAD: 0, STANDARD: 0, DELUXE: 0, GLOW: 0, ABYSSAL: 0, FERMENTED: 0, PHEROMONES: 0, TECH: 0,
        SIREN_NECTAR: 0, SINGULARITY: 0, FALLEN_STAR: 0, VOID_ESSENCE: 0
      };
    }
  });

  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [notifications, setNotifications] = useState<CapturedItem[]>([]);
  const [wisdom, setWisdom] = useState<SeaMessage | null>(null);
  const [showWisdom, setShowWisdom] = useState(false);
  const [equippedBait, setEquippedBait] = useState<BaitId>('NONE');
  const [baitTimeLeft, setBaitTimeLeft] = useState<number>(0);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sea_gold', gold.toString());
      localStorage.setItem('sea_zones', JSON.stringify(unlockedZones));
      localStorage.setItem('sea_album', JSON.stringify(capturedSpecies));
      localStorage.setItem('sea_inventory', JSON.stringify(inventory));
    } catch (e) { /* Storage full or private mode */ }
  }, [gold, unlockedZones, capturedSpecies, inventory]);

  const fetchWisdom = useCallback(async () => {
    try {
      const data = await getSeaWisdom(oceanState);
      setWisdom(data);
      setShowWisdom(true);
      setTimeout(() => setShowWisdom(false), 8000);
    } catch (error) {
      console.error("Wisdom failure:", error);
    }
  }, [oceanState]);

  useEffect(() => {
    fetchWisdom();
    const interval = setInterval(fetchWisdom, 60000);
    return () => clearInterval(interval);
  }, [fetchWisdom]);

  const handleCapture = useCallback((name: string, value: number, chance: number) => {
    setGold(prev => prev + value);
    if (!capturedSpecies.includes(name)) setCapturedSpecies(prev => [...prev, name]);
    const newNotif = { name, value, chance, timestamp: Date.now() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 3));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.timestamp !== newNotif.timestamp)), 3000);
  }, [capturedSpecies]);

  const onBossHit = useCallback(() => {
    setBossHealth(prev => {
        if (prev <= 1) { setGold(g => g + 50000); setIsGameOver(true); return 0; }
        return prev - 1;
    });
  }, []);

  const buyBait = (baitId: BaitId, price: number) => {
    if (gold >= price) { setGold(g => g - price); setInventory(i => ({ ...i, [baitId]: i[baitId] + 1 })); }
  };

  const buyZone = (zoneId: ZoneId, price: number) => {
    if (gold >= price && !unlockedZones.includes(zoneId)) { setGold(g => g - price); setUnlockedZones(z => [...z, zoneId]); }
  };

  const equipBait = (baitId: BaitId) => {
    if (baitId === 'NONE') { setEquippedBait('NONE'); setBaitTimeLeft(0); setIsEquipmentOpen(false); return; }
    if (inventory[baitId] > 0) { setInventory(i => ({ ...i, [baitId]: i[baitId] - 1 })); setEquippedBait(baitId); setBaitTimeLeft(BAIT_DURATION); setIsEquipmentOpen(false); }
  };

  return (
    <div className="relative w-full h-screen bg-[#05193c] overflow-hidden select-none font-serif">
      <WaterCanvas state={oceanState} currentZone={currentZone} equippedBait={equippedBait} bossHealth={bossHealth} onCapture={handleCapture} onBossHit={onBossHit} />

      {/* Header UI */}
      <header className="fixed top-0 left-0 w-full p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-black/30 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
          <h1 className="text-white text-xl md:text-2xl italic">{currentZone === 'SURFACE' ? 'Surface' : currentZone === 'DIAMOND_PIT' ? 'Abysses' : 'Le Néant'}</h1>
          <p className="text-white/40 text-[8px] uppercase tracking-widest mt-1">Sagesse: {wisdom?.author || 'Océan'}</p>
        </div>
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-3xl px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
             <i className="fa-solid fa-gem text-blue-400"></i>
             <span className="text-white font-mono text-lg">{gold.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsMapOpen(true)} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all"><i className="fa-solid fa-map"></i></button>
            <button onClick={() => setIsShopOpen(true)} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all"><i className="fa-solid fa-cart-shopping"></i></button>
            <button onClick={() => setIsEquipmentOpen(true)} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all"><i className="fa-solid fa-suitcase"></i></button>
            <button onClick={() => setIsAlbumOpen(true)} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all"><i className="fa-solid fa-book"></i></button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {(isAlbumOpen || isShopOpen || isEquipmentOpen || isMapOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }}></div>
          <div className="relative w-full max-w-2xl bg-[#0a1f4d] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col animate-scale-up h-[80vh]">
            <header className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white text-xl italic">{isAlbumOpen ? 'Album' : isShopOpen ? 'Boutique' : isEquipmentOpen ? 'Inventaire' : 'Navigation'}</h2>
              <button onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }} className="text-white text-2xl">×</button>
            </header>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {isAlbumOpen && (
                <div className="grid grid-cols-3 gap-3">
                  {CREATURE_SPECS.map(c => (
                    <div key={c.name} className={`p-4 rounded-2xl border transition-all ${capturedSpecies.includes(c.name) ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-30'}`}>
                      <p className="text-[10px] text-white text-center truncate">{capturedSpecies.includes(c.name) ? c.name : '???'}</p>
                    </div>
                  ))}
                </div>
              )}
              {isShopOpen && (
                <div className="space-y-4">
                  {BAITS.map(b => (
                    <div key={b.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center">
                      <div>
                        <h4 className="text-white text-sm italic">{b.name}</h4>
                        <p className="text-[9px] text-white/40">{b.description}</p>
                      </div>
                      <button onClick={() => buyBait(b.id, b.price)} className="bg-blue-600 px-4 py-2 rounded-xl text-white text-[10px] uppercase font-bold">{b.price} 💰</button>
                    </div>
                  ))}
                  {!unlockedZones.includes('DIAMOND_PIT') && (
                    <button onClick={() => buyZone('DIAMOND_PIT', DIAMOND_PIT_PRICE)} className="w-full p-6 bg-purple-900/20 border border-purple-500/30 rounded-3xl text-white text-xs italic">Débloquer les Abysses ({DIAMOND_PIT_PRICE} 💰)</button>
                  )}
                </div>
              )}
              {isEquipmentOpen && (
                <div className="space-y-3">
                  <div onClick={() => equipBait('NONE')} className={`p-4 border rounded-2xl cursor-pointer ${equippedBait === 'NONE' ? 'bg-blue-600/20 border-blue-500' : 'border-white/10'}`}>
                    <p className="text-white text-xs italic">Sans appât</p>
                  </div>
                  {BAITS.map(b => inventory[b.id] > 0 && (
                    <div key={b.id} onClick={() => equipBait(b.id)} className={`p-4 border rounded-2xl cursor-pointer flex justify-between ${equippedBait === b.id ? 'bg-blue-600/20 border-blue-500' : 'border-white/10'}`}>
                      <p className="text-white text-xs italic">{b.name}</p>
                      <p className="text-white/40 text-[9px]">x{inventory[b.id]}</p>
                    </div>
                  ))}
                </div>
              )}
              {isMapOpen && (
                <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => setCurrentZone('SURFACE')} className={`p-6 rounded-3xl border transition-all ${currentZone === 'SURFACE' ? 'bg-blue-600/20 border-blue-500' : 'border-white/10'}`}>Surface</button>
                  {unlockedZones.includes('DIAMOND_PIT') && (
                    <button onClick={() => setCurrentZone('DIAMOND_PIT')} className={`p-6 rounded-3xl border transition-all ${currentZone === 'DIAMOND_PIT' ? 'bg-purple-600/20 border-purple-500' : 'border-white/10'}`}>Abysses</button>
                  )}
                  <button onClick={() => gold >= BOSS_FEE && setCurrentZone('ABYSSAL_VOID')} className={`p-6 rounded-3xl border text-red-500 ${gold < BOSS_FEE ? 'opacity-20 grayscale' : 'border-red-500/30 bg-red-950/10'}`}>Le Portail ({BOSS_FEE} 💰)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-10 right-6 left-6 md:left-auto z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.timestamp} className="bg-black/60 backdrop-blur-2xl border border-white/10 text-white px-5 py-3 rounded-2xl animate-bounce-in flex justify-between items-center shadow-2xl">
            <span className="text-xs italic">{n.name}</span>
            <span className="text-yellow-500 text-[10px] font-mono">+{n.value} 💰</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounce-in { 0% { transform: scale(0.9) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes scale-up { 0% { transform: scale(0.98) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
