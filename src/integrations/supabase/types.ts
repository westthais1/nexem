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
      daily_challenge_runs: {
        Row: {
          answers: Json
          base_xp: number
          best_combo: number
          chest_xp: number
          combo: number
          combo_xp: number
          completed_at: string | null
          day: string
          mission_xp: number
          questions: Json
          stars: number
          thetas: Json
          user_id: string
        }
        Insert: {
          answers?: Json
          base_xp?: number
          best_combo?: number
          chest_xp?: number
          combo?: number
          combo_xp?: number
          completed_at?: string | null
          day?: string
          mission_xp?: number
          questions?: Json
          stars?: number
          thetas?: Json
          user_id: string
        }
        Update: {
          answers?: Json
          base_xp?: number
          best_combo?: number
          chest_xp?: number
          combo?: number
          combo_xp?: number
          completed_at?: string | null
          day?: string
          mission_xp?: number
          questions?: Json
          stars?: number
          thetas?: Json
          user_id?: string
        }
        Relationships: []
      }
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
      enem_config: {
        Row: {
          exam_date: string | null
          id: string
          second_day: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          exam_date?: string | null
          id?: string
          second_day?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          exam_date?: string | null
          id?: string
          second_day?: string | null
          source_url?: string | null
          updated_at?: string
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
          por_area: Json | null
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
          por_area?: Json | null
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
          por_area?: Json | null
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
      student_achievements: {
        Row: {
          achievement_key: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_activity_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          label: string | null
          reward_key: string | null
          subject: string | null
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          label?: string | null
          reward_key?: string | null
          subject?: string | null
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          reward_key?: string | null
          subject?: string | null
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      student_area_progress: {
        Row: {
          created_at: string
          last_played_date: string | null
          source: string
          theta_humanas: number
          theta_linguagens: number
          theta_matematica: number
          theta_natureza: number
          tri_consistency_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_played_date?: string | null
          source?: string
          theta_humanas?: number
          theta_linguagens?: number
          theta_matematica?: number
          theta_natureza?: number
          tri_consistency_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_played_date?: string | null
          source?: string
          theta_humanas?: number
          theta_linguagens?: number
          theta_matematica?: number
          theta_natureza?: number
          tri_consistency_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_daily_missions: {
        Row: {
          day: string
          mission_key: string
          progress: number
          rewarded_at: string | null
          target: number
          user_id: string
        }
        Insert: {
          day: string
          mission_key: string
          progress?: number
          rewarded_at?: string | null
          target: number
          user_id: string
        }
        Update: {
          day?: string
          mission_key?: string
          progress?: number
          rewarded_at?: string | null
          target?: number
          user_id?: string
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
      student_xp: {
        Row: {
          answer_combo: number
          best_streak: number
          browser_imported_at: string | null
          last_active_day: string | null
          last_activity: string | null
          shield_day: string | null
          streak: number
          streak_shields: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        Insert: {
          answer_combo?: number
          best_streak?: number
          browser_imported_at?: string | null
          last_active_day?: string | null
          last_activity?: string | null
          shield_day?: string | null
          streak?: number
          streak_shields?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          weekly_goal?: number
        }
        Update: {
          answer_combo?: number
          best_streak?: number
          browser_imported_at?: string | null
          last_active_day?: string | null
          last_activity?: string | null
          shield_day?: string | null
          streak?: number
          streak_shields?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          weekly_goal?: number
        }
        Relationships: []
      }
      study_activity_days: {
        Row: {
          day: string
          user_id: string
        }
        Insert: {
          day: string
          user_id: string
        }
        Update: {
          day?: string
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
      study_plans: {
        Row: {
          generated_at: string
          id: string
          insights: Json
          summary: string
          user_id: string
          week_start: string
        }
        Insert: {
          generated_at?: string
          id?: string
          insights?: Json
          summary?: string
          user_id: string
          week_start: string
        }
        Update: {
          generated_at?: string
          id?: string
          insights?: Json
          summary?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          actual_minutes: number
          completed_at: string | null
          correct: number
          date: string
          duration: number
          format: string
          id: string
          plan_id: string
          start_minutes: number
          started_at: string | null
          status: string
          topic_id: string
          total: number
          type: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number
          completed_at?: string | null
          correct?: number
          date: string
          duration: number
          format?: string
          id?: string
          plan_id: string
          start_minutes: number
          started_at?: string | null
          status?: string
          topic_id: string
          total?: number
          type: string
          user_id: string
        }
        Update: {
          actual_minutes?: number
          completed_at?: string | null
          correct?: number
          date?: string
          duration?: number
          format?: string
          id?: string
          plan_id?: string
          start_minutes?: number
          started_at?: string | null
          status?: string
          topic_id?: string
          total?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_mastery: {
        Row: {
          accuracy: number | null
          last_reviewed: string | null
          mastery: number
          next_review: string | null
          review_stage: number
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          last_reviewed?: string | null
          mastery?: number
          next_review?: string | null
          review_stage?: number
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          last_reviewed?: string | null
          mastery?: number
          next_review?: string | null
          review_stage?: number
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_mastery_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          active: boolean
          area: string
          estimated_minutes: number
          exam_weight: number
          id: string
          language: string | null
          subject: string
          title: string
        }
        Insert: {
          active?: boolean
          area: string
          estimated_minutes?: number
          exam_weight?: number
          id: string
          language?: string | null
          subject: string
          title: string
        }
        Update: {
          active?: boolean
          area?: string
          estimated_minutes?: number
          exam_weight?: number
          id?: string
          language?: string | null
          subject?: string
          title?: string
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
      import_browser_xp: {
        Args: {
          p_best: number
          p_days: string[]
          p_last_activity: string
          p_last_day: string
          p_streak: number
          p_total: number
          p_user: string
        }
        Returns: {
          answer_combo: number
          best_streak: number
          browser_imported_at: string | null
          last_active_day: string | null
          last_activity: string | null
          shield_day: string | null
          streak: number
          streak_shields: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        SetofOptions: {
          from: "*"
          to: "student_xp"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      progress_daily_mission: {
        Args: { p_key: string; p_progress: number; p_user: string }
        Returns: undefined
      }
      record_activity: {
        Args: {
          p_kind: string
          p_label: string
          p_subject: string
          p_user: string
          p_xp: number
        }
        Returns: {
          answer_combo: number
          best_streak: number
          browser_imported_at: string | null
          last_active_day: string | null
          last_activity: string | null
          shield_day: string | null
          streak: number
          streak_shields: number
          total_xp: number
          updated_at: string
          user_id: string
          weekly_goal: number
        }
        SetofOptions: {
          from: "*"
          to: "student_xp"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_training_answer: {
        Args: { p_correct: boolean; p_question: string; p_user: string }
        Returns: undefined
      }
      reserve_nexem_tutor_consultation: {
        Args: { p_request_id: string }
        Returns: boolean
      }
      review_daily_error: {
        Args: { p_day: string; p_question: string; p_user: string }
        Returns: undefined
      }
      reward_student_once: {
        Args: {
          p_key: string
          p_kind: string
          p_label: string
          p_user: string
          p_xp: number
        }
        Returns: boolean
      }
      save_study_week: {
        Args: {
          p_insights: Json
          p_sessions: Json
          p_summary: string
          p_week: string
        }
        Returns: string
      }
      save_study_week_service: {
        Args: {
          p_insights: Json
          p_sessions: Json
          p_summary: string
          p_user: string
          p_week: string
        }
        Returns: string
      }
      set_weekly_xp_goal: {
        Args: { p_goal: number; p_user: string }
        Returns: undefined
      }
      start_daily_run: {
        Args: { p_questions: Json; p_thetas: Json; p_user: string }
        Returns: {
          answers: Json
          base_xp: number
          best_combo: number
          chest_xp: number
          combo: number
          combo_xp: number
          completed_at: string | null
          day: string
          mission_xp: number
          questions: Json
          stars: number
          thetas: Json
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_challenge_runs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_daily_answer: {
        Args: { p_index: number; p_letter: string; p_user: string }
        Returns: {
          answers: Json
          base_xp: number
          best_combo: number
          chest_xp: number
          combo: number
          combo_xp: number
          completed_at: string | null
          day: string
          mission_xp: number
          questions: Json
          stars: number
          thetas: Json
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_challenge_runs"
          isOneToOne: true
          isSetofReturn: false
        }
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
