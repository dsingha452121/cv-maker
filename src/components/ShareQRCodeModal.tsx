/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  BioDataState,
  CVColors,
  CVColorThemeId,
  CVFormatId,
  TypographySettings,
} from '../types/biodata';
import {
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  X,
  Share2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Eye,
  ScanLine,
  Printer,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface ShareQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BioDataState;
  colors?: CVColors;
  themeId: CVColorThemeId;
  formatId: CVFormatId;
  typography?: TypographySettings;
  onOpenScanner?: () => void;
}

export const ShareQRCodeModal: React.FC<ShareQRCodeModalProps> = ({
  isOpen,
  onClose,
  data,
  colors,
  themeId,
  formatId,
  typography,
  onOpenScanner,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [maskSensitive, setMaskSensitive] = useState<boolean>(true);
  const [scanAction, setScanAction] = useState<'download' | 'view'>('download');
  const [currentShareId, setCurrentShareId] = useState<string>('');
  const [detectedBackendUrl, setDetectedBackendUrl] = useState<string>('');

  // Fallback production URL if user is running on localhost and needs to scan with smartphone
  const fallbackPublicUrl =
    'https://ais-pre-u2ymmuee2fdfyb5taobzpp-258240374496.asia-southeast1.run.app';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setCopied(false);

    const generateShareLinkAndQr = async () => {
      try {
        // Clone data with sensitivity settings
        const shareData: BioDataState = JSON.parse(JSON.stringify(data));
        if (maskSensitive) {
          if (shareData.personal) {
            shareData.personal.maskAadhaarInCv = true;
          }
        }

        // 1. Post to backend to generate unique share ID
        let shareId = '';
        let serverBaseUrl = '';
        try {
          const res = await fetch('/api/share-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cvData: shareData,
              colors,
              themeId,
              formatId,
              typography,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.shareId) {
              shareId = json.shareId;
            }
            if (json.baseUrl) {
              serverBaseUrl = json.baseUrl;
            }
          }
        } catch (fetchErr) {
          console.warn('Backend share API unavailable, using local share token:', fetchErr);
        }

        if (!isMounted) return;
        setCurrentShareId(shareId);
        setDetectedBackendUrl(serverBaseUrl);

        // Build full public URL
        let origin = window.location.origin;

        // If local dev environment is detected, prefer public server URL so phone cameras can reach it
        if (
          (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1') &&
          serverBaseUrl &&
          !serverBaseUrl.includes('localhost')
        ) {
          origin = serverBaseUrl;
        } else if (
          (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1') &&
          fallbackPublicUrl
        ) {
          origin = fallbackPublicUrl;
        }

        let finalUrl = '';
        if (shareId) {
          finalUrl = `${origin}/?cv=${shareId}&action=${scanAction}`;
        } else {
          // Fallback: local base64 token if backend is unreachable
          const minimal = {
            n: shareData.personal.fullName,
            t: shareData.documentTitle,
            fmt: formatId,
            thm: themeId,
          };
          const token = btoa(encodeURIComponent(JSON.stringify(minimal)));
          finalUrl = `${origin}/?preview=${token}&action=${scanAction}`;
        }

        setShareUrl(finalUrl);

        // 2. Generate crisp QR Code Image
        const qrUrl = await QRCode.toDataURL(finalUrl, {
          width: 360,
          margin: 2,
          color: {
            dark: '#1e1b4b', // deep rich indigo
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });

        if (isMounted) {
          setQrDataUrl(qrUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    generateShareLinkAndQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, data, colors, themeId, formatId, typography, maskSensitive, scanAction]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const cleanName = (data.personal.fullName || 'Candidate')
      .replace(/\s+/g, '_')
      .toUpperCase();
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Code_CV_${cleanName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQrBadge = () => {
    if (!qrDataUrl) return;
    const printWin = window.open('', '_blank', 'width=600,height=700');
    if (!printWin) return;
    const name = data.personal.fullName || 'Candidate';
    const title = data.documentTitle || 'BIO-DATA';

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CV QR Code Card - ${name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #1e1b4b;
            }
            .card {
              max-width: 380px;
              margin: 0 auto;
              border: 2px solid #e2e8f0;
              border-radius: 16px;
              padding: 28px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            }
            h2 { margin: 0 0 6px 0; font-size: 20px; }
            p { margin: 4px 0 16px 0; font-size: 13px; color: #64748b; }
            img { width: 240px; height: 240px; margin: 12px auto; display: block; }
            .instructions {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 10px;
              font-size: 12px;
              color: #334155;
              font-weight: bold;
              margin-top: 14px;
            }
            .brand {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 18px;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${name}</h2>
            <p>${title} • Standard Indian Format</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="instructions">
              📱 Scan with Phone Camera to Download A4 PDF
            </div>
            <div class="brand">SS TELECOM • CV MAKER</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  if (!isOpen) return null;

  const candidateName = data.personal.fullName || 'Your CV';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <QrCode className="w-5 h-5 text-indigo-200 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                <span>Share CV via QR Code</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-md font-bold border border-emerald-400/30">
                  Instant PDF
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Scan with smartphone camera to instantly download or view CV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* Candidate Info Badge */}
          <div className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-2">
            <div className="text-left truncate">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Candidate Document
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {candidateName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                {formatId} A4
              </span>
            </div>
          </div>

          {/* Scan Action Mode Selector: Direct Download vs Online View */}
          <div className="w-full text-left space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
              When Scanned By Phone / Scanner:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setScanAction('download')}
                className={`py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  scanAction === 'download'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setScanAction('view')}
                className={`py-2 px-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  scanAction === 'view'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Online</span>
              </button>
            </div>
          </div>

          {/* QR Code Container with High-Contrast Border */}
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-md flex items-center justify-center group">
            {isLoading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-600">
                  Generating High-Resolution QR...
                </span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="CV QR Code"
                  className="w-56 h-56 rounded-lg object-contain"
                />
                <div className="mt-2 py-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-extrabold rounded-full flex items-center gap-1.5 shadow-2xs">
                  <Smartphone className="w-3 h-3 text-indigo-600 animate-bounce" />
                  <span>
                    {scanAction === 'download'
                      ? 'Scan to Download A4 PDF'
                      : 'Scan to View Online CV'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-rose-500 font-medium">
                Failed to generate QR Code.
              </div>
            )}
          </div>

          {/* Shareable Link Input & Copy Button */}
          <div className="w-full space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Direct CV Link
              </label>
              {currentShareId && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {currentShareId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-700 font-mono outline-none truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="w-full flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 block text-[11px]">
                  Privacy Protected
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Aadhaar numbers masked for candidate security.
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={maskSensitive}
                onChange={(e) => setMaskSensitive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Row 1: Download QR, Print Badge, and Open Link */}
          <div className="w-full grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl || isLoading}
              className="inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              onClick={handlePrintQrBadge}
              disabled={!qrDataUrl || isLoading}
              className="inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Card</span>
            </button>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Link</span>
            </a>
          </div>

          {/* QR Scanner Launch Row */}
          {onOpenScanner && (
            <div className="w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="w-full py-2 px-3 text-xs font-bold text-indigo-900 bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100 hover:from-indigo-200 hover:to-indigo-200 border border-indigo-300 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <ScanLine className="w-4 h-4 text-indigo-700" />
                <span>Want to test or scan a QR code? Open Scanner Tool →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
