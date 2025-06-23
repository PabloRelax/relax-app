export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PropertyWithClient = {
  id: number;
  client_property_nickname?: string;
  short_address?: string;
  clients: {
    display_name: string;
  } | null;
};

export type Database = {
  public: {
    Tables: {      
      cleaners: {
        Row: {
          id: number;
          platform_user_id: string;
          active: boolean;
          name: string | null;
          display_name: string;
          suburb: string | null;
          abn: string | null;
          bsb: string | null;
          account_number: string | null;
          registered_for_gst: boolean | null;
          mobile: string | null;
          email: string | null;
          address: string | null;
          calendar_colour: string | null;
          key_ring_number: string | null;
          cleaning_couple: string | null;
          linen_storage_location: string | null;
          cleaner_xero_name: string;
          base_rate: number;
          city: string;
          general_comments: string | null;
          weekly_updates: string | null;
          hours_goal: number | null;
          extra_comments: string | null;
          mon_in: boolean | null;
          mon_out: boolean | null;
          tue_in: boolean | null;
          tue_out: boolean | null;
          wed_in: boolean | null;
          wed_out: boolean | null;
          thu_in: boolean | null;
          thu_out: boolean | null;
          fri_in: boolean | null;
          fri_out: boolean | null;
          sat_in: boolean | null;
          sat_out: boolean | null;
          sun_in: boolean | null;
          sun_out: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['cleaners']['Row']>;
        Update: Partial<Database['public']['Tables']['cleaners']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'cleaners_platform_user_id_fkey';
            columns: ['platform_user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };      
      cleaning_tasks: {
        Row: {
          assigned_cleaner_names: string | null
          assigned_coordinator_name: string | null
          created_at: string
          id: number
          issue_category: string | null
          issue_status: string | null
          notes: string | null
          platform_user_id: string
          priority_tag: string | null
          property_id: number
          reservation_id: number | null
          scheduled_date: string
          status: string
          task_category: string
          task_type: string
          updated_at: string
        }
        Insert: {
          assigned_cleaner_names?: string | null
          assigned_coordinator_name?: string | null
          created_at?: string
          id?: number
          issue_category?: string | null
          issue_status?: string | null
          notes?: string | null
          platform_user_id: string
          priority_tag?: string | null
          property_id: number
          reservation_id?: number | null
          scheduled_date: string
          status?: string
          task_category?: string
          task_type: string
          updated_at?: string
        }
        Update: {
          assigned_cleaner_names?: string | null
          assigned_coordinator_name?: string | null
          created_at?: string
          id?: number
          issue_category?: string | null
          issue_status?: string | null
          notes?: string | null
          platform_user_id?: string
          priority_tag?: string | null
          property_id?: number
          reservation_id?: number | null
          scheduled_date?: string
          status?: string
          task_category?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
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
        Relationships: []
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
          city: string
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
          ical: string | null
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
          property_specifics: string | null
          property_specifics_link: string | null
          queen_beds: number | null
          queen_satin_top: number | null
          queen_sheets: number | null
          service_sub_type: string | null
          service_type: string
          short_address: string
          single_beds: number | null
          single_satin_top: number | null
          single_sheets: number | null
          status: string
          suburb: string
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
          city: string
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
          ical?: string | null
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
          property_specifics?: string | null
          property_specifics_link?: string | null
          queen_beds?: number | null
          queen_satin_top?: number | null
          queen_sheets?: number | null
          service_sub_type?: string | null
          service_type: string
          short_address: string
          single_beds?: number | null
          single_satin_top?: number | null
          single_sheets?: number | null
          status: string
          suburb: string
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
          city?: string
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
          ical?: string | null
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
          property_specifics?: string | null
          property_specifics_link?: string | null
          queen_beds?: number | null
          queen_satin_top?: number | null
          queen_sheets?: number | null
          service_sub_type?: string | null
          service_type?: string
          short_address?: string
          single_beds?: number | null
          single_satin_top?: number | null
          single_sheets?: number | null
          status?: string
          suburb?: string
          tea_towels?: number | null
          updated_at?: string
          washer?: boolean
          wine?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }

      task_activity_log: {
        Row: {
          id: number;
          created_at: string;
          task_id: number;
          type: string;
          title: string | null;
          details: string | null;
          amount: number | null;
          created_by: string | null;
          platform_user_id: string;
          visibility: string | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          task_id: number;
          type: string;
          title?: string | null;
          details?: string | null;
          amount?: number | null;
          created_by?: string | null;
          platform_user_id: string;
          visibility?: string | null;
          metadata: Record<string, unknown> | null;
        };
        Update: {
          task_id?: number;
          type?: string;
          title?: string | null;
          details?: string | null;
          amount?: number | null;
          created_by?: string | null;
          platform_user_id?: string;
          visibility?: string | null;
          metadata: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_activity_log_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_activity_log_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "cleaning_tasks";
            referencedColumns: ["id"];
          }
        ];
      };

    }
    Views: {
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
