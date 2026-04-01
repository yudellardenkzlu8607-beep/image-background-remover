/**
 * 获取用户积分交易记录
 * GET /api/user/transactions
 */

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionToken = cookies.match(/next-auth-session-token=([^;]+)/)?.[1];
    
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
    
    const transactions = await env.DB.prepare(`
      SELECT * FROM credit_transactions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(userId).all();
    
    return new Response(JSON.stringify({
      transactions: transactions.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Transactions error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}