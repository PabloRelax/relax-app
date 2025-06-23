// supabase/functions/utils/dates.ts

/** Retorna la fecha de hoy en Brisbane como YYYY-MM-DD */
export function getBrisbaneToday(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}
