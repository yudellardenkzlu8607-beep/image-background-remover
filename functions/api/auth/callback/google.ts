export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieHeader = request.headers.get('Cookie');
  const storedState = cookieHeader?.split('; ').find(c => c.startsWith('oauth_state='))?.split('=')[1];

  if (!code || !state || state !== storedState) {
    return new Response('Invalid request', { status: 400 });
  }

  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: new URL('/api/auth/callback/google', request.url).toString(),
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    return new Response('Failed to get token', { status: 500 });
  }

  const tokens = await tokenResponse.json();

  const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
  const userInfoResponse = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const user = await userInfoResponse.json();

  const session = {
    user: {
      name: user.name,
      email: user.email,
      image: user.picture,
    },
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': `session=${btoa(JSON.stringify(session))}; HttpOnly; Path=/; SameSite=Lax; Secure; Expires=${new Date(session.expires).toUTCString()}`,
    },
  });
}
