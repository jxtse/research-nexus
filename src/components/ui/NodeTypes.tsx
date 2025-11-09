import React from 'react';
import { HelpCircle, Brain, Lightbulb, GitBranch, Flag } from 'lucide-react';
import type { NodeType, ReasoningNode } from '../../types/reasoning';

export const NODE_CONFIG = {
  question: {
    icon: HelpCircle,
    label: 'Research Question',
    description: 'Frame the problem or inquiry you are investigating.',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    iconColor: 'text-purple-600',
    ringColor: 'ring-purple-400',
    badgeBg: 'bg-purple-600',
  },
  reasoning: {
    icon: Brain,
    label: 'Reasoning Step',
    description: 'Explain how evidence or logic advances the argument.',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    iconColor: 'text-blue-600',
    ringColor: 'ring-blue-400',
    badgeBg: 'bg-blue-600',
  },
  hypothesis: {
    icon: Lightbulb,
    label: 'Hypothesis',
    description: 'Capture a testable idea or assumption to validate.',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
    ringColor: 'ring-orange-400',
    badgeBg: 'bg-orange-600',
  },
  branch: {
    icon: GitBranch,
    label: 'Branch',
    description: 'Divergent line of reasoning or alternative path.',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-900',
    iconColor: 'text-green-600',
    ringColor: 'ring-green-400',
    badgeBg: 'bg-green-600',
  },
  conclusion: {
    icon: Flag,
    label: 'Conclusion',
    description: 'Synthesize findings or final recommendations.',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-900',
    iconColor: 'text-red-600',
    ringColor: 'ring-red-400',
    badgeBg: 'bg-red-600',
  },
};

export type NodeTypeKey = keyof typeof NODE_CONFIG;

interface NodeTypeSelectorProps {
  selectedType: NodeType;
  onTypeSelect: (type: NodeType) => void;
  disabled?: boolean;
}

export const NodeTypeSelector: React.FC<NodeTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  disabled,
}) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-gray-700">Node type</h3>
    <div className="grid grid-cols-1 gap-2">
      {Object.entries(NODE_CONFIG).map(([type, config]) => {
        const Icon = config.icon;
        const isSelected = selectedType === type;

        return (
          <button
            key={type}
            onClick={() => !disabled && onTypeSelect(type as NodeType)}
            disabled={disabled}
            className={`
              flex items-center p-3 rounded-lg border-2 transition-all duration-200
              ${
                isSelected
                  ? `${config.bgColor} ${config.borderColor} ring-2 ring-offset-2 ${config.ringColor}`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className={`w-5 h-5 mr-3 ${isSelected ? config.iconColor : 'text-gray-500'}`} />
            <div className="text-left">
              <div className={`font-medium ${isSelected ? config.textColor : 'text-gray-900'}`}>
                {config.label}
              </div>
              <div className={`text-xs ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                {config.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

interface NodeToolbarProps {
  onCreateNode: (type: NodeType) => void;
  selectedType?: NodeType;
}

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ onCreateNode, selectedType = 'question' }) => (
  <div className="flex space-x-2 p-2 bg-white rounded-lg shadow-sm border">
    {Object.entries(NODE_CONFIG).map(([type, config]) => {
      const Icon = config.icon;
      const isSelected = selectedType === type;

      return (
        <button
          key={type}
          onClick={() => onCreateNode(type as NodeType)}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
            ${
              isSelected
                ? `${config.bgColor} ${config.borderColor}`
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }
          `}
          title={config.label}
        >
          <Icon className={`w-5 h-5 ${isSelected ? config.iconColor : 'text-gray-600'}`} />
        </button>
      );
    })}
  </div>
);

export const NodeStats: React.FC<{ nodes: ReasoningNode[] }> = ({ nodes }) => {
  const stats = React.useMemo(() => {
    return nodes.reduce<Record<NodeType, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {
      question: 0,
      reasoning: 0,
      hypothesis: 0,
      branch: 0,
      conclusion: 0,
    });
  }, [nodes]);

  return (
    <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
      {Object.entries(NODE_CONFIG).map(([type, config]) => {
        const Icon = config.icon;
        const count = stats[type as NodeType];

        return (
          <div key={type} className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            <span className="text-sm text-gray-600">
              {config.label}: <span className="font-medium">{count}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};
