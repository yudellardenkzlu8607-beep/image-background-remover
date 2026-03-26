# 生产环境部署指南

## 快速部署命令

```bash
# 1. 进入项目目录
cd /path/to/image-background-remover

# 2. 确保 .env.local 文件存在且配置正确
cat .env.local

# 3. 安装依赖
npm install

# 4. 构建生产版本
npm run build

# 5. 启动生产服务器
npm start
```

## 环境变量配置 (.env.local)

```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# NextAuth
NEXTAUTH_URL=https://image-background-remover.space
NEXTAUTH_SECRET=image-background-remover-secret-key-2026

# Database
DATABASE_URL=./data/users.db
```

## 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "image-background-remover" -- start

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

## 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name image-background-remover.space;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排除

### 1. 构建失败
```bash
# 清除缓存
rm -rf .next
npm run build
```

### 2. 数据库权限错误
```bash
mkdir -p data
chmod 755 data
```

### 3. 端口被占用
```bash
# 查找占用 3000 端口的进程
lsof -i :3000
# 或更改端口
PORT=3001 npm start
```

## 监控和日志

```bash
# 查看应用日志
pm2 logs image-background-remover

# 查看实时统计
pm2 monit

# 重启应用
pm2 restart image-background-remover
```
