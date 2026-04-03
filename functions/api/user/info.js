// Base64 decode polyfill for Cloudflare Workers
function atobPolyfill(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  str = str.replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    if (buffer.charCodeAt(0) === 61) break;
  }
  return output;
}
globalThis.atob = globalThis.atob || atobPolyfill;

/**
 * 获取用户积分和订阅信息
 * GET /api/user/info
 */

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // 从 Cookie 获取 session
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let session;
    try {
      session = JSON.parse(atob(sessionCookie.split('=')[1]));
    } catch (e) {
      console.error('Session parse error:', e);
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userId = session.user?.id;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 尝试数据库操作，失败时返回默认值
    let credits = { balance: 0, total_used: 0, total_purchased: 0, bonus_received: 0 };
    let subscription = null;
    let dailyUsageCount = 0;
    
    try {
      if (env.DB) {
        // 获取用户积分信息
        const creditsResult = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
        
        if (creditsResult) {
          credits = creditsResult;
        } else {
          // 初始化用户积分
          await env.DB.prepare('INSERT OR IGNORE INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
        }
        
        // 获取订阅信息
        try {
          subscription = await env.DB.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 1
          `).bind(userId).first();
        } catch (e) {
          console.log('Subscription query error:', e.message);
        }
        
        // 获取今日使用次数
        const today = new Date().toISOString().split('T')[0];
        const dailyUsageResult = await env.DB.prepare(`
          SELECT count FROM daily_usage 
          WHERE user_id = ? AND usage_date = ?
        `).bind(userId, today).first();
        
        if (dailyUsageResult) {
          dailyUsageCount = dailyUsageResult.count;
        }
      }
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      // 数据库错误不阻塞，返回默认值
    }
    
    return new Response(JSON.stringify({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      },
      credits: {
        balance: credits.balance || 0,
        totalUsed: credits.total_used || 0,
        totalPurchased: credits.total_purchased || 0,
        bonusReceived: credits.bonus_received || 0
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        creditsGranted: subscription.creditsGranted || subscription.credits_granted || 0,
        currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end
      } : null,
      dailyUsage: dailyUsageCount,
      pricing: {
        starter: { name: '入门版', price: 9, credits: 50 },
        pro: { name: '专业版', price: 39, credits: 400 },
        yearly: { name: '年付85折', price: 199, credits: 600, perMonth: 16.6 }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User info error:', error);
    return new Response(JSON.stringify({ error: 'Server error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
