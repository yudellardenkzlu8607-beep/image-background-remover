# 🚀 用户体系部署指南

## ✅ 代码已更新

本次更新包含：
- 用户积分系统（注册送3积分）
- 个人中心 `/profile`
- 定价页 `/pricing` 
- FAQ 页 `/faq`
- 升级引导弹窗

---

## 📋 部署前准备

### 你需要

1. **Cloudflare Pages 项目** - 如果还没有，创建一个新的
2. **D1 数据库** - 用于存储用户和积分数据
3. **Google OAuth 已配置** - 回调地址已设置

---

## 🚀 部署步骤

### 第 1 步：创建 D1 数据库

在 Cloudflare Dashboard 中：

1. 访问 https://dash.cloudflare.com
2. 进入 **Workers & Pages**
3. 点击你的项目 → **Storage** → **D1 Databases**
4. 点击 **Create database**
5. 命名为 `image-background-remover-db`

创建完成后，你会看到一个 **Database ID**，记下来。

---

### 第 2 步：初始化数据库表

使用 Wrangler CLI 初始化表：

```bash
# 安装 Wrangler（如果还没安装）
npm install -g wrangler

# 登录 Cloudflare
npx wrangler login

# 执行 schema.sql（把 YOUR_DB_ID 换成实际的数据库ID）
npx wrangler d1 execute image-background-remover-db --database-id=YOUR_DB_ID --file=./schema.sql
```

**或者**在 Cloudflare Dashboard 的 D1 控制台中直接执行以下 SQL：

```sql
-- 用户表
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

-- 用户积分表
CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  bonus_received INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 积分交易记录
CREATE TABLE IF NOT EXISTS credit_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  credits_granted INTEGER DEFAULT 0,
  current_period_start DATETIME,
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 每日使用记录
CREATE TABLE IF NOT EXISTS daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  usage_date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, usage_date)
);

-- 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, usage_date);
```

---

### 第 3 步：配置环境变量

在 Cloudflare Pages 项目设置中，添加以下环境变量：

| 变量名 | 值 |
|-------|-----|
| `NEXTAUTH_URL` | `https://image-background-remover.space` |

添加 Secrets（点击 "Add variable" → "Encrypt"）：

| 变量名 | 值 |
|-------|-----|
| `GOOGLE_CLIENT_ID` | 你的 Google Client ID |
| `GOOGLE_CLIENT_SECRET` | 你的 Google Client Secret |
| `NEXTAUTH_SECRET` | `image-background-remover-secret-key-2026` |
| `DATABASE_ID` | 你的 D1 数据库 ID |

---

### 第 4 步：部署

只需 git push，Cloudflare Pages 会自动构建和部署：

```bash
cd /root/.openclaw/workspace/project/image-background-remover
git push origin main
```

---

### 第 5 步：配置 D1 绑定（wrangler.toml）

在项目根目录创建 `wrangler.toml`：

```toml
name = "image-background-remover"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "image-background-remover-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

然后运行：

```bash
npx wrangler d1 migrations apply image-background-remover-db
```

---

## 🧪 测试

部署完成后：

1. 访问 https://image-background-remover.space
2. 点击右上角 "登录"
3. 使用 Google 账号登录
4. 登录后应该看到积分显示 "3"（注册赠送）
5. 点击 "个人中心" 查看详细信息

---

## 📝 页面清单

| 页面 | 路径 | 说明 |
|-----|------|------|
| 首页 | `/` | 显示积分余额、升级入口 |
| 个人中心 | `/profile` | 用户信息、积分统计、交易记录 |
| 定价 | `/pricing` | 3档套餐介绍 |
| FAQ | `/faq` | 常见问题 |

---

## ⚠️ 已知限制

1. **支付功能未接入** - 定价页的购买按钮是占位符
2. **Sessions 存储** - 当前使用 KV 存储 session，需要 Cloudflare KV

---

## 🆘 遇到问题？

1. **D1 数据库无法连接** - 检查 `DATABASE_ID` 是否正确
2. **Google 登录失败** - 检查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`
3. **积分不显示** - 检查 D1 表是否正确创建

有问题随时告诉我！