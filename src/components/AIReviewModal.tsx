import React, { useState } from 'react';
import {
  AIReviewResult,
  AISuggestion,
  BioDataState,
  DescriptionWritingStyle,
  DESCRIPTION_WRITING_STYLES,
} from '../types/biodata';
import { performLocalCVReview } from '../utils/localReviewer';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Check,
  RefreshCw,
  Zap,
  BookOpen,
  ArrowRight,
  Shield,
  ThumbsDown,
  Wand2,
} from 'lucide-react';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: BioDataState;
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onApplyAllSafe: (suggestions: AISuggestion[]) => void;
  onApplyRewrittenDescription: (newText: string) => void;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  cvData,
  onApplySuggestion,
  onApplyAllSafe,
  onApplyRewrittenDescription,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'audit' | 'generator'>('audit');
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Generator state
  const [selectedStyle, setSelectedStyle] = useState<DescriptionWritingStyle>('simple');
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [isDescApplied, setIsDescApplied] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Client-side privacy filter: Never send Aadhaar, photos, or raw contact details to AI
  const preparePrivacySafePayload = (data: BioDataState) => {
    return {
      personal: {
        fullName: data.personal.fullName,
        dateOfBirth: data.personal.dateOfBirth,
        gender: data.personal.gender,
        district: data.personal.district,
        state: data.personal.state,
        pinCode: data.personal.pinCode,
        languagesKnown: data.personal.languagesKnown,
        // Redact Aadhaar, photo, and raw phone/email
        mobileNumber: data.personal.mobileNumber ? 'XXXXXX' + data.personal.mobileNumber.slice(-4) : '',
        emailId: data.personal.emailId ? 'c***@example.com' : '',
      },
      description: data.description,
      education: data.education,
      technical: data.technical,
      additionalSections: data.additionalSections,
    };
  };

  const runReview = async () => {
    setLoading(true);
    setAppliedIds(new Set());
    setRejectedIds(new Set());

    try {
      const safePayload = preparePrivacySafePayload(cvData);
      let res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: safePayload }),
      });

      if (!res.ok) {
        res = await fetch('/api/ai-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvData: safePayload }),
        });
      }

      if (res.ok) {
        const json = await res.json();
        if (!json.fallbackToLocal && json.score) {
          setReviewResult(json);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('AI review server call failed, falling back to local audit engine:', e);
    }

    // High-precision local rule-based review fallback
    const local = performLocalCVReview(cvData);
    setReviewResult(local);
    setLoading(false);
  };

  React.useEffect(() => {
    if (isOpen && !reviewResult) {
      runReview();
    }
  }, [isOpen]);

  const handleGenerateSummary = async () => {
    setGeneratingDesc(true);
    setIsDescApplied(false);
    try {
      const safePayload = preparePrivacySafePayload(cvData);
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: safePayload, style: selectedStyle }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.description) {
          setGeneratedText(json.description);
          setGeneratingDesc(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI description generator error:', err);
    }

    // Local fallback description generator
    const hasTech = cvData.technical?.length > 0;
    const techName = hasTech ? cvData.technical[0].courseName : 'computer operations';
    const fallbackDesc =
      selectedStyle === 'fresher'
        ? 'Motivated and enthusiastic fresher eager to build a professional career. Committed to applying academic foundation, learning practical workplace skills quickly, and contributing reliably to company goals.'
        : selectedStyle === 'technical'
        ? `Technically proficient candidate trained in ${techName} with strong analytical abilities, hands-on software aptitude, and methodical problem-solving skills.`
        : selectedStyle === 'data_entry'
        ? 'Meticulous Computer Operator with fast typing speed and thorough proficiency in MS Office, spreadsheets, and document archiving. Dedicated to maintaining high accuracy and efficient office workflows.'
        : selectedStyle === 'customer_service'
        ? 'Customer-focused candidate with excellent communication skills, polite telephone etiquette, and a problem-solving mindset. Dedicated to positive client relationship management.'
        : selectedStyle === 'technician'
        ? 'Skilled and practical technician with hands-on proficiency in electronic devices, hardware diagnostics, and circuit repair. Dedicated to systematic troubleshooting and quality maintenance.'
        : selectedStyle === 'admin'
        ? 'Organized and responsible administrative professional with proven abilities in records management, office documentation, and prompt task execution.'
        : 'Dedicated and detail-oriented individual with strong academic foundation and a sincere work ethic. Seeking to contribute positively to an organization through hard work, continuous learning, and high integrity.';

    setGeneratedText(fallbackDesc);
    setGeneratingDesc(false);
  };

  if (!isOpen) return null;

  const handleApplySingle = (sug: AISuggestion) => {
    onApplySuggestion(sug);
    setAppliedIds((prev) => new Set([...prev, sug.id]));
  };

  const handleRejectSingle = (sugId: string) => {
    setRejectedIds((prev) => new Set([...prev, sugId]));
  };

  const handleApplyAll = () => {
    if (!reviewResult) return;
    const applicable = reviewResult.suggestions.filter(
      (s) => s.replacementValue && !appliedIds.has(s.id) && !rejectedIds.has(s.id)
    );
    onApplyAllSafe(applicable);
    setAppliedIds(new Set(reviewResult.suggestions.map((s) => s.id)));
  };

  const handleApplyGeneratedSummary = () => {
    if (!generatedText.trim()) return;
    onApplyRewrittenDescription(generatedText.trim());
    setIsDescApplied(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (score >= 70) return 'text-indigo-600 border-indigo-500 bg-indigo-50';
    return 'text-amber-600 border-amber-500 bg-amber-50';
  };

  const filteredSuggestions = (reviewResult?.suggestions || []).filter((s) => {
    if (rejectedIds.has(s.id)) return false;
    if (selectedCategory === 'all') return true;
    const cat = (s.category || '').toLowerCase();
    if (selectedCategory === 'grammar') return cat === 'grammar';
    if (selectedCategory === 'phrasing') return ['clarity', 'wording', 'phrasing'].includes(cat);
    if (selectedCategory === 'completeness') return cat === 'completeness';
    if (selectedCategory === 'structure') return ['formatting', 'structure', 'ats'].includes(cat);
    return true;
  });

  const allVisibleCount = (reviewResult?.suggestions || []).filter((s) => !rejectedIds.has(s.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  AI CV Review & Quality Audit
                </h3>
                {reviewResult && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      reviewResult.isLocalRuleBased
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    {reviewResult.isLocalRuleBased ? 'Local Audit Engine' : 'Gemini 3.8 Flash AI'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Privacy-Protected Indian Standard Bio-Data Quality Verification (SS TELECOM)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveModalTab('audit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeModalTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            1. CV Quality Audit ({allVisibleCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('generator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeModalTab === 'generator'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            2. AI Summary Generator
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {activeModalTab === 'audit' && (
            <>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Analyzing your CV content...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Checking grammar, formatting consistency, date chronologies, and ATS job application standards.
                  </p>
                </div>
              ) : reviewResult ? (
                <>
                  {/* Score & Overview Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold flex-shrink-0 ${getScoreColor(
                        reviewResult.score
                      )}`}
                    >
                      <span className="text-xl leading-none">{reviewResult.score}</span>
                      <span className="text-[10px] uppercase font-semibold">/ 100</span>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        Overall Evaluation
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {reviewResult.overallFeedback}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={runReview}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 cursor-pointer"
                      title="Re-run review"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-scan
                    </button>
                  </div>

                  {/* Strengths list */}
                  {reviewResult.strengths?.length > 0 && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <h5 className="text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Verified CV Strengths ({reviewResult.strengths.length})
                      </h5>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-800">
                        {reviewResult.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions Header & Category Filters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Actionable Recommendations ({allVisibleCount})
                      </h5>

                      {allVisibleCount > 0 && (
                        <button
                          type="button"
                          onClick={handleApplyAll}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Apply All Safe Corrections
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills (Priority 5) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 text-xs">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'grammar', label: 'Grammar' },
                        { id: 'phrasing', label: 'Phrasing' },
                        { id: 'completeness', label: 'Completeness' },
                        { id: 'structure', label: 'Structure / ATS' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer shrink-0 ${
                            selectedCategory === cat.id
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {filteredSuggestions.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                        {allVisibleCount === 0
                          ? 'No pending issues found! All suggestions have been applied or dismissed.'
                          : `No suggestions in the "${selectedCategory}" category.`}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredSuggestions.map((sug) => {
                          const isApplied = appliedIds.has(sug.id);
                          return (
                            <div
                              key={sug.id}
                              className={`p-3.5 rounded-xl border transition shadow-2xs space-y-2 ${
                                sug.isCritical
                                  ? 'bg-rose-50/30 border-rose-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Top Bar: Section & Category Badges */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {sug.isCritical ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      Error Fix
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      <Sparkles className="w-3 h-3 text-indigo-600" />
                                      Style Enhancement
                                    </span>
                                  )}

                                  <span className="text-xs font-bold text-slate-800">
                                    {sug.section || 'General'}
                                  </span>
                                </div>

                                <span className="text-[10px] uppercase font-semibold text-slate-400">
                                  {sug.category}
                                </span>
                              </div>

                              {/* Title & Issue */}
                              <div>
                                <h6 className="text-xs font-bold text-slate-900">
                                  {sug.title}
                                </h6>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {sug.issue}
                                </p>
                              </div>

                              {/* Original Text vs Suggested Text Comparison */}
                              {(sug.originalText || sug.suggestedText) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80">
                                  <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                      Original Text
                                    </span>
                                    <p className="text-slate-600 italic break-words">
                                      {sug.originalText || '(None)'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] font-bold text-indigo-600 uppercase">
                                      Suggested Text
                                    </span>
                                    <p className="text-slate-900 font-semibold break-words">
                                      {sug.suggestedText || sug.replacementValue || sug.suggestion}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Reason for suggestion */}
                              {sug.reason && (
                                <p className="text-[11px] text-slate-500 italic">
                                  <strong>Why:</strong> {sug.reason}
                                </p>
                              )}

                              {/* Actions: Apply vs Reject */}
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleRejectSingle(sug.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                >
                                  <ThumbsDown className="w-3 h-3" /> Dismiss
                                </button>

                                {sug.replacementValue ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApplySingle(sug)}
                                    disabled={isApplied}
                                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                      isApplied
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                    }`}
                                  >
                                    {isApplied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" /> Applied
                                      </>
                                    ) : (
                                      'Apply Suggestion'
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">
                                    Manual review recommended
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </>
          )}

          {activeModalTab === 'generator' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  AI Professional Summary & Objective Generator
                </h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Generate an authentic, tailored 2-3 sentence career summary strictly utilizing information already entered in your CV (qualifications, skills, and background).
                </p>
              </div>

              {/* Writing Style Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Desired Writing Style:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DESCRIPTION_WRITING_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`text-left p-2.5 rounded-xl border transition cursor-pointer ${
                        selectedStyle === style.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{style.label}</span>
                        {selectedStyle === style.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={generatingDesc}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-75"
                >
                  {generatingDesc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate Summary
                    </>
                  )}
                </button>
              </div>

              {/* Generated Text & Editable Box */}
              {generatedText && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Editable Generated Summary (Review & Tweak freely):
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {generatedText.length} characters
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={generatedText}
                    onChange={(e) => {
                      setGeneratedText(e.target.value);
                      setIsDescApplied(false);
                    }}
                    className="w-full p-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-500">
                      Clicking apply will update your CV's Professional Description.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyGeneratedSummary}
                      disabled={isDescApplied}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        isDescApplied
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                    >
                      {isDescApplied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Applied to CV
                        </>
                      ) : (
                        'Apply to CV'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Sensitive data (Aadhaar, photo, signature) is redacted before review.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
