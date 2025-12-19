
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { OceanState, ColorRGB, CreatureData, BaitId, ZoneId } from '../types';

interface WaterCanvasProps {
  state: OceanState;
  currentZone: ZoneId;
  equippedBait: BaitId;
  bossHealth: number;
  onCapture: (name: string, value: number, chance: number) => void;
  onBossHit: () => void;
}

export const CREATURE_SPECS: CreatureData[] = [
  // ZONE: SURFACE
  { name: "Anémone de mer", chance: 0.20, value: 100, color: { r: 255, g: 120, b: 180 }, baseSize: 4, widthRatio: 1, speed: 0.15, zone: 'SURFACE' },
  { name: "Étoile de mer", chance: 0.18, value: 150, color: { r: 255, g: 200, b: 80 }, baseSize: 3, widthRatio: 1, speed: 0.2, zone: 'SURFACE' },
  { name: "Méduse lune", chance: 0.12, value: 250, color: { r: 200, g: 230, b: 255 }, baseSize: 6, widthRatio: 1.1, speed: 0.25, zone: 'SURFACE' },
  { name: "Limace de mer", chance: 0.10, value: 300, color: { r: 100, g: 150, b: 255 }, baseSize: 3, widthRatio: 1.5, speed: 0.3, zone: 'SURFACE' },
  { name: "Poulpe", chance: 0.05, value: 1200, color: { r: 180, g: 130, b: 220 }, baseSize: 5, widthRatio: 1.5, speed: 0.6, zone: 'SURFACE' },
  { name: "Homard", chance: 0.01, value: 4500, color: { r: 220, g: 70, b: 70 }, baseSize: 6, widthRatio: 2, speed: 0.7, zone: 'SURFACE' },
  
  // ZONE: FOSSE DE DIAMANT (DIAMOND_PIT)
  { name: "Kraken Spectral", chance: 0.005, value: 25000, color: { r: 130, g: 255, b: 255 }, baseSize: 15, widthRatio: 1.5, speed: 0.2, zone: 'DIAMOND_PIT' },
  { name: "Léviathan Juvénile", chance: 0.01, value: 15000, color: { r: 50, g: 100, b: 255 }, baseSize: 20, widthRatio: 3.5, speed: 0.8, zone: 'DIAMOND_PIT' },
  { name: "Hippocampe Cristal", chance: 0.05, value: 5000, color: { r: 200, g: 240, b: 255 }, baseSize: 6, widthRatio: 0.8, speed: 0.6, zone: 'DIAMOND_PIT' },
  { name: "Raie Manta Stellaire", chance: 0.04, value: 8000, color: { r: 80, g: 80, b: 255 }, baseSize: 12, widthRatio: 2.0, speed: 1.2, zone: 'DIAMOND_PIT' },
];

const BOSS_SPEC: CreatureData = {
    name: "LE GARDIEN DU NÉANT",
    chance: 0,
    value: 100000,
    color: { r: 255, g: 255, b: 255 },
    baseSize: 40,
    widthRatio: 1.2,
    speed: 0.02,
    zone: 'ABYSSAL_VOID'
};

interface MarineCreatureInstance {
  id: number;
  spec: CreatureData;
  x: number;
  y: number;
  angle: number;
  phase: number;
}

const WaterCanvas: React.FC<WaterCanvasProps> = ({ state, currentZone, equippedBait, bossHealth, onCapture, onBossHit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef<{ width: number; height: number; size: number; buffer1: Int16Array; buffer2: Int16Array; } | null>(null);
  const creaturesRef = useRef<MarineCreatureInstance[]>([]);
  const frameRef = useRef<number>(0);
  const spawnCooldownRef = useRef<number>(0);
  const currentColorRef = useRef<ColorRGB>({ r: 5, g: 25, b: 60 });

  const config = useMemo(() => {
    if (currentZone === 'ABYSSAL_VOID') return { baseColor: { r: 0, g: 0, b: 0 }, strength: 800, decay: 7, ambient: 0.1, speedMult: 0.5 };
    if (currentZone === 'DIAMOND_PIT') return { baseColor: { r: 5, g: 5, b: 15 }, strength: 500, decay: 6, ambient: 0.05, speedMult: 1.4 };
    switch (state) {
      case 'STORMY': return { baseColor: { r: 8, g: 15, b: 35 }, strength: 400, decay: 6, ambient: 0.08, speedMult: 1.6 };
      case 'CLEAR': return { baseColor: { r: 5, g: 70, b: 100 }, strength: 300, decay: 5, ambient: 0.003, speedMult: 1.0 };
      default: return { baseColor: { r: 5, g: 25, b: 60 }, strength: 350, decay: 5, ambient: 0.002, speedMult: 0.8 };
    }
  }, [state, currentZone]);

  const spawnCreature = useCallback((w: number, h: number): MarineCreatureInstance => {
    if (currentZone === 'ABYSSAL_VOID') return { id: 777, spec: BOSS_SPEC, x: w / 2, y: h / 2, angle: 0, phase: 0 };
    const zoneCreatures = CREATURE_SPECS.filter(s => s.zone === currentZone);
    const weights = zoneCreatures.map(spec => {
      let w = spec.chance;
      if (equippedBait === 'DELUXE') w *= 1.5;
      if (equippedBait === 'VOID_ESSENCE' && spec.chance < 0.01) w *= 5;
      return w;
    });
    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
    let random = Math.random() * totalWeight;
    let selectedSpec = zoneCreatures[0];
    for (let i = 0; i < zoneCreatures.length; i++) {
      if (random < weights[i]) { selectedSpec = zoneCreatures[i]; break; }
      random -= weights[i];
    }
    return { id: Math.random(), spec: selectedSpec, x: Math.random() * w, y: Math.random() * h, angle: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2 };
  }, [equippedBait, currentZone]);

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = Math.floor(window.innerWidth / 2);
    const height = Math.floor(window.innerHeight / 2);
    canvas.width = width;
    canvas.height = height;
    rippleRef.current = { width, height, size: width * height, buffer1: new Int16Array(width * height), buffer2: new Int16Array(width * height) };
  }, []);

  const createRipple = useCallback((x: number, y: number, str: number) => {
    if (!rippleRef.current) return;
    const { width, height, buffer1 } = rippleRef.current;
    const ix = Math.floor((x / window.innerWidth) * width);
    const iy = Math.floor((y / window.innerHeight) * height);
    const r = 2;
    for (let j = iy - r; j < iy + r; j++) {
      for (let i = ix - r; i < ix + r; i++) {
        if (i > 0 && i < width && j > 0 && j < height) buffer1[j * width + i] += str;
      }
    }
  }, []);

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

      if (Math.random() < config.ambient) createRipple(Math.random() * window.innerWidth, Math.random() * window.innerHeight, config.strength / 2);
      
      if (currentZone === 'ABYSSAL_VOID') {
        if (creaturesRef.current.length === 0) creaturesRef.current = [spawnCreature(width, height)];
      } else if (creaturesRef.current.length < 10 && spawnCooldownRef.current <= 0) {
        creaturesRef.current.push(spawnCreature(width, height));
        spawnCooldownRef.current = 30;
      }
      if (spawnCooldownRef.current > 0) spawnCooldownRef.current--;

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
        const dx = buffer1[i - 1] - buffer1[i + 1];
        const dy = buffer1[i - width] - buffer1[i + width];
        const shade = dx + dy;
        const pIdx = i * 4;
        data[pIdx] = Math.min(255, Math.max(0, curR + shade));
        data[pIdx + 1] = Math.min(255, Math.max(0, curG + shade + 5));
        data[pIdx + 2] = Math.min(255, Math.max(0, curB + shade + 20));
        data[pIdx + 3] = 255;
      }

      creaturesRef.current.forEach(c => {
        if (currentZone !== 'ABYSSAL_VOID') {
          c.x += Math.cos(c.angle) * c.spec.speed * config.speedMult;
          c.y += Math.sin(c.angle) * c.spec.speed * config.speedMult;
          if (c.x < -20 || c.x > width + 20 || c.y < -20 || c.y > height + 20) {
            c.angle += Math.PI;
          }
        } else {
            c.x = width/2 + Math.cos(frameRef.current * 0.01) * 10;
            c.y = height/2 + Math.sin(frameRef.current * 0.01) * 10;
        }

        const cx = Math.floor(c.x), cy = Math.floor(c.y);
        const s = c.spec.baseSize, wr = c.spec.widthRatio;
        for (let dy = -s; dy <= s; dy++) {
          for (let dx = -Math.floor(s*wr); dx <= Math.floor(s*wr); dx++) {
            const tx = cx + dx, ty = cy + dy;
            if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
              const distSq = (dx * dx) / (s * wr * s * wr) + (dy * dy) / (s * s);
              if (distSq <= 1) {
                const pIdx = (ty * width + tx) * 4;
                let alpha = (1 - distSq) * 0.8;
                if (currentZone === 'ABYSSAL_VOID') alpha *= (bossHealth / 3);
                data[pIdx] = data[pIdx] * (1 - alpha) + c.spec.color.r * alpha;
                data[pIdx + 1] = data[pIdx + 1] * (1 - alpha) + c.spec.color.g * alpha;
                data[pIdx + 2] = data[pIdx + 2] * (1 - alpha) + c.spec.color.b * alpha;
              }
            }
          }
        }
      });
      ctx.putImageData(imgData, 0, 0);
    };

    const loop = () => {
      frameRef.current++;
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      update();
      draw(imgData);
      animId = requestAnimationFrame(loop);
    };
    loop();

    const handleInput = (x: number, y: number, isAction: boolean) => {
      createRipple(x, y, isAction ? config.strength * 2 : config.strength / 2);
      if (isAction) {
        const cx = (x / window.innerWidth) * canvas.width;
        const cy = (y / window.innerHeight) * canvas.height;
        const hitIdx = creaturesRef.current.findIndex(c => Math.sqrt((c.x - cx)**2 + (c.y - cy)**2) < c.spec.baseSize * 2.5);
        if (hitIdx !== -1) {
          if (currentZone === 'ABYSSAL_VOID') onBossHit();
          else {
            const c = creaturesRef.current[hitIdx];
            onCapture(c.spec.name, c.spec.value, c.spec.chance);
            creaturesRef.current.splice(hitIdx, 1);
          }
        }
      }
    };

    const mm = (e: MouseEvent) => handleInput(e.clientX, e.clientY, false);
    const md = (e: MouseEvent) => handleInput(e.clientX, e.clientY, true);
    const tm = (e: TouchEvent) => { if (e.touches[0]) handleInput(e.touches[0].clientX, e.touches[0].clientY, false); };
    const ts = (e: TouchEvent) => { if (e.touches[0]) handleInput(e.touches[0].clientX, e.touches[0].clientY, true); };

    window.addEventListener('mousemove', mm);
    window.addEventListener('mousedown', md);
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('touchstart', ts, { passive: true });
    window.addEventListener('resize', initSimulation);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchstart', ts);
      window.removeEventListener('resize', initSimulation);
    };
  }, [config, spawnCreature, onCapture, onBossHit, currentZone, createRipple, initSimulation, bossHealth]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ imageRendering: 'pixelated', background: '#05193c', touchAction: 'none' }} />;
};

export default WaterCanvas;
