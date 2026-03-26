# Google OAuth 设置指南

## 已收到的信息

### Google OAuth 凭据
- **Client ID**: `YOUR_GOOGLE_CLIENT_ID`
- **Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET`

### 已配置的授权域名
- Authorized JavaScript origins: 已填好
- Authorized redirect URIs: 已填好

### SSH 公钥（等待私钥）
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDAMGUUrBtdb13wMAjkhNOyGntMKOuzx6bzb6ajUqR6x openclaw
```

**注意**: 收到的是公钥，需要私钥才能 SSH 登录。

## 待办事项

1. [ ] 获取 SSH 私钥
2. [ ] 安装依赖 (next-auth, sqlite3 等)
3. [ ] 配置 NextAuth.js
4. [ ] 创建 SQLite 数据库和用户表
5. [ ] 添加登录按钮到前端
6. [ ] 测试登录流程

## 技术方案

### 方案一：NextAuth.js + SQLite (推荐)
- 使用 NextAuth.js 处理 Google OAuth
- SQLite 存储用户信息
- 部署简单，适合单页应用

### 方案二：自定义后端 + PostgreSQL
- 更灵活，但需要更多配置
- 适合大规模应用

## 下一步行动

等待用户提供 SSH 私钥，然后立即开始配置。
