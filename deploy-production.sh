#!/bin/bash
# 生产环境部署脚本

set -e

echo "🔧 开始部署 Tomorrow.AI 到 twbt.top..."
echo "========================================"

# 服务器信息
SERVER="root@twbt.top"
SERVER_DIR="/var/www/twbt.top"
DATA_DIR="/var/www/twbt.top-data"

# 本地目录
LOCAL_DIR=$(pwd)

# 检查本地环境
echo "📁 检查本地环境..."
if [ ! -f ".env.production" ]; then
  echo "❌ 缺少 .env.production 文件"
  exit 1
fi

if [ ! -f "backend/.env.production" ]; then
  echo "❌ 缺少 backend/.env.production 文件"
  exit 1
fi

echo "✅ 本地环境检查通过"

# 连接服务器
echo "\n🌐 连接服务器..."
ssh $SERVER "mkdir -p $SERVER_DIR $DATA_DIR/{data,projects,uploads}"

echo "✅ 服务器目录创建成功"

# 上传代码
echo "\n📤 上传代码..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='data' --exclude='projects' --exclude='uploads' $LOCAL_DIR/ $SERVER:$SERVER_DIR/

echo "✅ 代码上传成功"

# 配置数据目录
echo "\n🔗 配置数据目录..."
ssh $SERVER "cd $SERVER_DIR && \n\
  # 创建符号链接\n\
  if [ ! -L 'backend/data' ]; then\n\
    ln -sf $DATA_DIR/data backend/data\n\
  fi\n\
  if [ ! -L 'backend/projects' ]; then\n\
    ln -sf $DATA_DIR/projects backend/projects\n\
  fi\n\
  if [ ! -L 'backend/uploads' ]; then\n\
    ln -sf $DATA_DIR/uploads backend/uploads\n\
  fi\n\
  # 设置权限\n\
  chown -R www-data:www-data $SERVER_DIR\n\
  chown -R www-data:www-data $DATA_DIR\n\
  chmod -R 755 $SERVER_DIR\n\
  chmod -R 775 $DATA_DIR\n"

echo "✅ 数据目录配置成功"

# 安装依赖
echo "\n📦 安装依赖..."
ssh $SERVER "cd $SERVER_DIR && npm install --production"
ssh $SERVER "cd $SERVER_DIR/backend && npm install --production"

echo "✅ 依赖安装成功"

# 构建前端
echo "\n🏗️ 构建前端..."
ssh $SERVER "cd $SERVER_DIR && npm run build"

echo "✅ 前端构建成功"

# 配置Nginx
echo "\n🌐 配置Nginx..."
ssh $SERVER "cp $SERVER_DIR/nginx.conf /etc/nginx/sites-available/twbt.top && \
  ln -sf /etc/nginx/sites-available/twbt.top /etc/nginx/sites-enabled/ && \
  nginx -t && \
  systemctl reload nginx"

echo "✅ Nginx配置成功"

# 启动后端服务
echo "\n🚀 启动后端服务..."
ssh $SERVER "cd $SERVER_DIR/backend && \
  if command -v pm2 &> /dev/null; then\n\
    pm2 stop tomorrow-ai-backend || true\n\
    pm2 start server.js --name tomorrow-ai-backend\n\
    pm2 save\n\
  else\n\
    npm install -g pm2\n\
    pm2 start server.js --name tomorrow-ai-backend\n\
    pm2 save\n\
  fi"

echo "✅ 后端服务启动成功"

# 初始化数据库
echo "\n🗃️ 初始化数据库..."
ssh $SERVER "cd $SERVER_DIR/backend && \
  node scripts/initDb.js && \
  node scripts/migrateDb.js"

echo "✅ 数据库初始化成功"

# 检查服务状态
echo "\n🔍 检查服务状态..."
ssh $SERVER "pm2 status"
ssh $SERVER "systemctl status nginx"

echo "\n========================================"
echo "🎉 部署完成！"
echo "🌐 网站地址: https://twbt.top"
echo "========================================"

# 测试API连接
echo "\n🧪 测试API连接..."
curl -I https://twbt.top/api/v1/health

echo "\n📋 部署完成！请访问 https://twbt.top 查看网站"
