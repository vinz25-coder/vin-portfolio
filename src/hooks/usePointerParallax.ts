import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect, type RefObject } from "react";

import { mobileViewportQuery } from "../lib/media-queries";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface PointerParallaxOptions {
  maxX?: number;
  maxY?: number;
  stiffness?: number;
  damping?: number;
}

interface PointerParallaxValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

export function usePointerParallax(
  targetRef: RefObject<HTMLElement | null>,
  {
    maxX = 10,
    maxY = 6,
    stiffness = 120,
    damping = 14,
  }: PointerParallaxOptions = {},
): PointerParallaxValues {
  const prefersReducedMotion = usePrefersReducedMotion();
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness, damping });
  const y = useSpring(targetY, { stiffness, damping });

  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    if (prefersReducedMotion) {
      targetX.set(0);
      targetY.set(0);
      x.jump(0);
      y.jump(0);
      return;
    }

    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const mobileViewportMedia = window.matchMedia(mobileViewportQuery);
    let isListening = false;

    const resetPosition = () => {
      targetX.set(0);
      targetY.set(0);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const normalizedX = Math.max(
        -1,
        Math.min(1, (event.clientX / window.innerWidth - 0.5) * 2),
      );
      const normalizedY = Math.max(
        -1,
        Math.min(1, (event.clientY / window.innerHeight - 0.5) * 2),
      );

      targetX.set(normalizedX * maxX);
      targetY.set(normalizedY * maxY);
    };

    const syncPointerListeners = () => {
      if (
        finePointerQuery.matches &&
        !mobileViewportMedia.matches &&
        !isListening
      ) {
        target.addEventListener("pointermove", handlePointerMove);
        target.addEventListener("pointerleave", resetPosition);
        isListening = true;
      } else if (
        (!finePointerQuery.matches || mobileViewportMedia.matches) &&
        isListening
      ) {
        target.removeEventListener("pointermove", handlePointerMove);
        target.removeEventListener("pointerleave", resetPosition);
        isListening = false;
        resetPosition();
      }
    };

    syncPointerListeners();
    finePointerQuery.addEventListener("change", syncPointerListeners);
    mobileViewportMedia.addEventListener("change", syncPointerListeners);

    return () => {
      finePointerQuery.removeEventListener("change", syncPointerListeners);
      mobileViewportMedia.removeEventListener("change", syncPointerListeners);
      target.removeEventListener("pointermove", handlePointerMove);
      target.removeEventListener("pointerleave", resetPosition);
    };
  }, [maxX, maxY, prefersReducedMotion, targetRef, targetX, targetY, x, y]);

  return { x, y };
}
