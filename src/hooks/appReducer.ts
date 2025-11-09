import { AppAction } from '../types';
import { AppState } from '../types/reasoning';

const defaultApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export const initialState: AppState = {
  currentProject: null,
  projects: [],
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNodeId: null,
  },
  aiSettings: {
    model: 'openai/gpt-5',
    apiKey: defaultApiKey,
    temperature: 0.7,
    maxTokens: 2000,
  },
  isLoading: false,
  error: null,
};

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
      };

    case 'SET_CURRENT_PROJECT': {
      const projects = action.payload
        ? [...state.projects.filter((project) => project.id !== action.payload.id), action.payload]
        : state.projects;

      return {
        ...state,
        currentProject: action.payload,
        projects,
        canvasState: {
          ...state.canvasState,
          selectedNodeId: null,
        },
      };
    }

    case 'SELECT_NODE':
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedNodeId: action.payload,
        },
      };

    case 'SET_CANVAS_ZOOM':
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          zoom: action.payload,
        },
      };

    case 'SET_CANVAS_PAN':
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          pan: action.payload,
        },
      };

    case 'SET_AI_SETTINGS':
      return {
        ...state,
        aiSettings: action.payload,
      };

    case 'UPDATE_AI_SETTINGS':
      return {
        ...state,
        aiSettings: {
          ...state.aiSettings,
          ...action.payload,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};
