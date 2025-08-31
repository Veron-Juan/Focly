// types/database.ts

export type SessionStatus = 'completed' | 'interrupted';

// Este tipo representa exactamente una fila de tu tabla 'sessions' en Supabase.
export interface DbSession {
  id: number;
  created_at: string; // Es un string en formato ISO 8601
  user_id: string;
  duration_seconds: number;
  planned_duration_seconds: number;
  status: SessionStatus;
  distraction_reason: string | null; // Puede ser nulo
};