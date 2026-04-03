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

async function handleGET(req) {
  const cookies = req.headers.get('cookie') || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return new Response(JSON.stringify({
      authenticated: false,
      user: null,
      disclaimerVersion: null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const session = await kv.get(`session:${sessionToken}`);
    if (!session) {
      return new Response(JSON.stringify({
        authenticated: false,
        user: null,
        disclaimerVersion: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: session.user,
      disclaimerVersion: session.disclaimerVersion || null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Session retrieval error:', e);
    return new Response(JSON.stringify({
      authenticated: false,
      user: null,
      disclaimerVersion: null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePOSTLogin(req, body) {
  if (!body.credential) {
    return new Response(JSON.stringify({ error: 'Missing credential' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const user = await validateGoogleToken(body.credential);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
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

        return new Response(JSON.stringify({
          authenticated: false,
          waitlist: true,
          user: null,
          disclaimerVersion: null
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Accept user as beta
      const success = await addUserToBeta(user.email, user.name, user.picture);
      if (!success) {
        return new Response(JSON.stringify({
          authenticated: false,
          waitlist: true,
          user: null,
          disclaimerVersion: null
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
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

    // Also set user ID cookie
    const userIdToken = Buffer.from(user.email).toString('base64');

    const cookies = [
      setCookie('bm_sid', sessionToken),
      setCookie('bm_uid', userIdToken)
    ];

    return new Response(JSON.stringify({
      authenticated: true,
      waitlist: false,
      user: session.user,
      disclaimerVersion: null
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookies
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePOSTAction(req, body) {
  const cookies = req.headers.get('cookie') || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (body.action === 'accept_disclaimer') {
    if (!body.version) {
      return new Response(JSON.stringify({ error: 'Missing version' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const session = await kv.get(`session:${sessionToken}`);
      if (!session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      session.disclaimerVersion = body.version;
      await kv.setex(`session:${sessionToken}`, COOKIE_MAX_AGE, JSON.stringify(session));

      return new Response('', {
        status: 204,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('Disclaimer acceptance error:', e);
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (body.action === 'join_waitlist') {
    if (!body.email || !body.name) {
      return new Response(JSON.stringify({ error: 'Missing email or name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      await kv.sadd('waitlist:emails', body.email);
      await kv.hset(`waitlist:${body.email}`, {
        name: body.name,
        email: body.email,
        joinedAt: new Date().toISOString()
      });

      return new Response('', {
        status: 204,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('Waitlist join error:', e);
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDELETE(req) {
  const cookies = req.headers.get('cookie') || '';
  const sessionToken = getCookie('bm_sid', cookies);

  if (!sessionToken) {
    return new Response('', {
      status: 204,
      headers: {
        'Set-Cookie': [clearCookie('bm_sid'), clearCookie('bm_uid')]
      }
    });
  }

  try {
    await kv.del(`session:${sessionToken}`);
  } catch (e) {
    console.error('Session deletion error:', e);
  }

  return new Response('', {
    status: 204,
    headers: {
      'Set-Cookie': [clearCookie('bm_sid'), clearCookie('bm_uid')]
    }
  });
}

export default async function handler(req, res) {
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (!rateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (req.method === 'GET') {
      return await handleGET(req);
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      // If credential field exists, it's a login request
      if (body.credential) {
        return await handlePOSTLogin(req, body);
      }

      // Otherwise it's an action request
      return await handlePOSTAction(req, body);
    }

    if (req.method === 'DELETE') {
      return await handleDELETE(req);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('Auth handler error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
