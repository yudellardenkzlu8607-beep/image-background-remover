/**
 * 积分检查与扣除 API
 * POST /api/user/credits/check
 */

import { getUserCredits, checkAndDeductCredits, getCreditTransactions } from '../../../../src/lib/db.js';

export async function onRequestPost(context) {
  try {
    const { env } = context;
    
    // 从 session 获取用户
    const sessionToken = context.request.headers.get('Cookie')?.match(/next-auth-session-token=([^;]+)/)?.[1];
    
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 获取 session 中的用户信息
    const sessionData = await env.SESSIONS.get(sessionToken);
    if (!sessionData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = JSON.parse(sessionData);
    const userId = session.user?.id;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查并扣除积分
    const result = await checkAndDeductCredits(env.DB, userId);
    
    return new Response(JSON.stringify({
      allowed: result.allowed,
      reason: result.reason,
      balance: result.balance,
      message: result.allowed 
        ? `已扣除1积分，剩余 ${result.balance} 积分` 
        : '积分不足，请充值'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Credits check error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}