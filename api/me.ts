import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { profiles } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.userId)).limit(1);

  if (!profile) return res.status(200).json({ profile: null, needsOnboarding: true });
  return res.status(200).json({ profile, needsOnboarding: false });
}
