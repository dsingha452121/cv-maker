import { AIReviewResult, AISuggestion, BioDataState } from '../types/biodata';

/**
 * Performs a comprehensive local rule-based CV audit.
 * Used when Gemini API is offline or as an instant local validator.
 */
export function performLocalCVReview(data: BioDataState): AIReviewResult {
  const suggestions: AISuggestion[] = [];
  const strengths: string[] = [];
  let score = 95;

  // 1. Check Full Name
  if (!data.personal.fullName?.trim()) {
    score -= 15;
    suggestions.push({
      id: 'sug-name',
      section: 'Personal Details',
      category: 'completeness',
      title: 'Full Name Missing',
      issue: 'Candidate name is empty in the personal details section.',
      suggestion: 'Enter your official full name as printed on matriculation certificates.',
      originalText: 'N/A (Empty)',
      suggestedText: 'e.g. RAHUL SHARMA',
      reason: 'A resume cannot be evaluated without clear candidate identification.',
      isCritical: true,
      targetField: 'personal',
    });
  } else if (data.personal.fullName.trim() === data.personal.fullName.toLowerCase()) {
    score -= 3;
    suggestions.push({
      id: 'sug-name-case',
      section: 'Personal Details',
      category: 'formatting',
      title: 'Capitalize Full Name',
      issue: 'Your full name is entered in lowercase.',
      suggestion: 'Formal job applications in India prefer CAPITALIZED names (e.g. "RAHUL SHARMA").',
      originalText: data.personal.fullName,
      suggestedText: data.personal.fullName.toUpperCase(),
      reason: 'Uppercase names stand out clearly and align with government and PSU recruitment norms.',
      isCritical: false,
      targetField: 'personal',
      replacementValue: data.personal.fullName.toUpperCase(),
    });
  } else {
    strengths.push('Full name is clearly specified.');
  }

  // 2. Mobile Number Check
  const digits = (data.personal.mobileNumber || '').replace(/\D/g, '');
  if (!digits) {
    score -= 10;
    suggestions.push({
      id: 'sug-phone',
      section: 'Personal Details',
      category: 'completeness',
      title: 'Mobile Number Missing',
      issue: 'No contact mobile number provided.',
      suggestion: 'Add an active 10-digit mobile number so employers can contact you for interviews.',
      originalText: 'N/A (Empty)',
      suggestedText: '10-digit mobile number',
      reason: 'Recruiters call or WhatsApp candidates based on the primary mobile number.',
      isCritical: true,
      targetField: 'personal',
    });
  } else if (digits.length !== 10) {
    score -= 5;
    suggestions.push({
      id: 'sug-phone-len',
      section: 'Personal Details',
      category: 'consistency',
      title: '10-Digit Mobile Number Format',
      issue: `Mobile number has ${digits.length} digits instead of standard 10 digits.`,
      suggestion: 'Verify your phone number has 10 digits without unnecessary country prefixes.',
      originalText: data.personal.mobileNumber,
      suggestedText: digits.slice(-10),
      reason: 'Standard 10-digit Indian numbers are required for SMS/call verification.',
      isCritical: true,
      targetField: 'personal',
      replacementValue: digits.slice(-10),
    });
  } else {
    strengths.push('Valid 10-digit primary mobile contact provided.');
  }

  // 3. Email Check
  if (!data.personal.emailId?.trim()) {
    score -= 5;
    suggestions.push({
      id: 'sug-email',
      section: 'Personal Details',
      category: 'completeness',
      title: 'Add Email Address',
      issue: 'Email address is currently blank.',
      suggestion: 'Adding a professional email address improves recruiter communication.',
      originalText: 'N/A (Empty)',
      suggestedText: 'firstname.lastname@gmail.com',
      reason: 'Written interview invitations and appointment letters require an email.',
      isCritical: false,
      targetField: 'personal',
    });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal.emailId.trim())) {
    score -= 5;
    suggestions.push({
      id: 'sug-email-fmt',
      section: 'Personal Details',
      category: 'grammar',
      title: 'Invalid Email Format',
      issue: 'Email address appears to have formatting errors.',
      suggestion: 'Ensure email contains standard username, @ symbol, and valid domain.',
      originalText: data.personal.emailId,
      suggestedText: data.personal.emailId.trim().toLowerCase(),
      reason: 'Invalid email addresses lead to failed candidate communications.',
      isCritical: true,
      targetField: 'personal',
      replacementValue: data.personal.emailId.trim().toLowerCase(),
    });
  } else {
    strengths.push('Professional email address included.');
  }

  // 4. Address Check
  if (!data.personal.pinCode?.trim()) {
    score -= 5;
    suggestions.push({
      id: 'sug-pin',
      section: 'Personal Details',
      category: 'completeness',
      title: 'Include 6-Digit Postal PIN Code',
      issue: 'Postal PIN code is missing.',
      suggestion: 'Indian recruitment verification requires a 6-digit PIN code in permanent address.',
      originalText: 'N/A (Missing)',
      suggestedText: '6-digit PIN code',
      reason: 'Police verification and background checks require an accurate PIN code.',
      isCritical: false,
      targetField: 'personal',
    });
  } else if (data.personal.pinCode.trim().length !== 6) {
    score -= 3;
    suggestions.push({
      id: 'sug-pin-len',
      section: 'Personal Details',
      category: 'consistency',
      title: 'PIN Code Length Verification',
      issue: 'PIN code is not 6 digits.',
      suggestion: 'Ensure your postal PIN code contains exactly 6 numeric digits.',
      originalText: data.personal.pinCode,
      suggestedText: data.personal.pinCode.replace(/\D/g, '').slice(0, 6),
      reason: 'Postal PIN codes in India are exactly 6 digits.',
      isCritical: false,
      targetField: 'personal',
      replacementValue: data.personal.pinCode.replace(/\D/g, '').slice(0, 6),
    });
  }

  // 5. Professional Description Check
  if (!data.description?.trim()) {
    score -= 8;
    suggestions.push({
      id: 'sug-desc',
      section: 'Professional Description',
      category: 'completeness',
      title: 'Add a Professional Description / Career Objective',
      issue: 'Your CV does not include a career profile or objective summary.',
      suggestion: 'Add a 2-3 sentence career objective introducing your career goals and reliability.',
      originalText: 'N/A (Empty)',
      suggestedText:
        'A dedicated and responsible candidate seeking an opportunity to contribute effectively to organizational growth while developing my professional skills.',
      reason: 'A professional statement gives recruiters an immediate summary of your motivation.',
      isCritical: false,
      targetField: 'description',
      replacementValue:
        'A dedicated and responsible candidate seeking an opportunity to contribute effectively to organizational growth while developing my professional skills.',
    });
  } else {
    strengths.push('Includes a clear professional summary statement.');
    const text = data.description;
    let polished = text;

    if (/\bi\s/g.test(text)) {
      polished = polished.replace(/\bi\s/g, 'I ');
      suggestions.push({
        id: 'sug-desc-i',
        section: 'Professional Description',
        category: 'grammar',
        title: 'Capitalize pronoun "I"',
        issue: 'Found lowercase "i" instead of capitalized "I".',
        suggestion: 'Capitalize "I" for grammatical correctness.',
        originalText: text,
        suggestedText: polished,
        reason: 'Grammatical precision reflects professionalism.',
        isCritical: true,
        targetField: 'description',
        replacementValue: polished,
      });
    }

    if (text.length < 50) {
      score -= 3;
      suggestions.push({
        id: 'sug-desc-short',
        section: 'Professional Description',
        category: 'clarity',
        title: 'Expand Professional Description',
        issue: 'Professional description is very brief (under 50 characters).',
        suggestion: 'Expand to 2-3 sentences mentioning your reliability, work ethic, and desire to contribute.',
        originalText: text,
        suggestedText: `${text} Committed to working sincerely, learning company protocols rapidly, and maintaining high team standards.`,
        reason: 'Short one-liners do not adequately convey candidate strengths.',
        isCritical: false,
        targetField: 'description',
        replacementValue: `${text} Committed to working sincerely, learning company protocols rapidly, and maintaining high team standards.`,
      });
    }
  }

  // 6. Education Qualification Checks
  const validEdu = data.education.filter(
    (e) => e.examination?.trim() || e.boardUniversity?.trim()
  );
  if (validEdu.length === 0) {
    score -= 15;
    suggestions.push({
      id: 'sug-edu-empty',
      section: 'Educational Qualifications',
      category: 'completeness',
      title: 'Add Educational Qualifications',
      issue: 'No educational entries have been added.',
      suggestion: 'Add at least your 10th / Secondary or highest qualification.',
      originalText: 'No rows added',
      suggestedText: '10th / Secondary examination',
      reason: 'Academic records are mandatory for nearly all formal job roles.',
      isCritical: true,
      targetField: 'education',
    });
  } else {
    strengths.push(`Contains ${validEdu.length} documented academic qualification(s).`);

    // Check total vs obtained marks
    for (const edu of validEdu) {
      const ob = parseFloat(edu.marksObtained);
      const tot = parseFloat(edu.totalMarks);
      if (!isNaN(ob) && !isNaN(tot) && tot > 0 && ob > tot) {
        score -= 5;
        suggestions.push({
          id: `sug-edu-marks-${edu.id}`,
          section: 'Educational Qualifications',
          category: 'consistency',
          title: `Marks Alert in ${edu.examination || 'Qualification'}`,
          issue: `Marks obtained (${ob}) is greater than total marks (${tot}).`,
          suggestion: 'Please verify the marks values in your education table.',
          originalText: `Obtained: ${ob}, Total: ${tot}`,
          suggestedText: `Obtained should be less than or equal to Total`,
          reason: 'Incorrect mark ratios are immediately flagged during document verification.',
          isCritical: true,
          targetField: 'education',
        });
      }
    }
  }

  // 7. Technical Skills & Additional Sections
  const enabledAdditional = data.additionalSections.filter(
    (s) => s.enabled && s.content?.trim()
  );
  if (enabledAdditional.length === 0 && data.technical.length === 0) {
    suggestions.push({
      id: 'sug-skills-empty',
      section: 'Technical Skills & Experience',
      category: 'ats',
      title: 'Highlight Technical Skills or Experience',
      issue: 'No technical qualifications or skills sections are enabled.',
      suggestion: 'Enable "Technical Skills" in the Additional Information panel to make your CV ATS-friendly.',
      originalText: 'None enabled',
      suggestedText: 'e.g. Basic Computer, MS Office, Typing',
      reason: 'Modern Indian employers look for computer skills and specific practical strengths.',
      isCritical: false,
      targetField: 'skills',
    });
  } else {
    strengths.push('Technical qualifications / skills are actively showcased.');
  }

  // 8. Photo Check
  if (data.personal.photoUrl) {
    strengths.push('Formal passport photograph uploaded.');
  } else {
    suggestions.push({
      id: 'sug-photo',
      section: 'Personal Details',
      category: 'formatting',
      title: 'Attach Passport Photograph',
      issue: 'No digital passport photograph attached.',
      suggestion: 'You can upload a clean passport photo or affix a physical photo after printing.',
      originalText: 'Passport box empty',
      suggestedText: 'Upload 3.5cm x 4.5cm formal photo',
      reason: 'Physical/digital photographs are standard in formal Indian Bio-Data submissions.',
      isCritical: false,
      targetField: 'personal',
    });
  }

  score = Math.max(50, Math.min(100, score));

  let feedback = 'Your CV is well-structured and ready for job applications.';
  if (score < 70) {
    feedback = 'Your Bio-Data is missing several important fields. Review the suggestions below to strengthen your application.';
  } else if (score < 85) {
    feedback = 'Good foundation! A few minor touch-ups will give your CV a polished, professional edge.';
  }

  return {
    score,
    overallFeedback: feedback,
    strengths: strengths.length > 0 ? strengths : ['Basic layout established.'],
    suggestions,
    rewrittenDescription: data.description?.trim()
      ? {
          before: data.description,
          after:
            'A motivated and responsible candidate eager to learn new skills and contribute positively to an organization. Committed to completing assigned tasks sincerely and maintaining high standards of workplace integrity.',
        }
      : undefined,
    isLocalRuleBased: true,
  };
}
