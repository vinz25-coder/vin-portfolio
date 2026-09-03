import { MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { customCursorMotion } from "../../motion/constants";
import { useTheme } from "../../hooks/useTheme";

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, [role="button"], [role="link"]';

function supportsCustomCursor() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(min-width: 640px)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  const interactiveElement = target.closest(INTERACTIVE_SELECTOR);

  return Boolean(
    interactiveElement &&
    !interactiveElement.matches(':disabled, [aria-disabled="true"]'),
  );
}

export function CustomCursor() {
  const { theme } = useTheme();
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(supportsCustomCursor);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const desktopViewportQuery = window.matchMedia("(min-width: 640px)");
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateAvailability = () => setIsEnabled(supportsCustomCursor());

    finePointerQuery.addEventListener("change", updateAvailability);
    desktopViewportQuery.addEventListener("change", updateAvailability);
    reducedMotionQuery.addEventListener("change", updateAvailability);

    return () => {
      finePointerQuery.removeEventListener("change", updateAvailability);
      desktopViewportQuery.removeEventListener("change", updateAvailability);
      reducedMotionQuery.removeEventListener("change", updateAvailability);
    };
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;

    if (!isEnabled || !cursor) {
      document.documentElement.classList.remove("custom-cursor-active");
      return undefined;
    }

    document.documentElement.classList.add("custom-cursor-active");

    let animationFrameId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let targetScale = 1;
    let hasPointerPosition = false;
    let lastPointerTarget: EventTarget | null = null;
    let isInteractive = false;

    const renderCursor = () => {
      cursor.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(${targetScale})`;
      animationFrameId = null;
    };

    const updatePointer = (event: PointerEvent) => {
      targetX = event.clientX - customCursorMotion.hotspotOffset;
      targetY = event.clientY - customCursorMotion.hotspotOffset;
      hasPointerPosition = true;

      if (event.target !== lastPointerTarget) {
        lastPointerTarget = event.target;
        const nextInteractive = isInteractiveTarget(event.target);
        if (nextInteractive !== isInteractive) {
          isInteractive = nextInteractive;
          targetScale = isInteractive ? customCursorMotion.hoverScale : 1;
          cursor.dataset.interactive = String(isInteractive);
        }
      }

      cursor.dataset.visible = "true";
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(renderCursor);
      }
    };

    const hideCursor = () => {
      cursor.dataset.visible = "false";
    };

    const showCursor = () => {
      if (hasPointerPosition) {
        cursor.dataset.visible = "true";
      }
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideCursor);
    document.documentElement.addEventListener("pointerenter", showCursor);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("pointermove", updatePointer);
      document.documentElement.removeEventListener("pointerleave", hideCursor);
      document.documentElement.removeEventListener("pointerenter", showCursor);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      data-testid="custom-cursor"
      data-theme={theme}
      data-interactive="false"
      data-visible="false"
      className="custom-cursor-glass fixed top-0 left-0 z-[100] flex size-8 origin-top-left items-center justify-center rounded-[0.625rem]"
    >
      <MousePointer2
        aria-hidden="true"
        size={20}
        strokeWidth={1.6}
        className="custom-cursor-icon"
      />
    </div>
  );
}
