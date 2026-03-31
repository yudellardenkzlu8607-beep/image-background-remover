/**
 * Cloudflare Pages 后端 API Worker
 */

// 导入 API 处理模块
import { handleAuthSignin } from './functions/api/auth/signin/google.js';
import { handleAuthCallback } from './functions/api/auth/callback/google.js';
import { handleAuthSession } from './functions/api/auth/session.js';
import { handleAuthSignout } from './functions/api/auth/signout.js';
import { handlePaymentCreateOrder } from './functions/api/payment/create-order.js';
import { handlePaymentWebhook } from './functions/api/payment/webhook.js';
import { handleUserInfo } from './functions/api/user/info.js';
import { handleCreditsCheck } from './functions/api/user/credits-check.js';
import { handleTransactions } from './functions/api/user/transactions.js';
import { handleRemoveBg } from './functions/api/remove-bg.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;

  // 清理 path（移除开头的 /）
  const cleanPath = path.replace(/^\/+/, '');

  console.log(`[Worker] ${method} ${path}`);

  try {
    // API 路由映射
    if ((cleanPath === 'api/auth/signin' || cleanPath.startsWith('api/auth/signin?')) && method === 'GET') {
      return await handleAuthSignin(context);
    }
    
    if ((cleanPath === 'api/auth/callback/google' || cleanPath.startsWith('api/auth/callback/google?')) && method === 'GET') {
      return await handleAuthCallback(context);
    }
    
    if (cleanPath === 'api/auth/session' && method === 'GET') {
      return await handleAuthSession(context);
    }
    
    if (cleanPath === 'api/auth/signout' && method === 'POST') {
      return await handleAuthSignout(context);
    }
    
    if (cleanPath === 'api/payment/create-order' && method === 'POST') {
      return await handlePaymentCreateOrder(context);
    }
    
    if (cleanPath === 'api/payment/webhook' && method === 'POST') {
      return await handlePaymentWebhook(context);
    }
    
    if (cleanPath === 'api/user/info' && method === 'GET') {
      return await handleUserInfo(context);
    }
    
    if (cleanPath === 'api/user/credits-check' && method === 'GET') {
      return await handleCreditsCheck(context);
    }
    
    if (cleanPath === 'api/user/transactions' && method === 'GET') {
      return await handleTransactions(context);
    }
    
    if (cleanPath === 'api/remove-bg' && method === 'POST') {
      return await handleRemoveBg(context);
    }

    // 未匹配的路由返回 404
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Worker Error]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
