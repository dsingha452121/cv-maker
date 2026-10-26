export interface PersonalInfo {
  fullName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  // Detailed address
  villageTown: string;
  postOffice: string;
  policeStation: string;
  district: string;
  state: string;
  pinCode: string;
  customAddress?: string;
  useCustomAddress: boolean;
  mobileNumber: string;
  emailId: string;
  aadhaarNumber?: string;
  includeAadhaarInCv?: boolean;
  maskAadhaarInCv?: boolean;
  maritalStatus: 'Unmarried' | 'Married' | 'Single' | 'Divorced' | string;
  gender: 'Male' | 'Female' | 'Other' | string;
  religion: string;
  nationality: string;
  languagesKnown: string;
  photoUrl: string | null;
  photoFileName?: string;
}

export interface EducationRow {
  id: string;
  examination: string;
  boardUniversity: string;
  year: string;
  totalMarks: string;
  marksObtained: string;
  percentage: string;
  isManualPercentage?: boolean;
  manualPercentage?: string;
}

export interface TechnicalRow {
  id: string;
  courseName: string;
  institute: string;
  duration: string;
  year: string;
  details?: string;
}

export interface AdditionalSectionItem {
  id: string;
  key: 'experience' | 'skills' | 'hobbies' | 'strengths' | 'custom';
  title: string;
  enabled: boolean;
  content: string;
}

export interface DeclarationInfo {
  text: string;
  date: string;
  place: string;
  templateId?: string;
}

export interface DeclarationTemplate {
  id: string;
  name: string;
  text: string;
}

export const DECLARATION_TEMPLATES: DeclarationTemplate[] = [
  {
    id: 'standard',
    name: '1. Standard Formal Declaration',
    text: 'I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.',
  },
  {
    id: 'short',
    name: '2. Short & Simple Declaration',
    text: 'I declare that the information provided above is true and correct.',
  },
  {
    id: 'professional',
    name: '3. Professional Job Application',
    text: 'I hereby declare that all the details mentioned above are accurate and complete to the best of my knowledge and belief.',
  },
  {
    id: 'honest',
    name: '4. Honest & Responsible Candidate',
    text: 'I sincerely declare that the information furnished above is true and correct. I accept responsibility for the accuracy of the information provided.',
  },
  {
    id: 'govt',
    name: '5. Indian Government Job Application',
    text: 'I hereby declare that all the particulars furnished above are true and correct to the best of my knowledge and belief. I understand that any false information may lead to rejection of my application.',
  },
  {
    id: 'custom',
    name: '6. Custom Declaration (Write Your Own)',
    text: '',
  },
];

export type SignatureInkColor = 'black' | 'blue' | 'original';

export interface SignatureSettings {
  threshold: number; // 10 - 90, default 45
  darkness: number;  // 1.0 - 2.5, default 1.4
  smoothness: number; // 0 - 3, default 1
  inkColor: SignatureInkColor;
}

export interface SignatureInfo {
  rawImageUrl: string | null;
  processedImageUrl: string | null;
  fileName?: string;
  isEnabled: boolean;
  settings: SignatureSettings;
}

export type CVSectionId =
  | 'personal'
  | 'description'
  | 'education'
  | 'technical'
  | 'skills'
  | 'experience'
  | 'hobbies'
  | 'strengths'
  | 'declaration'
  | 'signature';

export interface SectionMeta {
  id: CVSectionId;
  label: string;
  description: string;
}

export const CV_SECTIONS_META: SectionMeta[] = [
  { id: 'personal', label: 'Personal Information', description: 'Name, Father Name, DOB, Address, Mobile, etc.' },
  { id: 'description', label: 'Professional Description', description: 'Career profile & objective summary' },
  { id: 'education', label: 'Education Qualification', description: 'Academic records table with percentages' },
  { id: 'technical', label: 'Technical Qualification', description: 'Certificates, diplomas, and computer courses' },
  { id: 'skills', label: 'Technical Skills', description: 'Computer proficiency, typing, office software' },
  { id: 'experience', label: 'Work Experience', description: 'Previous jobs, training, and responsibilities' },
  { id: 'hobbies', label: 'Hobbies & Interests', description: 'Sports, reading, creative pursuits' },
  { id: 'strengths', label: 'Strengths', description: 'Punctuality, work ethic, quick learner' },
  { id: 'declaration', label: 'Declaration', description: 'Formal applicant statement of accuracy' },
  { id: 'signature', label: 'Date, Place & Signature', description: 'Applicant signature and submission details' },
];

export const DEFAULT_SECTION_ORDER: CVSectionId[] = [
  'personal',
  'description',
  'education',
  'technical',
  'skills',
  'experience',
  'hobbies',
  'strengths',
  'declaration',
  'signature',
];

export interface CVColors {
  mainHeadingColor: string;
  sectionHeadingColor: string;
  bodyTextColor: string;
  outerBorderColor: string;
  tableBorderColor: string;
  tableHeaderBgColor: string;
  tableHeaderTextColor: string;
  accentColor: string;
  backgroundColor: string;
}

export type CVColorThemeId =
  | 'classic-black'
  | 'professional-blue'
  | 'elegant-green'
  | 'burgundy'
  | 'charcoal-grey'
  | 'navy-gold';

export interface CVColorThemePreset {
  id: CVColorThemeId;
  name: string;
  colors: CVColors;
  badgeColor: string;
}

export const COLOR_THEME_PRESETS: Record<CVColorThemeId, CVColorThemePreset> = {
  'classic-black': {
    id: 'classic-black',
    name: 'Classic Black and White',
    badgeColor: '#000000',
    colors: {
      mainHeadingColor: '#000000',
      sectionHeadingColor: '#000000',
      bodyTextColor: '#000000',
      outerBorderColor: '#000000',
      tableBorderColor: '#000000',
      tableHeaderBgColor: '#f8fafc',
      tableHeaderTextColor: '#000000',
      accentColor: '#000000',
      backgroundColor: '#ffffff',
    },
  },
  'professional-blue': {
    id: 'professional-blue',
    name: 'Professional Blue',
    badgeColor: '#1e40af',
    colors: {
      mainHeadingColor: '#1e3a8a',
      sectionHeadingColor: '#1e3a8a',
      bodyTextColor: '#111827',
      outerBorderColor: '#1e3a8a',
      tableBorderColor: '#1e3a8a',
      tableHeaderBgColor: '#eff6ff',
      tableHeaderTextColor: '#1e3a8a',
      accentColor: '#2563eb',
      backgroundColor: '#ffffff',
    },
  },
  'elegant-green': {
    id: 'elegant-green',
    name: 'Elegant Green',
    badgeColor: '#166534',
    colors: {
      mainHeadingColor: '#14532d',
      sectionHeadingColor: '#14532d',
      bodyTextColor: '#111827',
      outerBorderColor: '#14532d',
      tableBorderColor: '#14532d',
      tableHeaderBgColor: '#f0fdf4',
      tableHeaderTextColor: '#14532d',
      accentColor: '#16a34a',
      backgroundColor: '#ffffff',
    },
  },
  'burgundy': {
    id: 'burgundy',
    name: 'Burgundy',
    badgeColor: '#831843',
    colors: {
      mainHeadingColor: '#701a35',
      sectionHeadingColor: '#701a35',
      bodyTextColor: '#111827',
      outerBorderColor: '#701a35',
      tableBorderColor: '#701a35',
      tableHeaderBgColor: '#fff1f2',
      tableHeaderTextColor: '#701a35',
      accentColor: '#9f1239',
      backgroundColor: '#ffffff',
    },
  },
  'charcoal-grey': {
    id: 'charcoal-grey',
    name: 'Charcoal Grey',
    badgeColor: '#334155',
    colors: {
      mainHeadingColor: '#1e293b',
      sectionHeadingColor: '#1e293b',
      bodyTextColor: '#111827',
      outerBorderColor: '#334155',
      tableBorderColor: '#334155',
      tableHeaderBgColor: '#f8fafc',
      tableHeaderTextColor: '#1e293b',
      accentColor: '#475569',
      backgroundColor: '#ffffff',
    },
  },
  'navy-gold': {
    id: 'navy-gold',
    name: 'Navy and Gold',
    badgeColor: '#b45309',
    colors: {
      mainHeadingColor: '#0f172a',
      sectionHeadingColor: '#0f172a',
      bodyTextColor: '#111827',
      outerBorderColor: '#0f172a',
      tableBorderColor: '#0f172a',
      tableHeaderBgColor: '#fef3c7',
      tableHeaderTextColor: '#0f172a',
      accentColor: '#b45309',
      backgroundColor: '#ffffff',
    },
  },
};

export type CVFormatId =
  | 'classic'
  | 'compact'
  | 'modern'
  | 'traditional'
  | 'minimal'
  | 'boxed';

export interface CVFormatOption {
  id: CVFormatId;
  name: string;
  description: string;
  badge: string;
}

export const CV_FORMATS: CVFormatOption[] = [
  {
    id: 'classic',
    name: 'Classic Bio-Data',
    description: 'Centered BIO-DATA heading, left-aligned details, photo at upper-right, standard education table',
    badge: 'Standard',
  },
  {
    id: 'compact',
    name: 'Compact Bio-Data',
    description: 'Tighter vertical spacing and compact rows, ideal for extensive qualifications',
    badge: 'Dense',
  },
  {
    id: 'modern',
    name: 'Modern Formal',
    description: 'Restrained contemporary colored headings, sleek left accents, and subtle section dividers',
    badge: 'Modern',
  },
  {
    id: 'traditional',
    name: 'Traditional Indian Bio-Data',
    description: 'Formal document layout with double rectangular border, structured fields, and classic typography',
    badge: 'Traditional',
  },
  {
    id: 'minimal',
    name: 'Minimal Professional',
    description: 'Clean minimalist typography, light borders, subtle dividers, and high legibility',
    badge: 'Clean',
  },
  {
    id: 'boxed',
    name: 'Boxed Bio-Data',
    description: 'Structured card sections with thin rectangular borders around each block',
    badge: 'Boxed',
  },
];

export interface DescriptionTemplate {
  id: string;
  name: string;
  category: string;
  text: string;
  isCustom?: boolean;
}

export const BUILTIN_DESCRIPTION_TEMPLATES: DescriptionTemplate[] = [
  {
    id: 'tmpl-simple',
    name: '1. Simple Bio-Data Description',
    category: 'Standard',
    text: 'Seeking a suitable position where I can utilize my educational qualifications and personal skills to contribute effectively to organizational growth while developing my career.',
  },
  {
    id: 'tmpl-fresher',
    name: '2. Fresher / Entry-Level Candidate',
    category: 'Entry Level',
    text: 'I am a motivated and responsible individual eager to learn new skills and contribute positively to an organization. I am committed to completing assigned tasks sincerely and improving my professional abilities.',
  },
  {
    id: 'tmpl-hardworking',
    name: '3. Hardworking and Responsible Candidate',
    category: 'General',
    text: 'A dedicated, punctual, and hardworking candidate looking for an opportunity to perform my duties with honesty and commitment. Ready to adapt to work requirements and maintain high standards of performance.',
  },
  {
    id: 'tmpl-technical',
    name: '4. Technical Skills and Computer Knowledge',
    category: 'Technical',
    text: 'I have knowledge of computer applications and basic technical skills. I am interested in applying my knowledge in a practical working environment and continuously improving my abilities.',
  },
  {
    id: 'tmpl-internship',
    name: '5. Internship / Practical Training',
    category: 'Training',
    text: 'Equipped with foundational academic knowledge and practical training experience. Seeking a challenging role to apply theoretical concepts into real-world business and office operations.',
  },
  {
    id: 'tmpl-experienced',
    name: '6. Experienced Candidate',
    category: 'Experienced',
    text: 'Experienced professional with a track record of reliability, team coordination, and task management. Committed to driving quality results and supporting company objectives.',
  },
];

export type DocumentTitleType = 'BIO-DATA' | 'CV' | 'RESUME';

export interface DocumentTitleOption {
  id: DocumentTitleType;
  label: string;
  description: string;
}

export const DOCUMENT_TITLES: DocumentTitleOption[] = [
  {
    id: 'BIO-DATA',
    label: 'BIO-DATA',
    description: 'Traditional standard Indian format for employment and matrimonial submissions',
  },
  {
    id: 'CV',
    label: 'CV (Curriculum Vitae)',
    description: 'Detailed professional and academic profile showcasing comprehensive achievements',
  },
  {
    id: 'RESUME',
    label: 'RESUME',
    description: 'Concise corporate format highlighting key competencies and qualifications',
  },
];

export interface SectionContentPreset {
  id: string;
  name: string;
  sectionKey: 'skills' | 'experience' | 'hobbies' | 'strengths' | 'technical';
  content: string;
  isCustom?: boolean;
}

export const BUILTIN_SECTION_TEMPLATES: Record<
  'skills' | 'experience' | 'hobbies' | 'strengths' | 'technical',
  SectionContentPreset[]
> = {
  skills: [
    {
      id: 'skill-office',
      name: 'Computer Applications & MS Office',
      sectionKey: 'skills',
      content: '• Proficient in Microsoft Office Suite (MS Word, Excel, PowerPoint, Outlook)\n• Operating Systems: Windows 10/11, Internet Browsing, Email Management\n• Fast typing speed in English (35+ WPM) and Hindi typing fundamentals',
    },
    {
      id: 'skill-tally',
      name: 'Accounts & Tally ERP 9 / Prime',
      sectionKey: 'skills',
      content: '• Basic & Intermediate Accounting in Tally Prime / ERP 9\n• Voucher Entry, Day Book Maintenance, GST Invoicing & Billing\n• Spreadsheet creation, VLOOKUP, data entry, and invoice generation',
    },
    {
      id: 'skill-it',
      name: 'IT, Hardware & Basic Networking',
      sectionKey: 'skills',
      content: '• Computer Hardware Troubleshooting & OS Installation\n• Local Area Network (LAN) setup, Wi-Fi Configuration, Printer Installation\n• Knowledge of web applications, cloud storage, and cybersecurity basics',
    },
    {
      id: 'skill-telecom',
      name: 'Telecom & Customer Support (SS TELECOM)',
      sectionKey: 'skills',
      content: '• Mobile handset diagnostics, SIM activation, and telecom portal operations\n• Customer relationship management (CRM), telecalling, and client resolution\n• Point of Sale (POS) system handling and digital payment gateway reconciliation',
    },
  ],
  experience: [
    {
      id: 'exp-fresher',
      name: 'Fresher / Ready to Work',
      sectionKey: 'experience',
      content: 'Fresher with strong academic foundation and practical eagerness to contribute to organizational success. Committed to honest hard work, punctual attendance, and rapid learning under team supervision.',
    },
    {
      id: 'exp-computer-operator',
      name: 'Computer Operator / Data Entry',
      sectionKey: 'experience',
      content: '1+ Year experience as Computer Operator / Data Entry Executive. Handled high-volume daily records, digital document archiving, customer billing, and official correspondence with 99% accuracy.',
    },
    {
      id: 'exp-telecom-sales',
      name: 'Store Sales / Telecom Executive',
      sectionKey: 'experience',
      content: '2 Years working experience in Retail Store & Telecom Services. Managed product demonstrations, customer onboarding, daily inventory auditing, and monthly sales achievement.',
    },
    {
      id: 'exp-office-asst',
      name: 'Office Assistant / Clerk',
      sectionKey: 'experience',
      content: 'Handled general office administration, file indexing, incoming/outgoing dispatch, register maintenance, and administrative assistance to management.',
    },
  ],
  hobbies: [
    {
      id: 'hobby-balanced',
      name: 'Reading, Cricket & Technology',
      sectionKey: 'hobbies',
      content: 'Reading informative books and newspapers, playing cricket, exploring new digital technologies and mobile applications.',
    },
    {
      id: 'hobby-creative',
      name: 'Creative & Outdoor Pursuits',
      sectionKey: 'hobbies',
      content: 'Travelling, photography, listening to classical and motivational music, community volunteering.',
    },
    {
      id: 'hobby-learning',
      name: 'Self-Improvement & Coding',
      sectionKey: 'hobbies',
      content: 'Learning new software skills online, solving logic puzzles, indoor games like chess, badminton.',
    },
  ],
  strengths: [
    {
      id: 'strength-work-ethic',
      name: 'Dedication & Punctuality',
      sectionKey: 'strengths',
      content: '• Punctual, dependable, and highly sincere towards assigned duties\n• Strong communication skills and positive attitude towards colleagues\n• Ability to handle pressure and meet deadlines with accuracy',
    },
    {
      id: 'strength-adaptable',
      name: 'Fast Learner & Team Player',
      sectionKey: 'strengths',
      content: '• Quick learner with enthusiasm to adapt to new environments and technologies\n• Excellent team coordination with high personal integrity and honesty\n• Methodical problem-solving approach and attention to detail',
    },
  ],
  technical: [
    {
      id: 'tech-dca',
      name: 'Diploma in Computer Application (DCA)',
      sectionKey: 'technical',
      content: 'Completed 6-Month Diploma in Computer Application (DCA) covering MS Office, Operating Systems, and Internet applications.',
    },
    {
      id: 'tech-adca',
      name: 'Advanced Diploma in Computer Application (ADCA)',
      sectionKey: 'technical',
      content: '1-Year Advanced Diploma in Computer Application (ADCA) covering Tally Prime, Graphic Design basics, and Web browsing.',
    },
  ],
};

export type DescriptionWritingStyle =
  | 'simple'
  | 'fresher'
  | 'technical'
  | 'data_entry'
  | 'customer_service'
  | 'technician'
  | 'admin';

export interface DescriptionStyleOption {
  id: DescriptionWritingStyle;
  label: string;
  description: string;
}

export const DESCRIPTION_WRITING_STYLES: DescriptionStyleOption[] = [
  {
    id: 'simple',
    label: 'Simple and Professional',
    description: 'Clean, balanced, formal summary suitable for general applications',
  },
  {
    id: 'fresher',
    label: 'Fresher / Entry-Level',
    description: 'Emphasizes eagerness to learn, dedication, and academic foundation',
  },
  {
    id: 'technical',
    label: 'Technical / IT',
    description: 'Focuses on software, computer proficiency, and technical problem solving',
  },
  {
    id: 'data_entry',
    label: 'Computer Operator / Data Entry',
    description: 'Highlights typing speed, accuracy, MS Office, and computer operations',
  },
  {
    id: 'customer_service',
    label: 'Customer Service',
    description: 'Emphasizes polite communication, client satisfaction, and relationship building',
  },
  {
    id: 'technician',
    label: 'Mobile Repair / Electronics Technician',
    description: 'Highlights hands-on hardware diagnostics, repair skills, and maintenance',
  },
  {
    id: 'admin',
    label: 'Administrative / Office Work',
    description: 'Focuses on documentation, filing, office coordination, and task management',
  },
];

export interface AISuggestion {
  id: string;
  section?: string;
  category: 'grammar' | 'clarity' | 'completeness' | 'consistency' | 'wording' | 'formatting' | 'ats';
  title: string;
  issue: string;
  suggestion: string;
  originalText?: string;
  suggestedText?: string;
  reason?: string;
  isCritical?: boolean;
  targetField?: 'description' | 'address' | 'education' | 'skills' | 'experience' | 'declaration' | 'personal';
  replacementValue?: string;
  applied?: boolean;
}

export interface AIReviewResult {
  score: number;
  overallFeedback: string;
  strengths: string[];
  suggestions: AISuggestion[];
  rewrittenDescription?: {
    before: string;
    after: string;
  };
  isLocalRuleBased: boolean;
}

export interface CustomPalette {
  id: string;
  name: string;
  colors: CVColors;
}

export type TextWeightOption = 'normal' | 'medium' | 'semibold' | 'bold';

export interface TypographySettings {
  fillMode: 'auto' | 'manual';
  fontSize: number; // 11 - 22 px, default 14
  fontWeight: TextWeightOption; // default 'medium' (500)
  headingBold: boolean; // default true (700)
  lineHeight: number; // 1.2 - 2.0, default 1.5
  sectionGap: number; // 6 - 40 px, default 16
  photoScale: number; // 0.8 - 1.8, default 1.2
}

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fillMode: 'auto',
  fontSize: 14,
  fontWeight: 'medium',
  headingBold: true,
  lineHeight: 1.5,
  sectionGap: 16,
  photoScale: 1.2,
};

export interface TypographyPresetOption {
  id: string;
  name: string;
  settings: Partial<TypographySettings>;
}

export const TYPOGRAPHY_PRESETS: TypographyPresetOption[] = [
  {
    id: 'compact',
    name: 'Compact',
    settings: {
      fontSize: 12,
      fontWeight: 'normal',
      headingBold: true,
      lineHeight: 1.35,
      sectionGap: 10,
      photoScale: 1.0,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    settings: {
      fontSize: 14,
      fontWeight: 'medium',
      headingBold: true,
      lineHeight: 1.5,
      sectionGap: 16,
      photoScale: 1.2,
    },
  },
  {
    id: 'large-bold',
    name: 'Large & Bold',
    settings: {
      fontSize: 16,
      fontWeight: 'semibold',
      headingBold: true,
      lineHeight: 1.55,
      sectionGap: 20,
      photoScale: 1.4,
    },
  },
];

export interface BioDataState {
  documentTitle?: DocumentTitleType;
  personal: PersonalInfo;
  description: string;
  descriptionEnabled: boolean;
  education: EducationRow[];
  technical: TechnicalRow[];
  additionalSections: AdditionalSectionItem[];
  declaration: DeclarationInfo;
  signature?: SignatureInfo;
  sectionOrder: CVSectionId[];
}

export const INITIAL_EMPTY_STATE: BioDataState = {
  documentTitle: 'BIO-DATA',
  personal: {
    fullName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    villageTown: '',
    postOffice: '',
    policeStation: '',
    district: '',
    state: '',
    pinCode: '',
    customAddress: '',
    useCustomAddress: false,
    mobileNumber: '',
    emailId: '',
    aadhaarNumber: '',
    includeAadhaarInCv: false,
    maskAadhaarInCv: true,
    maritalStatus: 'Unmarried',
    gender: 'Male',
    religion: 'Hinduism',
    nationality: 'Indian',
    languagesKnown: '',
    photoUrl: null,
    photoFileName: '',
  },
  description: '',
  descriptionEnabled: true,
  education: [
    {
      id: 'edu-1',
      examination: '10th / Secondary / Matric',
      boardUniversity: '',
      year: '',
      totalMarks: '',
      marksObtained: '',
      percentage: '',
      isManualPercentage: false,
      manualPercentage: '',
    },
    {
      id: 'edu-2',
      examination: '12th / Higher Secondary',
      boardUniversity: '',
      year: '',
      totalMarks: '',
      marksObtained: '',
      percentage: '',
      isManualPercentage: false,
      manualPercentage: '',
    },
  ],
  technical: [],
  additionalSections: [
    {
      id: 'sec-skills',
      key: 'skills',
      title: 'Technical Skills / Computer Proficiency',
      enabled: false,
      content: '',
    },
    {
      id: 'sec-experience',
      key: 'experience',
      title: 'Work Experience',
      enabled: false,
      content: '',
    },
    {
      id: 'sec-hobbies',
      key: 'hobbies',
      title: 'Hobbies & Interests',
      enabled: false,
      content: '',
    },
    {
      id: 'sec-strengths',
      key: 'strengths',
      title: 'Strengths',
      enabled: false,
      content: '',
    },
  ],
  declaration: {
    text: 'I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.',
    date: '',
    place: '',
    templateId: 'standard',
  },
  signature: {
    rawImageUrl: null,
    processedImageUrl: null,
    fileName: '',
    isEnabled: true,
    settings: {
      threshold: 45,
      darkness: 1.4,
      smoothness: 1,
      inkColor: 'black',
    },
  },
  sectionOrder: DEFAULT_SECTION_ORDER,
};

export const SAMPLE_STATE: BioDataState = {
  documentTitle: 'BIO-DATA',
  personal: {
    fullName: 'Rahul Sharma',
    fatherName: 'Late Suresh Sharma',
    motherName: 'Sunita Sharma',
    dateOfBirth: '1998-08-15',
    villageTown: 'Rampur Colony',
    postOffice: 'Rampur Hat',
    policeStation: 'Sadar Thana',
    district: 'Birbhum',
    state: 'West Bengal',
    pinCode: '731224',
    customAddress: '',
    useCustomAddress: false,
    mobileNumber: '9876543210',
    emailId: 'rahul.sharma@example.com',
    aadhaarNumber: '987654321098',
    includeAadhaarInCv: false,
    maskAadhaarInCv: true,
    maritalStatus: 'Unmarried',
    gender: 'Male',
    religion: 'Hinduism',
    nationality: 'Indian',
    languagesKnown: 'English, Hindi, Bengali',
    photoUrl: null,
    photoFileName: '',
  },
  description: 'I am a motivated and responsible individual eager to learn new skills and contribute positively to an organization. I am committed to completing assigned tasks sincerely and improving my professional abilities.',
  descriptionEnabled: true,
  education: [
    {
      id: 'edu-1',
      examination: '10th / Madhyamik',
      boardUniversity: 'W.B.B.S.E.',
      year: '2014',
      totalMarks: '700',
      marksObtained: '546',
      percentage: '78%',
      isManualPercentage: false,
      manualPercentage: '',
    },
    {
      id: 'edu-2',
      examination: '12th / Higher Secondary',
      boardUniversity: 'W.B.C.H.S.E.',
      year: '2016',
      totalMarks: '500',
      marksObtained: '385',
      percentage: '77%',
      isManualPercentage: false,
      manualPercentage: '',
    },
    {
      id: 'edu-3',
      examination: 'B.Sc (Computer Science)',
      boardUniversity: 'Burdwan University',
      year: '2019',
      totalMarks: '1200',
      marksObtained: '912',
      percentage: '76%',
      isManualPercentage: false,
      manualPercentage: '',
    },
  ],
  technical: [
    {
      id: 'tech-1',
      courseName: 'Diploma in Computer Application (DCA)',
      institute: 'National Institute of Electronics & Information Technology (NIELIT)',
      duration: '6 Months',
      year: '2020',
      details: 'MS Office, Internet Concepts, Financial Accounting (Tally ERP 9)',
    },
  ],
  additionalSections: [
    {
      id: 'sec-skills',
      key: 'skills',
      title: 'Technical Skills / Computer Proficiency',
      enabled: true,
      content: 'MS Office (Word, Excel, PowerPoint), Tally ERP 9, Fast Typing (40 WPM in English), Internet & Email correspondence.',
    },
    {
      id: 'sec-experience',
      key: 'experience',
      title: 'Work Experience',
      enabled: true,
      content: '1 Year experience as Computer Operator & Office Assistant at Anand Traders, Asansol (2021-2022).',
    },
    {
      id: 'sec-hobbies',
      key: 'hobbies',
      title: 'Hobbies & Interests',
      enabled: false,
      content: 'Reading books, Playing Cricket, News Analysis',
    },
    {
      id: 'sec-strengths',
      key: 'strengths',
      title: 'Strengths',
      enabled: true,
      content: 'Hardworking, Honest, Punctual, Good communication skills and quick learner.',
    },
  ],
  declaration: {
    text: 'I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.',
    date: new Date().toISOString().split('T')[0],
    place: 'Kolkata',
    templateId: 'standard',
  },
  signature: {
    rawImageUrl: null,
    processedImageUrl: null,
    fileName: '',
    isEnabled: true,
    settings: {
      threshold: 45,
      darkness: 1.4,
      smoothness: 1,
      inkColor: 'black',
    },
  },
  sectionOrder: DEFAULT_SECTION_ORDER,
};
