import { kv } from '@vercel/kv';

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function getCookie(name, cookieString) {
  if (!cookieString) return null;
  const cookies = cookieString.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
  return cookies[name] || null;
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function authenticateSession(req) {
  const cookies = req.headers.get('cookie') || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return null;
  }

  try {
    const session = await kv.get(`session:${sessionToken}`);
    if (!session || !session.user) {
      return null;
    }
    return { email: session.user.email, sessionToken };
  } catch (e) {
    console.error('Session auth error:', e);
    return null;
  }
}

export default async function handler(req) {
  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const auth = await authenticateSession(req);

  if (!auth) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { email, sessionToken } = auth;

  if (!validateEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Delete all user data in parallel
    const keysToDelete = [
      `user:${email}`,
      `user:${email}:settings`,
      `user:${email}:sessions`,
      `user:${email}:timerState`,
      `session:${sessionToken}`
    ];

    await Promise.all(
      keysToDelete.map(key => kv.del(key).catch(e => console.error(`Error deleting ${key}:`, e)))
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Account deleted'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': [clearCookie('bm_sid'), clearCookie('bm_uid')]
      }
    });
  } catch (e) {
    console.error('Account deletion error:', e);

    return new Response(JSON.stringify({
      success: false,
      error: 'Server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
