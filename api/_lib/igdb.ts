// Twitch app access token cache. Module scope persists across warm invocations.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getTwitchToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'IGDB credentials not configured. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in Vercel env.',
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });
  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Twitch token failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };

  tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return data.access_token;
}

export type IgdbGame = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  releaseYear: number | null;
  summary: string | null;
};

type RawIgdbGame = {
  id: number;
  name: string;
  cover?: { image_id: string };
  platforms?: { name: string }[];
  first_release_date?: number;
  summary?: string;
};

function normalize(g: RawIgdbGame): IgdbGame {
  return {
    igdbId: g.id,
    name: g.name,
    coverUrl: g.cover?.image_id
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : null,
    platforms: g.platforms?.map((p) => p.name) ?? [],
    releaseYear: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
    summary: g.summary ?? null,
  };
}

async function igdbCall(query: string, retried = false): Promise<RawIgdbGame[]> {
  const clientId = process.env.TWITCH_CLIENT_ID!;
  const token = await getTwitchToken();
  const res = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: query,
  });

  if (res.status === 401 && !retried) {
    tokenCache = null;
    return igdbCall(query, true);
  }

  if (!res.ok) throw new Error(`IGDB ${res.status}: ${await res.text()}`);
  return (await res.json()) as RawIgdbGame[];
}

export async function searchIgdb(query: string): Promise<IgdbGame[]> {
  const safe = query.replace(/"/g, '\\"').slice(0, 100);
  if (!safe.trim()) return [];
  const body = `search "${safe}"; fields id,name,cover.image_id,platforms.name,first_release_date,summary; limit 20;`;
  const raw = await igdbCall(body);
  return raw.map(normalize);
}

export async function fetchIgdbGame(igdbId: number): Promise<IgdbGame | null> {
  const body = `where id = ${igdbId}; fields id,name,cover.image_id,platforms.name,first_release_date,summary; limit 1;`;
  const raw = await igdbCall(body);
  if (raw.length === 0) return null;
  return normalize(raw[0]);
}

export type Rail = 'popular' | 'upcoming' | 'top';

export async function fetchRail(rail: Rail, limit = 20): Promise<IgdbGame[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));
  const fields =
    'fields id,name,cover.image_id,platforms.name,first_release_date,summary,total_rating,total_rating_count,hypes';
  const nowSec = Math.floor(Date.now() / 1000);
  const ninetyDaysAgo = nowSec - 60 * 60 * 24 * 90;

  let where: string;
  let sort: string;
  if (rail === 'popular') {
    // Released in the last 90 days, well-rated, has a cover.
    where = `where first_release_date >= ${ninetyDaysAgo} & first_release_date <= ${nowSec} & cover != null & total_rating_count > 5`;
    sort = 'sort total_rating_count desc';
  } else if (rail === 'upcoming') {
    // Future release, has hype, has a cover.
    where = `where first_release_date > ${nowSec} & cover != null & hypes > 0`;
    sort = 'sort hypes desc';
  } else {
    // All-time top-rated with significant rating volume.
    where = `where total_rating_count > 500 & cover != null`;
    sort = 'sort total_rating desc';
  }

  const body = `${fields}; ${where}; ${sort}; limit ${safeLimit};`;
  const raw = await igdbCall(body);
  return raw.map(normalize);
}
