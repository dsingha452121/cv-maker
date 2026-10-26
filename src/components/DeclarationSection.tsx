import React, { useMemo } from 'react';
import {
  DeclarationInfo,
  DECLARATION_TEMPLATES,
} from '../types/biodata';
import {
  FileSignature,
  RotateCcw,
  Calendar,
  MapPin,
  BookOpen,
} from 'lucide-react';

interface DeclarationSectionProps {
  declaration: DeclarationInfo;
  onChange: (declaration: DeclarationInfo) => void;
  hasDigitalSignature?: boolean;
}

const STANDARD_DECLARATION_TEXT =
  DECLARATION_TEMPLATES[0].text;

export const DeclarationSection: React.FC<DeclarationSectionProps> = ({
  declaration,
  onChange,
  hasDigitalSignature = false,
}) => {
  // Determine current active template
  const currentTemplateId = useMemo(() => {
    if (declaration.templateId) {
      return declaration.templateId;
    }
    const matched = DECLARATION_TEMPLATES.find(
      (t) => t.id !== 'custom' && t.text.trim() === (declaration.text || '').trim()
    );
    return matched ? matched.id : 'standard';
  }, [declaration.templateId, declaration.text]);

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === 'custom') {
      onChange({
        ...declaration,
        templateId: 'custom',
      });
      return;
    }

    const selected = DECLARATION_TEMPLATES.find((t) => t.id === templateId);
    if (selected) {
      onChange({
        ...declaration,
        text: selected.text,
        templateId: selected.id,
      });
    }
  };

  const handleTextChange = (newText: string) => {
    const matched = DECLARATION_TEMPLATES.find(
      (t) => t.id !== 'custom' && t.text.trim() === newText.trim()
    );
    onChange({
      ...declaration,
      text: newText,
      templateId: matched ? matched.id : 'custom',
    });
  };

  const updateField = (field: keyof DeclarationInfo, value: string) => {
    onChange({
      ...declaration,
      [field]: value,
    });
  };

  const resetToDefault = () => {
    onChange({
      ...declaration,
      text: STANDARD_DECLARATION_TEXT,
      templateId: 'standard',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
          <FileSignature className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            5. Declaration & Footer
          </h2>
          <p className="text-xs text-slate-500">
            Formal applicant declaration, place, and date
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Declaration Template Dropdown Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Choose Declaration Template (Auto-Fills Below)
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              {DECLARATION_TEMPLATES.length} templates available
            </span>
          </label>

          <select
            value={currentTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-medium text-slate-800 cursor-pointer transition shadow-2xs"
          >
            {DECLARATION_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Declaration Statement Editable Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-700">
              Declaration Statement
            </label>
            <button
              type="button"
              onClick={resetToDefault}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium transition cursor-pointer"
              title="Reset to 1. Standard Formal Declaration"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Standard Text
            </button>
          </div>
          <textarea
            value={declaration.text}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
            placeholder="Enter applicant declaration statement..."
            className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed text-slate-800"
          />
        </div>

        {/* Date & Place Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={declaration.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Leave empty to keep blank lines for handwriting
            </p>
          </div>

          {/* Place */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Place
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={declaration.place}
                onChange={(e) => updateField('place', e.target.value)}
                placeholder="e.g. Kolkata / New Delhi"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your city or district name
            </p>
          </div>
        </div>

        {/* Digital Signature Notice */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
          <span>✍️</span>
          <span>
            {hasDigitalSignature ? (
              <>
                <strong>Digital Signature Active:</strong> Your transparent signature is placed above the signature line on the CV. You can adjust or disable it in Section 6 below.
              </>
            ) : (
              <>
                <strong>Signature Options:</strong> You can upload a handwritten signature with automatic background removal in Section 6 below, or leave it blank to sign with a pen after printing.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
