import axios from 'axios';
import type { APIResponse } from '../types';
import type { ReasoningProject } from '../types/reasoning';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (error.response?.status === 404) {
      throw new Error('The requested resource could not be found.');
    }

    if (error.response?.status === 500) {
      throw new Error('The server encountered an unexpected error.');
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error('The request timed out. Please check your network connection.');
    }

    if (!error.response) {
      throw new Error('Network error. Confirm the API server is running.');
    }

    throw error;
  }
);

export const projectAPI = {
  async getAll() {
    const response = await api.get<APIResponse<ReasoningProject[]>>('/projects');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<APIResponse<ReasoningProject>>(`/projects/${id}`);
    return response.data;
  },

  async create(name: string, description?: string) {
    const response = await api.post<APIResponse<ReasoningProject>>('/projects', { name, description });
    return response.data;
  },

  async update(id: string, updates: Partial<any>) {
    const response = await api.put<APIResponse<ReasoningProject>>(`/projects/${id}`, updates);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete<APIResponse<ReasoningProject>>(`/projects/${id}`);
    return response.data;
  },

  async addNode(projectId: string, node: any) {
    const response = await api.post<APIResponse<ReasoningProject>>(`/projects/${projectId}/nodes`, node);
    return response.data;
  },

  async updateNode(projectId: string, nodeId: string, updates: Partial<any>) {
    const response = await api.put<APIResponse<ReasoningProject>>(`/projects/${projectId}/nodes/${nodeId}`, updates);
    return response.data;
  },

  async deleteNode(projectId: string, nodeId: string) {
    const response = await api.delete<APIResponse<ReasoningProject>>(`/projects/${projectId}/nodes/${nodeId}`);
    return response.data;
  },
};

export const aiAPI = {
  async generateReasoning(
    nodeId: string,
    projectId: string,
    context: string,
    aiSettings: any
  ) {
    const response = await api.post<APIResponse<{ project: ReasoningProject }>>('/ai/reason', {
      nodeId,
      projectId,
      context,
      aiSettings,
    });
    return response.data;
  },
};

export const exportAPI = {
  async exportJSON(projectId: string) {
    const response = await api.get(`/export/json/${projectId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportMarkdown(projectId: string) {
    const response = await api.get(`/export/markdown/${projectId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;
