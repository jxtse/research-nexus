import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppContextType } from '../types';
import { appReducer, initialState } from './appReducer';

const AI_SETTINGS_STORAGE_KEY = 'reasoning-workspace:ai-settings';
const ACTIVE_PROJECT_STORAGE_KEY = 'reasoning-workspace:active-project';

const AppContext = createContext<AppContextType | undefined>(undefined);

const bootstrapState = () => {
  if (typeof window === 'undefined') {
    return initialState;
  }

  try {
    const storedSettings = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!storedSettings) {
      return initialState;
    }

    const parsed = JSON.parse(storedSettings);
    return {
      ...initialState,
      aiSettings: {
        ...initialState.aiSettings,
        ...parsed,
      },
    };
  } catch (error) {
    console.warn('Failed to restore AI settings from localStorage', error);
    return initialState;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, bootstrapState);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(state.aiSettings));
  }, [state.aiSettings]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.currentProject?.id) {
      window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, state.currentProject.id);
    }
  }, [state.currentProject?.id]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { AI_SETTINGS_STORAGE_KEY, ACTIVE_PROJECT_STORAGE_KEY };
