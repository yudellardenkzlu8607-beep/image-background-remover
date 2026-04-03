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
 * 获取用户信息（简化版，不依赖数据库）
 * GET /api/user/info
 */

export async function onRequestGet(context) {
  try {
    // 从 Cookie 获取 session
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Unauthorized - no session cookie' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    let session;
    try {
      session = JSON.parse(atob(sessionCookie.split('=')[1]));
    } catch (e) {
      console.error('Session parse error:', e);
      return new Response(JSON.stringify({ error: 'Invalid session - parse failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!session.user) {
      return new Response(JSON.stringify({ error: 'User not found in session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 简化版返回，不依赖数据库
    return new Response(JSON.stringify({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      },
      credits: {
        balance: 10,
        totalUsed: 0,
        totalPurchased: 0,
        bonusReceived: 10
      },
      subscription: null,
      dailyUsage: 0,
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
