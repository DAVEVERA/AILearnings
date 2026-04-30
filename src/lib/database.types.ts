/**
 * Supabase Database type definitions.
 * These mirror the tables created in the migration SQL.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;                  // auth.users.id
          name: string;
          department: string;
          department_id: string;
          role: string;
          ai_experience: string;
          learning_style: string;
          available_time: string;
          current_tools: string[];
          main_challenge: string;
          learning_goal: string;
          analysis_result: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      module_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          department_id: string;
          level: string;
          module_index: number;
          completed: boolean;
          score: number | null;
          max_score: number | null;
          time_spent_seconds: number | null;
          started_at: string | null;
          completed_at: string | null;
          attempts: number;
          answers: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['module_progress']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['module_progress']['Insert']>;
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_badges']['Insert']>;
      };
    };
  };
}
