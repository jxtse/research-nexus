import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Save, Download, Plus, HelpCircle } from 'lucide-react';

interface TopToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onExportProject: (format: 'json' | 'markdown') => void;
  onShowHelp: () => void;
  projectName?: string;
  hasUnsavedChanges: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onNewProject,
  onSaveProject,
  onExportProject,
  onShowHelp,
  projectName = 'Untitled project',
  hasUnsavedChanges,
}) => {
  return (
    <div className="h-16 sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RG</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Reasoning Graph Workspace</h1>
            <p className="text-xs text-gray-500">
              {projectName}
              {hasUnsavedChanges && <span className="text-orange-500 ml-1">(unsaved)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNewProject}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New</span>
          </button>
          <button
            onClick={onSaveProject}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 min-w-[4rem] text-center">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={onResetZoom}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 border-r border-gray-200 pr-4 mr-4">
          <button
            onClick={() => onExportProject('json')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export JSON"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">JSON</span>
          </button>
          <button
            onClick={() => onExportProject('markdown')}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export Markdown"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Markdown</span>
          </button>
        </div>

        <button
          onClick={onShowHelp}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
