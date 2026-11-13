const MAX_EDGE = 1400;

export async function toJpeg(input: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const base = sharp(input, { failOn: "none", limitInputPixels: 40_000_000 }).rotate();
  let jpeg = await base
    .clone()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  if (jpeg.length > 1_500_000) {
    jpeg = await sharp(jpeg).jpeg({ quality: 60 }).toBuffer();
  }
  return jpeg;
}
