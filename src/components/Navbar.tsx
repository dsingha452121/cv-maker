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
} from 'lucide-react';

interface NavbarProps {
  onGenerate: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onResetClick: () => void;
  onLoadSample: () => void;
  onOpenAiReview: () => void;
  isGeneratingPdf: boolean;
  isValidated: boolean;
  onDownloadImage?: (format: 'png' | 'jpeg') => void;
  onDownloadZip?: () => void;
  isExportingImage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onGenerate,
  onDownloadPdf,
  onPrint,
  onResetClick,
  onLoadSample,
  onOpenAiReview,
  isGeneratingPdf,
  isValidated,
  onDownloadImage,
  onDownloadZip,
  isExportingImage,
}) => {
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-sm">
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
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
