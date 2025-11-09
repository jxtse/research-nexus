export interface Position {
  x: number;
  y: number;
}

export interface NodeMetadata {
  confidence: number;
  createdAt: string;
  updatedAt: string;
  aiGenerated: boolean;
  rationale?: string;
}

export interface ReasoningNode {
  id: string;
  type: 'question' | 'reasoning' | 'hypothesis' | 'branch' | 'conclusion';
  content: string;
  position: Position;
  metadata: NodeMetadata;
  connections: string[]; // IDs of nodes this node links to
}

export interface ReasoningProject {
  id: string;
  name: string;
  description?: string;
  nodes: ReasoningNode[];
  createdAt: string;
  updatedAt: string;
  settings: {
    model: 'openai/gpt-5' | 'google/gemini-2.5-pro';
    temperature: number;
    maxTokens: number;
  };
}

export interface AISettings {
  apiKey: string;
  model: 'openai/gpt-5' | 'google/gemini-2.5-pro';
  temperature: number;
  maxTokens: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
