#!/bin/bash
# Cloudflare 完整部署脚本

set -e

echo "🚀 开始部署 image-background-remover..."

# 检查 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 wrangler..."
    npm install -g wrangler
fi

# 登录（如果需要）
echo "🔑 检查 Cloudflare 登录..."
if ! npx wrangler whoami &> /dev/null; then
    echo "📝 请在浏览器中完成登录..."
    npx wrangler login
fi

# 创建 D1 数据库
echo "📦 创建 D1 数据库..."
DB_OUTPUT=$(npx wrangler d1 create image-background-remover-db 2>&1 || true)
echo "$DB_OUTPUT"

# 提取 database_id
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || true)

if [ -z "$DB_ID" ]; then
    echo "⚠️  尝试查找现有数据库..."
    DB_LIST=$(npx wrangler d1 list 2>&1 || true)
    echo "$DB_LIST"
    DB_ID=$(echo "$DB_LIST" | grep -A 1 "image-background-remover-db" | grep -oP '\|\s+\K[a-f0-9-]+' || true)
fi

if [ -n "$DB_ID" ]; then
    echo "✅ 数据库 ID: $DB_ID"
    
    # 更新 wrangler.toml
    echo "📝 更新 wrangler.toml..."
    cat > wrangler.toml << EOF
name = "image-background-remover"
compatibility_date = "2024-12-01"

[build]
command = "npm install --prefer-offline && npm run build"

# D1 数据库配置
[[d1_databases]]
binding = "DB"
database_name = "image-background-remover-db"
database_id = "$DB_ID"

# 环境变量
[vars]
NEXTAUTH_URL = "https://image-background-remover.space"
EOF
    
    echo "✅ wrangler.toml 已更新"
else
    echo "❌ 无法获取数据库 ID，请手动创建并更新 wrangler.toml"
    exit 1
fi

# 初始化数据库表
echo "📊 初始化数据库表..."
cat > schema.sql << EOF
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
EOF

npx wrangler d1 execute image-background-remover-db --file=./schema.sql || {
    echo "⚠️  数据库表初始化可能已存在，继续部署..."
}

# 设置 Secrets
echo "🔐 设置 Secrets..."
echo -n "YOUR_GOOGLE_CLIENT_ID" | npx wrangler secret put GOOGLE_CLIENT_ID
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | npx wrangler secret put GOOGLE_CLIENT_SECRET
echo -n "image-background-remover-secret-key-2026" | npx wrangler secret put NEXTAUTH_SECRET

# 构建项目
echo "🔨 构建项目..."
npm run build

echo "✅ 部署准备完成！"
echo ""
echo "📋 下一步："
echo "  1. 在 Google Cloud Console 中添加回调地址"
echo "  2. Git push 部署到 Cloudflare Pages"
echo "     git add ."
echo "     git commit -m 'Complete D1 setup'"
echo "     git push"
echo ""
echo "🌐 访问: https://image-background-remover.space"
