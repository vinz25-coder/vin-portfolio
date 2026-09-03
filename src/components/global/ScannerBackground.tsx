import Scanner from "../react-bits/Scanner.jsx";

import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useTheme } from "../../hooks/useTheme";

const scannerColors = {
  light: {
    color1: "#93611A",
    color2: "#E0A553",
    color3: "#F7E8D4",
  },
  dark: {
    color1: "#9D1119",
    color2: "#E9333D",
    color3: "#F5F5F4",
  },
} as const;

export function ScannerBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { theme } = useTheme();
  const colors = scannerColors[theme];

  return (
    <div
      aria-hidden="true"
      data-testid="scanner-background"
      data-theme={theme}
      className="scanner-background pointer-events-none fixed inset-0 z-0"
    >
      {import.meta.env.MODE !== "test" && !prefersReducedMotion && (
        <Scanner
          color1={colors.color1}
          color2={colors.color2}
          color3={colors.color3}
          speed={0.5}
          sweepSpeed={0.25}
          sweepWidth={1.6}
          sweepFalloff={6}
          scale={1.5}
          frequency={2}
          ripple={0.22}
          bandDensity={11}
          lineSharpness={5.5}
          glow={0.22}
          scanDirection="vertical"
          colorSpread={0.7}
          brightness={1.0}
          contrast={1.15}
          softness={1.4}
          vignette={0.45}
          scanline
          grain={false}
          grainIntensity={0.05}
          opacity={1.0}
          mouseInteraction
          mouseRadius={0.5}
          mouseStrength={0.5}
        />
      )}
    </div>
  );
}
