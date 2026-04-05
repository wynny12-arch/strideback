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

// --- v2 types ---
export type RunnerGoal = 'rehab' | 'prevention' | 'optimisation';
export type RunnerTier = 'novice' | 'intermediate' | 'advanced' | 'semi_elite';
export type RaceDistance = '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra' | 'other';
export type YearsRunning = 'less_than_1' | '1_to_3' | '3_to_7' | '7_plus';
export type ActivityLogType = 'run' | 'cycle' | 'swim' | 'gym' | 'ski' | 'walk' | 'other';

export interface RaceGoal {
  distance: RaceDistance | null;
  eventName: string | null;
  date: string | null;
  goalTime: string | null;
}

export interface ActivityLogEntry {
  id: string;
  date: string;                      // ISO date string
  type: ActivityLogType;
  durationMins: number | null;
  distanceValue: string | null;
  distanceUnit: 'miles' | 'km' | null;
  pace: string | null;               // e.g. "7:30/mi"
  avgHeartRate: number | null;
  feel: number;                      // 1–10
  notes: string | null;
  source: 'manual' | 'upload';
  imageDataUrl: string | null;       // base64 for uploaded Strava screenshots
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;                 // ISO string
}

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
  runnerTier?: RunnerTier;
  runnerGoals?: RunnerGoal[];        // all goals the runner selected
  activePhases?: RunnerGoal[];       // phases currently active — expands week by week
  phaseUnlocked?: RunnerGoal;        // set when a new phase was just unlocked this review
  runningAllowance: RunningAllowance;
  strengthSessions: StrengthSession[];
  preventionWork?: string[];         // prehab/stability exercises (shown when prevention is active)
  optimisationWork?: string[];       // performance exercises (shown when optimisation is active)
  mobilityRecovery: string[];
  educationNotes: string[];
  progressionRules: string[];
  stopOrEscalateRules: string[];
  scheduleLabel?: string;            // e.g. "Every other day" or "Daily" — shown large in hero
  weeklySchedule?: string;           // e.g. "3 sessions · Day 1, 3, 5 · ~25 min each"
  reviewInDays: number;
  checkinFrequencyDays?: number;     // how often to check in, based on tier
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

// Onboarding form state collected across screens
export interface OnboardingFormData {
  // Goals screen
  goals: RunnerGoal[];
  // Profile screen
  firstName: string;
  age: number | null;
  activityType: ActivityType | null;
  experienceLevel: ExperienceLevel | null;
  weeklyTrainingLoad: TrainingLoad | null;
  mainGoal: MainGoal | null;           // legacy — kept for backwards compat
  previousInjuries: string[];
  // Performance profile (v2)
  yearsRunning: YearsRunning | null;
  marathonPb: string | null;           // e.g. "3:45:00" or null
  fiveKPb: string | null;              // e.g. "22:30" or null
  // Race goal (structured, v2)
  raceGoal: RaceGoal | null;
  // Running profile (optional)
  weeklyMileage: string | null;
  distanceUnit: 'miles' | 'km';
  longestRecentRun: string | null;
  surface: 'road' | 'trail' | 'mixed' | 'treadmill' | null;
  typicalPace: string | null;
  trainingPlan: string | null;
  // Injury screens (only populated if goals includes 'rehab')
  region: InjuryRegion | null;
  onsetDate: string;
  hasDiagnosis: "yes" | "no" | "not_sure";
  diagnosisName: string;
  painScoreWorst: number;
  painScoreCurrent: number;
  aggravatingFactors: string[];
  currentTolerance: string;
  additionalNotes: string;
  pastedNotes: string;
  uploadedFileName: string | null;
}
