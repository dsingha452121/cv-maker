import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

/**
 * Sanitizes candidate CV data before sending to AI to respect candidate privacy.
 * Strictly redacts Aadhaar number, masks phone and email, and removes image binaries.
 */
function sanitizeCvForAi(cvData: any) {
  const p = cvData?.personal || {};

  // Mask phone (e.g. XXXXXX1234)
  const phoneDigits = (p.mobileNumber || '').replace(/\D/g, '');
  const maskedPhone =
    phoneDigits.length >= 4 ? `XXXXXX${phoneDigits.slice(-4)}` : '[Provided]';

  // Mask email (e.g. j***@example.com)
  let maskedEmail = '[Provided]';
  if (p.emailId && p.emailId.includes('@')) {
    const [user, domain] = p.emailId.split('@');
    maskedEmail = `${user.charAt(0)}***@${domain}`;
  }

  return {
    candidateName: p.fullName || 'Candidate',
    dateOfBirth: p.dateOfBirth || '',
    gender: p.gender || '',
    nationality: p.nationality || 'Indian',
    languagesKnown: p.languagesKnown || '',
    maskedContact: {
      phone: maskedPhone,
      email: maskedEmail,
      district: p.district || '',
      state: p.state || '',
      pinCode: p.pinCode || '',
    },
    // Note: Aadhaar is STRICTLY excluded
    currentDescription: cvData.description || '',
    education: (cvData.education || []).map((e: any) => ({
      examination: e.examination || '',
      board: e.boardUniversity || '',
      year: e.year || '',
      marks: `${e.marksObtained || ''}/${e.totalMarks || ''}`,
      percentage: e.percentage || '',
    })),
    technical: (cvData.technical || []).map((t: any) => ({
      courseName: t.courseName || '',
      institute: t.institute || '',
      duration: t.duration || '',
      year: t.year || '',
      details: t.details || '',
    })),
    additionalSections: (cvData.additionalSections || [])
      .filter((s: any) => s.enabled && s.content?.trim())
      .map((s: any) => ({
        section: s.title || s.key,
        content: s.content,
      })),
  };
}

// POST /api/ai-review
app.post('/api/ai-review', async (req, res) => {
  const { cvData } = req.body;

  if (!cvData) {
    return res.status(400).json({ error: 'Missing cvData' });
  }

  // Sanitize data (privacy-compliant: no Aadhaar, masked contact, no photo/signature)
  const sanitized = sanitizeCvForAi(cvData);

  if (!ai) {
    return res.json({
      fallbackToLocal: true,
      message: 'Gemini API key not configured. Using high-precision local rule-based review engine.',
    });
  }

  try {
    const prompt = `You are a senior recruitment specialist and CV design auditor reviewing an Indian Bio-Data / CV.
Analyze the following candidate data:
${JSON.stringify(sanitized, null, 2)}

AUDIT REQUIREMENTS:
1. Overall CV assessment with a realistic score (50-100) and 2-3 sentences overview feedback.
2. Identify 3-4 genuine strengths in the candidate's existing background.
3. Review spelling, grammar, clarity, professional phrasing, consistency, and completeness.
4. For each suggestion, provide:
   - "section": Name of the section (e.g., 'Personal Details', 'Professional Description', 'Education', 'Technical Qualifications', 'Work Experience')
   - "originalText": The exact text currently used by the candidate (or "N/A" if missing)
   - "suggestedText": The recommended replacement text
   - "reason": Clear reason explaining why this improves the CV
   - "isCritical": true if this is an actual error (spelling mistake, broken grammar, missing mandatory field); false if it is an optional stylistic or ATS improvement
   - "category": 'grammar' | 'clarity' | 'completeness' | 'consistency' | 'wording' | 'formatting' | 'ats'
   - "targetField": 'description' | 'address' | 'education' | 'skills' | 'experience' | 'declaration' | 'personal'
   - "replacementValue": The improved text ready to apply if applicable.
5. Provide a polished 2-3 sentence professional summary based strictly on the candidate's background.

RULES:
- Do NOT invent degrees, employers, diplomas, certificates, or marks not provided by the candidate.
- Distinguish real errors from optional style enhancements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Overall CV score between 50 and 100' },
            overallFeedback: { type: Type.STRING, description: '2-3 sentences overview feedback' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 strong aspects of this CV',
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  section: { type: Type.STRING },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  suggestedText: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  isCritical: { type: Type.BOOLEAN },
                  targetField: { type: Type.STRING },
                  replacementValue: { type: Type.STRING },
                },
                required: ['id', 'category', 'title', 'issue', 'suggestion'],
              },
            },
            rewrittenDescription: {
              type: Type.OBJECT,
              properties: {
                before: { type: Type.STRING },
                after: { type: Type.STRING },
              },
            },
          },
          required: ['score', 'overallFeedback', 'strengths', 'suggestions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      isLocalRuleBased: false,
    });
  } catch (error: any) {
    console.error('Gemini API review error:', error);
    return res.json({
      fallbackToLocal: true,
      error: error.message || 'Error communicating with AI service',
    });
  }
});

// POST /api/ai/review and /api/ai-review handler
const handleAiReviewRequest = async (req: express.Request, res: express.Response) => {
  const { cvData } = req.body;

  if (!cvData) {
    return res.status(400).json({ error: 'Missing cvData' });
  }

  // Sanitize data (privacy-compliant: no Aadhaar, masked contact, no photo/signature)
  const sanitized = sanitizeCvForAi(cvData);

  if (!ai) {
    return res.json({
      fallbackToLocal: true,
      message: 'Gemini API key not configured. Using high-precision local rule-based review engine.',
    });
  }

  try {
    const prompt = `You are a senior recruitment specialist and CV design auditor reviewing an Indian Bio-Data / CV.
Analyze the following candidate data:
${JSON.stringify(sanitized, null, 2)}

AUDIT REQUIREMENTS:
1. Overall CV assessment with a realistic score (50-100) and 2-3 sentences overview feedback.
2. Identify 3-4 genuine strengths in the candidate's existing background.
3. Review spelling, grammar, clarity, professional phrasing, consistency, and completeness.
4. For each suggestion, provide:
   - "section": Name of the section (e.g., 'Personal Details', 'Professional Description', 'Education', 'Technical Qualifications', 'Work Experience')
   - "originalText": The exact text currently used by the candidate (or "N/A" if missing)
   - "suggestedText": The recommended replacement text
   - "reason": Clear reason explaining why this improves the CV
   - "isCritical": true if this is an actual error (spelling mistake, broken grammar, missing mandatory field); false if it is an optional stylistic or ATS improvement
   - "category": 'grammar' | 'clarity' | 'completeness' | 'consistency' | 'wording' | 'formatting' | 'ats'
   - "targetField": 'description' | 'address' | 'education' | 'skills' | 'experience' | 'declaration' | 'personal'
   - "replacementValue": The improved text ready to apply if applicable.
5. Provide a polished 2-3 sentence professional summary based strictly on the candidate's background.

RULES:
- Do NOT invent degrees, employers, diplomas, certificates, or marks not provided by the candidate.
- Distinguish real errors from optional style enhancements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Overall CV score between 50 and 100' },
            overallFeedback: { type: Type.STRING, description: '2-3 sentences overview feedback' },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 strong aspects of this CV',
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  section: { type: Type.STRING },
                  category: { type: Type.STRING },
                  title: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  suggestedText: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  isCritical: { type: Type.BOOLEAN },
                  targetField: { type: Type.STRING },
                  replacementValue: { type: Type.STRING },
                },
                required: ['id', 'category', 'title', 'issue', 'suggestion'],
              },
            },
            rewrittenDescription: {
              type: Type.OBJECT,
              properties: {
                before: { type: Type.STRING },
                after: { type: Type.STRING },
              },
            },
          },
          required: ['score', 'overallFeedback', 'strengths', 'suggestions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json({
      ...parsed,
      isLocalRuleBased: false,
    });
  } catch (error: any) {
    console.error('Gemini API review error:', error);
    return res.json({
      fallbackToLocal: true,
      error: error.message || 'Error communicating with AI service',
    });
  }
};

app.post('/api/ai-review', handleAiReviewRequest);
app.post('/api/ai/review', handleAiReviewRequest);

// POST /api/generate-description and /api/ai/generate-summary handler (Priority 5: Professional Summary / Objective Generator)
const handleGenerateDescriptionRequest = async (req: express.Request, res: express.Response) => {
  const { cvData, style, careerLevel, focus } = req.body;

  const sanitized = sanitizeCvForAi(cvData || {});

  // Determine Level & Focus
  const level = careerLevel || (style === 'fresher' ? 'fresher' : 'mid');
  const domainFocus = focus || (style === 'technical' ? 'technical' : 'general');

  // Fallback options generator if Gemini API key is missing or offline
  const generateFallbackOptions = (): string[] => {
    const candidateName = sanitized.candidateName || 'The applicant';
    const hasTech = sanitized.technical?.length > 0;
    const techName = hasTech ? sanitized.technical[0].courseName : 'computer applications and office software';

    if (level === 'fresher' || style === 'fresher') {
      if (domainFocus === 'technical') {
        return [
          `Motivated and technically oriented fresher with hands-on training in ${techName}. Eager to apply practical computing knowledge, learn modern workplace technologies, and contribute with dedication.`,
          `Enthusiastic graduate with strong foundation in technical principles and computer systems. Seeking an entry-level position to deliver systematic support, solve practical challenges, and learn from experienced professionals.`,
          `Detail-oriented fresher possessing foundational proficiency in software tools and technical operations. Committed to sincere work ethic, punctual task completion, and rapid on-the-job learning.`,
        ];
      }
      if (domainFocus === 'management') {
        return [
          `Proactive and organized fresher with strong communication and coordination skills. Eager to support team operations, maintain efficient office workflows, and grow within a professional organization.`,
          `Dedicated graduate seeking an entry-level management or administrative role. Bringing positive interpersonal abilities, methodical task execution, and a commitment to operational excellence.`,
          `Motivated fresher with structured organizational capabilities and dependable work ethic. Eager to assist department goals through disciplined execution and rapid workflow adoption.`,
        ];
      }
      if (domainFocus === 'creative') {
        return [
          `Creative and enthusiastic individual with fresh ideas and dedication to visual presentation and communication. Seeking an opportunity to contribute aesthetic sensibility and learning drive to a forward-thinking team.`,
          `Motivated fresher with strong creative flair and eye for detail. Eager to collaborate on diverse projects, learn industry standards, and deliver engaging, high-quality work.`,
          `Passionate entry-level talent with expressive communication and problem-solving skills. Committed to bringing innovative energy and reliability to every assigned responsibility.`,
        ];
      }
      return [
        `Motivated and sincere fresher with a strong academic foundation, seeking an entry-level opportunity to contribute meaningfully to organizational success through disciplined work and continuous learning.`,
        `Enthusiastic and hardworking individual eager to begin a professional career. Committed to applying learned principles, adhering to ethical standards, and growing alongside the company.`,
        `Dedicated candidate with proven reliability and positive attitude. Seeking to leverage strong foundational education into reliable workplace contributions and continuous skill improvement.`,
      ];
    }

    if (level === 'experienced') {
      if (domainFocus === 'technical') {
        return [
          `Experienced technical professional proficient in ${techName} and systems operations. Demonstrated track record of error-free technical execution, problem diagnosis, and reliable workflow optimization.`,
          `Results-driven technical specialist with seasoned hands-on expertise in troubleshooting and digital tools. Committed to maintaining high standards of system efficiency and technical productivity.`,
          `Dependable technical practitioner with rich practical experience in modern computing environments. Focused on delivering prompt technical solutions and mentoring junior team members.`,
        ];
      }
      if (domainFocus === 'management') {
        return [
          `Accomplished operations and administrative professional with a solid track record of supervising team deliverables, optimizing office processes, and ensuring client satisfaction.`,
          `Seasoned coordinator with proven leadership in workflow management, documentation integrity, and cross-departmental communication. Committed to operational excellence and bottom-line impact.`,
          `Dedicated administrative manager skilled in procedural accuracy, conflict resolution, and resource planning. Focused on fostering productivity and dependable organizational growth.`,
        ];
      }
      if (domainFocus === 'creative') {
        return [
          `Experienced creative professional with proven background in concept ideation and visual communication. Dedicated to crafting impactful outputs that elevate brand standards and client engagement.`,
          `Versatile and innovative specialist with demonstrated history of delivering original creative solutions under tight timelines. Focused on quality, brand consistency, and aesthetic value.`,
          `Dynamic creative practitioner with substantial design and communication experience. Committed to blending artistic originality with pragmatic business objectives.`,
        ];
      }
      return [
        `Seasoned and dependable professional with a proven track record of diligent performance, high integrity, and consistent execution across diverse workplace responsibilities.`,
        `Experienced practitioner committed to operational excellence, workflow optimization, and exemplary team collaboration. Focused on driving measurable results and long-term organizational success.`,
        `Dedicated professional offering extensive practical experience and reliable execution. Seeking to leverage accumulated expertise to enhance organizational efficiency and productivity.`,
      ];
    }

    // Mid-level default
    if (domainFocus === 'technical') {
      return [
        `Technically proficient professional trained in ${techName} with strong aptitude for computer operations, software tools, and practical troubleshooting. Eager to deliver high-quality technical support.`,
        `Competent technical practitioner with solid skills in application management and hardware-software diagnostics. Focused on maintaining smooth operations and prompt task turnaround.`,
        `Dedicated professional combining formal education with practical technical aptitude in ${techName}. Committed to continuous technology enhancement and reliable troubleshooting.`,
      ];
    }
    if (domainFocus === 'management') {
      return [
        `Organized and detail-conscious professional with experience in records management, team assistance, and workflow administration. Committed to maintaining efficient office standards.`,
        `Resourceful administrative coordinator with strong communication skills and systematic task prioritization. Dedicated to upholding departmental productivity and seamless client relations.`,
        `Dependable professional skilled in daily operations, schedule coordination, and office document processing. Focused on timely execution and collaborative team support.`,
      ];
    }
    if (domainFocus === 'creative') {
      return [
        `Creative and detail-oriented candidate with a sharp visual aesthetic and strong dedication to polished deliverables. Eager to produce engaging content and creative assets.`,
        `Versatile creative specialist skilled in imaginative problem solving and aesthetic styling. Committed to elevating project quality through disciplined originality.`,
        `Innovative professional with aptitude for digital creativity and effective communication. Seeking to contribute innovative concepts and meticulous execution.`,
      ];
    }

    return [
      `Dedicated and detail-oriented candidate seeking an opportunity to contribute effectively to organizational growth while developing professional skills through sincere work and responsibility.`,
      `Responsible and hardworking professional with a solid background, seeking to deliver consistent performance, maintain high workplace integrity, and support team milestones.`,
      `Conscientious candidate with strong organizational aptitude and dependable work ethic. Eager to add tangible value to company operations through sincere dedication.`,
    ];
  };

  if (!ai) {
    const fallbackOptions = generateFallbackOptions();
    return res.json({
      options: fallbackOptions,
      description: fallbackOptions[0],
      careerLevel: level,
      focus: domainFocus,
      isLocal: true,
    });
  }

  try {
    const prompt = `You are a recruitment specialist writing tailored Professional Summaries / Career Objectives for an Indian Bio-Data or CV.
Candidate Details:
- Candidate: ${sanitized.candidateName}
- Education: ${sanitized.education.map((e: any) => e.examination).join(', ') || 'Formal education'}
- Technical Qualifications: ${sanitized.technical.map((t: any) => t.courseName).join(', ') || 'General proficiency'}
- Additional Skills/Experience: ${sanitized.additionalSections.map((s: any) => `${s.section}: ${s.content}`).join('; ') || 'None specified'}

TARGET SPECIFICATIONS:
- Career Level: ${level} (e.g., Entry-level / Fresher, Mid-level, or Experienced)
- Professional Focus: ${domainFocus} (e.g., General, Technical / IT, Management, or Creative)

REQUIREMENTS:
1. Generate exactly 3 distinct, high-impact options for the candidate's Professional Summary / Career Objective.
2. Option 1: Direct, outcome-driven, and concise (2 sentences).
3. Option 2: Emphasizing technical/practical skills and hands-on dedication (2-3 sentences).
4. Option 3: Balanced, highlighting reliability, sincere work ethic, and growth potential (2 sentences).
5. Professional Indian formal tone suitable for standard Bio-Data / CV formats.
6. Do NOT fabricate companies, marks, or certifications not provided.

Return a JSON object with:
{
  "options": [string, string, string]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 distinct tailored summary options',
            },
          },
          required: ['options'],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.options) && parsed.options.length > 0) {
        return res.json({
          options: parsed.options,
          description: parsed.options[0],
          careerLevel: level,
          focus: domainFocus,
          isLocal: false,
        });
      }
    }

    const fallbackOptions = generateFallbackOptions();
    return res.json({
      options: fallbackOptions,
      description: fallbackOptions[0],
      careerLevel: level,
      focus: domainFocus,
      isLocal: true,
    });
  } catch (error: any) {
    console.error('Error generating description options with Gemini:', error);
    const fallbackOptions = generateFallbackOptions();
    return res.json({
      options: fallbackOptions,
      description: fallbackOptions[0],
      careerLevel: level,
      focus: domainFocus,
      isLocal: true,
    });
  }
};

app.post('/api/generate-description', handleGenerateDescriptionRequest);
app.post('/api/ai/generate-summary', handleGenerateDescriptionRequest);

// Shared CV Storage
const SHARED_CVS_DIR = path.resolve(__dirname, '.shared_cvs');
if (!fs.existsSync(SHARED_CVS_DIR)) {
  try {
    fs.mkdirSync(SHARED_CVS_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create .shared_cvs dir:', err);
  }
}

const sharedCvsMemoryMap = new Map<string, any>();

// POST /api/share-cv: Generates unique shareable ID and saves CV payload
app.post('/api/share-cv', (req, res) => {
  try {
    const { cvData, colors, themeId, formatId, typography } = req.body;
    if (!cvData) {
      return res.status(400).json({ error: 'Missing cvData' });
    }

    const shareId = 'cv_' + crypto.randomBytes(5).toString('hex');
    const payload = {
      id: shareId,
      cvData,
      colors: colors || null,
      themeId: themeId || 'classic-black',
      formatId: formatId || 'classic',
      typography: typography || null,
      createdAt: new Date().toISOString(),
    };

    sharedCvsMemoryMap.set(shareId, payload);

    try {
      const filePath = path.join(SHARED_CVS_DIR, `${shareId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (fsErr) {
      console.warn('Could not write shared CV to disk:', fsErr);
    }

    return res.json({
      success: true,
      shareId,
    });
  } catch (err: any) {
    console.error('Error creating shared CV:', err);
    return res.status(500).json({ error: 'Failed to create share link' });
  }
});

// GET /api/share-cv/:id: Retrieves the saved CV payload
app.get('/api/share-cv/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    let payload = sharedCvsMemoryMap.get(id);
    if (!payload) {
      const filePath = path.join(SHARED_CVS_DIR, `${id}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          payload = JSON.parse(raw);
          sharedCvsMemoryMap.set(id, payload);
        } catch {}
      }
    }

    if (!payload) {
      return res.status(404).json({ error: 'Shared CV not found or link has expired.' });
    }

    return res.json({
      success: true,
      data: payload,
    });
  } catch (err: any) {
    console.error('Error retrieving shared CV:', err);
    return res.status(500).json({ error: 'Failed to retrieve CV' });
  }
});

// Mount Vite or serve static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CV MAKER (SS TELECOM) server running on http://localhost:${PORT}`);
  });
}

startServer();
