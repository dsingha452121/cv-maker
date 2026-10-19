import React from 'react';
import { CVFormatId, CV_FORMATS, DocumentTitleType, DOCUMENT_TITLES } from '../types/biodata';
import { LayoutTemplate, Check, Heading } from 'lucide-react';

interface LayoutDesignPanelProps {
  selectedFormat: CVFormatId;
  onSelectFormat: (format: CVFormatId) => void;
  documentTitle: DocumentTitleType;
  onSelectDocumentTitle: (title: DocumentTitleType) => void;
}

export const LayoutDesignPanel: React.FC<LayoutDesignPanelProps> = ({
  selectedFormat,
  onSelectFormat,
  documentTitle,
  onSelectDocumentTitle,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      {/* 1. Dynamic Document Title Selector */}
      <div className="pb-5 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Heading className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Document Title
            </h2>
            <p className="text-xs text-slate-500">
              Choose the top heading for your document. Updates the preview and print output instantly.
            </p>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Select Document Heading
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DOCUMENT_TITLES.map((item) => {
              const isSelected = (documentTitle || 'BIO-DATA') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectDocumentTitle(item.id)}
                  className={`p-3 text-left rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 tracking-wider">
                      {item.id}
                    </span>
                    {isSelected && (
                      <span className="p-0.5 bg-indigo-600 text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Layout Formats */}
      <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
          <LayoutTemplate className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            CV Layout & Design Formats
          </h2>
          <p className="text-xs text-slate-500">
            Select from 6 distinctive A4 document layouts. Data, title, and custom colors are preserved.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {CV_FORMATS.map((fmt) => {
          const isSelected = selectedFormat === fmt.id;
          return (
            <div
              key={fmt.id}
              onClick={() => onSelectFormat(fmt.id)}
              className={`p-4 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {fmt.badge}
                  </span>
                  {isSelected && (
                    <span className="p-1 bg-indigo-600 text-white rounded-full">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {fmt.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {fmt.description}
                </p>
              </div>

              {/* Layout Wireframe Thumbnail Representation */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
                <div className="w-24 h-28 bg-white border border-slate-300 rounded shadow-2xs p-1.5 flex flex-col justify-between pointer-events-none">
                  {fmt.id === 'classic' && (
                    <>
                      <div className="h-1.5 w-12 bg-slate-800 mx-auto rounded-xs mb-1" />
                      <div className="flex gap-1 flex-1">
                        <div className="w-2/3 space-y-1">
                          <div className="h-1 bg-slate-300 rounded-xs w-full" />
                          <div className="h-1 bg-slate-300 rounded-xs w-3/4" />
                          <div className="h-1 bg-slate-300 rounded-xs w-5/6" />
                        </div>
                        <div className="w-1/3 h-7 border border-slate-400 bg-slate-100" />
                      </div>
                      <div className="h-4 border border-slate-400 bg-slate-50 mt-1" />
                    </>
                  )}
                  {fmt.id === 'compact' && (
                    <>
                      <div className="h-1 w-10 bg-slate-800 mx-auto rounded-xs mb-0.5" />
                      <div className="space-y-0.5 flex-1">
                        <div className="h-0.5 bg-slate-300 w-full" />
                        <div className="h-0.5 bg-slate-300 w-4/5" />
                        <div className="h-0.5 bg-slate-300 w-full" />
                        <div className="h-2.5 border border-slate-400 bg-slate-50" />
                        <div className="h-2.5 border border-slate-400 bg-slate-50" />
                      </div>
                    </>
                  )}
                  {fmt.id === 'modern' && (
                    <>
                      <div className="h-2 w-full bg-indigo-600 rounded-xs mb-1" />
                      <div className="space-y-1 flex-1">
                        <div className="h-1 bg-slate-300 w-full" />
                        <div className="h-1 bg-slate-300 w-3/4" />
                        <div className="h-3 border-l-2 border-indigo-600 bg-slate-50 pl-1" />
                      </div>
                    </>
                  )}
                  {fmt.id === 'traditional' && (
                    <div className="h-full border-2 border-double border-slate-800 p-1 flex flex-col justify-between">
                      <div className="h-1 w-10 bg-slate-800 mx-auto" />
                      <div className="h-1 bg-slate-400 w-full" />
                      <div className="h-4 border border-slate-600" />
                    </div>
                  )}
                  {fmt.id === 'minimal' && (
                    <>
                      <div className="h-1.5 w-14 bg-slate-900 mb-1.5" />
                      <div className="space-y-1 flex-1">
                        <div className="h-0.5 bg-slate-300 w-full" />
                        <div className="h-0.5 bg-slate-300 w-2/3" />
                        <div className="h-3 border-t border-slate-300" />
                      </div>
                    </>
                  )}
                  {fmt.id === 'boxed' && (
                    <>
                      <div className="h-1.5 w-12 bg-slate-800 mx-auto mb-1" />
                      <div className="h-5 border border-slate-400 bg-slate-50 mb-1" />
                      <div className="h-6 border border-slate-400 bg-slate-50" />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
