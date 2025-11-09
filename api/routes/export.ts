import express from 'express';
import { projectStorage } from '../storage/projectStorage';

const router = express.Router();

router.get('/json/:projectId', (req, res) => {
  try {
    const project = projectStorage.get(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.json"`);

    res.json(project);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export project as JSON' });
  }
});

router.get('/markdown/:projectId', (req, res) => {
  try {
    const project = projectStorage.get(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const markdown = generateMarkdown(project);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.md"`);

    res.send(markdown);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export project as Markdown' });
  }
});

function generateMarkdown(project: any): string {
  let markdown = `# ${project.name}\n\n`;

  if (project.description) {
    markdown += `## Project description\n\n${project.description}\n\n`;
  }

  markdown += '## Project info\n\n';
  markdown += `- **Created at**: ${new Date(project.createdAt).toLocaleString()}\n`;
  markdown += `- **Updated at**: ${new Date(project.updatedAt).toLocaleString()}\n`;
  markdown += `- **Total nodes**: ${project.nodes.length}\n\n`;

  if (project.settings) {
    markdown += '## AI settings\n\n';
    markdown += `- **Model**: ${project.settings.model}\n`;
    markdown += `- **Temperature**: ${project.settings.temperature}\n`;
    markdown += `- **Max tokens**: ${project.settings.maxTokens}\n\n`;
  }

  if (project.nodes.length > 0) {
    markdown += '## Reasoning nodes\n\n';

    const nodesByType = project.nodes.reduce((acc: Record<string, any[]>, node: any) => {
      if (!acc[node.type]) {
        acc[node.type] = [];
      }
      acc[node.type].push(node);
      return acc;
    }, {} as Record<string, any[]>);

    const typeNames: Record<string, string> = {
      question: 'Questions',
      reasoning: 'Reasoning',
      hypothesis: 'Hypotheses',
      branch: 'Branches',
      conclusion: 'Conclusions',
    };

    const groupedEntries = Object.entries(nodesByType) as [string, any[]][];
    groupedEntries.forEach(([type, groupedNodes]) => {
      markdown += `### ${typeNames[type] || type}\n\n`;

      groupedNodes.forEach((node: any, index: number) => {
        markdown += `#### ${typeNames[type] || type} ${index + 1}\n\n`;
        markdown += `${node.content || '_No content provided._'}\n\n`;

        if (node.metadata) {
          markdown += `**Confidence**: ${Math.round(node.metadata.confidence * 100)}%\n\n`;
          if (node.metadata.aiGenerated) {
            markdown += '**Source**: AI generated\n\n';
          }
          if (node.metadata.rationale) {
            markdown += `**Rationale**: ${node.metadata.rationale}\n\n`;
          }
        }

        if (node.connections?.length) {
          markdown += `**Connections**: ${node.connections.join(', ')}\n\n`;
        }
      });
    });
  }

  return markdown;
}

export { router as exportRoutes };
