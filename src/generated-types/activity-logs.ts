// src/types/activity-log.ts

export type ActivityLog = {
  id: number;
  created_at: string;
  task_id: number;
  type: string;
  title?: string | null;
  details?: string | null;
  amount?: number | null;
  created_by?: string | null;
  platform_user_id: string;
  visibility?: string | null;
  metadata?: Record<string, unknown>;
};
