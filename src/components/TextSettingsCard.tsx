/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TypographySettings,
  DEFAULT_TYPOGRAPHY,
  TYPOGRAPHY_PRESETS,
  TextWeightOption,
} from '../types/biodata';
import { Type, RotateCcw, Sparkles, Sliders } from 'lucide-react';

interface TextSettingsCardProps {
  typography: TypographySettings;
  onChange: (settings: TypographySettings) => void;
  onReset: () => void;
  actualFontSize?: number;
}

export const TextSettingsCard: React.FC<TextSettingsCardProps> = ({
  typography,
  onChange,
  onReset,
  actualFontSize,
}) => {
  const isAuto = typography.fillMode === 'auto';

  const handleToggleMode = (mode: 'auto' | 'manual') => {
    onChange({
      ...typography,
      fillMode: mode,
    });
  };

  const handleFontSizeChange = (delta: number) => {
    const next = Math.min(22, Math.max(11, Math.round((typography.fontSize + delta) * 2) / 2));
    onChange({
      ...typography,
      fontSize: next,
      fillMode: 'manual', // Adjusting font size switches to manual mode
    });
  };

  const handleSliderFontSize = (val: number) => {
    onChange({
      ...typography,
      fontSize: val,
      fillMode: 'manual',
    });
  };

  const handleWeightChange = (weight: TextWeightOption) => {
    onChange({
      ...typography,
      fontWeight: weight,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = TYPOGRAPHY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    onChange({
      ...typography,
      ...preset.settings,
      fillMode: 'manual', // applying a specific preset sets the manual parameters
    });
  };

  const displayedFontSize = isAuto
    ? (actualFontSize || typography.fontSize).toFixed(2).replace(/\.00$/, '')
    : typography.fontSize.toString();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs no-print space-y-3.5">
      {/* Top Header: Title, Presets, and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <Type className="w-3.5 h-3.5 text-indigo-600" />
          <span>TEXT SIZE & STYLE</span>
        </div>

        {/* Quick Presets & Reset Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Presets:
          </span>
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded transition cursor-pointer"
            >
              {preset.name}
            </button>
          ))}

          <button
            type="button"
            onClick={onReset}
            title="Reset to default text settings"
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded transition ml-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Settings Responsive Grid (2-3 columns on desktop, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* 1. Auto Fill Page vs Manual Mode Toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Page Fitting Mode
            </label>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isAuto ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isAuto ? 'Auto Optimal' : 'Manual Size'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleMode('auto')}
              className={`py-1 text-center font-bold text-xs rounded transition cursor-pointer ${
                isAuto
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auto Fill Page
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('manual')}
              className={`py-1 text-center font-bold text-xs rounded transition cursor-pointer ${
                !isAuto
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {isAuto
              ? 'Automatically picks largest sharp font size (11–22px) so page is filled.'
              : 'Applies your chosen custom font size and spacing.'}
          </p>
        </div>

        {/* 2. Base Font Size (11–22px) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-500" />
              Base Font Size
            </label>
            <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {displayedFontSize}px {isAuto ? '(Auto)' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFontSizeChange(-0.5)}
              className="w-7 h-7 flex items-center justify-center font-bold text-sm bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded border border-slate-200 cursor-pointer"
              title="Decrease font size"
            >
              −
            </button>
            <input
              type="range"
              min="11"
              max="22"
              step="0.25"
              value={isAuto ? actualFontSize || typography.fontSize : typography.fontSize}
              onChange={(e) => handleSliderFontSize(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-600 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleFontSizeChange(0.5)}
              className="w-7 h-7 flex items-center justify-center font-bold text-sm bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded border border-slate-200 cursor-pointer"
              title="Increase font size"
            >
              +
            </button>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>11px (Dense)</span>
            <span>22px (Large)</span>
          </div>
        </div>

        {/* 3. Text Weight (Normal, Medium, Semi-Bold, Bold) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Text Weight</label>
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              {typography.fontWeight}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                { id: 'normal', label: '400', title: 'Normal (400)' },
                { id: 'medium', label: '500', title: 'Medium (500)' },
                { id: 'semibold', label: '600', title: 'Semi-Bold (600)' },
                { id: 'bold', label: '700', title: 'Bold (700)' },
              ] as const
            ).map((w) => {
              const isSelected = typography.fontWeight === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleWeightChange(w.id)}
                  title={w.title}
                  className={`py-1 text-center text-[11px] rounded transition cursor-pointer ${
                    isSelected
                      ? 'bg-white font-bold text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {w.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Adjusts thickness for all field values and body text.
          </p>
        </div>

        {/* 4. Bold Headings Switch */}
        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="font-bold text-slate-700 block">Bold Section Headings</span>
              <span className="text-[10px] text-slate-400 block">
                {typography.headingBold ? 'Weight 700 (High contrast)' : 'Weight 600 (Subtle)'}
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={typography.headingBold}
                onChange={(e) =>
                  onChange({ ...typography, headingBold: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* 5. Line Spacing (1.2–2.0) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Line Spacing</label>
            <span className="font-mono font-bold text-slate-800 text-[11px]">
              {typography.lineHeight.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="1.2"
            max="2.0"
            step="0.05"
            value={typography.lineHeight}
            onChange={(e) =>
              onChange({
                ...typography,
                lineHeight: parseFloat(e.target.value),
              })
            }
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>1.2 (Tight)</span>
            <span>1.5 (Standard)</span>
            <span>2.0 (Spacious)</span>
          </div>
        </div>

        {/* 6. Section Spacing (6–40 px) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Section Spacing</label>
            <span className="font-mono font-bold text-slate-800 text-[11px]">
              {typography.sectionGap}px
            </span>
          </div>

          <input
            type="range"
            min="6"
            max="40"
            step="1"
            value={typography.sectionGap}
            onChange={(e) =>
              onChange({
                ...typography,
                sectionGap: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>6px (Dense)</span>
            <span>16px (Normal)</span>
            <span>40px (Wide)</span>
          </div>
        </div>

        {/* 7. Photo Box Size (0.8–1.8x) */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700">Photo Box Scale</label>
            <span className="font-mono font-bold text-slate-800 text-[11px]">
              {typography.photoScale.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.8"
              max="1.8"
              step="0.1"
              value={typography.photoScale}
              onChange={(e) =>
                onChange({
                  ...typography,
                  photoScale: parseFloat(e.target.value),
                })
              }
              className="flex-1 accent-indigo-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
              Passport Photo Dimensions: ~{Math.round(14 * 8 * typography.photoScale)}×
              {Math.round((14 * 8 * typography.photoScale * 4) / 3)}px
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
