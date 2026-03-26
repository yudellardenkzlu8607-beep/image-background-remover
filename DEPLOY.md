# Image Background Remover - 部署指南

## 已完成的配置

### 1. Google OAuth 集成
- ✅ NextAuth.js 配置完成
- ✅ Google Provider 已设置
- ✅ 登录/登出功能实现
- ✅ 用户信息数据库存储

### 2. 数据库
- ✅ SQLite 数据库初始化
- ✅ 用户表创建
- ✅ 自动保存登录用户信息

### 3. 环境变量
已配置 `.env.local`：
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=image-background-remover-secret-key-2026
```

## 部署步骤

### 1. 本地测试
```bash
npm run dev
```
访问 http://localhost:3000

### 2. 生产构建
```bash
npm run build
```

### 3. 部署到 Vercel
```bash
vercel --prod
```

## 注意事项

1. **Google OAuth 回调地址**: 确保在 Google Cloud Console 中添加了回调地址：
   - 开发环境: `http://localhost:3000/api/auth/callback/google`
   - 生产环境: `https://your-domain.com/api/auth/callback/google`

2. **数据库**: SQLite 文件位于 `./data/users.db`，部署时请确保该目录可写

3. **环境变量**: 生产环境请更新 `NEXTAUTH_URL` 为实际域名

## 用户数据

登录用户会自动保存到数据库，包含以下信息：
- Google ID
- 邮箱
- 姓名
- 头像URL
- 登录时间
- 注册时间

## 技术支持

如有问题，请检查：
1. `.env.local` 文件是否正确配置
2. Google Cloud Console 中的 OAuth 凭据是否正确
3. 回调地址是否已添加到 Google OAuth 配置
