# 简化部署指南 - 无需 D1

## ✅ 已完成配置

✅ NextAuth 已配置
✅ Google Provider 已设置
✅ 环境变量已准备
✅ 不需要 D1 数据库！

---

## 🚀 3步快速部署（2分钟搞定）

### 第 1 步：在 Cloudflare Pages 设置环境变量

1. 访问：https://dash.cloudflare.com
2. 找到您的 Pages 项目
3. 点击 **Settings** → **Environment variables**
4. 添加以下变量：

**Environment variables**：
```
NEXTAUTH_URL=https://image-background-remover.space
```

**Secrets**（敏感信息）：
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET=image-background-remover-secret-key-2026
```

---

### 第 2 步：在 Google Cloud Console 配置回调地址

1. 访问：https://console.cloud.google.com/apis/credentials
2. 找到您的 OAuth 2.0 客户端 ID
3. 添加：

**授权 JavaScript 来源：**
```
https://image-background-remover.space
```

**授权重定向 URI：**
```
https://image-background-remover.space/api/auth/callback/google
```

---

### 第 3 步：Git 部署（最简单）

```bash
cd /root/.openclaw/workspace/project/image-background-remover
git add .
git commit -m "Add Google OAuth - simplified, no D1"
git push
```

Cloudflare Pages 会自动检测并重新部署！

---

## 🎉 部署完成！

访问：https://image-background-remover.space

您会看到 **"使用 Google 登录"** 按钮！

---

## 🔧 故障排除

### 如果构建失败

```bash
# 本地构建测试
npm run build

# 如果成功，再 git push
git add .
git commit -m "Fix build issues"
git push
```

### 如果 Google 登录失败

检查：
1. Google Cloud Console 中的回调地址是否正确
2. Cloudflare Pages 中的环境变量是否正确

---

**部署时间**: 2026-03-26
**项目**: image-background-remover.space
**状态**: ✅ 配置完成，简化版 - 无需 D1！
