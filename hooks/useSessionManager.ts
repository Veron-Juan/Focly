// hooks/useSessionManager.ts

import { useCallback } from 'react';
import { createClient } from '@/lib/client';
import { localStorageService } from '@/services/localStorageService';
import { supabaseService } from '@/services/supabaseService';

export const useSessionManager = () => {
  const supabase = createClient();

  const recordCompletedSession = useCallback(async (plannedDuration: number) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Usuario logueado: usamos el servicio de Supabase
      console.log("Saving to Supabase...");
      return await supabaseService.recordCompletedSession(user, plannedDuration);
    } else {
      // Usuario anónimo: usamos el servicio de localStorage
      console.log("Saving to localStorage...");
      return localStorageService.recordCompletedSession(plannedDuration);
    }
  }, [supabase]);

  const recordDistraction = useCallback(async (
    reason: string,
    timeFocused: number,
    plannedDuration: number
  ) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Usuario logueado: usamos el servicio de Supabase
      console.log("Saving distraction to Supabase...");
      return await supabaseService.recordDistraction(user, reason, timeFocused, plannedDuration);
    } else {
      // Usuario anónimo: usamos el servicio de localStorage
      console.log("Saving distraction to localStorage...");
      return localStorageService.recordDistraction(reason, timeFocused, plannedDuration);
    }
  }, [supabase]);

  // Ya no necesitamos el useEffect para cargar datos, eso lo hace el componente principal
  return { recordCompletedSession, recordDistraction };
};