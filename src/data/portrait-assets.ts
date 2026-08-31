import type { Theme } from "../context/ThemeContext";

const optimizedFormats = ["avif", "webp"] as const;

interface PortraitSource {
  type: `image/${(typeof optimizedFormats)[number]}`;
  srcSet: string;
}

export interface PortraitAsset {
  fallbackSrc: string;
  width: number;
  height: number;
  sources: PortraitSource[];
}

interface PortraitAssetOptions {
  fallbackSrc: string;
  optimizedStem?: string;
  widths?: readonly number[];
  width: number;
  height: number;
}

function createPortraitAsset({
  fallbackSrc,
  optimizedStem,
  widths = [],
  width,
  height,
}: PortraitAssetOptions): PortraitAsset {
  const sources = optimizedStem
    ? optimizedFormats.map((format) => ({
        type: `image/${format}` as const,
        srcSet: widths
          .map(
            (portraitWidth) =>
              `${optimizedStem}-${portraitWidth}.${format} ${portraitWidth}w`,
          )
          .join(", "),
      }))
    : [];

  return { fallbackSrc, width, height, sources };
}

// Replace portraits here only. Remove `optimizedStem` to use one AVIF, WebP,
// or PNG file from `fallbackSrc` while preparing new responsive variants.
export const portraitAssets: Record<Theme, PortraitAsset> = {
  light: createPortraitAsset({
    fallbackSrc: "/portrait-light.png",
    optimizedStem: "/portrait-light",
    widths: [640, 960, 1024],
    width: 1024,
    height: 1024,
  }),
  dark: createPortraitAsset({
    fallbackSrc: "/portrait-dark.png",
    optimizedStem: "/portrait-dark",
    widths: [640, 960, 1254],
    width: 1254,
    height: 1254,
  }),
};
