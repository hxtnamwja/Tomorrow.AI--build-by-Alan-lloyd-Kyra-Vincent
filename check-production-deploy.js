#!/usr/bin/env node
// 生产环境部署检查脚本

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 开始检查生产环境部署配置...');

const checkItems = [
  {
    name: '前端生产环境配置',
    path: '.env.production',
    check: (content) => {
      return content.includes('VITE_API_URL=https://twbt.top/api/v1');
    },
    fix: () => {
      return `# Production Environment Configuration
# 生产环境配置

# API Configuration - 生产环境使用完整URL
VITE_API_URL=https://twbt.top/api/v1

# AI Service (Optional - for AI features)
# GEMINI_API_KEY=your_gemini_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here
`;
    }
  },
  {
    name: '后端生产环境配置',
    path: 'backend/.env.production',
    check: (content) => {
      return content.includes('BASE_URL=https://twbt.top') &&
             content.includes('SILICONFLOW_API_KEY=');
    },
    fix: () => {
      return `# Production Backend Configuration
# 生产环境后端配置

# SiliconFlow AI API Key
SILICONFLOW_API_KEY=sk-puqzrflintylyigipfpybljhlqcysnvolidgnnktwcoiekpe
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-R1-0528-Qwen3-8B

# Server Configuration
PORT=3001

# Base URL for generating links (生产环境使用真实域名)
BASE_URL=https://twbt.top

# Database path (optional, defaults to ./database.sqlite)
# DB_PATH=/var/www/twbt.top/backend/data/sci_demo_hub.db

# Projects directory (optional, defaults to ./projects)
# PROJECTS_PATH=/var/www/twbt.top/backend/projects
`;
    }
  },
  {
    name: 'Nginx配置',
    path: 'nginx.conf',
    check: (content) => {
      return content.includes('server_name twbt.top www.twbt.top') &&
             content.includes('proxy_pass http://localhost:3001');
    },
    fix: null
  },
  {
    name: '数据持久化指南',
    path: 'DATA_PERSISTENCE.md',
    check: (content) => {
      return content.includes('backend/data/') &&
             content.includes('backend/projects/');
    },
    fix: null
  }
];

let allPassed = true;

for (const item of checkItems) {
  const fullPath = path.join(__dirname, item.path);
  
  console.log(`\n📋 检查: ${item.name}`);
  console.log(`路径: ${item.path}`);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const passed = item.check(content);
    
    if (passed) {
      console.log('✅ 通过');
    } else {
      console.log('❌ 失败');
      allPassed = false;
      
      if (item.fix) {
        console.log('🔧 正在修复...');
        fs.writeFileSync(fullPath, item.fix());
        console.log('✅ 修复完成');
      }
    }
  } else {
    console.log('❌ 文件不存在');
    allPassed = false;
    
    if (item.fix) {
      console.log('🔧 正在创建...');
      fs.writeFileSync(fullPath, item.fix());
      console.log('✅ 创建完成');
    }
  }
}

console.log('\n📊 检查结果');
console.log('========================================');
if (allPassed) {
  console.log('🎉 所有检查通过！生产环境配置正确。');
} else {
  console.log('⚠️  部分检查失败，已尝试修复。');
}
console.log('========================================');

console.log('\n🚀 部署步骤：');
console.log('1. 执行: chmod +x deploy-production.sh');
console.log('2. 编辑 deploy-production.sh，设置服务器信息');
console.log('3. 执行: ./deploy-production.sh');
console.log('4. 检查服务器上的数据目录是否正确');
console.log('5. 验证上传功能是否正常');

console.log('\n🌐 网站地址: https://twbt.top');
