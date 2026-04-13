export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          recovery_start_date: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          recovery_start_date?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          recovery_start_date?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          title: string | null;
          content: string | null;
          mood: number | null;
          gratitude: string | null;
          cravings_experienced: boolean | null;
          cravings_intensity: number | null;
          device_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          title?: string | null;
          content?: string | null;
          mood?: number | null;
          gratitude?: string | null;
          cravings_experienced?: boolean | null;
          cravings_intensity?: number | null;
          device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          entry_date?: string;
          title?: string | null;
          content?: string | null;
          mood?: number | null;
          gratitude?: string | null;
          cravings_experienced?: boolean | null;
          cravings_intensity?: number | null;
          device_id?: string | null;
          updated_at?: string;
        };
      };
      step_work: {
        Row: {
          id: string;
          user_id: string;
          step_number: number;
          status: "not_started" | "in_progress" | "completed";
          start_date: string | null;
          completion_date: string | null;
          reflection: string | null;
          sponsor_name: string | null;
          sponsor_contact: string | null;
          device_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          step_number: number;
          status?: "not_started" | "in_progress" | "completed";
          start_date?: string | null;
          completion_date?: string | null;
          reflection?: string | null;
          sponsor_name?: string | null;
          sponsor_contact?: string | null;
          device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          step_number?: number;
          status?: "not_started" | "in_progress" | "completed";
          start_date?: string | null;
          completion_date?: string | null;
          reflection?: string | null;
          sponsor_name?: string | null;
          sponsor_contact?: string | null;
          device_id?: string | null;
          updated_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          check_in_date: string;
          check_in_type: "morning" | "evening";
          mood: number | null;
          gratitude_items: string[] | null;
          craving_level: number | null;
          craving_notes: string | null;
          device_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_date: string;
          check_in_type: "morning" | "evening";
          mood?: number | null;
          gratitude_items?: string[] | null;
          craving_level?: number | null;
          craving_notes?: string | null;
          device_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          check_in_date?: string;
          check_in_type?: "morning" | "evening";
          mood?: number | null;
          gratitude_items?: string[] | null;
          craving_level?: number | null;
          craving_notes?: string | null;
          device_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
