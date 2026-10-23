"use client";

import { useEffect, useRef, useState } from "react";

interface VictoryConfettiProps {
  /** Total animation duration in milliseconds before canvas clears and unmounts */
  durationMs?: number;
  /** Target total count of confetti particles */
  particleCount?: number;
  /** Callback fired when animation finishes and all particles have exited */
  onComplete?: () => void;
  /** Optional custom class name */
  className?: string;
}

type ConfettiShape = "rect" | "ribbon" | "circle" | "sparkle";

interface Particle {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: ConfettiShape;
  color: string;
  darkColor: string;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  terminalVelocity: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  scale: number;
}

const VICTORY_PALETTE = [
  // Gold & Amber
  { main: "#F59E0B", dark: "#B45309" },
  { main: "#FCD34D", dark: "#D97706" },
  { main: "#FBBF24", dark: "#92400E" },
  // Emerald & Mint
  { main: "#10B981", dark: "#047857" },
  { main: "#34D399", dark: "#065F46" },
  { main: "#66DF75", dark: "#166534" },
  // Royal Sapphire & Sky Blue
  { main: "#3B82F6", dark: "#1D4ED8" },
  { main: "#60A5FA", dark: "#1E40AF" },
  { main: "#38BDF8", dark: "#0369A1" },
  // Ruby Red & Coral
  { main: "#EF4444", dark: "#B91C1C" },
  { main: "#F87171", dark: "#991B1B" },
  // Royal Violet
  { main: "#8B5CF6", dark: "#6D28D9" },
  { main: "#A78BFA", dark: "#5B21B6" },
  // Pure Shimmer White
  { main: "#FFFFFF", dark: "#CBD5E1" },
];

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function VictoryConfetti({
  durationMs = 4800,
  particleCount = 200,
  onComplete,
  className = "",
}: VictoryConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Respect accessibility settings
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsFinished(true);
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (!canvas) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const createParticle = (originY = -20): Particle => {
      const palette = randomChoice(VICTORY_PALETTE);
      const rand = Math.random();
      let shape: ConfettiShape = "rect";
      let pWidth = randomRange(6, 11);
      let pHeight = randomRange(9, 14);

      if (rand < 0.22) {
        // Streamer / Ribbon
        shape = "ribbon";
        pWidth = randomRange(3.5, 5.5);
        pHeight = randomRange(18, 28);
      } else if (rand < 0.42) {
        // Shimmer Circle
        shape = "circle";
        const r = randomRange(3.5, 6);
        pWidth = r * 2;
        pHeight = r * 2;
      } else if (rand < 0.58) {
        // Sparkle / Diamond
        shape = "sparkle";
        const sz = randomRange(7, 12);
        pWidth = sz;
        pHeight = sz;
      }

      return {
        x: randomRange(0, width),
        y: originY,
        width: pWidth,
        height: pHeight,
        shape,
        color: palette.main,
        darkColor: palette.dark,
        vx: randomRange(-2.2, 2.2),
        vy: randomRange(1.8, 4.5),
        gravity: randomRange(0.12, 0.22),
        drag: 0.985,
        terminalVelocity: randomRange(4.0, 7.2),
        rotation: randomRange(0, Math.PI * 2),
        rotationSpeed: randomRange(-0.06, 0.06),
        wobble: randomRange(0, Math.PI * 2),
        wobbleSpeed: randomRange(0.04, 0.12),
        opacity: 1,
        scale: 1,
      };
    };

    // Staggered spawning: initial burst + waves
    const initialCount = Math.floor(particleCount * 0.45);
    const remainingToSpawn = particleCount - initialCount;
    const particles: Particle[] = [];

    // Burst from across the upper screen
    for (let i = 0; i < initialCount; i++) {
      particles.push(createParticle(randomRange(-150, 0)));
    }

    const startTime = performance.now();
    const spawnDuration = Math.min(2600, durationMs * 0.55);
    let spawnedCount = 0;
    let lastSpawnTime = startTime;

    const render = (currentTime: number) => {
      const elapsed = currentTime - startTime;

      // Spawn subsequent particles in waves during spawn window
      if (elapsed < spawnDuration && spawnedCount < remainingToSpawn) {
        const timeSinceLastSpawn = currentTime - lastSpawnTime;
        // Spawn interval ~ 30-50ms
        if (timeSinceLastSpawn > 35) {
          const spawnBatch = Math.min(
            Math.ceil((remainingToSpawn / (spawnDuration / 40)) * (timeSinceLastSpawn / 40)),
            remainingToSpawn - spawnedCount
          );
          for (let i = 0; i < spawnBatch; i++) {
            particles.push(createParticle(-15));
            spawnedCount++;
          }
          lastSpawnTime = currentTime;
        }
      }

      ctx.clearRect(0, 0, width, height);

      let aliveCount = 0;
      const progress = elapsed / durationMs;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        // Update physics
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;
        p.vy = Math.min(p.vy + p.gravity, p.terminalVelocity);
        p.vx *= p.drag;
        p.x += p.vx + Math.sin(p.wobble) * 1.5;
        p.y += p.vy;

        // Fade out gracefully as duration comes to an end or as particle drops low
        if (progress > 0.7) {
          const fadeProgress = (progress - 0.7) / 0.3;
          p.opacity = Math.max(0, 1 - fadeProgress);
        } else if (p.y > height - 120) {
          p.opacity = Math.max(0, 1 - (p.y - (height - 120)) / 140);
        }

        // Particle exited viewport or fully transparent
        if (p.y > height + 50 || p.opacity <= 0) {
          continue;
        }

        aliveCount++;

        // Draw particle with 3D tumble projection
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D flip illusion using cosine of wobble
        const cosWobble = Math.cos(p.wobble);
        const scaleX = cosWobble;
        ctx.scale(scaleX, 1);

        // Light reflection: if back of paper faces camera, use darkColor
        ctx.fillStyle = cosWobble < 0 ? p.darkColor : p.color;
        ctx.globalAlpha = p.opacity;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "sparkle") {
          const sz = p.width / 2;
          ctx.beginPath();
          ctx.moveTo(0, -sz);
          ctx.lineTo(sz * 0.35, 0);
          ctx.lineTo(0, sz);
          ctx.lineTo(-sz * 0.35, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // rect or ribbon
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      }

      // Check termination condition: duration exceeded and no active particles remaining
      if ((elapsed > durationMs && aliveCount === 0) || elapsed > durationMs + 1200) {
        ctx.clearRect(0, 0, width, height);
        setIsFinished(true);
        onComplete?.();
        return;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [durationMs, particleCount, onComplete]);

  if (isFinished) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className={`victory-confetti-canvas ${className}`}
      aria-hidden="true"
    />
  );
}
