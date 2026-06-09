import { Router } from 'express';
import { getAllRows, getRow } from '../database.js';

const router = Router();

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

// ==================== 提示词配置 ====================

// 1. 主页推荐助手提示词 - 用于帮助用户发现和浏览演示程序
const MAIN_PAGE_SYSTEM_PROMPT = `你是 Tomorrow 科学演示平台的智能推荐助手。你的主要职责是帮助用户发现适合他们学习需求的科学演示程序。

【核心职责】
- 根据用户的兴趣和需求，从数据库中推荐合适的演示程序
- 帮助用户理解不同演示程序的学习价值
- 引导用户探索平台上的科学内容

【严格规则 - 无例外】
1. 你只能推荐"可用演示程序"列表中明确列出的演示程序
2. 如果列表为空或没有匹配的内容，你必须明确告知用户："我目前没有符合您需求的演示程序"
3. 绝对不要编造、猜测或幻觉任何演示程序ID
4. 每个推荐的演示程序必须使用精确的ID格式
5. 不要强行套固定模板；先回答用户的问题，只有当问题与资源查找、学习建议或程序推荐有关时才推荐程序

【推荐格式】
当提到演示程序时，必须使用 Markdown 链接，链接地址使用 demo://DEMO_ID：
[演示程序标题](demo://DEMO_ID)

【交互风格】
- 热情友好，鼓励用户探索
- 解释为什么推荐的演示程序对学习有帮助
- 如果用户请求不明确，主动询问以更好地理解需求`;

// 2. 知识点讲解助手提示词 - 用于在演示页面讲解科学概念和引导交互
const DEMO_EXPLAINER_SYSTEM_PROMPT = `你是 Tomorrow 科学演示平台的小程序内置学习助手。你会结合当前演示程序的信息和之前的对话，帮助用户理解、探索、排错或继续学习。

【核心职责】
- 讲解演示程序所展示的核心科学概念和原理
- 将抽象的理论与可视化效果联系起来
- 引导用户通过操作演示程序来加深理解
- 回答用户关于概念理解的问题
- 如果用户只是寒暄、追问上一轮内容、询问操作步骤或提出开放问题，请自然回应，不要每次都重新完整介绍程序
- 只有在用户的问题明显与当前程序相关时，才主动结合程序标题、描述、交互方式或核心概念

【讲解重点】
- 专注于概念本身，而非代码实现
- 解释"为什么"和"是什么"，而非"怎么做"
- 结合演示程序的可视化效果进行讲解
- 提供实际应用场景和例子

【互动引导】
- 鼓励用户观察演示程序的变化
- 建议用户尝试调整参数或交互
- 引导用户思考现象背后的原理
- 提出探索性问题激发思考

【讲解示例 - 导数演示程序】
以下是一个优秀的讲解示例，请参照这种格式和风格：

---

## 导数几何意义的交互式演示

**导数**是微积分中最核心的概念之一，它描述了函数在某一点的**瞬时变化率**。这个演示直观地展示了导数的几何意义：

### 什么是导数？

导数表示函数图像上某点**切线的斜率**，它衡量的是函数值随输入变化的敏感度。例如在物理中，速度是位移对时间的导数。

### 几何意义的直观理解

这个演示通过两个关键元素展示导数的几何意义：

- **割线**：连接函数上两点的直线，其斜率表示平均变化率
- **切线**：当两点无限接近时，割线趋近于的极限位置，其斜率表示瞬时变化率

### 核心数学表达

演示程序使用以下公式计算导数：
$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

其中：
- $f(x)$ 是原始函数
- $f'(x)$ 是导函数
- $h$ 是两点间的间距

### 交互探索建议

1. **调整$x$值**：观察切线和割线如何随位置变化
2. **减小$h$值**：观察割线如何趋近于切线，理解极限过程
3. **思考关系**：比较割线斜率与导数之间的关联

> 💡 **核心思想**：这个演示直观展示了微积分基本思想——通过局部线性近似来理解复杂函数的变化规律。

---

【Markdown 格式规范 - 必须严格遵守】
1. **标题层级**：使用 ## 作为主标题，### 作为子标题
2. **强调**：使用 **粗体** 突出关键概念和术语
3. **列表**：使用 - 或 1. 2. 3. 来列举要点
4. **引用块**：使用 > 来突出核心思想或重要提示
5. **分段**：使用空行分隔不同段落，保持清晰层次
6. **结构**：按照"概念介绍 → 直观理解 → 数学表达 → 交互建议"的结构组织内容

【LaTeX 数学公式规范 - 必须严格遵守】
**极其重要**：所有数学公式必须使用正确的 LaTeX 语法，否则无法显示！

### 公式类型选择：
- **行内公式**：用于简短的数学表达式，嵌入在文本中
  - 格式：\$公式内容\$
  - 示例：\$f'(x) = 2x\$, \$E = mc^2\$, \$x = 2\$, \$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1\$
  
- **独立公式**：用于重要的、需要突出的公式，必须单独成行
  - 格式：\$\$公式内容\$\$
  - 示例：
    \$\$
    f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}
    \$\$

### 常用 LaTeX 命令（必须使用正确语法）：
- **上下标**：x^2 (上标), x_i (下标), x_i^j (上下标)
- **分数**：\\frac{分子}{分母}，如 \\frac{1}{2}, \\frac{f(x+h)-f(x)}{h}
- **极限**：\\lim_{x \\to 0}，如 \\lim_{h \\to 0}
- **求和**：\\sum_{i=1}^{n}
- **积分**：\\int_{a}^{b}
- **希腊字母**：\\alpha, \\beta, \\gamma, \\theta, \\pi, \\Delta
- **数学符号**：\\infty (∞), \\partial (∂), \\nabla (∇), \\approx (≈)
- **箭头**：\\to (→), \\Rightarrow (⇒), \\leftarrow (←)
- **括号**：\\left( \\right), \\left[ \\right], \\left{ \\right}
- **导数符号**：f'(x), f''(x), \\frac{dy}{dx}, \\frac{d^2y}{dx^2}

### 公式书写规则：
1. **所有反斜杠命令必须正确**：如 \\lim, \\frac, \\to 等
2. **花括号必须成对出现**：\\frac{...}{...} 中的 { 和 } 必须匹配
3. **行内公式不换行**：\$...\$ 中的内容不能包含换行符
4. **独立公式必须单独成行**：\$\$ 前后必须有空行
5. **特殊字符要转义**：\$, %, &, # 等需要在前面加反斜杠
6. **变量名使用斜体**：默认就是斜体，如 \$x\$, \$f(x)\$

### 常见错误示例（❌ 错误 → ✅ 正确）：
- ❌ \$lim x->0\$ → ✅ \$\\lim_{x \\to 0}\$
- ❌ \$(f(x+h)-f(x))/h\$ → ✅ \$\\frac{f(x+h)-f(x)}{h}\$
- ❌ \$x^10\$ → ✅ \$x^{10}\$ (多位数指数需要花括号)
- ❌ \$\$f'(x) = 2x\$\$ (在同一行) → ✅ \$\$ 单独成行

### 公式验证清单：
在输出公式前，请检查：
- [ ] 行内公式使用单 \$，独立公式使用 \$\$
- [ ] 所有 \\ 命令拼写正确
- [ ] 所有 { 都有匹配的 }
- [ ] 分数使用 \\frac{...}{...} 格式
- [ ] 极限使用 \\lim_{...} 格式
- [ ] 没有遗漏的 \$ 符号
4. **独立公式必须单独成行**：\$\$ 前后必须有空行
5. **特殊字符要转义**：\$, %, &, # 等需要在前面加反斜杠
6. **变量名使用斜体**：默认就是斜体，如 \$x\$, \$f(x)\$

### 常见错误示例（❌ 错误 → ✅ 正确）：
- ❌ \$lim x->0\$ → ✅ \$\\lim_{x \\to 0}\$
- ❌ \$(f(x+h)-f(x))/h\$ → ✅ \$\\frac{f(x+h)-f(x)}{h}\$
- ❌ \$x^10\$ → ✅ \$x^{10}\$ (多位数指数需要花括号)
- ❌ \$\$f'(x) = 2x\$\$ (在同一行) → ✅ \$\$ 单独成行

### 公式验证清单：
在输出公式前，请检查：
- [ ] 行内公式使用单 \$，独立公式使用 \$\$
- [ ] 所有 \\ 命令拼写正确
- [ ] 所有 { 都有匹配的 }
- [ ] 分数使用 \\frac{...}{...} 格式
- [ ] 极限使用 \\lim_{...} 格式
- [ ] 没有遗漏的 \$ 符号

【禁止事项】
- 不要讲解代码实现细节
- 不要展示代码片段
- 不要说"这段代码..."
- 不要解释编程技术
- 不要使用语法错误的 LaTeX 公式`;


// ==================== 辅助函数 ====================

// 同义词映射表 - 帮助扩展搜索
const synonymMap = {
  '导数': ['derivative', '微分', 'differential', 'slope', '斜率', '切线', 'tangent'],
  '微分': ['derivative', '导数', 'differential'],
  '积分': ['integral', 'accumulation', '面积'],
  '函数': ['function', '方程', 'formula'],
  '物理': ['physics', '力学', '运动'],
  '化学': ['chemistry', '分子', '原子'],
  '数学': ['mathematics', 'math', '几何', '代数']
};

// 扩展关键词，添加同义词
const expandKeywords = (keywords) => {
  const expanded = new Set(keywords);
  
  keywords.forEach(keyword => {
    // 检查是否有同义词
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (keyword.includes(key) || key.includes(keyword)) {
        synonyms.forEach(syn => expanded.add(syn));
      }
    }
  });
  
  return Array.from(expanded);
};

// Helper to get all demos (fallback)
const getAllDemos = async (limit = 10, user = null) => {
  try {
    let query = `
      SELECT d.*, u.username as author_name 
      FROM demos d 
      LEFT JOIN users u ON d.author = u.id 
      WHERE d.status = 'published'
    `;
    const params = [];
    query = appendVisibilityScope(query, params, user);
    query += ` ORDER BY d.created_at DESC LIMIT ?`;
    params.push(limit);

    const demos = await getAllRows(query, params);
    return demos.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      layer: row.layer,
      author: row.author_name || row.author,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Get all demos error:', error);
    return [];
  }
};

const getCurrentUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return await getRow('SELECT * FROM users WHERE id = ?', [payload.userId]);
  } catch {
    return null;
  }
};

const appendVisibilityScope = (query, params, user) => {
  if (user?.role === 'general_admin') {
    return query;
  }
  if (user?.id) {
    query += `
      AND (
        d.layer = 'general'
        OR EXISTS (
          SELECT 1 FROM demo_locations dl
          WHERE dl.demo_id = d.id AND dl.layer = 'general'
        )
        OR (
          COALESCE(d.community_id, '') IN (
            SELECT community_id FROM community_members
            WHERE user_id = ? AND status = 'member'
          )
        )
        OR EXISTS (
          SELECT 1 FROM demo_locations dl
          WHERE dl.demo_id = d.id
            AND dl.layer = 'community'
            AND dl.community_id IN (
              SELECT community_id FROM community_members
              WHERE user_id = ? AND status = 'member'
            )
        )
      )
    `;
    params.push(user.id, user.id);
    return query;
  }
  query += `
    AND (
      d.layer = 'general'
      OR EXISTS (
        SELECT 1 FROM demo_locations dl
        WHERE dl.demo_id = d.id AND dl.layer = 'general'
      )
    )
  `;
  return query;
};

// Helper to search demos in database
const searchDemos = async (keywords, subject = null, user = null) => {
  try {
    // 扩展关键词
    const expandedKeywords = expandKeywords(keywords);
    console.log('Search demos - Original keywords:', keywords);
    console.log('Search demos - Expanded keywords:', expandedKeywords);
    
    let query = `
      SELECT d.*, u.username as author_name
      FROM demos d
      LEFT JOIN users u ON d.author = u.id
      WHERE d.status = 'published'
    `;
    const params = [];
    query = appendVisibilityScope(query, params, user);
    
    if (subject) {
      query += ` AND d.category_id = ?`;
      params.push(subject);
    }
    
    if (expandedKeywords && expandedKeywords.length > 0) {
      const keywordConditions = expandedKeywords.map(() => 
        `(d.title LIKE ? OR d.description LIKE ? OR d.code LIKE ?)`
      ).join(' OR ');
      query += ` AND (${keywordConditions})`;
      
      expandedKeywords.forEach(keyword => {
        const pattern = `%${keyword}%`;
        params.push(pattern, pattern, pattern);
      });
    }
    
    query += ` ORDER BY d.created_at DESC LIMIT 10`;
    
    let demos = await getAllRows(query, params);
    console.log(`Search demos - Found ${demos.length} results with keywords`);
    
    // 如果关键词搜索没有结果，尝试更宽松的搜索
    if (demos.length === 0 && expandedKeywords.length > 0) {
      console.log('No results with strict search, trying relaxed search...');
      
      // 尝试只搜索标题（更宽松）
      let relaxedQuery = `
        SELECT d.*, u.username as author_name
        FROM demos d
        LEFT JOIN users u ON d.author = u.id
        WHERE d.status = 'published'
      `;
      const relaxedParams = [];
      relaxedQuery = appendVisibilityScope(relaxedQuery, relaxedParams, user);
      
      if (subject) {
        relaxedQuery += ` AND d.category_id = ?`;
        relaxedParams.push(subject);
      }
      
      // 只搜索标题，更宽松
      const titleConditions = expandedKeywords.map(() => `d.title LIKE ?`).join(' OR ');
      relaxedQuery += ` AND (${titleConditions})`;
      expandedKeywords.forEach(keyword => {
        relaxedParams.push(`%${keyword}%`);
      });
      
      relaxedQuery += ` ORDER BY d.created_at DESC LIMIT 10`;
      demos = await getAllRows(relaxedQuery, relaxedParams);
      console.log(`Relaxed search found ${demos.length} results`);
    }
    
    // 如果仍然没有结果，返回所有演示程序作为后备
    if (demos.length === 0) {
      console.log('No results with relaxed search, returning all demos as fallback');
      demos = await getAllDemos(5, user);
    }
    
    return demos.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      layer: row.layer,
      author: row.author_name || row.author,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('Search demos error:', error);
    return [];
  }
};

// Helper to get demos by subject
const getDemosBySubject = async (subject, user = null) => {
  return await searchDemos([], subject, user);
};

// Helper to get a specific demo by ID
const getDemoById = async (demoId) => {
  try {
    const row = await getRow(`
      SELECT d.*, u.username as author_name 
      FROM demos d 
      LEFT JOIN users u ON d.author = u.id 
      WHERE d.id = ? AND d.status = 'published'
    `, [demoId]);
    
    if (!row) return null;
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      layer: row.layer,
      code: row.code,
      author: row.author_name || row.author,
      createdAt: row.created_at
    };
  } catch (error) {
    console.error('Get demo by ID error:', error);
    return null;
  }
};

// Helper to extract search intent from user prompt
const extractSearchIntent = (prompt) => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Subject keywords mapping - 使用数据库中的实际分类ID
  const subjectMap = {
    'cat-physics': ['物理', 'physics', '力学', '电磁学', '光学', '热学', '运动', '力', '能量', '波动', '粒子', '量子'],
    'cat-chemistry': ['化学', 'chemistry', '分子', '原子', '反应', '化合物', '元素', '化学键', '振动'],
    'cat-mathematics': ['数学', 'mathematics', 'math', '几何', '代数', '微积分', '函数', '方程', '导数', '微分', '积分', '极限', '斜率', '曲线', '极值', '最值', '变化率', '切线', '抛物线', '正弦', '余弦', '三角函数'],
    'cat-biology': ['生物', 'biology', '细胞', '基因', '生态', '进化', '生命', 'dna', '蛋白质'],
    'cat-computer-science': ['计算机', 'computer', '编程', '代码', '算法', '程序', '软件', 'cs', '数据结构'],
    'cat-astronomy': ['天文', 'astronomy', '宇宙', '星球', '星系', '恒星', '行星', '黑洞', '引力'],
    'cat-earth-science': ['地球科学', 'earth', '地质', '气象', '气候', '地震', '火山', '海洋'],
    'cat-creative-tools': ['创意', 'creative', '工具', '艺术', '设计', '可视化', '动画']
  };
  
  // Check for subject match
  for (const [subject, keywords] of Object.entries(subjectMap)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return { subject, keywords: [] };
    }
  }
  
  // Extract general keywords - 扩展常见词列表
  const commonWords = ['我', '要', '想', '学习', '了解', '知道', '关于', '的', '一个', '一些', '推荐', '有没有', '请问', '搜索', '查找', '找', '给我', '展示', '看看', '介绍', '讲', '说', '下', '一下', '相关', '有关', '有关', '方面', '内容', '演示', '程序', '例子', '示例'];
  const keywords = lowerPrompt
    .split(/[\s,，。！？?!]+/)
    .filter(word => word.length > 1 && !commonWords.includes(word));
  
  return { subject: null, keywords };
};

// Helper to format demos context for main page
const formatDemosContext = (demos) => {
  if (demos.length === 0) {
    return `=== 可用演示程序 ===\n当前数据库中没有符合条件的演示程序。\n\n请告知用户没有匹配的演示程序，并建议：\n1. 尝试其他关键词\n2. 浏览探索页面查看所有可用演示\n3. 提出具体需求，我们可以帮助创建`;
  }
  
  let context = `=== 可用演示程序（只能推荐这些）===\n`;
  demos.forEach((demo, idx) => {
    context += `[${idx + 1}] 标题: "${demo.title}" | ID: "${demo.id}" | 分类: ${demo.categoryId}\n`;
    if (demo.description) {
      context += `    描述: ${demo.description.substring(0, 80)}${demo.description.length > 80 ? '...' : ''}\n`;
    }
  });
  context += `=== 结束 ===\n\n你只能推荐上述列表中的演示程序。如果用户询问的内容不在列表中，请明确告知没有匹配的演示程序。`;
  return context;
};

// Helper to format demo context for explainer
const formatDemoContext = (demo) => {
  if (!demo) return '';
  
  return `=== 当前演示程序信息 ===
标题: ${demo.title}
ID: ${demo.id}
分类: ${demo.categoryId}
描述: ${demo.description || '无描述'}
作者: ${demo.author || '未知'}

=== 演示程序代码 ===
\`\`\`html
${demo.code}
\`\`\`

请根据上述代码，帮助用户理解这个演示程序的工作原理。`;
};

// ==================== 路由处理 ====================

// Main chat endpoint - supports both modes
router.post('/chat', async (req, res) => {
  const { prompt, context, mode = 'recommend', demoId, history = [] } = req.body || {};
  
  if (!prompt) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: ${JSON.stringify({ content: 'Error: Prompt is required' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    const model = process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

    console.log('AI Chat - API Key check:', apiKey ? '已配置' : '未配置');
    console.log('AI Chat - Model:', model);

    if (!apiKey) {
      console.error('Missing SILICONFLOW_API_KEY');
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ content: 'Error: Server configuration error. Please contact administrator.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

	    // Build messages based on mode
	    const messages = [];
	    let demosContext = '';
    const currentUser = await getCurrentUser(req);
    const recentHistory = Array.isArray(history)
      ? history
          .filter(item => item && ['user', 'model'].includes(item.role) && typeof item.text === 'string' && item.text.trim())
          .slice(-10)
          .map(item => ({
            role: item.role === 'model' ? 'assistant' : 'user',
            content: item.text.slice(0, 2000)
          }))
      : [];

    if (mode === 'code-generate') {
      // ===== 代码生成模式 - 专门用于AI配置功能 =====
      messages.push({ 
        role: 'system', 
        content: `你是一个专业的前端开发助手。请根据用户的需求，对提供的演示程序代码进行全面升级。

【核心任务 - 最重要！！！】
你要完成的是一个**完整的项目重塑**，基于用户提供的原始程序，通过调用我们提供的后端工具，创造出一个完整的、可运行的新版本。

【输出格式要求】
请使用Markdown格式输出，包含以下几个部分：

1. 首先用一段话简要说明你的修改思路和主要改进点
2. 然后列出主要的改进点（用-开头的列表）
3. 最后展示完整的代码

【代码展示格式】
- 如果是单文件项目：使用 \`\`\`html ... \`\`\` 代码块
- 如果是多文件项目：每个文件使用单独的代码块，并在代码块前标注文件名，如：
  ### index.html
  \`\`\`html
  ...
  \`\`\`
  
  ### game.js
  \`\`\`javascript
  ...
  \`\`\`

【系统已提供的API（超级简单，直接用！）
系统已经封装好了超级简单的API，直接用 window.TomorrowAI.xxx 就行！

====== 数据存储API（最简单的方式）
window.TomorrowAI.storage.set('key', value)    // 保存数据
window.TomorrowAI.storage.get('key')             // 获取数据
window.TomorrowAI.storage.getAll()               // 获取所有数据

示例：
await window.TomorrowAI.storage.set('score', 100);  // 保存分数
const score = await window.TomorrowAI.storage.get('score');  // 读取分数

====== 多人联机API（两种方式，推荐用WebSocket！）
方式一：WebSocket（毫秒级实时！超级简单）
const ws = new window.TomorrowAI.WebSocket(
  window.TomorrowAI.demoId,   // demoId（自动有）
  roomId,                      // 房间ID
  'my-user-id'                 // 用户ID
);

ws.onMessage = (data) => {
  // 实时收到数据！
  console.log('收到:', data);
};

ws.onUserJoined = (user) => {
  console.log('用户加入:', user.userId);
};

ws.connect();              // 连接
ws.send({ x: 100 });      // 发送数据
ws.disconnect();           // 断开

方式二：房间API（HTTP轮询）
window.TomorrowAI.rooms.list()           // 获取房间列表
window.TomorrowAI.rooms.create(title)    // 创建房间
window.TomorrowAI.rooms.join(roomId)     // 加入房间
window.TomorrowAI.rooms.leave()           // 离开房间
window.TomorrowAI.rooms.sendMessage(type, data)  // 发送消息
window.TomorrowAI.rooms.getMessages(since)       // 获取新消息

【代码修改规则 - 极其重要！绝对不能违反！！！】
1. 【最高优先级】绝对、绝对、绝对不要丢失原有代码的核心功能！！！
   - 原有程序的所有功能必须完全保留
   - 在原有代码的基础上**添加**新功能，而不是替换
   - 原有游戏/演示的核心玩法、交互逻辑、UI布局都要完整保留
   - 新功能必须与原有程序完美融合，不能破坏原有程序的使用
   
2. 必须返回**完整的、可运行的代码**，不要只返回部分代码或"关键片段"
   - 如果是单文件，必须返回整个完整的HTML文件，包括<!DOCTYPE html>到</html>
   - 如果是多文件，每个文件都要完整返回
   - 绝对不要省略任何代码！

3. 优先使用 window.TomorrowAI.xxx API，不要自己写fetch请求

4. 如果是对战游戏，要改成真正的联机模式，支持两个电脑玩同一局游戏
   - **必须！！！** 添加完整的房间管理界面
   - 包括：创建房间按钮、房间列表显示、加入房间输入框等
   - 所有交互都要有对应的前端界面显示
   - **关键！！！** 房间功能不能破坏原有游戏的玩法，要作为附加功能完美融合

5. 要添加相应的UI界面，比如房间列表、创建房间、加入房间等界面
   - **这不是可选的！** 所有功能都必须有对应的前端界面
   - 例如：如果添加了数据存储功能，就要显示分数排行榜、保存进度按钮等
   - 如果添加了联机功能，就要显示房间列表、创建房间、加入房间等完整界面
   - 所有UI元素都要能正常交互和显示
   - **融合设计！！！** 新界面必须与原有程序的视觉风格保持一致
   - 不要创建全屏的遮挡界面，应该使用浮动面板、侧边栏或顶部/底部工具栏等方式
   - 确保用户可以随时切换回原有程序的正常使用

6. 数据存储要真正集成到游戏逻辑中，保存分数、进度等
   - 同时要有对应的前端界面显示保存的数据
   - 例如：分数排行榜、历史记录、进度显示等
   - 数据存储功能要作为原有游戏的增强，而不是替代

7. 如果单文件无法实现，可以写成多文件项目

8. 【融合设计原则 - 至关重要！！！】
   - 新功能必须与原有程序完美融合，不能孤立存在
   - 保持原有程序的整洁清晰，不要添加杂乱的界面
   - 新界面元素的样式要与原有程序保持一致
   - 不要破坏原有程序的布局和交互流程
   - 确保用户既可以使用新功能，也可以像以前一样使用原有程序

【代码质量要求 - 必须严格遵守！！！】
1. 代码格式必须整洁清晰
   - 正确的缩进（2个或4个空格）
   - 合适的空行分隔不同代码块
   - 保持原有的代码风格
   
2. HTML代码必须正确格式化
   - 标签正确闭合
   - 属性正确排列
   - 不要出现\\n或转义字符直接显示在页面上的情况！
   
3. 确保页面显示完美
   - 所有UI元素正确显示
   - 样式完整
   - 没有乱码或格式错误
   
4. 仔细检查原有代码
   - 逐行对比，确保所有原有功能都保留
   - 不要遗漏任何重要的代码片段
   - 确保修改后的代码可以直接运行

【禁止事项 - 绝对不能做！！！】
1. 不要省略任何原有代码
2. 不要返回部分代码或"关键片段"
3. 不要让代码中出现\\n等转义字符
4. 不要破坏原有的代码格式
5. 不要丢失任何原有功能

【重要提醒】
- 不要设置任何代码长度限制，返回完整代码
- 代码中的引号不需要转义
- 保持代码格式整洁易读
- 确保代码可以直接运行
- 仔细检查原有代码，确保所有功能都保留` 
      });
      
      if (context) {
        messages.push({ role: 'system', content: context });
      }
      
    } else if (mode === 'explain' && demoId) {
      // ===== 演示页面讲解模式 =====
      const demo = await getDemoById(demoId);
      
      messages.push({ role: 'system', content: DEMO_EXPLAINER_SYSTEM_PROMPT });
      
      if (demo) {
        messages.push({ role: 'system', content: formatDemoContext(demo) });
      } else {
        messages.push({ role: 'system', content: '注意：当前演示程序信息无法加载，请基于用户的问题提供一般性的代码讲解帮助。' });
      }
      
    } else {
      // ===== 主页推荐模式 =====
      messages.push({ role: 'system', content: MAIN_PAGE_SYSTEM_PROMPT });
      
      // Search for relevant demos
      const searchIntent = extractSearchIntent(prompt);
      
	      if (searchIntent.subject || searchIntent.keywords.length > 0) {
	        let demos = [];
        
        if (searchIntent.subject) {
	          demos = await getDemosBySubject(searchIntent.subject, currentUser);
	        } else {
	          demos = await searchDemos(searchIntent.keywords, null, currentUser);
	        }
        
	        demosContext = formatDemosContext(demos);
	        messages.push({ role: 'system', content: demosContext });
	      } else {
	        const demos = await getAllDemos(8, currentUser);
	        demosContext = formatDemosContext(demos);
	        messages.push({ role: 'system', content: demosContext });
	      }
	    }

    recentHistory.forEach(message => messages.push(message));

	    // Add user prompt
	    messages.push({ role: 'user', content: prompt });

    console.log(`AI Chat - Mode: ${mode}, DemoId: ${demoId || 'N/A'}, Messages: ${messages.length}`);

    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: mode === 'code-generate' ? 32768 : 8192,
        temperature: mode === 'code-generate' ? 0.3 : 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('SiliconFlow API Error:', response.status, errorData);
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ content: `Error: AI service error (${response.status}). Please try again later.` })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let outputBuffer = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            outputBuffer.push('data: [DONE]\n\n');
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            let content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              // 清理内容，去除可能的乱码和不可见字符
              content = content
                .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n');
              
              outputBuffer.push(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', line, e);
          }
        }
      }
      
      // Flush buffer to ensure order
      while (outputBuffer.length > 0) {
        res.write(outputBuffer.shift());
      }
    }

    if (buffer.trim() && buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (data === '[DONE]') {
        res.write('data: [DONE]\n\n');
      } else {
        try {
          const parsed = JSON.parse(data);
          let content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            content = content
              .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '')
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n');
            
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch (e) {
          console.warn('Failed to parse remaining buffer:', buffer, e);
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('AI chat error:', error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    res.write(`data: ${JSON.stringify({ content: 'Error: ' + (error.message || 'Server error') })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

export default router;
