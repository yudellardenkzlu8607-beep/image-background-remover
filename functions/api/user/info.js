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
    
    // 获取用户积分信息
    let credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
    
    if (!credits) {
      await env.DB.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
      credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
    }
    
    // 获取订阅信息 - 改为简单的查询
    let subscription = null;
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
    const dailyUsage = await env.DB.prepare(`
      SELECT count FROM daily_usage 
      WHERE user_id = ? AND usage_date = ?
    `).bind(userId, today).first();
    
    return new Response(JSON.stringify({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      },
      credits: {
        balance: credits.balance,
        totalUsed: credits.total_used,
        totalPurchased: credits.total_purchased,
        bonusReceived: credits.bonus_received
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        creditsGranted: subscription.credits_granted,
        currentPeriodEnd: subscription.current_period_end
      } : null,
      dailyUsage: dailyUsage ? dailyUsage.count : 0,
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
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}