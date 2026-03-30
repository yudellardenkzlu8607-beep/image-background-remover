/**
 * PayPal Webhook 处理
 * POST /api/payment/webhook
 * 
 * 处理 PayPal 支付回调，更新用户订阅状态或积分
 */

import { verifyWebhook, captureOrder, CREDIT_PACKAGES } from '../../lib/paypal.js';

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    
    const body = await request.json();
    const eventType = body.event_type;
    
    console.log('PayPal Webhook received:', eventType);
    console.log('Body:', JSON.stringify(body));

    // 验证 webhook 签名（生产环境需要开启）
    // const isValid = await verifyWebhook(body, {
    //   'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
    //   'paypal-cert-url': request.headers.get('paypal-cert-url'),
    //   'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
    //   'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
    //   'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
    // });
    // if (!isValid) {
    //   return new Response(JSON.stringify({ error: 'Invalid signature' }), {
    //     status: 400,
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    let userId, customData, amount;

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        // 订单已批准，等待捕获
        console.log('Order approved:', body.resource?.id);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // 积分包支付完成
        const capture = body.resource;
        if (capture.custom_id) {
          try {
            customData = JSON.parse(capture.custom_id);
            userId = customData.userId;
            
            if (customData.type === 'credits' && customData.packageId) {
              const pkg = CREDIT_PACKAGES[customData.packageId];
              if (pkg) {
                // 添加积分
                const newBalance = pkg.credits;
                
                // 更新用户积分
                let credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
                
                if (!credits) {
                  await env.DB.prepare('INSERT INTO user_credits (user_id, balance, total_purchased, total_used, bonus_received) VALUES (?, 0, 0, 0, 0)').bind(userId).run();
                  credits = await env.DB.prepare('SELECT * FROM user_credits WHERE user_id = ?').bind(userId).first();
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
                
                console.log(`Added ${pkg.credits} credits to user ${userId}`);
              }
            }
          } catch (e) {
            console.error('Error processing capture:', e);
          }
        }
        break;

      case 'BILLING.SUBSCRIPTION.CREATED':
        // 订阅创建
        const subCreated = body.resource;
        if (subCreated.custom_id) {
          try {
            customData = JSON.parse(subCreated.custom_id);
            userId = customData.userId;
            
            // 更新订阅状态
            const planInfo = customData.planId === 'yearly' 
              ? { plan: 'pro-yearly', credits: 600, period: 365 }
              : { plan: 'pro-monthly', credits: 0, period: 30 };
            
            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + planInfo.period);
            
            // 检查是否已有订阅
            const existingSub = await env.DB.prepare(`
              SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'
            `).bind(userId).first();
            
            if (existingSub) {
              // 更新现有订阅
              await env.DB.prepare(`
                UPDATE subscriptions 
                SET plan = ?, status = 'active', 
                    current_period_start = CURRENT_TIMESTAMP,
                    current_period_end = ?
                WHERE user_id = ?
              `).bind(planInfo.plan, endDate.toISOString(), userId).run();
            } else {
              // 创建新订阅
              await env.DB.prepare(`
                INSERT INTO subscriptions (user_id, plan, status, credits_granted, current_period_start, current_period_end)
                VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP, ?)
              `).bind(userId, planInfo.plan, planInfo.credits, endDate.toISOString()).run();
            }
            
            console.log(`Subscription activated for user ${userId}: ${planInfo.plan}`);
          } catch (e) {
            console.error('Error creating subscription:', e);
          }
        }
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // 订阅取消
        const subCanceled = body.resource;
        if (subCanceled.custom_id) {
          try {
            customData = JSON.parse(subCanceled.custom_id);
            userId = customData.userId;
            
            await env.DB.prepare(`
              UPDATE subscriptions 
              SET status = 'cancelled'
              WHERE user_id = ?
            `).bind(userId).run();
            
            console.log(`Subscription canceled for user ${userId}`);
          } catch (e) {
            console.error('Error canceling subscription:', e);
          }
        }
        break;

      case 'BILLING.SUBSCRIPTION.REACTIVATED':
        // 订阅重新激活
        const subReactivated = body.resource;
        if (subReactivated.custom_id) {
          try {
            customData = JSON.parse(subReactivated.custom_id);
            userId = customData.userId;
            
            await env.DB.prepare(`
              UPDATE subscriptions 
              SET status = 'active'
              WHERE user_id = ?
            `).bind(userId).run();
            
            console.log(`Subscription reactivated for user ${userId}`);
          } catch (e) {
            console.error('Error reactivating subscription:', e);
          }
        }
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}