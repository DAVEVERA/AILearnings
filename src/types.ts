export type DifficultyLevel = 'beginner' | 'gemiddeld' | 'gevorderd';
export type AIExperienceLevel = 'geen' | 'basis' | 'gemiddeld' | 'gevorderd';
export type LearningStyle = 'visueel' | 'tekstueel' | 'interactief' | 'mix';
export type SessionTime = '15' | '30' | '60';

export interface AssessmentQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface ModuleContent {
  id: string;
  title: string;
  department: string;
  level: DifficultyLevel;
  hero: {
    title: string;
    introduction: string;
    backgroundImageUrl?: string;
  };
  instructions: string[];
  learningContent: {
    sectionTitle: string;
    text: string;
    visualType: 'chart' | 'infographic' | 'image' | 'video' | 'tutorial';
    visualData?: any;
  }[];
  assessment: AssessmentQuestion[];
  summary: string;
  badge: {
    name: string;
    icon: string;
  };
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  description: string;
  tools: string[];
}

export const DEPARTMENTS: Department[] = [
  { id: 'hr', name: 'Human Resources', icon: 'Users', description: 'Werving, onboarding en personeelszaken', tools: ['Personio', 'LinkedIn', 'MS Teams', 'Excel'] },
  { id: 'recruitment', name: 'Recruitment', icon: 'UserPlus', description: 'Sourcing, selectie en candidate experience', tools: ['LinkedIn Recruiter', 'Greenhouse', 'Indeed', 'MS Teams'] },
  { id: 'it', name: 'IT & Development', icon: 'Code', description: 'Systemen, development en infrastructuur', tools: ['GitHub', 'Jira', 'VS Code', 'Docker', 'Azure'] },
  { id: 'sales', name: 'Sales', icon: 'DollarSign', description: 'Verkoop, klantrelaties en omzetgroei', tools: ['Salesforce', 'HubSpot', 'LinkedIn Sales Navigator', 'Outlook'] },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone', description: 'Campagnes, content en merkbekendheid', tools: ['Google Analytics', 'Meta Ads', 'Canva', 'Mailchimp', 'HubSpot'] },
  { id: 'finance', name: 'Finance', icon: 'BarChart', description: 'Financiële planning en rapportage', tools: ['Excel', 'SAP', 'Power BI', 'Exact'] },
  { id: 'csc', name: 'Customer Service', icon: 'Headset', description: 'Klantenservice en support', tools: ['Zendesk', 'Freshdesk', 'Intercom', 'Outlook'] },
  { id: 'facilities', name: 'Facilities', icon: 'Building2', description: 'Facilitaire diensten en vastgoed', tools: ['Planon', 'MS Office', 'AutoCAD'] },
  { id: 'lease', name: 'Lease & Verhuur', icon: 'Key', description: 'Leasecontracten en wagenpark', tools: ['LeasePlan Portal', 'Excel', 'Salesforce', 'Outlook'] },
  { id: 'aftersales', name: 'Aftersales', icon: 'Wrench', description: 'Service, onderhoud en garantie', tools: ['Autoline', 'DMS', 'WhatsApp Business', 'Outlook'] },
];

export const LEVELS: DifficultyLevel[] = ['beginner', 'gemiddeld', 'gevorderd'];

// ─── Account System ───────────────────────────────────────────────────────────

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string; // simple hash for localStorage
  name: string;
  createdAt: string;
  lastLoginAt: string;
  profile?: LearnerProfile;
}

// ─── Learner System ───────────────────────────────────────────────────────────

export interface LearnerProfile {
  id: string;
  name: string;
  department: string;
  departmentId: string;
  role: string;
  aiExperience: AIExperienceLevel;
  learningStyle: LearningStyle;
  availableTime: SessionTime;
  currentTools: string[];
  mainChallenge: string;
  learningGoal: string;
  analysisResult?: LearnerAnalysis;
  createdAt: string;
}

export interface LearnerAnalysis {
  recommendedLevel: DifficultyLevel;
  learningPersona: string;
  personaDescription: string;
  strengths: string[];
  focusAreas: string[];
  customizedApproach: string;
  estimatedPath: string;
}

// ─── Progress & Tracking ──────────────────────────────────────────────────────

export interface ModuleProgress {
  moduleId: string;
  departmentId: string;
  level: DifficultyLevel;
  moduleIndex: number;
  completed: boolean;
  score?: number;
  maxScore?: number;
  timeSpentSeconds?: number;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  answers?: number[]; // stored answer indices
}

// ─── Badge System ─────────────────────────────────────────────────────────────

export type BadgeId =
  | 'first_module'
  | 'perfect_score'
  | 'speed_learner'
  | 'consistent_5'
  | 'dept_beginner'
  | 'dept_intermediate'
  | 'dept_advanced'
  | 'all_rounder'
  | 'marathon'       // 60+ min total
  | 'early_adopter';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // emoji
  earnedAt?: string;
  earned: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface LearnerStats {
  totalModulesCompleted: number;
  totalTimeSeconds: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number; // consecutive days
  totalAttempts: number;
  modulesByDept: Record<string, number>;
  modulesByLevel: Record<DifficultyLevel, number>;
  recentActivity: { date: string; modulesCompleted: number }[];
  weakAreas: string[];   // dept/level combos with low scores
  strongAreas: string[]; // dept/level combos with high scores
}
