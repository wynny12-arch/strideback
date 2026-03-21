// StrideBack TypeScript Interfaces
// All data models matching the PRD Section 7 schema

export type ActivityType = "running" | "gym" | "cycling" | "swimming" | "team_sports" | "other";
export type OtherActivity = "gym" | "cycling" | "swimming" | "team_sports" | "other";
export type ExperienceLevel = "beginner" | "intermediate" | "regular" | "competitive";
export type TrainingLoad = "none" | "light" | "moderate" | "high";
export type MainGoal = "return_to_running" | "reduce_pain" | "build_strength" | "stay_active";
export type InjuryRegion = "knee" | "achilles" | "hamstring" | "hip" | "foot_ankle" | "calf" | "lower_back" | "other";
export type SafetyStatus = "green" | "amber" | "red";
export type AIConfidence = "low" | "moderate" | "high";
export type WeeklyDecision = "progress" | "hold" | "deload" | "seek_clinician";
export type InjuryCaseStatus = "active" | "paused" | "closed";

export type MedicalUpdateType = 'physio_visit' | 'new_symptom' | 'scan_result' | 'medication' | 'other'

export interface MedicalUpdate {
  id: string
  date: string        // ISO string
  type: MedicalUpdateType
  text: string
}

export interface User {
  id: string;
  firstName: string;
  age: number;
  activityType: ActivityType[];
  otherActivities?: OtherActivity[];
  experienceLevel: ExperienceLevel;
  weeklyTrainingLoad: TrainingLoad;
  mainGoal: MainGoal;
  previousInjuries: string[];
  createdAt: string;
}

export interface InjuryCase {
  id: string;
  userId: string;
  region: InjuryRegion;
  knownDiagnosis: string | null;
  onsetDate: string;
  painScoreWorst: number; // 0-10
  painScoreCurrent: number; // 0-10
  aggravatingFactors: string[];
  currentTolerance: string;
  symptomsText: string;
  status: InjuryCaseStatus;
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  injuryCaseId: string;
  fileName: string;
  fileType: string;
  storageUrl: string;
  extractedText: string | null;
  createdAt: string;
}

export interface IntakeSummary {
  caseSummary: string;
  suspectedRegion: string;
  knownDiagnosis: string | null;
  onset: string;
  painScoreWorst: number;
  painScoreCurrent: number;
  aggravatingFactors: string[];
  relievingFactors: string[];
  currentActivityTolerance: string;
  keyConstraints: string[];
  missingInformation: string[];
  uncertaintyNotes: string[];
}

export interface SafetyReview {
  id?: string;
  injuryCaseId?: string;
  status: SafetyStatus;
  redFlags: string[];
  cautionFlags: string[];
  reasoningSummary: string;
  recommendedAction: string;
  createdAt?: string;
}

export interface SessionExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  tempo: string;
  painRule: string;
  reason: string;
  instructions?: string[];
  sortOrder?: number;
}

export interface RunningProtocol {
  instruction: string;
}

export interface StrengthSession {
  day: string;
  focus: string;
  warmUp?: string[];
  exercises: SessionExercise[];
}

export interface RunningAllowance {
  allowed: boolean;
  guidance: string;
  protocol: string[];
}

export interface RehabPlan {
  id?: string;
  injuryCaseId?: string;
  versionNumber?: number;
  phase: string;
  planGoal: string;
  aiConfidence: AIConfidence;
  runningAllowance: RunningAllowance;
  strengthSessions: StrengthSession[];
  mobilityRecovery: string[];
  educationNotes: string[];
  progressionRules: string[];
  stopOrEscalateRules: string[];
  reviewInDays: number;
  warnings: string[];
  active?: boolean;
  createdAt?: string;
}

export interface PlanSession {
  id: string;
  rehabPlanId: string;
  dayIndex: number;
  title: string;
  focus: string;
  runningProtocol: string[] | null;
  sessionOrder: number;
  exercises?: SessionExercise[];
}

export interface CoachExplainer {
  intro: string;
}

export interface CheckIn {
  id?: string;
  userId?: string;
  injuryCaseId?: string;
  planSessionId?: string | null;
  painBefore: number; // 0-10
  painDuring: number; // 0-10
  painAfter: number; // 0-10
  nextDayStiffness: number; // 0-10
  confidenceScore: number; // 1-4
  freeTextNotes: string | null;
  createdAt?: string;
}

export interface WeeklyReview {
  id?: string;
  injuryCaseId?: string;
  rehabPlanId?: string;
  decision: WeeklyDecision;
  summary: string;
  whatImproved: string[];
  whatNeedsAttention: string[];
  nextWeekChanges: string[];
  reasoning: string;
  confidence: AIConfidence;
  createdAt?: string;
}

export interface DashboardData {
  readinessScore: number;
  painTrend: Array<{ date: string; pain: number }>;
  sessionConsistency: number; // percentage 0-100
  weeklyLoad: Array<{ week: string; sessions: number }>;
  currentPhase: string;
  nextMilestone: string;
  streak: number;
  recentCheckIns: CheckIn[];
  weeklyReviewDue: boolean;
}

// Onboarding form state collected across screens 1-5
export interface OnboardingFormData {
  // Screen 2: Profile
  firstName: string;
  age: number | null;
  activityType: ActivityType | null;
  experienceLevel: ExperienceLevel | null;
  weeklyTrainingLoad: TrainingLoad | null;
  mainGoal: MainGoal | null;
  previousInjuries: string[];
  // Screen 3: Injury Area
  region: InjuryRegion | null;
  // Screen 4: Symptoms
  onsetDate: string;
  hasDiagnosis: "yes" | "no" | "not_sure";
  diagnosisName: string;
  painScoreWorst: number;
  painScoreCurrent: number;
  aggravatingFactors: string[];
  currentTolerance: string;
  additionalNotes: string;
  // Screen 5: Clinical Notes
  pastedNotes: string;
  uploadedFileName: string | null;
}
