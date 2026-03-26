#!/bin/bash

# Cloudflare D1 数据库设置脚本

set -e

echo "🚀 开始设置 Cloudflare D1 数据库..."

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler 未安装，请先安装: npm install -g wrangler"
    exit 1
fi

# 创建 D1 数据库
echo "📦 创建 D1 数据库..."
DB_OUTPUT=$(npx wrangler d1 create image-background-remover-db 2>&1 || true)

# 提取 database_id
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || true)

if [ -z "$DB_ID" ]; then
    echo "⚠️  数据库可能已存在，尝试获取 ID..."
    DB_LIST=$(npx wrangler d1 list 2>&1)
    DB_ID=$(echo "$DB_LIST" | grep -A 1 "image-background-remover-db" | grep -oP '\|\s+\K[a-f0-9-]+' || true)
fi

if [ -n "$DB_ID" ]; then
    echo "✅ 数据库 ID: $DB_ID"
    
    # 更新 wrangler.toml
    echo "📝 更新 wrangler.toml..."
    sed -i "s/# database_id = \"创建后在这里填入数据库ID\"/database_id = \"$DB_ID\"/" wrangler.toml
    
    echo "✅ wrangler.toml 已更新"
else
    echo "❌ 无法获取数据库 ID，请手动创建并更新 wrangler.toml"
    exit 1
fi

# 初始化数据库表
echo "📊 初始化数据库表..."
npx wrangler d1 execute image-background-remover-db --file=./schema.sql || {
    echo "❌ 数据库表初始化失败"
    exit 1
}

echo "✅ D1 数据库设置完成！"
echo ""
echo "下一步：设置 Secrets"
echo "  npx wrangler secret put GOOGLE_CLIENT_ID"
echo "  npx wrangler secret put GOOGLE_CLIENT_SECRET"
echo "  npx wrangler secret put NEXTAUTH_SECRET"
