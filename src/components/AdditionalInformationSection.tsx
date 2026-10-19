import React, { useState, useEffect } from 'react';
import {
  AdditionalSectionItem,
  BUILTIN_SECTION_TEMPLATES,
  SectionContentPreset,
} from '../types/biodata';
import {
  ListPlus,
  CheckSquare,
  Square,
  BookmarkPlus,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface AdditionalInformationSectionProps {
  sections: AdditionalSectionItem[];
  onChange: (sections: AdditionalSectionItem[]) => void;
}

const SECTION_STORAGE_PREFIX = 'cv_custom_templates_';

const SECTION_PLACEHOLDERS: Record<string, string> = {
  skills: 'e.g. MS Word, Excel, PowerPoint, Internet Surfing, English & Hindi Typing (40 wpm)...',
  experience: 'e.g. 2 Years experience as Computer Operator / Office Assistant at ABC Traders...',
  hobbies: 'e.g. Reading Books, Playing Cricket, Gardening, Listening to Music...',
  strengths: 'e.g. Punctual, Hardworking, Fast learner, Excellent team player with positive attitude...',
};

export const AdditionalInformationSection: React.FC<AdditionalInformationSectionProps> = ({
  sections,
  onChange,
}) => {
  // Custom templates per section key stored in localStorage
  const [customTemplates, setCustomTemplates] = useState<
    Record<string, SectionContentPreset[]>
  >({});
  const [savingForSection, setSavingForSection] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; text: string } | null>(null);

  // Load custom templates from localStorage
  useEffect(() => {
    const loaded: Record<string, SectionContentPreset[]> = {};
    ['skills', 'experience', 'hobbies', 'strengths'].forEach((key) => {
      try {
        const stored = localStorage.getItem(`${SECTION_STORAGE_PREFIX}${key}`);
        if (stored) {
          loaded[key] = JSON.parse(stored);
        }
      } catch (e) {
        // ignore parse error
      }
    });
    setCustomTemplates(loaded);
  }, []);

  const showTempFeedback = (sectionId: string, text: string) => {
    setFeedbackMsg({ id: sectionId, text });
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev?.id === sectionId ? null : prev));
    }, 3000);
  };

  const toggleSection = (id: string) => {
    const updated = sections.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onChange(updated);
  };

  const updateContent = (id: string, content: string) => {
    const updated = sections.map((s) =>
      s.id === id ? { ...s, content } : s
    );
    onChange(updated);
  };

  // Select template from dropdown
  const handleSelectTemplate = (sec: AdditionalSectionItem, templateId: string) => {
    if (!templateId) return;

    const key = sec.key as 'skills' | 'experience' | 'hobbies' | 'strengths';
    const builtins = BUILTIN_SECTION_TEMPLATES[key] || [];
    const customs = customTemplates[key] || [];
    const found = [...builtins, ...customs].find((t) => t.id === templateId);

    if (!found) return;

    // If section currently has text that is different, prevent accidental overwrite
    if (sec.content.trim() && sec.content.trim() !== found.content.trim()) {
      const confirmReplace = window.confirm(
        `Replace current ${sec.title} text with "${found.name}"?\n\nTip: You can cancel to keep your current edits.`
      );
      if (!confirmReplace) return;
    }

    updateContent(sec.id, found.content);
    showTempFeedback(sec.id, `Loaded "${found.name}"`);
  };

  // Save current text as custom template
  const handleSaveCustomTemplate = (sec: AdditionalSectionItem) => {
    if (!newTemplateName.trim()) return;
    if (!sec.content.trim()) {
      alert('Please enter some text in the field before saving as a template.');
      return;
    }

    const key = sec.key;
    const newPreset: SectionContentPreset = {
      id: `custom-${Date.now()}`,
      name: newTemplateName.trim(),
      sectionKey: key as any,
      content: sec.content,
      isCustom: true,
    };

    const existing = customTemplates[key] || [];
    const updated = [...existing, newPreset];

    const nextCustoms = { ...customTemplates, [key]: updated };
    setCustomTemplates(nextCustoms);

    try {
      localStorage.setItem(
        `${SECTION_STORAGE_PREFIX}${key}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      // storage error
    }

    setSavingForSection(null);
    setNewTemplateName('');
    showTempFeedback(sec.id, `Saved custom template: "${newPreset.name}"`);
  };

  // Delete custom template
  const handleDeleteCustomTemplate = (sectionKey: string, templateId: string) => {
    const existing = customTemplates[sectionKey] || [];
    const updated = existing.filter((t) => t.id !== templateId);
    const nextCustoms = { ...customTemplates, [sectionKey]: updated };
    setCustomTemplates(nextCustoms);

    try {
      localStorage.setItem(
        `${SECTION_STORAGE_PREFIX}${sectionKey}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      // ignore
    }
  };

  // Rename custom template
  const handleRenameCustomTemplate = (sectionKey: string, templateId: string) => {
    if (!renameValue.trim()) return;
    const existing = customTemplates[sectionKey] || [];
    const updated = existing.map((t) =>
      t.id === templateId ? { ...t, name: renameValue.trim() } : t
    );
    const nextCustoms = { ...customTemplates, [sectionKey]: updated };
    setCustomTemplates(nextCustoms);

    try {
      localStorage.setItem(
        `${SECTION_STORAGE_PREFIX}${sectionKey}`,
        JSON.stringify(updated)
      );
    } catch (e) {
      // ignore
    }

    setRenamingTemplateId(null);
    setRenameValue('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
          <ListPlus className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              4. Additional Information & Skills
            </h2>
            <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
              Universal Templates
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Select professional templates from dropdowns, customize every word, or save your own templates.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => {
          const key = sec.key as 'skills' | 'experience' | 'hobbies' | 'strengths';
          const builtins = BUILTIN_SECTION_TEMPLATES[key] || [];
          const customs = customTemplates[key] || [];

          return (
            <div
              key={sec.id}
              className={`p-4 rounded-xl border transition ${
                sec.enabled
                  ? 'bg-slate-50/80 border-slate-300 shadow-2xs'
                  : 'bg-white border-slate-200 opacity-80'
              }`}
            >
              {/* Header Toggle */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
                >
                  {sec.enabled ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      sec.enabled ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {sec.title}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {feedbackMsg?.id === sec.id && (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {feedbackMsg.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition ${
                      sec.enabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {sec.enabled ? 'Enabled on CV' : 'Disabled / Hidden'}
                  </button>
                </div>
              </div>

              {sec.enabled && (
                <div className="mt-3 pl-6 space-y-3">
                  {/* Template Dropdown Selector Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 min-w-max">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Choose Template:</span>
                    </div>

                    <div className="flex-1 flex items-center gap-1.5">
                      <select
                        onChange={(e) => {
                          handleSelectTemplate(sec, e.target.value);
                          e.target.value = ''; // reset select
                        }}
                        defaultValue=""
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-1 px-2 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="" disabled>
                          -- Choose Predefined or Custom Template --
                        </option>
                        <optgroup label="Professional Predefined Options">
                          {builtins.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </optgroup>
                        {customs.length > 0 && (
                          <optgroup label="Your Saved Custom Templates">
                            {customs.map((t) => (
                              <option key={t.id} value={t.id}>
                                ⭐ {t.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>

                      {sec.content.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Clear content of ${sec.title}?`)) {
                              updateContent(sec.id, '');
                            }
                          }}
                          title="Clear this section"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Editable Textarea */}
                  <div className="relative">
                    <textarea
                      value={sec.content}
                      onChange={(e) => updateContent(sec.id, e.target.value)}
                      placeholder={
                        SECTION_PLACEHOLDERS[sec.key] ||
                        'Enter details for this section or choose from the templates above...'
                      }
                      rows={3}
                      className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white leading-relaxed font-sans"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Live preview updates as you type</span>
                      <span>{sec.content.length} characters</span>
                    </div>
                  </div>

                  {/* Template Actions: Save custom template */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                    {savingForSection === sec.id ? (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <input
                          type="text"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="Template name (e.g. My Retail Experience)"
                          className="text-xs px-2 py-1 border border-indigo-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomTemplate(sec)}
                          className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSavingForSection(null);
                            setNewTemplateName('');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSavingForSection(sec.id);
                          setNewTemplateName(`${sec.title} Template`);
                        }}
                        disabled={!sec.content.trim()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save Current Text as Custom Template</span>
                      </button>
                    )}

                    {/* Manage Custom Templates list toggle if any */}
                    {customs.length > 0 && (
                      <span className="text-[11px] text-slate-500">
                        {customs.length} saved custom template(s)
                      </span>
                    )}
                  </div>

                  {/* List of Custom Templates with Rename/Delete controls */}
                  {customs.length > 0 && (
                    <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 mt-2 space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                        Your Custom Saved Templates:
                      </div>
                      <div className="space-y-1">
                        {customs.map((ct) => (
                          <div
                            key={ct.id}
                            className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded border border-slate-200"
                          >
                            {renamingTemplateId === ct.id ? (
                              <div className="flex items-center gap-1 flex-1">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="text-xs px-1.5 py-0.5 border border-indigo-300 rounded outline-none flex-1"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameCustomTemplate(sec.key, ct.id)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenamingTemplateId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium text-slate-800 truncate mr-2">
                                  ⭐ {ct.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectTemplate(sec, ct.id)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 bg-indigo-50 rounded"
                                  >
                                    Load
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenamingTemplateId(ct.id);
                                      setRenameValue(ct.name);
                                    }}
                                    title="Rename"
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomTemplate(sec.key, ct.id)}
                                    title="Delete"
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
