/**
 * Cloudflare Pages 后端 API - 处理所有 /api/* 路由
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

export const onRequestGet = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // 清理 path
  const cleanPath = path.replace(/^\/+/, '').replace(/\?.*/, '');

  console.log(`[Pages API] GET ${cleanPath}`);

  try {
    if ((cleanPath === 'api/auth/signin' || cleanPath.startsWith('api/auth/signin?'))) {
      return await handleAuthSignin(context);
    }
    
    if (cleanPath === 'api/auth/callback/google' || cleanPath.startsWith('api/auth/callback/google?')) {
      return await handleAuthCallback(context);
    }
    
    if (cleanPath === 'api/auth/session') {
      return await handleAuthSession(context);
    }
    
    if (cleanPath === 'api/user/info') {
      return await handleUserInfo(context);
    }
    
    if (cleanPath === 'api/user/credits-check') {
      return await handleCreditsCheck(context);
    }
    
    if (cleanPath === 'api/user/transactions') {
      return await handleTransactions(context);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Worker Error]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  const cleanPath = path.replace(/^\/+/, '').replace(/\?.*/, '');

  console.log(`[Pages API] POST ${cleanPath}`);

  try {
    if (cleanPath === 'api/auth/signout') {
      return await handleAuthSignout(context);
    }
    
    if (cleanPath === 'api/payment/create-order') {
      return await handlePaymentCreateOrder(context);
    }
    
    if (cleanPath === 'api/payment/webhook') {
      return await handlePaymentWebhook(context);
    }
    
    if (cleanPath === 'api/remove-bg') {
      return await handleRemoveBg(context);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('[Worker Error]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
