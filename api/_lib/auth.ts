import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';

export type AuthedUser = { userId: string };

let _clerk: ReturnType<typeof createClerkClient> | null = null;
function clerk() {
  if (_clerk) return _clerk;
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    throw new Error('Missing CLERK_SECRET_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }
  _clerk = createClerkClient({ secretKey, publishableKey });
  return _clerk;
}

function toWebRequest(req: VercelRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = (req.headers['x-forwarded-host'] as string) ?? req.headers.host ?? 'localhost';
  const url = `${proto}://${host}${req.url ?? '/'}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
    else if (Array.isArray(v)) headers.set(k, v.join(', '));
  }
  return new Request(url, { headers, method: req.method });
}

type AuthFailure = { reason: 'no_session' | 'verify_error'; detail?: string };

export async function getAuthedUser(
  req: VercelRequest,
): Promise<{ user: AuthedUser } | { error: AuthFailure }> {
  try {
    const requestState = await clerk().authenticateRequest(toWebRequest(req), {
      acceptsToken: 'session_token',
    });
    const auth = requestState.toAuth();
    if (!auth?.userId) {
      return { error: { reason: 'no_session', detail: requestState.reason ?? undefined } };
    }
    return { user: { userId: auth.userId } };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[auth] authenticateRequest failed:', detail);
    return { error: { reason: 'verify_error', detail } };
  }
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<AuthedUser | null> {
  const result = await getAuthedUser(req);
  if ('error' in result) {
    res.status(401).json({
      error: 'unauthorized',
      reason: result.error.reason,
      detail: result.error.detail,
    });
    return null;
  }
  return result.user;
}

export function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}
