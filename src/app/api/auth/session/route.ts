export const runtime = 'edge';

export async function GET(request: Request): Promise<Response> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionCookie = cookieHeader?.split('; ').find(c => c.startsWith('session='));

  if (!sessionCookie) {
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const session = JSON.parse(atob(sessionCookie.split('=')[1]));
    if (session.expires < Date.now()) {
      return new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify(null), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
