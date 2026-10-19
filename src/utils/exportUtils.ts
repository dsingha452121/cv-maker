/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import html2canvasPro from 'html2canvas-pro';
import { toCanvas } from 'html-to-image';
import JSZip from 'jszip';

// Helper canvas context for modern color conversion
let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

function getHelperContext(): CanvasRenderingContext2D | null {
  if (!helperCtx && typeof document !== 'undefined') {
    helperCanvas = document.createElement('canvas');
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
  }
  return helperCtx;
}

/**
 * Converts modern CSS colors (oklch, oklab, color-mix, color()) to standard rgb/rgba
 * using the browser's native canvas color parser.
 */
export function cssColorToRgb(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  const trimmed = colorStr.trim();
  if (
    !trimmed.includes('oklch') &&
    !trimmed.includes('oklab') &&
    !trimmed.includes('color-mix') &&
    !trimmed.includes('color(') &&
    !trimmed.includes('hwb')
  ) {
    return trimmed;
  }

  const ctx = getHelperContext();
  if (!ctx) return trimmed;

  try {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = trimmed;
    const computed = ctx.fillStyle;
    return computed || trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Normalizes all CSS colors in stylesheets and inline styles of the cloned document.
 * Converts oklch/oklab/color-mix to standard rgb/hex as a safety fallback.
 */
export function normalizeExportColors(clonedElement: HTMLElement, clonedDoc: Document): void {
  // 1. Sanitize all <style> tags in the cloned document
  const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
  styleTags.forEach((styleTag) => {
    if (
      styleTag.textContent &&
      (styleTag.textContent.includes('oklch') ||
        styleTag.textContent.includes('oklab') ||
        styleTag.textContent.includes('color-mix'))
    ) {
      try {
        styleTag.textContent = styleTag.textContent
          .replace(/oklch\([^)]+\)/gi, (m) => cssColorToRgb(m))
          .replace(/oklab\([^)]+\)/gi, (m) => cssColorToRgb(m))
          .replace(/color-mix\([^)]+\)/gi, (m) => cssColorToRgb(m))
          .replace(/color\([^)]+\)/gi, (m) => cssColorToRgb(m));
      } catch (err) {
        console.warn('Could not sanitize style tag:', err);
      }
    }
  });

  // 2. Explicitly inline converted RGB colors on elements
  const colorProps: (keyof CSSStyleDeclaration)[] = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'outlineColor',
  ];

  const allElements = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))] as HTMLElement[];
  allElements.forEach((el) => {
    if (!el.style) return;

    try {
      const win = el.ownerDocument?.defaultView || window;
      const cs = win.getComputedStyle(el);

      colorProps.forEach((prop) => {
        const val = cs[prop] as string;
        if (
          val &&
          (val.includes('oklch') ||
            val.includes('oklab') ||
            val.includes('color-mix') ||
            val.includes('color('))
        ) {
          (el.style as any)[prop] = cssColorToRgb(val);
        }
      });
    } catch {
      // Ignore element if style lookup fails
    }
  });
}

/**
 * Waits for all images and web fonts (including Devanagari/Bengali/English) to finish loading.
 */
export async function waitForExportAssets(element: HTMLElement): Promise<void> {
  // Wait for document fonts
  if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch (e) {
      console.warn('Font loading wait:', e);
    }
  }

  // Wait for image elements
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 800);
        });
      })
    );
  }

  // Brief stabilization tick
  await new Promise((r) => setTimeout(r, 60));
}

/**
 * Captures #biodata-print-area into a pristine 794x1123 canvas (scale 2 or 3).
 * Clones into an off-screen wrapper at exactly 794x1123 px with no zoom from the preview wrapper,
 * keeping the inner fitScale transform intact.
 */
export async function captureCanvas(
  elementId: string = 'biodata-print-area',
  scale: number = 2
): Promise<HTMLCanvasElement> {
  const sourceElement =
    document.getElementById(elementId) ||
    document.getElementById('biodata-print-area') ||
    document.getElementById('biodata-document-sheet');

  if (!sourceElement) {
    throw new Error('Bio-data print area not found. Please ensure the preview is visible.');
  }

  // Wait for fonts and images to load
  await waitForExportAssets(sourceElement);

  // Create clean offscreen wrapper at exactly 794x1123px (A4 portrait at 96 DPI)
  const offscreen = document.createElement('div');
  offscreen.id = 'cv-export-offscreen-wrapper';
  offscreen.style.position = 'fixed';
  offscreen.style.top = '0';
  offscreen.style.left = '-10000px';
  offscreen.style.width = '794px';
  offscreen.style.height = '1123px';
  offscreen.style.overflow = 'hidden';
  offscreen.style.backgroundColor = '#ffffff';
  offscreen.style.zIndex = '-99999';
  offscreen.style.pointerEvents = 'none';

  // Deep clone the single A4 print area
  const clonedArea = sourceElement.cloneNode(true) as HTMLElement;
  clonedArea.id = 'biodata-print-area-clone';
  clonedArea.style.width = '794px';
  clonedArea.style.height = '1123px';
  clonedArea.style.maxWidth = '794px';
  clonedArea.style.maxHeight = '1123px';
  clonedArea.style.minWidth = '794px';
  clonedArea.style.minHeight = '1123px';
  clonedArea.style.transform = 'none';
  clonedArea.style.boxShadow = 'none';
  clonedArea.style.margin = '0';
  clonedArea.style.position = 'relative';
  clonedArea.style.backgroundColor = '#ffffff';

  // Explicitly copy all inline CSS variables from sourceElement
  const cssVars = ['--base-fs', '--lh', '--fw', '--heading-fw', '--gap', '--photo-scale'];
  cssVars.forEach((v) => {
    const val = sourceElement.style.getPropertyValue(v);
    if (val) {
      clonedArea.style.setProperty(v, val);
    }
  });

  const clonedRoot = clonedArea.querySelector('.bio-root') as HTMLElement | null;
  const sourceRoot = sourceElement.querySelector('.bio-root') as HTMLElement | null;
  if (clonedRoot && sourceRoot) {
    cssVars.forEach((v) => {
      const val = sourceRoot.style.getPropertyValue(v);
      if (val) {
        clonedRoot.style.setProperty(v, val);
      }
    });
  }

  // Safety fallback: normalize modern computed colors inside clone
  normalizeExportColors(clonedArea, document);

  offscreen.appendChild(clonedArea);
  document.body.appendChild(offscreen);

  try {
    let canvas: HTMLCanvasElement | null = null;

    // Primary: html2canvas-pro with native oklch/oklab support
    try {
      canvas = await html2canvasPro(clonedArea, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        logging: false,
      });
    } catch (h2cErr) {
      console.warn('html2canvas-pro capture fallback to toCanvas:', h2cErr);
      canvas = await toCanvas(clonedArea, {
        pixelRatio: scale,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        skipAutoScale: true,
      });
    }

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas render was empty.');
    }

    return canvas;
  } finally {
    if (offscreen.parentNode) {
      offscreen.parentNode.removeChild(offscreen);
    }
  }
}

/**
 * Formats standard file name like "Biodata_RAHUL_SHARMA.pdf"
 */
export function formatExportFileName(candidateName?: string, extension: string = 'pdf'): string {
  const clean = (candidateName || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 35);

  const base = clean ? `Biodata_${clean.toUpperCase()}` : 'Biodata_SS_TELECOM';
  return extension ? `${base}.${extension}` : base;
}

/**
 * Triggers a browser download of a blob using a temporary <a download> tag.
 * Works inside AI Studio sandboxed iframe without window.open.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}

/**
 * Single-Page A4 PDF Generator
 * ALWAYS outputs exactly one A4 page (210 x 297 mm) with exact page-fit.
 */
export async function downloadCvPdf(
  elementId: string = 'biodata-print-area',
  candidateName?: string,
  onProgress?: (status: string) => void
): Promise<boolean> {
  onProgress?.('Rendering exact single A4 page...');
  const canvas = await captureCanvas(elementId, 2);

  onProgress?.('Generating single-page A4 PDF...');
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

  const fileName = formatExportFileName(candidateName, 'pdf');

  onProgress?.('Downloading PDF...');
  const blob = pdf.output('blob');
  triggerBlobDownload(blob, fileName);

  return true;
}

/**
 * Single-Page Image Generator (PNG or JPG at scale 3x)
 */
export async function downloadCvImage(
  format: 'png' | 'jpeg',
  elementId: string = 'biodata-print-area',
  candidateName?: string,
  onProgress?: (status: string) => void
): Promise<boolean> {
  onProgress?.(`Rendering crisp ${format.toUpperCase()} (scale 3x)...`);
  const canvas = await captureCanvas(elementId, 3);

  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpeg' ? 0.95 : undefined;
  const fileName = formatExportFileName(candidateName, ext);

  onProgress?.(`Downloading ${format.toUpperCase()}...`);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to generate ${format.toUpperCase()} image.`));
          return;
        }
        triggerBlobDownload(blob, fileName);
        resolve();
      },
      mimeType,
      quality
    );
  });

  return true;
}

/**
 * Single A4 page image download as ZIP (contains the single A4 page image)
 */
export async function downloadAllCvPagesAsZip(
  elementId: string = 'biodata-print-area',
  candidateName?: string,
  onProgress?: (status: string) => void
): Promise<boolean> {
  onProgress?.('Rendering A4 image for archive...');
  const canvas = await captureCanvas(elementId, 3);

  const zip = new JSZip();
  const candidatePrefix = formatExportFileName(candidateName, '').replace(/\.$/, '');

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );

  if (blob) {
    zip.file(`${candidatePrefix}_A4_Page.png`, blob);
  }

  onProgress?.('Generating ZIP archive...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, `${candidatePrefix}_Pages.zip`);

  return true;
}

/**
 * Real Browser Printing Workflow
 */
export function printCvDocument(): void {
  window.focus();
  try {
    window.print();
  } catch (err) {
    console.error('Print trigger error:', err);
    window.alert('Print window could not be opened. You can use "Download PDF" to save and print your document.');
  }
}
