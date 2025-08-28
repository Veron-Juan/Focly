// src/hooks/useSessionManager.ts

import { useEffect, useCallback } from "react";
import { FocusState } from "./useFocusStateReducer"; // Importamos la interfaz

export interface Session {
    id: string;
    duration: number; // en segundos
    completedAt: string;
    type: 'completed' | 'distracted';
    distractionType?: string;
}

// Lo ideal es mover estas funciones a un archivo de servicios (e.g., `services/storage.ts`)
const getSessions = (): Session[] => {
    if (typeof window === "undefined") return [];
    const sessions = localStorage.getItem("focusSessions");
    return sessions ? JSON.parse(sessions) : [];
};

const saveSession = (session: Session) => {
    if (typeof window === "undefined") return;
    const sessions = getSessions();
    localStorage.setItem("focusSessions", JSON.stringify([...sessions, session]));
    // Disparamos un evento custom para que otras partes de la app reaccionen
    window.dispatchEvent(new Event('storageUpdated'));
};


export const useSessionManager = (dispatch: React.Dispatch<any>) => {
    // Cargar estadísticas iniciales desde localStorage
    useEffect(() => {
        const sessions = getSessions();
        if (sessions.length > 0) {
            const stats = sessions.reduce((acc, session) => {
                acc.totalFocusTime += session.duration;
                if(session.type === 'completed') {
                    acc.sessionsCompleted += 1;
                }
                if(session.type === 'distracted' && session.distractionType) {
                    acc.distractions[session.distractionType] = (acc.distractions[session.distractionType] || 0) + 1;
                }
                return acc;
            }, { sessionsCompleted: 0, totalFocusTime: 0, distractions: {} as {[key: string]: number} });

            dispatch({ type: 'LOAD_STATS', stats });
        }
    }, [dispatch]);

    const recordCompletedSession = useCallback((duration: number) => {
        const session: Session = {
            id: Date.now().toString(),
            duration,
            completedAt: new Date().toISOString(),
            type: 'completed',
        };
        saveSession(session);
    }, []);

    const recordDistraction = useCallback((distractionType: string, timeFocused: number) => {
        if (timeFocused > 0) {
            const session: Session = {
                id: Date.now().toString(),
                duration: timeFocused,
                completedAt: new Date().toISOString(),
                type: 'distracted',
                distractionType: distractionType,
            };
            saveSession(session);
        }
    }, []);

    return { recordCompletedSession, recordDistraction };
};