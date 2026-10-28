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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      daily_path_progress: {
        Row: {
          box: number
          last_awarded_day: string | null
          last_jump: number
          updated_at: string
          user_id: string
        }
        Insert: {
          box?: number
          last_awarded_day?: string | null
          last_jump?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          box?: number
          last_awarded_day?: string | null
          last_jump?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enem_essays: {
        Row: {
          c1: number
          c2: number
          c3: number
          c4: number
          c5: number
          comentario: string | null
          created_at: string
          feedback: Json
          id: string
          imagem_path: string | null
          nota_total: number
          tema: string
          texto: string
          user_id: string | null
        }
        Insert: {
          c1: number
          c2: number
          c3: number
          c4: number
          c5: number
          comentario?: string | null
          created_at?: string
          feedback?: Json
          id?: string
          imagem_path?: string | null
          nota_total: number
          tema: string
          texto: string
          user_id?: string | null
        }
        Update: {
          c1?: number
          c2?: number
          c3?: number
          c4?: number
          c5?: number
          comentario?: string | null
          created_at?: string
          feedback?: Json
          id?: string
          imagem_path?: string | null
          nota_total?: number
          tema?: string
          texto?: string
          user_id?: string | null
        }
        Relationships: []
      }
      enem_exam_attempts: {
        Row: {
          acertos: number
          created_at: string
          finalizado_por_tempo: boolean
          id: string
          nome_prova: string
          nota: number
          respostas: Json
          tempo_gasto_segundos: number
          total_questoes: number
          user_id: string | null
        }
        Insert: {
          acertos: number
          created_at?: string
          finalizado_por_tempo?: boolean
          id?: string
          nome_prova: string
          nota: number
          respostas?: Json
          tempo_gasto_segundos?: number
          total_questoes: number
          user_id?: string | null
        }
        Update: {
          acertos?: number
          created_at?: string
          finalizado_por_tempo?: boolean
          id?: string
          nome_prova?: string
          nota?: number
          respostas?: Json
          tempo_gasto_segundos?: number
          total_questoes?: number
          user_id?: string | null
        }
        Relationships: []
      }
      enem_tutor: {
        Row: {
          alternativa_correta: string
          area: string
          created_at: string
          enunciado: string
          id: string
          opcao_a: string
          opcao_b: string
          opcao_c: string
          opcao_d: string
          opcao_e: string
          topic: string
        }
        Insert: {
          alternativa_correta: string
          area: string
          created_at?: string
          enunciado: string
          id?: string
          opcao_a: string
          opcao_b: string
          opcao_c: string
          opcao_d: string
          opcao_e: string
          topic: string
        }
        Update: {
          alternativa_correta?: string
          area?: string
          created_at?: string
          enunciado?: string
          id?: string
          opcao_a?: string
          opcao_b?: string
          opcao_c?: string
          opcao_d?: string
          opcao_e?: string
          topic?: string
        }
        Relationships: []
      }
      enem_user_attempts: {
        Row: {
          created_at: string
          dificuldade_questao: string | null
          foi_correto: boolean
          id: string
          materia_questao: string | null
          question_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dificuldade_questao?: string | null
          foi_correto: boolean
          id?: string
          materia_questao?: string | null
          question_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dificuldade_questao?: string | null
          foi_correto?: boolean
          id?: string
          materia_questao?: string | null
          question_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mastery_progress: {
        Row: {
          acertos: number
          created_at: string
          id: string
          respondidas: number
          subject_slug: string
          theta: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acertos?: number
          created_at?: string
          id?: string
          respondidas?: number
          subject_slug: string
          theta?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acertos?: number
          created_at?: string
          id?: string
          respondidas?: number
          subject_slug?: string
          theta?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nexem_subscriptions: {
        Row: {
          current_period_end: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nexem_tutor_transactions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          learning_goal: string | null
          onboarded_at: string | null
          quiz_completed_at: string | null
          school_grade: string | null
          target_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          learning_goal?: string | null
          onboarded_at?: string | null
          quiz_completed_at?: string | null
          school_grade?: string | null
          target_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          learning_goal?: string | null
          onboarded_at?: string | null
          quiz_completed_at?: string | null
          school_grade?: string | null
          target_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          answers: Json
          area_levels: Json
          availability: Json
          consent_at: string | null
          onboarding_completed: boolean
          onboarding_step: number
          schedule: Json | null
          schedule_needs_regeneration: boolean
          summary_confirmed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          area_levels?: Json
          availability?: Json
          consent_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          schedule?: Json | null
          schedule_needs_regeneration?: boolean
          summary_confirmed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          area_levels?: Json
          availability?: Json
          consent_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          schedule?: Json | null
          schedule_needs_regeneration?: boolean
          summary_confirmed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          bullets: Json
          card_status: Json
          created_at: string
          detailed: string
          file_name: string
          file_size: number
          file_type: string
          flashcards: Json
          id: string
          path: Json
          step_status: Json
          title: string
          user_id: string
        }
        Insert: {
          bullets?: Json
          card_status?: Json
          created_at?: string
          detailed?: string
          file_name: string
          file_size?: number
          file_type: string
          flashcards?: Json
          id?: string
          path?: Json
          step_status?: Json
          title?: string
          user_id: string
        }
        Update: {
          bullets?: Json
          card_status?: Json
          created_at?: string
          detailed?: string
          file_name?: string
          file_size?: number
          file_type?: string
          flashcards?: Json
          id?: string
          path?: Json
          step_status?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tri_profiles: {
        Row: {
          created_at: string
          current_difficulty: string
          id: string
          materia: string
          observacao: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_difficulty?: string
          id?: string
          materia: string
          observacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_difficulty?: string
          id?: string
          materia?: string
          observacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_daily_path: {
        Args: { p_acertos: number; p_day: string }
        Returns: {
          jumped: number
          new_box: number
        }[]
      }
      has_nexem_premium: { Args: never; Returns: boolean }
      reserve_nexem_tutor_consultation: {
        Args: { p_request_id: string }
        Returns: boolean
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
