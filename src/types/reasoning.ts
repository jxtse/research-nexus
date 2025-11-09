// 推理图工作空间核心类型定义

export type NodeType = 'question' | 'reasoning' | 'hypothesis' | 'branch' | 'conclusion';
export type SupportedAIModel = 'openai/gpt-5' | 'google/gemini-2.5-pro';

export interface Position {
  x: number;
  y: number;
}

export interface NodeMetadata {
  createdAt: string;
  updatedAt: string;
  confidence: number;
  aiGenerated: boolean;
  rationale?: string;
}

export interface ReasoningNode {
  id: string;
  type: NodeType;
  content: string;
  position: Position;
  connections: string[];
  metadata: NodeMetadata;
}

export interface ProjectSettings {
  model: SupportedAIModel;
  temperature: number;
  maxTokens: number;
}

export interface ReasoningProject {
  id: string;
  name: string;
  description?: string;
  settings: ProjectSettings;
  nodes: ReasoningNode[];
  createdAt: string;
  updatedAt: string;
}

export interface AISettings extends ProjectSettings {
  apiKey: string;
}

export interface CanvasState {
  zoom: number;
  pan: Position;
  selectedNodeId: string | null;
}

export interface AppState {
  currentProject: ReasoningProject | null;
  projects: ReasoningProject[];
  canvasState: CanvasState;
  aiSettings: AISettings;
  isLoading: boolean;
  error: string | null;
}

export interface AIReasoningStep {
  type: NodeType;
  content: string;
  confidence?: number;
  rationale?: string;
}

export interface AIResponse {
  reasoningSteps: AIReasoningStep[];
  summary?: string;
  confidence?: number;
}

export type ExportFormat = 'json' | 'markdown';

export interface CanvasProps {
  nodes: ReasoningNode[];
  selectedNodeId: string | null;
  newNodeType: NodeType;
  zoom: number;
  pan: Position;
  linkingSourceId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<ReasoningNode>) => void;
  onNodeCreate: (type: NodeType, position: Position) => void;
  onPanChange: (pan: Position) => void;
  onZoomChange: (zoom: number) => void;
  onCompleteLink: (targetNodeId: string) => void;
  onCancelLink: () => void;
}
