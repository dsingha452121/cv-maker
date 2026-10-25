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
} from 'lucide-react';

interface ShareQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BioDataState;
  colors?: CVColors;
  themeId: CVColorThemeId;
  formatId: CVFormatId;
  typography?: TypographySettings;
}

export const ShareQRCodeModal: React.FC<ShareQRCodeModalProps> = ({
  isOpen,
  onClose,
  data,
  colors,
  themeId,
  formatId,
  typography,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [maskSensitive, setMaskSensitive] = useState<boolean>(true);

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
          }
        } catch (fetchErr) {
          console.warn('Backend share API unavailable, using local share token:', fetchErr);
        }

        // Build full public URL
        const origin = window.location.origin;
        let finalUrl = '';
        if (shareId) {
          finalUrl = `${origin}/?cv=${shareId}`;
        } else {
          // Fallback: local base64 token if backend is unreachable
          const minimal = {
            n: shareData.personal.fullName,
            t: shareData.documentTitle,
            fmt: formatId,
            thm: themeId,
          };
          const token = btoa(encodeURIComponent(JSON.stringify(minimal)));
          finalUrl = `${origin}/?preview=${token}`;
        }

        if (!isMounted) return;
        setShareUrl(finalUrl);

        // 2. Generate crisp QR Code Image
        const qrUrl = await QRCode.toDataURL(finalUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1e1b4b', // deep indigo
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
  }, [isOpen, data, colors, themeId, formatId, typography, maskSensitive]);

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

  if (!isOpen) return null;

  const candidateName = data.personal.fullName || 'Your CV';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <QrCode className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                Share CV via QR Code
              </h3>
              <p className="text-[11px] text-slate-300">
                Online Instant Access for Employers & Recruiters
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
                Live Document
              </span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {candidateName}
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              {formatId} A4
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-3 bg-white rounded-2xl border-2 border-indigo-100 shadow-md flex items-center justify-center">
            {isLoading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-600">
                  Generating Unique QR Code...
                </span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative group">
                <img
                  src={qrDataUrl}
                  alt="CV QR Code"
                  className="w-56 h-56 rounded-lg object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 py-1 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 rounded-b-lg border-t border-slate-100 flex items-center justify-center gap-1">
                  <Smartphone className="w-3 h-3 text-indigo-600" />
                  <span>Scan with Phone Camera</span>
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
            <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
              Shareable Direct Link
            </label>
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
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
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
                  Aadhaar numbers remain masked for candidate security.
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

          {/* Action Buttons: Download QR & Open Link */}
          <div className="w-full grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl || isLoading}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download QR</span>
            </button>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Open Online CV</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
