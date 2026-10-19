import { SignatureInkColor, SignatureSettings } from '../types/biodata';

/**
 * Processes an uploaded signature image:
 * 1. Removes white/near-white/grey paper background with configurable threshold and smoothing.
 * 2. Applies ink color (Black, Blue, or Original with contrast adjustment).
 * 3. Automatically crops excess transparent borders with a neat 8-12px padding.
 * Returns a transparent PNG Data URL.
 */
export async function processSignatureImage(
  imageSource: string,
  settings: SignatureSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Limit max dimensions for snappy processing while preserving high resolution
        const maxDimension = 1200;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Settings mapping
        // threshold: 10 - 90, default ~45
        // Darkness multiplier: 1.0 - 2.5, default ~1.4
        const threshold = settings.threshold;
        const darkness = settings.darkness || 1.4;
        const smoothness = settings.smoothness || 1;
        const inkColor: SignatureInkColor = settings.inkColor || 'black';

        // Calculate background cutoff luminance
        // A threshold of 50 removes luminance >= 195. Threshold of 80 removes luminance >= 150.
        const cutoff = 255 - (threshold / 100) * 110; // ranges approx from 244 down to 145
        const feather = Math.max(12, 10 + smoothness * 8);

        // Process pixels
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const originalAlpha = data[i + 3];

          if (originalAlpha === 0) {
            continue;
          }

          // Relative luminance of pixel
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          // Check if pixel is part of background
          if (luminance >= cutoff) {
            // Fully transparent paper background
            data[i + 3] = 0;
          } else if (luminance > cutoff - feather) {
            // Feathered soft edge transition
            const ratio = (cutoff - luminance) / feather;
            const newAlpha = Math.min(255, Math.max(0, Math.round(ratio * originalAlpha)));
            data[i + 3] = newAlpha;

            // Apply ink color
            applyInkColor(data, i, r, g, b, inkColor, darkness);
          } else {
            // Solid signature ink stroke
            // Boost stroke alpha
            data[i + 3] = Math.min(255, Math.round(originalAlpha * 1.05));

            // Apply ink color
            applyInkColor(data, i, r, g, b, inkColor, darkness);
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Auto-crop transparent boundaries
        const croppedCanvas = autoCropCanvas(canvas, ctx, width, height);
        const processedUrl = croppedCanvas.toDataURL('image/png');
        resolve(processedUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load signature image for processing'));
    };

    img.src = imageSource;
  });
}

function applyInkColor(
  data: Uint8ClampedArray,
  i: number,
  r: number,
  g: number,
  b: number,
  inkColor: SignatureInkColor,
  darkness: number
) {
  if (inkColor === 'black') {
    // Formal dense black pen ink (#0a0a0f with slight organic tone)
    data[i] = 10;
    data[i + 1] = 12;
    data[i + 2] = 18;
  } else if (inkColor === 'blue') {
    // Formal dark royal blue ballpoint/fountain pen ink (#153c8a)
    data[i] = 20;
    data[i + 1] = 55;
    data[i + 2] = 145;
  } else {
    // Original ink with contrast and darkness adjustment
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const factor = Math.max(0.1, 1 - (darkness - 1) * 0.4);
    data[i] = Math.max(0, Math.min(255, Math.round(r * factor)));
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g * factor)));
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b * factor)));
  }
}

/**
 * Finds the non-transparent bounding box of the canvas and crops it with 10px padding
 */
function autoCropCanvas(
  sourceCanvas: HTMLCanvasElement,
  sourceCtx: CanvasRenderingContext2D,
  width: number,
  height: number
): HTMLCanvasElement {
  const imgData = sourceCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasInk = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 15) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no ink was found or image was empty, return original
  if (!hasInk || maxX < minX || maxY < minY) {
    return sourceCanvas;
  }

  // Add 10px clean transparent padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;

  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx) {
    croppedCtx.drawImage(
      sourceCanvas,
      minX,
      minY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );
    return croppedCanvas;
  }

  return sourceCanvas;
}
