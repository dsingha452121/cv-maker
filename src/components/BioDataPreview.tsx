/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BioDataState,
  COLOR_THEME_PRESETS,
  CVColors,
  CVColorThemeId,
  CVFormatId,
  CVSectionId,
  DEFAULT_SECTION_ORDER,
  TypographySettings,
  DEFAULT_TYPOGRAPHY,
} from '../types/biodata';
import {
  formatDisplayDate,
  formatFullAddress,
  getRowDisplayPercentage,
} from '../utils/calculator';
import { A4Page } from './A4Page';

interface BioDataPreviewProps {
  data: BioDataState;
  colors?: CVColors;
  themeId?: CVColorThemeId;
  formatId?: CVFormatId;
  showPhotoPlaceholder?: boolean;
  typography?: TypographySettings;
  onScaleChange?: (scale: number, isOverflown: boolean) => void;
}

export const BioDataPreview: React.FC<BioDataPreviewProps> = ({
  data,
  colors,
  themeId = 'classic-black',
  formatId = 'classic',
  showPhotoPlaceholder = true,
  typography = DEFAULT_TYPOGRAPHY,
  onScaleChange,
}) => {
  const {
    personal,
    description,
    descriptionEnabled,
    education,
    technical,
    additionalSections,
    declaration,
    signature,
    sectionOrder = DEFAULT_SECTION_ORDER,
  } = data;

  // Active theme colors
  const activeColors: CVColors =
    colors ||
    COLOR_THEME_PRESETS[themeId]?.colors ||
    COLOR_THEME_PRESETS['classic-black'].colors;

  const fullAddress = formatFullAddress(personal);
  const displayDob = formatDisplayDate(personal.dateOfBirth);
  const displayDeclarationDate = formatDisplayDate(declaration.date);

  const formatAadhaarDisplay = (num?: string, masked: boolean = true) => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    if (digits.length < 4) return digits;
    if (masked) {
      const last4 = digits.slice(-4);
      return `XXXX XXXX ${last4}`;
    }
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Filter valid entries
  const validEducation = education.filter(
    (e) =>
      e.examination?.trim() ||
      e.boardUniversity?.trim() ||
      e.year?.trim() ||
      e.marksObtained?.trim() ||
      e.totalMarks?.trim() ||
      (e.isManualPercentage && e.manualPercentage?.trim())
  );

  const validTechnical = technical.filter(
    (t) => t.courseName?.trim() || t.institute?.trim() || t.details?.trim()
  );

  const getAdditionalSection = (key: string) =>
    additionalSections.find((s) => s.key === key && s.enabled && s.content?.trim());

  // Template format identifiers
  const isCompact = formatId === 'compact';
  const isModern = formatId === 'modern';
  const isTraditional = formatId === 'traditional';
  const isMinimal = formatId === 'minimal';
  const isBoxed = formatId === 'boxed';

  // Section Heading Renderer
  const renderSectionHeading = (title: string) => {
    if (isModern) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            marginBottom: 'calc(var(--gap, 16px) * 0.4)',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '1.1em',
              backgroundColor: activeColors.accentColor,
              borderRadius: '2px',
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              fontSize: '1.05em',
              fontWeight: 'var(--heading-fw, 700)',
              color: activeColors.sectionHeadingColor,
              margin: 0,
            }}
          >
            {title}:-
          </h2>
        </div>
      );
    }

    if (isTraditional) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4em',
            marginBottom: 'calc(var(--gap, 16px) * 0.4)',
          }}
        >
          <span style={{ color: activeColors.accentColor, fontSize: '0.8em' }}>◆</span>
          <h2
            style={{
              fontSize: '1.05em',
              fontWeight: 'var(--heading-fw, 700)',
              color: activeColors.sectionHeadingColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: `1px solid ${activeColors.accentColor}`,
              paddingBottom: '2px',
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
      );
    }

    if (isMinimal) {
      return (
        <div
          style={{
            marginBottom: 'calc(var(--gap, 16px) * 0.4)',
            paddingTop: '2px',
            borderTop: `1px solid ${activeColors.accentColor}`,
          }}
        >
          <h2
            style={{
              fontSize: '1em',
              fontWeight: 'var(--heading-fw, 700)',
              color: activeColors.sectionHeadingColor,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '3px 0 0 0',
            }}
          >
            {title}
          </h2>
        </div>
      );
    }

    // Classic / Compact / Boxed standard heading
    return (
      <h2
        style={{
          fontSize: '1.05em',
          fontWeight: 'var(--heading-fw, 700)',
          color: activeColors.sectionHeadingColor,
          marginBottom: 'calc(var(--gap, 16px) * 0.4)',
          margin: '0 0 calc(var(--gap, 16px) * 0.4) 0',
        }}
      >
        {title}:-
      </h2>
    );
  };

  // Field Row Component satisfying Part 1.3
  const renderFieldRow = (
    label: string,
    value: React.ReactNode,
    isBoldValue: boolean = false,
    isUppercase: boolean = false,
    key?: string
  ) => {
    return (
      <div
        key={key || label}
        className="bio-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '11em 1em 1fr',
          alignItems: 'start',
          columnGap: 0,
          marginBottom: 'calc(var(--gap, 16px) * 0.35)',
        }}
      >
        <div
          style={{
            fontWeight: 'var(--fw, 500)',
            color: isModern ? activeColors.sectionHeadingColor : undefined,
            wordBreak: 'normal',
          }}
        >
          {label}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontWeight: 'var(--fw, 500)',
          }}
        >
          :
        </div>
        <div
          style={{
            minWidth: 0,
            overflowWrap: 'anywhere',
            fontWeight: isBoldValue ? '700' : 'inherit',
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '0.03em' : 'normal',
          }}
        >
          {value || '—'}
        </div>
      </div>
    );
  };

  // Section content renderers
  const renderSection = (sectionId: CVSectionId) => {
    switch (sectionId) {
      case 'personal':
        return (
          <div
            key="section-personal"
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {isBoxed && renderSectionHeading('Personal Details')}
            {/* Grid for details + photo (Part 1.4) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                columnGap: '1.5em',
                alignItems: 'start',
              }}
            >
              {/* Left Column: Field Rows */}
              <div style={{ minWidth: 0, color: activeColors.bodyTextColor }}>
                {renderFieldRow('1. Name', personal.fullName, true, true)}
                {renderFieldRow("2. Father's Name", personal.fatherName)}
                {personal.motherName?.trim() &&
                  renderFieldRow("3. Mother's Name", personal.motherName)}
                {renderFieldRow(
                  personal.motherName?.trim() ? '4. Date of Birth' : '3. Date of Birth',
                  displayDob
                )}
                {renderFieldRow(
                  personal.motherName?.trim()
                    ? '5. Permanent Address'
                    : '4. Permanent Address',
                  fullAddress
                )}
                {renderFieldRow(
                  personal.motherName?.trim() ? '6. Mobile No.' : '5. Mobile No.',
                  personal.mobileNumber,
                  true
                )}
                {personal.emailId?.trim() &&
                  renderFieldRow(
                    personal.motherName?.trim() ? '7. Email ID' : '6. Email ID',
                    personal.emailId
                  )}
                {renderFieldRow('Marital Status', personal.maritalStatus || 'Unmarried')}
                {renderFieldRow('Gender', personal.gender || 'Male')}
                {renderFieldRow('Religion', personal.religion || '—')}
                {renderFieldRow('Nationality', personal.nationality || 'Indian')}
                {renderFieldRow('Languages Known', personal.languagesKnown || '—')}
                {personal.includeAadhaarInCv && personal.aadhaarNumber?.trim() && (
                  <div
                    key="aadhaar-row"
                    className="bio-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '11em 1em 1fr',
                      alignItems: 'start',
                      columnGap: 0,
                      marginBottom: 'calc(var(--gap, 16px) * 0.35)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 'var(--fw, 500)',
                        color: isModern ? activeColors.sectionHeadingColor : undefined,
                      }}
                    >
                      Aadhaar No.
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'var(--fw, 500)' }}>:</div>
                    <div
                      style={{
                        minWidth: 0,
                        overflowWrap: 'anywhere',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {formatAadhaarDisplay(
                        personal.aadhaarNumber,
                        personal.maskAadhaarInCv !== false
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Photo Box (Part 1.4) */}
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    width: 'calc(var(--base-fs, 14px) * 8 * var(--photo-scale, 1.2))',
                    aspectRatio: '3 / 4',
                    border: `1px solid ${activeColors.outerBorderColor}`,
                    backgroundColor: '#ffffff',
                    padding: '3px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {personal.photoUrl ? (
                    <img
                      src={personal.photoUrl}
                      alt="Applicant"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        display: 'block',
                      }}
                    />
                  ) : showPhotoPlaceholder ? (
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        border: '1px dashed #9ca3af',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: '0.72em',
                        lineHeight: 1.3,
                        color: '#6b7280',
                        fontWeight: 500,
                        padding: '2px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span>AFFIX</span>
                      <span>PASSPORT SIZE</span>
                      <span>PHOTO</span>
                      <span style={{ fontSize: '0.85em', marginTop: '2px', color: '#9ca3af' }}>
                        (Self-Attested)
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );

      case 'description':
        if (!descriptionEnabled || !description?.trim()) return null;
        return (
          <div
            key="section-description"
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {renderSectionHeading('Professional Description')}
            <p
              style={{
                color: activeColors.bodyTextColor,
                margin: 0,
                textAlign: 'justify',
                lineHeight: 'var(--lh, 1.5)',
              }}
            >
              {description}
            </p>
          </div>
        );

      case 'education':
        return (
          <div
            key="section-education"
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {renderSectionHeading('Education Qualification')}
            <table
              style={{
                width: '100%',
                maxWidth: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: `1px solid ${activeColors.tableBorderColor}`,
                color: activeColors.bodyTextColor,
                fontSize: 'inherit',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: activeColors.tableHeaderBgColor }}>
                  <th
                    style={{
                      width: '24%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Examination
                  </th>
                  <th
                    style={{
                      width: '24%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Board / University
                  </th>
                  <th
                    style={{
                      width: '10%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Year
                  </th>
                  <th
                    style={{
                      width: '14%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Total Marks
                  </th>
                  <th
                    style={{
                      width: '14%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Marks Obtained
                  </th>
                  <th
                    style={{
                      width: '14%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      fontSize: 'inherit',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {validEducation.length > 0 ? (
                  validEducation.map((row) => (
                    <tr key={row.id}>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          fontWeight: 600,
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.examination || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.boardUniversity || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.year || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.totalMarks || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.marksObtained || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          fontWeight: 600,
                          wordBreak: 'break-word',
                        }}
                      >
                        {getRowDisplayPercentage(row)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        border: `1px solid ${activeColors.tableBorderColor}`,
                        padding: '0.5em',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        fontSize: '0.9em',
                      }}
                    >
                      (No qualifications entered yet. Use the form to add education details.)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'technical':
        if (validTechnical.length === 0) return null;
        return (
          <div
            key="section-technical"
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {renderSectionHeading('Technical Qualification / Course')}
            <table
              style={{
                width: '100%',
                maxWidth: '100%',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                border: `1px solid ${activeColors.tableBorderColor}`,
                color: activeColors.bodyTextColor,
                fontSize: 'inherit',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: activeColors.tableHeaderBgColor }}>
                  <th
                    style={{
                      width: '32%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      wordBreak: 'break-word',
                    }}
                  >
                    Course / Certificate
                  </th>
                  <th
                    style={{
                      width: '32%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      wordBreak: 'break-word',
                    }}
                  >
                    Institute / Organization
                  </th>
                  <th
                    style={{
                      width: '18%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      wordBreak: 'break-word',
                    }}
                  >
                    Duration
                  </th>
                  <th
                    style={{
                      width: '18%',
                      border: `1px solid ${activeColors.tableBorderColor}`,
                      color: activeColors.tableHeaderTextColor,
                      padding: '0.4em 0.5em',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      wordBreak: 'break-word',
                    }}
                  >
                    Year
                  </th>
                </tr>
              </thead>
              <tbody>
                {validTechnical.map((tech) => (
                  <React.Fragment key={tech.id}>
                    <tr>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          fontWeight: 600,
                          wordBreak: 'break-word',
                        }}
                      >
                        {tech.courseName || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          wordBreak: 'break-word',
                        }}
                      >
                        {tech.institute || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                        }}
                      >
                        {tech.duration || '—'}
                      </td>
                      <td
                        style={{
                          border: `1px solid ${activeColors.tableBorderColor}`,
                          padding: '0.4em 0.5em',
                          textAlign: 'center',
                          wordBreak: 'break-word',
                        }}
                      >
                        {tech.year || '—'}
                      </td>
                    </tr>
                    {tech.details?.trim() && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            border: `1px solid ${activeColors.tableBorderColor}`,
                            padding: '0.35em 0.5em',
                            fontSize: '0.9em',
                            backgroundColor: '#f8fafc',
                            wordBreak: 'break-word',
                          }}
                        >
                          <strong>Details:</strong> {tech.details}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'skills':
      case 'experience':
      case 'hobbies':
      case 'strengths': {
        const sec = getAdditionalSection(sectionId);
        if (!sec) return null;
        return (
          <div
            key={`section-${sectionId}`}
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {renderSectionHeading(sec.title)}
            <div
              style={{
                color: activeColors.bodyTextColor,
                paddingLeft: '0.8em',
                borderLeft: `2.5px solid ${activeColors.accentColor}`,
                whiteSpace: 'pre-line',
                lineHeight: 'var(--lh, 1.5)',
              }}
            >
              {sec.content}
            </div>
          </div>
        );
      }

      case 'declaration':
        if (!declaration.text?.trim()) return null;
        return (
          <div
            key="section-declaration"
            style={{
              marginBottom: 'var(--gap, 16px)',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            {renderSectionHeading('Declaration')}
            <p
              style={{
                color: activeColors.bodyTextColor,
                margin: 0,
                textAlign: 'justify',
                lineHeight: 'var(--lh, 1.5)',
              }}
            >
              {declaration.text}
            </p>
          </div>
        );

      case 'signature':
        return (
          <div
            key="section-signature"
            className="bio-signature-block"
            style={{
              marginTop: 'auto', // Pinned to bottom of the page (Part 1.7)
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: 'calc(var(--gap, 16px) * 0.4)',
              color: activeColors.bodyTextColor,
              fontSize: '1em',
              padding: isBoxed ? '10px' : undefined,
              border: isBoxed ? `1px solid ${activeColors.tableBorderColor}` : undefined,
              borderRadius: isBoxed ? '3px' : undefined,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
              <div>
                <span style={{ fontWeight: 600 }}>Date</span> :{' '}
                <span>{displayDeclarationDate || '____ / ____ / ________'}</span>
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Place</span> :{' '}
                <span>{declaration.place || '____________________'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              {signature?.isEnabled && signature?.processedImageUrl ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginLeft: 'auto',
                  }}
                >
                  <div
                    style={{
                      width: isCompact ? '38mm' : '44mm',
                      height: isCompact ? '16mm' : '20mm',
                      maxWidth: '170px',
                      maxHeight: '75px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <img
                      src={signature.processedImageUrl}
                      alt="Signature"
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        backgroundColor: 'transparent',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${activeColors.outerBorderColor}`,
                      paddingTop: '4px',
                      width: isCompact ? '180px' : '200px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '0.9em',
                    }}
                  >
                    Signature of the Applicant
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ height: isCompact ? '35px' : '45px' }} />
                  <div
                    style={{
                      borderTop: `1px solid ${activeColors.outerBorderColor}`,
                      paddingTop: '4px',
                      width: isCompact ? '180px' : '200px',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '0.9em',
                    }}
                  >
                    Signature of the Applicant
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Outer border styling
  const getOuterBorderStyle = (): React.CSSProperties => {
    if (isTraditional) {
      return {
        border: `4px double ${activeColors.outerBorderColor}`,
        padding: '16px',
      };
    }
    if (isMinimal) {
      return {
        border: `1px solid ${activeColors.outerBorderColor}`,
        padding: '18px',
      };
    }
    return {
      border: `1.5px solid ${activeColors.outerBorderColor}`,
      padding: isCompact ? '14px' : '16px',
    };
  };

  return (
    <A4Page
      typography={typography}
      onAutoFillChange={(_fs, overflown) => onScaleChange?.(1, overflown)}
      deps={[data, activeColors, formatId, showPhotoPlaceholder, typography]}
      style={{
        backgroundColor: activeColors.backgroundColor || '#ffffff',
        color: activeColors.bodyTextColor,
      }}
    >
      {/* Outer Formal Rectangular Border Frame */}
      <div
        className="bio-document-frame"
        style={{
          ...getOuterBorderStyle(),
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Document Header Title */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: isCompact ? '0.7em' : '1em',
            }}
          >
            {isModern ? (
              <div style={{ display: 'inline-block' }}>
                <h1
                  style={{
                    fontSize: '1.75em',
                    fontWeight: 'bold',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: activeColors.mainHeadingColor,
                    margin: 0,
                  }}
                >
                  {data.documentTitle || 'BIO-DATA'}
                </h1>
                <div
                  style={{
                    height: '3px',
                    width: '80px',
                    margin: '4px auto 0 auto',
                    borderRadius: '2px',
                    backgroundColor: activeColors.accentColor,
                  }}
                />
              </div>
            ) : isTraditional ? (
              <div style={{ display: 'inline-block' }}>
                <h1
                  style={{
                    fontSize: '1.75em',
                    fontWeight: 'bold',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: activeColors.mainHeadingColor,
                    borderTop: `2px solid ${activeColors.outerBorderColor}`,
                    borderBottom: `2px solid ${activeColors.outerBorderColor}`,
                    padding: '3px 24px',
                    margin: 0,
                  }}
                >
                  {data.documentTitle || 'BIO-DATA'}
                </h1>
              </div>
            ) : isMinimal ? (
              <div
                style={{
                  textAlign: 'left',
                  borderBottom: `2px solid ${activeColors.mainHeadingColor}`,
                  paddingBottom: '4px',
                  marginBottom: '0.5em',
                }}
              >
                <h1
                  style={{
                    fontSize: '1.7em',
                    fontWeight: 'bold',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: activeColors.mainHeadingColor,
                    margin: 0,
                  }}
                >
                  {data.documentTitle || 'BIO-DATA'}
                </h1>
              </div>
            ) : (
              <h1
                style={{
                  fontSize: '1.75em',
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  color: activeColors.mainHeadingColor,
                  margin: 0,
                }}
              >
                {data.documentTitle || 'BIO-DATA'}
              </h1>
            )}
          </div>

          {/* Render Sections in User-Specified Reordered Sequence */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {sectionOrder.map((sectionId) => renderSection(sectionId))}
          </div>
        </div>
      </div>
    </A4Page>
  );
};
