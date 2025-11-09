import React from 'react';
import { useAppContext, ACTIVE_PROJECT_STORAGE_KEY } from '../hooks/useAppContext';
import { TopToolbar } from './ui/TopToolbar';
import { LeftPanel } from './panels/LeftPanel';
import { RightPanel } from './panels/RightPanel';
import { ReasoningCanvas } from './canvas/ReasoningCanvas';
import type { NodeType, ReasoningNode, Position } from '../types/reasoning';
import { projectAPI, aiAPI, exportAPI, downloadFile } from '../services/api';

const clampZoom = (value: number) => Math.min(3, Math.max(0.25, value));

export const AppLayout: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedNodeType, setSelectedNodeType] = React.useState<NodeType>('question');
  const [generatingNodeId, setGeneratingNodeId] = React.useState<string | null>(null);
  const [linkingSourceId, setLinkingSourceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await projectAPI.getAll();

        if (result.success && Array.isArray(result.data)) {
          dispatch({ type: 'SET_PROJECTS', payload: result.data });
          const savedProjectId =
            typeof window !== 'undefined'
              ? window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)
              : null;
          const initialProject =
            result.data.find((project) => project.id === savedProjectId) ?? result.data[0] ?? null;
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: initialProject ?? null });
        }
      } catch (error) {
        console.error('Failed to load projects', error);
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadProjects();
  }, [dispatch]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSaveProject();
        return;
      }

      if (!event.ctrlKey && event.key === 'Delete' && state.canvasState.selectedNodeId) {
        event.preventDefault();
        void handleDeleteNode(state.canvasState.selectedNodeId);
        return;
      }

      if (event.key === 'Escape' && linkingSourceId) {
        setLinkingSourceId(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.canvasState.selectedNodeId, state.currentProject, linkingSourceId]);

  React.useEffect(() => {
    setLinkingSourceId(null);
  }, [state.currentProject?.id]);

  const handleCreateNode = async (type: NodeType, position?: Position) => {
    try {
      if (!state.currentProject) {
        alert('Create or load a project before adding nodes.');
        return;
      }

      const timestamp = new Date().toISOString();
      const newNode: ReasoningNode = {
        id: `node-${Date.now()}`,
        type,
        content: '',
        position:
          position ?? {
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
          },
        metadata: {
          confidence: 0.8,
          createdAt: timestamp,
          updatedAt: timestamp,
          aiGenerated: false,
        },
        connections: [],
      };

      const result = await projectAPI.addNode(state.currentProject.id, newNode);

      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });
      }
    } catch (error) {
      console.error('Failed to create node', error);
      alert('Failed to create node: ' + (error as Error).message);
    }
  };

  const handleUpdateNode = async (nodeId: string, updates: Partial<ReasoningNode>) => {
    try {
      if (!state.currentProject) return;

      const result = await projectAPI.updateNode(state.currentProject.id, nodeId, updates);

      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });
      }
    } catch (error) {
      console.error('Failed to update node', error);
      alert('Failed to update node: ' + (error as Error).message);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      if (!state.currentProject) return;

      const result = await projectAPI.deleteNode(state.currentProject.id, nodeId);

      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });

        if (state.canvasState.selectedNodeId === nodeId) {
          dispatch({ type: 'SELECT_NODE', payload: null });
        }
      }
    } catch (error) {
      console.error('Failed to delete node', error);
      alert('Failed to delete node: ' + (error as Error).message);
    }
  };

  const handleSelectNode = (nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: nodeId });
  };

  const handlePanChange = (pan: Position) => {
    dispatch({ type: 'SET_CANVAS_PAN', payload: pan });
  };

  const handleZoomChange = (zoom: number) => {
    dispatch({ type: 'SET_CANVAS_ZOOM', payload: clampZoom(zoom) });
  };

  const handleGenerateAI = async (nodeId: string) => {
    try {
      if (!state.currentProject) return;
      if (!state.aiSettings.apiKey) {
        alert('Add your OpenRouter API key in the AI tab before generating reasoning.');
        return;
      }

      setGeneratingNodeId(nodeId);
      const node = state.currentProject.nodes.find((n) => n.id === nodeId);
      if (!node) {
        return;
      }

      const context = state.currentProject.nodes
        .filter((n) => node.connections.includes(n.id))
        .map((n) => `${n.type}: ${n.content}`)
        .join('\n');

      const result = await aiAPI.generateReasoning(
        nodeId,
        state.currentProject.id,
        context,
        state.aiSettings
      );

      if (result.success && result.data?.project) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data.project });
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Failed to generate AI reasoning', error);
      alert('Failed to generate AI reasoning: ' + (error as Error).message);
    } finally {
      setGeneratingNodeId(null);
    }
  };

  const handleNewProject = async () => {
    try {
      const name = prompt('Project name', 'New project');
      if (!name) return;

      const result = await projectAPI.create(name, '');
      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });
      }
    } catch (error) {
      console.error('Failed to create project', error);
      alert('Failed to create project: ' + (error as Error).message);
    }
  };

  const handleSaveProject = async () => {
    try {
      if (!state.currentProject) return;

      const result = await projectAPI.update(state.currentProject.id, {
        name: state.currentProject.name,
        description: state.currentProject.description ?? '',
        settings: state.currentProject.settings,
      });

      if (result.success && result.data) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });
        alert('Project saved successfully.');
      }
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Failed to save project: ' + (error as Error).message);
    }
  };

  const handleExportProject = async (format: 'json' | 'markdown') => {
    try {
      if (!state.currentProject) return;

      let blob: Blob;
      let filename: string;

      if (format === 'json') {
        blob = await exportAPI.exportJSON(state.currentProject.id);
        filename = `${state.currentProject.name}.json`;
      } else {
        blob = await exportAPI.exportMarkdown(state.currentProject.id);
        filename = `${state.currentProject.name}.md`;
      }

      downloadFile(blob, filename);
    } catch (error) {
      console.error('Failed to export project', error);
      alert('Failed to export project: ' + (error as Error).message);
    }
  };

  const handleShowHelp = () => {
    alert('Double-click on the canvas to add nodes, drag to reposition them, and use Delete to remove a selection.');
  };

  const nodes = state.currentProject?.nodes ?? [];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopToolbar
        zoom={state.canvasState.zoom}
        onZoomIn={() => handleZoomChange(state.canvasState.zoom + 0.1)}
        onZoomOut={() => handleZoomChange(state.canvasState.zoom - 0.1)}
        onResetZoom={() => handleZoomChange(1)}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onShowHelp={handleShowHelp}
        projectName={state.currentProject?.name}
        hasUnsavedChanges={false}
      />

      <div className="flex-1 flex min-h-0">
        <LeftPanel
          nodes={nodes}
          onCreateNode={(type) => handleCreateNode(type)}
          onNodeTypeChange={setSelectedNodeType}
          onNewProject={handleNewProject}
          onSaveProject={handleSaveProject}
          onExportProject={handleExportProject}
          aiSettings={state.aiSettings}
          onAISettingsChange={(settings) => dispatch({ type: 'UPDATE_AI_SETTINGS', payload: settings })}
          selectedNodeType={selectedNodeType}
          disabled={!state.currentProject}
        />

        <div className="flex-1 relative min-h-0">
          <ReasoningCanvas
            nodes={nodes}
            selectedNodeId={state.canvasState.selectedNodeId}
            newNodeType={selectedNodeType}
            zoom={state.canvasState.zoom}
            pan={state.canvasState.pan}
            onPanChange={handlePanChange}
            onZoomChange={handleZoomChange}
            onNodeSelect={handleSelectNode}
            onNodeUpdate={handleUpdateNode}
            onNodeCreate={(type, position) => handleCreateNode(type, position)}
          />
        </div>

        <RightPanel
          selectedNode={nodes.find((n) => n.id === state.canvasState.selectedNodeId) || null}
          onUpdateNode={async (node) => {
            try {
              if (!state.currentProject) return;
              const result = await projectAPI.updateNode(state.currentProject.id, node.id, node);
              if (result.success && result.data) {
                dispatch({ type: 'SET_CURRENT_PROJECT', payload: result.data });
              }
            } catch (error) {
              console.error('Failed to update node', error);
              alert('Failed to update node: ' + (error as Error).message);
            }
          }}
          onDeleteNode={handleDeleteNode}
          onGenerateAI={handleGenerateAI}
          isGenerating={generatingNodeId === state.canvasState.selectedNodeId}
          onClose={() => handleSelectNode(null)}
        />
      </div>
    </div>
  );
};
