// services/localStorageService.ts

export interface LocalSession {
  id: string;
  duration: number; // en segundos
  completedAt: string;
  type: 'completed' | 'distracted';
  distractionType?: string;
  // Añadimos el planned_duration para consistencia
  planned_duration: number; 
}

const getSessions = (): LocalSession[] => {
  if (typeof window === "undefined") return [];
  const sessions = localStorage.getItem("focusSessions");
  return sessions ? JSON.parse(sessions) : [];
};

const saveSession = (session: LocalSession) => {
  if (typeof window === "undefined") return;
  const sessions = getSessions();
  localStorage.setItem("focusSessions", JSON.stringify([...sessions, session]));
  // Disparamos un evento para que los gráficos (si aún usan localStorage) reaccionen
  window.dispatchEvent(new Event('storageUpdated'));
  return session; // Devolvemos la sesión guardada
};

export const localStorageService = {
  recordCompletedSession: (plannedDuration: number) => {
    const session: LocalSession = {
      id: Date.now().toString(),
      duration: plannedDuration,
      completedAt: new Date().toISOString(),
      type: 'completed',
      planned_duration: plannedDuration
    };
    return saveSession(session);
  },
  
  recordDistraction: (reason: string, timeFocused: number, plannedDuration: number) => {
    if (timeFocused > 0) {
      const session: LocalSession = {
        id: Date.now().toString(),
        duration: timeFocused,
        completedAt: new Date().toISOString(),
        type: 'distracted',
        distractionType: reason,
        planned_duration: plannedDuration,
      };
      return saveSession(session);
    }
    return null;
  },
};