export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: 'Configuration missing' });
  }

  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).json({ clientId });
}
