import React from 'react';
import {
  COLOR_THEME_PRESETS,
  CVColorThemeId,
  CV_FORMATS,
  CVFormatId,
} from '../types/biodata';
import { Palette, LayoutTemplate } from 'lucide-react';

interface ThemeFormatSelectorProps {
  selectedTheme: CVColorThemeId;
  onSelectTheme: (theme: CVColorThemeId) => void;
  selectedFormat: CVFormatId;
  onSelectFormat: (format: CVFormatId) => void;
  onOpenColorCustomizer?: () => void;
}

export const ThemeFormatSelector: React.FC<ThemeFormatSelectorProps> = ({
  selectedTheme,
  onSelectTheme,
  selectedFormat,
  onSelectFormat,
  onOpenColorCustomizer,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-3.5 shadow-xs no-print space-y-3">
      {/* Themes Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
            <Palette className="w-3.5 h-3.5 text-indigo-600" />
            <span>CV Color Preset</span>
          </div>

          {onOpenColorCustomizer && (
            <button
              type="button"
              onClick={onOpenColorCustomizer}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Custom Color Pickers →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(COLOR_THEME_PRESETS).map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelectTheme(theme.id)}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 shadow-2xs"
                  style={{ backgroundColor: theme.badgeColor }}
                />
                <span
                  className={`text-[11px] truncate leading-tight ${
                    isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                  }`}
                >
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Selector Row */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
          <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600" />
          <span>CV Layout Format (6 A4 Formats)</span>
        </div>

        <div className="flex flex-wrap items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 gap-0.5">
          {CV_FORMATS.map((fmt) => {
            const isSelected = selectedFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onSelectFormat(fmt.id)}
                title={fmt.description}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  isSelected
                    ? 'bg-white text-indigo-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {fmt.name.replace(' Bio-Data', '')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
