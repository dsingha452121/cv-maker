import React, { useState, useEffect } from 'react';
import {
  BioDataState,
  BUILTIN_DESCRIPTION_TEMPLATES,
  DescriptionTemplate,
  DescriptionWritingStyle,
  DESCRIPTION_WRITING_STYLES,
} from '../types/biodata';
import {
  FileText,
  Sparkles,
  BookmarkPlus,
  Trash2,
  Edit2,
  Check,
  X,
  RotateCcw,
  BookOpen,
  Wand2,
  Loader2,
  GraduationCap,
  Briefcase,
  Layers,
} from 'lucide-react';

interface ProfessionalDescriptionSectionProps {
  description: string;
  enabled: boolean;
  onChange: (description: string, enabled: boolean) => void;
  cvData?: BioDataState;
}

const CUSTOM_TEMPLATES_STORAGE_KEY = 'ss_telecom_custom_desc_templates_v1';

export const ProfessionalDescriptionSection: React.FC<
  ProfessionalDescriptionSectionProps
> = ({ description, enabled, onChange, cvData }) => {
  const [customTemplates, setCustomTemplates] = useState<DescriptionTemplate[]>(
    () => {
      try {
        const saved = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to load custom templates:', e);
      }
      return [];
    }
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState('');

  // Priority 5: AI Generator state with Career Level, Focus, and 2-3 Options
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [careerLevel, setCareerLevel] = useState<'fresher' | 'mid' | 'experienced'>('fresher');
  const [focusArea, setFocusArea] = useState<'general' | 'technical' | 'management' | 'creative'>('general');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [aiGeneratedText, setAiGeneratedText] = useState('');

  // Persist custom templates
  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_TEMPLATES_STORAGE_KEY,
        JSON.stringify(customTemplates)
      );
    } catch (e) {
      console.warn('Failed to save custom templates:', e);
    }
  }, [customTemplates]);

  const allTemplates: DescriptionTemplate[] = [
    ...BUILTIN_DESCRIPTION_TEMPLATES,
    ...customTemplates,
  ];

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = allTemplates.find((t) => t.id === id);
    if (tmpl) {
      onChange(tmpl.text, true);
    }
  };

  const handleSaveAsCustom = () => {
    if (!description.trim()) {
      alert('Please enter some description text first.');
      return;
    }
    const name = customTemplateName.trim() || `Custom Template #${customTemplates.length + 1}`;
    const newTemplate: DescriptionTemplate = {
      id: `custom-tmpl-${Date.now()}`,
      name,
      category: 'My Saved Templates',
      text: description.trim(),
      isCustom: true,
    };
    setCustomTemplates((prev) => [...prev, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setCustomTemplateName('');
    setIsSavingCustom(false);
  };

  const handleDeleteCustom = (id: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) {
        setSelectedTemplateId('');
      }
    }
  };

  const handleStartRename = (tmpl: DescriptionTemplate) => {
    setEditingTemplateId(tmpl.id);
    setEditingTemplateName(tmpl.name);
  };

  const handleSaveRename = () => {
    if (!editingTemplateId || !editingTemplateName.trim()) return;
    setCustomTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTemplateId ? { ...t, name: editingTemplateName.trim() } : t
      )
    );
    setEditingTemplateId(null);
    setEditingTemplateName('');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the description?')) {
      onChange('', enabled);
      setSelectedTemplateId('');
    }
  };

  const handleGenerateAiDescription = async () => {
    setIsAiGenerating(true);
    setAiOptions([]);
    try {
      const payloadCvData = cvData
        ? {
            personal: { fullName: cvData.personal.fullName },
            education: cvData.education,
            technical: cvData.technical,
            additionalSections: cvData.additionalSections,
            description,
          }
        : { description };

      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: payloadCvData,
          careerLevel,
          focus: focusArea,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const optionsList = Array.isArray(json.options) && json.options.length > 0
          ? json.options
          : json.description
          ? [json.description]
          : [];

        if (optionsList.length > 0) {
          setAiOptions(optionsList);
          setSelectedOptionIndex(0);
          setAiGeneratedText(optionsList[0]);
          setIsAiGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI summary generation error, using fallback:', err);
    }

    // High quality contextual fallbacks based on career level & focus
    const fallbackMap: Record<string, string[]> = {
      'fresher-general': [
        'Motivated and sincere fresher with a strong academic foundation, seeking an entry-level opportunity to contribute meaningfully to organizational success through disciplined work and continuous learning.',
        'Enthusiastic and hardworking individual eager to begin a professional career. Committed to applying learned principles, adhering to ethical standards, and growing alongside the company.',
        'Dedicated candidate with proven reliability and positive attitude. Seeking to leverage strong foundational education into reliable workplace contributions.',
      ],
      'fresher-technical': [
        'Motivated and technically oriented fresher with hands-on training in computer applications. Eager to apply practical computing knowledge, learn modern workplace technologies, and contribute with dedication.',
        'Enthusiastic graduate with strong foundation in technical principles and computer systems. Seeking an entry-level position to deliver systematic support, solve practical challenges, and learn from experienced professionals.',
        'Detail-oriented fresher possessing foundational proficiency in software tools and technical operations. Committed to sincere work ethic, punctual task completion, and rapid on-the-job learning.',
      ],
      'fresher-management': [
        'Proactive and organized fresher with strong communication and coordination skills. Eager to support team operations, maintain efficient office workflows, and grow within a professional organization.',
        'Dedicated graduate seeking an entry-level management or administrative role. Bringing positive interpersonal abilities, methodical task execution, and a commitment to operational excellence.',
        'Motivated fresher with structured organizational capabilities and dependable work ethic. Eager to assist department goals through disciplined execution.',
      ],
      'fresher-creative': [
        'Creative and enthusiastic individual with fresh ideas and dedication to visual presentation and communication. Seeking an opportunity to contribute aesthetic sensibility and learning drive.',
        'Motivated fresher with strong creative flair and eye for detail. Eager to collaborate on diverse projects, learn industry standards, and deliver engaging, high-quality work.',
        'Passionate entry-level talent with expressive communication and problem-solving skills. Committed to bringing innovative energy and reliability to every assigned responsibility.',
      ],
      'mid-general': [
        'Dedicated and detail-oriented candidate seeking an opportunity to contribute effectively to organizational growth while developing professional skills through sincere work and responsibility.',
        'Responsible and hardworking professional with a solid background, seeking to deliver consistent performance, maintain high workplace integrity, and support team milestones.',
        'Conscientious candidate with strong organizational aptitude and dependable work ethic. Eager to add tangible value to company operations through sincere dedication.',
      ],
      'mid-technical': [
        'Technically proficient professional with strong aptitude for computer operations, software tools, and practical troubleshooting. Eager to deliver high-quality technical support.',
        'Competent technical practitioner with solid skills in application management and hardware-software diagnostics. Focused on maintaining smooth operations and prompt task turnaround.',
        'Dedicated professional combining formal education with practical technical aptitude. Committed to continuous technology enhancement and reliable troubleshooting.',
      ],
      'mid-management': [
        'Organized and detail-conscious professional with experience in records management, team assistance, and workflow administration. Committed to maintaining efficient office standards.',
        'Resourceful administrative coordinator with strong communication skills and systematic task prioritization. Dedicated to upholding departmental productivity.',
        'Dependable professional skilled in daily operations, schedule coordination, and office document processing. Focused on timely execution and collaborative team support.',
      ],
      'mid-creative': [
        'Creative and detail-oriented candidate with a sharp visual aesthetic and strong dedication to polished deliverables. Eager to produce engaging content and creative assets.',
        'Versatile creative specialist skilled in imaginative problem solving and aesthetic styling. Committed to elevating project quality through disciplined originality.',
        'Innovative professional with aptitude for digital creativity and effective communication. Seeking to contribute innovative concepts and meticulous execution.',
      ],
      'experienced-general': [
        'Seasoned and dependable professional with a proven track record of diligent performance, high integrity, and consistent execution across diverse workplace responsibilities.',
        'Experienced practitioner committed to operational excellence, workflow optimization, and exemplary team collaboration. Focused on driving measurable results.',
        'Dedicated professional offering extensive practical experience and reliable execution. Seeking to leverage accumulated expertise to enhance organizational efficiency.',
      ],
      'experienced-technical': [
        'Experienced technical professional proficient in computer systems and operations. Demonstrated track record of error-free technical execution, problem diagnosis, and workflow optimization.',
        'Results-driven technical specialist with seasoned hands-on expertise in troubleshooting and digital tools. Committed to maintaining high standards of system efficiency.',
        'Dependable technical practitioner with rich practical experience in modern computing environments. Focused on delivering prompt technical solutions and mentoring junior team members.',
      ],
      'experienced-management': [
        'Accomplished operations and administrative professional with a solid track record of supervising deliverables, optimizing office processes, and ensuring client satisfaction.',
        'Seasoned coordinator with proven leadership in workflow management, documentation integrity, and cross-departmental communication. Committed to operational excellence.',
        'Dedicated administrative manager skilled in procedural accuracy, conflict resolution, and resource planning. Focused on fostering productivity.',
      ],
      'experienced-creative': [
        'Experienced creative professional with proven background in concept ideation and visual communication. Dedicated to crafting impactful outputs that elevate brand standards.',
        'Versatile and innovative specialist with demonstrated history of delivering original creative solutions under tight timelines. Focused on quality and aesthetic value.',
        'Dynamic creative practitioner with substantial design and communication experience. Committed to blending artistic originality with pragmatic business objectives.',
      ],
    };

    const key = `${careerLevel}-${focusArea}`;
    const opts = fallbackMap[key] || fallbackMap['fresher-general'];
    setAiOptions(opts);
    setSelectedOptionIndex(0);
    setAiGeneratedText(opts[0]);
    setIsAiGenerating(false);
  };

  const handleSelectOption = (index: number) => {
    setSelectedOptionIndex(index);
    setAiGeneratedText(aiOptions[index] || '');
  };

  const handleApplyAiGenerated = () => {
    if (!aiGeneratedText.trim()) return;
    onChange(aiGeneratedText.trim(), true);
    setShowAiGenerator(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                Professional Description
              </h2>
              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                Editable Library
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select from ready-made formal descriptions, generate with AI, or write your own.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAiGenerator(!showAiGenerator)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Generator</span>
          </button>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange(description, e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span>Include in CV</span>
          </label>
        </div>
      </div>

      {/* AI Description Generator Collapsible Drawer (Priority 5) */}
      {showAiGenerator && (
        <div className="mb-5 p-4 bg-gradient-to-r from-indigo-50/90 to-violet-50/90 border border-indigo-200 rounded-xl space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                AI Professional Summary & Objective Generator
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAiGenerator(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Career Level Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                Career Level:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'fresher', label: 'Entry-level / Fresher' },
                  { id: 'mid', label: 'Mid-level' },
                  { id: 'experienced', label: 'Experienced' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setCareerLevel(lvl.id as any)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition text-center cursor-pointer ${
                      careerLevel === lvl.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {lvl.id === 'fresher' ? 'Fresher' : lvl.id === 'mid' ? 'Mid-level' : 'Experienced'}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Area Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                Professional Focus:
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'general', label: 'General' },
                  { id: 'technical', label: 'Technical / IT' },
                  { id: 'management', label: 'Management' },
                  { id: 'creative', label: 'Creative' },
                ].map((foc) => (
                  <button
                    key={foc.id}
                    type="button"
                    onClick={() => setFocusArea(foc.id as any)}
                    className={`py-1.5 px-1.5 text-[11px] font-bold rounded-lg border transition text-center truncate cursor-pointer ${
                      focusArea === foc.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {foc.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleGenerateAiDescription}
              disabled={isAiGenerating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-75 rounded-lg shadow-xs transition cursor-pointer"
            >
              {isAiGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating 3 Tailored Options...
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate 3 Options
                </>
              )}
            </button>
          </div>

          {/* 2-3 Selectable Generated Options */}
          {aiOptions.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-indigo-200/60">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Pick from Generated Options ({aiOptions.length} available):
                </label>
                <span className="text-[10px] text-indigo-700 font-medium">
                  Click an option to select & edit
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {aiOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3 rounded-xl border text-xs leading-relaxed transition cursor-pointer ${
                      selectedOptionIndex === idx
                        ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-white/80 border-indigo-100 hover:border-indigo-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Option {idx + 1}
                      </span>
                      {selectedOptionIndex === idx && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800">{opt}</p>
                  </div>
                ))}
              </div>

              {/* Editable View for Selected Option */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[11px] font-bold text-slate-800">
                  Tweak Selected Option Before Applying:
                </label>
                <textarea
                  rows={3}
                  value={aiGeneratedText}
                  onChange={(e) => setAiGeneratedText(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed text-slate-800"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAiOptions([]);
                      setAiGeneratedText('');
                    }}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiGenerated}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply Selected to CV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Dropdown Selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Choose Description Template (Auto-Fills Below)
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            {allTemplates.length} templates available
          </span>
        </label>

        <select
          value={selectedTemplateId}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white font-medium text-slate-800"
        >
          <option value="">— Select a professional template to load —</option>
          <optgroup label="Standard Built-in Templates (SS TELECOM)">
            {BUILTIN_DESCRIPTION_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name} ({tmpl.category})
              </option>
            ))}
          </optgroup>
          {customTemplates.length > 0 && (
            <optgroup label="My Saved Custom Templates">
              {customTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  ★ {tmpl.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Description Textarea Editor */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Description Text <span className="text-slate-400 font-normal">(Fully editable)</span>
          </label>
          <div className="flex items-center gap-2">
            {description && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear Text
              </button>
            )}
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => onChange(e.target.value, enabled)}
          rows={4}
          placeholder="Enter your professional description or select a template from the dropdown above..."
          className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed bg-white text-slate-800"
        />

        <div className="flex flex-wrap items-center justify-between mt-2 gap-2 text-xs text-slate-500">
          <span>
            {description.trim().length > 0
              ? `${description.trim().split(/\s+/).length} words • ${description.length} characters`
              : 'Empty (this section will be hidden on the CV)'}
          </span>

          <button
            type="button"
            onClick={() => setIsSavingCustom(!isSavingCustom)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save as Custom Template
          </button>
        </div>
      </div>

      {/* Save Custom Template Popover */}
      {isSavingCustom && (
        <div className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-200 mb-4 animate-in fade-in duration-150">
          <h4 className="text-xs font-bold text-indigo-950 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Save Current Description as New Template
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customTemplateName}
              onChange={(e) => setCustomTemplateName(e.target.value)}
              placeholder="e.g. Computer Operator Profile"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleSaveAsCustom}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
            >
              Save Template
            </button>
            <button
              type="button"
              onClick={() => setIsSavingCustom(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Custom Templates Management */}
      {customTemplates.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">
            Your Custom Templates ({customTemplates.length}):
          </h4>
          <div className="space-y-1.5">
            {customTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 text-xs transition"
              >
                {editingTemplateId === tmpl.id ? (
                  <div className="flex items-center gap-1.5 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingTemplateName}
                      onChange={(e) => setEditingTemplateName(e.target.value)}
                      className="px-2 py-1 text-xs border border-indigo-300 rounded bg-white w-full"
                    />
                    <button
                      type="button"
                      onClick={handleSaveRename}
                      className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTemplateId(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 truncate mr-2">
                    <span className="font-semibold text-slate-800 truncate">
                      {tmpl.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className="text-[10px] text-indigo-600 hover:underline flex-shrink-0 font-medium cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {editingTemplateId !== tmpl.id && (
                    <button
                      type="button"
                      onClick={() => handleStartRename(tmpl)}
                      className="p-1 text-slate-500 hover:text-slate-700 rounded cursor-pointer"
                      title="Rename Template"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteCustom(tmpl.id)}
                    className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
