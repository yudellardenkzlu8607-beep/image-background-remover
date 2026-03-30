/**
 * 图片背景移除 API
 * POST /api/remove-bg
 * 需要先检查积分，不足时返回特定错误码
 */

export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    // 1. 从 Cookie 获取 session token
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionToken = cookies.match(/next-auth-session-token=([^;]+)/)?.[1];
    
    // 获取用户信息（用于积分检查）
    let userId = null;
    if (sessionToken) {
      const sessionData = await env.SESSIONS.get(sessionToken);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        userId = session.user?.id;
      }
    }
    
    // 2. 未登录用户：检查今日使用次数（限制1次）
    if (!userId) {
      const clientIP = context.request.headers.get('CF-Connecting-IP') || 
                      context.request.headers.get('X-Forwarded-For')?.split(',')[0] || 'unknown';
      const today = new Date().toISOString().split('T')[0];
      
      const dailyKey = `daily:${clientIP}:${today}`;
      const usedCount = parseInt(await env.RATE_LIMIT.get(dailyKey) || '0');
      
      if (usedCount >= 1) {
        return new Response(JSON.stringify({ 
          error: 'daily_limit_reached',
          message: '未登录用户每天仅可使用1次，请登录获取更多额度' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 增加使用计数
      await env.RATE_LIMIT.put(dailyKey, String(usedCount + 1), { expirationTtl: 86400 });
    } 
    // 3. 已登录用户：检查积分
    else {
      let credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
      
      if (!credits) {
        await env.DB.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
        credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
      }
      
      // 首次使用：注册赠送3积分
      if (credits.bonus_received === 0 && credits.total_used === 0 && credits.balance === 0) {
        const newBalance = 3;
        await env.DB.prepare(`
          UPDATE user_credits 
          SET balance = ?, bonus_received = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).bind(newBalance, 3, userId).run();
        
        await env.DB.prepare(`
          INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
          VALUES (?, 'bonus', ?, ?, '注册赠送')
        `).bind(userId, 3, newBalance).run();
        
        credits.balance = newBalance;
        credits.bonus_received = 3;
      }
      
      // 检查余额
      if (credits.balance <= 0) {
        return new Response(JSON.stringify({ 
          error: 'no_credits',
          message: '积分不足，请升级或购买积分包'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 扣除积分
      const newBalance = credits.balance - 1;
      await env.DB.prepare(`
        UPDATE user_credits 
        SET balance = balance - 1, 
            total_used = total_used + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(userId).run();
      
      await env.DB.prepare(`
        INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
        VALUES (?, 'usage', -1, ?, 'AI图片背景移除')
      `).bind(userId, newBalance).run();
      
      // 记录每日使用
      const today = new Date().toISOString().split('T')[0];
      await env.DB.prepare(`
        INSERT INTO daily_usage (user_id, usage_date, count)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, usage_date) DO UPDATE SET count = count + 1
      `).bind(userId, today).run();
    }
    
    // 4. 处理图片
    const formData = await context.request.formData();
    const image = formData.get('image');
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const apiKey = '42d1MGCDgUDGeMtCKg3pPRYk';
    
    const form = new FormData();
    form.append('image_file', image, image.name);
    form.append('size', 'auto');
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: form,
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Remove.bg API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const resultBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)));
    const resultUrl = `data:image/png;base64,${base64}`;
    
    // 5. 返回结果（需要获取最新余额）
    let finalBalance = 0;
    if (userId) {
      const updatedCredits = await env.DB.prepare('SELECT balance FROM user_credits WHERE user_id = ?').bind(userId).first();
      finalBalance = updatedCredits?.balance || 0;
    }
    
    return new Response(JSON.stringify({ 
      result: resultUrl,
      remainingCredits: finalBalance,
      message: '处理成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Remove bg error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}