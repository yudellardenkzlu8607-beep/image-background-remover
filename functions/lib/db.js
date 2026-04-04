/**
 * 数据库工具 - Cloudflare D1
 */

// 初始化数据库（创建表如果不存在）
export async function initializeDatabase(env) {
  const statements = [
    // 用户表
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 用户积分表
    `CREATE TABLE IF NOT EXISTS user_credits (
      user_id TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      total_purchased INTEGER DEFAULT 0,
      total_used INTEGER DEFAULT 0,
      bonus_received INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 积分交易记录
    `CREATE TABLE IF NOT EXISTS credit_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 订阅表
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      credits_granted INTEGER DEFAULT 0,
      current_period_start DATETIME,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // 每日使用记录
    `CREATE TABLE IF NOT EXISTS daily_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      usage_date DATE NOT NULL,
      count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, usage_date)
    )`,
    
    // 登录日志表
    `CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT
    )`,
    
    // 索引
    `CREATE INDEX IF NOT EXISTS idx_email ON users(email)`,
    `CREATE INDEX IF NOT EXISTS idx_provider ON users(provider_account_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, usage_date)`,
    `CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time)`,
  ];

  for (const sql of statements) {
    try {
      await env.DB.prepare(sql).run();
    } catch (err) {
      console.error('DB init error:', err.message);
    }
  }
}

// 获取或创建用户
export async function getOrCreateUser(db, id, email, name, image, provider, providerAccountId) {
  const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  
  if (existing) {
    await db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(id).run();
    return existing;
  }
  
  await db.prepare(`
    INSERT INTO users (id, email, name, image, provider, provider_account_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, email, name, image, provider, providerAccountId).run();
  
  return await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

// 获取用户积分信息
export async function getUserCredits(db, userId) {
  let credits = await db.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
  
  if (!credits) {
    await db.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
    credits = await db.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
  }
  
  return credits;
}

// 添加积分
export async function addCredits(db, userId, amount, type, description) {
  const user = await getUserCredits(db, userId);
  const newBalance = user.balance + amount;
  
  // 更新用户积分
  await db.prepare(`
    UPDATE user_credits 
    SET balance = balance + ?,
        total_purchased = total_purchased + ?,
        bonus_received = bonus_received + ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(amount, type === 'purchase' ? amount : 0, type !== 'purchase' ? amount : 0, userId).run();
  
  // 记录交易
  await db.prepare(`
    INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, type, amount, newBalance, description).run();
  
  return { newBalance };
}

// 扣除积分
export async function deductCredits(db, userId, amount, description) {
  const user = await getUserCredits(db, userId);
  
  if (user.balance < amount) {
    return { success: false, reason: 'insufficient_balance' };
  }
  
  const newBalance = user.balance - amount;
  
  // 更新用户积分
  await db.prepare(`
    UPDATE user_credits 
    SET balance = balance - ?,
        total_used = total_used + ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).bind(amount, amount, userId).run();
  
  // 记录交易
  await db.prepare(`
    INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
    VALUES (?, 'usage', ?, ?, ?)
  `).bind(userId, -amount, newBalance, description).run();
  
  return { success: true, newBalance };
}

// 检查并扣除积分（包含注册赠送逻辑）
export async function checkAndDeductCredits(db, userId) {
  const user = await getUserCredits(db, userId);
  
  // 注册赠送：首次使用前，给3次
  if (user.bonus_received === 0 && user.total_used === 0 && user.balance === 0) {
    await addCredits(db, userId, 3, 'bonus', '注册赠送');
  }
  
  // 重新获取余额（可能有更新）
  const updatedUser = await getUserCredits(db, userId);
  
  if (updatedUser.balance <= 0) {
    return { allowed: false, reason: 'no_credits', balance: 0 };
  }
  
  // 扣除积分
  const result = await deductCredits(db, userId, 1, 'AI图片背景移除');
  
  return {
    allowed: result.success,
    reason: result.success ? null : result.reason,
    balance: result.success ? result.newBalance : updatedUser.balance
  };
}

// 获取用户积分交易记录
export async function getCreditTransactions(db, userId, limit = 20) {
  const results = await db.prepare(`
    SELECT * FROM credit_transactions 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, limit).all();
  
  return results.results;
}

// 获取订阅信息（计算所有活跃订阅的总到期时间）
export async function getUserSubscription(db, userId) {
  const allSubscriptions = await db.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `).bind(userId).all();
  
  const subs = allSubscriptions.results || allSubscriptions;
  
  if (!subs || subs.length === 0) {
    return null;
  }
  
  // 找到最晚的到期时间
  let latestEnd = new Date(0);
  let latestSub = subs[0];
  
  for (const sub of subs) {
    const subEnd = new Date(sub.current_period_end);
    if (subEnd > latestEnd) {
      latestEnd = subEnd;
      latestSub = sub;
    }
  }
  
  // 返回最新的订阅记录，但使用最晚的到期时间
  return {
    ...latestSub,
    current_period_end: latestEnd.toISOString(),
    total_subscriptions: subs.length
  };
}

// 记录每日使用
export async function recordDailyUsage(db, userId) {
  const today = new Date().toISOString().split('T')[0];
  
  await db.prepare(`
    INSERT INTO daily_usage (user_id, usage_date, count)
    VALUES (?, ?, 1)
    ON CONFLICT(user_id, usage_date) DO UPDATE SET count = count + 1
  `).bind(userId, today).run();
}