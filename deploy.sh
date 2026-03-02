#!/bin/bash
# Tomorrow.AI 部署脚本
# 用于部署到生产环境

echo "🚀 开始部署 Tomorrow.AI..."

# 1. 安装依赖
echo "📦 安装前端依赖..."
npm install

echo "📦 安装后端依赖..."
cd backend
npm install
cd ..

# 2. 构建前端（使用生产环境配置）
echo "🏗️ 构建前端..."
cp .env.production .env.local
npm run build

# 3. 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败，dist目录不存在"
    exit 1
fi

echo "✅ 前端构建成功"

# 4. 复制生产环境配置到后端
echo "⚙️ 配置后端环境..."
cp backend/.env.production backend/.env

# 5. 确保目录存在
echo "📁 确保项目目录存在..."
mkdir -p backend/projects
mkdir -p backend/uploads

# 6. 显示部署信息
echo ""
echo "✅ 部署准备完成！"
echo ""
echo "📋 部署清单："
echo "  - 前端构建目录: ./dist"
echo "  - 后端目录: ./backend"
echo "  - 项目目录: ./backend/projects"
echo ""
echo "📝 下一步操作："
echo "  1. 将 dist/* 复制到服务器 /var/www/twbt.top/dist/"
echo "  2. 将 backend/* 复制到服务器 /var/www/twbt.top/backend/"
echo "  3. 在服务器上安装依赖: cd /var/www/twbt.top/backend && npm install"
echo "  4. 复制 nginx.conf 到 /etc/nginx/sites-available/twbt.top"
echo "  5. 重启 Nginx: sudo systemctl reload nginx"
echo "  6. 启动后端服务: cd /var/www/twbt.top/backend && npm start"
echo ""
echo "🌐 网站地址: https://twbt.top"
