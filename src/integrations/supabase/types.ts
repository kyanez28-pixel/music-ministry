export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      melodies: {
        Row: {
          bpm: number | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          instrument: string
          key: string | null
          name: string
          progress: number | null
          status: string
          time_signature: string | null
          updated_at: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name: string
          progress?: number | null
          status?: string
          time_signature?: string | null
          updated_at?: string
        }
        Update: {
          bpm?: number | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name?: string
          progress?: number | null
          status?: string
          time_signature?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "melodies_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "melody_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      melody_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      melody_images: {
        Row: {
          created_at: string
          file_name: string
          id: string
          melody_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          melody_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          melody_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "melody_images_melody_id_fkey"
            columns: ["melody_id"]
            isOneToOne: false
            referencedRelation: "melodies"
            referencedColumns: ["id"]
          },
        ]
      }
      melody_practice_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          instrument: string
          melody_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          instrument?: string
          melody_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          instrument?: string
          melody_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "melody_practice_logs_melody_id_fkey"
            columns: ["melody_id"]
            isOneToOne: false
            referencedRelation: "melodies"
            referencedColumns: ["id"]
          },
        ]
      }
      rhythm_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      rhythm_images: {
        Row: {
          created_at: string
          file_name: string
          id: string
          rhythm_id: string
          sort_order: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          rhythm_id: string
          sort_order?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          rhythm_id?: string
          sort_order?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "rhythm_images_rhythm_id_fkey"
            columns: ["rhythm_id"]
            isOneToOne: false
            referencedRelation: "rhythms"
            referencedColumns: ["id"]
          },
        ]
      }
      rhythm_practice_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          instrument: string
          rhythm_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          instrument?: string
          rhythm_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          instrument?: string
          rhythm_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rhythm_practice_logs_rhythm_id_fkey"
            columns: ["rhythm_id"]
            isOneToOne: false
            referencedRelation: "rhythms"
            referencedColumns: ["id"]
          },
        ]
      }
      rhythms: {
        Row: {
          bpm: number | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          instrument: string
          key: string | null
          name: string
          progress: number | null
          status: string
          time_signature: string | null
          updated_at: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name: string
          progress?: number | null
          status?: string
          time_signature?: string | null
          updated_at?: string
        }
        Update: {
          bpm?: number | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          instrument?: string
          key?: string | null
          name?: string
          progress?: number | null
          status?: string
          time_signature?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rhythms_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "rhythm_folders"
            referencedColumns: ["id"]
          },
        ]
      }
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
