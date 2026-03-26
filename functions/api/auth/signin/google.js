export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
  const state = crypto.randomUUID();
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', new URL('/api/auth/callback/google', request.url).toString());
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Secure`,
    },
  });
}
