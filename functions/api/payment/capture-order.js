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
  starter: { name: 'Starter', credits: 50, price: 5 },
  professional: { name: 'Professional', credits: 200, price: 15 },
  enterprise: { name: 'Enterprise', credits: 500, price: 39 },
};

// 根据价格反推套餐（备用方案）
function getPackageByPrice(priceStr) {
  const price = parseFloat(priceStr);
  if (price >= 35) return CREDIT_PACKAGES.enterprise;
  if (price >= 12) return CREDIT_PACKAGES.professional;
  return CREDIT_PACKAGES.starter;
}

const PAYPAL_CONFIG = {
  clientId: 'AWQO2Az3pdZ5JpkcA7J8Rfgy8Tu8Vz9uyH31FrFohUU1uZbbRbUPTuPsRSxbo7Wmo_WwiTxHoOzzu6AL',
  clientSecret: 'EFKlq9U89R6PzV_I4Ix34Jv0iXMUIh6u8F4-R-53wTJNqgWQzncUE-m3ADbX2ZwTQBR1kkJdBSvnerUW',
  baseUrl: 'https://api-m.paypal.com',
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
    const captureResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v2/checkout/orders/${token}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      return new Response(JSON.stringify({ error: `Get order failed: ${error}`, success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orderData = await captureResponse.json();
    
    // 先尝试从 custom_id 获取套餐信息
    let packageId = 'starter';
    let pkg = CREDIT_PACKAGES.starter;
    
    if (orderData.purchase_units && orderData.purchase_units[0]) {
      try {
        const customData = JSON.parse(orderData.purchase_units[0].custom_id || '{}');
        if (customData.packageId && CREDIT_PACKAGES[customData.packageId]) {
          packageId = customData.packageId;
          pkg = CREDIT_PACKAGES[packageId];
        }
      } catch (e) {
        console.log('Failed to parse custom_id, fallback to price detection');
      }
      
      // 备用方案：从订单金额反推
      if (!pkg || pkg.credits === 50) {
        try {
          const amount = orderData.purchase_units[0].amount?.value;
          if (amount) {
            const priceBasedPkg = getPackageByPrice(amount);
            if (priceBasedPkg.credits > pkg.credits) {
              pkg = priceBasedPkg;
              console.log(`Using price-based package: ${priceBasedPkg.name} (${priceBasedPkg.credits} credits)`);
            }
          }
        } catch (e) {
          console.log('Failed to detect package from price');
        }
      }
    }

    // 双重检查：如果还是 50，再从订单描述或金额确认
    if (pkg.credits === 50) {
      const amount = orderData.purchase_units?.[0]?.amount?.value;
      if (amount && parseFloat(amount) >= 14) {
        pkg = CREDIT_PACKAGES.professional;
        console.log('Overriding to Professional package based on amount >=14');
      } else if (amount && parseFloat(amount) >= 35) {
        pkg = CREDIT_PACKAGES.enterprise;
        console.log('Overriding to Enterprise package based on amount >=35');
      }
    }

    // Check if payment is completed
    if (orderData.status === 'COMPLETED' || orderData.status === 'APPROVED') {
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
