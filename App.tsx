
import React, { useState, useEffect, useCallback, useRef } from 'react';
import WaterCanvas, { CREATURE_SPECS } from './components/WaterCanvas';
import { getSeaWisdom } from './services/geminiService';
import { SeaMessage, OceanState, CapturedItem, BaitId, BAITS, ZoneId } from './types';

const BAIT_DURATION = 30000;
const DIAMOND_PIT_PRICE = 100000;
const BOSS_FEE = 500000;

const App: React.FC = () => {
  const [oceanState, setOceanState] = useState<OceanState>('CALM');
  const [currentZone, setCurrentZone] = useState<ZoneId>('SURFACE');
  const [unlockedZones, setUnlockedZones] = useState<ZoneId[]>(['SURFACE']);
  const [gold, setGold] = useState<number>(0); 
  const [bossHealth, setBossHealth] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [capturedSpecies, setCapturedSpecies] = useState<string[]>(() => {
    const saved = localStorage.getItem('capturedSpecies');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [albumTab, setAlbumTab] = useState<ZoneId>('SURFACE');
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [notifications, setNotifications] = useState<CapturedItem[]>([]);
  const [wisdom, setWisdom] = useState<SeaMessage | null>(null);
  const [showWisdom, setShowWisdom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [inventory, setInventory] = useState<Record<BaitId, number>>({
    NONE: 0, BREAD: 0, STANDARD: 0, DELUXE: 0, GLOW: 0, ABYSSAL: 0, FERMENTED: 0, PHEROMONES: 0, TECH: 0,
    SIREN_NECTAR: 0, SINGULARITY: 0, FALLEN_STAR: 0, VOID_ESSENCE: 0
  });
  const [equippedBait, setEquippedBait] = useState<BaitId>('NONE');
  const [baitTimeLeft, setBaitTimeLeft] = useState<number>(0);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('capturedSpecies', JSON.stringify(capturedSpecies));
  }, [capturedSpecies]);

  const fetchNewWisdom = useCallback(async (customState?: OceanState) => {
    if (currentZone === 'ABYSSAL_VOID') return;
    setIsLoading(true);
    const newWisdom = await getSeaWisdom(customState || oceanState);
    setWisdom(newWisdom);
    setShowWisdom(true);
    setIsLoading(false);
    setTimeout(() => setShowWisdom(false), 8000);
  }, [oceanState, currentZone]);

  useEffect(() => {
    const timer = setInterval(() => {
        if (currentZone === 'ABYSSAL_VOID') return;
        const states: OceanState[] = ['CALM', 'STORMY', 'CLEAR'];
        const next = states[Math.floor(Math.random() * states.length)];
        setOceanState(next);
        if (currentZone === 'SURFACE') fetchNewWisdom(next);
    }, 60000);
    fetchNewWisdom();
    return () => clearInterval(timer);
  }, [fetchNewWisdom, currentZone]);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => { if (cursorRef.current) { cursorRef.current.style.left = `${e.clientX}px`; cursorRef.current.style.top = `${e.clientY}px`; } };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  useEffect(() => {
    let interval: number;
    if (equippedBait !== 'NONE' && baitTimeLeft > 0) {
      interval = window.setInterval(() => {
        setBaitTimeLeft(prev => {
          if (prev <= 100) { setEquippedBait('NONE'); return 0; }
          return prev - 100;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [equippedBait, baitTimeLeft]);

  const handleCapture = useCallback((name: string, value: number, chance: number) => {
    setGold(prev => prev + value);
    if (!capturedSpecies.includes(name)) setCapturedSpecies(prev => [...prev, name]);
    const newNotif = { name, value, chance, timestamp: Date.now() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.timestamp !== newNotif.timestamp)), 4000);
  }, [capturedSpecies]);

  const onBossHit = useCallback(() => {
    setBossHealth(prev => {
        if (prev <= 1) {
            setGold(g => g + 2000000);
            setIsGameOver(true);
            return 0;
        }
        return prev - 1;
    });
  }, []);

  const buyBait = (baitId: BaitId, price: number) => {
    if (gold >= price) { setGold(prev => prev - price); setInventory(prev => ({ ...prev, [baitId]: prev[baitId] + 1 })); }
  };

  const buyZone = (zoneId: ZoneId, price: number) => {
    if (gold >= price && !unlockedZones.includes(zoneId)) { setGold(prev => prev - price); setUnlockedZones(prev => [...prev, zoneId]); }
  };

  const startBossBattle = () => {
    if (gold >= BOSS_FEE) {
        setGold(prev => prev - BOSS_FEE);
        setCurrentZone('ABYSSAL_VOID');
        setBossHealth(3);
        setIsMapOpen(false);
    }
  };

  const equipBait = (baitId: BaitId) => {
    if (baitId === 'NONE') { setEquippedBait('NONE'); setBaitTimeLeft(0); setIsEquipmentOpen(false); return; }
    if (inventory[baitId] > 0) { setInventory(prev => ({ ...prev, [baitId]: prev[baitId] - 1 })); setEquippedBait(baitId); setBaitTimeLeft(BAIT_DURATION); setIsEquipmentOpen(false); }
  };

  const resetGame = () => {
    setGold(0);
    setCapturedSpecies([]);
    setIsGameOver(false);
    setCurrentZone('SURFACE');
    setUnlockedZones(['SURFACE']);
    localStorage.removeItem('capturedSpecies');
    window.location.reload();
  };

  const isDiamondPitUnlocked = unlockedZones.includes('DIAMOND_PIT');

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden select-none transition-all duration-[3000ms]`}>
      <WaterCanvas state={oceanState} currentZone={currentZone} equippedBait={equippedBait} bossHealth={bossHealth} onCapture={handleCapture} onBossHit={onBossHit} />

      {/* Custom Cursor - Hidden on mobile */}
      <div ref={cursorRef} className="custom-cursor fixed pointer-events-none z-[1000] -translate-x-1/2 -translate-y-1/2 hidden md:block">
        <div className={`relative w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${equippedBait !== 'NONE' ? 'scale-125' : 'scale-100'}`}>
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full blur-[1px]"></div>
          {equippedBait !== 'NONE' && <div className="absolute -bottom-6 text-[8px] font-mono text-white/50">{(baitTimeLeft / 1000).toFixed(1)}s</div>}
        </div>
      </div>

      {/* Header UI */}
      <header className="fixed top-0 left-0 w-full p-6 md:p-10 z-20 flex flex-col md:flex-row justify-between items-center md:items-start pointer-events-none gap-4">
        <div className="text-white/90 pointer-events-auto text-center md:text-left">
          <h1 className="text-2xl md:text-5xl font-light italic opacity-40 hover:opacity-100 transition-opacity">
            {currentZone === 'SURFACE' ? 'Surface' : currentZone === 'DIAMOND_PIT' ? 'Fosse Diamant' : 'LE NÉANT'}
          </h1>
          <p className="text-[7px] md:text-[9px] tracking-widest font-bold uppercase mt-1 opacity-30">Région Actuelle</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-3xl px-6 py-2 md:px-8 md:py-3 rounded-full border border-white/5 flex items-center gap-3">
             <i className="fa-solid fa-gem text-blue-500/70 text-sm md:text-base"></i>
             <span className="text-white font-mono text-lg md:text-2xl">{gold.toLocaleString()}</span>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button onClick={() => setIsMapOpen(true)} className="bg-white/5 border border-white/5 text-white/70 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:bg-white/10"><i className="fa-solid fa-map text-sm md:text-base"></i></button>
            <button onClick={() => setIsShopOpen(true)} className="bg-white/5 border border-white/5 text-white/70 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:bg-white/10"><i className="fa-solid fa-cart-shopping text-sm md:text-base"></i></button>
            <button onClick={() => setIsEquipmentOpen(true)} className="bg-white/5 border border-white/5 text-white/70 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:bg-white/10"><i className="fa-solid fa-suitcase text-sm md:text-base"></i></button>
            <button onClick={() => setIsAlbumOpen(true)} className="bg-white/5 border border-white/5 text-white/70 w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all hover:bg-white/10"><i className="fa-solid fa-book text-sm md:text-base"></i></button>
          </div>
        </div>
      </header>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in p-6 text-center">
            <div className="mb-6 w-20 h-20 md:w-32 md:h-32 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500 text-4xl md:text-6xl shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-pulse">
                <i className="fa-solid fa-crown"></i>
            </div>
            <h2 className="text-white text-4xl md:text-8xl font-serif italic mb-4">Légende des Abysses</h2>
            <p className="text-white/40 max-w-2xl text-sm md:text-lg mb-8 md:mb-12 leading-relaxed">
                Le Gardien du Néant a été terrassé. Vous avez dompté les profondeurs les plus obscures et récolté un trésor inestimable de <span className="text-yellow-500 font-mono">2,000,000</span> pièces.
            </p>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <button onClick={() => setIsGameOver(false)} className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Continuer</button>
                <button onClick={resetGame} className="px-8 py-4 rounded-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all">Nouvelle Aventure</button>
            </div>
        </div>
      )}

      {/* Modals */}
      {(isAlbumOpen || isShopOpen || isEquipmentOpen || isMapOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }}></div>
          <div className="relative w-full max-w-5xl h-[85vh] md:h-auto max-h-[90vh] bg-white/[0.02] border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden flex flex-col animate-scale-up shadow-2xl">
            
            <header className="p-6 md:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-3xl font-serif italic text-white/90">
                  {isAlbumOpen ? 'Album des Espèces' : isShopOpen ? 'Marchand Abyssal' : isEquipmentOpen ? 'Matériel' : 'Carte'}
                </h2>
              </div>
              
              <div className="flex items-center gap-3">
                  {isAlbumOpen && (
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                          <button onClick={() => setAlbumTab('SURFACE')} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${albumTab === 'SURFACE' ? 'bg-blue-600 text-white' : 'text-white/40'}`}>Surface</button>
                          <button onClick={() => setAlbumTab('DIAMOND_PIT')} className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${albumTab === 'DIAMOND_PIT' ? 'bg-purple-600 text-white' : 'text-white/40'}`}>Abysses</button>
                      </div>
                  )}
                  <button onClick={() => { setIsAlbumOpen(false); setIsShopOpen(false); setIsEquipmentOpen(false); setIsMapOpen(false); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all text-xl">×</button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              {isAlbumOpen && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                  {CREATURE_SPECS.filter(c => c.zone === albumTab).map(c => {
                    const caught = capturedSpecies.includes(c.name);
                    return (
                      <div key={c.name} className={`relative p-3 md:p-4 rounded-2xl border transition-all ${caught ? 'bg-white/[0.04] border-white/10' : 'bg-black/40 border-white/5 opacity-40'}`}>
                        <div className="aspect-square w-full rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: caught ? `rgba(${c.color.r}, ${c.color.g}, ${c.color.b}, 0.1)` : 'rgba(0,0,0,0.2)' }}>
                           {caught ? <div className="w-8 h-8 rounded-full blur-[8px] animate-pulse" style={{ backgroundColor: `rgb(${c.color.r}, ${c.color.g}, ${c.color.b})` }}></div> : <i className="fa-solid fa-ghost text-white/5 text-xl"></i>}
                        </div>
                        <h3 className={`text-center font-serif text-[10px] md:text-sm truncate ${caught ? 'text-white/90' : 'text-white/10'}`}>{caught ? c.name : '???'}</h3>
                      </div>
                    );
                  })}
                </div>
              )}

              {isShopOpen && (
                <div className="space-y-6 md:space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {BAITS.filter(b => b.zone === (currentZone === 'DIAMOND_PIT' ? 2 : 1)).map(b => (
                            <div key={b.id} className="p-6 md:p-8 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-between group">
                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-white/5 flex items-center justify-center text-white/40 text-lg md:text-2xl"><i className={`fa-solid ${b.icon}`}></i></div>
                                    <div className="text-right">
                                        <p className="text-lg md:text-2xl font-mono text-yellow-600 font-bold">{b.price.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white text-base md:text-xl font-serif italic mb-1 md:mb-2">{b.name}</h4>
                                    <p className="text-[10px] md:text-xs text-white/30 mb-6 md:mb-8">{b.description}</p>
                                </div>
                                <button onClick={() => buyBait(b.id, b.price)} disabled={gold < b.price} className={`w-full py-3 md:py-4 rounded-xl font-bold uppercase text-[9px] md:text-[10px] transition-all ${gold < b.price ? 'bg-red-900/10 text-red-500/40' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>Acheter</button>
                            </div>
                        ))}
                    </div>
                    
                    {!isDiamondPitUnlocked && (
                        <div className="p-6 md:p-10 bg-purple-900/5 border border-purple-500/20 rounded-2xl md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-white text-xl md:text-2xl font-serif italic mb-1">Les Abysses de Diamant</h4>
                                <p className="text-white/40 text-[10px] md:text-sm">Accédez à la zone 2 pour capturer des créatures mythiques.</p>
                            </div>
                            <button onClick={() => buyZone('DIAMOND_PIT', DIAMOND_PIT_PRICE)} disabled={gold < DIAMOND_PIT_PRICE} className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold uppercase text-[10px] transition-all ${gold < DIAMOND_PIT_PRICE ? 'bg-red-900/10 text-red-500/40' : 'bg-purple-700 hover:bg-purple-600 text-white shadow-xl'}`}>
                                {DIAMOND_PIT_PRICE.toLocaleString()} 💰 Débloquer
                            </button>
                        </div>
                    )}
                </div>
              )}

              {isEquipmentOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div onClick={() => equipBait('NONE')} className={`p-6 border rounded-2xl cursor-pointer flex items-center justify-between ${equippedBait === 'NONE' ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.01] text-white/40'}`}>
                          <span className="font-serif text-lg italic">Sans Appât</span>
                      </div>
                      {BAITS.map(b => inventory[b.id] > 0 && (
                          <div key={b.id} onClick={() => equipBait(b.id)} className={`p-6 border rounded-2xl cursor-pointer flex items-center justify-between ${equippedBait === b.id ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.01] text-white/40'}`}>
                              <div className="flex items-center gap-3">
                                  <i className={`fa-solid ${b.icon} ${equippedBait === b.id ? 'text-blue-400' : 'text-white/20'}`}></i>
                                  <div>
                                      <p className="font-serif text-lg italic">{b.name}</p>
                                      <p className="text-[8px] font-bold uppercase opacity-50">Stock: {inventory[b.id]}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {isMapOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div onClick={() => setCurrentZone('SURFACE')} className={`p-8 border rounded-2xl md:rounded-[3rem] cursor-pointer flex flex-col items-center gap-4 ${currentZone === 'SURFACE' ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/5 bg-white/[0.01]'}`}>
                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-2xl md:text-3xl"><i className="fa-solid fa-water"></i></div>
                        <h4 className="text-white text-lg md:text-2xl font-serif italic text-center">Eaux de Surface</h4>
                    </div>

                    <div onClick={() => isDiamondPitUnlocked && setCurrentZone('DIAMOND_PIT')} className={`p-8 border rounded-2xl md:rounded-[3rem] cursor-pointer flex flex-col items-center gap-4 ${currentZone === 'DIAMOND_PIT' ? 'border-purple-500/40 bg-purple-500/10' : isDiamondPitUnlocked ? 'border-white/5 bg-white/[0.01]' : 'opacity-20 cursor-not-allowed'}`}>
                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 text-2xl md:text-3xl"><i className="fa-solid fa-gem"></i></div>
                        <h4 className="text-white text-lg md:text-2xl font-serif italic text-center">Abysses</h4>
                    </div>

                    <div onClick={() => gold >= BOSS_FEE && startBossBattle()} className={`p-8 border rounded-2xl md:rounded-[3rem] cursor-pointer col-span-1 md:col-span-2 transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${gold < BOSS_FEE ? 'opacity-10 grayscale cursor-not-allowed' : 'border-red-500/30 bg-red-950/10'}`}>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl animate-pulse"><i className="fa-solid fa-skull-crossbones"></i></div>
                            <h4 className="text-red-500 text-xl md:text-3xl font-serif italic">PORTAIL DU NÉANT</h4>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 px-8 py-3 rounded-xl text-center">
                            <p className="text-red-500 font-mono text-xl font-bold">500,000 💰</p>
                        </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications - Better stacked on mobile */}
      <div className="fixed bottom-10 right-4 left-4 md:top-28 md:right-10 md:left-auto z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.timestamp} className="bg-black/60 backdrop-blur-3xl border border-white/10 text-white px-5 py-3 rounded-2xl animate-bounce-in shadow-2xl">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500"><i className="fa-solid fa-coins text-xs"></i></div>
                 <div>
                     <p className="text-sm font-serif italic text-white/90">{n.name} <span className="text-yellow-500/80 text-xs ml-2 font-mono">+{n.value}</span></p>
                 </div>
             </div>
          </div>
        ))}
      </div>

      {currentZone === 'ABYSSAL_VOID' && bossHealth > 0 && (
          <div className="fixed bottom-24 md:bottom-12 left-0 w-full flex flex-col items-center pointer-events-none z-50">
              <div className="w-64 md:w-80 h-1 md:h-1.5 bg-red-900/30 border border-red-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${(bossHealth/3)*100}%` }}></div>
              </div>
              <p className="text-red-500 font-serif mt-2 md:mt-4 animate-pulse tracking-[0.2em] text-[8px] md:text-[10px] font-bold uppercase">LE GARDIEN DU NÉANT</p>
          </div>
      )}

      <style>{`
        @keyframes bounce-in { 0% { transform: scale(0.8) translateY(20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes scale-up { 0% { transform: scale(0.96) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-up { animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        
        /* Disable custom cursor on touch devices */
        @media (hover: none) {
          .custom-cursor { display: none !important; }
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
    </div>
  );
};

export default App;
