import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { projectStorage } from '../storage/projectStorage';
import type { ReasoningProject, ReasoningNode } from '../types/project';

const router = express.Router();

// Fetch all projects
router.get('/', (_req, res) => {
  try {
    const projects = projectStorage.getAll();
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// Fetch a single project by ID
router.get('/:id', (req, res) => {
  try {
    const project = projectStorage.get(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// Create a new project
router.post('/', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    const project: ReasoningProject = {
      id: uuidv4(),
      name,
      description: description || '',
      nodes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        model: 'openai/gpt-5',
        temperature: 0.7,
        maxTokens: 2000,
      },
    };

    projectStorage.create(project);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// Update an existing project
router.put('/:id', (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const existingProject = projectStorage.get(req.params.id);

    if (!existingProject) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const mergedSettings = settings
      ? { ...existingProject.settings, ...settings }
      : existingProject.settings;

    const updatedProject = projectStorage.update(req.params.id, {
      name: name ?? existingProject.name,
      description: description ?? existingProject.description,
      settings: mergedSettings,
    });

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/:id', (req, res) => {
  try {
    const success = projectStorage.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

// Add a node to a project
router.post('/:id/nodes', (req, res) => {
  try {
    const node: ReasoningNode = req.body;

    if (!node.type) {
      return res.status(400).json({ success: false, error: 'Node type is required' });
    }

    const timestamp = new Date().toISOString();
    const nodeWithDefaults: ReasoningNode = {
      ...node,
      content: node.content ?? '',
      connections: node.connections || [],
      metadata: {
        confidence: node.metadata?.confidence ?? 0.7,
        createdAt: node.metadata?.createdAt ?? timestamp,
        updatedAt: node.metadata?.updatedAt ?? timestamp,
        aiGenerated: node.metadata?.aiGenerated ?? false,
        rationale: node.metadata?.rationale,
      },
    };

    const updatedProject = projectStorage.addNode(req.params.id, nodeWithDefaults);
    if (!updatedProject) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(201).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add node' });
  }
});

// Update a node
router.put('/:id/nodes/:nodeId', (req, res) => {
  try {
    const updatedProject = projectStorage.updateNode(req.params.id, req.params.nodeId, req.body);
    if (!updatedProject) {
      return res.status(404).json({ success: false, error: 'Project or node not found' });
    }

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update node' });
  }
});

// Delete a node
router.delete('/:id/nodes/:nodeId', (req, res) => {
  try {
    const updatedProject = projectStorage.deleteNode(req.params.id, req.params.nodeId);
    if (!updatedProject) {
      return res.status(404).json({ success: false, error: 'Project or node not found' });
    }

    res.json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete node' });
  }
});

export { router as projectRoutes };
