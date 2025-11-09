import React from 'react';
import { ReasoningNode } from '../../types/reasoning';
import { NODE_CONFIG } from '../ui/NodeTypes';
import { MoreVertical, Trash2, Edit3, Link, Brain } from 'lucide-react';

interface NodeDetailPanelProps {
  node: ReasoningNode | null;
  onUpdate: (nodeId: string, updates: Partial<ReasoningNode>) => void;
  onDelete: (nodeId: string) => void;
  onGenerateAI: (nodeId: string, content: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onGenerateAI,
}) => {
  const [editContent, setEditContent] = React.useState(node?.content || '');
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (node) {
      setEditContent(node.content);
      setIsEditing(false);
    }
  }, [node]);

  if (!node) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="mb-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
          <p>选择一个节点来查看详情</p>
        </div>
      </div>
    );
  }

  const config = NODE_CONFIG[node.type];
  const Icon = config.icon;

  const handleSave = () => {
    onUpdate(node.id, { content: editContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(node.content);
    setIsEditing(false);
  };

  const handleGenerateAI = () => {
    if (node.content.trim()) {
      onGenerateAI(node.id, node.content);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* 节点头部信息 */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">{config.label}</div>
          <div className="text-sm text-gray-500">{config.description}</div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleGenerateAI}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="生成AI推理"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(node.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 节点内容编辑 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">内容</label>
          {node.metadata.aiGenerated && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              AI生成
            </span>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="输入节点内容..."
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white border border-gray-200 rounded-lg min-h-32">
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {node.content || '暂无内容'}
            </div>
          </div>
        )}
      </div>

      {/* 节点元数据 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">属性</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ID:</span>
            <span className="font-mono text-xs">{node.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">类型:</span>
            <span className="capitalize">{node.type}</span>
          </div>
          {typeof node.metadata.confidence === 'number' && (
            <div className="flex justify-between">
              <span className="text-gray-500">置信度:</span>
              <span>{Math.round(node.metadata.confidence * 100)}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">创建时间:</span>
            <span>{new Date(node.metadata.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">更新时间:</span>
            <span>{new Date(node.metadata.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 连接信息 */}
      {node.connections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">连接</h4>
          <div className="space-y-1">
            {node.connections.map(connectionId => (
              <div key={connectionId} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <Link className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{connectionId.slice(0, 8)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
