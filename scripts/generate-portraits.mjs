import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const portraits = [
  { theme: "light", widths: [640, 960, 1024] },
  { theme: "dark", widths: [640, 960, 1254] },
];

for (const { theme, widths } of portraits) {
  const source = path.join(publicDir, `portrait-${theme}.png`);
  const metadata = await sharp(source).metadata();
  const largestWidth = Math.max(...widths);

  if (!metadata.width || metadata.width < largestWidth) {
    throw new Error(
      `${source} must be at least ${largestWidth}px wide; received ${metadata.width ?? "unknown"}px.`,
    );
  }

  for (const width of widths) {
    const outputStem = path.join(publicDir, `portrait-${theme}-${width}`);
    const resized = sharp(source).resize({
      width,
      withoutEnlargement: true,
    });

    const outputs = await Promise.all([
      resized
        .clone()
        .avif({ quality: 70, effort: 6 })
        .toFile(`${outputStem}.avif`)
        .then((info) => ({ extension: "avif", info })),
      resized
        .clone()
        .webp({ quality: 82, effort: 6 })
        .toFile(`${outputStem}.webp`)
        .then((info) => ({ extension: "webp", info })),
    ]);

    for (const { extension, info } of outputs) {
      if (info.width !== width || info.height !== width) {
        throw new Error(
          `${outputStem}.${extension} has unexpected dimensions ${info.width}x${info.height}.`,
        );
      }

      process.stdout.write(
        `Generated portrait-${theme}-${width}.${extension} (${info.width}x${info.height}, ${info.size} bytes)\n`,
      );
    }
  }
}
