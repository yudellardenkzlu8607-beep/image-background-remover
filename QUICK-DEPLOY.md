# Cloudflare Pages 简化部署指南

## ✅ 已完成的简化配置

移除了 D1 数据库依赖，直接使用 NextAuth 的默认 session 管理！

---

## 🚀 3步快速部署

### 第 1 步：在 Cloudflare Pages 设置环境变量

访问 https://dash.cloudflare.com

1. 找到您的 Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加以下变量：

```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET=image-background-remover-secret-key-2026
NEXTAUTH_URL=https://image-background-remover.space
```

### 第 2 步：在 Google Cloud Console 配置回调地址

访问 https://console.cloud.google.com/apis/credentials

在您的 OAuth 2.0 客户端 ID 设置中，添加：

**授权 JavaScript 来源：**
```
https://image-background-remover.space
```

**授权重定向 URI：**
```
https://image-background-remover.space/api/auth/callback/google
```

### 第 3 步：Git 部署（最简单）

```bash
cd /root/.openclaw/workspace/project/image-background-remover
git add .
git commit -m "Simplify Google OAuth - remove D1 dependency"
git push
```

Cloudflare Pages 会自动检测并重新部署！

---

## 🎉 部署完成！

访问：https://image-background-remover.space

您会看到 **"使用 Google 登录"** 按钮！

---

## 🔧 故障排除

### 如果部署失败

```bash
# 本地构建测试
npm run build

# 如果成功，再 git push
git add .
git commit -m "Fix build issues"
git push
```

### 如果 Google 登录失败

检查 Google Cloud Console 中的回调地址是否正确！
