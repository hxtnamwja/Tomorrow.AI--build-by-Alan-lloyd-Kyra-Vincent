# Tomorrow.AI 生产环境部署指南

## 🎯 部署目标
部署到 `https://twbt.top` 域名，确保：
- 页面加载速度快
- 上传的程序真正保存
- 数据持久化，不被GitHub代码覆盖

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04+ 或 CentOS 7+
- **Node.js**: 18.0+
- **Nginx**: 1.18+
- **内存**: 2GB+
- **磁盘**: 20GB+

### 2. 域名配置
- 确保 `twbt.top` 域名已解析到服务器IP
- 准备好SSL证书（Let's Encrypt或其他）

## 🚀 部署步骤

### 步骤1: 初始化服务器

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装依赖
apt install -y nginx nodejs npm git

# 3. 创建网站目录
mkdir -p /var/www/twbt.top
chown -R www-data:www-data /var/www/twbt.top
```

### 步骤2: 部署代码

```bash
# 1. 克隆代码
cd /var/www/twbt.top
git clone https://github.com/your-repo/Tomorrow.AI--main .

# 2. 分离数据目录（关键！）
mkdir -p /var/www/twbt.top-data/{data,projects,uploads}

# 3. 创建符号链接
ln -s /var/www/twbt.top-data/data /var/www/twbt.top/backend/data
ln -s /var/www/twbt.top-data/projects /var/www/twbt.top/backend/projects
ln -s /var/www/twbt.top-data/uploads /var/www/twbt.top/backend/uploads

# 4. 安装依赖
cd /var/www/twbt.top
npm install

cd /var/www/twbt.top/backend
npm install
```

### 步骤3: 配置Nginx

```bash
# 1. 复制Nginx配置
cp /var/www/twbt.top/nginx.conf /etc/nginx/sites-available/twbt.top

# 2. 创建符号链接
ln -sf /etc/nginx/sites-available/twbt.top /etc/nginx/sites-enabled/

# 3. 测试配置
nginx -t

# 4. 重启Nginx
systemctl reload nginx
```

### 步骤4: 配置SSL（可选）

```bash
# 使用Let's Encrypt获取SSL证书
apt install -y certbot python3-certbot-nginx
certbot --nginx -d twbt.top -d www.twbt.top
```

### 步骤5: 启动后端服务

```bash
# 1. 安装PM2（进程管理器）
npm install -g pm2

# 2. 启动后端服务
cd /var/www/twbt.top/backend
pm run build
pm start

# 3. 使用PM2管理
pm2 start server.js --name tomorrow-ai-backend
pm2 save
```

### 步骤6: 初始化数据库

```bash
# 1. 运行数据库初始化脚本
cd /var/www/twbt.top/backend
node scripts/initDb.js

# 2. 运行数据库迁移脚本
node scripts/migrateDb.js
```

## 🔧 配置验证

### 检查服务状态

```bash
# 检查Nginx状态
systemctl status nginx

# 检查后端服务状态
pm2 status

# 检查端口
etstat -tuln | grep 3001
```

### 测试API

```bash
# 测试API连接
curl -I https://twbt.top/api/v1/health

# 测试上传功能
curl -X POST https://twbt.top/api/v1/demos/upload-zip \
  -H "Content-Type: multipart/form-data" \
  -F "zipFile=@test.zip" \
  -F "title=Test Demo"
```

## 📁 数据管理

### 数据备份

```bash
# 创建备份脚本
cat > /var/www/twbt.top/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/twbt.top"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /var/www/twbt.top/backend/data/sci_demo_hub.db $BACKUP_DIR/db_$DATE.sqlite

# 备份项目文件
tar -czf $BACKUP_DIR/projects_$DATE.tar.gz /var/www/twbt.top/backend/projects/

# 保留最近30天的备份
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /var/www/twbt.top/backup.sh

# 运行备份
/var/www/twbt.top/backup.sh

# 设置定时备份
crontab -e
# 添加: 0 2 * * * /var/www/twbt.top/backup.sh
```

### 数据恢复

```bash
# 从备份恢复数据库
cp /var/backups/twbt.top/db_20260302_120000.sqlite /var/www/twbt.top/backend/data/sci_demo_hub.db

# 从备份恢复项目文件
tar -xzf /var/backups/twbt.top/projects_20260302_120000.tar.gz -C /
```

## 🌐 性能优化

### 1. Nginx优化
- 已启用Gzip压缩
- 已配置静态资源缓存
- 已配置HTTPS

### 2. 前端优化
- 代码分割和懒加载
- 资源压缩
- Service Worker缓存

### 3. 后端优化
- SQLite数据库优化
- 文件上传处理优化
- API响应优化

## 🚨 常见问题排查

### 1. 上传的程序不显示
- **原因**: 程序状态为 `pending`，需要管理员审核
- **解决**: 在管理员后台审核通过，或直接修改数据库状态为 `published`

### 2. 页面加载缓慢
- **原因**: 资源未缓存，或网络问题
- **解决**: 检查Nginx缓存配置，确保静态资源正确缓存

### 3. 数据丢失
- **原因**: 数据目录未分离，GitHub代码拉取覆盖
- **解决**: 确保使用符号链接分离数据目录

### 4. 500错误
- **原因**: 后端服务崩溃或数据库错误
- **解决**: 检查后端日志 `pm2 logs tomorrow-ai-backend`

## 📞 技术支持

如果遇到问题，请检查：
1. **Nginx日志**: `/var/log/nginx/twbt.top.error.log`
2. **后端日志**: `pm2 logs tomorrow-ai-backend`
3. **前端控制台**: 浏览器开发者工具

## 🌟 部署成功

部署完成后，访问 `https://twbt.top` 即可使用。

- ✅ 页面加载速度快
- ✅ 上传的程序真正保存
- ✅ 数据持久化，不被GitHub代码覆盖
- ✅ 所有功能正常运行
