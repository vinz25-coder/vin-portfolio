import { useEffect, useRef, type CSSProperties } from "react";

import "./ParticleText.css";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  seed: number;
  delay: number;
}

interface ParticleTextProps {
  text: string;
  color: string;
  highlightColor: string;
  className?: string;
  style?: CSSProperties;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string): Rgb => ({
  r: Number.parseInt(hex.slice(1, 3), 16),
  g: Number.parseInt(hex.slice(3, 5), 16),
  b: Number.parseInt(hex.slice(5, 7), 16),
});

const mixColor = (from: Rgb, to: Rgb, amount: number) =>
  `rgb(${Math.round(from.r + (to.r - from.r) * amount)}, ${Math.round(from.g + (to.g - from.g) * amount)}, ${Math.round(from.b + (to.b - from.b) * amount)})`;

export default function ParticleText({
  text,
  color,
  highlightColor,
  className = "",
  style,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (
      !container ||
      !canvas ||
      !context ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    let particles: Particle[] = [];
    let frame: number | null = null;
    let resizeFrame: number | null = null;
    let gatherStart = performance.now();
    let previousFrameTime = gatherStart;
    let width = 0;
    let height = 0;
    let compactRendering = false;
    let isVisible = true;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const pointer = { active: false, x: 0, y: 0, releasedAt: 0 };

    const render = (now: number) => {
      if (!isVisible) {
        frame = null;
        return;
      }

      context.clearRect(0, 0, width, height);
      context.shadowBlur = 0;

      const elapsed = now - gatherStart;
      const frameDuration = Math.min(now - previousFrameTime, 50);
      const followStrength = reducedMotion
        ? 1
        : 1 - Math.pow(0.8, frameDuration / (1000 / 60));
      const releaseProgress = clamp((now - pointer.releasedAt) / 450, 0, 1);
      const interactionStrength = pointer.active
        ? 1
        : pointer.releasedAt > 0
          ? 1 - releaseProgress
          : 0;
      const interactionRadius = 130;
      const interactionRadiusSquared = interactionRadius * interactionRadius;
      for (const particle of particles) {
        const progress = reducedMotion
          ? 1
          : clamp((elapsed - particle.delay) / 1350, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        let targetX =
          particle.startX + (particle.targetX - particle.startX) * eased;
        let targetY =
          particle.startY + (particle.targetY - particle.startY) * eased;

        if (!reducedMotion && progress === 1) {
          const drift = compactRendering ? 0.3 : 0.75;
          targetX += Math.sin(now * 0.0008 + particle.seed * 12) * drift;
          targetY += Math.cos(now * 0.0007 + particle.seed * 10) * drift;
        }

        if (interactionStrength > 0 && !reducedMotion) {
          const dx = targetX - pointer.x;
          const dy = targetY - pointer.y;
          const distanceSquared = dx * dx + dy * dy;
          if (
            distanceSquared > 0 &&
            distanceSquared < interactionRadiusSquared
          ) {
            const distance = Math.sqrt(distanceSquared);
            const force =
              Math.pow(1 - distance / interactionRadius, 2) *
              48 *
              interactionStrength;
            targetX += (dx / distance) * force;
            targetY += (dy / distance) * force;
          }
        }

        particle.x += (targetX - particle.x) * followStrength;
        particle.y += (targetY - particle.y) * followStrength;
        context.globalAlpha = 0.45 + progress * 0.55;
        context.fillStyle = particle.color;
        context.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size,
        );
      }

      context.globalAlpha = 1;
      context.shadowBlur = 0;
      previousFrameTime = now;
      frame = window.requestAnimationFrame(render);
    };

    const build = () => {
      const bounds = container.getBoundingClientRect();
      width = Math.floor(bounds.width);
      height = Math.floor(bounds.height);
      if (width <= 0 || height <= 0) return;
      compactRendering = width < 640;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const sampleCanvas = document.createElement("canvas");
      const sample = sampleCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sample) return;

      const family = window.getComputedStyle(container).fontFamily;
      let fontSize = Math.min(190, width * 0.135, height * 0.94);
      const fontWeight = compactRendering ? 700 : 800;
      sample.font = `${fontWeight} ${fontSize}px ${family}`;
      const safeWidth = width * 0.94;
      const measuredWidth = sample.measureText(text).width;
      if (measuredWidth > safeWidth) fontSize *= safeWidth / measuredWidth;

      sample.font = `${fontWeight} ${fontSize}px ${family}`;
      const metrics = sample.measureText(text);
      const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
      const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
      const ascent = Math.ceil(
        metrics.actualBoundingBoxAscent || fontSize * 0.78,
      );
      const descent = Math.ceil(
        metrics.actualBoundingBoxDescent || fontSize * 0.22,
      );
      const glyphPadding = Math.max(6, Math.ceil(fontSize * 0.04));
      sampleCanvas.width = left + right + glyphPadding * 2;
      sampleCanvas.height = ascent + descent + glyphPadding * 2;
      sample.font = `${fontWeight} ${fontSize}px ${family}`;
      sample.textBaseline = "alphabetic";
      sample.fillStyle = "#fff";
      sample.fillText(text, glyphPadding - left, glyphPadding + ascent);

      const pixels = sample.getImageData(
        0,
        0,
        sampleCanvas.width,
        sampleCanvas.height,
      );
      const targets: Array<{ x: number; y: number }> = [];
      const step = width < 640 ? 4 : 3;
      for (let y = 0; y < sampleCanvas.height; y += step) {
        for (let x = 0; x < sampleCanvas.width; x += step) {
          if (pixels.data[(y * sampleCanvas.width + x) * 4 + 3] > 60) {
            targets.push({
              x: width / 2 - sampleCanvas.width / 2 + x,
              y: height / 2 - sampleCanvas.height / 2 + y,
            });
          }
        }
      }

      const limit = finePointer ? 2000 : 1200;
      const stride = Math.max(1, Math.ceil(targets.length / limit));
      const base = hexToRgb(color);
      const accent = hexToRgb(highlightColor);
      particles = targets
        .filter((_, index) => index % stride === 0)
        .map((target, index) => {
          const seed = ((index * 9301 + 49297) % 233280) / 233280;
          const angle = seed * Math.PI * 2;
          const distance = reducedMotion ? 0 : 70 + seed * 110;
          const startX = target.x + Math.cos(angle) * distance;
          const startY = target.y + Math.sin(angle) * distance;
          return {
            x: startX,
            y: startY,
            startX,
            startY,
            targetX: target.x,
            targetY: target.y,
            size: compactRendering ? 1.1 : 1.8,
            color: mixColor(
              base,
              accent,
              clamp(target.x / width + 0.12, 0.12, 0.9),
            ),
            seed,
            delay: reducedMotion ? 0 : seed * 360,
          };
        });
      gatherStart = performance.now();
      previousFrameTime = gatherStart;

      if (frame === null && isVisible)
        frame = window.requestAnimationFrame(render);
    };

    const queueBuild = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(build);
    };
    const updatePointerPosition = (event: PointerEvent) => {
      pointer.x = event.offsetX;
      pointer.y = event.offsetY;
    };
    const handlePointerDown = (event: PointerEvent) => {
      updatePointerPosition(event);
      pointer.active = true;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointer && !pointer.active) return;
      updatePointerPosition(event);
      pointer.active = true;
    };
    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.releasedAt = performance.now();
    };

    const resizeObserver = new ResizeObserver(queueBuild);
    resizeObserver.observe(container);
    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              isVisible = entry?.isIntersecting ?? true;
              if (isVisible && frame === null)
                frame = window.requestAnimationFrame(render);
            },
            { rootMargin: "160px" },
          );
    intersectionObserver?.observe(container);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerLeave);
    canvas.addEventListener("pointercancel", handlePointerLeave);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    build();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerLeave);
      canvas.removeEventListener("pointercancel", handlePointerLeave);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [color, highlightColor, text]);

  return (
    <div
      ref={containerRef}
      className={`particle-text ${className}`}
      style={{
        ...style,
        "--particle-text-glow": highlightColor,
      } as CSSProperties}
    >
      <canvas
        ref={canvasRef}
        className="particle-text__canvas"
        aria-hidden="true"
      />
      <span className="particle-text__sr">{text}</span>
    </div>
  );
}
