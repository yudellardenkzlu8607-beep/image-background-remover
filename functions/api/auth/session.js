// Base64 decode polyfill for Cloudflare Workers
function atobPolyfill(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  str = str.replace(/=+$/, '');
  for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    if (buffer.charCodeAt(0) === 61) break;
  }
  return output;
}
globalThis.atob = globalThis.atob || atobPolyfill;

export async function onRequestGet(context) {
  const { request } = context;
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
