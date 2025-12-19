
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
  
  // Fonctions utilitaires pour le stockage sécurisé
  const safeGetItem = (key: string, fallback: any) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      try { return JSON.parse(item); } catch { return item; }
    } catch (e) { return fallback; }
  };

  const [gold, setGold] = useState<number>(() => Number(safeGetItem('sea_gold', 0)));
  const [unlockedZones, setUnlockedZones] = useState<ZoneId[]>(() => safeGetItem('sea_zones', ['SURFACE']));
  const [capturedSpecies, setCapturedSpecies] = useState<string[]>(() => safeGetItem('sea_album', []));
  const [inventory, setInventory] = useState<Record<BaitId, number>>(() => safeGetItem('sea_inventory', {
    NONE: 0, BREAD: 0, STANDARD: 0, DELUXE: 0, GLOW: 0, ABYSSAL: 0, FERMENTED: 0, PHEROMONES: 0, TECH: 0,
    SIREN_NECTAR: 0, SINGULARITY: 0, FALLEN_STAR: 0, VOID_ESSENCE: 0
  }));

  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [notifications, setNotifications] = useState<CapturedItem[]>([]);
  const [wisdom, setWisdom] = useState<SeaMessage | null>(null);
  const [showWisdom, setShowWisdom] = useState(false);
  const [equippedBait, setEquippedBait] = useState<BaitId>('NONE');
  const [baitTimeLeft, setBaitTimeLeft] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('sea_gold', gold.toString());
      localStorage.setItem('sea_zones', JSON.stringify(unlockedZones));
      localStorage.setItem('sea_album', JSON.stringify(capturedSpecies));
      localStorage.setItem('sea_inventory', JSON.stringify(inventory));
    } catch (e) { /* Storage issues */ }
  }, [gold, unlockedZones, capturedSpecies, inventory]);

  const fetchWisdom = useCallback(async () => {
    try {
      const data = await getSeaWisdom(oceanState);
      if (data) {
        setWisdom(data);
        setShowWisdom(true);
        setTimeout(() => setShowWisdom(false), 8000);
      }
    } catch (error) {
      console.error("Wisdom logic failed:", error);
    }
  }, [oceanState]);

  useEffect(() => {
    fetchWisdom();
    const interval = setInterval(fetchWisdom, 60000);
    return () => clearInterval(interval);
  }, [fetchWisdom]);

  const handleCapture = useCallback((name: string, value: number, chance: number) => {
    setGold(prev => prev + value);
    setCapturedSpecies(prev => prev.includes(name) ? prev : [...prev, name]);
    const newNotif = { name, value, chance, timestamp: Date.now() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 3));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.timestamp !== newNotif.timestamp)), 3000);
  }, []);

  const onBossHit = useCallback(() => {
    setBossHealth(prev => {
        if (prev <= 1) { setGold(g => g + 50000); setIsGameOver(true); return 0; }
        return prev - 1;
    });
  }, []);

  const buyBait = (baitId: BaitId, price: number) => {
    if (gold >= price) { setGold(g => g - price); setInventory(i => ({ ...i, [baitId]: (i[baitId] || 0) + 1 })); }
  };

  const buyZone = (zoneId: ZoneId, price: number) => {
    if (gold >= price && !unlockedZones.includes(zoneId)) { setGold(g => g - price); setUnlockedZones(z => [...z, zoneId]); }
  };

  const equipBait = (baitId: BaitId) => {
    if (baitId === 'NONE') { setEquippedBait('NONE'); setBaitTimeLeft(0); setIsEquipmentOpen(false); return; }
    if (inventory[baitId] > 0) { 
      setInventory(i => ({ ...i, [baitId]: i[baitId] - 1 })); 
      setEquippedBait(baitId); 
      setBaitTimeLeft(BAIT_DURATION); 
      setIsEquipmentOpen(false); 
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#05193c] overflow-hidden select-none font-serif">
      <WaterCanvas state={oceanState} currentZone={currentZone} equippedBait={equippedBait} bossHealth={bossHealth} onCapture={handleCapture} onBossHit={onBossHit} />

      {/* Header UI */}
      <header className="fixed top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-white text-lg md:text-2xl italic tracking-tight">
            {currentZone === 'SURFACE' ? 'Surface' : currentZone === 'DIAMOND_PIT' ? 'Abysses' : 'Le Néant'}
          </h1>
          <p className="text-white/40 text-[7px] md:text-[8px] uppercase tracking-[0.3em] mt-1 font-bold">
            {oceanState === 'STORMY' ? 'Tempête' : 'Eaux Calmes'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-3xl px-5 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
             <i className="fa-solid fa-gem text-blue-400 text-sm"></i>
             <span className="text-white font-mono text-base md:text-xl font-bold tracking-tighter">{gold.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsMapOpen(true)} className="bg-white/10 w-10 h-10 md:w-12 md:h-12 rounded-full text-white hover:bg-white/20 transition-all border border-white/5 flex items-center justify-center shadow-lg"><i className="fa-solid fa-map text-xs"></i></button>
            <button onClick={() => setIsShopOpen(true)} className="bg-white/10 w-10 h-10 md:w-12 md:h-12 rounded-full text-white hover:bg-white/20 transition-all border border-white/5 flex items-center justify-center shadow-lg"><i className="fa-solid fa-cart-shopping text-xs"></i></button>
            <button onClick={() => setIsEquipmentOpen(true)} className="bg-white/10 w-10 h-10 md:w-12 md:h-12 rounded-full text-white hover:bg-white/20 transition-all border border-white/5 flex items-center justify-center shadow-lg"><i className="fa-solid fa-suitcase text-xs"></i></button>
            <button onClick={() => setIsAlbumOpen(true)} className="bg-white/10 w-10 h-10 md:w-12 md:h-12 rounded-full text-white hover:bg-white/20 transition-all border border-white/5 flex items-center justify-center shadow-lg"><i className="fa-solid fa-book text-xs"></i></button>
          </div>
        </div>
      </header>

      {/* Modals */}
      {(isAlbumOpen || isShopOpen || isEquipmentOpen || isMapOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }}></div>
          <div className="relative w-full max-w-2xl bg-[#0a1f4d] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col animate-scale-up h-[75vh] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-white text-xl italic font-light tracking-wide">
                {isAlbumOpen ? 'Collection Marine' : isShopOpen ? 'Marchand de Sable' : isEquipmentOpen ? 'Équipement' : 'Navigation'}
              </h2>
              <button onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }} className="text-white/50 hover:text-white transition-colors text-3xl font-light">×</button>
            </header>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {isAlbumOpen && (
                <div className="grid grid-cols-3 gap-3">
                  {CREATURE_SPECS.map(c => (
                    <div key={c.name} className={`p-4 rounded-2xl border transition-all ${capturedSpecies.includes(c.name) ? 'bg-white/5 border-white/20' : 'bg-black/20 border-white/5 opacity-30'}`}>
                      <p className="text-[10px] text-white/90 text-center truncate font-light tracking-tight">{capturedSpecies.includes(c.name) ? c.name : '???'}</p>
                    </div>
                  ))}
                </div>
              )}
              {isShopOpen && (
                <div className="space-y-3">
                  {BAITS.map(b => (
                    <div key={b.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl flex justify-between items-center hover:bg-white/[0.05] transition-colors">
                      <div className="pr-4">
                        <h4 className="text-white text-sm italic font-medium">{b.name}</h4>
                        <p className="text-[9px] text-white/40 leading-relaxed mt-1">{b.description}</p>
                      </div>
                      <button onClick={() => buyBait(b.id, b.price)} className={`px-4 py-2 rounded-xl text-[10px] uppercase font-bold transition-all ${gold >= b.price ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-white/20'}`}>{b.price} 💰</button>
                    </div>
                  ))}
                  {!unlockedZones.includes('DIAMOND_PIT') && (
                    <button onClick={() => buyZone('DIAMOND_PIT', DIAMOND_PIT_PRICE)} className={`w-full p-6 border rounded-3xl text-xs italic transition-all ${gold >= DIAMOND_PIT_PRICE ? 'bg-purple-900/30 border-purple-500/50 text-white' : 'bg-white/5 border-white/5 text-white/20'}`}>Débloquer les Abysses de Diamant ({DIAMOND_PIT_PRICE} 💰)</button>
                  )}
                </div>
              )}
              {isEquipmentOpen && (
                <div className="space-y-3">
                  <div onClick={() => equipBait('NONE')} className={`p-4 border rounded-2xl cursor-pointer transition-all ${equippedBait === 'NONE' ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'border-white/5 bg-white/[0.01] text-white/30'}`}>
                    <p className="text-xs italic">Pur (Aucun appât)</p>
                  </div>
                  {BAITS.map(b => (inventory[b.id] || 0) > 0 && (
                    <div key={b.id} onClick={() => equipBait(b.id)} className={`p-4 border rounded-2xl cursor-pointer flex justify-between items-center transition-all ${equippedBait === b.id ? 'bg-blue-600/10 border-blue-500/50 text-white' : 'border-white/5 bg-white/[0.01] text-white/40'}`}>
                      <p className="text-xs italic">{b.name}</p>
                      <p className="text-[10px] font-bold opacity-50">x{inventory[b.id]}</p>
                    </div>
                  ))}
                </div>
              )}
              {isMapOpen && (
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => { setCurrentZone('SURFACE'); setIsMapOpen(false); }} className={`p-6 rounded-3xl border transition-all text-sm italic ${currentZone === 'SURFACE' ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'border-white/5 bg-white/[0.02] text-white/50'}`}>Eaux de Surface</button>
                  {unlockedZones.includes('DIAMOND_PIT') && (
                    <button onClick={() => { setCurrentZone('DIAMOND_PIT'); setIsMapOpen(false); }} className={`p-6 rounded-3xl border transition-all text-sm italic ${currentZone === 'DIAMOND_PIT' ? 'bg-purple-600/20 border-purple-500/50 text-white' : 'border-white/5 bg-white/[0.02] text-white/50'}`}>Abysses de Diamant</button>
                  )}
                  <button onClick={() => { if(gold >= BOSS_FEE) { setCurrentZone('ABYSSAL_VOID'); setIsMapOpen(false); } }} className={`p-6 rounded-3xl border text-sm italic ${gold < BOSS_FEE ? 'opacity-20 grayscale cursor-not-allowed text-white/40' : 'border-red-500/30 bg-red-950/10 text-red-500'}`}>Portail du Néant ({BOSS_FEE} 💰)</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wisdom Overlay */}
      {showWisdom && wisdom && (
        <div className="fixed inset-x-0 bottom-24 flex justify-center pointer-events-none px-10 z-10">
          <div className="text-center animate-fade-in max-w-xl">
             <p className="text-white/70 text-lg md:text-xl italic font-light drop-shadow-md">"{wisdom.text}"</p>
             <p className="text-white/30 text-[9px] uppercase tracking-widest mt-2">— {wisdom.author}</p>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-10 right-6 left-6 md:right-8 md:left-auto z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.timestamp} className="bg-black/80 backdrop-blur-2xl border border-white/10 text-white px-5 py-3 rounded-2xl animate-bounce-in flex justify-between items-center shadow-2xl min-w-[200px]">
            <span className="text-xs italic font-light tracking-tight">{n.name}</span>
            <span className="text-yellow-500 text-[10px] font-mono font-bold ml-4">+{n.value} 💰</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounce-in { 0% { transform: scale(0.9) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes scale-up { 0% { transform: scale(0.98) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 2s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        body { background-color: #05193c; }
      `}</style>
      
      {/* Visual Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[15] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      <div className="fixed inset-0 pointer-events-none z-[15] opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]"></div>
    </div>
  );
};

export default App;
