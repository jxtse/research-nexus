import fs from 'fs';
import path from 'path';
import { ReasoningProject, ReasoningNode } from '../types/project';

const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

const projects = new Map<string, ReasoningProject>();

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
};

const loadProjectsFromDisk = () => {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');

  try {
    const parsed: ReasoningProject[] = JSON.parse(raw);
    parsed.forEach((project) => projects.set(project.id, project));
  } catch (error) {
    console.error('Failed to parse persisted projects, starting with empty store.', error);
  }
};

const persistProjects = () => {
  ensureDataFile();
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(Array.from(projects.values()), null, 2),
    'utf-8'
  );
};

loadProjectsFromDisk();

export const projectStorage = {
  create(project: ReasoningProject): void {
    projects.set(project.id, project);
    persistProjects();
  },

  get(id: string): ReasoningProject | undefined {
    return projects.get(id);
  },

  update(id: string, project: Partial<ReasoningProject>): ReasoningProject | undefined {
    const existing = projects.get(id);
    if (!existing) {
      return undefined;
    }

    const updated = { ...existing, ...project, updatedAt: new Date().toISOString() };
    projects.set(id, updated);
    persistProjects();
    return updated;
  },

  delete(id: string): boolean {
    const result = projects.delete(id);
    if (result) {
      persistProjects();
    }
    return result;
  },

  getAll(): ReasoningProject[] {
    return Array.from(projects.values());
  },

  addNode(projectId: string, node: ReasoningNode): ReasoningProject | undefined {
    const project = projects.get(projectId);
    if (!project) {
      return undefined;
    }

    project.nodes.push(node);
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
    persistProjects();
    return project;
  },

  updateNode(
    projectId: string,
    nodeId: string,
    node: Partial<ReasoningNode>
  ): ReasoningProject | undefined {
    const project = projects.get(projectId);
    if (!project) {
      return undefined;
    }

    const index = project.nodes.findIndex((n) => n.id === nodeId);
    if (index === -1) {
      return undefined;
    }

    const existingNode = project.nodes[index];
    const updatedNode: ReasoningNode = {
      ...existingNode,
      ...node,
      metadata: {
        ...existingNode.metadata,
        ...node.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    project.nodes[index] = updatedNode;
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
    persistProjects();
    return project;
  },

  deleteNode(projectId: string, nodeId: string): ReasoningProject | undefined {
    const project = projects.get(projectId);
    if (!project) {
      return undefined;
    }

    project.nodes = project.nodes.filter((node) => node.id !== nodeId);
    project.nodes.forEach((node) => {
      node.connections = node.connections.filter((connectionId) => connectionId !== nodeId);
    });
    project.updatedAt = new Date().toISOString();
    projects.set(projectId, project);
    persistProjects();
    return project;
  },

  getNode(projectId: string, nodeId: string): ReasoningNode | undefined {
    const project = projects.get(projectId);
    return project?.nodes.find((node) => node.id === nodeId);
  },
};
