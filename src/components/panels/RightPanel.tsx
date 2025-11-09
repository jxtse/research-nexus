import React from 'react';
import { X, Edit3, Trash2, Brain, Clock, Calendar, Hash, HelpCircle, Loader2 } from 'lucide-react';
import type { ReasoningNode } from '../../types/reasoning';
import { NODE_CONFIG } from '../ui/NodeTypes';

interface RightPanelProps {
  selectedNode: ReasoningNode | null;
  onUpdateNode: (node: ReasoningNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onGenerateAI: (nodeId: string) => void;
  isGenerating: boolean;
  onClose: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onDeleteNode,
  onGenerateAI,
  isGenerating,
  onClose,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState('');

  React.useEffect(() => {
    if (selectedNode) {
      setEditContent(selectedNode.content);
      setIsEditing(false);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a node to inspect its details.</p>
        </div>
      </div>
    );
  }

  const handleSaveEdit = () => {
    onUpdateNode({
      ...selectedNode,
      content: editContent,
      metadata: {
        ...selectedNode.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(selectedNode.content);
    setIsEditing(false);
  };

  const config = NODE_CONFIG[selectedNode.type];
  const Icon = config.icon;

  return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.badgeBg}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{config.label}</h3>
            <p className="text-sm text-gray-500">Node details</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Content</h4>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the reasoning for this node"
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg min-h-[8rem]">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedNode.content || 'No content yet'}
              </p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Metadata</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <Hash className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="text-gray-900 ml-2 font-mono text-xs">
                  {selectedNode.id}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="text-gray-900 ml-2">{config.label}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-900 ml-2">
                  {new Date(selectedNode.metadata.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="text-gray-900 ml-2">
                  {new Date(selectedNode.metadata.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full" />
              <div>
                <span className="text-gray-500">Confidence:</span>
                <span className="text-gray-900 ml-2">
                  {Math.round(selectedNode.metadata.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedNode.metadata.rationale && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">AI rationale</h4>
            <div className="p-3 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap">
              {selectedNode.metadata.rationale}
            </div>
          </div>
        )}

        {selectedNode.connections.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Connections</h4>
            <div className="space-y-2">
              {selectedNode.connections.map((connectionId) => (
                <div key={connectionId} className="p-2 bg-gray-50 rounded text-xs text-gray-600">
                  Linked to {connectionId}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedNode.type !== 'conclusion' && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">AI reasoning</h4>
            <button
              onClick={() => onGenerateAI(selectedNode.id)}
              disabled={isGenerating}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate AI reasoning
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete node
        </button>
      </div>
    </div>
  );
};
