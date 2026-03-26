# Vercel 部署指南

## 快速部署步骤

### 1. 准备工作

确保您已安装 Vercel CLI：
```bash
npm i -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 进入项目目录

```bash
cd /root/.openclaw/workspace/project/image-background-remover
```

### 4. 更新环境变量

确保 `.env.local` 中的 `NEXTAUTH_URL` 已设置为生产域名：

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
NEXTAUTH_URL=https://image-background-remover.space
NEXTAUTH_SECRET=image-background-remover-secret-key-2026
```

### 5. 部署到 Vercel

```bash
# 首次部署
vercel

# 部署到生产环境
vercel --prod
```

### 6. 在 Vercel Dashboard 中设置环境变量

部署后，登录 Vercel Dashboard，找到您的项目，进入 Settings -> Environment Variables，添加以下变量：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### 7. 更新 Google Cloud Console 配置

在 Google Cloud Console 中添加 Vercel 的回调地址：

```
https://image-background-remover.space/api/auth/callback/google
```

### 8. 重新部署

修改环境变量后，重新部署：

```bash
vercel --prod
```

## 故障排除

### 1. 构建失败

检查构建日志：
```bash
vercel --prod --debug
```

### 2. 环境变量未生效

确保在 Vercel Dashboard 中正确设置了环境变量，并重新部署。

### 3. Google OAuth 回调错误

确保在 Google Cloud Console 中添加了正确的回调地址。

### 4. 数据库错误

SQLite 数据库在 Vercel 上可能需要特殊配置。考虑使用 Vercel Postgres 或其他数据库服务。

## 联系支持

如有问题，请联系 Vercel 支持或查看 Vercel 文档：https://vercel.com/docs
