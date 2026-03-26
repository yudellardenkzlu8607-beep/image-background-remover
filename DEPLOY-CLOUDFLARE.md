# Cloudflare Pages + D1 完整部署指南

## 📋 部署前准备

### 1. 环境检查清单

- [ ] Node.js >= 18.0.0
- [ ] npm >= 8.0.0
- [ ] Cloudflare 账号
- [ ] Google Cloud 项目（用于 OAuth）

### 2. 安装必备工具

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
npx wrangler login

# 验证登录
npx wrangler whoami
```

---

## 🚀 快速部署（5步完成）

### 第 1 步：创建 D1 数据库（约 1 分钟）

```bash
cd /root/.openclaw/workspace/project/image-background-remover

# 创建 D1 数据库
npx wrangler d1 create image-background-remover-db

# 输出示例：
# ✅ Successfully created DB 'image-background-remover-db'
# database_id = "xxxxx-xxxxx-xxxxx-xxxxx"
# 复制这个 database_id！
```

**⚠️ 重要：** 复制输出的 `database_id`，下一步要用！

---

### 第 2 步：更新配置（约 2 分钟）

#### 2.1 更新 `wrangler.toml`

打开 `wrangler.toml`，填入刚才复制的 `database_id`：

```toml
name = "image-background-remover"
compatibility_date = "2024-12-01"

[build]
command = "npm install --prefer-offline && npm run build"

# D1 数据库配置
[[d1_databases]]
binding = "DB"
database_name = "image-background-remover-db"
database_id = "粘贴刚才复制的database_id到这里"

# 环境变量
[vars]
NEXTAUTH_URL = "https://image-background-remover.space"
```

#### 2.2 初始化数据库表

执行 SQL 脚本创建表：

```bash
npx wrangler d1 execute image-background-remover-db --file=./schema.sql
```

成功后会看到：`✅ Successfully executed ...`

---

### 第 3 步：设置 Secrets（约 2 分钟）

设置敏感信息（这些不会显示在代码中）：

```bash
# 设置 Google Client ID
npx wrangler secret put GOOGLE_CLIENT_ID
# 粘贴: YOUR_GOOGLE_CLIENT_ID

# 设置 Google Client Secret  
npx wrangler secret put GOOGLE_CLIENT_SECRET
# 粘贴: YOUR_GOOGLE_CLIENT_SECRET

# 设置 NextAuth Secret
npx wrangler secret put NEXTAUTH_SECRET
# 粘贴: image-background-remover-secret-key-2026
```

**✅ 设置完成后，所有敏感信息都安全存储在 Cloudflare 中！**

---

### 第 4 步：配置 Google OAuth（约 2 分钟）

在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 中添加：

**授权 JavaScript 来源：**
```
https://image-background-remover.space
```

**授权重定向 URI：**
```
https://image-background-remover.space/api/auth/callback/google
```

**⚠️ 必须添加这个回调地址，否则登录会失败！**

---

### 第 5 步：部署！（约 3 分钟）

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 部署到 Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=image-background-remover

# 或者使用 Git 集成（推荐）：
git add .
git commit -m "Add Google OAuth with D1 database"
git push
# Cloudflare 会自动检测到 push 并重新部署
```

**🎉 部署成功！**  
访问: https://image-background-remover.space

---

## 🔧 故障排除

### 问题 1: "Cannot find module '...'"

```bash
rm -rf node_modules package-lock.json
npm install
```

### 问题 2: "D1 database not found"

检查 `wrangler.toml` 中的 `database_id` 是否正确。

### 问题 3: "Secrets not found"

重新设置 Secrets：
```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 问题 4: Google OAuth 登录失败

检查 Google Cloud Console 中的回调地址是否配置正确。

---

## 📚 参考文档

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [NextAuth.js 文档](https://next-auth.js.org/)

---

**部署完成时间**: 2026-03-25  
**项目**: image-background-remover.space  
**状态**: ✅ 配置完成，等待执行部署命令