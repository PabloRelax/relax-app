export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      channels: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          label: string
          requires_photo: boolean | null
          sort_order: number | null
          template_id: string | null
        }
        Insert: {
          id?: string
          label: string
          requires_photo?: boolean | null
          sort_order?: number | null
          template_id?: string | null
        }
        Update: {
          id?: string
          label?: string
          requires_photo?: boolean | null
          sort_order?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platform_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cities: {
        Row: {
          color_tag: string | null
          created_at: string | null
          id: string
          name: string
          short_name: string
        }
        Insert: {
          color_tag?: string | null
          created_at?: string | null
          id?: string
          name: string
          short_name: string
        }
        Update: {
          color_tag?: string | null
          created_at?: string | null
          id?: string
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      cleaners: {
        Row: {
          abn: string | null
          account_number: string | null
          active: boolean
          address: string | null
          auth_user_id: string | null
          base_rate: number
          bsb: string | null
          calendar_colour: string | null
          city: string
          cleaner_xero_name: string
          cleaning_couple: string | null
          created_at: string | null
          display_name: string
          email: string | null
          extra_comments: string | null
          fri_in: boolean | null
          fri_out: boolean | null
          general_comments: string | null
          hours_goal: number | null
          id: number
          key_ring_number: string | null
          linen_storage_location: string | null
          mobile: string | null
          mon_in: boolean | null
          mon_out: boolean | null
          name: string | null
          platform_user_id: string
          registered_for_gst: boolean | null
          sat_in: boolean | null
          sat_out: boolean | null
          suburb: string | null
          sun_in: boolean | null
          sun_out: boolean | null
          thu_in: boolean | null
          thu_out: boolean | null
          tue_in: boolean | null
          tue_out: boolean | null
          updated_at: string | null
          wed_in: boolean | null
          wed_out: boolean | null
          weekly_updates: string | null
        }
        Insert: {
          abn?: string | null
          account_number?: string | null
          active?: boolean
          address?: string | null
          auth_user_id?: string | null
          base_rate: number
          bsb?: string | null
          calendar_colour?: string | null
          city: string
          cleaner_xero_name: string
          cleaning_couple?: string | null
          created_at?: string | null
          display_name: string
          email?: string | null
          extra_comments?: string | null
          fri_in?: boolean | null
          fri_out?: boolean | null
          general_comments?: string | null
          hours_goal?: number | null
          id?: number
          key_ring_number?: string | null
          linen_storage_location?: string | null
          mobile?: string | null
          mon_in?: boolean | null
          mon_out?: boolean | null
          name?: string | null
          platform_user_id: string
          registered_for_gst?: boolean | null
          sat_in?: boolean | null
          sat_out?: boolean | null
          suburb?: string | null
          sun_in?: boolean | null
          sun_out?: boolean | null
          thu_in?: boolean | null
          thu_out?: boolean | null
          tue_in?: boolean | null
          tue_out?: boolean | null
          updated_at?: string | null
          wed_in?: boolean | null
          wed_out?: boolean | null
          weekly_updates?: string | null
        }
        Update: {
          abn?: string | null
          account_number?: string | null
          active?: boolean
          address?: string | null
          auth_user_id?: string | null
          base_rate?: number
          bsb?: string | null
          calendar_colour?: string | null
          city?: string
          cleaner_xero_name?: string
          cleaning_couple?: string | null
          created_at?: string | null
          display_name?: string
          email?: string | null
          extra_comments?: string | null
          fri_in?: boolean | null
          fri_out?: boolean | null
          general_comments?: string | null
          hours_goal?: number | null
          id?: number
          key_ring_number?: string | null
          linen_storage_location?: string | null
          mobile?: string | null
          mon_in?: boolean | null
          mon_out?: boolean | null
          name?: string | null
          platform_user_id?: string
          registered_for_gst?: boolean | null
          sat_in?: boolean | null
          sat_out?: boolean | null
          suburb?: string | null
          sun_in?: boolean | null
          sun_out?: boolean | null
          thu_in?: boolean | null
          thu_out?: boolean | null
          tue_in?: boolean | null
          tue_out?: boolean | null
          updated_at?: string | null
          wed_in?: boolean | null
          wed_out?: boolean | null
          weekly_updates?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaners_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: true
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cleaners_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cleaning_task_photos: {
        Row: {
          cleaner_id: number
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: number
          item_id: string | null
          item_type: string | null
          notes: string | null
          photo_taken_at: string | null
          photo_url: string
          task_id: number
        }
        Insert: {
          cleaner_id: number
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: number
          item_id?: string | null
          item_type?: string | null
          notes?: string | null
          photo_taken_at?: string | null
          photo_url: string
          task_id: number
        }
        Update: {
          cleaner_id?: number
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: number
          item_id?: string | null
          item_type?: string | null
          notes?: string | null
          photo_taken_at?: string | null
          photo_url?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_task_photos_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["task_id"]
          },
        ]
      }
      cleaning_tasks: {
        Row: {
          assigned_cleaner_names: string | null
          assigned_coordinator_name: string | null
          bonus: string | null
          cleaner1_id: number | null
          cleaner2_id: number | null
          cleaner3_id: number | null
          cleaner4_id: number | null
          cleaning_issues: string | null
          completed_by: string | null
          completed_on: string | null
          coordinator_notes: string | null
          created_at: string
          finish_by: string | null
          finished_at: string | null
          id: number
          inspection_issues: string | null
          invoice_notes: string | null
          issue_category: string | null
          issue_status: string | null
          key_situation_confirmed: boolean | null
          key_situation_confirmed_at: string | null
          key_situation_confirmed_by: string | null
          maintenance_issues: string | null
          manual_notes: string | null
          notes: string | null
          photos_link: string | null
          platform_user_id: string
          priority_tag: string | null
          property_id: number
          property_specifics_confirmed: boolean | null
          property_specifics_confirmed_at: string | null
          property_specifics_confirmed_by: string | null
          reported_via: string | null
          reservation_id: number | null
          scheduled_date: string
          second_keyset_confirmed: boolean | null
          second_keyset_confirmed_at: string | null
          second_keyset_confirmed_by: string | null
          special_request: string | null
          special_request_confirmed: boolean | null
          special_request_confirmed_at: string | null
          special_request_confirmed_by: string | null
          start_after: string | null
          start_at: string | null
          started_at: string | null
          status: string
          task_category: string
          task_type_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_cleaner_names?: string | null
          assigned_coordinator_name?: string | null
          bonus?: string | null
          cleaner1_id?: number | null
          cleaner2_id?: number | null
          cleaner3_id?: number | null
          cleaner4_id?: number | null
          cleaning_issues?: string | null
          completed_by?: string | null
          completed_on?: string | null
          coordinator_notes?: string | null
          created_at?: string
          finish_by?: string | null
          finished_at?: string | null
          id?: number
          inspection_issues?: string | null
          invoice_notes?: string | null
          issue_category?: string | null
          issue_status?: string | null
          key_situation_confirmed?: boolean | null
          key_situation_confirmed_at?: string | null
          key_situation_confirmed_by?: string | null
          maintenance_issues?: string | null
          manual_notes?: string | null
          notes?: string | null
          photos_link?: string | null
          platform_user_id: string
          priority_tag?: string | null
          property_id: number
          property_specifics_confirmed?: boolean | null
          property_specifics_confirmed_at?: string | null
          property_specifics_confirmed_by?: string | null
          reported_via?: string | null
          reservation_id?: number | null
          scheduled_date: string
          second_keyset_confirmed?: boolean | null
          second_keyset_confirmed_at?: string | null
          second_keyset_confirmed_by?: string | null
          special_request?: string | null
          special_request_confirmed?: boolean | null
          special_request_confirmed_at?: string | null
          special_request_confirmed_by?: string | null
          start_after?: string | null
          start_at?: string | null
          started_at?: string | null
          status?: string
          task_category?: string
          task_type_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_cleaner_names?: string | null
          assigned_coordinator_name?: string | null
          bonus?: string | null
          cleaner1_id?: number | null
          cleaner2_id?: number | null
          cleaner3_id?: number | null
          cleaner4_id?: number | null
          cleaning_issues?: string | null
          completed_by?: string | null
          completed_on?: string | null
          coordinator_notes?: string | null
          created_at?: string
          finish_by?: string | null
          finished_at?: string | null
          id?: number
          inspection_issues?: string | null
          invoice_notes?: string | null
          issue_category?: string | null
          issue_status?: string | null
          key_situation_confirmed?: boolean | null
          key_situation_confirmed_at?: string | null
          key_situation_confirmed_by?: string | null
          maintenance_issues?: string | null
          manual_notes?: string | null
          notes?: string | null
          photos_link?: string | null
          platform_user_id?: string
          priority_tag?: string | null
          property_id?: number
          property_specifics_confirmed?: boolean | null
          property_specifics_confirmed_at?: string | null
          property_specifics_confirmed_by?: string | null
          reported_via?: string | null
          reservation_id?: number | null
          scheduled_date?: string
          second_keyset_confirmed?: boolean | null
          second_keyset_confirmed_at?: string | null
          second_keyset_confirmed_by?: string | null
          special_request?: string | null
          special_request_confirmed?: boolean | null
          special_request_confirmed_at?: string | null
          special_request_confirmed_by?: string | null
          start_after?: string | null
          start_at?: string | null
          started_at?: string | null
          status?: string
          task_category?: string
          task_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_cleaner1_id_fkey"
            columns: ["cleaner1_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner2_id_fkey"
            columns: ["cleaner2_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner3_id_fkey"
            columns: ["cleaner3_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner4_id_fkey"
            columns: ["cleaner4_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "cleaning_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          business_address: string | null
          charge_per_hour: boolean
          created_at: string
          display_name: string
          email: string | null
          id: number
          invoice_per_property: boolean
          observations: string | null
          payment_terms: string | null
          phone: string | null
          platform_user_id: string
          separate_invoices_per_month: boolean
          source: string | null
          special_invoice_description: string | null
          special_invoice_item_request: string | null
          sub_type: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_address?: string | null
          charge_per_hour?: boolean
          created_at?: string
          display_name: string
          email?: string | null
          id?: number
          invoice_per_property?: boolean
          observations?: string | null
          payment_terms?: string | null
          phone?: string | null
          platform_user_id: string
          separate_invoices_per_month?: boolean
          source?: string | null
          special_invoice_description?: string | null
          special_invoice_item_request?: string | null
          sub_type?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_address?: string | null
          charge_per_hour?: boolean
          created_at?: string
          display_name?: string
          email?: string | null
          id?: number
          invoice_per_property?: boolean
          observations?: string | null
          payment_terms?: string | null
          phone?: string | null
          platform_user_id?: string
          separate_invoices_per_month?: boolean
          source?: string | null
          special_invoice_description?: string | null
          special_invoice_item_request?: string | null
          sub_type?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      properties: {
        Row: {
          access_info: string | null
          airbnb_link: string | null
          bath_mats: number | null
          bath_towels: number | null
          bathrooms: number | null
          bbq: boolean
          bedrooms: number | null
          bonus_amount: number | null
          bonus_description: string | null
          city_id: string
          cleaning_exc_gst: number | null
          client_id: number
          client_property_nickname: string | null
          coffee_maker: boolean
          comments_for_clients: string | null
          consumables_exc_gst: number | null
          consumables_info: string | null
          created_at: string
          default_cleaner: string | null
          dishwasher: boolean
          dryer: boolean
          face_washers: number | null
          general_comments: string | null
          gmaps_location: string
          hand_towels: number | null
          has_second_keyset: string | null
          hours_per_service: number | null
          hsk_key_tag: string | null
          id: number
          key_comments: string | null
          key_situation_cleaner: string | null
          king_beds: number | null
          king_satin_top: number | null
          king_sheets: number | null
          linen_exc_gst: number | null
          parking_info: string | null
          pillow_cases: number | null
          platform_user_id: string
          pool: boolean
          pool_towels: number | null
          property_hourly_rate: number
          property_specifics_link: string | null
          queen_beds: number | null
          queen_satin_top: number | null
          queen_sheets: number | null
          service_sub_type: string | null
          service_type_id: string
          short_address: string
          single_beds: number | null
          single_satin_top: number | null
          single_sheets: number | null
          status: string
          storage_id: string | null
          suburb_id: string
          tea_towels: number | null
          updated_at: string
          washer: boolean
          wine: boolean
        }
        Insert: {
          access_info?: string | null
          airbnb_link?: string | null
          bath_mats?: number | null
          bath_towels?: number | null
          bathrooms?: number | null
          bbq?: boolean
          bedrooms?: number | null
          bonus_amount?: number | null
          bonus_description?: string | null
          city_id: string
          cleaning_exc_gst?: number | null
          client_id: number
          client_property_nickname?: string | null
          coffee_maker?: boolean
          comments_for_clients?: string | null
          consumables_exc_gst?: number | null
          consumables_info?: string | null
          created_at?: string
          default_cleaner?: string | null
          dishwasher?: boolean
          dryer?: boolean
          face_washers?: number | null
          general_comments?: string | null
          gmaps_location: string
          hand_towels?: number | null
          has_second_keyset?: string | null
          hours_per_service?: number | null
          hsk_key_tag?: string | null
          id?: number
          key_comments?: string | null
          key_situation_cleaner?: string | null
          king_beds?: number | null
          king_satin_top?: number | null
          king_sheets?: number | null
          linen_exc_gst?: number | null
          parking_info?: string | null
          pillow_cases?: number | null
          platform_user_id: string
          pool?: boolean
          pool_towels?: number | null
          property_hourly_rate: number
          property_specifics_link?: string | null
          queen_beds?: number | null
          queen_satin_top?: number | null
          queen_sheets?: number | null
          service_sub_type?: string | null
          service_type_id: string
          short_address: string
          single_beds?: number | null
          single_satin_top?: number | null
          single_sheets?: number | null
          status: string
          storage_id?: string | null
          suburb_id: string
          tea_towels?: number | null
          updated_at?: string
          washer?: boolean
          wine?: boolean
        }
        Update: {
          access_info?: string | null
          airbnb_link?: string | null
          bath_mats?: number | null
          bath_towels?: number | null
          bathrooms?: number | null
          bbq?: boolean
          bedrooms?: number | null
          bonus_amount?: number | null
          bonus_description?: string | null
          city_id?: string
          cleaning_exc_gst?: number | null
          client_id?: number
          client_property_nickname?: string | null
          coffee_maker?: boolean
          comments_for_clients?: string | null
          consumables_exc_gst?: number | null
          consumables_info?: string | null
          created_at?: string
          default_cleaner?: string | null
          dishwasher?: boolean
          dryer?: boolean
          face_washers?: number | null
          general_comments?: string | null
          gmaps_location?: string
          hand_towels?: number | null
          has_second_keyset?: string | null
          hours_per_service?: number | null
          hsk_key_tag?: string | null
          id?: number
          key_comments?: string | null
          key_situation_cleaner?: string | null
          king_beds?: number | null
          king_satin_top?: number | null
          king_sheets?: number | null
          linen_exc_gst?: number | null
          parking_info?: string | null
          pillow_cases?: number | null
          platform_user_id?: string
          pool?: boolean
          pool_towels?: number | null
          property_hourly_rate?: number
          property_specifics_link?: string | null
          queen_beds?: number | null
          queen_satin_top?: number | null
          queen_sheets?: number | null
          service_sub_type?: string | null
          service_type_id?: string
          short_address?: string
          single_beds?: number | null
          single_satin_top?: number | null
          single_sheets?: number | null
          status?: string
          storage_id?: string | null
          suburb_id?: string
          tea_towels?: number | null
          updated_at?: string
          washer?: boolean
          wine?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "properties_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "properties_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "property_service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_storage_id_fkey"
            columns: ["storage_id"]
            isOneToOne: false
            referencedRelation: "storages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_suburb_id_fkey"
            columns: ["suburb_id"]
            isOneToOne: false
            referencedRelation: "suburbs"
            referencedColumns: ["id"]
          },
        ]
      }
      property_icals: {
        Row: {
          active: boolean
          created_at: string | null
          id: number
          platform: string | null
          property_id: number
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          id?: number
          platform?: string | null
          property_id: number
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          id?: number
          platform?: string | null
          property_id?: number
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_icals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_icals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_service_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platform_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_types_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      property_specifics_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          property_id: number
          requires_photo: boolean | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          property_id: number
          requires_photo?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          property_id?: number
          requires_photo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "property_specifics_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_specifics_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          end_date: string
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: number
          notes: string | null
          platform_user_id: string
          property_id: number
          reservation_uid: string
          source: string | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: number
          notes?: string | null
          platform_user_id: string
          property_id: number
          reservation_uid: string
          source?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: number
          notes?: string | null
          platform_user_id?: string
          property_id?: number
          reservation_uid?: string
          source?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      special_requirements_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          requires_photo: boolean | null
          task_id: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          requires_photo?: boolean | null
          task_id: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          requires_photo?: boolean | null
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "special_requirements_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_requirements_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["task_id"]
          },
        ]
      }
      storages: {
        Row: {
          address: string | null
          city_id: string
          created_at: string | null
          id: string
          name: string
          platform_user_id: string
        }
        Insert: {
          address?: string | null
          city_id: string
          created_at?: string | null
          id?: string
          name: string
          platform_user_id: string
        }
        Update: {
          address?: string | null
          city_id?: string
          created_at?: string | null
          id?: string
          name?: string
          platform_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storages_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      suburbs: {
        Row: {
          city_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "suburbs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity_log: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          details: string | null
          id: number
          metadata: Json | null
          platform_user_id: string
          task_id: number
          title: string | null
          type: string
          visibility: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: number
          metadata?: Json | null
          platform_user_id: string
          task_id: number
          title?: string | null
          type: string
          visibility?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          id?: number
          metadata?: Json | null
          platform_user_id?: string
          task_id?: number
          title?: string | null
          type?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_activity_log_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_checklist_log: {
        Row: {
          checklist_item_id: string | null
          cleaner_id: number | null
          completed_at: string | null
          id: string
          photo_url: string | null
          platform_user_id: string
          task_id: number | null
        }
        Insert: {
          checklist_item_id?: string | null
          cleaner_id?: number | null
          completed_at?: string | null
          id?: string
          photo_url?: string | null
          platform_user_id: string
          task_id?: number | null
        }
        Update: {
          checklist_item_id?: string | null
          cleaner_id?: number | null
          completed_at?: string | null
          id?: string
          photo_url?: string | null
          platform_user_id?: string
          task_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_log_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_log_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_log_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_checklist_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "cleaning_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operations_table_view"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_checklist_progress: {
        Row: {
          checked: boolean
          cleaner_id: number | null
          created_at: string | null
          id: number
          item_id: string
          item_type: string
          task_id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checked?: boolean
          cleaner_id?: number | null
          created_at?: string | null
          id?: number
          item_id: string
          item_type: string
          task_id: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checked?: boolean
          cleaner_id?: number | null
          created_at?: string | null
          id?: number
          item_id?: string
          item_type?: string
          task_id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      task_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          platform_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_types_platform_user_id_fkey"
            columns: ["platform_user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_role_types: {
        Row: {
          id: string
          is_default: boolean
          name: string
          permissions: Json | null
          platform_user_id: string
        }
        Insert: {
          id?: string
          is_default?: boolean
          name: string
          permissions?: Json | null
          platform_user_id: string
        }
        Update: {
          id?: string
          is_default?: boolean
          name?: string
          permissions?: Json | null
          platform_user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          platform_user_id: string
          role_type_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform_user_id: string
          role_type_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform_user_id?: string
          role_type_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_type_id_fkey"
            columns: ["role_type_id"]
            isOneToOne: false
            referencedRelation: "user_role_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      operations_table_view: {
        Row: {
          assigned_coordinator_name: string | null
          bonus: string | null
          bonus_amount: number | null
          bonus_description: string | null
          city_color_tag: string | null
          city_short_name: string | null
          cleaner1_id: number | null
          cleaner1_name: string | null
          cleaner1_rate: number | null
          cleaner2_id: number | null
          cleaner2_name: string | null
          cleaner2_rate: number | null
          cleaner3_id: number | null
          cleaner3_name: string | null
          cleaner3_rate: number | null
          cleaner4_id: number | null
          cleaner4_name: string | null
          cleaner4_rate: number | null
          cleaning_issues: string | null
          client_display_name: string | null
          client_property_nickname: string | null
          completed_by: string | null
          completed_on: string | null
          coordinator_notes: string | null
          created_at: string | null
          finish_by: string | null
          finished_at: string | null
          has_second_keyset: string | null
          hours_per_service: number | null
          inspection_issues: string | null
          invoice_notes: string | null
          key_situation_cleaner: string | null
          key_situation_confirmed: boolean | null
          key_situation_confirmed_at: string | null
          key_situation_confirmed_by: string | null
          maintenance_issues: string | null
          manual_notes: string | null
          photos_link: string | null
          priority_tag: string | null
          property_id: number | null
          property_specifics_confirmed: boolean | null
          property_specifics_confirmed_at: string | null
          property_specifics_confirmed_by: string | null
          property_specifics_link: string | null
          reported_via: string | null
          scheduled_date: string | null
          second_keyset_confirmed: boolean | null
          second_keyset_confirmed_at: string | null
          second_keyset_confirmed_by: string | null
          service_type_name: string | null
          short_address: string | null
          special_request: string | null
          special_request_confirmed: boolean | null
          special_request_confirmed_at: string | null
          special_request_confirmed_by: string | null
          start_after: string | null
          start_at: string | null
          started_at: string | null
          status: string | null
          storage_name: string | null
          suburb_name: string | null
          task_id: number | null
          task_type_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_cleaner1_id_fkey"
            columns: ["cleaner1_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner2_id_fkey"
            columns: ["cleaner2_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner3_id_fkey"
            columns: ["cleaner3_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_cleaner4_id_fkey"
            columns: ["cleaner4_id"]
            isOneToOne: false
            referencedRelation: "cleaners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users_view: {
        Row: {
          created_at: string | null
          email: string | null
          permissions: Json | null
          platform_user_id: string | null
          role_name: string | null
          role_type_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_type_id_fkey"
            columns: ["role_type_id"]
            isOneToOne: false
            referencedRelation: "user_role_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
