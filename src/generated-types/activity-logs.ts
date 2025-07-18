// src/types/activity-log.ts
export type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json | undefined } 
  | Json[];

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
  metadata?: Json | null;  // Changed to match Supabase's type
};