import { kv } from '@vercel/kv';
import { jwtVerify } from 'jose';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev-secret');
const DISC_VERSION = '1.0';
const MAX_BETA_USERS = 10;
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Rate limiter: max 60 requests per minute per IP
const rateLimitStore = new Map();

function rateLimit(key) {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const limitKey = `${key}:${minute}`;

  if (!rateLimitStore.has(limitKey)) {
    rateLimitStore.set(limitKey, 0);
  }

  const count = rateLimitStore.get(limitKey);
  if (count >= 60) {
    return false;
  }

  rateLimitStore.set(limitKey, count + 1);

  // Clean up old entries every 100 requests
  if (rateLimitStore.size > 100) {
    const cutoff = minute - 2;
    for (const [k] of rateLimitStore) {
      const m = parseInt(k.split(':')[1]);
      if (m < cutoff) rateLimitStore.delete(k);
    }
  }

  return true;
}

function getCookie(name, cookieString) {
  if (!cookieString) return null;
  const cookies = cookieString.split('; ').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
  return cookies[name] || null;
}

function setCookie(name, value, maxAge = COOKIE_MAX_AGE) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

async function validateGoogleToken(token) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' + token);
    if (!response.ok) return null;

    const data = await response.json();

    // Verify the token is for our client ID
    if (data.aud !== GOOGLE_CLIENT_ID) return null;

    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      sub: data.sub
    };
  } catch (e) {
    console.error('Google token validation error:', e);
    return null;
  }
}

async function getUserBetaStatus(email) {
  try {
    const user = await kv.get(`user:${email}`);
    return user?.betaAccepted || false;
  } catch (e) {
    console.error('Error checking beta status:', e);
    return false;
  }
}

async function getBetaUserCount() {
  try {
    const keys = await kv.keys('user:*');
    let count = 0;
    for (const key of keys) {
      const user = await kv.get(key);
      if (user?.betaAccepted) count++;
    }
    return count;
  } catch (e) {
    console.error('Error counting beta users:', e);
    return 0;
  }
}

async function addUserToBeta(email, name, picture) {
  try {
    const betaCount = await getBetaUserCount();
    if (betaCount >= MAX_BETA_USERS) {
      return false;
    }

    const user = {
      email,
      name,
      picture,
      betaAccepted: true,
      createdAt: new Date().toISOString()
    };

    await kv.set(`user:${email}`, user);
    return true;
  } catch (e) {
    console.error('Error adding user to beta:', e);
    return false;
  }
}

async function handleGET(res) {
  return res.status(200).json({
    authenticated: false,
    user: null,
    disclaimerVersion: null
  });
}

async function handleGETWithSession(req, res) {
  const cookies = req.headers.cookie || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return res.status(200).json({
      authenticated: false,
      user: null,
      disclaimerVersion: null
    });
  }

  try {
    const session = await kv.get(`session:${sessionToken}`);
    if (!session) {
      return res.status(200).json({
        authenticated: false,
        user: null,
        disclaimerVersion: null
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: session.user,
      disclaimerVersion: session.disclaimerVersion || null
    });
  } catch (e) {
    console.error('Session retrieval error:', e);
    return res.status(200).json({
      authenticated: false,
      user: null,
      disclaimerVersion: null
    });
  }
}

async function handlePOSTLogin(req, res, body) {
  if (!body.credential) {
    return res.status(400).json({ error: 'Missing credential' });
  }

  const user = await validateGoogleToken(body.credential);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    const isBetaUser = await getUserBetaStatus(user.email);

    if (!isBetaUser) {
      const betaCount = await getBetaUserCount();
      if (betaCount >= MAX_BETA_USERS) {
        // Add to waitlist instead
        await kv.sadd('waitlist:emails', user.email);
        await kv.hset(`waitlist:${user.email}`, {
          name: user.name,
          email: user.email,
          joinedAt: new Date().toISOString()
        });

        return res.status(200).json({
          authenticated: false,
          waitlist: true,
          user: null,
          disclaimerVersion: null
        });
      }

      // Accept user as beta
      const success = await addUserToBeta(user.email, user.name, user.picture);
      if (!success) {
        return res.status(200).json({
          authenticated: false,
          waitlist: true,
          user: null,
          disclaimerVersion: null
        });
      }
    }

    // Create session
    const sessionToken = Buffer.from(
      Math.random().toString() + Date.now().toString()
    ).toString('base64');

    const session = {
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      disclaimerVersion: null,
      createdAt: new Date().toISOString()
    };

    await kv.setex(`session:${sessionToken}`, COOKIE_MAX_AGE, JSON.stringify(session));

    // Set cookies using proper Node.js response headers
    res.setHeader('Set-Cookie', [
      setCookie('bm_sid', sessionToken),
      setCookie('bm_uid', Buffer.from(user.email).toString('base64'))
    ]);

    return res.status(200).json({
      authenticated: true,
      waitlist: false,
      user: session.user,
      disclaimerVersion: null
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function handlePOSTAction(req, res, body) {
  const cookies = req.headers.cookie || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (body.action === 'accept_disclaimer') {
    if (!body.version) {
      return res.status(400).json({ error: 'Missing version' });
    }

    try {
      const session = await kv.get(`session:${sessionToken}`);
      if (!session) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      session.disclaimerVersion = body.version;
      await kv.setex(`session:${sessionToken}`, COOKIE_MAX_AGE, JSON.stringify(session));

      return res.status(204).end();
    } catch (e) {
      console.error('Disclaimer acceptance error:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (body.action === 'join_waitlist') {
    if (!body.email || !body.name) {
      return res.status(400).json({ error: 'Missing email or name' });
    }

    try {
      await kv.sadd('waitlist:emails', body.email);
      await kv.hset(`waitlist:${body.email}`, {
        name: body.name,
        email: body.email,
        joinedAt: new Date().toISOString()
      });

      return res.status(204).end();
    } catch (e) {
      console.error('Waitlist join error:', e);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}

async function handleDELETE(req, res) {
  const cookies = req.headers.cookie || '';
  const sessionToken = getCookie('bm_sid', cookies);

  try {
    if (sessionToken) {
      await kv.del(`session:${sessionToken}`);
    }
  } catch (e) {
    console.error('Session deletion error:', e);
  }

  res.setHeader('Set-Cookie', [
    clearCookie('bm_sid'),
    clearCookie('bm_uid')
  ]);

  return res.status(204).end();
}

export default async function handler(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

  if (!rateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGETWithSession(req, res);
    }

    if (req.method === 'POST') {
      let body = {};
      try {
        body = req.body || {};
      } catch (e) {
        // Body parse error, continue with empty body
      }

      // If credential field exists, it's a login request
      if (body.credential) {
        return await handlePOSTLogin(req, res, body);
      }

      // Otherwise it's an action request
      return await handlePOSTAction(req, res, body);
    }

    if (req.method === 'DELETE') {
      return await handleDELETE(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Auth handler error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
