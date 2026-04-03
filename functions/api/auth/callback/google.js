// Base64 encode/decode polyfill for Cloudflare Workers
function atobPolyfill(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  str = str.replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    if (buffer.charCodeAt(0) === 61) break;
  }
  return output;
}

function btoaPolyfill(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const a = str.charCodeAt(i);
    const b = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const c = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
    output += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)] + (i + 1 < str.length ? chars[((b & 15) << 2) | (c >> 6)] : '=') + (i + 2 < str.length ? chars[c & 63] : '=');
  }
  return output;
}

globalThis.atob = globalThis.atob || atobPolyfill;
globalThis.btoa = globalThis.btoa || btoaPolyfill;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieHeader = request.headers.get('Cookie');
  const storedState = cookieHeader?.split('; ').find(c => c.startsWith('oauth_state='))?.split('=')[1];

  if (!code || !state || state !== storedState) {
    return new Response('Invalid request', { status: 400 });
  }

  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';

  try {
    // 1. 获取 Access Token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: new URL('/api/auth/callback/google', request.url).toString(),
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response('Failed to get token: ' + errorText, { status: 500 });
    }

    const tokens = await tokenResponse.json();

    // 2. 获取用户信息
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const userInfoResponse = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('Failed to get user info:', errorText);
      return new Response('Failed to get user info: ' + errorText, { status: 500 });
    }

    const googleUser = await userInfoResponse.json();

    // 3. 生成唯一用户 ID
    const userId = `google_${googleUser.id}`;

    // 4. 尝试数据库操作（如果失败也继续，不阻塞登录）
    try {
      if (env.DB) {
        // 创建或更新用户记录
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, email, name, image, provider, provider_account_id, last_login)
          VALUES (?, ?, ?, ?, 'google', ?, CURRENT_TIMESTAMP)
        `).bind(userId, googleUser.email, googleUser.name, googleUser.picture, googleUser.id).run();

        // 初始化积分
        const existingCredits = await env.DB.prepare('SELECT balance FROM user_credits WHERE user_id = ?').bind(userId).first();
        
        if (!existingCredits) {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received)
            VALUES (?, 0, 0, 0, 0)
          `).bind(userId).run();
        }

        // 记录登录日志
        await env.DB.prepare(`
          INSERT INTO login_logs (user_id, email, login_time)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).bind(userId, googleUser.email).run();
      }
    } catch (dbErr) {
      console.error('Database error (non-blocking):', dbErr);
      // 数据库操作失败不阻塞登录
    }

    // 5. 创建 Session
    const session = {
      user: {
        id: userId,
        name: googleUser.name,
        email: googleUser.email,
        image: googleUser.picture,
      },
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
    };

    // 6. 重定向到首页
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': `session=${btoa(JSON.stringify(session))}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(session.expires).toUTCString()}`,
      },
    });
  } catch (err) {
    console.error('Callback error:', err);
    return new Response('Server error: ' + err.message, { status: 500 });
  }
}
