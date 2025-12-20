
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
      localStorage.setItem('sea_gold', gold.toString());
      localStorage.setItem('sea_zones', JSON.stringify(unlockedZones));
      localStorage.setItem('sea_album', JSON.stringify(capturedSpecies));
      localStorage.setItem('sea_inventory', JSON.stringify(inventory));
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

  // Fixed syntax error on line 109: replaced truncated 'if (bait' with correct inventory check
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
          <div key={n.timestamp} className="bg-blue-900/60 border-l-4 border-blue-400 p-4 rounded-r-xl animate-fade-in-left backdrop-blur-md shadow-lg">
            <div className="text-[10px] text-blue-300 uppercase font-black">Nouveau Spécimen !</div>
            <div className="font-black text-lg text-white tracking-tight">{n.name}</div>
            <div className="text-yellow-400 font-mono text-sm">+{n.value} OR</div>
          </div>
        ))}
      </div>

      {/* AI Wisdom Banner */}
      {showWisdom && wisdom && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 animate-fade-in-up">
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

      {/* Shop Overlay */}
      {isShopOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
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
              {!unlockedZones.includes('DIAMOND_PIT') && (
                <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 p-8 rounded-[2rem] md:col-span-2 mt-4 relative overflow-hidden">
                  <i className="fas fa-gem text-9xl absolute -bottom-10 -right-10 opacity-10 rotate-12" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-black text-2xl text-purple-200 uppercase tracking-tighter">Accès : Fosse de Diamant</h3>
                      <div className="text-yellow-400 font-mono text-xl font-black">{DIAMOND_PIT_PRICE.toLocaleString()} OR</div>
                    </div>
                    <p className="text-base text-purple-100/60 mb-8 max-w-md">Sondez les profondeurs inexplorées à la recherche de richesses ancestrales.</p>
                    <button 
                      onClick={() => buyZone('DIAMOND_PIT', DIAMOND_PIT_PRICE)}
                      disabled={gold < DIAMOND_PIT_PRICE}
                      className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-20 transition-all font-black uppercase tracking-widest shadow-xl shadow-purple-950/40"
                    >
                      Déverrouiller le Passage
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment Overlay */}
      {isEquipmentOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-2xl font-black flex items-center gap-4">
                <i className="fas fa-toolbox text-emerald-400" /> RÉSERVES
              </h2>
              <button onClick={() => setIsEquipmentOpen(false)} className="text-white/40 hover:text-white transition-colors"><i className="fas fa-times text-xl" /></button>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {Object.entries(inventory).map(([id, count]) => {
                  if (id === 'NONE' || count === 0) return null;
                  const bait = BAITS.find(b => b.id === id);
                  if (!bait) return null;
                  return (
                    <button 
                      key={id}
                      onClick={() => equipBait(id as BaitId)}
                      className="group w-full flex items-center gap-6 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600/20 hover:border-blue-400/40 transition-all text-left"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        <i className={`fas ${bait.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-lg tracking-tight">{bait.name}</div>
                        <div className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Disponible : {count}</div>
                      </div>
                      <i className="fas fa-arrow-right text-white/10 group-hover:translate-x-1 transition-transform" />
                    </button>
                  );
                })}
                {Object.values(inventory).every(c => c === 0) && (
                  <div className="text-center py-16">
                    <i className="fas fa-box-open text-6xl text-white/5 mb-6" />
                    <div className="text-white/30 font-black uppercase tracking-widest text-sm">Votre cale est vide</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Overlay */}
      {isMapOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
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

              <button 
                onClick={() => { if (unlockedZones.includes('DIAMOND_PIT')) { setCurrentZone('DIAMOND_PIT'); setIsMapOpen(false); } }}
                disabled={!unlockedZones.includes('DIAMOND_PIT')}
                className={`w-full p-6 rounded-[1.5rem] border-2 transition-all flex justify-between items-center ${!unlockedZones.includes('DIAMOND_PIT') ? 'opacity-20 grayscale' : (currentZone === 'DIAMOND_PIT' ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:border-white/20 bg-white/5')}`}
              >
                <div className="text-left">
                  <div className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                    Fosse de Diamant {!unlockedZones.includes('DIAMOND_PIT') && <i className="fas fa-lock text-sm" />}
                  </div>
                  <div className="text-xs text-white/30 font-bold">PROFONDEUR : 2000 - 5000m</div>
                </div>
                {currentZone === 'DIAMOND_PIT' && <i className="fas fa-check-circle text-purple-500 text-xl" />}
              </button>

              <button 
                onClick={() => { if (gold >= BOSS_FEE) { setGold(g => g - BOSS_FEE); setCurrentZone('ABYSSAL_VOID'); setIsMapOpen(false); setBossHealth(3); } }}
                className={`group w-full p-6 rounded-[1.5rem] border-2 border-rose-500/30 hover:border-rose-500 hover:bg-rose-500/10 transition-all flex justify-between items-center ${currentZone === 'ABYSSAL_VOID' ? 'border-rose-500 bg-rose-500/20 shadow-lg shadow-rose-950/40' : ''}`}
              >
                <div className="text-left">
                  <div className="font-black text-lg uppercase tracking-tight text-rose-500 group-hover:animate-pulse">Le Néant Abyssal</div>
                  <div className="text-xs text-rose-500/60 font-black mt-1 uppercase tracking-widest">PRIX D'EXPÉDITION : {BOSS_FEE.toLocaleString()} OR</div>
                </div>
                <i className="fas fa-skull-crossbones text-rose-500 text-2xl group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Album Overlay */}
      {isAlbumOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-white/5 flex justify-between items-end bg-slate-800/50">
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase mb-2">
                  <i className="fas fa-book text-yellow-500 mr-4" /> Codex Marin
                </h2>
                <div className="text-xs text-white/40 uppercase tracking-[0.3em] font-black">
                  Exploration : {capturedSpecies.length} / {CREATURE_SPECS.length} Espèces Découvertes
                </div>
              </div>
              <button onClick={() => setIsAlbumOpen(false)} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                <i className="fas fa-times text-xl" />
              </button>
            </div>
            <div className="p-10 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {CREATURE_SPECS.map(s => {
                const isCaptured = capturedSpecies.includes(s.name);
                return (
                  <div key={s.name} className={`aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center p-6 transition-all duration-500 relative overflow-hidden group ${isCaptured ? 'bg-white/5 border-blue-500/30 shadow-xl' : 'bg-black/40 border-white/5 opacity-30 grayscale'}`}>
                    {isCaptured && <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/10 pointer-events-none" />}
                    <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ background: isCaptured ? `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, 0.15)` : 'rgba(255,255,255,0.05)' }}>
                      <i className={`fas ${isCaptured ? 'fa-fish' : 'fa-dna'} text-4xl`} style={{ color: isCaptured ? `rgb(${s.color.r}, ${s.color.g}, ${s.color.b})` : 'white' }} />
                    </div>
                    <div className="text-center relative z-10">
                      <div className="font-black text-sm uppercase tracking-tight truncate w-full mb-1">{isCaptured ? s.name : 'Inconnu'}</div>
                      {isCaptured && <div className="text-xs font-mono text-yellow-500 font-bold">{s.value.toLocaleString()} Or</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed missing default export
export default App;
