const { getUserIdFromCookie } = require('./auth');

let kv = null;
try { kv = require('@vercel/kv'); } catch (e) {}

const ADMINS_KEY = 'bm:admins';
const PRIMARY_ADMIN = process.env.ADMIN_EMAIL || 'ashkan.mofidi@gmail.com';

async function getAdminEmails() {
  const stored = (kv && process.env.KV_REST_API_URL) ? (await kv.get(ADMINS_KEY) || []) : [];
  const all = new Set([PRIMARY_ADMIN.toLowerCase(), ...stored.map(e => e.toLowerCase())]);
  all.delete('');
  return [...all];
}

async function isAdmin(uid) {
  if (!kv || !process.env.KV_REST_API_URL) return false;
  const users = await kv.get('bm:users') || {};
  if (!users[uid]) return false;
  const email = (users[uid].email || '').toLowerCase();
  const admins = await getAdminEmails();
  return admins.includes(email);
}

function isPrimaryAdmin(email) {
  return PRIMARY_ADMIN.toLowerCase() === (email || '').toLowerCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const uid = getUserIdFromCookie(req.headers.cookie);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  if (!kv || !process.env.KV_REST_API_URL) return res.status(503).json({ error: 'Database not configured' });

  const admin = await isAdmin(uid);
  if (!admin) return res.status(403).json({ error: 'Admin access only' });

  const users = await kv.get('bm:users') || {};
  const currentEmail = (users[uid] && users[uid].email) || '';

  // POST: admin management
  if (req.method === 'POST') {
    if (!isPrimaryAdmin(currentEmail)) {
      return res.status(403).json({ error: 'Only the primary admin can manage admin access' });
    }
    const { action, email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });

    const stored = await kv.get(ADMINS_KEY) || [];

    if (action === 'add_admin') {
      const lower = email.toLowerCase();
      if (!stored.includes(lower)) {
        stored.push(lower);
        await kv.set(ADMINS_KEY, stored);
      }
      return res.status(200).json({ success: true, admins: await getAdminEmails() });
    }

    if (action === 'remove_admin') {
      const lower = email.toLowerCase();
      if (isPrimaryAdmin(lower)) return res.status(400).json({ error: 'Cannot remove primary admin' });
      const filtered = stored.filter(e => e !== lower);
      await kv.set(ADMINS_KEY, filtered);
      return res.status(200).json({ success: true, admins: await getAdminEmails() });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  // GET: full analytics
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const waitlist = await kv.get('bm:waitlist') || [];
    const feedback = await kv.get('bm:feedback') || [];
    const adminEmails = await getAdminEmails();

    const now = Date.now();
    const DAY = 86400000;
    const WEEK = 7 * DAY;

    const userIds = Object.keys(users);
    const sessionPromises = userIds.map(id => kv.get(`bm:sessions:${id}`).catch(() => null));
    const allSessions = await Promise.all(sessionPromises);

    const userAnalytics = userIds.map((id, i) => {
      const u = users[id];
      const sessions = allSessions[i] || [];
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + ((s.duration || s.durationMin || 0) / (s.duration ? 60 : 1)), 0);
      const lastSessionDate = sessions.length > 0 ? (sessions[0].completedAt || sessions[0].endedAt || sessions[0].date) : null;
      const lastActive = lastSessionDate ? new Date(lastSessionDate).getTime() : (u.lastLogin ? new Date(u.lastLogin).getTime() : 0);
      const daysSinceActive = lastActive ? Math.floor((now - lastActive) / DAY) : 999;

      let status = 'churned';
      if (daysSinceActive <= 7) status = 'active';
      else if (daysSinceActive <= 30) status = 'dormant';

      const signupDate = u.createdAt ? new Date(u.createdAt).getTime() : now;
      const weeksSinceSignup = Math.max(1, Math.ceil((now - signupDate) / WEEK));
      const sessionsPerWeek = (totalSessions / weeksSinceSignup).toFixed(1);

      const categories = {};
      sessions.forEach(s => {
        const cat = s.category || 'Uncategorized';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      const last30 = [];
      for (let d = 29; d >= 0; d--) {
        const dayStart = now - (d + 1) * DAY;
        const dayEnd = now - d * DAY;
        const count = sessions.filter(s => {
          const t = new Date(s.completedAt || s.endedAt || s.date || 0).getTime();
          return t >= dayStart && t < dayEnd;
        }).length;
        last30.push(count);
      }

      return {
        id: id.slice(0, 8) + '...',
        fullId: id, name: u.name || 'Unknown', email: u.email || 'Unknown',
        photo: u.photo || null, createdAt: u.createdAt || null, lastLogin: u.lastLogin || null,
        lastSessionDate, disclaimerVersion: u.disclaimerVersion || null,
        totalSessions, totalMinutes: Math.round(totalMinutes),
        totalHours: (totalMinutes / 60).toFixed(1), status, daysSinceActive,
        sessionsPerWeek: parseFloat(sessionsPerWeek), categories, last30Days: last30
      };
    });

    const totalSessions = userAnalytics.reduce((s, u) => s + u.totalSessions, 0);
    const totalHours = userAnalytics.reduce((s, u) => s + parseFloat(u.totalHours), 0);
    const activeUsers = userAnalytics.filter(u => u.status === 'active').length;
    const dormantUsers = userAnalytics.filter(u => u.status === 'dormant').length;
    const churnedUsers = userAnalytics.filter(u => u.status === 'churned').length;

    const dauUsers = new Set(), wauUsers = new Set(), mauUsers = new Set();
    userIds.forEach((id, i) => {
      (allSessions[i] || []).forEach(s => {
        const t = new Date(s.completedAt || s.endedAt || s.date || 0).getTime();
        if (now - t < DAY) dauUsers.add(id);
        if (now - t < WEEK) wauUsers.add(id);
        if (now - t < 30 * DAY) mauUsers.add(id);
      });
    });

    const dailySessions = [], dailyActiveUsers = [];
    for (let d = 29; d >= 0; d--) {
      const dayStart = now - (d + 1) * DAY;
      const dayEnd = now - d * DAY;
      const dayUsers = new Set();
      let dayCount = 0;
      userIds.forEach((id, i) => {
        (allSessions[i] || []).forEach(s => {
          const t = new Date(s.completedAt || s.endedAt || s.date || 0).getTime();
          if (t >= dayStart && t < dayEnd) { dayCount++; dayUsers.add(id); }
        });
      });
      const dateLabel = new Date(dayEnd).toISOString().slice(5, 10);
      dailySessions.push({ date: dateLabel, count: dayCount });
      dailyActiveUsers.push({ date: dateLabel, count: dayUsers.size });
    }

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      currentAdmin: currentEmail,
      isPrimary: isPrimaryAdmin(currentEmail),
      adminEmails,
      overview: {
        totalUsers: userIds.length, maxUsers: parseInt(process.env.MAX_USERS || '10'),
        activeUsers, dormantUsers, churnedUsers, waitlistCount: waitlist.length,
        totalSessions, totalHours: totalHours.toFixed(1),
        dau: dauUsers.size, wau: wauUsers.size, mau: mauUsers.size
      },
      users: userAnalytics.sort((a, b) => b.totalSessions - a.totalSessions),
      waitlist, feedback: feedback.slice(-50).reverse(),
      charts: { dailySessions, dailyActiveUsers }
    });
  } catch (e) {
    console.error('Admin analytics error:', e.message);
    res.status(500).json({ error: 'Database error' });
  }
};
