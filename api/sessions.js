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

function sanitizeData(data, maxSize = 1000000) {
  // Ensure data doesn't exceed max size (1MB)
  const json = JSON.stringify(data);
  if (json.length > maxSize) {
    throw new Error('Data exceeds maximum size');
  }
  return data;
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

async function handleGET(req, email) {
  try {
    const [settings, sessions, timerState] = await Promise.all([
      kv.get(`user:${email}:settings`),
      kv.get(`user:${email}:sessions`),
      kv.get(`user:${email}:timerState`)
    ]);

    return new Response(JSON.stringify({
      settings: settings || null,
      sessions: sessions || [],
      timerState: timerState || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('GET sessions error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePOST(req, email, body) {
  try {
    // Handle sessions + settings sync
    if (body.sessions !== undefined && body.settings !== undefined) {
      sanitizeData(body.sessions);
      sanitizeData(body.settings);

      await Promise.all([
        kv.setex(`user:${email}:sessions`, COOKIE_MAX_AGE, JSON.stringify(body.sessions)),
        kv.setex(`user:${email}:settings`, COOKIE_MAX_AGE, JSON.stringify(body.settings))
      ]);

      return new Response('', {
        status: 204,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle timerState push/clear
    if (body.timerState !== undefined) {
      if (body.timerState === null) {
        // Clear timer state
        await kv.del(`user:${email}:timerState`);
      } else {
        // Validate timer state structure
        if (typeof body.timerState !== 'object') {
          return new Response(JSON.stringify({ error: 'Invalid timerState' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        sanitizeData(body.timerState);

        await kv.setex(
          `user:${email}:timerState`,
          COOKIE_MAX_AGE,
          JSON.stringify(body.timerState)
        );
      }

      return new Response('', {
        status: 204,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('POST sessions error:', e);

    if (e.message.includes('exceeds maximum size')) {
      return new Response(JSON.stringify({ error: 'Data too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

  if (req.method === 'GET') {
    return await handleGET(req, email);
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      return await handlePOST(req, email, body);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
