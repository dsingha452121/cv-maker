import React, { useState, useEffect } from 'react';
import {
  COLOR_THEME_PRESETS,
  CVColors,
  CVColorThemeId,
  CustomPalette,
} from '../types/biodata';
import {
  Palette,
  RotateCcw,
  BookmarkPlus,
  Trash2,
  Check,
  Pipette,
  Sparkles,
} from 'lucide-react';

interface ColorCustomizerProps {
  colors: CVColors;
  onChange: (updatedColors: CVColors) => void;
  activePresetId?: CVColorThemeId;
  onSelectPreset: (presetId: CVColorThemeId) => void;
}

const CUSTOM_PALETTES_STORAGE_KEY = 'ss_telecom_custom_palettes_v1';

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  colors,
  onChange,
  activePresetId,
  onSelectPreset,
}) => {
  const [customPalettes, setCustomPalettes] = useState<CustomPalette[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PALETTES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load custom palettes:', e);
    }
    return [];
  });

  const [isSavingPalette, setIsSavingPalette] = useState(false);
  const [paletteName, setPaletteName] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_PALETTES_STORAGE_KEY,
        JSON.stringify(customPalettes)
      );
    } catch (e) {
      console.warn('Failed to save custom palettes:', e);
    }
  }, [customPalettes]);

  const handleColorChange = (key: keyof CVColors, val: string) => {
    onChange({
      ...colors,
      [key]: val,
    });
  };

  const handleResetToDefault = () => {
    onSelectPreset('classic-black');
    onChange(COLOR_THEME_PRESETS['classic-black'].colors);
  };

  const handleSavePalette = () => {
    const name = paletteName.trim() || `Palette #${customPalettes.length + 1}`;
    const newPal: CustomPalette = {
      id: `pal-${Date.now()}`,
      name,
      colors: { ...colors },
    };
    setCustomPalettes((prev) => [...prev, newPal]);
    setPaletteName('');
    setIsSavingPalette(false);
  };

  const handleDeleteCustomPalette = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this saved custom palette?')) {
      setCustomPalettes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const colorFields: {
    key: keyof CVColors;
    label: string;
    description: string;
  }[] = [
    {
      key: 'mainHeadingColor',
      label: 'Main Heading (BIO-DATA)',
      description: 'Document title text color',
    },
    {
      key: 'sectionHeadingColor',
      label: 'Section Headings',
      description: 'Education, Technical, Declaration titles',
    },
    {
      key: 'bodyTextColor',
      label: 'Body Text Color',
      description: 'Personal details, table cells, declaration body',
    },
    {
      key: 'accentColor',
      label: 'Accent Color',
      description: 'Highlight bars, badge lines, dividers',
    },
    {
      key: 'outerBorderColor',
      label: 'Outer Page Border',
      description: 'Rectangular border around A4 page',
    },
    {
      key: 'tableBorderColor',
      label: 'Table Border Color',
      description: 'Grid borders in education & technical tables',
    },
    {
      key: 'tableHeaderBgColor',
      label: 'Table Header Background',
      description: 'Fill color for table column titles',
    },
    {
      key: 'tableHeaderTextColor',
      label: 'Table Header Text',
      description: 'Text color inside table header cells',
    },
    {
      key: 'backgroundColor',
      label: 'Page Background Color',
      description: 'Standard is white (#ffffff) for formal printing',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Customize Colors & Themes
            </h2>
            <p className="text-xs text-slate-500">
              Select an SS TELECOM formal palette or customize individual element colors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Default
          </button>
        </div>
      </div>

      {/* Ready-Made Palettes */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Ready-Made Formal Palettes
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(COLOR_THEME_PRESETS).map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectPreset(preset.id);
                  onChange(preset.colors);
                }}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1 mb-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs"
                    style={{ backgroundColor: preset.colors.mainHeadingColor }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs"
                    style={{ backgroundColor: preset.colors.accentColor }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-2xs"
                    style={{ backgroundColor: preset.colors.tableHeaderBgColor }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-800 leading-tight">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Saved Palettes */}
      {customPalettes.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Your Saved Custom Palettes ({customPalettes.length}):
          </label>
          <div className="flex flex-wrap gap-2">
            {customPalettes.map((pal) => (
              <div
                key={pal.id}
                onClick={() => onChange(pal.colors)}
                className="group flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs cursor-pointer shadow-2xs transition"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                  style={{ backgroundColor: pal.colors.mainHeadingColor }}
                />
                <span className="font-semibold text-slate-800">{pal.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteCustomPalette(pal.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 ml-1"
                  title="Delete palette"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Color Pickers Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Pipette className="w-3.5 h-3.5 text-indigo-600" />
            Detailed Color Controls
          </span>

          <button
            type="button"
            onClick={() => setIsSavingPalette(!isSavingPalette)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <BookmarkPlus className="w-3.5 h-3.5" /> Save Current Colors
          </button>
        </div>

        {/* Save Palette Input */}
        {isSavingPalette && (
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-2 animate-in fade-in">
            <input
              type="text"
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Custom Palette Name..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none"
            />
            <button
              type="button"
              onClick={handleSavePalette}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
            >
              Save Palette
            </button>
            <button
              type="button"
              onClick={() => setIsSavingPalette(false)}
              className="px-2 py-1.5 text-slate-500 text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {colorFields.map((field) => {
            const val = colors[field.key] || '#000000';
            return (
              <div
                key={field.key}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-800">
                    {field.label}
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    {field.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <input
                    type="color"
                    value={val.startsWith('#') ? val : '#000000'}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleColorChange(field.key, e.target.value)}
                    className="flex-1 px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
