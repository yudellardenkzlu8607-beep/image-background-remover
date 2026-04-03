/**
 * Capture PayPal Order - 处理支付回调
 * POST /api/payment/capture-order
 */

// Base64 decode polyfill
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

// Credit packages - 确保和 create-order.js 以及前端完全一致！
const CREDIT_PACKAGES = {
  starter: { name: 'Starter', credits: 50, price: '5.00' },
  professional: { name: 'Professional', credits: 200, price: '15.00' },
  enterprise: { name: 'Enterprise', credits: 500, price: '39.00' },
};

const PAYPAL_CONFIG = {
  clientId: 'Aeo2PFuZgfEdi3ya3lf8h5lgdxZw3_ex3cZJAuTCyFjl_HWHuV5F86ov4rZcWS_Q-5Cd58cfU9iP32b0',
  clientSecret: 'EJjM46c5uz477zrf1YIxG2eqA0vPgJZN6QA_oEkucqJASdjETRWtxpCsZQ9ittHETkAdRRTtkPX0Lmui',
  baseUrl: 'https://api-m.sandbox.paypal.com',
};

async function getAccessToken() {
  const auth = btoa(`${PAYPAL_CONFIG.clientId}:${PAYPAL_CONFIG.clientSecret}`);
  
  const response = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const body = await request.json();
    const { token, type } = body;

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

    // Capture the PayPal order
    const accessToken = await getAccessToken();
    const captureResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      return new Response(JSON.stringify({ error: `Capture failed: ${error}`, success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const captureData = await captureResponse.json();
    
    // Check if payment is completed
    if (captureData.status === 'COMPLETED') {
      // Get package info from custom_id if available
      let packageId = 'starter';
      if (captureData.purchase_units && captureData.purchase_units[0]) {
        try {
          const customData = JSON.parse(captureData.purchase_units[0].custom_id || '{}');
          packageId = customData.packageId || 'starter';
        } catch (e) {
          packageId = 'starter';
        }
      }

      const pkg = CREDIT_PACKAGES[packageId] || CREDIT_PACKAGES.starter;

      // Add credits to user account
      if (env.DB) {
        let credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
        
        if (!credits) {
          await env.DB.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
          credits = { balance: 0 };
        }
        
        const updatedBalance = (credits?.balance || 0) + pkg.credits;
        
        await env.DB.prepare(`
          UPDATE user_credits 
          SET balance = balance + ?,
              total_purchased = total_purchased + ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).bind(pkg.credits, pkg.credits, userId).run();
        
        await env.DB.prepare(`
          INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
          VALUES (?, 'purchase', ?, ?, ?)
        `).bind(userId, pkg.credits, updatedBalance, `Purchased ${pkg.name} - ${pkg.credits} credits`).run();
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Added ${pkg.credits} credits to your account`,
        creditsAdded: pkg.credits
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Payment not completed', success: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Capture order error:', error);
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
