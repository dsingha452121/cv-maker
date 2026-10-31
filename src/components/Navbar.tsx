import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  Archive,
  FileImage,
  QrCode,
  ScanLine,
} from 'lucide-react';

interface NavbarProps {
  onGenerate: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onResetClick: () => void;
  onLoadSample: () => void;
  onOpenAiReview: () => void;
  onOpenShareQr?: () => void;
  onOpenQrScanner?: () => void;
  isGeneratingPdf: boolean;
  isValidated: boolean;
  onDownloadImage?: (format: 'png' | 'jpeg') => void;
  onDownloadZip?: () => void;
  isExportingImage?: boolean;
  saveStatus?: 'saved' | 'saving';
  lastSavedAt?: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onGenerate,
  onDownloadPdf,
  onPrint,
  onResetClick,
  onLoadSample,
  onOpenAiReview,
  onOpenShareQr,
  onOpenQrScanner,
  isGeneratingPdf,
  isValidated,
  onDownloadImage,
  onDownloadZip,
  isExportingImage,
  saveStatus = 'saved',
  lastSavedAt,
}) => {
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const lastSavedFormatted = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setImageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Auto-save status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <FileText className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                CV MAKER
              </h1>
              <a
                href="https://ss-telecom.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition print:hidden"
              >
                SS TELECOM
              </a>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Formal Indian standard job application & CV generation suite
            </p>
          </div>

          {/* Visual Auto-Save Indicator (Desktop / Tablet) */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 select-none ${
              saveStatus === 'saving'
                ? 'bg-amber-50 text-amber-800 border-amber-300/80 shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
            }`}
            title={
              saveStatus === 'saving'
                ? 'Saving changes to browser local storage...'
                : `All changes automatically saved to local storage${
                    lastSavedFormatted ? ` • Last saved at ${lastSavedFormatted}` : ''
                  }`
            }
          >
            <span className="relative flex h-2 w-2">
              {saveStatus === 'saving' ? (
                <span className="inline-flex rounded-full h-2 w-2 bg-amber-500 animate-ping" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              )}
            </span>
            <span className="text-[11px] font-semibold tracking-tight">
              {saveStatus === 'saving' ? 'Auto-saving...' : 'Auto-saved'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Auto-Save Indicator */}
          <div
            className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-300 select-none ${
              saveStatus === 'saving'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
            title={saveStatus === 'saving' ? 'Saving...' : 'Auto-saved to device'}
          >
            <span className="relative flex h-1.5 w-1.5">
              {saveStatus === 'saving' ? (
                <span className="inline-flex rounded-full h-1.5 w-1.5 bg-amber-500 animate-ping" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </>
              )}
            </span>
            <span>{saveStatus === 'saving' ? 'Saving' : 'Saved'}</span>
          </div>
          {/* AI Review CV Button (Button 1) */}
          <button
            type="button"
            onClick={onOpenAiReview}
            title="Scan your CV for grammar, clarity, consistency, and professional phrasing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-lg shadow-xs transition hover:scale-102 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Review CV</span>
            <span className="md:hidden">AI Review</span>
          </button>

          {/* Quick Demo Data toggle (Button 2) */}
          <button
            type="button"
            onClick={onLoadSample}
            title="Fill with realistic sample data for quick preview"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition cursor-pointer"
          >
            <span>Sample Data</span>
          </button>

          {/* Reset Button (Button 3) */}
          <button
            type="button"
            onClick={onResetClick}
            title="Clear all fields"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/60 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Print Button (Selector 1: Button 4) */}
          <button
            type="button"
            onClick={onPrint}
            title="Print directly to standard A4 sheet"
            aria-label="Print Document"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-lg shadow-xs hover:shadow transition duration-150 active:scale-95 cursor-pointer select-none ring-1 ring-slate-900/5"
          >
            <Printer className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Print</span>
          </button>

          {/* Download PDF Button (Selector 2: Button 5) */}
          <button
            id="downloadPdf"
            type="button"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            title="Download Bio-Data as crisp A4 PDF document"
            aria-label="Download A4 PDF Document"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-75 disabled:cursor-wait rounded-lg shadow-xs hover:shadow-md transition duration-150 active:scale-95 cursor-pointer select-none ring-2 ring-indigo-500/25"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Share via QR Code Button */}
          {onOpenShareQr && (
            <button
              type="button"
              onClick={onOpenShareQr}
              title="Share CV via unique QR Code"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none shadow-2xs"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Share QR</span>
            </button>
          )}

          {/* Scan QR Code & Download PDF Button */}
          {onOpenQrScanner && (
            <button
              type="button"
              onClick={onOpenQrScanner}
              title="Scan a CV QR code to preview and download PDF"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 active:bg-violet-200 border border-violet-200 rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none shadow-2xs"
            >
              <ScanLine className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          )}

          {/* PRIORITY 4: Download Image Dropdown Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setImageMenuOpen(!imageMenuOpen)}
              disabled={isExportingImage}
              title="Export CV as high-resolution Image (PNG, JPEG, or ZIP)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-300 rounded-lg transition cursor-pointer select-none"
            >
              {isExportingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Download Image</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </>
              )}
            </button>

            {imageMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Image Export Options
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadImage?.('png');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition cursor-pointer"
                >
                  <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div>Download PNG</div>
                    <div className="text-[10px] text-slate-400 font-normal">Crisp vector-sharp 2.5× render</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadImage?.('jpeg');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div>Download JPEG</div>
                    <div className="text-[10px] text-slate-400 font-normal">High-quality 0.95 white background</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setImageMenuOpen(false);
                    onDownloadZip?.();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <div>Download All Pages as ZIP</div>
                    <div className="text-[10px] text-slate-400 font-normal">Individual A4 page images in ZIP</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
