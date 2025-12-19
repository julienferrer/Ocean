
import React, { useEffect, useRef, useCallback } from 'react';

const WaterCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef<{
    width: number;
    height: number;
    size: number;
    buffer1: Int16Array;
    buffer2: Int16Array;
  } | null>(null);

  // Configuration de la simulation
  const SIM_WIDTH = Math.floor(window.innerWidth / 2);
  const SIM_HEIGHT = Math.floor(window.innerHeight / 2);
  const DECAY = 5; // Vitesse d'atténuation des vagues
  const STRENGTH = 512; // Force des ondulations au passage de la souris

  const initSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = SIM_WIDTH;
    canvas.height = SIM_HEIGHT;

    const size = SIM_WIDTH * SIM_HEIGHT;
    rippleRef.current = {
      width: SIM_WIDTH,
      height: SIM_HEIGHT,
      size,
      buffer1: new Int16Array(size),
      buffer2: new Int16Array(size),
    };
  }, [SIM_WIDTH, SIM_HEIGHT]);

  const addRipple = useCallback((x: number, y: number, strength: number) => {
    if (!rippleRef.current) return;
    const { width, height, buffer1 } = rippleRef.current;

    const ix = Math.floor((x / window.innerWidth) * width);
    const iy = Math.floor((y / window.innerHeight) * height);
    const radius = 3;

    for (let j = iy - radius; j < iy + radius; j++) {
      for (let i = ix - radius; i < ix + radius; i++) {
        if (i > 0 && i < width && j > 0 && j < height) {
          buffer1[j * width + i] += strength;
        }
      }
    }
  }, []);

  useEffect(() => {
    initSimulation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      if (!rippleRef.current) return;
      const { width, height, size, buffer1, buffer2 } = rippleRef.current;
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      // 1. Calculer la nouvelle étape de la simulation de l'eau
      for (let i = width; i < size - width; i++) {
        buffer2[i] = ((buffer1[i - 1] + buffer1[i + 1] + buffer1[i - width] + buffer1[i + width]) >> 1) - buffer2[i];
        buffer2[i] -= buffer2[i] >> DECAY;
      }

      // Inverser les buffers
      rippleRef.current.buffer1 = buffer2;
      rippleRef.current.buffer2 = buffer1;

      // 2. Rendu visuel basé sur les gradients (ombrage de l'eau)
      const baseR = 5, baseG = 25, baseB = 60; // Bleu profond de l'océan

      for (let i = 0; i < size; i++) {
        const x = i % width;
        const y = Math.floor(i / width);

        // Calculer l'ombrage par différence de hauteur
        const dx = buffer1[i - 1] - buffer1[i + 1];
        const dy = buffer1[i - width] - buffer1[i + width];
        const shade = dx + dy;

        const pIdx = i * 4;
        data[pIdx] = Math.min(255, Math.max(0, baseR + shade));
        data[pIdx + 1] = Math.min(255, Math.max(0, baseG + shade + 5));
        data[pIdx + 2] = Math.min(255, Math.max(0, baseB + shade + 20));
        data[pIdx + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);
      animationId = requestAnimationFrame(render);
    };

    render();

    // Gestion des entrées
    const handleMove = (e: MouseEvent) => addRipple(e.clientX, e.clientY, STRENGTH);
    const handleClick = (e: MouseEvent) => addRipple(e.clientX, e.clientY, STRENGTH * 3);
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        addRipple(e.touches[0].clientX, e.touches[0].clientY, STRENGTH);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('resize', initSimulation);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('resize', initSimulation);
    };
  }, [initSimulation, addRipple, STRENGTH]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        imageRendering: 'pixelated',
        touchAction: 'none',
        background: '#05193c'
      }}
    />
  );
};

export default WaterCanvas;
