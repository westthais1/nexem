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
