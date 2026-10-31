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
import { ShareQRCodeModal } from './components/ShareQRCodeModal';
import { QRScannerModal } from './components/QRScannerModal';
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
  QrCode,
  ScanLine,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  X,
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
  const [isShareQrOpen, setIsShareQrOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isViewingSharedCv, setIsViewingSharedCv] = useState(false);
  const [showDirectDownloadCard, setShowDirectDownloadCard] = useState(false);
  const [sharedBannerInfo, setSharedBannerInfo] = useState<{
    candidateName: string;
    createdAt?: string;
    shareId?: string;
  } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);
  const [isValidated, setIsValidated] = useState(false);

  // Auto-save indicator tracking
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());
  const isInitialSaveMount = React.useRef(false);

  // Central loader for shared CV from either URL or QR Scanner
  const loadSharedCv = async (shareId: string, autoDownload: boolean = false) => {
    try {
      showToast('Retrieving CV details from QR Code...', 'info' as any);
      const res = await fetch(`/api/share-cv/${shareId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const shared = json.data;
        if (shared.cvData) setData(shared.cvData);
        if (shared.colors) setColors(shared.colors);
        if (shared.themeId) setSelectedTheme(shared.themeId);
        if (shared.formatId) setSelectedFormat(shared.formatId);
        if (shared.typography) setTypography(shared.typography);
        setIsViewingSharedCv(true);
        setSharedBannerInfo({
          candidateName: shared.cvData?.personal?.fullName || 'Candidate',
          createdAt: shared.createdAt,
          shareId: shared.id || shareId,
        });
        setActiveTabMobile('preview');
        showToast('Successfully loaded CV from QR scan!', 'success');

        if (autoDownload) {
          setShowDirectDownloadCard(true);
          // Wait briefly for preview DOM nodes to render before triggering download
          setTimeout(() => {
            handleDownloadPdf();
          }, 750);
        }
      } else {
        showToast('Could not find shared CV. The link may have expired.', 'error');
      }
    } catch (err) {
      console.warn('Error loading shared CV:', err);
      showToast('Failed to load shared CV. Please check connection.', 'error');
    }
  };

  // Check for shared CV in URL query params on initial load (?cv=... or ?preview=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('cv');
      const action = params.get('action') || (params.get('download') ? 'download' : null);

      if (action === 'download') {
        setShowDirectDownloadCard(true);
      }

      if (shareId) {
        loadSharedCv(shareId, action === 'download');
      } else {
        const preview = params.get('preview');
        if (preview) {
          try {
            const decoded = JSON.parse(decodeURIComponent(atob(preview)));
            if (decoded) {
              setIsViewingSharedCv(true);
              setSharedBannerInfo({
                candidateName: decoded.n || 'Candidate',
              });
              setActiveTabMobile('preview');
              if (action === 'download') {
                setShowDirectDownloadCard(true);
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Error reading share URL param:', e);
    }
  }, []);

  // Save data to localStorage on changes (safeguard: do NOT overwrite draft if viewing shared CV)
  useEffect(() => {
    if (!isInitialSaveMount.current) {
      isInitialSaveMount.current = true;
      return;
    }
    if (isViewingSharedCv) {
      // Do not overwrite user's local working copy when viewing someone else's shared CV!
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (e) {
        console.warn('Failed to save data to localStorage:', e);
        setSaveStatus('saved');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [data, isViewingSharedCv]);

  // Save theme selection
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, selectedTheme);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (e) {
      // ignore
    }
  }, [selectedTheme]);

  // Save colors selection
  useEffect(() => {
    try {
      localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (e) {
      // ignore
    }
  }, [colors]);

  // Save format selection
  useEffect(() => {
    try {
      localStorage.setItem(FORMAT_KEY, selectedFormat);
      setSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch (e) {
      // ignore
    }
  }, [selectedFormat]);

  // Save typography selection
  useEffect(() => {
    try {
      localStorage.setItem(TYPOGRAPHY_KEY, JSON.stringify(typography));
      setSaveStatus('saved');
      setLastSavedAt(new Date());
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
        onOpenShareQr={() => setIsShareQrOpen(true)}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        isGeneratingPdf={isGeneratingPdf}
        isValidated={isValidated}
        onDownloadImage={handleDownloadImage}
        onDownloadZip={handleDownloadZip}
        isExportingImage={isExportingImage}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />

      {/* Shared CV Online Viewer Banner & Quick Action Suite */}
      {isViewingSharedCv && (
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg no-print border-b-2 border-indigo-500/40 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-400/40 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-indigo-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  Viewing {sharedBannerInfo?.candidateName}'s CV
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>Verified via QR Code</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-300 block">
                Official single-page Indian A4 Bio-Data ready for instant download or print
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20 active:scale-95 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* High-Impact Instant PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:from-indigo-700 active:to-violet-800 text-white rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-indigo-500/25 active:scale-95 ring-2 ring-indigo-400/30"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white animate-bounce" />
                  <span>Download A4 PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  showToast('Copied CV share link to clipboard!', 'success');
                } catch {
                  showToast('Unable to copy link', 'warning');
                }
              }}
              title="Copy share link"
              className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-lg transition cursor-pointer border border-white/15"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                window.history.pushState({}, '', window.location.pathname);
                setIsViewingSharedCv(false);
                setSharedBannerInfo(null);
                setShowDirectDownloadCard(false);
                // Reload local draft from storage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                  try {
                    setData(JSON.parse(saved));
                  } catch {}
                }
                showToast('Returned to your personal CV draft', 'info' as any);
              }}
              className="px-2.5 py-1.5 text-indigo-300 hover:text-white text-xs font-semibold cursor-pointer underline underline-offset-2 transition"
            >
              Exit Shared View
            </button>
          </div>
        </div>
      )}

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

      {/* SS TELECOM Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 no-print">
        <a
          href="https://ss-telecom.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="print:hidden flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow hover:shadow-lg transition cursor-pointer"
        >
          <div>
            <p className="font-bold text-sm">📱 SS TELECOM, Paikpara</p>
            <p className="text-xs opacity-90">Mobile Repairing • Accessories • Online Services</p>
          </div>
          <span className="text-xs font-semibold bg-white text-indigo-700 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xs hover:bg-indigo-50">
            Visit Website →
          </span>
        </a>
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
              onOpenShareQr={() => setIsShareQrOpen(true)}
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
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between no-print border border-slate-700/80 animate-in slide-in-from-bottom duration-300">
          {!isViewingSharedCv ? (
            <button
              type="button"
              onClick={() => setActiveTabMobile('form')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Back to Edit</span>
            </button>
          ) : (
            <div className="truncate mr-2">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                Scanned CV
              </span>
              <span className="text-xs font-bold text-white truncate block">
                {sharedBannerInfo?.candidateName || 'Candidate'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition active:scale-95"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-lg shadow-md transition"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
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

      {/* Share via QR Code Modal */}
      <ShareQRCodeModal
        isOpen={isShareQrOpen}
        onClose={() => setIsShareQrOpen(false)}
        data={data}
        colors={colors}
        themeId={selectedTheme}
        formatId={selectedFormat}
        typography={typography}
        onOpenScanner={() => setIsQrScannerOpen(true)}
      />

      {/* QR Scanner Tool Modal */}
      <QRScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onCvLoaded={(shareId, autoDownload) => {
          loadSharedCv(shareId, autoDownload);
        }}
      />

      {/* Direct Download Pop-up for QR Scans */}
      {showDirectDownloadCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-200 max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
              <Download className="w-8 h-8 text-indigo-600 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                QR Scanner Detected
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                {sharedBannerInfo?.candidateName || 'Candidate'}'s CV
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Print-ready standard Indian A4 single page format. Ready for instant download.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await handleDownloadPdf();
                  setShowDirectDownloadCard(false);
                }}
                disabled={isGeneratingPdf}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>Download A4 PDF Now</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDirectDownloadCard(false)}
                className="w-full py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Preview Document First
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
