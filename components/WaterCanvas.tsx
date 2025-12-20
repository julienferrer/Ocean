
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { OceanState, ColorRGB, CreatureData, BaitId, ZoneId } from '../types.ts';

interface WaterCanvasProps {
  state: OceanState;
  currentZone: ZoneId;
  equippedBait: BaitId;
  bossHealth: number;
  onCapture: (name: string, value: number, chance: number) => void;
  onBossHit: () => void;
}

export const CREATURE_SPECS: CreatureData[] = [
  { name: "Anémone de mer", chance: 0.20, value: 100, color: { r: 255, g: 120, b: 180 }, baseSize: 4, widthRatio: 1, speed: 0.15, zone: 'SURFACE' },
  { name: "Étoile de mer", chance: 0.18, value: 150, color: { r: 255, g: 200, b: 80 }, baseSize: 3, widthRatio: 1, speed: 0.2, zone: 'SURFACE' },
  { name: "Méduse lune", chance: 0.12, value: 250, color: { r: 200, g: 230, b: 255 }, baseSize: 6, widthRatio: 1.1, speed: 0.25, zone: 'SURFACE' },
  { name: "Limace de mer", chance: 0.10, value: 300, color: { r: 100, g: 150, b: 255 }, baseSize: 3, widthRatio: 1.5, speed: 0.3, zone: 'SURFACE' },
  { name: "Poulpe", chance: 0.05, value: 1200, color: { r: 180, g: 130, b: 220 }, baseSize: 5, widthRatio: 1.5, speed: 0.6, zone: 'SURFACE' },
  { name: "Kraken Spectral", chance: 0.005, value: 25000, color: { r: 130, g: 255, b: 255 }, baseSize: 15, widthRatio: 1.5, speed: 0.2, zone: 'DIAMOND_PIT' },
  { name: "Léviathan Juvénile", chance: 0.01, value: 15000, color: { r: 50, g: 100, b: 255 }, baseSize: 20, widthRatio: 3.5, speed: 0.8, zone: 'DIAMOND_PIT' },
];

const WaterCanvas: React.FC<WaterCanvasProps> = ({ state, currentZone, equippedBait, bossHealth, onCapture, onBossHit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef<{ width: number; height: number; size: number; buffer1: Int16Array; buffer2: Int16Array; } | null>(null);
  const creaturesRef = useRef<any[]>([]);
  const frameRef = useRef<number>(0);
  const currentColorRef = useRef<ColorRGB>({ r: 5, g: 25, b: 60 });

  const config = useMemo(() => {
    if (currentZone === 'ABYSSAL_VOID') return { baseColor: { r: 0, g: 0, b: 0 }, strength: 800, decay: 7, ambient: 0.1, speedMult: 0.5 };
    if (currentZone === 'DIAMOND_PIT') return { baseColor: { r: 5, g: 5, b: 15 }, strength: 500, decay: 6, ambient: 0.05, speedMult: 1.4 };
    return { baseColor: { r: 5, g: 25, b: 60 }, strength: 350, decay: 5, ambient: 0.005, speedMult: 0.8 };
  }, [state, currentZone]);

  const createRipple = useCallback((x: number, y: number, str: number) => {
    if (!rippleRef.current) return;
    const { width, height, buffer1 } = rippleRef.current;
    const ix = Math.floor((x / window.innerWidth) * width);
    const iy = Math.floor((y / window.innerHeight) * height);
    if (ix > 0 && ix < width && iy > 0 && iy < height) {
      buffer1[iy * width + ix] += str;
    }
  }, []);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.floor(window.innerWidth / 2);
    const height = Math.floor(window.innerHeight / 2);
    
    if (width <= 0 || height <= 0) return;

    canvas.width = width;
    canvas.height = height;
    rippleRef.current = { 
      width, 
      height, 
      size: width * height, 
      buffer1: new Int16Array(width * height), 
      buffer2: new Int16Array(width * height) 
    };
    
    // Ripple initiale pour "allumer" l'écran
    createRipple(window.innerWidth / 2, window.innerHeight / 2, config.strength);
  }, [config.strength, createRipple]);

  useEffect(() => {
    initSimulation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let animId: number;

    const update = () => {
      if (!rippleRef.current) return;
      const { width, height, size, buffer1, buffer2 } = rippleRef.current;
      for (let i = width; i < size - width; i++) {
        buffer2[i] = ((buffer1[i - 1] + buffer1[i + 1] + buffer1[i - width] + buffer1[i + width]) >> 1) - buffer2[i];
        buffer2[i] -= buffer2[i] >> config.decay;
      }
      rippleRef.current.buffer1 = buffer2;
      rippleRef.current.buffer2 = buffer1;

      if (Math.random() < config.ambient) {
        createRipple(Math.random() * window.innerWidth, Math.random() * window.innerHeight, config.strength / 4);
      }

      currentColorRef.current.r += (config.baseColor.r - currentColorRef.current.r) * 0.05;
      currentColorRef.current.g += (config.baseColor.g - currentColorRef.current.g) * 0.05;
      currentColorRef.current.b += (config.baseColor.b - currentColorRef.current.b) * 0.05;
    };

    const draw = (imgData: ImageData) => {
      if (!rippleRef.current) return;
      const { width, height, buffer1 } = rippleRef.current;
      const data = imgData.data;
      const { r: curR, g: curG, b: curB } = currentColorRef.current;

      for (let i = 0; i < height * width; i++) {
        const shade = (buffer1[i - 1] || 0) - (buffer1[i + 1] || 0);
        const pIdx = i * 4;
        data[pIdx] = Math.min(255, Math.max(0, curR + shade));
        data[pIdx + 1] = Math.min(255, Math.max(0, curG + shade + 5));
        data[pIdx + 2] = Math.min(255, Math.max(0, curB + shade + 20));
        data[pIdx + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    };

    const loop = () => {
      if (canvas.width > 0 && canvas.height > 0) {
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        update();
        draw(imgData);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const handleMM = (e: MouseEvent) => createRipple(e.clientX, e.clientY, config.strength / 2);
    window.addEventListener('mousemove', handleMM);
    window.addEventListener('resize', initSimulation);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMM);
      window.removeEventListener('resize', initSimulation);
    };
  }, [config, createRipple, initSimulation]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full" 
      style={{ imageRendering: 'pixelated', background: '#05193c', touchAction: 'none', zIndex: 0 }} 
    />
  );
};

export default WaterCanvas;
