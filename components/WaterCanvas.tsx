
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
  // --- ZONE 1: SURFACE (40 créatures) ---
  { name: "Anémone de mer", chance: 0.20, value: 500, color: { r: 255, g: 120, b: 180 }, baseSize: 4, widthRatio: 1, speed: 0.15, zone: 'SURFACE' },
  { name: "Étoile de mer", chance: 0.18, value: 500, color: { r: 255, g: 200, b: 80 }, baseSize: 3, widthRatio: 1, speed: 0.2, zone: 'SURFACE' },
  { name: "Concombre de mer", chance: 0.15, value: 500, color: { r: 100, g: 100, b: 100 }, baseSize: 3, widthRatio: 2.5, speed: 0.1, zone: 'SURFACE' },
  { name: "Balane", chance: 0.12, value: 600, color: { r: 200, g: 200, b: 220 }, baseSize: 2, widthRatio: 1.2, speed: 0.05, zone: 'SURFACE' },
  { name: "Méduse lune", chance: 0.12, value: 600, color: { r: 200, g: 230, b: 255 }, baseSize: 6, widthRatio: 1.1, speed: 0.25, zone: 'SURFACE' },
  { name: "Wakamé", chance: 0.10, value: 600, color: { r: 80, g: 180, b: 80 }, baseSize: 8, widthRatio: 0.3, speed: 0.12, zone: 'SURFACE' },
  { name: "Limace de mer", chance: 0.10, value: 600, color: { r: 100, g: 150, b: 255 }, baseSize: 3, widthRatio: 1.5, speed: 0.3, zone: 'SURFACE' },
  { name: "Ver plat", chance: 0.08, value: 700, color: { r: 230, g: 100, b: 255 }, baseSize: 2, widthRatio: 3, speed: 0.4, zone: 'SURFACE' },
  { name: "Raisin de mer", chance: 0.08, value: 900, color: { r: 120, g: 255, b: 120 }, baseSize: 4, widthRatio: 1.2, speed: 0.1, zone: 'SURFACE' },
  { name: "Bulot", chance: 0.07, value: 1000, color: { r: 220, g: 190, b: 150 }, baseSize: 3, widthRatio: 1.3, speed: 0.2, zone: 'SURFACE' },
  { name: "Turbo", chance: 0.06, value: 1000, color: { r: 150, g: 120, b: 90 }, baseSize: 4, widthRatio: 1.1, speed: 0.4, zone: 'SURFACE' },
  { name: "Anguille de jardin", chance: 0.06, value: 1100, color: { r: 240, g: 240, b: 200 }, baseSize: 1, widthRatio: 8, speed: 0.1, zone: 'SURFACE' },
  { name: "Huître", chance: 0.05, value: 1100, color: { r: 180, g: 180, b: 180 }, baseSize: 4, widthRatio: 1.4, speed: 0.02, zone: 'SURFACE' },
  { name: "Pétoncle", chance: 0.05, value: 1200, color: { r: 255, g: 180, b: 150 }, baseSize: 3, widthRatio: 1.1, speed: 0.5, zone: 'SURFACE' },
  { name: "Poulpe", chance: 0.05, value: 1200, color: { r: 180, g: 130, b: 220 }, baseSize: 5, widthRatio: 1.5, speed: 0.6, zone: 'SURFACE' },
  { name: "Crevette nordique", chance: 0.04, value: 1400, color: { r: 255, g: 150, b: 150 }, baseSize: 2, widthRatio: 2.5, speed: 0.8, zone: 'SURFACE' },
  { name: "Halocynthia roretzi", chance: 0.04, value: 1500, color: { r: 255, g: 80, b: 50 }, baseSize: 5, widthRatio: 0.8, speed: 0.1, zone: 'SURFACE' },
  { name: "Moule", chance: 0.04, value: 1500, color: { r: 50, g: 50, b: 80 }, baseSize: 3, widthRatio: 1.8, speed: 0.02, zone: 'SURFACE' },
  { name: "Oursin", chance: 0.04, value: 1700, color: { r: 60, g: 20, b: 80 }, baseSize: 4, widthRatio: 1, speed: 0.2, zone: 'SURFACE' },
  { name: "Nautile", chance: 0.035, value: 1800, color: { r: 255, g: 230, b: 200 }, baseSize: 5, widthRatio: 1.2, speed: 0.35, zone: 'SURFACE' },
  { name: "Crabe de Dungeness", chance: 0.03, value: 1900, color: { r: 180, g: 80, b: 50 }, baseSize: 6, widthRatio: 1.4, speed: 0.5, zone: 'SURFACE' },
  { name: "Ormeau", chance: 0.03, value: 2000, color: { r: 200, g: 255, b: 230 }, baseSize: 4, widthRatio: 1.5, speed: 0.1, zone: 'SURFACE' },
  { name: "Oursin crayon", chance: 0.03, value: 2000, color: { r: 150, g: 50, b: 50 }, baseSize: 5, widthRatio: 1, speed: 0.25, zone: 'SURFACE' },
  { name: "Crabe gazami", chance: 0.025, value: 2200, color: { r: 100, g: 120, b: 180 }, baseSize: 5, widthRatio: 1.6, speed: 0.6, zone: 'SURFACE' },
  { name: "Crevette-mante", chance: 0.02, value: 2500, color: { r: 100, g: 255, b: 150 }, baseSize: 3, widthRatio: 3, speed: 1.2, zone: 'SURFACE' },
  { name: "Limule", chance: 0.02, value: 2500, color: { r: 120, g: 110, b: 80 }, baseSize: 7, widthRatio: 1.3, speed: 0.3, zone: 'SURFACE' },
  { name: "Huître perlière", chance: 0.015, value: 2800, color: { r: 255, g: 255, b: 255 }, baseSize: 4, widthRatio: 1.2, speed: 0.02, zone: 'SURFACE' },
  { name: "Crevette tigrée", chance: 0.015, value: 3000, color: { r: 255, g: 180, b: 50 }, baseSize: 3, widthRatio: 3.5, speed: 0.9, zone: 'SURFACE' },
  { name: "Homard", chance: 0.01, value: 4500, color: { r: 180, g: 40, b: 40 }, baseSize: 8, widthRatio: 2.2, speed: 0.7, zone: 'SURFACE' },
  { name: "Corbeille de Vénus", chance: 0.01, value: 5000, color: { r: 230, g: 240, b: 255 }, baseSize: 12, widthRatio: 0.6, speed: 0.05, zone: 'SURFACE' },
  { name: "Pieuvre parapluie", chance: 0.008, value: 6000, color: { r: 255, g: 100, b: 100 }, baseSize: 8, widthRatio: 1.1, speed: 0.4, zone: 'SURFACE' },
  { name: "Crabe des neiges", chance: 0.007, value: 6000, color: { r: 255, g: 200, b: 180 }, baseSize: 7, widthRatio: 1.8, speed: 0.45, zone: 'SURFACE' },
  { name: "Crabe royal", chance: 0.005, value: 8000, color: { r: 200, g: 50, b: 50 }, baseSize: 10, widthRatio: 1.5, speed: 0.5, zone: 'SURFACE' },
  { name: "Langouste", chance: 0.005, value: 9000, color: { r: 255, g: 120, b: 50 }, baseSize: 9, widthRatio: 2.5, speed: 0.8, zone: 'SURFACE' },
  { name: "Cochon de mer", chance: 0.003, value: 10000, color: { r: 255, g: 180, b: 200 }, baseSize: 6, widthRatio: 1.8, speed: 0.2, zone: 'SURFACE' },
  { name: "Vampire des abysses", chance: 0.003, value: 10000, color: { r: 100, g: 0, b: 20 }, baseSize: 10, widthRatio: 1.2, speed: 0.3, zone: 'SURFACE' },
  { name: "Bathynome géant", chance: 0.002, value: 12000, color: { r: 180, g: 180, b: 220 }, baseSize: 12, widthRatio: 2, speed: 0.4, zone: 'SURFACE' },
  { name: "Crabe-araignée géant", chance: 0.002, value: 12000, color: { r: 230, g: 100, b: 80 }, baseSize: 25, widthRatio: 1.1, speed: 0.2, zone: 'SURFACE' },
  { name: "Calmar luciole", chance: 0.001, value: 14000, color: { r: 50, g: 150, b: 255 }, baseSize: 5, widthRatio: 3, speed: 1.5, zone: 'SURFACE' },
  { name: "Bénitier colossal", chance: 0.001, value: 15000, color: { r: 100, g: 80, b: 150 }, baseSize: 20, widthRatio: 1.4, speed: 0.01, zone: 'SURFACE' },

  // --- ZONE 2: DIAMOND PIT (15 créatures) ---
  { name: "Anémone de Néon", chance: 0.10, value: 5000, color: { r: 0, g: 255, b: 255 }, baseSize: 6, widthRatio: 1.2, speed: 0.3, zone: 'DIAMOND_PIT' },
  { name: "Barracuda de Mercure", chance: 0.07, value: 7000, color: { r: 200, g: 200, b: 200 }, baseSize: 3, widthRatio: 4, speed: 1.4, zone: 'DIAMOND_PIT' },
  { name: "Nautile Doré", chance: 0.05, value: 8500, color: { r: 255, g: 215, b: 0 }, baseSize: 6, widthRatio: 1.3, speed: 0.5, zone: 'DIAMOND_PIT' },
  { name: "Murène de Plasma", chance: 0.04, value: 10000, color: { r: 200, g: 0, b: 255 }, baseSize: 2, widthRatio: 6, speed: 0.9, zone: 'DIAMOND_PIT' },
  { name: "Espadon d'Argent", chance: 0.03, value: 12000, color: { r: 192, g: 192, b: 192 }, baseSize: 4, widthRatio: 4.5, speed: 1.8, zone: 'DIAMOND_PIT' },
  { name: "Crabe de Tungstène", chance: 0.02, value: 15000, color: { r: 100, g: 100, b: 110 }, baseSize: 8, widthRatio: 1.6, speed: 0.4, zone: 'DIAMOND_PIT' },
  { name: "Raie Manta Stellaire", chance: 0.015, value: 20000, color: { r: 50, g: 50, b: 150 }, baseSize: 15, widthRatio: 1.8, speed: 0.6, zone: 'DIAMOND_PIT' },
  { name: "Méduse Radioactive", chance: 0.01, value: 25000, color: { r: 50, g: 255, b: 50 }, baseSize: 9, widthRatio: 1.1, speed: 0.4, zone: 'DIAMOND_PIT' },
  { name: "Anguille Électrique Primordiale", chance: 0.008, value: 30000, color: { r: 255, g: 255, b: 100 }, baseSize: 3, widthRatio: 7, speed: 1.2, zone: 'DIAMOND_PIT' },
  { name: "Hippocampe de Cristal", chance: 0.005, value: 40000, color: { r: 200, g: 230, b: 255 }, baseSize: 4, widthRatio: 0.8, speed: 0.8, zone: 'DIAMOND_PIT' },
  { name: "Requin de Pure Obsidienne", chance: 0.003, value: 45000, color: { r: 20, g: 20, b: 25 }, baseSize: 12, widthRatio: 3, speed: 1.6, zone: 'DIAMOND_PIT' },
  { name: "Tortue Millénaire de Corail", chance: 0.002, value: 55000, color: { r: 255, g: 100, b: 150 }, baseSize: 15, widthRatio: 1.3, speed: 0.2, zone: 'DIAMOND_PIT' },
  { name: "Sirène des Profondeurs", chance: 0.001, value: 70000, color: { r: 255, g: 200, b: 255 }, baseSize: 10, widthRatio: 1.5, speed: 0.5, zone: 'DIAMOND_PIT' },
  { name: "Léviathan Juvénile", chance: 0.0005, value: 85000, color: { r: 50, g: 80, b: 255 }, baseSize: 25, widthRatio: 4, speed: 1.1, zone: 'DIAMOND_PIT' },
  { name: "Kraken Spectral", chance: 0.0001, value: 100000, color: { r: 255, g: 255, b: 255 }, baseSize: 30, widthRatio: 1.2, speed: 0.3, zone: 'DIAMOND_PIT' },
];

const BOSS_SPEC: CreatureData = {
    name: "LE GARDIEN DU NÉANT",
    chance: 0,
    value: 1000000,
    color: { r: 255, g: 255, b: 255 },
    baseSize: 60, // Encore plus gros
    widthRatio: 1.1,
    speed: 0.01,
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
    return { baseColor: { r: 5, g: 25, b: 60 }, strength: 350, decay: 5, ambient: 0.005, speedMult: 0.8 };
  }, [state, currentZone]);

  const spawnCreature = useCallback((w: number, h: number): MarineCreatureInstance => {
    const zoneCreatures = CREATURE_SPECS.filter(s => s.zone === currentZone);
    
    // Boss condition: In Abyssal Void, if Boss not present, spawn it immediately
    if (currentZone === 'ABYSSAL_VOID' && creaturesRef.current.every(c => c.spec.name !== BOSS_SPEC.name)) {
        return { id: 777, spec: BOSS_SPEC, x: w / 2, y: h / 2, angle: 0, phase: 0 };
    }

    if (zoneCreatures.length === 0) return { id: Math.random(), spec: CREATURE_SPECS[0], x: Math.random() * w, y: Math.random() * h, angle: Math.random() * Math.PI * 2, phase: 0 };

    const weights = zoneCreatures.map(spec => {
      let weight = spec.chance;
      if (equippedBait === 'DELUXE') weight *= 2;
      if (equippedBait === 'VOID_ESSENCE' && spec.chance < 0.01) weight *= 10;
      if (equippedBait === 'SINGULARITY' && spec.chance < 0.001) weight *= 50;
      return weight;
    });
    
    const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
    let random = Math.random() * totalWeight;
    let selectedSpec = zoneCreatures[0];
    for (let i = 0; i < zoneCreatures.length; i++) {
      if (random < weights[i]) { selectedSpec = zoneCreatures[i]; break; }
      random -= weights[i];
    }
    
    return { 
      id: Math.random(), 
      spec: selectedSpec, 
      x: Math.random() * w, 
      y: Math.random() * h, 
      angle: Math.random() * Math.PI * 2, 
      phase: Math.random() * Math.PI * 2 
    };
  }, [equippedBait, currentZone]);

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

      // Spawning logic (Up to 20 creatures now)
      if (creaturesRef.current.length < 20 && spawnCooldownRef.current <= 0) {
        creaturesRef.current.push(spawnCreature(width, height));
        spawnCooldownRef.current = 20; // Encore plus rapide
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
        const shade = (buffer1[i - 1] || 0) - (buffer1[i + 1] || 0);
        const pIdx = i * 4;
        data[pIdx] = Math.min(255, Math.max(0, curR + shade));
        data[pIdx + 1] = Math.min(255, Math.max(0, curG + shade + 5));
        data[pIdx + 2] = Math.min(255, Math.max(0, curB + shade + 20));
        data[pIdx + 3] = 255;
      }

      creaturesRef.current.forEach(c => {
        if (c.spec.name !== BOSS_SPEC.name) {
          c.x += Math.cos(c.angle) * c.spec.speed * config.speedMult;
          c.y += Math.sin(c.angle) * c.spec.speed * config.speedMult;
          if (c.x < -20 || c.x > width + 20 || c.y < -20 || c.y > height + 20) {
             c.angle += Math.PI + (Math.random() - 0.5);
          }
        } else {
            // Le Boss plane majestueusement au centre
            c.x = width/2 + Math.cos(frameRef.current * 0.005) * 40;
            c.y = height/2 + Math.sin(frameRef.current * 0.005) * 40;
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
                if (c.spec.name === BOSS_SPEC.name) alpha *= 0.9;
                data[pIdx] = Math.floor(data[pIdx] * (1 - alpha) + c.spec.color.r * alpha);
                data[pIdx + 1] = Math.floor(data[pIdx + 1] * (1 - alpha) + c.spec.color.g * alpha);
                data[pIdx + 2] = Math.floor(data[pIdx + 2] * (1 - alpha) + c.spec.color.b * alpha);
              }
            }
          }
        }
      });

      ctx.putImageData(imgData, 0, 0);
    };

    const loop = () => {
      frameRef.current++;
      if (canvas.width > 0 && canvas.height > 0) {
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        update();
        draw(imgData);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const handleInput = (x: number, y: number, isClick: boolean) => {
      createRipple(x, y, isClick ? config.strength * 2.5 : config.strength / 2);
      if (isClick && rippleRef.current) {
        const { width } = rippleRef.current;
        const cx = (x / window.innerWidth) * width;
        const cy = (y / window.innerHeight) * canvas.height;
        const hitIdx = creaturesRef.current.findIndex(c => Math.sqrt((c.x - cx)**2 + (c.y - cy)**2) < Math.max(c.spec.baseSize * 4, 35));
        if (hitIdx !== -1) {
          const c = creaturesRef.current[hitIdx];
          if (c.spec.name === BOSS_SPEC.name) onBossHit();
          else {
            onCapture(c.spec.name, c.spec.value, c.spec.chance);
            creaturesRef.current.splice(hitIdx, 1);
          }
        }
      }
    };

    const mm = (e: MouseEvent) => handleInput(e.clientX, e.clientY, false);
    const md = (e: MouseEvent) => handleInput(e.clientX, e.clientY, true);
    
    window.addEventListener('mousemove', mm);
    window.addEventListener('mousedown', md);
    window.addEventListener('resize', initSimulation);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('resize', initSimulation);
    };
  }, [config, createRipple, initSimulation, currentZone, spawnCreature, onCapture, onBossHit, bossHealth]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full" 
      style={{ imageRendering: 'pixelated', background: '#05193c', touchAction: 'none', zIndex: 0 }} 
    />
  );
};

export default WaterCanvas;
