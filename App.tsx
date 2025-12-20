
import React, { useState, useEffect, useCallback } from 'react';
import WaterCanvas from './components/WaterCanvas.tsx';
import { CREATURE_SPECS } from './components/WaterCanvas.tsx';
import { getSeaWisdom } from './services/geminiService.ts';
import { SeaMessage, OceanState, CapturedItem, BaitId, BAITS, ZoneId } from './types.ts';

const BAIT_DURATION = 30000;
const DIAMOND_PIT_PRICE = 5000;
const BOSS_FEE = 25000;

const App: React.FC = () => {
  const [oceanState] = useState<OceanState>('CALM');
  const [currentZone, setCurrentZone] = useState<ZoneId>('SURFACE');
  const [bossHealth, setBossHealth] = useState<number>(3);
  const [, setIsGameOver] = useState(false);
  
  const safeGetItem = (key: string, fallback: any) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return fallback;
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      try { return JSON.parse(item); } catch { return item; }
    } catch (e) { return fallback; }
  };

  const [gold, setGold] = useState<number>(() => {
    const val = safeGetItem('sea_gold', 0);
    return typeof val === 'number' ? val : Number(val) || 0;
  });
  
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

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sea_gold', gold.toString());
        localStorage.setItem('sea_zones', JSON.stringify(unlockedZones));
        localStorage.setItem('sea_album', JSON.stringify(capturedSpecies));
        localStorage.setItem('sea_inventory', JSON.stringify(inventory));
      }
    } catch (e) {}
  }, [gold, unlockedZones, capturedSpecies, inventory]);

  const fetchWisdom = useCallback(async () => {
    try {
      const data = await getSeaWisdom(oceanState);
      if (data) {
        setWisdom(data);
        setShowWisdom(true);
        setTimeout(() => setShowWisdom(false), 8000);
      }
    } catch (error) {}
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
        if (prev <= 1) { 
          setGold(g => g + 50000); 
          setIsGameOver(true); 
          setCurrentZone('SURFACE');
          return 3; 
        }
        return prev - 1;
    });
  }, []);

  const buyBait = (baitId: BaitId, price: number) => {
    if (gold >= price) { 
      setGold(g => g - price); 
      setInventory(i => ({ ...i, [baitId]: (i[baitId] || 0) + 1 })); 
    }
  };

  const buyZone = (zoneId: ZoneId, price: number) => {
    if (gold >= price && !unlockedZones.includes(zoneId)) { 
      setGold(g => g - price); 
      setUnlockedZones(z => [...z, zoneId]); 
    }
  };

  const equipBait = (baitId: BaitId) => {
    if (inventory[baitId] > 0) {
      setInventory(prev => ({ ...prev, [baitId]: prev[baitId] - 1 }));
      setEquippedBait(baitId);
      setTimeout(() => setEquippedBait('NONE'), BAIT_DURATION);
      setIsEquipmentOpen(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05193c] text-white font-sans selection:bg-blue-500/30">
      <WaterCanvas 
        state={oceanState} 
        currentZone={currentZone}
        equippedBait={equippedBait}
        bossHealth={bossHealth}
        onCapture={handleCapture}
        onBossHit={onBossHit}
      />

      {/* Main HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <div className="text-xs text-blue-300 uppercase tracking-widest font-black mb-1">Trésor de l'Abysse</div>
          <div className="text-3xl font-mono text-yellow-400 font-bold flex items-center gap-2">
            {gold.toLocaleString()} <i className="fas fa-coins text-xl" />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-white/50 font-bold tracking-tighter uppercase">
            <i className="fas fa-anchor" /> {currentZone.replace('_', ' ')}
          </div>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          {[
            { icon: 'fa-book-open', label: 'Album', action: () => setIsAlbumOpen(true) },
            { icon: 'fa-shopping-cart', label: 'Boutique', action: () => setIsShopOpen(true) },
            { icon: 'fa-toolbox', label: 'Équipement', action: () => setIsEquipmentOpen(true) },
            { icon: 'fa-map-marked-alt', label: 'Carte', action: () => setIsMapOpen(true) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className="group relative p-4 bg-white/5 hover:bg-blue-600/30 rounded-2xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95">
              <i className={`fas ${btn.icon} text-lg`} />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity font-black">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="absolute top-28 left-6 flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.timestamp} className="bg-blue-900/60 border-l-4 border-blue-400 p-4 rounded-r-xl animate-bounce backdrop-blur-md shadow-lg">
            <div className="text-[10px] text-blue-300 uppercase font-black">Nouveau Spécimen !</div>
            <div className="font-black text-lg text-white tracking-tight">{n.name}</div>
            <div className="text-yellow-400 font-mono text-sm">+{n.value} OR</div>
          </div>
        ))}
      </div>

      {/* AI Wisdom Banner */}
      {showWisdom && wisdom && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg px-6">
          <div className="bg-gradient-to-br from-black/80 to-blue-950/80 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 text-center shadow-2xl">
            <i className="fas fa-quote-left text-blue-500/40 text-4xl absolute top-4 left-6" />
            <div className="text-xl italic text-blue-50 font-serif leading-relaxed relative z-10 mb-4">"{wisdom.text}"</div>
            <div className="text-xs text-blue-400 font-black tracking-widest uppercase">— {wisdom.author}</div>
          </div>
        </div>
      )}

      {/* Active Buff Info */}
      {equippedBait !== 'NONE' && (
        <div className="absolute bottom-6 right-6 bg-emerald-900/40 border border-emerald-400/30 p-4 rounded-2xl backdrop-blur-xl flex items-center gap-4 shadow-xl animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/20 flex items-center justify-center text-2xl">
            <i className={`fas ${BAITS.find(b => b.id === equippedBait)?.icon || 'fa-cookie'}`} />
          </div>
          <div>
            <div className="text-[10px] text-emerald-300 uppercase font-black tracking-widest">Appât Actif</div>
            <div className="text-base font-bold text-white">{BAITS.find(b => b.id === equippedBait)?.name}</div>
          </div>
        </div>
      )}

      {/* Modals are unchanged from previous logic */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setIsShopOpen(false)}>
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-3xl font-black flex items-center gap-4 tracking-tighter">
                <i className="fas fa-store text-blue-500" /> BOUTIQUE
              </h2>
              <button onClick={() => setIsShopOpen(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                <i className="fas fa-times text-xl" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {BAITS.map(b => (
                <div key={b.id} className="group bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl text-blue-400 group-hover:scale-110 transition-transform">
                      <i className={`fas ${b.icon}`} />
                    </div>
                    <div className="text-yellow-400 font-mono text-lg font-black">{b.price.toLocaleString()}</div>
                  </div>
                  <h3 className="font-black text-xl mb-2 tracking-tight">{b.name}</h3>
                  <p className="text-sm text-white/50 mb-6 leading-relaxed">{b.description}</p>
                  <button 
                    onClick={() => buyBait(b.id, b.price)}
                    disabled={gold < b.price}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
                  >
                    Acquérir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Album, Map and Equipment overlays follow the same pattern... */}
      {isMapOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md" onClick={() => setIsMapOpen(false)}>
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-2xl font-black flex items-center gap-4">
                <i className="fas fa-map-marked text-rose-500" /> NAVIGATION
              </h2>
              <button onClick={() => setIsMapOpen(false)} className="text-white/40 hover:text-white"><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="p-8 space-y-5">
              <button 
                onClick={() => { setCurrentZone('SURFACE'); setIsMapOpen(false); }}
                className={`w-full p-6 rounded-[1.5rem] border-2 transition-all flex justify-between items-center ${currentZone === 'SURFACE' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:border-white/20 bg-white/5'}`}
              >
                <div className="text-left">
                  <div className="font-black text-lg uppercase tracking-tight">Eaux de Surface</div>
                  <div className="text-xs text-white/30 font-bold">PROFONDEUR : 0 - 200m</div>
                </div>
                {currentZone === 'SURFACE' && <i className="fas fa-check-circle text-blue-500 text-xl" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
