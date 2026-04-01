/**
 * PayPal API 工具
 */

// PayPal API 配置
const PAYPAL_CONFIG = {
  clientId: 'Aeo2PFuZgfEdi3ya3lf8h5lgdxZw3_ex3cZJAuTCyFjl_HWHuV5F86ov4rZcWS_Q-5Cd58cfU9iP32b0',
  clientSecret: 'EJjM46c5uz477zrf1YIxG2eqA0vPgJZN6QA_oEkucqJASdjETRWtxpCsZQ9ittHETkAdRRTtkPX0Lmui',
  baseUrl: 'https://api-m.sandbox.paypal.com', // 沙箱环境
};

// 获取 Access Token
export async function getAccessToken() {
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
export const CREDIT_PACKAGES = {
  starter: {
    name: 'Starter',
    credits: 50,
    price: '5.00',
    description: '50 credits - Starter Pack'
  },
  professional: {
    name: 'Professional',
    credits: 200,
    price: '15.00',
    description: '200 credits - Professional Pack'
  },
  enterprise: {
    name: 'Enterprise',
    credits: 500,
    price: '39.00',
    description: '500 credits - Enterprise Pack'
  }
};

// 订阅计划
export const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Pro Monthly',
    price: '10.00',
    interval: 'MONTH',
    description: 'Unlimited access - Monthly'
  },
  yearly: {
    name: 'Pro Yearly',
    price: '69.00',
    interval: 'YEAR',
    description: 'Unlimited access - Yearly (Save 42%)'
  }
};

// 创建积分包订单 (一次性支付)
export async function createCreditOrder(packageId, userId, userEmail) {
  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) {
    throw new Error('Invalid package');
  }

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
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: pkg.price,
            },
          },
        },
        items: [
          {
            name: pkg.name,
            description: pkg.description,
            quantity: '1',
            unit_amount: {
              currency_code: 'USD',
              value: pkg.price,
            },
            category: 'DIGITAL',
          },
        ],
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

// 创建订阅
export async function createSubscription(planId, userId, userEmail) {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid plan');
  }

  const accessToken = await getAccessToken();

  // 首先创建产品
  const productResponse = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Image Background Remover Pro',
      description: 'Unlimited access to AI background removal',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  let productId;
  if (productResponse.ok) {
    const product = await productResponse.json();
    productId = product.id;
  } else {
    // 如果产品已存在，使用已有产品ID
    productId = 'PROD_' + planId.toUpperCase();
  }

  // 创建订阅计划
  const planPayload = {
    product_id: productId,
    name: plan.name,
    description: plan.description,
    billing_cycles: [
      {
        frequency: {
          interval_unit: plan.interval,
          interval_count: 1,
        },
        tenure: 'REGULAR',
        sequence: 1,
        pricing_scheme: {
          fixed_value: {
            value: plan.price,
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
  } else {
    // 如果计划已存在，使用已有计划ID
    billingPlanId = 'PLAN_' + planId.toUpperCase();
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
      return_url: 'https://image-background-remover.space/pricing?success=true&type=subscription',
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

  return await subResponse.json();
}

// 验证 Webhook 签名
export async function verifyWebhook(body, headers) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`${PAYPAL_CONFIG.baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: 'WEBHOOK_ID', // 需要在 PayPal 开发者平台设置
      webhook_event: body,
    }),
  });

  return response.ok;
}

// 捕获订单付款
export async function captureOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_CONFIG.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to capture order: ${error}`);
  }

  return await response.json();
}