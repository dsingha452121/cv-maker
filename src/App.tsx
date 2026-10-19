/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BioDataState,
  CVColors,
  CVColorThemeId,
  CVFormatId,
  CVSectionId,
  COLOR_THEME_PRESETS,
  DEFAULT_SECTION_ORDER,
  INITIAL_EMPTY_STATE,
  SAMPLE_STATE,
  DocumentTitleType,
  AISuggestion,
  TypographySettings,
  DEFAULT_TYPOGRAPHY,
} from './types/biodata';
import { Navbar } from './components/Navbar';
import { PersonalInformationForm } from './components/PersonalInformationForm';
import { ProfessionalDescriptionSection } from './components/ProfessionalDescriptionSection';
import { EducationSection } from './components/EducationSection';
import { TechnicalQualificationSection } from './components/TechnicalQualificationSection';
import { AdditionalInformationSection } from './components/AdditionalInformationSection';
import { DeclarationSection } from './components/DeclarationSection';
import { SignatureUploadSection } from './components/SignatureUploadSection';
import { LayoutDesignPanel } from './components/LayoutDesignPanel';
import { SectionReorderPanel } from './components/SectionReorderPanel';
import { ColorCustomizer } from './components/ColorCustomizer';
import { AIReviewModal } from './components/AIReviewModal';
import { PreviewWrapper } from './components/PreviewWrapper';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import {
  downloadCvPdf,
  printCvDocument,
  downloadCvImage,
  downloadAllCvPagesAsZip,
} from './utils/cvExporter';
import {
  Eye,
  Edit3,
  CheckCircle,
  AlertCircle,
  Download,
  Printer,
  Sparkles,
  FileText,
  LayoutTemplate,
  Palette,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'ss_telecom_cv_maker_data_v3';
const THEME_KEY = 'ss_telecom_cv_maker_theme_v3';
const FORMAT_KEY = 'ss_telecom_cv_maker_format_v3';
const COLORS_KEY = 'ss_telecom_cv_maker_colors_v3';
const TYPOGRAPHY_KEY = 'ss_telecom_cv_maker_typography_v3';

export default function App() {
  const [data, setData] = useState<BioDataState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_EMPTY_STATE,
          ...parsed,
          sectionOrder: parsed.sectionOrder || DEFAULT_SECTION_ORDER,
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved bio-data from storage:', e);
    }
    return INITIAL_EMPTY_STATE;
  });

  const [selectedTheme, setSelectedTheme] = useState<CVColorThemeId>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (
        savedTheme &&
        [
          'classic-black',
          'professional-blue',
          'elegant-green',
          'burgundy',
          'charcoal-grey',
          'navy-gold',
        ].includes(savedTheme)
      ) {
        return savedTheme as CVColorThemeId;
      }
    } catch (e) {
      // ignore
    }
    return 'classic-black';
  });

  const [colors, setColors] = useState<CVColors>(() => {
    try {
      const saved = localStorage.getItem(COLORS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return (
      COLOR_THEME_PRESETS[selectedTheme]?.colors ||
      COLOR_THEME_PRESETS['classic-black'].colors
    );
  });

  const [selectedFormat, setSelectedFormat] = useState<CVFormatId>(() => {
    try {
      const savedFormat = localStorage.getItem(FORMAT_KEY);
      if (
        savedFormat &&
        [
          'classic',
          'compact',
          'modern',
          'traditional',
          'minimal',
          'boxed',
        ].includes(savedFormat)
      ) {
        return savedFormat as CVFormatId;
      }
    } catch (e) {
      // ignore
    }
    return 'classic';
  });

  // Typography state with localStorage persistence
  const [typography, setTypography] = useState<TypographySettings>(() => {
    try {
      const saved = localStorage.getItem(TYPOGRAPHY_KEY);
      if (saved) {
        return { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(saved) };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_TYPOGRAPHY;
  });

  // Left column active navigation tab: 'content' | 'layout' | 'colors'
  const [activeLeftTab, setActiveLeftTab] = useState<'content' | 'layout' | 'colors'>('content');

  // Mobile mode switcher: form vs preview
  const [activeTabMobile, setActiveTabMobile] = useState<'form' | 'preview'>('form');

  // Modals & transient states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  // Save data to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save data to localStorage:', e);
    }
  }, [data]);

  // Save theme selection
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, selectedTheme);
    } catch (e) {
      // ignore
    }
  }, [selectedTheme]);

  // Save colors selection
  useEffect(() => {
    try {
      localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
    } catch (e) {
      // ignore
    }
  }, [colors]);

  // Save format selection
  useEffect(() => {
    try {
      localStorage.setItem(FORMAT_KEY, selectedFormat);
    } catch (e) {
      // ignore
    }
  }, [selectedFormat]);

  // Save typography selection
  useEffect(() => {
    try {
      localStorage.setItem(TYPOGRAPHY_KEY, JSON.stringify(typography));
    } catch (e) {
      // ignore
    }
  }, [typography]);

  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const handleSelectTheme = (themeId: CVColorThemeId) => {
    setSelectedTheme(themeId);
    if (COLOR_THEME_PRESETS[themeId]) {
      setColors(COLOR_THEME_PRESETS[themeId].colors);
    }
    showToast(`Applied ${COLOR_THEME_PRESETS[themeId]?.name || themeId} theme`, 'success');
  };

  const handlePersonalChange = (updatedPersonal: BioDataState['personal']) => {
    setData((prev) => ({ ...prev, personal: updatedPersonal }));
    setIsValidated(false);
  };

  const handleDescriptionChange = (description: string, enabled: boolean) => {
    setData((prev) => ({ ...prev, description, descriptionEnabled: enabled }));
    setIsValidated(false);
  };

  const handleEducationChange = (updatedEducation: BioDataState['education']) => {
    setData((prev) => ({ ...prev, education: updatedEducation }));
    setIsValidated(false);
  };

  const handleTechnicalChange = (updatedTechnical: BioDataState['technical']) => {
    setData((prev) => ({ ...prev, technical: updatedTechnical }));
    setIsValidated(false);
  };

  const handleAdditionalChange = (
    updatedAdditional: BioDataState['additionalSections']
  ) => {
    setData((prev) => ({ ...prev, additionalSections: updatedAdditional }));
    setIsValidated(false);
  };

  const handleDeclarationChange = (
    updatedDeclaration: BioDataState['declaration']
  ) => {
    setData((prev) => ({ ...prev, declaration: updatedDeclaration }));
    setIsValidated(false);
  };

  const handleSignatureChange = (
    updatedSignature: BioDataState['signature']
  ) => {
    setData((prev) => ({ ...prev, signature: updatedSignature }));
    setIsValidated(false);
  };

  const handleSectionOrderChange = (newOrder: CVSectionId[]) => {
    setData((prev) => ({ ...prev, sectionOrder: newOrder }));
    showToast('CV section order updated!', 'success');
  };

  const handleSelectDocumentTitle = (newTitle: DocumentTitleType) => {
    setData((prev) => ({ ...prev, documentTitle: newTitle }));
    showToast(`Document Title set to "${newTitle}"`, 'success');
  };

  const handleGenerateBioData = () => {
    // Validation checks
    const errors: string[] = [];
    if (!data.personal.fullName?.trim()) {
      errors.push('Full Name is required');
    }
    if (!data.personal.fatherName?.trim()) {
      errors.push("Father's Name is required");
    }
    if (!data.personal.dateOfBirth?.trim()) {
      errors.push('Date of Birth is required');
    }
    if (!data.personal.mobileNumber?.trim()) {
      errors.push('Mobile Number is required');
    } else if (!/^\d{10}$/.test(data.personal.mobileNumber.replace(/\D/g, ''))) {
      errors.push('Mobile Number should be a 10-digit number');
    }

    if (data.personal.emailId?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.personal.emailId.trim())) {
        errors.push('Please enter a valid email address');
      }
    }

    if (errors.length > 0) {
      showToast(errors[0], 'warning');
      return;
    }

    setIsValidated(true);
    showToast('Bio-Data generated and updated successfully!', 'success');

    // On mobile, switch to preview
    if (window.innerWidth < 1024) {
      setActiveTabMobile('preview');
    }
  };

  const handlePrint = () => {
    if (activeTabMobile !== 'preview' && window.innerWidth < 1024) {
      setActiveTabMobile('preview');
    }
    showToast('Opening native browser A4 print dialog...', 'success');
    setTimeout(() => {
      printCvDocument();
    }, 120);
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    showToast('Rendering high-resolution A4 PDF...', 'success');
    try {
      if (activeTabMobile !== 'preview' && window.innerWidth < 1024) {
        setActiveTabMobile('preview');
        await new Promise((r) => setTimeout(r, 120));
      }
      await downloadCvPdf(
        'biodata-print-area',
        data.personal.fullName || '',
        (status) => showToast(status, 'info' as any)
      );
      showToast('A4 PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF export error:', err);
      showToast(err?.message || 'Failed to download PDF. Please try the Print option.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async (format: 'png' | 'jpeg') => {
    if (isExportingImage) return;
    setIsExportingImage(true);
    showToast(`Rendering high-resolution ${format.toUpperCase()} image...`, 'success');
    try {
      if (activeTabMobile !== 'preview' && window.innerWidth < 1024) {
        setActiveTabMobile('preview');
        await new Promise((r) => setTimeout(r, 120));
      }
      await downloadCvImage(
        format,
        'biodata-print-area',
        data.personal.fullName || '',
        (status) => showToast(status, 'info' as any)
      );
      showToast(`${format.toUpperCase()} image downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Image export error:', err);
      showToast(err?.message || `Failed to download ${format.toUpperCase()} image.`, 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleDownloadZip = async () => {
    if (isExportingImage) return;
    setIsExportingImage(true);
    showToast('Rendering multi-page images for ZIP archive...', 'success');
    try {
      if (activeTabMobile !== 'preview' && window.innerWidth < 1024) {
        setActiveTabMobile('preview');
        await new Promise((r) => setTimeout(r, 120));
      }
      await downloadAllCvPagesAsZip(
        'biodata-document-sheet',
        data.personal.fullName || '',
        (status) => showToast(status, 'info' as any)
      );
      showToast('All CV pages downloaded as ZIP archive!', 'success');
    } catch (err: any) {
      console.error('ZIP export error:', err);
      showToast(err?.message || 'Failed to download ZIP archive.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleConfirmReset = () => {
    setData(INITIAL_EMPTY_STATE);
    setColors(COLOR_THEME_PRESETS['classic-black'].colors);
    setSelectedTheme('classic-black');
    setSelectedFormat('classic');
    setTypography(DEFAULT_TYPOGRAPHY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TYPOGRAPHY_KEY);
    setIsValidated(false);
    showToast('Form reset to blank state.', 'success');
  };

  const handleLoadSample = () => {
    setData(SAMPLE_STATE);
    setIsValidated(true);
    showToast('Sample data loaded! Preview the document on the right.', 'success');
  };

  // AI Review apply handlers
  const handleApplyAiSuggestion = (suggestion: AISuggestion) => {
    if (!suggestion.replacementValue) return;

    if (suggestion.targetField === 'description') {
      setData((prev) => ({
        ...prev,
        description: suggestion.replacementValue!,
        descriptionEnabled: true,
      }));
      showToast('Updated Professional Description with AI suggestion', 'success');
    } else if (suggestion.targetField === 'personal' || suggestion.targetField === 'address') {
      if (suggestion.id.includes('name')) {
        setData((prev) => ({
          ...prev,
          personal: { ...prev.personal, fullName: suggestion.replacementValue! },
        }));
        showToast('Updated Full Name with AI suggestion', 'success');
      } else if (suggestion.id.includes('phone')) {
        setData((prev) => ({
          ...prev,
          personal: { ...prev.personal, mobileNumber: suggestion.replacementValue! },
        }));
        showToast('Updated Mobile Number with AI suggestion', 'success');
      } else if (suggestion.id.includes('email')) {
        setData((prev) => ({
          ...prev,
          personal: { ...prev.personal, emailId: suggestion.replacementValue! },
        }));
        showToast('Updated Email Address with AI suggestion', 'success');
      } else if (suggestion.id.includes('pin')) {
        setData((prev) => ({
          ...prev,
          personal: { ...prev.personal, pinCode: suggestion.replacementValue! },
        }));
        showToast('Updated PIN Code with AI suggestion', 'success');
      }
    }
  };

  const handleApplyAllAiSafe = (suggestions: AISuggestion[]) => {
    let descUpdated = false;

    setData((prev) => {
      let newPersonal = { ...prev.personal };
      let newDesc = prev.description;

      for (const s of suggestions) {
        if (!s.replacementValue) continue;
        if (s.targetField === 'description') {
          newDesc = s.replacementValue;
          descUpdated = true;
        } else if (s.targetField === 'personal' || s.targetField === 'address') {
          if (s.id.includes('name')) {
            newPersonal.fullName = s.replacementValue;
          } else if (s.id.includes('phone')) {
            newPersonal.mobileNumber = s.replacementValue;
          } else if (s.id.includes('email')) {
            newPersonal.emailId = s.replacementValue;
          } else if (s.id.includes('pin')) {
            newPersonal.pinCode = s.replacementValue;
          }
        }
      }

      return {
        ...prev,
        personal: newPersonal,
        description: newDesc,
        descriptionEnabled: descUpdated ? true : prev.descriptionEnabled,
      };
    });

    showToast('Applied all safe AI suggestions!', 'success');
  };

  const handleApplyRewrittenDescription = (newText: string) => {
    setData((prev) => ({
      ...prev,
      description: newText,
      descriptionEnabled: true,
    }));
    showToast('Applied AI rewritten professional description!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <Navbar
        onGenerate={handleGenerateBioData}
        onDownloadPdf={handleDownloadPdf}
        onPrint={handlePrint}
        onResetClick={() => setIsResetModalOpen(true)}
        onLoadSample={handleLoadSample}
        onOpenAiReview={() => setIsAiReviewOpen(true)}
        isGeneratingPdf={isGeneratingPdf}
        isValidated={isValidated}
        onDownloadImage={handleDownloadImage}
        onDownloadZip={handleDownloadZip}
        isExportingImage={isExportingImage}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-top-4 duration-200 no-print">
          <div
            className={`p-3.5 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-800 text-white border-amber-600'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
            )}
            <span className="flex-1">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Mobile Mode Switcher (Form / Preview) */}
      <div className="lg:hidden sticky top-16 z-20 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between no-print shadow-xs">
        <div className="flex w-full rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTabMobile('form')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTabMobile === 'form'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMobile('preview')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTabMobile === 'preview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View CV Preview</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Section */}
          <div
            className={`lg:col-span-6 form-container ${
              activeTabMobile === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Header with 3 Top Tabs */}
            <div className="mb-5 no-print">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>CV Customizer</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      SS TELECOM
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Edit details, customize layout formats, adjust colors, and rearrange sections.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAiReviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Review</span>
                </button>
              </div>

              {/* 3 Main Tabs: Content, Layout, Colors */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl border border-slate-300/70">
                <button
                  type="button"
                  onClick={() => setActiveLeftTab('content')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition ${
                    activeLeftTab === 'content'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate">1. CV Content</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLeftTab('layout')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition ${
                    activeLeftTab === 'layout'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span className="truncate">2. Layout & Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveLeftTab('colors')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition ${
                    activeLeftTab === 'colors'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="truncate">3. Custom Colors</span>
                </button>
              </div>
            </div>

            {/* TAB 1: CV Content & Details */}
            {activeLeftTab === 'content' && (
              <div className="space-y-6">
                <PersonalInformationForm
                  data={data.personal}
                  onChange={handlePersonalChange}
                />

                <ProfessionalDescriptionSection
                  description={data.description}
                  enabled={data.descriptionEnabled}
                  onChange={handleDescriptionChange}
                  cvData={data}
                />

                <EducationSection
                  rows={data.education}
                  onChange={handleEducationChange}
                />

                <TechnicalQualificationSection
                  rows={data.technical}
                  onChange={handleTechnicalChange}
                />

                <AdditionalInformationSection
                  sections={data.additionalSections}
                  onChange={handleAdditionalChange}
                />

                <DeclarationSection
                  declaration={data.declaration}
                  onChange={handleDeclarationChange}
                  hasDigitalSignature={
                    !!(data.signature?.isEnabled && data.signature?.processedImageUrl)
                  }
                />

                <SignatureUploadSection
                  signature={data.signature}
                  onChange={handleSignatureChange}
                />
              </div>
            )}

            {/* TAB 2: Layout Design & Section Reordering */}
            {activeLeftTab === 'layout' && (
              <div className="space-y-6">
                <LayoutDesignPanel
                  selectedFormat={selectedFormat}
                  onSelectFormat={setSelectedFormat}
                  documentTitle={data.documentTitle || 'BIO-DATA'}
                  onSelectDocumentTitle={handleSelectDocumentTitle}
                />

                <SectionReorderPanel
                  order={data.sectionOrder || DEFAULT_SECTION_ORDER}
                  onChange={handleSectionOrderChange}
                />
              </div>
            )}

            {/* TAB 3: Custom Colors & Themes */}
            {activeLeftTab === 'colors' && (
              <div className="space-y-6">
                <ColorCustomizer
                  colors={colors}
                  onChange={setColors}
                  activePresetId={selectedTheme}
                  onSelectPreset={handleSelectTheme}
                />
              </div>
            )}

            {/* Bottom Form Actions */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mt-6 mb-10 no-print">
              <span className="text-xs text-slate-500">
                Ready to review and print your Bio-Data?
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateBioData}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  Generate Bio-Data
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg transition"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live A4 Preview Section */}
          <div
            id="preview-column"
            className={`preview-column lg:col-span-6 lg:sticky lg:top-20 ${
              activeTabMobile === 'preview' ? 'block' : 'hidden lg:block'
            }`}
          >
            <PreviewWrapper
              data={data}
              colors={colors}
              selectedTheme={selectedTheme}
              onSelectTheme={handleSelectTheme}
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
              typography={typography}
              onChangeTypography={setTypography}
              onResetTypography={() => {
                setTypography(DEFAULT_TYPOGRAPHY);
                showToast('Text settings reset to standard', 'success');
              }}
              onPrint={handlePrint}
              onDownloadPdf={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
              onDownloadImage={handleDownloadImage}
              onDownloadZip={handleDownloadZip}
              isExportingImage={isExportingImage}
              onOpenColorCustomizer={() => {
                setActiveLeftTab('colors');
                if (window.innerWidth < 1024) {
                  setActiveTabMobile('form');
                }
              }}
            />
          </div>
        </div>
      </main>

      {/* Floating Action Switcher for Mobile when viewing Preview */}
      {activeTabMobile === 'preview' && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between no-print border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTabMobile('form')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Back to Edit
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      )}

      {/* AI Review CV Modal */}
      <AIReviewModal
        isOpen={isAiReviewOpen}
        onClose={() => setIsAiReviewOpen(false)}
        cvData={data}
        onApplySuggestion={handleApplyAiSuggestion}
        onApplyAllSafe={handleApplyAllAiSafe}
        onApplyRewrittenDescription={handleApplyRewrittenDescription}
      />

      {/* Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
