/**
 * 创建 PayPal 订单
 * POST /api/payment/create-order
 * 
 * Body: { type: 'credits' | 'subscription', packageId: string, planId: string }
 */

import { createCreditOrder, createSubscription, CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '../../lib/paypal.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    
    // 获取 session
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
      // 创建积分包订单
      if (!packageId || !CREDIT_PACKAGES[packageId]) {
        return new Response(JSON.stringify({ error: 'Invalid package' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      result = await createCreditOrder(packageId, session.user.id, session.user.email);
      
    } else if (type === 'subscription') {
      // 创建订阅
      if (!planId || !SUBSCRIPTION_PLANS[planId]) {
        return new Response(JSON.stringify({ error: 'Invalid plan' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      result = await createSubscription(planId, session.user.id, session.user.email);
      
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}