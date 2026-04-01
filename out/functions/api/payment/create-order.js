/**
 * Payment Create Order - Simplified for Cloudflare Workers
 */

// Base64 polyfills using TextEncoder/TextDecoder approach
const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64Encode(str) {
  let output = '';
  const bytes = new TextEncoder().encode(str);
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    output += base64Chars[b1 >> 2];
    output += base64Chars[((b1 & 3) << 4) | (b2 >> 4)];
    output += i + 1 < bytes.length ? base64Chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    output += i + 2 < bytes.length ? base64Chars[b3 & 63] : '=';
  }
  return output;
}

function base64Decode(str) {
  let output = '';
  str = str.replace(/=+$/, '');
  for (let i = 0; i < str.length; i += 4) {
    const b1 = base64Chars.indexOf(str[i]);
    const b2 = base64Chars.indexOf(str[i + 1]);
    const b3 = str[i + 2] !== undefined ? base64Chars.indexOf(str[i + 2]) : 0;
    const b4 = str[i + 3] !== undefined ? base64Chars.indexOf(str[i + 3]) : 0;
    output += String.fromCharCode((b1 << 2) | (b2 >> 4));
    if (str[i + 2] !== '=') output += String.fromCharCode(((b2 & 15) << 4) | (b3 >> 2));
    if (str[i + 3] !== '=') output += String.fromCharCode(((b3 & 3) << 6) | b4);
  }
  return output;
}

// Override global functions
globalThis.atob = base64Decode;
globalThis.btoa = base64Encode;

// PayPal API config
const PAYPAL_CONFIG = {
  clientId: 'Aeo2PFuZgfEdi3ya3lf8h5lgdxZw3_ex3cZJAuTCyFjl_HWHuV5F86ov4rZcWS_Q-5Cd58cfU9iP32b0',
  clientSecret: 'EJjM46c5uz477zrf1YIxG2eqA0vPgJZN6QA_oEkucqJASdjETRWtxpCsZQ9ittHETkAdRRTtkPX0Lmui',
  baseUrl: 'https://api-m.sandbox.paypal.com',
};

// Subscription plans
const SUBSCRIPTION_PLANS = {
  monthly: { name: 'Monthly', price: 10, interval: 'MONTH' },
  yearly: { name: 'Yearly', price: 69, interval: 'YEAR' },
};

// Credit packages
const CREDIT_PACKAGES = {
  starter: { name: 'Starter', price: 5, credits: 50 },
  professional: { name: 'Professional', price: 15, credits: 200, popular: true },
  enterprise: { name: 'Enterprise', price: 39, credits: 500 },
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
  
  if (!response.ok) {
    throw new Error('Failed to get access token');
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function onRequestPost(context) {
  const { request } = context;
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { type, planId, packageId } = body;

    // Check session
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Please sign in first' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let session;
    try {
      session = JSON.parse(atob(sessionCookie.split('=')[1]));
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = session.user?.id;
    const userEmail = session.user?.email;

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Invalid session data' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle credits purchase
    if (type === 'credits' && packageId && CREDIT_PACKAGES[packageId]) {
      const pkg = CREDIT_PACKAGES[packageId];
      
      const accessToken = await getAccessToken();
      
      // Create PayPal order for credits
      const orderResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            custom_id: JSON.stringify({ userId, packageId, type: 'credits' }),
            amount: {
              currency_code: 'USD',
              value: String(pkg.price),
            },
          }],
          application_context: {
            return_url: 'https://image-background-remover.space/pricing?success=true&type=credits',
            cancel_url: 'https://image-background-remover.space/pricing?canceled=true',
          },
        }),
      });

      if (!orderResponse.ok) {
        const err = await orderResponse.text();
        throw new Error(`PayPal error: ${err}`);
      }

      const order = await orderResponse.json();
      const approvalUrl = order.links?.find(l => l.rel === 'approve')?.href;
      
      if (!approvalUrl) {
        throw new Error('No approval URL found');
      }

      return new Response(JSON.stringify({ success: true, approvalUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle subscription
    if (type === 'subscription' && planId && SUBSCRIPTION_PLANS[planId]) {
      const plan = SUBSCRIPTION_PLANS[planId];
      
      const accessToken = await getAccessToken();
      
      // Create product
      const productResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Pro ${plan.name} ${Date.now()}`,
          type: 'DIGITAL',
        }),
      });

      if (!productResponse.ok) {
        throw new Error('Failed to create product');
      }

      const product = await productResponse.json();

      // Create billing plan
      const planResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          name: `${plan.name} Plan`,
          description: `${plan.name} subscription - $${plan.price}`,
          billing_cycles: [{
            frequency: { interval_unit: plan.interval, interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            pricing_scheme: {
              fixed_price: { value: String(plan.price), currency_code: 'USD' },
            },
          }],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: { value: '0', currency_code: 'USD' },
          },
        }),
      });

      if (!planResponse.ok) {
        const err = await planResponse.text();
        throw new Error(`Failed to create billing plan: ${err}`);
      }

      const billingPlan = await planResponse.json();

      // Create subscription
      const subResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: billingPlan.id,
          custom_id: JSON.stringify({ userId, planId, type: 'subscription' }),
          subscriber: { email_address: userEmail },
          application_context: {
            brand_name: 'Image Background Remover',
            return_url: `https://image-background-remover.space/pricing?success=true&type=subscription&planId=${planId}`,
            cancel_url: 'https://image-background-remover.space/pricing?canceled=true',
            user_action: 'SUBSCRIBE_NOW',
          },
        }),
      });

      if (!subResponse.ok) {
        const err = await subResponse.text();
        throw new Error(`Failed to create subscription: ${err}`);
      }

      const subscription = await subResponse.json();
      const approveUrl = subscription.links?.find(l => l.rel === 'approve')?.href;

      return new Response(JSON.stringify({ success: true, approvalUrl: approveUrl, subscriptionId: subscription.id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Payment error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
