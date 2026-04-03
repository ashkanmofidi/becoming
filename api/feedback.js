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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = await authenticateSession(req);

  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const body = req.body || {};

    // Validate feedback structure
    if (!body.type || !body.message) {
      return res.status(400).json({ error: 'Missing type or message' });
    }

    const type = sanitizeText(body.type, 100);
    const message = sanitizeText(body.message, 5000);

    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message cannot be empty' });
    }

    const feedback = {
      email,
      type,
      message,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    };

    // Store in feedback list and by user email
    const feedbackId = Buffer.from(`${email}:${Date.now()}`).toString('base64');

    await Promise.all([
      kv.lpush('feedback:all', JSON.stringify(feedback)),
      kv.setex(`feedback:${feedbackId}`, COOKIE_MAX_AGE, JSON.stringify(feedback))
    ]);

    return res.status(204).end();
  } catch (e) {
    console.error('Feedback submission error:', e);

    if (e instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    return res.status(500).json({ error: 'Server error' });
  }
}
