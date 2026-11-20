/**
 * Pure utility functions for Workspace Cover Image Cropping & Sizing calculations.
 */

export interface NormalizedCrop {
  x: number; // 0 to 1
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
}

export interface PixelCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  outW: number;
  outH: number;
}

export interface AspectPreset {
  id: string;
  label: string;
  value: number | null; // null for freeform
}

export const CROP_ASPECT_PRESETS: AspectPreset[] = [
  { id: 'banner', label: 'Banner (2.8:1)', value: 2.8 },
  { id: '16_9', label: '16:9 Widescreen', value: 16 / 9 },
  { id: '21_9', label: '21:9 Ultrawide', value: 21 / 9 },
  { id: 'free', label: 'Freeform', value: null },
];

/**
 * Calculates initial normalized crop coordinates centered on the image
 * fitting the requested aspect ratio within [0, 1] bounds.
 */
export function calculateInitialCrop(
  imgWidth: number,
  imgHeight: number,
  targetAspect: number | null = 2.8
): NormalizedCrop {
  if (imgWidth <= 0 || imgHeight <= 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  if (targetAspect === null || targetAspect <= 0) {
    return { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
  }

  const imgAspect = imgWidth / imgHeight;

  if (imgAspect >= targetAspect) {
    // Image is wider than target aspect ratio
    const normHeight = 0.9;
    const normWidth = Math.min(1, (normHeight * targetAspect) / imgAspect);
    const x = Math.max(0, (1 - normWidth) / 2);
    const y = Math.max(0, (1 - normHeight) / 2);
    return { x, y, width: normWidth, height: normHeight };
  } else {
    // Image is taller than target aspect ratio (portrait or square)
    const normWidth = 0.95;
    const normHeight = Math.min(1, (normWidth * imgAspect) / targetAspect);
    const x = Math.max(0, (1 - normWidth) / 2);
    const y = Math.max(0, (1 - normHeight) / 2);
    return { x, y, width: normWidth, height: normHeight };
  }
}

/**
 * Clamps a normalized crop box within valid [0, 1] bounds with minimum dimensions.
 */
export function clampCrop(crop: NormalizedCrop): NormalizedCrop {
  const width = Math.max(0.05, Math.min(1, crop.width));
  const height = Math.max(0.05, Math.min(1, crop.height));
  const x = Math.max(0, Math.min(1 - width, crop.x));
  const y = Math.max(0, Math.min(1 - height, crop.y));
  return { x, y, width, height };
}

/**
 * Translates normalized crop coordinates to pixel source & output dimensions.
 */
export function calculateSourceCrop(
  crop: NormalizedCrop,
  naturalWidth: number,
  naturalHeight: number,
  maxOutputWidth: number = 1920
): PixelCrop {
  const clamped = clampCrop(crop);

  const sx = Math.round(clamped.x * naturalWidth);
  const sy = Math.round(clamped.y * naturalHeight);
  const sw = Math.max(1, Math.round(clamped.width * naturalWidth));
  const sh = Math.max(1, Math.round(clamped.height * naturalHeight));

  const outW = Math.min(maxOutputWidth, sw);
  const outH = Math.max(1, Math.round(outW * (sh / sw)));

  return { sx, sy, sw, sh, outW, outH };
}

/**
 * Renders the cropped image portion to an offscreen HTML5 canvas and returns a compressed data URL.
 */
export function renderCroppedDataUrl(
  img: HTMLImageElement,
  crop: NormalizedCrop,
  maxOutputWidth: number = 1920
): string {
  const { sx, sy, sw, sh, outW, outH } = calculateSourceCrop(
    crop,
    img.naturalWidth,
    img.naturalHeight,
    maxOutputWidth
  );

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available');
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

  try {
    return canvas.toDataURL('image/webp', 0.88);
  } catch {
    return canvas.toDataURL('image/jpeg', 0.88);
  }
}
