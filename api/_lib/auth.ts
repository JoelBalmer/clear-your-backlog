import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '@clerk/backend';

export type AuthedUser = { userId: string };

export async function getAuthedUser(req: VercelRequest): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    if (!payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthedUser | null> {
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return user;
}

export function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}
