# -*- coding: utf-8 -*-
from pathlib import Path
mapping = {
    ' // 获取所有项�?': ' // Fetch all projects',
    '// 获取单个项目': '// Fetch a single project',
    '// 创建新项�?': '// Create a new project',
    '// 更新项目': '// Update a project',
    '// 删除项目': '// Delete a project',
    '// 添加节点': '// Add a node',
    '// 更新节点': '// Update a node',
    '// 删除节点': '// Delete a node',
}
path = Path('api/routes/projects.ts')
text = path.read_text(encoding='utf-8')
for old, new in mapping.items():
    text = text.replace(old, new)
path.write_text(text, encoding='utf-8')
