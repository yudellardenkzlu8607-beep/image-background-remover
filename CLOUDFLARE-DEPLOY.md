# Cloudflare Pages + D1 部署指南

## 已完成配置

✅ D1 数据库配置  
✅ NextAuth 适配 Cloudflare Workers  
✅ 用户数据存储到 D1  

## 部署步骤

### 1. 创建 D1 数据库

```bash
cd /root/.openclaw/workspace/project/image-background-remover
npx wrangler d1 create image-background-remover-db
```

创建成功后，会输出 `database_id`，复制它。

### 2. 更新 wrangler.toml

将创建的 `database_id` 填入 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "image-background-remover-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. 初始化数据库表

```bash
npx wrangler d1 execute image-background-remover-db --file=./schema.sql
```

或者直接在 Cloudflare Dashboard 中执行 SQL：

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

### 4. 设置 Secrets

在 Cloudflare Dashboard 中设置以下 Secrets：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`

或者使用 wrangler CLI：

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put NEXTAUTH_SECRET
```

### 5. 部署到 Cloudflare Pages

```bash
# 构建项目
npm run build

# 部署（如果使用 wrangler pages）
npx wrangler pages deploy .vercel/output/static --project-name=image-background-remover

# 或者使用 Cloudflare Pages Git 集成
# 直接 push 到 GitHub，Cloudflare Pages 会自动构建部署
```

## 重要注意事项

### 1. 数据库绑定

确保 `wrangler.toml` 中的 `binding` 名称与代码中使用的名称一致：

```toml
[[d1_databases]]
binding = "DB"  # 这个名称要在代码中使用
```

### 2. 环境变量与 Secrets

- 非敏感的变量放在 `wrangler.toml` 的 `[vars]` 部分
- 敏感信息（Client Secret 等）必须使用 `wrangler secret put` 设置

### 3. NextAuth 适配

代码已修改为适配 Cloudflare Workers：
- 使用 D1 数据库存储用户
- 使用 JWT session 策略
- 从 `globalThis.env` 获取 D1 实例

### 4. 本地开发

本地开发时需要使用 SQLite：
```bash
# 本地使用 SQLite
DATABASE_URL=./data/users.db npm run dev

# 部署到 Cloudflare 时自动使用 D1
```

## 故障排除

### 1. "Cannot find module 'sqlite'"

代码已修改为在 Cloudflare 环境中使用 D1，本地开发时使用 SQLite。确保安装了正确的依赖：

```bash
npm install
```

### 2. "D1 database not found"

确保已创建 D1 数据库并在 `wrangler.toml` 中正确配置了 `database_id`。

### 3. "Secrets not found"

确保使用 `wrangler secret put` 设置了所有必需的 Secrets。

### 4. 构建失败

```bash
# 清除缓存
rm -rf .next
rm -rf node_modules/.cache

# 重新安装依赖
npm install

# 重新构建
npm run build
```

## 参考文档

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [NextAuth.js 文档](https://next-auth.js.org/)
