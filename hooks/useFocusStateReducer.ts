// src/hooks/useFocusStateReducer.ts

import { useReducer } from "react";

// 1. Definimos la forma de nuestro estado
export interface FocusState {
  timeLeft: number;         // Segundos restantes
  totalTime: number;        // Duración total de la sesión en segundos
  status: 'idle' | 'running' | 'paused' | 'finished'; // Un estado más claro que `isActive` y `isPaused`
  sessionsCompleted: number;
  totalFocusTime: number;   // En segundos, para mayor precisión
  distractions: { [key: string]: number };
}

// 2. Estado inicial de la aplicación
export const initialState: FocusState = {
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  status: 'idle',
  sessionsCompleted: 0,
  totalFocusTime: 0,
  distractions: {},
};

// 3. Definimos las acciones que pueden modificar el estado
type Action =
  | { type: 'START_SESSION'; duration: number }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'ADD_DISTRACTION'; distractionType: string; timeFocused: number }
  | { type: 'LOAD_STATS'; stats: { sessionsCompleted: number; totalFocusTime: number; distractions: { [key: string]: number } } };

// 4. El reducer: una función pura que calcula el siguiente estado a partir del estado actual y una acción
function focusReducer(state: FocusState, action: Action): FocusState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        status: 'running',
        timeLeft: action.duration,
        totalTime: action.duration,
      };
    case 'TICK':
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
        // totalFocusTime: state.totalFocusTime + 1, // Sumamos un segundo de foco
      };
    case 'PAUSE':
      return { ...state, status: 'paused' };
    case 'RESUME':
      return { ...state, status: 'running' };
    case 'RESET':
      return {
        ...state,
        status: 'idle',
        timeLeft: state.totalTime,
      };
    case 'COMPLETE_SESSION':
      return {
        ...state,
        status: 'finished',
        sessionsCompleted: state.sessionsCompleted + 1,
        totalFocusTime: state.totalFocusTime + state.totalTime,
      };
    case 'ADD_DISTRACTION':
      const newDistractions = { ...state.distractions };
      newDistractions[action.distractionType] = (newDistractions[action.distractionType] || 0) + 1;
      return {
        ...state,
        status: 'idle',
        timeLeft: state.totalTime,
        distractions: newDistractions,
        totalFocusTime: state.totalFocusTime + action.timeFocused,
      };
    case 'LOAD_STATS':
        return {
            ...state,
            ...action.stats
        };
    default:
      return state;
  }
}

// 5. El hook que usaremos en nuestro componente
export const useFocusState = () => {
    return useReducer(focusReducer, initialState);
}