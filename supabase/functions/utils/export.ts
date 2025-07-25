// relax-app\supabase\functions\utils\export.ts

import type { ActivityLog } from "@/generated-types/activity-logs";

export function convertLogsToCSV(logs: ActivityLog[]): string {
  const headers = ['ID', 'Type', 'Title', 'Details', 'Created At', 'Created By'];
  const rows = logs.map(log => [
    log.id,
    log.type,
    `"${log.title || ''}"`,  // quote to handle commas
    `"${log.details || ''}"`,
    new Date(log.created_at).toLocaleString(),
    log.created_by || '',
  ]);

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csvContent;
}
