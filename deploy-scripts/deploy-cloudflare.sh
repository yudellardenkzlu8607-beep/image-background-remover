#!/bin/bash

# Cloudflare Pages 部署脚本

set -e

echo "🚀 开始部署到 Cloudflare Pages..."

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 wrangler 是否安装
if ! command -v wrangler &> /dev/null; then
    echo "📦 安装 wrangler..."
    npm install -g wrangler
fi

# 登录 Cloudflare（如果需要）
echo "🔑 检查 Cloudflare 登录状态..."
npx wrangler whoami || {
    echo "📝 请先登录 Cloudflare"
    npx wrangler login
}

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建输出
if [ ! -d ".vercel/output/static" ] && [ ! -d ".next" ]; then
    echo "❌ 构建失败，未找到输出目录"
    exit 1
fi

# 部署到 Cloudflare Pages
echo "🚀 部署到 Cloudflare Pages..."

# 使用 wrangler pages deploy
if [ -d ".vercel/output/static" ]; then
    npx wrangler pages deploy .vercel/output/static --project-name=image-background-remover
elif [ -d "dist" ]; then
    npx wrangler pages deploy dist --project-name=image-background-remover
else
    echo "❌ 未找到静态文件目录"
    exit 1
fi

echo "✅ 部署完成！"
echo ""
echo "🌐 您的网站地址: https://image-background-remover.space"
echo ""
echo "⚠️  部署后请检查:"
echo "   1. Google Cloud Console 中的回调地址配置"
echo "   2. Cloudflare Pages 的环境变量设置"
echo "   3. D1 数据库连接是否正常"
