import express from 'express';
import axios from 'axios';
import { projectStorage } from '../storage/projectStorage';
import type { ReasoningNode } from '../types/project';

const router = express.Router();
const ALLOWED_MODELS = ['openai/gpt-5', 'google/gemini-2.5-pro'] as const;

router.post('/reason', async (req, res) => {
  try {
    const { nodeId, projectId, context, aiSettings } = req.body;

    if (!nodeId || !projectId) {
      return res.status(400).json({ success: false, error: 'nodeId and projectId are required' });
    }

    if (!aiSettings?.apiKey) {
      return res.status(400).json({ success: false, error: 'AI API key is required' });
    }

    const project = projectStorage.get(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const currentNode = project.nodes.find((n) => n.id === nodeId);
    if (!currentNode) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }

    const reasoningContext = buildReasoningContext(project, currentNode, context);
    const requestedModel = aiSettings.model;
    const model = isAllowedModel(requestedModel) ? requestedModel : project.settings.model;
    const temperature =
      typeof aiSettings.temperature === 'number'
        ? aiSettings.temperature
        : project.settings.temperature;
    const maxTokens =
      typeof aiSettings.maxTokens === 'number' ? aiSettings.maxTokens : project.settings.maxTokens;

    const response = await callOpenRouterAPI({
      model,
      context: reasoningContext,
      nodeType: currentNode.type,
      nodeContent: currentNode.content,
      apiKey: aiSettings.apiKey,
      temperature,
      maxTokens,
    });

    const newNodes = parseAIResponse(response, currentNode);
    newNodes.forEach((node) => {
      projectStorage.addNode(projectId, node);
    });

    const updatedConnections = [...currentNode.connections, ...newNodes.map((n) => n.id)];
    projectStorage.updateNode(projectId, nodeId, { connections: updatedConnections });
    const updatedProject = projectStorage.get(projectId);

    res.json({
      success: true,
      data: {
        project: updatedProject,
        newNodes,
        aiResponse: response,
      },
    });
  } catch (error) {
    console.error('AI reasoning error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI reasoning',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

function buildReasoningContext(project: any, currentNode: any, userContext?: string): string {
  let context = `Current node type: ${currentNode.type}\n`;
  context += `Current node content: ${currentNode.content}\n\n`;

  const connectedNodes = project.nodes.filter((n: any) => currentNode.connections.includes(n.id));

  if (connectedNodes.length > 0) {
    context += 'Related nodes:\n';
    connectedNodes.forEach((node: any) => {
      context += `- ${node.type}: ${node.content}\n`;
    });
    context += '\n';
  }

  context += `Project context: ${project.description || project.name}\n\n`;
  if (userContext) {
    context += `User-provided context: ${userContext}\n\n`;
  }
  return context;
}

async function callOpenRouterAPI({
  model,
  context,
  nodeType,
  nodeContent,
  apiKey,
  temperature,
  maxTokens,
}: {
  model: string;
  context: string;
  nodeType: string;
  nodeContent: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  const prompt = generatePrompt(context, nodeType, nodeContent);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a research reasoning assistant. Expand structured reasoning trees with well-argued steps and JSON output.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://reasoning-graph-workspace.com',
          'X-Title': 'Reasoning Graph Workspace',
        },
      }
    );

    const message = response.data.choices?.[0]?.message;
    if (!message) {
      return '';
    }

    const { content } = message;
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((chunk: any) => {
          if (typeof chunk === 'string') return chunk;
          if (typeof chunk?.text === 'string') return chunk.text;
          if (chunk?.content) return chunk.content;
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    return '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
    }
    throw error;
  }
}

function generatePrompt(context: string, nodeType: string, nodeContent: string): string {
  return `${context}
Current focus node (${nodeType}): ${nodeContent}
Based on the context above, expand the next reasoning steps for the current ${nodeType} node.
Provide concise, structured thinking that considers alternate branches.
Return valid JSON using the following schema:
{
  "reasoningSteps": [
    {
      "type": "reasoning|hypothesis|branch|conclusion",
      "content": "Detailed description of the step",
      "confidence": 0.8,
      "rationale": "Short explanation"
    }
  ],
  "summary": "Optional short summary",
  "confidence": 0.75
}`;
}

function parseAIResponse(response: string, parentNode: ReasoningNode): ReasoningNode[] {
  try {
    const parsed = tryParseJson(response);

    if (parsed?.reasoningSteps && Array.isArray(parsed.reasoningSteps)) {
      return parsed.reasoningSteps.map((step: any, index: number) => {
        const normalizedStep = typeof step === 'string' ? { type: 'reasoning', content: step } : step;

        return {
          id: `ai-node-${Date.now()}-${index}`,
          type: validateNodeType(normalizedStep.type),
          content: normalizedStep.content,
          position: {
            x: parentNode.position.x + 300,
            y: parentNode.position.y + index * 150,
          },
          metadata: {
            confidence: normalizedStep.confidence || parsed.confidence || 0.7,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            aiGenerated: true,
            rationale: normalizedStep.rationale || parsed.summary,
          },
          connections: [],
        };
      });
    }
  } catch (error) {
    console.error('Failed to parse AI response as JSON, trying text parsing');
  }

  return parseTextResponse(response, parentNode);
}

function parseTextResponse(response: string, parentNode: ReasoningNode): ReasoningNode[] {
  const lines = response.split('\n').filter((line) => line.trim());
  const nodes: ReasoningNode[] = [];

  let currentNode: ReasoningNode | null = null;
  let nodeIndex = 0;

  lines.forEach((line) => {
    if (line.match(/^\d+\./) || line.match(/^[-*]/)) {
      if (currentNode) {
        nodes.push(currentNode);
      }

      currentNode = {
        id: `ai-node-${Date.now()}-${nodeIndex++}`,
        type: 'reasoning',
        content: line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''),
        position: {
          x: parentNode.position.x + 300,
          y: parentNode.position.y + nodeIndex * 150,
        },
        metadata: {
          confidence: 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          aiGenerated: true,
        },
        connections: [],
      };
    } else if (currentNode && line.trim()) {
      currentNode.content += ' ' + line.trim();
    }
  });

  if (currentNode) {
    nodes.push(currentNode);
  }

  return nodes;
}

function validateNodeType(type: string): ReasoningNode['type'] {
  const allowed: ReasoningNode['type'][] = ['question', 'reasoning', 'hypothesis', 'branch', 'conclusion'];
  return allowed.includes(type as ReasoningNode['type'])
    ? (type as ReasoningNode['type'])
    : 'reasoning';
}

function isAllowedModel(model: any): model is (typeof ALLOWED_MODELS)[number] {
  return ALLOWED_MODELS.includes(model);
}

function tryParseJson(content: string): any | null {
  if (!content) return null;

  let normalized = content.trim();

  const fenced = normalized.match(/```(?:json)?([\s\S]*?)```/i);
  if (fenced) {
    normalized = fenced[1].trim();
  }

  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    normalized = normalized.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

export { router as aiRoutes };
