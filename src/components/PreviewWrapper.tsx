/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BioDataState,
  CVColors,
  CVColorThemeId,
  CVFormatId,
  COLOR_THEME_PRESETS,
  TypographySettings,
  DEFAULT_TYPOGRAPHY,
} from '../types/biodata';
import { BioDataPreview } from './BioDataPreview';
import { ThemeFormatSelector } from './ThemeFormatSelector';
import { TextSettingsCard } from './TextSettingsCard';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Printer,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Archive,
  FileImage,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

interface PreviewWrapperProps {
  data: BioDataState;
  colors?: CVColors;
  selectedTheme: CVColorThemeId;
  onSelectTheme: (theme: CVColorThemeId) => void;
  selectedFormat: CVFormatId;
  onSelectFormat: (format: CVFormatId) => void;
  typography: TypographySettings;
  onChangeTypography: (settings: TypographySettings) => void;
  onResetTypography: () => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onOpenShareQr?: () => void;
  isGeneratingPdf: boolean;
  onOpenColorCustomizer?: () => void;
  onDownloadImage?: (format: 'png' | 'jpeg') => void;
  onDownloadZip?: () => void;
  isExportingImage?: boolean;
}

export const PreviewWrapper: React.FC<PreviewWrapperProps> = ({
  data,
  colors: explicitColors,
  selectedTheme,
  onSelectTheme,
  selectedFormat,
  onSelectFormat,
  typography = DEFAULT_TYPOGRAPHY,
  onChangeTypography,
  onResetTypography,
  onPrint,
  onDownloadPdf,
  onOpenShareQr,
  isGeneratingPdf,
  onOpenColorCustomizer,
  onDownloadImage,
  onDownloadZip,
  isExportingImage,
}) => {
  const colors =
    explicitColors ||
    COLOR_THEME_PRESETS[selectedTheme]?.colors ||
    COLOR_THEME_PRESETS['classic-black'].colors;

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [autoScale, setAutoScale] = useState<number>(1);
  const [contentOverflown, setContentOverflown] = useState<boolean>(false);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const previewImageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        previewImageMenuRef.current &&
        !previewImageMenuRef.current.contains(event.target as Node)
      ) {
        setImageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute responsive fit scale for 794px A4 sheet width inside the preview pane
  useEffect(() => {
    const computeScale = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const targetWidth = 794; // A4 portrait standard at 96 DPI
      if (containerWidth > 0 && containerWidth < targetWidth) {
        setAutoScale(containerWidth / targetWidth);
      } else {
        setAutoScale(1);
      }
    };

    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  const effectiveScale = (zoomLevel / 100) * autoScale;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* 1. CV COLOR PRESETS & CV LAYOUT FORMAT (6 A4 FORMATS) */}
      <ThemeFormatSelector
        selectedFormat={selectedFormat}
        onSelectFormat={onSelectFormat}
        selectedTheme={selectedTheme}
        onSelectTheme={onSelectTheme}
        onOpenColorCustomizer={onOpenColorCustomizer}
      />

      {/* 2. TEXT SIZE & STYLE CARD (Placed exactly between Layout formats and Zoom toolbar as requested) */}
      <TextSettingsCard
        typography={typography}
        onChange={onChangeTypography}
        onReset={onResetTypography}
      />

      {/* 3. Export & Zoom Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs no-print">
        <span className="text-xs font-bold text-slate-700 tracking-wide">
          A4 Document Preview
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom out"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-semibold text-slate-700 px-1.5 select-none min-w-[38px] text-center">
              {Math.round(effectiveScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom in"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Fit standard zoom (100%)"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition ml-0.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print button */}
          <button
            type="button"
            onClick={onPrint}
            title="Print Preview A4"
            className="p-1.5 text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Download PDF"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition shadow-xs active:scale-95 cursor-pointer"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span className="text-[11px]">PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px]">PDF</span>
              </>
            )}
          </button>

          {/* Share QR Code button */}
          {onOpenShareQr && (
            <button
              type="button"
              onClick={onOpenShareQr}
              title="Share CV via QR Code"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Share QR</span>
            </button>
          )}

          {/* Download Image dropdown */}
          <div className="relative" ref={previewImageMenuRef}>
            <button
              type="button"
              onClick={() => setImageMenuOpen(!imageMenuOpen)}
              disabled={isExportingImage}
              title="Download Image"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition active:scale-95 cursor-pointer"
            >
              {isExportingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </>
              )}
            </button>

            {imageMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadImage?.('png');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileImage className="w-3.5 h-3.5 text-indigo-600" /> Download PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadImage?.('jpeg');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Download JPEG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadZip?.();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 pt-1"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-600" /> Download ZIP (All Pages)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Sheet Viewport Container */}
      <div
        ref={containerRef}
        id="biodata-preview-wrapper"
        className="flex-1 overflow-x-auto overflow-y-auto bg-slate-200/80 p-2 sm:p-5 rounded-2xl border border-slate-300 flex flex-col justify-start items-center min-h-[550px] space-y-3"
      >
        <div
          className="preview-zoom-sizer relative transition-all duration-100 ease-out shrink-0"
          style={{
            width: `${Math.round(794 * effectiveScale)}px`,
            height: `${Math.round(1123 * effectiveScale)}px`,
            minWidth: `${Math.round(794 * effectiveScale)}px`,
            minHeight: `${Math.round(1123 * effectiveScale)}px`,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '794px',
              height: '1123px',
              transform: `scale(${effectiveScale})`,
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <BioDataPreview
              data={data}
              colors={colors}
              themeId={selectedTheme}
              formatId={selectedFormat}
              showPhotoPlaceholder={true}
              typography={typography}
              onScaleChange={(_scale, overflown) => setContentOverflown(overflown)}
            />
          </div>
        </div>

        {/* Warning if content exceeds one A4 page */}
        {contentOverflown && (
          <div className="max-w-[794px] w-full flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Content is too long for one page. Please shorten some fields.</span>
          </div>
        )}
      </div>
    </div>
  );
};
