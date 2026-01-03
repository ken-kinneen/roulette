import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'roulette:leaderboard';
const MAX_ENTRIES = 100;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get leaderboard
      const leaderboard = await kv.get(LEADERBOARD_KEY) || [];
      return res.status(200).json({ leaderboard });
    }

    if (req.method === 'POST') {
      // Add new entry
      const { name, rounds } = req.body;

      if (!name || typeof rounds !== 'number') {
        return res.status(400).json({ error: 'Name and rounds are required' });
      }

      // Sanitize name (max 20 chars, alphanumeric + spaces)
      const sanitizedName = name.slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '').trim();
      
      if (!sanitizedName) {
        return res.status(400).json({ error: 'Invalid name' });
      }

      // Get current leaderboard
      let leaderboard = await kv.get(LEADERBOARD_KEY) || [];

      // Add new entry
      const entry = {
        id: Date.now().toString(),
        name: sanitizedName,
        rounds,
        date: new Date().toISOString(),
      };

      leaderboard.push(entry);
      
      // Sort by rounds (descending) and keep top entries
      leaderboard.sort((a, b) => b.rounds - a.rounds);
      leaderboard = leaderboard.slice(0, MAX_ENTRIES);

      // Save back to KV
      await kv.set(LEADERBOARD_KEY, leaderboard);

      // Find the rank of the new entry
      const rank = leaderboard.findIndex(e => e.id === entry.id) + 1;

      return res.status(200).json({ 
        success: true, 
        entry,
        rank,
        leaderboard: leaderboard.slice(0, 10) // Return top 10
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

