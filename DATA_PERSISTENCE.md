# Tomorrow.AI 数据持久化指南

## 📁 数据存储位置

### 1. 数据库文件
- **位置**: `backend/data/sci_demo_hub.db`
- **说明**: SQLite数据库，存储所有用户、演示程序、社区等数据
- **备份**: 定期备份此文件

### 2. 上传的项目文件
- **位置**: `backend/projects/`
- **说明**: 多文件演示程序的解压文件
- **结构**: `projects/{demo-id}/...`

### 3. 临时上传文件
- **位置**: `backend/uploads/`
- **说明**: 上传过程中的临时文件

## 🔄 GitHub代码更新时的数据保护

### 宝塔面板部署建议

1. **数据目录排除在Git版本控制外**
   ```bash
   # 在 .gitignore 中添加
   backend/data/
   backend/projects/
   backend/uploads/
   ```

2. **使用符号链接分离数据和代码**
   ```bash
   # 在服务器上执行
   mkdir -p /var/www/twbt.top-data
   mv /var/www/twbt.top/backend/data /var/www/twbt.top-data/
   mv /var/www/twbt.top/backend/projects /var/www/twbt.top-data/
   
   # 创建符号链接
   ln -s /var/www/twbt.top-data/data /var/www/twbt.top/backend/data
   ln -s /var/www/twbt.top-data/projects /var/www/twbt.top/backend/projects
   ```

3. **自动备份脚本**
   ```bash
   #!/bin/bash
   # backup.sh
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
   ```

## 🚀 部署流程（数据安全版）

### 首次部署
```bash
# 1. 克隆代码
git clone https://github.com/your-repo/Tomorrow.AI--main.git /var/www/twbt.top

# 2. 创建数据目录
mkdir -p /var/www/twbt.top-data/{data,projects,uploads}

# 3. 创建符号链接
ln -s /var/www/twbt.top-data/data /var/www/twbt.top/backend/data
ln -s /var/www/twbt.top-data/projects /var/www/twbt.top/backend/projects
ln -s /var/www/twbt.top-data/uploads /var/www/twbt.top/backend/uploads

# 4. 安装依赖并启动
cd /var/www/twbt.top/backend && npm install
npm start
```

### 后续更新（不丢失数据）
```bash
# 1. 备份数据（可选但推荐）
./backup.sh

# 2. 拉取最新代码
cd /var/www/twbt.top
git pull

# 3. 重新安装依赖（如果有变化）
cd backend && npm install

# 4. 重启服务
pm2 restart tomorrow-ai-backend
```

## ⚠️ 重要提醒

1. **永远不要**将 `backend/data/` 和 `backend/projects/` 提交到Git
2. **定期备份**数据库和项目文件
3. **使用符号链接**将数据目录分离到代码目录外
4. **更新代码前**先备份数据

## 🔧 数据恢复

如果数据意外丢失：
```bash
# 从备份恢复数据库
cp /var/backups/twbt.top/db_20260302_120000.sqlite /var/www/twbt.top/backend/data/sci_demo_hub.db

# 从备份恢复项目文件
tar -xzf /var/backups/twbt.top/projects_20260302_120000.tar.gz -C /
```
