
import React, { useState, useEffect, useCallback } from 'react';
import WaterCanvas from './components/WaterCanvas';
import { getSeaWisdom } from './services/geminiService';
import { SeaMessage } from './types';

const App: React.FC = () => {
  const [wisdom, setWisdom] = useState<SeaMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const fetchWisdom = useCallback(async () => {
    try {
      setIsVisible(false);
      const data = await getSeaWisdom('CALM');
      setWisdom(data);
      setTimeout(() => setIsVisible(true), 500);
    } catch (error) {
      console.error("Erreur sagesse marine:", error);
    }
  }, []);

  useEffect(() => {
    fetchWisdom();
    const interval = setInterval(fetchWisdom, 30000);
    return () => clearInterval(interval);
  }, [fetchWisdom]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif">
      {/* Simulation de l'eau en plein écran */}
      <WaterCanvas />

      {/* Overlay poétique minimaliste */}
      <div className="absolute inset-x-0 bottom-20 flex justify-center pointer-events-none px-10">
        <div className={`transition-all duration-[2000ms] text-center max-w-2xl ${isVisible ? 'opacity-40' : 'opacity-0 translate-y-4'}`}>
          {wisdom && (
            <>
              <p className="text-white text-xl md:text-3xl italic font-light tracking-wide leading-relaxed mb-4 drop-shadow-lg">
                "{wisdom.text}"
              </p>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] font-bold">
                — {wisdom.author}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Effets de bordure et profondeur */}
      <div className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>
      
      {/* Texture de grain subtile */}
      <div className="fixed inset-0 pointer-events-none z-20 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      <style>{`
        body {
          cursor: crosshair;
        }
      `}</style>
    </div>
  );
};

export default App;
