// ═══════════════════════════════════════════════════
// E-Internship Dishub — TypeScript Type Definitions
// ═══════════════════════════════════════════════════

// ─── Enums ─────────────────────────────────────────

export type UserRole = "applicant" | "admin" | "head";

export type ApplicantType = "slta" | "mahasiswa" | "fresh_graduate" | "instansi";

export type ApplicationStatus = "pending" | "reviewing" | "accepted" | "rejected";

export type DocumentType = "cv" | "cover_letter" | "id_card" | "proposal";

// ─── Core Models ───────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  applicant_type: ApplicantType | null;
  institution_name: string | null;
  phone: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: number;
  name: string;
  max_quota: number;
  active_applicants: number;
  remaining_quota: number;
  is_locked: boolean;
  // Admin-only stats (optional)
  pending_count?: number;
  reviewing_count?: number;
  accepted_count?: number;
  rejected_count?: number;
  total_count?: number;
}

export interface Application {
  id: number;
  user_id: number;
  division_id: number;
  status: ApplicationStatus;
  institution_name: string | null;
  study_program: string | null;
  internship_start: string | null;
  internship_end: string | null;
  r1_passed: boolean | null;
  r3_passed: boolean | null;
  r4_passed: boolean | null;
  algorithm_score: number | null;
  recommended_division_id: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Loaded relationships
  user?: User;
  division?: Division;
  recommended_division?: Division;
  documents?: Document[];
}

export interface Document {
  id: number;
  application_id: number;
  type: DocumentType;
  file_path: string;
  file_url?: string;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportLog {
  id: number;
  file_name: string;
  download_url: string;
  filters: Record<string, string> | null;
  exported_by: string;
  created_at: string;
}

// ─── Analytics (Head Dashboard) ────────────────────

export interface DivisionStat {
  division_name: string;
  count: number;
}

export interface ApplicantTypeStat {
  type: ApplicantType;
  count: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  count: number;
}

export interface DivisionCapacity {
  division_name: string;
  max_quota: number;
  active_applicants: number;
  percentage: number;
}

export interface Analytics {
  total_applicants: number;
  total_accepted: number;
  total_rejected: number;
  total_pending: number;
  total_reviewing: number;
  locked_divisions_count: number;
  applicants_per_division: DivisionStat[];
  applicant_type_breakdown: ApplicantTypeStat[];
  monthly_trend: MonthlyTrend[];
  division_capacity: DivisionCapacity[];
}

// ─── API Response Wrappers ─────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: PaginatedData<T>;
}

// ─── Auth Responses ────────────────────────────────

export interface LoginResponse {
  user: User;
  token: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
  unread_notifications: number;
}

// ─── Algorithm / Rule Results ──────────────────────

export interface RuleResults {
  r1_passed: boolean | null;
  r1_description: string;
  r1_detail?: string;
  r3_passed: boolean | null;
  r3_description: string;
  r3_detail?: string;
  r4_passed: boolean | null;
  r4_description: string;
  r4_detail?: string;
  algorithm_score: number | null;
  all_passed?: boolean;
}

export interface ApplicationDetail {
  application: Application;
  rule_results: RuleResults;
}

// ─── Export ────────────────────────────────────────

export interface ExportResult {
  download_url: string;
  file_name: string;
  export_log: ExportLog;
  total_rows: number;
}

export interface ExportFilters {
  date_from?: string;
  date_to?: string;
  division_id?: number;
  status?: ApplicationStatus;
  applicant_type?: ApplicantType;
}

// ─── Form Types ────────────────────────────────────

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  applicant_type: ApplicantType;
  institution_name: string;
  phone: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ApplicationFormData {
  division_id: number;
  institution_name: string;
  study_program: string;
  internship_start: string;
  internship_end: string;
}

export interface DecisionFormData {
  decision: "accepted" | "rejected";
  division_id?: number;
  rejection_reason?: string;
}
