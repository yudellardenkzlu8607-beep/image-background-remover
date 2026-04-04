/**
 * Get all subscriptions for a user
 * GET /api/user/subscriptions
 */

export async function onRequestGet(context) {
  try {
    const { env, request } = context;

    // Get session
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

    const userId = session.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all subscriptions for this user
    const allSubscriptions = await env.DB.prepare(`
      SELECT * FROM subscriptions 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(userId).all();

    const subscriptions = allSubscriptions.results || allSubscriptions;

    return new Response(JSON.stringify({ 
      success: true,
      subscriptions: subscriptions || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
