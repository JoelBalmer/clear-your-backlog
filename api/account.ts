import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { db } from './_lib/db.js';
import { profiles } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

// DELETE /api/account
// Hard-deletes the caller: profile row first (cascades to user_games, tags,
// follows), then the Clerk user. Frontend should sign out after this returns.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  // Wipe app data first; if the Clerk delete fails afterwards we'd rather have
  // an orphan Clerk user than an orphan profile row.
  try {
    await db.delete(profiles).where(eq(profiles.id, me.userId));
  } catch (err) {
    console.error('[account] profile delete failed:', err);
    return res.status(500).json({ error: 'profile_delete_failed' });
  }

  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    });
    await clerk.users.deleteUser(me.userId);
  } catch (err) {
    console.error('[account] clerk delete failed:', err);
    // Profile is already gone; client will sign out and the Clerk user is harmless.
    return res.status(207).json({ ok: true, warning: 'profile_deleted_clerk_failed' });
  }

  return res.status(200).json({ ok: true });
}
