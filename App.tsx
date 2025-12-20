
import React, { useState, useEffect, useCallback, useRef } from 'react';
import WaterCanvas from './components/WaterCanvas.tsx';
import { CREATURE_SPECS } from './components/WaterCanvas.tsx';
import { getSeaWisdom } from './services/geminiService.ts';
import { SeaMessage, OceanState, CapturedItem, BaitId, BAITS, ZoneId } from './types.ts';

const BAIT_DURATION = 30000;
const DIAMOND_PIT_PRICE = 100000;
const ABYSSAL_VOID_PRICE = 500000;
const BOSS_MAX_HEALTH = 10;

interface PurchaseFeedback {
  id: string;
  baitId: BaitId;
  timestamp: number;
}

const App: React.FC = () => {
  const [oceanState] = useState<OceanState>('CALM');
  const [currentZone, setCurrentZone] = useState<ZoneId>('SURFACE');
  const [bossHealth, setBossHealth] = useState<number>(BOSS_MAX_HEALTH);
  const [isGameOver, setIsGameOver] = useState(false);
  const [purchaseFeedbacks, setPurchaseFeedbacks] = useState<PurchaseFeedback[]>([]);
  const [goldFlash, setGoldFlash] = useState(false);
  
  // Timer for active bait
  const [baitTimeRemaining, setBaitTimeRemaining] = useState<number>(0);
  const baitIntervalRef = useRef<number | null>(null);
  
  const safeGetItem = (key: string, fallback: any) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return fallback;
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      try { return JSON.parse(item); } catch { return item; }
    } catch (e) { return fallback; }
  };

  const [gold, setGold] = useState<number>(() => {
    const val = safeGetItem('sea_gold', null);
    if (val === null) return 1000; 
    return typeof val === 'number' ? val : Number(val) || 0;
  });
  
  const [unlockedZones, setUnlockedZones] = useState<ZoneId[]>(() => safeGetItem('sea_zones', ['SURFACE']));
  const [capturedSpecies, setCapturedSpecies] = useState<string[]>(() => safeGetItem('sea_album', []));
  const [inventory, setInventory] = useState<Record<BaitId, number>>(() => safeGetItem('sea_inventory', {
    NONE: 0, BREAD: 0, STANDARD: 0, DELUXE: 0, GLOW: 0, ABYSSAL: 0, FERMENTED: 0, PHEROMONES: 0, TECH: 0,
    SIREN_NECTAR: 0, SINGULARITY: 0, FALLEN_STAR: 0, VOID_ESSENCE: 0
  }));

  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [albumPage, setAlbumPage] = useState<ZoneId>('SURFACE');
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

  // Handle bait timer countdown
  useEffect(() => {
    if (baitTimeRemaining > 0) {
      if (baitIntervalRef.current) clearInterval(baitIntervalRef.current);
      
      baitIntervalRef.current = window.setInterval(() => {
        setBaitTimeRemaining(prev => {
          if (prev <= 100) {
            if (baitIntervalRef.current) clearInterval(baitIntervalRef.current);
            setEquippedBait('NONE');
            return 0;
          }
          return prev - 100;
        });
      }, 100);
    }
    return () => {
      if (baitIntervalRef.current) clearInterval(baitIntervalRef.current);
    };
  }, [baitTimeRemaining]);

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
          setGold(g => g + 2000000); 
          setIsGameOver(true); 
          return BOSS_MAX_HEALTH; 
        }
        return prev - 1;
    });
  }, []);

  const buyBait = (baitId: BaitId, price: number) => {
    if (gold >= price) { 
      setGold(prevGold => prevGold - price); 
      setInventory(prevInv => ({ ...prevInv, [baitId]: (prevInv[baitId] || 0) + 1 })); 
      
      const feedbackId = Math.random().toString(36);
      setPurchaseFeedbacks(prev => [...prev, { id: feedbackId, baitId, timestamp: Date.now() }]);
      setGoldFlash(true);
      
      setTimeout(() => {
        setPurchaseFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      }, 1000);
      
      setTimeout(() => setGoldFlash(false), 300);
    }
  };

  const buyZone = (zoneId: ZoneId, price: number) => {
    if (gold >= price && !unlockedZones.includes(zoneId)) { 
      setGold(prevGold => prevGold - price); 
      setUnlockedZones(z => [...z, zoneId]); 
      setGoldFlash(true);
      setTimeout(() => setGoldFlash(false), 300);
    }
  };

  const equipBait = (baitId: BaitId) => {
    if (inventory[baitId] > 0) {
      setInventory(prev => ({ ...prev, [baitId]: prev[baitId] - 1 }));
      setEquippedBait(baitId);
      setBaitTimeRemaining(BAIT_DURATION);
      setIsEquipmentOpen(false);
    }
  };

  const activeBaitData = BAITS.find(b => b.id === equippedBait);

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

      {/* Bait Duration Indicator */}
      {equippedBait !== 'NONE' && activeBaitData && (
        <div className="absolute top-32 left-6 z-30 animate-in slide-in-from-left duration-500">
          <div className="bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] w-56 overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl text-blue-400">
                <i className={`fas ${activeBaitData.icon}`} />
              </div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-blue-300 uppercase font-black tracking-widest">Appât Actif</div>
                <div className="font-bold text-sm text-white truncate">{activeBaitData.name}</div>
              </div>
            </div>
            
            <div className="relative h-2 bg-blue-900/40 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                style={{ width: `${(baitTimeRemaining / BAIT_DURATION) * 100}%` }}
              />
            </div>
            <div className="text-[10px] font-black text-blue-300/60 mt-2 text-right uppercase">
              {Math.ceil(baitTimeRemaining / 1000)}s restantes
            </div>
          </div>
        </div>
      )}

      {/* Boss Health Bar */}
      {currentZone === 'ABYSSAL_VOID' && !isGameOver && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pointer-events-none z-10 animate-in fade-in slide-in-from-top duration-700">
           <div className="text-center mb-2">
             <span className="text-rose-500 font-black tracking-widest text-lg uppercase italic drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">Le Gardien du Néant</span>
           </div>
           <div className="h-4 bg-black/60 border border-white/20 rounded-full overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.3)]">
             <div 
               className="h-full bg-gradient-to-r from-rose-800 to-rose-500 transition-all duration-300 ease-out"
               style={{ width: `${(bossHealth / BOSS_MAX_HEALTH) * 100}%` }}
             />
           </div>
           <div className="text-right text-[10px] font-black text-rose-400 mt-1 uppercase tracking-tighter">Énergie Vitale : {bossHealth}/{BOSS_MAX_HEALTH}</div>
        </div>
      )}

      {/* Main HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-20">
        <div className={`bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/20 pointer-events-auto shadow-2xl transition-all duration-300 ${goldFlash ? 'scale-110 border-yellow-400 bg-yellow-400/40' : ''}`}>
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
            { id: 'album', icon: 'fa-book-open', label: 'Album', action: () => setIsAlbumOpen(true) },
            { id: 'shop', icon: 'fa-shopping-cart', label: 'Boutique', action: () => setIsShopOpen(true) },
            { id: 'equip', icon: 'fa-toolbox', label: 'Équipement', action: () => setIsEquipmentOpen(true) },
            { id: 'map', icon: 'fa-map-marked-alt', label: 'Carte', action: () => setIsMapOpen(true) },
          ].map((btn) => (
            <button key={btn.id} onClick={btn.action} className="group relative p-4 bg-white/10 hover:bg-blue-600/50 rounded-2xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95">
              <i className={`fas ${btn.icon} text-lg`} />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity font-black">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL: SHOP */}
      {isShopOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsShopOpen(false)}>
          <div className="bg-slate-900 border-2 border-white/20 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-8 md:p-12 border-b border-white/10 flex justify-between items-center bg-slate-800">
              <div>
                <h2 className="text-4xl font-black flex items-center gap-6 tracking-tighter text-white">
                  <i className="fas fa-store text-blue-400" /> LA BOUTIQUE
                </h2>
                <div className="text-yellow-400 font-mono text-xl mt-2 flex items-center gap-2">
                  <i className="fas fa-coins" /> {gold.toLocaleString()} OR DISPONIBLE
                </div>
              </div>
              <button onClick={() => setIsShopOpen(false)} className="w-16 h-16 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center transition-all hover:rotate-90">
                <i className="fas fa-times text-2xl text-white" />
              </button>
            </div>
            
            <div className="p-8 md:p-12 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-900">
              {BAITS.map(b => (
                <div key={b.id} className="group relative bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all duration-300 flex flex-col h-full">
                  {purchaseFeedbacks.some(f => f.baitId === b.id) && (
                    <div className="absolute inset-0 z-20 bg-emerald-500/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem] animate-in fade-in zoom-in">
                      <i className="fas fa-check-circle text-6xl text-white animate-bounce" />
                      <div className="text-white font-black text-sm mt-3 uppercase tracking-widest">ACHETÉ !</div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-3xl text-blue-300">
                      <i className={`fas ${b.icon}`} />
                    </div>
                    <div className="text-yellow-400 font-mono text-lg font-black">{b.price.toLocaleString()}</div>
                  </div>
                  
                  <h3 className="font-black text-xl mb-2 text-white tracking-tight">{b.name}</h3>
                  <p className="text-xs text-blue-100/60 mb-6 leading-relaxed flex-grow">{b.description}</p>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); buyBait(b.id, b.price); }}
                    disabled={gold < b.price}
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 text-white cursor-pointer pointer-events-auto"
                  >
                    Acquérir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="absolute bottom-24 left-6 flex flex-col gap-3 pointer-events-none z-30">
        {notifications.map(n => (
          <div key={n.timestamp} className="bg-blue-900/80 border-l-4 border-blue-400 p-4 rounded-r-xl animate-bounce backdrop-blur-md shadow-lg w-64 border border-white/10">
            <div className="text-[10px] text-blue-300 uppercase font-black tracking-widest">Capture !</div>
            <div className="font-black text-lg text-white truncate">{n.name}</div>
            <div className="text-yellow-400 font-mono text-sm">+{n.value.toLocaleString()} 💰</div>
          </div>
        ))}
      </div>

      {/* Album Modal */}
      {isAlbumOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onClick={() => setIsAlbumOpen(false)}>
          <div className="bg-slate-900 border border-white/20 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/10 flex flex-col gap-4 bg-slate-800">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black flex items-center gap-4 tracking-tighter text-white">
                  <i className="fas fa-book-open text-purple-400" /> MON ALBUM ({capturedSpecies.length})
                </h2>
                <button onClick={() => setIsAlbumOpen(false)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center text-white"><i className="fas fa-times text-xl" /></button>
              </div>
              <div className="flex gap-4">
                {['SURFACE', 'DIAMOND_PIT'].map((z) => (
                  <button key={z} onClick={() => setAlbumPage(z as ZoneId)} className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${albumPage === z ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}>
                    {z.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 bg-slate-900">
              {CREATURE_SPECS.filter(s => s.zone === albumPage).map((spec, i) => {
                const isCaptured = capturedSpecies.includes(spec.name);
                return (
                  <div key={i} className={`p-4 rounded-3xl border transition-all ${isCaptured ? 'bg-white/10 border-white/20' : 'bg-black/40 border-white/5 opacity-50'}`}>
                    <div className="w-full aspect-square mb-3 rounded-2xl flex items-center justify-center" style={{ background: isCaptured ? `rgba(${spec.color.r}, ${spec.color.g}, ${spec.color.b}, 0.2)` : '#111' }}>
                      <i className={`fas ${isCaptured ? 'fa-certificate' : 'fa-question-circle'} text-2xl`} style={{ color: isCaptured ? `rgb(${spec.color.r}, ${spec.color.g}, ${spec.color.b})` : '#333' }} />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-[10px] text-white h-8 flex items-center justify-center">{isCaptured ? spec.name : '???'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onClick={() => setIsMapOpen(false)}>
          <div className="bg-slate-900 border border-white/20 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-800 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Navigation</h2>
              <button onClick={() => setIsMapOpen(false)}><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="p-8 space-y-4">
              <button onClick={() => { setCurrentZone('SURFACE'); setIsMapOpen(false); }} className={`w-full p-6 rounded-2xl border-2 ${currentZone === 'SURFACE' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'} flex justify-between items-center text-white`}>
                <span className="font-bold">Eaux de Surface</span>
                {currentZone === 'SURFACE' && <i className="fas fa-check" />}
              </button>
              
              {!unlockedZones.includes('DIAMOND_PIT') ? (
                <button onClick={() => buyZone('DIAMOND_PIT', DIAMOND_PIT_PRICE)} disabled={gold < DIAMOND_PIT_PRICE} className="w-full p-6 rounded-2xl bg-white/5 border border-dashed border-white/20 flex justify-between items-center text-white opacity-60 hover:opacity-100">
                  <span className="font-bold">Fosse de Diamant</span>
                  <span className="text-yellow-400 font-mono text-sm">{DIAMOND_PIT_PRICE.toLocaleString()} OR</span>
                </button>
              ) : (
                <button onClick={() => { setCurrentZone('DIAMOND_PIT'); setIsMapOpen(false); }} className={`w-full p-6 rounded-2xl border-2 ${currentZone === 'DIAMOND_PIT' ? 'border-cyan-500 bg-cyan-500/20' : 'border-white/10 bg-white/5'} flex justify-between items-center text-white`}>
                   <span className="font-bold">Fosse de Diamant</span>
                   {currentZone === 'DIAMOND_PIT' && <i className="fas fa-check" />}
                </button>
              )}

              {!unlockedZones.includes('ABYSSAL_VOID') ? (
                <button onClick={() => buyZone('ABYSSAL_VOID', ABYSSAL_VOID_PRICE)} disabled={gold < ABYSSAL_VOID_PRICE} className="w-full p-6 rounded-2xl bg-white/5 border border-dashed border-white/20 flex justify-between items-center text-white opacity-60 hover:opacity-100">
                  <span className="font-bold">Néant Abyssal</span>
                  <span className="text-yellow-400 font-mono text-sm">{ABYSSAL_VOID_PRICE.toLocaleString()} OR</span>
                </button>
              ) : (
                <button onClick={() => { setCurrentZone('ABYSSAL_VOID'); setIsMapOpen(false); }} className={`w-full p-6 rounded-2xl border-2 ${currentZone === 'ABYSSAL_VOID' ? 'border-rose-500 bg-rose-500/20' : 'border-white/10 bg-white/5'} flex justify-between items-center text-white`}>
                   <span className="font-bold text-rose-400">Néant Abyssal</span>
                   {currentZone === 'ABYSSAL_VOID' && <i className="fas fa-skull" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {isEquipmentOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" onClick={() => setIsEquipmentOpen(false)}>
          <div className="bg-slate-900 border border-white/20 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/10 bg-slate-800 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase">Inventaire d'Appâts</h2>
              <button onClick={() => setIsEquipmentOpen(false)}><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {Object.entries(inventory).map(([id, count]) => {
                const b = BAITS.find(bait => bait.id === id);
                if (!b || count === 0) return null;
                return (
                  <button key={id} onClick={() => equipBait(b.id)} className="w-full p-6 rounded-2xl bg-white/10 border border-white/10 hover:bg-blue-600/40 transition-all flex items-center justify-between group text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl text-blue-300">
                        <i className={`fas ${b.icon}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{b.name}</div>
                        <div className="text-[10px] text-white/50 uppercase font-black">{count} en stock</div>
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-white/20" />
                  </button>
                );
              })}
              {Object.values(inventory).every(v => v === 0) && (
                <div className="text-center py-12 text-white/20 italic">Votre inventaire est vide. Passez à la boutique !</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {isGameOver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white text-black p-12 text-center animate-in zoom-in duration-1000">
            <div className="max-w-2xl">
                <h1 className="text-7xl font-black mb-8 tracking-tighter uppercase italic">L'OCÉAN EST À VOUS</h1>
                <p className="text-xl mb-12 font-serif italic text-gray-500">"Le Gardien s'est dissipé. Vous êtes devenu la légende de ces eaux."</p>
                <div className="text-4xl font-black text-yellow-600 mb-12">BUTIN FINAL : 2,000,000 💰</div>
                <button onClick={() => window.location.reload()} className="px-12 py-6 bg-black text-white font-black uppercase tracking-[0.2em] text-sm hover:scale-110 active:scale-95 transition-all rounded-full shadow-2xl">Repartir à zéro</button>
            </div>
        </div>
      )}

      <style>{`
        @keyframes in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
