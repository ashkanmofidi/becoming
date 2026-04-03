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

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeText(text, maxLength = 5000) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
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
    return session.user.email;
  } catch (e) {
    console.error('Session auth error:', e);
    return null;
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const email = await authenticateSession(req);

  if (!email) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!validateEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();

    // Validate feedback structure
    if (!body.type || !body.message) {
      return new Response(JSON.stringify({ error: 'Missing type or message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const type = sanitizeText(body.type, 100);
    const message = sanitizeText(body.message, 5000);

    if (!type || !message) {
      return new Response(JSON.stringify({ error: 'Type and message cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feedback = {
      email,
      type,
      message,
      userAgent: req.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    };

    // Store in feedback list and by user email
    const feedbackId = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    await Promise.all([
      kv.lpush('feedback:all', JSON.stringify(feedback)),
      kv.setex(`feedback:${feedbackId}`, COOKIE_MAX_AGE, JSON.stringify(feedback))
    ]);

    return new Response('', {
      status: 204,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Feedback submission error:', e);

    if (e instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
