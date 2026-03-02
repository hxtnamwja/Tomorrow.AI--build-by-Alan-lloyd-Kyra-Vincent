#!/usr/bin/env node
// 测试多文件程序加载功能

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const testConfig = {
  baseUrl: 'http://localhost:5173', // 本地开发环境
  demoId: 'demo-1770996677838', // 示例demo ID
  entryFile: 'index.html' // 示例入口文件
};

console.log('🧪 测试多文件程序加载...');
console.log('测试配置:', testConfig);

// 测试1: 检查预览URL构建
function testPreviewUrl() {
  console.log('\n📋 测试1: 预览URL构建');
  
  // 模拟前端构建逻辑
  const apiBase = process.env.VITE_API_URL || '/api/v1';
  let baseUrl;
  if (apiBase.startsWith('http')) {
    baseUrl = apiBase.replace(/\/api\/v1$/, '');
  } else {
    baseUrl = apiBase.replace('/api/v1', '');
  }
  
  const previewUrl = `${baseUrl}/projects/${testConfig.demoId}/${testConfig.entryFile}`;
  console.log('构建的预览URL:', previewUrl);
  
  if (previewUrl.includes('/projects/')) {
    console.log('✅ 预览URL构建正确');
  } else {
    console.log('❌ 预览URL构建错误');
  }
  
  return previewUrl;
}

// 测试2: 检查后端静态文件服务
function testBackendStatic() {
  console.log('\n📋 测试2: 后端静态文件服务');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/projects/${testConfig.demoId}/${testConfig.entryFile}`,
    method: 'GET'
  };
  
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('✅ 后端静态文件服务响应成功');
      } else {
        console.log('❌ 后端静态文件服务响应失败');
      }
      
      res.on('data', (chunk) => {
        const content = chunk.toString();
        if (content.includes('TomorrowAI')) {
          console.log('✅ 成功注入TomorrowAI脚本');
        } else {
          console.log('❌ 未注入TomorrowAI脚本');
        }
      });
      
      res.on('end', () => {
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (e) => {
      console.error(`请求错误: ${e.message}`);
      resolve(false);
    });
    
    req.end();
  });
}

// 测试3: 检查项目目录结构
function testProjectStructure() {
  console.log('\n📋 测试3: 项目目录结构');
  
  const projectsDir = path.join(__dirname, 'backend', 'projects');
  const demoDir = path.join(projectsDir, testConfig.demoId);
  
  if (fs.existsSync(demoDir)) {
    console.log(`✅ 项目目录存在: ${demoDir}`);
    
    const entryFile = path.join(demoDir, testConfig.entryFile);
    if (fs.existsSync(entryFile)) {
      console.log(`✅ 入口文件存在: ${entryFile}`);
      return true;
    } else {
      console.log(`❌ 入口文件不存在: ${entryFile}`);
      return false;
    }
  } else {
    console.log(`❌ 项目目录不存在: ${demoDir}`);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始测试多文件程序加载功能\n');
  
  // 测试1: 预览URL构建
  const previewUrl = testPreviewUrl();
  
  // 测试2: 项目目录结构
  const structureOk = testProjectStructure();
  
  // 测试3: 后端静态文件服务
  const backendOk = await testBackendStatic();
  
  console.log('\n📊 测试结果');
  console.log('========================================');
  console.log(`预览URL: ${previewUrl}`);
  console.log(`项目结构: ${structureOk ? '✅ 正常' : '❌ 错误'}`);
  console.log(`后端服务: ${backendOk ? '✅ 正常' : '❌ 错误'}`);
  console.log('========================================');
  
  if (structureOk && backendOk) {
    console.log('\n🎉 所有测试通过！多文件程序应该可以正常加载。');
  } else {
    console.log('\n⚠️  测试失败，需要检查配置。');
  }
}

// 运行测试
runTests();
