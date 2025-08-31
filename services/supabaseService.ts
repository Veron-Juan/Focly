// services/supabaseService.ts

import { createClient } from '@/lib/client';
import type { User } from '@supabase/supabase-js';

// Este servicio necesita el objeto 'user' para saber a quién asociar la sesión
const supabase = createClient();

export const supabaseService = {
  recordCompletedSession: async (user: User, plannedDuration: number) => {
    const sessionData = {
      user_id: user.id,
      duration_seconds: plannedDuration,
      planned_duration_seconds: plannedDuration,
      status: 'completed' as const,
    };

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error recording completed session to Supabase:', error);
      return null;
    }
    return newSession;
  },

  recordDistraction: async (user: User, reason: string, timeFocused: number, plannedDuration: number) => {
    const sessionData = {
      user_id: user.id,
      duration_seconds: timeFocused,
      planned_duration_seconds: plannedDuration,
      status: 'interrupted' as const,
      distraction_reason: reason,
    };

    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error recording distraction to Supabase:', error);
      return null;
    }
    return newSession;
  },
};