export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string;
  isAdmin: boolean;
  emailVerified?: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  targetRole?: string | null;
  experienceLevel?: string | null;
  toolsKnown?: string | null;
  weakAreas?: string | null;
  interviewDate?: string | null;
  confidenceLevel?: string | null;
  resumeStatus?: string | null;
  country?: string | null;
  onboardingDone: boolean;
}

export interface Question {
  id: string;
  role: string;
  difficulty: string;
  type: string;
  skillArea: string;
  question: string;
  whyEmployersAsk?: string | null;
  strongAnswerPoints?: string | null;
  weakAnswerWarnings?: string | null;
  sampleAnswer?: string | null;
  answerFormat?: string | null;
  timeLimit?: number | null;
  status: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  mode: string;
  targetRole?: string | null;
  startedAt: string;
  completedAt?: string | null;
  overallScore?: number | null;
  transcript?: string | null;
}

export interface QuestionAttempt {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  aiFeedback?: string | null;
  score?: number | null;
  rubricBreakdown?: string | null;
  question?: Question;
}

export interface Resume {
  id: string;
  userId: string;
  originalText?: string | null;
  targetRole?: string | null;
  score?: number | null;
  improvedVersion?: string | null;
  truthFlags?: string | null;
  createdAt: string;
}

export interface CoverLetter {
  id: string;
  userId: string;
  jobDescription?: string | null;
  tone?: string | null;
  generatedLetter?: string | null;
  truthFlags?: string | null;
  createdAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  role: string;
  difficulty: string;
  description?: string | null;
  datasetInfo?: string | null;
  answerKey?: string | null;
  rubric?: string | null;
}

export interface Download {
  id: string;
  title: string;
  fileType: string;
  role: string;
  description?: string | null;
  fileName: string;
  accessTier: string;
  category: string;
  downloadCount: number;
}

export const DOWNLOAD_CATEGORIES = [
  'Resume Templates',
  'Cover Letters',
  'Cheat Sheets',
  'Calculators',
  'Checklists',
  'Plans & Reports',
] as const;

export const ACCESS_TIERS = ['free', 'starter', 'pro'] as const;

export interface Guide {
  id: string;
  title: string;
  slug: string;
  level: string;
  role: string;
  content: string;
  status: string;
}

export interface DashboardData {
  user: User;
  profile?: UserProfile;
  stats: {
    totalSessions: number;
    completedSessions: number;
    totalAttempts: number;
    avgScore: number;
    latestResumeScore: number | null;
  };
  recentSessions: InterviewSession[];
  recentResumes: Resume[];
  recentCoverLetters: CoverLetter[];
  recentAttempts: (QuestionAttempt & { question?: Question })[];
}

export type ActiveView = 'dashboard' | 'onboarding' | 'questions' | 'interview' | 'resume' | 'cover-letter' | 'assessments' | 'downloads' | 'guides' | 'admin' | 'pricing';

export interface SubscriptionInfo {
  tier: string;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UsageInfo {
  interviewsThisWeek: number;
  interviewsLimit: number;
  resumeReviewsThisMonth: number;
  resumeReviewsLimit: number;
  coverLettersThisMonth: number;
  coverLettersLimit: number;
  practiceTestsThisMonth: number;
  practiceTestsLimit: number;
}

export const ROLES = ['PPC VA', 'Account VA', 'Listing VA', 'Reporting VA', 'Agency VA', 'Senior PPC Assistant', 'General'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const QUESTION_TYPES = ['behavioral', 'technical', 'scenario', 'case_study', 'tool_specific', 'trick'] as const;
export const SKILL_AREAS = ['PPC', 'Excel', 'Seller Central', 'client_communication', 'reporting', 'marketplace_basics', 'optimization', 'keyword_research', 'campaign_structure'] as const;
export const INTERVIEW_MODES = [
  { value: 'quick_drill', label: 'Quick Drill (5 questions)', desc: '5 random questions across topics' },
  { value: 'role_interview', label: 'Role Interview (10 questions)', desc: '20-minute simulated interview for your target role' },
  { value: 'technical_screen', label: 'Technical Screen', desc: 'PPC and reporting-heavy questions' },
  { value: 'client_communication', label: 'Client Communication', desc: 'Scenario-based client interaction questions' },
  { value: 'final_interview', label: 'Final Interview', desc: 'Mixed behavioral and technical questions' },
  { value: 'practical_debrief', label: 'Practical Test Debrief', desc: 'Explain how you solved a case study' },
] as const;
export const TOOLS_LIST = ['Seller Central', 'Amazon Ads Console', 'Helium 10', 'Data Dive', 'Adbrew', 'Xnurta', 'MerchantSpring', 'ClickUp', 'Google Sheets', 'Excel', 'Canva', 'Google Drive'] as const;

// ===== AI Feedback Type Definitions =====

/** Rubric breakdown returned by the AI Interview Coach */
export interface RubricBreakdown {
  roleRelevance: number;
  technicalAccuracy: number;
  specificity: number;
  communicationClarity: number;
  judgmentAndRiskAwareness: number;
  truthfulness: number;
}

/** Response from /api/ai/coach */
export interface AICoachFeedback {
  score: number;
  whatWorked: string;
  whatToImprove: string;
  strongerSampleAnswer: string;
  followUpQuestion: string;
  rubricBreakdown: RubricBreakdown;
}

/** Response from /api/ai/resume-review */
export interface AIResumeReview {
  score: number;
  missingKeywords: string[];
  weakSections: string[];
  improvedSummary: string;
  improvedBullets: string[];
  skillsRecommendations: string[];
  truthWarnings: string[];
  improvedVersion: string;
}

/** Response from /api/ai/cover-letter */
export interface AICoverLetterResult {
  draftLetter: string;
  shorterVersion?: string;
  subjectLine?: string;
  customizationTips?: string[];
  claimsToVerify: string[];
}

/** Response from /api/ai/assessment-score */
export interface AIAssessmentScore {
  score: number;
  correctDecisions: string[];
  incorrectDecisions: string[];
  missedOpportunities: string[];
  modelAnswer: string;
  recommendedNextStep: string;
}
