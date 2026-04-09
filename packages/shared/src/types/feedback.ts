/** Feedback submission. PRD Section 9.1 */
export interface FeedbackSubmission {
  id: string;
  userId: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  category: 'bug' | 'feature_request' | 'general';
  subject: string;
  description: string;
  stepsToReproduce: string | null;
  severity: 'minor' | 'moderate' | 'major' | 'critical' | null;
  isUrgent: boolean;
  screenshots: string[];
  metadata: FeedbackMetadata;
  status: FeedbackStatus;
  adminNotes: AdminNote[];
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackStatus =
  | 'new'
  | 'in_review'
  | 'planned'
  | 'in_progress'
  | 'resolved'
  | 'wont_fix'
  | 'duplicate';

export interface FeedbackMetadata {
  appVersion: string;
  page: string;
  browser: string;
  os: string;
  viewport: string;
  timezone: string;
  settingsSnapshot: Record<string, unknown>;
  sessionState: string;
}

export interface AdminNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
