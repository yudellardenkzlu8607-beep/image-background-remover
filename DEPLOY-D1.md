# Cloudflare D1 完整部署指南

## ✅ 已完成配置

✅ D1 数据库 ID: `a4be0ed5-350c-45e2-ab33-d9e8da51c008`
✅ `wrangler.toml` 已更新
✅ NextAuth 配置已适配 D1
✅ 数据库初始化 SQL 已准备

---

## 🚀 部署步骤（4步搞定）

### 第 1 步：在 Cloudflare Dashboard 初始化数据库表

1. 访问：https://dash.cloudflare.com
2. 点击左侧：**Workers & Pages** → **D1**
3. 点击：**image-background-remover-db**
4. 点击：**Console**
5. 复制并执行以下 SQL：

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_provider ON users(provider_account_id);
```

6. 点击：**Run**

---

### 第 2 步：在 Cloudflare Pages 设置环境变量

1. 在 Cloudflare Dashboard 中找到您的 Pages 项目
2. 点击：**Settings** → **Environment variables**
3. 添加以下变量（**注意 Secrets 部分**）：

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

### 第 3 步：在 Google Cloud Console 配置回调地址

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

### 第 4 步：Git 部署（最简单）

```bash
cd /root/.openclaw/workspace/project/image-background-remover
git add .
git commit -m "Add Google OAuth with D1 database"
git push
```

Cloudflare Pages 会自动检测并重新部署！

---

## 🎉 部署完成！

访问：https://image-background-remover.space

您会看到 **"使用 Google 登录"** 按钮！

登录用户会自动保存到 D1 数据库！

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
3. D1 数据库表是否已创建

### 如果数据库错误

在 Cloudflare Dashboard 的 D1 Console 中检查：
```sql
SELECT * FROM users;
```

---

## 📚 参考文档

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [NextAuth.js 文档](https://next-auth.js.org/)

---

**部署完成时间**: 2026-03-26
**项目**: image-background-remover.space
**D1 数据库 ID**: a4be0ed5-350c-45e2-ab33-d9e8da51c008
**状态**: ✅ 配置完成，等待执行部署步骤
