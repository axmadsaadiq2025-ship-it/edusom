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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          level: number | null
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number | null
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number | null
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          alt_phone: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          national_id: string | null
          notes: string | null
          occupation: string | null
          phone: string
          school_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          phone: string
          school_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          national_id?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string
          school_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          capacity: number | null
          class_id: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          class_id: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          parent_id: string
          relationship: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id: string
          relationship?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id?: string
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string | null
          address: string | null
          admission_date: string
          admission_number: string
          class_id: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relation: string | null
          id: string
          last_name: string
          middle_name: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          school_id: string
          section_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_year_id?: string | null
          address?: string | null
          admission_date?: string
          admission_number: string
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id: string
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_year_id?: string | null
          address?: string | null
          admission_date?: string
          admission_number?: string
          class_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relation?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_seeds: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          created_at: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          employee_code: string
          full_name: string
          gender: string | null
          id: string
          joining_date: string | null
          notes: string | null
          phone: string | null
          qualification: string | null
          salary: number | null
          school_id: string
          specialization: string | null
          status: Database["public"]["Enums"]["employment_status"]
          updated_at: string
          user_id: string | null
          years_of_experience: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employee_code: string
          full_name: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          salary?: number | null
          school_id: string
          specialization?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employee_code?: string
          full_name?: string
          gender?: string | null
          id?: string
          joining_date?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          salary?: number | null
          school_id?: string
          specialization?: string | null
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
          user_id?: string | null
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_school_admin: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_school_staff: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_owner"
        | "principal"
        | "vice_principal"
        | "accountant"
        | "registrar"
        | "teacher"
        | "librarian"
        | "parent"
        | "student"
      employment_status:
        | "active"
        | "on_leave"
        | "suspended"
        | "terminated"
        | "resigned"
      gender_type: "male" | "female" | "other"
      student_status:
        | "active"
        | "inactive"
        | "graduated"
        | "transferred"
        | "suspended"
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
    Enums: {
      app_role: [
        "super_admin",
        "school_owner",
        "principal",
        "vice_principal",
        "accountant",
        "registrar",
        "teacher",
        "librarian",
        "parent",
        "student",
      ],
      employment_status: [
        "active",
        "on_leave",
        "suspended",
        "terminated",
        "resigned",
      ],
      gender_type: ["male", "female", "other"],
      student_status: [
        "active",
        "inactive",
        "graduated",
        "transferred",
        "suspended",
      ],
    },
  },
} as const
