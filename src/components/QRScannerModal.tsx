/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  X,
  ScanLine,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Sparkles,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCvLoaded: (shareId: string, autoDownload?: boolean) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onCvLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'paste'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedResult, setScannedResult] = useState<{
    shareId: string;
    fullUrl: string;
    candidateName?: string;
  } | null>(null);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play pleasant short chime on successful QR scan
  const playSuccessChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // Parse candidate name & verify share ID from URL or text
  const extractShareId = (text: string): string | null => {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();

    // Check if it's a URL
    try {
      const url = new URL(trimmed);
      const cvParam = url.searchParams.get('cv');
      if (cvParam) return cvParam;
    } catch {
      // Not a full URL, check query string or raw id
    }

    const matchParam = trimmed.match(/[?&]cv=([a-zA-Z0-9_-]+)/);
    if (matchParam && matchParam[1]) return matchParam[1];

    if (/^cv_[a-zA-Z0-9]+$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  };

  const handleValidCodeScanned = useCallback(
    async (code: string) => {
      const shareId = extractShareId(code);
      if (!shareId) {
        setCameraError(
          'QR Code detected, but it does not appear to be a valid CV Maker link.'
        );
        return;
      }

      playSuccessChime();
      setCameraError(null);
      setIsFetchingInfo(true);

      // Stop camera stream once detected
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);

      try {
        const res = await fetch(`/api/share-cv/${shareId}`);
        const data = await res.json();
        const candidateName =
          data?.data?.cvData?.personal?.fullName || 'Candidate';

        setScannedResult({
          shareId,
          fullUrl: code,
          candidateName,
        });
      } catch {
        setScannedResult({
          shareId,
          fullUrl: code,
          candidateName: 'Candidate',
        });
      } finally {
        setIsFetchingInfo(false);
      }
    },
    [playSuccessChime]
  );

  // Real-time camera scanning loop with jsQR
  const startCameraStream = useCallback(async () => {
    setCameraError(null);
    setScannedResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      setActiveTab('upload');
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);

        const scanLoop = () => {
          if (
            !videoRef.current ||
            videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA
          ) {
            animFrameRef.current = requestAnimationFrame(scanLoop);
            return;
          }

          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
          }

          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              handleValidCodeScanned(code.data);
              return;
            }
          }

          animFrameRef.current = requestAnimationFrame(scanLoop);
        };

        animFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera permission was denied. Please allow camera access or use the Image Upload option.'
        );
      } else {
        setCameraError(
          'Unable to access camera. Please ensure no other app is using it, or upload a QR image.'
        );
      }
      setActiveTab('upload');
    }
  }, [facingMode, handleValidCodeScanned]);

  // Decode from an image file
  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    setCameraError(null);
    setIsFetchingInfo(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsFetchingInfo(false);
          setCameraError('Failed to process image canvas.');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleValidCodeScanned(code.data);
        } else {
          setIsFetchingInfo(false);
          setCameraError('No valid QR code could be found in this image. Please try another clearer image.');
        }
      };
      img.onerror = () => {
        setIsFetchingInfo(false);
        setCameraError('Failed to load image file.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !scannedResult) {
      startCameraStream();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setIsCameraActive(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isOpen, activeTab, scannedResult, startCameraStream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <ScanLine className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight flex items-center gap-1.5">
                <span>Scan CV QR Code</span>
                <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 text-[10px] rounded-md font-semibold border border-indigo-400/30">
                  Instant PDF
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Scan with camera or upload image to download candidate PDF
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

        {/* Tab Controls (when not showing result) */}
        {!scannedResult && (
          <div className="grid grid-cols-3 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setCameraError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                setCameraError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('paste');
                setCameraError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Paste Code</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex flex-col items-center">
          {/* SUCCESS RESULT SCREEN */}
          {scannedResult ? (
            <div className="w-full space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  QR Code Successfully Scanned
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-2">
                  {scannedResult.candidateName}
                </h4>
                <p className="text-xs text-slate-500">
                  Formal Bio-Data / CV ready for instant A4 PDF download
                </p>
              </div>

              {/* Action Cards */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">CV Document ID:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {scannedResult.shareId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Format:</span>
                  <span className="font-semibold text-indigo-700">Standard Indian A4 Print</span>
                </div>
              </div>

              {/* Direct PDF Download Button */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onCvLoaded(scannedResult.shareId, true);
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-150 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-indigo-500/30"
                >
                  <Download className="w-4 h-4 text-white animate-bounce" />
                  <span>Download Candidate's A4 PDF Now</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onCvLoaded(scannedResult.shareId, false);
                      onClose();
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View CV Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScannedResult(null);
                      setActiveTab('camera');
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Scan Another</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* CAMERA TAB */}
              {activeTab === 'camera' && (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full max-w-xs aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 border-indigo-500/40 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />

                    {/* Laser Scanner Animation Line */}
                    {isCameraActive && (
                      <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-scanner-laser pointer-events-none" />
                    )}

                    {/* Viewfinder Reticle Corners */}
                    <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-white/50 rounded-xl flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-indigo-400 rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-indigo-400 rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-indigo-400 rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-indigo-400 rounded-br-sm" />

                      {!isCameraActive && !cameraError && (
                        <div className="flex flex-col items-center gap-2 text-white/80">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                          <span className="text-[11px] font-semibold">
                            Starting Camera...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Camera Switch Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setFacingMode((prev) =>
                          prev === 'environment' ? 'user' : 'environment'
                        )
                      }
                      title="Switch Front/Back Camera"
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition cursor-pointer border border-white/20"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Point your camera at a CV QR code to scan and download the PDF.
                  </p>
                </div>
              )}

              {/* UPLOAD IMAGE TAB */}
              {activeTab === 'upload' && (
                <div className="w-full flex flex-col items-center">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`w-full max-w-sm aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="p-3 bg-white rounded-2xl shadow-xs text-indigo-600 border border-slate-200 mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Choose QR Code Image or Drag Here
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Supports PNG, JPG, or Screenshots
                    </span>
                  </label>
                </div>
              )}

              {/* PASTE CODE / LINK TAB */}
              {activeTab === 'paste' && (
                <div className="w-full space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Enter Shared CV Link or ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pasteInput}
                        onChange={(e) => setPasteInput(e.target.value)}
                        placeholder="e.g. cv_1a2b3c4d or full https://.../?cv=..."
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (pasteInput.trim()) {
                            handleValidCodeScanned(pasteInput.trim());
                          }
                        }}
                        disabled={!pasteInput.trim() || isFetchingInfo}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {isFetchingInfo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Lookup'
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Paste any CV Maker link shared with you to immediately load and download the PDF.
                  </p>
                </div>
              )}

              {/* Error Alert */}
              {cameraError && (
                <div className="w-full mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{cameraError}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
