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
  const cookies = req.headers.cookie || '';
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

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await authenticateSession(req);

  if (!auth) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { email, sessionToken } = auth;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
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

    res.setHeader('Set-Cookie', [
      clearCookie('bm_sid'),
      clearCookie('bm_uid')
    ]);

    return res.status(200).json({
      success: true
    });
  } catch (e) {
    console.error('Account deletion error:', e);

    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}
