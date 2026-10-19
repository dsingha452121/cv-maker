/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useLayoutEffect } from 'react';
import { TypographySettings, DEFAULT_TYPOGRAPHY, TextWeightOption } from '../types/biodata';

export const FONT_WEIGHT_MAP: Record<TextWeightOption, string> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

interface A4PageProps {
  children: React.ReactNode;
  typography?: TypographySettings;
  deps?: any[];
  onAutoFillChange?: (actualFontSize: number, isOverflown: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Hook to auto-fill CV content on ONE A4 page using dynamic font-size (--base-fs).
 * Never uses CSS transform: scale.
 */
export function useAutoFill(
  printAreaRef: React.RefObject<HTMLDivElement | null>,
  rootRef: React.RefObject<HTMLDivElement | null>,
  typography: TypographySettings = DEFAULT_TYPOGRAPHY,
  deps: any[] = []
) {
  const [actualFontSize, setActualFontSize] = useState<number>(typography.fontSize);
  const [isOverflown, setIsOverflown] = useState<boolean>(false);
  const isFittingRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let debounceTimer: any = null;

    const runFitting = () => {
      const printArea = printAreaRef.current;
      const rootEl = rootRef.current;
      if (!printArea || !rootEl || isFittingRef.current || isCancelled) return;

      isFittingRef.current = true;

      // Ensure base typography variables are applied first
      const fw = FONT_WEIGHT_MAP[typography.fontWeight] || '500';
      const headingFw = typography.headingBold ? '700' : '600';
      const gap = `${typography.sectionGap}px`;
      const lh = typography.lineHeight.toString();
      const photoScale = typography.photoScale.toString();

      printArea.style.setProperty('--gap', gap);
      printArea.style.setProperty('--lh', lh);
      printArea.style.setProperty('--fw', fw);
      printArea.style.setProperty('--heading-fw', headingFw);
      printArea.style.setProperty('--photo-scale', photoScale);

      rootEl.style.setProperty('--gap', gap);
      rootEl.style.setProperty('--lh', lh);
      rootEl.style.setProperty('--fw', fw);
      rootEl.style.setProperty('--heading-fw', headingFw);
      rootEl.style.setProperty('--photo-scale', photoScale);

      let chosenFs = typography.fontSize;
      let overflown = false;

      const targetHeight = rootEl.clientHeight || 1123;
      const targetWidth = rootEl.clientWidth || 794;

      if (typography.fillMode === 'auto') {
        // Binary search largest --base-fs between 11 and 22 in steps of 0.25 (~9 iterations)
        let low = 11.0;
        let high = 22.0;
        const step = 0.25;
        let bestFit: number | null = null;

        for (let i = 0; i < 10; i++) {
          if (low > high) break;
          // Round mid to step of 0.25
          const stepsCount = Math.round((high - low) / step);
          const mid = Math.round((low + stepsCount * 0.5 * step) * 100) / 100;

          rootEl.style.setProperty('--base-fs', `${mid}px`);

          // Allow 1.5px tolerance for subpixel font antialiasing
          const fits =
            rootEl.scrollHeight <= targetHeight + 1.5 &&
            rootEl.scrollWidth <= targetWidth + 1.5;

          if (fits) {
            bestFit = mid;
            low = Math.round((mid + step) * 100) / 100;
          } else {
            high = Math.round((mid - step) * 100) / 100;
          }
        }

        // If it still overflows at 11px, try downwards to minimum of 9px
        if (bestFit === null) {
          overflown = true;
          for (let fs = 10.75; fs >= 9.0; fs -= 0.25) {
            const currentFs = Math.round(fs * 100) / 100;
            rootEl.style.setProperty('--base-fs', `${currentFs}px`);
            if (
              rootEl.scrollHeight <= targetHeight + 1.5 &&
              rootEl.scrollWidth <= targetWidth + 1.5
            ) {
              bestFit = currentFs;
              break;
            }
          }
          chosenFs = bestFit !== null ? bestFit : 9.0;
        } else {
          chosenFs = bestFit;
          overflown = false;
        }
      } else {
        // Manual fill mode: use exact user's fontSize
        chosenFs = typography.fontSize;
        rootEl.style.setProperty('--base-fs', `${chosenFs}px`);
        overflown =
          rootEl.scrollHeight > targetHeight + 2 ||
          rootEl.scrollWidth > targetWidth + 2;
      }

      // Apply final calculated values directly as inline CSS variables on #biodata-print-area
      // so any clone for export or print inherits the exact identical styling
      printArea.style.setProperty('--base-fs', `${chosenFs}px`);
      rootEl.style.setProperty('--base-fs', `${chosenFs}px`);

      setActualFontSize(chosenFs);
      setIsOverflown(overflown);

      // Release fitting lock
      setTimeout(() => {
        isFittingRef.current = false;
      }, 50);
    };

    const scheduleFitting = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Wait for web fonts before executing font calculations
        if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
          (document as any).fonts.ready
            .then(() => {
              requestAnimationFrame(runFitting);
            })
            .catch(() => {
              requestAnimationFrame(runFitting);
            });
        } else {
          requestAnimationFrame(runFitting);
        }
      }, 60);
    };

    scheduleFitting();

    if (rootRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (!isFittingRef.current) {
          scheduleFitting();
        }
      });
      resizeObserver.observe(rootRef.current);
    }

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [
    typography.fillMode,
    typography.fontSize,
    typography.fontWeight,
    typography.headingBold,
    typography.lineHeight,
    typography.sectionGap,
    typography.photoScale,
    ...deps,
  ]);

  return { actualFontSize, isOverflown };
}

/**
 * Single A4 Page component shared across preview, PDF, image, and print.
 * Dimensions: exactly 794px x 1123px (standard A4 portrait at 96 DPI).
 * NO transform, NO scale on #biodata-print-area or its children.
 */
export const A4Page: React.FC<A4PageProps> = ({
  children,
  typography = DEFAULT_TYPOGRAPHY,
  deps = [],
  onAutoFillChange,
  className = '',
  style = {},
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { actualFontSize, isOverflown } = useAutoFill(
    printAreaRef,
    rootRef,
    typography,
    deps
  );

  useLayoutEffect(() => {
    onAutoFillChange?.(actualFontSize, isOverflown);
  }, [actualFontSize, isOverflown, onAutoFillChange]);

  const fw = FONT_WEIGHT_MAP[typography.fontWeight] || '500';
  const headingFw = typography.headingBold ? '700' : '600';

  return (
    <div
      id="biodata-print-area"
      ref={printAreaRef}
      className={`bg-white relative shadow-2xl overflow-hidden box-border print:shadow-none print:m-0 ${className}`}
      style={{
        width: '794px',
        height: '1123px',
        maxWidth: '794px',
        maxHeight: '1123px',
        minWidth: '794px',
        minHeight: '1123px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
        // Inline CSS variables on #biodata-print-area for identical cloning and printing
        ['--base-fs' as any]: `${actualFontSize}px`,
        ['--lh' as any]: typography.lineHeight.toString(),
        ['--fw' as any]: fw,
        ['--heading-fw' as any]: headingFw,
        ['--gap' as any]: `${typography.sectionGap}px`,
        ['--photo-scale' as any]: typography.photoScale.toString(),
        ...style,
      }}
    >
      {/* Content Root .bio-root */}
      <div
        ref={rootRef}
        id="biodata-document-sheet"
        className="bio-root"
        style={{
          position: 'absolute',
          inset: 0,
          padding: '40px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          fontSize: 'var(--base-fs, 14px)',
          lineHeight: 'var(--lh, 1.5)',
          fontWeight: 'var(--fw, 500)',
          color: '#111111',
          fontFamily:
            "'Noto Sans Bengali', 'Noto Sans Devanagari', Arial, Helvetica, sans-serif",
          letterSpacing: 'normal',
          fontStretch: 'normal',
          wordBreak: 'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {children}
      </div>
    </div>
  );
};
