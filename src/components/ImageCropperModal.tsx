/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  X,
  RotateCcw,
  Move,
  Sparkles,
} from 'lucide-react';

export type CropAspectRatio = '3:4' | '1:1' | '3:1' | 'free';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
  initialAspectRatio?: CropAspectRatio;
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
  initialAspectRatio = '3:4',
  title = 'Crop & Adjust Portrait Photo',
}) => {
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setAspectRatio(initialAspectRatio);
    }
  }, [isOpen, initialAspectRatio, imageSrc]);

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Compute crop box dimensions based on chosen aspect ratio
  const getCropBoxSize = useCallback(() => {
    const maxWidth = 320;
    const maxHeight = 360;

    switch (aspectRatio) {
      case '3:4': // Portrait standard
        return { width: 240, height: 320 };
      case '1:1':
        return { width: 280, height: 280 };
      case '3:1': // Signature standard
        return { width: 300, height: 100 };
      case 'free':
      default:
        return { width: 280, height: 280 };
    }
  }, [aspectRatio]);

  const cropBox = getCropBoxSize();

  const handleApply = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;

    // Create high-resolution output canvas
    const canvas = document.createElement('canvas');
    canvas.width = cropBox.width * 2; // 2x for sharp retina output
    canvas.height = cropBox.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Center of canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * 2, zoom * 2);

    // Apply pan offset (taking rotation into account)
    let offsetX = pan.x;
    let offsetY = pan.y;
    if (rotation === 90) {
      offsetX = pan.y;
      offsetY = -pan.x;
    } else if (rotation === 180) {
      offsetX = -pan.x;
      offsetY = -pan.y;
    } else if (rotation === 270) {
      offsetX = -pan.y;
      offsetY = pan.x;
    }

    ctx.drawImage(
      img,
      -img.naturalWidth / 2 + offsetX / zoom,
      -img.naturalHeight / 2 + offsetY / zoom,
      img.naturalWidth,
      img.naturalHeight
    );

    const croppedResult = canvas.toDataURL('image/jpeg', 0.95);
    onApplyCrop(croppedResult);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="text-[11px] text-slate-500">
                Adjust position, scale, and aspect ratio for optimal CV layout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector Pills */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-600 text-[11px] uppercase tracking-wider">
            Aspect Ratio:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAspectRatio('3:4')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                aspectRatio === '3:4'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              3:4 Portrait (Passport)
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('1:1')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                aspectRatio === '1:1'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              1:1 Square
            </button>
            <button
              type="button"
              onClick={() => setAspectRatio('3:1')}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition ${
                aspectRatio === '3:1'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              3:1 Signature
            </button>
          </div>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative bg-slate-900 overflow-hidden flex items-center justify-center cursor-move select-none h-[340px]"
        >
          {/* Underlying Image being positioned */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source to crop"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              maxWidth: 'none',
              maxHeight: 'none',
            }}
            className="pointer-events-none"
          />

          {/* Dimmed backdrop overlay */}
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />

          {/* Clear cutout crop box */}
          <div
            style={{
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
            }}
            className="absolute border-2 border-indigo-400 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none rounded-sm"
          >
            {/* Grid overlay for rule of thirds */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-r border-b border-white/30" />
              <div className="border-b border-white/30" />
              <div className="border-r border-white/30" />
              <div className="border-r border-white/30" />
              <div />
            </div>

            <div className="absolute top-2 left-2 bg-indigo-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-medium">
              {aspectRatio === '3:4' ? 'Passport 3:4' : aspectRatio}
            </div>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 pointer-events-none">
            <Move className="w-3 h-3 text-indigo-300" />
            <span>Drag image to position inside box</span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
          {/* Zoom Slider & Rotate */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <ZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-slate-400" />
              <span className="font-mono text-[11px] text-slate-600 min-w-[36px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90 degrees"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset zoom and position"
                className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              <span>Apply to CV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
