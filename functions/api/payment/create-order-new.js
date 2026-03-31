/**
 * 创建 PayPal 订阅 - 简化版
 */
const SUBSCRIPTION_PLANS = {
  monthly: { name: 'Pro Monthly', price: 10.00, interval: 'MONTH', period: 30 },
  yearly: { name: 'Pro Yearly', price: 69.00, interval: 'YEAR', period: 365 },
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
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  return data.access_token;
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const cookies = request.headers.get('Cookie') || '';
  const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
  
  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: 'Please sign in first' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let session;
  try {
    session = JSON.parse(atob(sessionCookie.split('=')[1]));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json();
  const { type, planId } = body;

  if (type !== 'subscription' || !planId || !SUBSCRIPTION_PLANS[planId]) {
    return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const plan = SUBSCRIPTION_PLANS[planId];
  const accessToken = await getAccessToken();

  // 创建产品
  const productResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Image Background Remover ${planId} ${Date.now()}`,
      description: `Pro subscription - ${planId}`,
      type: 'DIGITAL',
      category: 'SOFTWARE',
    }),
  });

  if (!productResponse.ok) {
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const product = await productResponse.json();
  const productId = product.id;
  console.log('Created product:', productId);

  // 创建定价计划
  const planResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      name: `Pro ${planId} ${Date.now()}`,
      description: `${plan.name} subscription`,
      billing_cycles: [{
        frequency: { interval_unit: plan.interval, interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        pricing_scheme: { fixed_price: { value: String(plan.price), currency_code: 'USD' } },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!planResponse.ok) {
    const err = await planResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to create plan: ' + err }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const billingPlan = await planResponse.json();
  const billingPlanId = billingPlan.id;
  console.log('Created billing plan:', billingPlanId, 'price:', plan.price);

  // 创建订阅
  const subResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: billingPlanId,
      subscriber: { email_address: session.user.email },
      application_context: {
        brand_name: 'Image Background Remover',
        return_url: 'https://image-background-remover.space/pricing?success=true&type=subscription&planId=' + planId,
        cancel_url: 'https://image-background-remover.space/pricing?canceled=true',
        user_action: 'SUBSCRIBE_NOW',
      },
    }),
  });

  if (!subResponse.ok) {
    const err = await subResponse.text();
    return new Response(JSON.stringify({ error: 'Failed to create subscription: ' + err }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const subscription = await subResponse.json();
  console.log('Created subscription:', subscription.id, 'status:', subscription.status);
  return new Response(JSON.stringify(subscription), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
