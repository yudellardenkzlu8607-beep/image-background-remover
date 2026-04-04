/**
 * Capture/Activate PayPal Subscription - 处理订阅回调
 * POST /api/payment/capture-subscription
 */

const SUBSCRIPTION_PLANS = {
  monthly: { name: 'Pro Monthly', credits: 0, interval: 'MONTH', period: 30 },
  yearly: { name: 'Pro Yearly', credits: 0, interval: 'YEAR', period: 365 },
};

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { subscriptionId, planId } = body;

    // Get session
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Please sign in first', success: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let session;
    try {
      session = JSON.parse(atob(sessionCookie.split('=')[1]));
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid session', success: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found', success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.monthly;
    
    // Calculate subscription period
    const now = new Date();
    const currentPeriodStart = now.toISOString();

    // Bonus credits for subscribing
    const bonusCredits = planId === 'yearly' ? 100 : 20;

    // Activate subscription in database
    if (env.DB) {
      // Check if subscription table exists, if not create it
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            plan TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            credits_granted INTEGER DEFAULT 0,
            current_period_start TEXT,
            current_period_end TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
      } catch (e) {
        console.log('Table might already exist:', e.message);
      }

      // Get all active subscriptions for this user
      const allSubs = await env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ?').bind(userId, 'active').all();
      
      // 计算最晚的到期时间
      let latestEnd = new Date();
      if (allSubs && allSubs.length > 0) {
        for (const sub of allSubs) {
          const subEnd = new Date(sub.current_period_end);
          if (subEnd > latestEnd) {
            latestEnd = subEnd;
          }
        }
      }
      
      // 在最晚到期时间基础上累加
      const newPeriodEnd = new Date(latestEnd.getTime() + plan.period * 24 * 60 * 60 * 1000).toISOString();
      
      console.log('Creating new subscription record for user:', userId, 'plan:', planId);
      console.log('Latest existing end:', latestEnd, 'New end:', newPeriodEnd);
      
      // 插入新的订阅记录（保留所有历史）
      await env.DB.prepare(`
        INSERT INTO subscriptions 
        (user_id, plan, status, credits_granted, current_period_start, current_period_end, updated_at)
        VALUES (?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(userId, planId, plan.credits, currentPeriodStart, newPeriodEnd).run();
      
      console.log('New subscription inserted, checking all subscriptions...');
      const checkAllSubs = await env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).all();
      console.log('All subscriptions for user:', checkAllSubs);

      // Give bonus credits for subscribing
      let credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
      
      if (!credits) {
        await env.DB.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
        credits = { balance: 0 };
      }
      
      const updatedBalance = (credits?.balance || 0) + bonusCredits;
      
      await env.DB.prepare(`
        UPDATE user_credits 
        SET balance = balance + ?,
            bonus_received = bonus_received + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(bonusCredits, bonusCredits, userId).run();
      
      await env.DB.prepare(`
        INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
        VALUES (?, 'bonus', ?, ?, ?)
      `).bind(userId, bonusCredits, updatedBalance, `Subscribe to ${plan.name} - bonus credits`).run();
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Subscription activated! You received ${bonusCredits || 20} bonus credits.`,
      plan: planId
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Capture subscription error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
