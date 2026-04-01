/**
 * PayPal API 工具
 * 直接内联到这个文件中，避免 Cloudflare 打包问题
 */

// PayPal API 配置
const PAYPAL_CONFIG = {
  clientId: 'Aeo2PFuZgfEdi3ya3lf8h5lgdxZw3_ex3cZJAuTCyFjl_HWHuV5F86ov4rZcWS_Q-5Cd58cfU9iP32b0',
  clientSecret: 'EJjM46c5uz477zrf1YIxG2eqA0vPgJZN6QA_oEkucqJASdjETRWtxpCsZQ9ittHETkAdRRTtkPX0Lmui',
  baseUrl: 'https://api-m.sandbox.paypal.com',
};

// 获取 Access Token
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
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 积分包定价
const CREDIT_PACKAGES = {
  starter: { name: 'Starter', credits: 50, price: '5.00', description: '50 credits - Starter Pack' },
  professional: { name: 'Professional', credits: 200, price: '15.00', description: '200 credits - Professional Pack' },
  enterprise: { name: 'Enterprise', credits: 500, price: '39.00', description: '500 credits - Enterprise Pack' },
};

// 订阅计划
const SUBSCRIPTION_PLANS = {
  monthly: { name: 'Pro Monthly', price: 10.00, interval: 'MONTH', description: 'Unlimited access - Monthly' },
  yearly: { name: 'Pro Yearly', price: 69.00, interval: 'YEAR', description: 'Unlimited access - Yearly (Save 42%)' },
};

/**
 * 创建 PayPal 订单（积分包一次性支付）
 */
async function createCreditOrder(packageId, userId, userEmail) {
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) throw new Error('Invalid package');

  const accessToken = await getAccessToken();

  const orderPayload = {
    intent: 'CAPTURE',
    application_context: {
      return_url: 'https://image-background-remover.space/pricing?success=true&type=credits',
      cancel_url: 'https://image-background-remover.space/pricing?canceled=true',
      brand_name: 'Image Background Remover',
      locale: 'en-US',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
    },
    purchase_units: [
      {
        reference_id: `credits_${packageId}_${userId}_${Date.now()}`,
        description: pkg.description,
        custom_id: JSON.stringify({ userId, packageId, type: 'credits' }),
        amount: {
          currency_code: 'USD',
          value: pkg.price,
        },
      },
    ],
  };

  const response = await fetch(`${PAYPAL_CONFIG.baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create order: ${error}`);
  }

  return await response.json();
}

/**
 * 创建 PayPal 订阅
 */
async function createSubscription(planId, userId, userEmail) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) throw new Error('Invalid plan');
  
  console.log('Creating subscription for plan:', planId, 'price:', plan.price, 'interval:', plan.interval);

  const accessToken = await getAccessToken();

  // 首先创建产品
  let productId;
  
  try {
    const productResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `PRO-${planId.toUpperCase()}-V2-$${plan.price}-${Math.random()}`,
        description: `${plan.name} - $${plan.price}/${plan.interval === 'YEAR' ? 'year' : 'month'}`,
        type: 'DIGITAL',
        category: 'SOFTWARE',
      }),
    });

    if (productResponse.ok) {
      const product = await productResponse.json();
      productId = product.id;
    } else {
      const err = await productResponse.text();
      console.log('Product creation error:', err);
      productId = 'PROD_' + Date.now(); // 使用随机ID
    }
  } catch (e) {
    productId = 'PROD_' + Date.now();
  }

  // 创建定价计划
  console.log("Creating subscription - plan:", planId, "price:", plan.price, "interval:", plan.interval);
  const planPayload = {
    product_id: productId,
    name: `${plan.name}-P3-$${plan.price}-${Date.now()}`,
    description: `${plan.name} - $${plan.price}/${plan.interval === 'YEAR' ? 'year' : 'month'}`,
    billing_cycles: [
      {
        frequency: {
          interval_unit: plan.interval,
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        pricing_scheme: {
          fixed_price: {
            value: String(plan.price),
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: {
        value: '0',
        currency_code: 'USD',
      },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  const planResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planPayload),
  });

  let billingPlanId;
  if (planResponse.ok) {
    const billingPlan = await planResponse.json();
    billingPlanId = billingPlan.id;
    console.log('Billing plan created:', billingPlanId);
  } else {
    // 如果创建失败，返回更详细的错误信息
    const errorText = await planResponse.text();
    console.error('PayPal plan creation failed:', errorText);
    throw new Error(`Failed to create billing plan: ${errorText}`);
  }

  // 创建订阅
  const subscriptionPayload = {
    plan_id: billingPlanId,
    custom_id: JSON.stringify({ userId, planId, type: 'subscription' }),
    subscriber: {
      email_address: userEmail,
    },
    application_context: {
      brand_name: 'Image Background Remover',
      locale: 'en-US',
      return_url: 'https://image-background-remover.space/pricing?success=true&type=subscription&planId=' + planId,
      cancel_url: 'https://image-background-remover.space/pricing?canceled=true',
      user_action: 'SUBSCRIBE_NOW',
    },
  };

  const subResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionPayload),
  });

  if (!subResponse.ok) {
    const error = await subResponse.text();
    throw new Error(`Failed to create subscription: ${error}`);
  }

  const result = await subResponse.json();
  console.log('Full subscription response:', JSON.stringify(result, null, 2));
  
  // Add a links array for frontend compatibility
  if (!result.links && result.id) {
    result.links = [{
      rel: "approve",
      href: "https://www.sandbox.paypal.com/webapps/billing/portal?token=" + result.id
    }];
  }
  
  return result;
}

/**
 * 创建 PayPal 订单或订阅
 * POST /api/payment/create-order
 */
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    
    // 获取 session
    const cookies = request.headers.get('Cookie') || '';
    console.log('Cookies received:', cookies);
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    console.log('Session cookie found:', !!sessionCookie);
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'Please sign in first' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let session;
    try {
      const sessionData = sessionCookie.split('=')[1];
      // Use Buffer for decoding if available, fallback to atob
      try {
        session = JSON.parse(decodeURIComponent(escape(atob(sessionData))));
      } catch (decodeErr) {
        console.error('Session decode error:', decodeErr);
        return new Response(JSON.stringify({ error: 'Invalid session format' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { type, packageId, planId } = body;

    let result;

    if (type === 'credits') {
      if (!packageId || !CREDIT_PACKAGES[packageId]) {
        return new Response(JSON.stringify({ error: 'Invalid package' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      result = await createCreditOrder(packageId, session.user.id, session.user.email);
      
    } else if (type === 'subscription') { console.log('Request body:', JSON.stringify(body));
      if (!planId || !SUBSCRIPTION_PLANS[planId]) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      result = await createSubscription(planId, session.user.id, session.user.email);
      
      // For subscriptions, return the subscription ID for activation
      if (result.id) {
        result.subscriptionId = result.id;
      }
      
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }


  } catch (error) {
    console.error("Create order error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
