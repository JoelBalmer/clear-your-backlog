import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from '../_lib/db.js';
import { gamesCache } from '../_lib/schema.js';
import { requireAuth, setCors } from '../_lib/auth.js';
import { fetchIgdbGame } from '../_lib/igdb.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  const igdbId = Number(req.query.igdbId);
  if (!Number.isFinite(igdbId) || igdbId <= 0)
    return res.status(400).json({ error: 'invalid_igdb_id' });

  const [cached] = await db.select().from(gamesCache).where(eq(gamesCache.igdbId, igdbId)).limit(1);
  if (cached) return res.status(200).json({ game: cached });

  // Not in cache; try fetching from IGDB.
  try {
    const fresh = await fetchIgdbGame(igdbId);
    if (!fresh) return res.status(404).json({ error: 'not_found' });
    const [stored] = await db
      .insert(gamesCache)
      .values({
        igdbId: fresh.igdbId,
        name: fresh.name,
        coverUrl: fresh.coverUrl,
        platforms: fresh.platforms,
        releaseYear: fresh.releaseYear,
        summary: fresh.summary,
      })
      .returning();
    return res.status(200).json({ game: stored });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: 'igdb_fetch_failed', detail: msg });
  }
}
