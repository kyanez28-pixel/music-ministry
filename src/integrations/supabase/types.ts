export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      weekly_setlists: {
        Row: {
          id: string
          created_at: string
          user_id: string
          weekStart: string
          songIds: string[]
          rehearsalNotes: string | null
          practicedSongIds: string[] | null
        }
        Insert: { id?: string; created_at?: string; user_id: string; weekStart: string; songIds?: string[]; rehearsalNotes?: string | null; practicedSongIds?: string[] | null; }
        Update: { id?: string; created_at?: string; user_id?: string; weekStart?: string; songIds?: string[]; rehearsalNotes?: string | null; practicedSongIds?: string[] | null; }
        Relationships: []
      }
      scale_logs: {
        Row: { id: string; user_id: string; date: string; instrument: string; scale_id: string; created_at: string; }
        Insert: { id?: string; user_id: string; date: string; instrument: string; scale_id: string; created_at?: string; }
        Update: { id?: string; user_id?: string; date?: string; instrument?: string; scale_id?: string; created_at?: string; }
        Relationships: []
      }
      harmony_logs: {
        Row: { id: string; user_id: string; date: string; instrument: string; harmony_id: string; created_at: string; }
        Insert: { id?: string; user_id: string; date: string; instrument: string; harmony_id: string; created_at?: string; }
        Update: { id?: string; user_id?: string; date?: string; instrument?: string; harmony_id?: string; created_at?: string; }
        Relationships: []
      }
      rhythm_practice_logs: {
        Row: { id: string; user_id: string; date: string; instrument: string; rhythm_id: string; created_at: string; }
        Insert: { id?: string; user_id: string; date: string; instrument: string; rhythm_id: string; created_at?: string; }
        Update: { id?: string; user_id?: string; date?: string; instrument?: string; rhythm_id?: string; created_at?: string; }
        Relationships: []
      }
      melody_practice_logs: {
        Row: { id: string; user_id: string; date: string; instrument: string; melody_id: string; created_at: string; }
        Insert: { id?: string; user_id: string; date: string; instrument: string; melody_id: string; created_at?: string; }
        Update: { id?: string; user_id?: string; date?: string; instrument?: string; melody_id?: string; created_at?: string; }
        Relationships: []
      }
      scales: {
        Row: { id: string; user_id: string; name: string; type: string; folder_id: string | null; video_url: string | null; created_at: string; }
        Insert: { id?: string; user_id: string; name: string; type: string; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Update: { id?: string; user_id?: string; name?: string; type?: string; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Relationships: []
      }
      harmonies: {
        Row: { id: string; user_id: string; name: string; type: string; description: string | null; folder_id: string | null; video_url: string | null; created_at: string; }
        Insert: { id?: string; user_id: string; name: string; type: string; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Update: { id?: string; user_id?: string; name?: string; type?: string; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Relationships: []
      }
      rhythms: {
        Row: { id: string; user_id: string; name: string; type: string; bpm: number | null; description: string | null; folder_id: string | null; video_url: string | null; created_at: string; }
        Insert: { id?: string; user_id: string; name: string; type: string; bpm?: number | null; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Update: { id?: string; user_id?: string; name?: string; type?: string; bpm?: number | null; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Relationships: []
      }
      melodies: {
        Row: { id: string; user_id: string; name: string; instrument: string; status: string; bpm: number | null; key: string | null; time_signature: string | null; description: string | null; folder_id: string | null; video_url: string | null; created_at: string; }
        Insert: { id?: string; user_id: string; name: string; instrument: string; status: string; bpm?: number | null; key?: string | null; time_signature?: string | null; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Update: { id?: string; user_id?: string; name?: string; instrument?: string; status?: string; bpm?: number | null; key?: string | null; time_signature?: string | null; description?: string | null; folder_id?: string | null; video_url?: string | null; created_at?: string; }
        Relationships: []
      }
      scale_folders: { Row: { id: string; user_id: string; name: string; color: string; created_at: string; }; Insert: { id?: string; user_id: string; name: string; color: string; created_at?: string; }; Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; }; Relationships: []; }
      harmony_folders: { Row: { id: string; user_id: string; name: string; color: string; created_at: string; }; Insert: { id?: string; user_id: string; name: string; color: string; created_at?: string; }; Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; }; Relationships: []; }
      rhythm_folders: { Row: { id: string; user_id: string; name: string; color: string; created_at: string; }; Insert: { id?: string; user_id: string; name: string; color: string; created_at?: string; }; Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; }; Relationships: []; }
      melody_folders: { Row: { id: string; user_id: string; name: string; color: string; created_at: string; }; Insert: { id?: string; user_id: string; name: string; color: string; created_at?: string; }; Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; }; Relationships: []; }
      scale_images: { Row: { id: string; user_id: string; scale_id: string; storage_path: string; file_name: string; created_at: string; }; Insert: { id?: string; user_id: string; scale_id: string; storage_path: string; file_name: string; created_at?: string; }; Update: { id?: string; user_id?: string; scale_id?: string; storage_path?: string; file_name?: string; created_at?: string; }; Relationships: []; }
      harmony_images: { Row: { id: string; user_id: string; harmony_id: string; storage_path: string; file_name: string; created_at: string; }; Insert: { id?: string; user_id: string; harmony_id: string; storage_path: string; file_name: string; created_at?: string; }; Update: { id?: string; user_id?: string; harmony_id?: string; storage_path?: string; file_name?: string; created_at?: string; }; Relationships: []; }
      rhythm_images: { Row: { id: string; user_id: string; rhythm_id: string; storage_path: string; file_name: string; created_at: string; }; Insert: { id?: string; user_id: string; rhythm_id: string; storage_path: string; file_name: string; created_at?: string; }; Update: { id?: string; user_id?: string; rhythm_id?: string; storage_path?: string; file_name?: string; created_at?: string; }; Relationships: []; }
      melody_images: { Row: { id: string; user_id: string; melody_id: string; storage_path: string; file_name: string; created_at: string; }; Insert: { id?: string; user_id: string; melody_id: string; storage_path: string; file_name: string; created_at?: string; }; Update: { id?: string; user_id?: string; melody_id?: string; storage_path?: string; file_name?: string; created_at?: string; }; Relationships: []; }
      songs: {
        Row: { id: string; user_id: string; title: string; artist: string; key: string; genre: string; instrument: string; notes: string | null; reference_url: string | null; created_at: string; }
        Insert: { id?: string; user_id: string; title: string; artist: string; key: string; genre: string; instrument: string; notes?: string | null; reference_url?: string | null; created_at?: string; }
        Update: { id?: string; user_id?: string; title?: string; artist?: string; key?: string; genre?: string; instrument?: string; notes?: string | null; reference_url?: string | null; created_at?: string; }
        Relationships: []
      }
      exercises: { Row: { id: string; user_id: string; title: string; category: string; instrument: string; difficulty: string; status: string; bpm: number | null; key: string | null; description: string | null; video_url: string | null; progress: number | null; created_at: string; last_practiced: string | null; related_scale_id: string | null; related_harmony_id: string | null; }; Insert: { id?: string; user_id: string; title: string; category: string; instrument: string; difficulty: string; status: string; bpm?: number | null; key?: string | null; description?: string | null; video_url?: string | null; progress?: number | null; created_at?: string; last_practiced?: string | null; related_scale_id?: string | null; related_harmony_id?: string | null; }; Update: { id?: string; user_id?: string; title?: string; category?: string; instrument?: string; difficulty?: string; status?: string; bpm?: number | null; key?: string | null; description?: string | null; video_url?: string | null; progress?: number | null; created_at?: string; last_practiced?: string | null; related_scale_id?: string | null; related_harmony_id?: string | null; }; Relationships: []; }
      exercise_folders: { Row: { id: string; user_id: string; name: string; color: string; created_at: string; }; Insert: { id?: string; user_id: string; name: string; color: string; created_at?: string; }; Update: { id?: string; user_id?: string; name?: string; color?: string; created_at?: string; }; Relationships: []; }
      exercise_images: { Row: { id: string; user_id: string; exercise_id: string; storage_path: string; file_name: string; created_at: string; }; Insert: { id?: string; user_id: string; exercise_id: string; storage_path: string; file_name: string; created_at?: string; }; Update: { id?: string; user_id?: string; exercise_id?: string; storage_path?: string; file_name?: string; created_at?: string; }; Relationships: []; }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
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
