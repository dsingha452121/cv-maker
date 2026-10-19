import React, { useRef, useState, useEffect } from 'react';
import {
  SignatureInfo,
  SignatureInkColor,
  SignatureSettings,
} from '../types/biodata';
import { processSignatureImage } from '../utils/signatureProcessor';
import {
  PenTool,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  CheckCircle2,
  Eye,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface SignatureUploadSectionProps {
  signature?: SignatureInfo;
  onChange: (updated: SignatureInfo) => void;
}

const DEFAULT_SETTINGS: SignatureSettings = {
  threshold: 45,
  darkness: 1.4,
  smoothness: 1,
  inkColor: 'black',
};

export const SignatureUploadSection: React.FC<SignatureUploadSectionProps> = ({
  signature,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewTab, setPreviewTab] = useState<'processed' | 'original'>('processed');
  const [showAdjustments, setShowAdjustments] = useState(false);

  const currentSignature: SignatureInfo = signature || {
    rawImageUrl: null,
    processedImageUrl: null,
    fileName: '',
    isEnabled: true,
    settings: DEFAULT_SETTINGS,
  };

  const { rawImageUrl, processedImageUrl, fileName, isEnabled, settings } =
    currentSignature;

  // Re-process when settings change and rawImageUrl is present
  const applyProcessing = async (
    raw: string,
    newSettings: SignatureSettings
  ) => {
    setIsProcessing(true);
    try {
      const processed = await processSignatureImage(raw, newSettings);
      onChange({
        ...currentSignature,
        rawImageUrl: raw,
        processedImageUrl: processed,
        settings: newSettings,
      });
    } catch (err) {
      console.error('Failed to process signature:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      alert('Please upload a valid image file (JPG, JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('File size exceeds 8MB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      setIsProcessing(true);
      try {
        const processed = await processSignatureImage(raw, settings);
        onChange({
          rawImageUrl: raw,
          processedImageUrl: processed,
          fileName: file.name,
          isEnabled: true,
          settings,
        });
      } catch (err) {
        console.error('Error processing signature:', err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange({
      rawImageUrl: null,
      processedImageUrl: null,
      fileName: '',
      isEnabled: true,
      settings: DEFAULT_SETTINGS,
    });
  };

  const updateSetting = (key: keyof SignatureSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    if (rawImageUrl) {
      applyProcessing(rawImageUrl, updated);
    } else {
      onChange({
        ...currentSignature,
        settings: updated,
      });
    }
  };

  const toggleEnabled = (checked: boolean) => {
    onChange({
      ...currentSignature,
      isEnabled: checked,
    });
  };

  const resetSettings = () => {
    if (rawImageUrl) {
      applyProcessing(rawImageUrl, DEFAULT_SETTINGS);
    } else {
      onChange({
        ...currentSignature,
        settings: DEFAULT_SETTINGS,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                6. Digital Signature Upload
              </h2>
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload a photo of your signature. Paper background is automatically removed to make it clean & transparent.
            </p>
          </div>
        </div>

        {/* Global Signature Toggle */}
        {processedImageUrl && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Include Signature on CV</span>
          </label>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {!rawImageUrl ? (
        /* Empty Upload Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/20 rounded-xl p-6 text-center transition group"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            Click to Upload Handwritten Signature
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
            Sign with a black or blue pen on white paper, snap a photo with your phone or scan it, and upload here (PNG, JPG, WebP).
          </p>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition">
            <Upload className="w-3.5 h-3.5" /> Select Signature Image
          </span>
        </div>
      ) : (
        /* Uploaded & Processed View */
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Signature Preview Canvas Box */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Preview
                </span>

                {/* Before / After toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('processed')}
                    className={`px-2 py-0.5 rounded transition ${
                      previewTab === 'processed'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Transparent
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('original')}
                    className={`px-2 py-0.5 rounded transition ${
                      previewTab === 'original'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Original
                  </button>
                </div>
              </div>

              {/* Checkerboard container for transparent PNG */}
              <div
                className="w-full h-32 rounded-xl border border-slate-300 flex items-center justify-center p-3 relative overflow-hidden shadow-inner"
                style={{
                  backgroundImage:
                    previewTab === 'processed'
                      ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
                      : 'none',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: previewTab === 'processed' ? '#ffffff' : '#ffffff',
                }}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-1.5 text-xs text-indigo-600 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Removing paper background...</span>
                  </div>
                ) : previewTab === 'processed' ? (
                  processedImageUrl ? (
                    <img
                      src={processedImageUrl}
                      alt="Transparent Signature"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Processing...</span>
                  )
                ) : (
                  <img
                    src={rawImageUrl}
                    alt="Original Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <p className="text-[11px] text-slate-500 mt-1.5 text-center truncate">
                {fileName || 'Signature'}
              </p>
            </div>

            {/* Quick Actions & Ink Selection */}
            <div className="flex-1 space-y-4">
              {/* Ink Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Signature Ink Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'black', label: 'Black Ink', color: '#0a0a0f' },
                    { id: 'blue', label: 'Blue Ink', color: '#153c8a' },
                    { id: 'original', label: 'Original Ink', color: '#475569' },
                  ].map((ink) => {
                    const isSelected = settings.inkColor === ink.id;
                    return (
                      <button
                        key={ink.id}
                        type="button"
                        onClick={() =>
                          updateSetting('inkColor', ink.id as SignatureInkColor)
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: ink.color }}
                        />
                        <span>{ink.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Note */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    {isEnabled
                      ? 'Transparent signature active on CV.'
                      : 'Signature is currently disabled on CV.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAdjustments(!showAdjustments)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline underline-offset-2"
                >
                  <Sliders className="w-3 h-3" />
                  {showAdjustments ? 'Hide Sliders' : 'Fine-Tune Sliders'}
                </button>
              </div>

              {/* Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  <RefreshCw className="w-3 h-3" /> Replace Signature
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          </div>

          {/* Fine Tuning Controls (Collapsible or Shown) */}
          {showAdjustments && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Fine-Tune Background Removal & Darkness
                </span>
                <button
                  type="button"
                  onClick={resetSettings}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Sliders
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Background Removal Threshold */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Removal Strength</span>
                    <span className="font-bold text-indigo-600">
                      {settings.threshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="85"
                    step="1"
                    value={settings.threshold}
                    onChange={(e) =>
                      updateSetting('threshold', parseInt(e.target.value, 10))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Increase if paper background is grey or shadowed
                  </p>
                </div>

                {/* Signature Darkness / Contrast */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Signature Darkness</span>
                    <span className="font-bold text-indigo-600">
                      {settings.darkness}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={settings.darkness}
                    onChange={(e) =>
                      updateSetting('darkness', parseFloat(e.target.value))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Makes thin ink strokes darker & bolder
                  </p>
                </div>

                {/* Smooth Edges */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Smooth Edges</span>
                    <span className="font-bold text-indigo-600">
                      Level {settings.smoothness}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={settings.smoothness}
                    onChange={(e) =>
                      updateSetting('smoothness', parseInt(e.target.value, 10))
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Softens jagged edges on handwriting lines
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Advice Tip */}
          <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-200">
            <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Private & Secure:</strong> All image processing and background removal is performed 100% locally in your browser canvas. No signature images are ever sent to external servers.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
