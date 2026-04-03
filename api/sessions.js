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
    return session.user.email;
  } catch (e) {
    console.error('Session auth error:', e);
    return null;
  }
}

async function handleGET(res, email) {
  try {
    const [settings, sessions, timerState] = await Promise.all([
      kv.get(`user:${email}:settings`),
      kv.get(`user:${email}:sessions`),
      kv.get(`user:${email}:timerState`)
    ]);

    return res.status(200).json({
      settings: settings || null,
      sessions: sessions || [],
      timerState: timerState || null
    });
  } catch (e) {
    console.error('GET sessions error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function handlePOST(res, email, body) {
  try {
    // Handle sessions + settings sync
    if (body.sessions !== undefined && body.settings !== undefined) {
      sanitizeData(body.sessions);
      sanitizeData(body.settings);

      await Promise.all([
        kv.setex(`user:${email}:sessions`, COOKIE_MAX_AGE, JSON.stringify(body.sessions)),
        kv.setex(`user:${email}:settings`, COOKIE_MAX_AGE, JSON.stringify(body.settings))
      ]);

      return res.status(204).end();
    }

    // Handle timerState push/clear
    if (body.timerState !== undefined) {
      if (body.timerState === null) {
        // Clear timer state
        await kv.del(`user:${email}:timerState`);
      } else {
        // Validate timer state structure
        if (typeof body.timerState !== 'object') {
          return res.status(400).json({ error: 'Invalid timerState' });
        }

        sanitizeData(body.timerState);

        await kv.setex(
          `user:${email}:timerState`,
          COOKIE_MAX_AGE,
          JSON.stringify(body.timerState)
        );
      }

      return res.status(204).end();
    }

    return res.status(400).json({ error: 'Invalid request body' });
  } catch (e) {
    console.error('POST sessions error:', e);

    if (e.message.includes('exceeds maximum size')) {
      return res.status(413).json({ error: 'Data too large' });
    }

    return res.status(500).json({ error: 'Server error' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = await authenticateSession(req);

  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (req.method === 'GET') {
    return await handleGET(res, email);
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      return await handlePOST(res, email, body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
}
