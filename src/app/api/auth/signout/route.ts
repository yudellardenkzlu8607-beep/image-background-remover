export const runtime = 'edge';

export async function POST(request: Request): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'session=; HttpOnly; Path=/; SameSite=Lax; Secure; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    },
  });
}
