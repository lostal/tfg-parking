export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notified: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notified?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notified?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cession_rules: {
        Row: {
          created_at: string;
          day_of_week: number | null;
          id: string;
          is_active: boolean;
          rule_type: Database["public"]["Enums"]["cession_rule_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          day_of_week?: number | null;
          id?: string;
          is_active?: boolean;
          rule_type: Database["public"]["Enums"]["cession_rule_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number | null;
          id?: string;
          is_active?: boolean;
          rule_type?: Database["public"]["Enums"]["cession_rule_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cession_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cessions: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          spot_id: string;
          status: Database["public"]["Enums"]["cession_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          spot_id: string;
          status?: Database["public"]["Enums"]["cession_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          spot_id?: string;
          status?: Database["public"]["Enums"]["cession_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cessions_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          spot_id: string;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notes?: string | null;
          spot_id: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          spot_id?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      spots: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          position_x: number | null;
          position_y: number | null;
          type: Database["public"]["Enums"]["spot_type"];
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          position_x?: number | null;
          position_y?: number | null;
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          position_x?: number | null;
          position_y?: number | null;
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spots_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_config: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_microsoft_tokens: {
        Row: {
          access_token: string;
          created_at: string;
          current_ooo_status: boolean;
          current_ooo_until: string | null;
          last_calendar_sync_at: string | null;
          last_ooo_check_at: string | null;
          outlook_calendar_id: string | null;
          refresh_token: string;
          scopes: string[];
          teams_conversation_id: string | null;
          teams_tenant_id: string | null;
          teams_user_id: string | null;
          token_expires_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          current_ooo_status?: boolean;
          current_ooo_until?: string | null;
          last_calendar_sync_at?: string | null;
          last_ooo_check_at?: string | null;
          outlook_calendar_id?: string | null;
          refresh_token: string;
          scopes?: string[];
          teams_conversation_id?: string | null;
          teams_tenant_id?: string | null;
          teams_user_id?: string | null;
          token_expires_at: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          current_ooo_status?: boolean;
          current_ooo_until?: string | null;
          last_calendar_sync_at?: string | null;
          last_ooo_check_at?: string | null;
          outlook_calendar_id?: string | null;
          refresh_token?: string;
          scopes?: string[];
          teams_conversation_id?: string | null;
          teams_tenant_id?: string | null;
          teams_user_id?: string | null;
          token_expires_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_microsoft_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          auto_cede_days: number[] | null;
          auto_cede_notify: boolean;
          auto_cede_on_ooo: boolean;
          created_at: string;
          daily_digest_time: string | null;
          default_view: string;
          favorite_spot_ids: string[] | null;
          locale: string;
          notification_channel: string;
          notify_alert_triggered: boolean;
          notify_cession_reserved: boolean;
          notify_daily_digest: boolean;
          notify_reservation_confirmed: boolean;
          notify_reservation_reminder: boolean;
          notify_visitor_confirmed: boolean;
          outlook_calendar_name: string | null;
          outlook_create_events: boolean;
          outlook_sync_enabled: boolean;
          outlook_sync_interval: number | null;
          theme: string;
          updated_at: string;
          user_id: string;
          usual_arrival_time: string | null;
        };
        Insert: {
          auto_cede_days?: number[] | null;
          auto_cede_notify?: boolean;
          auto_cede_on_ooo?: boolean;
          created_at?: string;
          daily_digest_time?: string | null;
          default_view?: string;
          favorite_spot_ids?: string[] | null;
          locale?: string;
          notification_channel?: string;
          notify_alert_triggered?: boolean;
          notify_cession_reserved?: boolean;
          notify_daily_digest?: boolean;
          notify_reservation_confirmed?: boolean;
          notify_reservation_reminder?: boolean;
          notify_visitor_confirmed?: boolean;
          outlook_calendar_name?: string | null;
          outlook_create_events?: boolean;
          outlook_sync_enabled?: boolean;
          outlook_sync_interval?: number | null;
          theme?: string;
          updated_at?: string;
          user_id: string;
          usual_arrival_time?: string | null;
        };
        Update: {
          auto_cede_days?: number[] | null;
          auto_cede_notify?: boolean;
          auto_cede_on_ooo?: boolean;
          created_at?: string;
          daily_digest_time?: string | null;
          default_view?: string;
          favorite_spot_ids?: string[] | null;
          locale?: string;
          notification_channel?: string;
          notify_alert_triggered?: boolean;
          notify_cession_reserved?: boolean;
          notify_daily_digest?: boolean;
          notify_reservation_confirmed?: boolean;
          notify_reservation_reminder?: boolean;
          notify_visitor_confirmed?: boolean;
          outlook_calendar_name?: string | null;
          outlook_create_events?: boolean;
          outlook_sync_enabled?: boolean;
          outlook_sync_interval?: number | null;
          theme?: string;
          updated_at?: string;
          user_id?: string;
          usual_arrival_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      visitor_reservations: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          notification_sent: boolean;
          reserved_by: string;
          spot_id: string;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          visitor_company: string;
          visitor_email: string;
          visitor_name: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notes?: string | null;
          notification_sent?: boolean;
          reserved_by: string;
          spot_id: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          visitor_company: string;
          visitor_email: string;
          visitor_name: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          notification_sent?: boolean;
          reserved_by?: string;
          spot_id?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          visitor_company?: string;
          visitor_email?: string;
          visitor_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visitor_reservations_reserved_by_fkey";
            columns: ["reserved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visitor_reservations_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: { Args: never; Returns: boolean };
      is_management: { Args: never; Returns: boolean };
    };
    Enums: {
      cession_rule_type: "out_of_office" | "day_of_week";
      cession_status: "available" | "reserved" | "cancelled";
      reservation_status: "confirmed" | "cancelled";
      spot_type: "standard" | "management" | "visitor" | "disabled";
      user_role: "employee" | "management" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cession_rule_type: ["out_of_office", "day_of_week"],
      cession_status: ["available", "reserved", "cancelled"],
      reservation_status: ["confirmed", "cancelled"],
      spot_type: ["standard", "management", "visitor", "disabled"],
      user_role: ["employee", "management", "admin"],
    },
  },
} as const;
