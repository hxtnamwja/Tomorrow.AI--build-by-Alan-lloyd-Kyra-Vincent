# Tomorrow.AI 生产环境部署检查清单

## ✅ 多文件程序加载检查项

### 前端配置
- [ ] `.env.production` 中 `VITE_API_URL=https://twbt.top/api/v1`
- [ ] `DemoPlayer.tsx` 中预览URL构建逻辑正确
- [ ] 构建后检查 `dist` 目录存在且包含所有资源

### 后端配置
- [ ] `.env.production` 中 `BASE_URL=https://twbt.top`
- [ ] `projects` 目录存在且有正确的文件权限
- [ ] 静态文件服务 `/projects` 路由正常工作

### Nginx配置
- [ ] 已配置 `/projects` 路径的反向代理
- [ ] 已启用Gzip压缩
- [ ] 已配置静态资源缓存

## ✅ 多文件程序上传检查项

### 前端
- [ ] `UploadWizard.tsx` 中API路径正确
- [ ] ZIP文件可以正常创建和上传
- [ ] 上传进度显示正常

### 后端
- [ ] `uploads` 目录存在且有写入权限
- [ ] `projects` 目录存在且有写入权限
- [ ] ZIP解压功能正常工作
- [ ] 项目结构分析功能正常

## ✅ 资源加载优化检查项

### 构建优化
- [ ] Vite配置启用了代码分割
- [ ] 资源文件有hash值（用于缓存）
- [ ] JS/CSS文件被压缩
- [ ] console.log被移除

### Nginx优化
- [ ] Gzip压缩已启用
- [ ] 静态资源缓存头已配置
- [ ] 图片/字体文件缓存1年
- [ ] HTML文件不缓存

### Service Worker
- [ ] `sw.js` 文件在 `public` 目录
- [ ] 生产环境自动注册
- [ ] 缓存策略正常工作

## 🔧 部署步骤

1. **准备环境**
   ```bash
   # 在服务器上创建目录
   sudo mkdir -p /var/www/twbt.top
   sudo chown -R $USER:$USER /var/www/twbt.top
   ```

2. **构建项目**
   ```bash
   # 在本地执行
   ./deploy.sh
   ```

3. **上传文件**
   ```bash
   # 上传前端构建文件
   scp -r dist/* user@server:/var/www/twbt.top/dist/
   
   # 上传后端文件
   scp -r backend/* user@server:/var/www/twbt.top/backend/
   ```

4. **配置Nginx**
   ```bash
   # 在服务器上执行
   sudo cp nginx.conf /etc/nginx/sites-available/twbt.top
   sudo ln -s /etc/nginx/sites-available/twbt.top /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **启动后端**
   ```bash
   cd /var/www/twbt.top/backend
   npm install
   npm start
   ```

## 🧪 测试清单

### 多文件程序测试
1. 上传一个多文件ZIP项目
2. 打开多文件演示程序
3. 检查资源加载是否正常（图片、CSS、JS）
4. 检查TomorrowAI脚本是否注入

### AI小助手测试
1. 打开AI小助手对话框
2. 发送消息测试响应
3. 检查长文本是否溢出
4. 检查代码块显示是否正常

### 性能测试
1. 首次加载速度
2. 二次加载（缓存）速度
3. 图片加载速度
4. API响应速度

## 🚨 常见问题排查

### 多文件程序无法加载
- 检查 `projects` 目录权限
- 检查 `BASE_URL` 配置
- 检查Nginx `/projects` 路径配置

### 上传失败
- 检查 `uploads` 目录权限
- 检查文件大小限制
- 检查磁盘空间

### 资源加载慢
- 检查Nginx Gzip配置
- 检查缓存头配置
- 检查Service Worker是否注册

## 📞 联系方式

如有问题，请检查：
1. 后端日志：`/var/log/nginx/twbt.top.error.log`
2. 前端控制台错误
3. 网络请求状态
