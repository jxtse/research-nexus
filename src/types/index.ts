import type { Dispatch } from 'react';
import type { ReasoningProject, AISettings, Position, AppState } from './reasoning';

export type AppAction = 
  | { type: 'SET_PROJECTS'; payload: ReasoningProject[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: ReasoningProject | null }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'SET_CANVAS_ZOOM'; payload: number }
  | { type: 'SET_CANVAS_PAN'; payload: Position }
  | { type: 'SET_AI_SETTINGS'; payload: AISettings }
  | { type: 'UPDATE_AI_SETTINGS'; payload: Partial<AISettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
