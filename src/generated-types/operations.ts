// src\generated-types\operations.ts
export interface OperationsTask {
  task_id: number;
  scheduled_date: string;
  started_at: string | null;
  finished_at: string | null;
  start_at: string | null;
  finish_by: string | null;
  status: string;
  priority_tag: string | null;

  short_address: string;
  client_property_nickname: string | null;
  hours_per_service: number | null;

  suburb_name: string | null;
  city_short_name: string | null;
  city_color_tag: string | null;
  storage_name: string | null;

  client_display_name: string;

  service_type_name: string | null;
  task_type_name: string | null;

  cleaner1_name: string | null;
  cleaner1_rate: number | null;
  cleaner2_name: string | null;
  cleaner2_rate: number | null;
  cleaner3_name: string | null;
  cleaner3_rate: number | null;
  cleaner4_name: string | null;
  cleaner4_rate: number | null;

  assigned_coordinator_name: string | null;
  coordinator_notes: string | null;
  maintenance_issues: string | null;
  cleaning_issues: string | null;
  inspection_issues: string | null;
  reported_via: string | null;
  photos_link: string | null;

  special_request: string | null;
  special_request_confirmed: boolean;
  special_request_confirmed_by: string | null;
  special_request_confirmed_at: string | null;

  property_specifics_confirmed: boolean;
  property_specifics_confirmed_by: string | null;
  property_specifics_confirmed_at: string | null;

  key_situation_confirmed: boolean;
  key_situation_confirmed_by: string | null;
  key_situation_confirmed_at: string | null;

  second_keyset_confirmed: boolean;
  second_keyset_confirmed_by: string | null;
  second_keyset_confirmed_at: string | null;

  completed_on: string | null;
  completed_by: string | null;

  created_at: string;
  updated_at: string;
}
