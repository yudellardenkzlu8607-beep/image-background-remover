/**
 * PayPal Webhook 处理
 * POST /api/payment/webhook
 * 
 * 处理 PayPal 支付回调，更新用户订阅状态或积分
 */

// 积分包定价
const CREDIT_PACKAGES = {
  starter: { name: 'Starter', credits: 50, price: '5.00' },
  professional: { name: 'Professional', credits: 200, price: '15.00' },
  enterprise: { name: 'Enterprise', credits: 500, price: '39.00' },
};

/**
 * PayPal Webhook 处理
 */
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    
    const body = await request.json();
    const eventType = body.event_type;
    
    console.log('PayPal Webhook received:', eventType);

    let userId, customData;

    switch (eventType) {
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
                // 更新用户积分
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
            
            const planInfo = customData.planId === 'yearly' 
              ? { plan: 'pro-yearly', credits: 600, period: 365 }
              : { plan: 'pro-monthly', credits: 0, period: 30 };
            
            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(endDate.getDate() + planInfo.period);
            
            await env.DB.prepare(`
              INSERT OR REPLACE INTO subscriptions (user_id, plan, status, credits_granted, current_period_start, current_period_end)
              VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP, ?)
            `).bind(userId, planInfo.plan, planInfo.credits, endDate.toISOString()).run();
            
            console.log(`Subscription activated for user ${userId}: ${planInfo.plan}`);
          } catch (e) {
            console.error('Error creating subscription:', e);
          }
        }
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        const subCanceled = body.resource;
        if (subCanceled.custom_id) {
          try {
            customData = JSON.parse(subCanceled.custom_id);
            userId = customData.userId;
            
            await env.DB.prepare(`
              UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ?
            `).bind(userId).run();
            
            console.log(`Subscription canceled for user ${userId}`);
          } catch (e) {
            console.error('Error canceling subscription:', e);
          }
        }
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        const subActivated = body.resource;
        if (subActivated.custom_id) {
          try {
            customData = JSON.parse(subActivated.custom_id);
            userId = customData.userId;
            
            await env.DB.prepare(`
              UPDATE subscriptions SET status = 'active' WHERE user_id = ?
            `).bind(userId).run();
            
            console.log(`Subscription activated for user ${userId}`);
          } catch (e) {
            console.error('Error activating subscription:', e);
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