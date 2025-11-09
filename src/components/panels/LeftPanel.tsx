import React from 'react';
import { HelpCircle, Settings, FileText, Download, Plus, Save } from 'lucide-react';
import type { AISettings, NodeType, ReasoningNode } from '../../types/reasoning';
import { NodeTypeSelector, NodeStats } from '../ui/NodeTypes';

interface LeftPanelProps {
  nodes: ReasoningNode[];
  onCreateNode: (type: NodeType) => void;
  onNodeTypeChange: (type: NodeType) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onExportProject: (format: 'json' | 'markdown') => void;
  aiSettings: AISettings;
  onAISettingsChange: (settings: Partial<AISettings>) => void;
  selectedNodeType: NodeType;
  disabled?: boolean;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  nodes,
  onCreateNode,
  onNodeTypeChange,
  onNewProject,
  onSaveProject,
  onExportProject,
  aiSettings,
  onAISettingsChange,
  selectedNodeType,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = React.useState<'nodes' | 'project' | 'ai'>('nodes');

  const handleQuickCreate = (type: NodeType) => {
    if (disabled) return;
    onNodeTypeChange(type);
    onCreateNode(type);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-h-0">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('nodes')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'nodes'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Nodes</span>
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'project'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Project</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>AI</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === 'nodes' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Node builder</h2>
              <NodeTypeSelector
                selectedType={selectedNodeType}
                onTypeSelect={onNodeTypeChange}
                disabled={disabled}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Workspace stats</h3>
                <NodeStats nodes={nodes} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickCreate('question')}
                    disabled={disabled}
                    className="w-full flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add question
                  </button>
                  <button
                    onClick={() => handleQuickCreate('reasoning')}
                    disabled={disabled}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add reasoning step
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'project' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project controls</h2>
              <div className="space-y-3">
                <button
                  onClick={onNewProject}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New project
                </button>
                <button
                  onClick={onSaveProject}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save project
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Export</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onExportProject('json')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </button>
                <button
                  onClick={() => onExportProject('markdown')}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Markdown
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenRouter API key
                  </label>
                  <input
                    type="password"
                    value={aiSettings.apiKey}
                    onChange={(e) => onAISettingsChange({ apiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="sk-or-v1-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Keys are stored locally in your browser and sent securely only when generating reasoning steps.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={aiSettings.model}
                    onChange={(e) => onAISettingsChange({ model: e.target.value as AISettings['model'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="openai/gpt-5">OpenAI GPT-5</option>
                    <option value="google/gemini-2.5-pro">Google Gemini 2.5 Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {aiSettings.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aiSettings.temperature}
                    onChange={(e) => onAISettingsChange({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower values keep responses focused. Higher values encourage exploration.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max tokens: {aiSettings.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="4000"
                    step="100"
                    value={aiSettings.maxTokens}
                    onChange={(e) => onAISettingsChange({ maxTokens: parseInt(e.target.value, 10) })}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Controls the maximum length of AI responses.</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>- Pick a node type on the Nodes tab, then double-click on the canvas to place it.</p>
                <p>- Select a node and click "Generate AI reasoning" on the right to expand the branch.</p>
                <p>- Edit or delete any AI-generated node to keep the graph curated.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
