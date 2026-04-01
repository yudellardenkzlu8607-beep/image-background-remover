/**
 * Debug - Get all subscriptions
 * GET /api/debug/subscriptions
 */

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // Get session
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split('; ').find(c => c.startsWith('session='));
    
    if (!sessionCookie) {
      return new Response(JSON.stringify({ error: 'No session' }), {
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

    const userId = session.user?.id;
    
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'DB not available', userId }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all subscriptions for this user
    const subscriptions = await env.DB.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all();
    
    // Get all credit transactions
    const transactions = await env.DB.prepare(`
      SELECT * FROM credit_transactions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all();

    return new Response(JSON.stringify({ 
      userId,
      subscriptions: subscriptions.results,
      transactions: transactions.results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
