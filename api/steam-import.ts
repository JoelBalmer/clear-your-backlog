import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

type IgdbMatchResult = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  releaseYear: number | null;
  summary: string | null;
};

type SteamGame = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  igdbMatch: IgdbMatchResult | null;
  matchConfidence: 'exact' | 'likely' | 'none';
};

// Placeholder library used until a real Steam API key is configured.
// IGDB IDs are real so games can be added to the library immediately.
const MOCK_GAMES: SteamGame[] = [
  {
    steamAppId: 367520,
    steamName: 'Hollow Knight',
    playtimeMinutes: 1247,
    igdbMatch: {
      igdbId: 1150,
      name: 'Hollow Knight',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
      releaseYear: 2017,
      summary: 'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 1091500,
    steamName: 'Cyberpunk 2077',
    playtimeMinutes: 5220,
    igdbMatch: {
      igdbId: 1877,
      name: 'Cyberpunk 2077',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'PlayStation 4', 'Xbox One', 'PlayStation 5', 'Xbox Series X|S'],
      releaseYear: 2020,
      summary: 'An open-world, action-adventure story set in Night City, a megalopolis obsessed with power, glamour and body modification.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 292030,
    steamName: 'The Witcher 3: Wild Hunt',
    playtimeMinutes: 6720,
    igdbMatch: {
      igdbId: 1942,
      name: 'The Witcher 3: Wild Hunt',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'PlayStation 4', 'Xbox One', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S'],
      releaseYear: 2015,
      summary: 'Become a professional monster slayer and embark on an adventure of epic proportions in a war-ravaged open world.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 413150,
    steamName: 'Stardew Valley',
    playtimeMinutes: 20400,
    igdbMatch: {
      igdbId: 17000,
      name: 'Stardew Valley',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'Mac', 'Linux', 'PlayStation 4', 'Xbox One', 'Nintendo Switch', 'iOS', 'Android'],
      releaseYear: 2016,
      summary: "You've inherited your grandfather's old farm plot in Stardew Valley. Armed with hand-me-down tools and a few coins, you set out to begin your new life.",
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 620,
    steamName: 'Portal 2',
    playtimeMinutes: 900,
    igdbMatch: {
      igdbId: 5765,
      name: 'Portal 2',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'Mac', 'Linux', 'PlayStation 3', 'Xbox 360'],
      releaseYear: 2011,
      summary: 'Portal 2 draws from the award-winning formula of innovative gameplay, story, and music that earned the original Portal over 70 industry accolades.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 1593500,
    steamName: 'God of War',
    playtimeMinutes: 1980,
    igdbMatch: {
      igdbId: 26192,
      name: 'God of War (2018)',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'PlayStation 4', 'PlayStation 5'],
      releaseYear: 2018,
      summary: 'His vengeance against the Gods of Olympus far behind him, Kratos now lives as a man in the realm of Norse Gods and monsters.',
    },
    matchConfidence: 'likely',
  },
  {
    steamAppId: 548430,
    steamName: 'Deep Rock Galactic',
    playtimeMinutes: 9360,
    igdbMatch: {
      igdbId: 106774,
      name: 'Deep Rock Galactic',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'Xbox One', 'Xbox Series X|S', 'PlayStation 4', 'PlayStation 5'],
      releaseYear: 2020,
      summary: 'Space Dwarves VS bugs. Work together as a team to dig, fight, and complete missions across procedurally generated cave systems.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 105600,
    steamName: 'Terraria',
    playtimeMinutes: 5340,
    igdbMatch: {
      igdbId: 248,
      name: 'Terraria',
      coverUrl: null,
      platforms: ['PC (Microsoft Windows)', 'Mac', 'Linux', 'PlayStation 3', 'PlayStation 4', 'Xbox 360', 'Xbox One', 'iOS', 'Android', 'Nintendo Switch'],
      releaseYear: 2011,
      summary: 'Dig, fight, explore, build! Nothing is impossible in this action-packed adventure game.',
    },
    matchConfidence: 'exact',
  },
  {
    steamAppId: 484750,
    steamName: 'My Little Blacksmith Shop',
    playtimeMinutes: 234,
    igdbMatch: null,
    matchConfidence: 'none',
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
  const steamId = String(body.steamId ?? '').trim();
  if (!steamId) return res.status(400).json({ error: 'missing_steam_id' });

  // Filter out games the user already has in their library.
  const igdbIds = MOCK_GAMES.filter((g) => g.igdbMatch).map((g) => g.igdbMatch!.igdbId);

  let ownedIgdbIds = new Set<number>();
  if (igdbIds.length > 0) {
    try {
      const owned = await db
        .select({ igdbId: userGames.igdbId })
        .from(userGames)
        .where(and(eq(userGames.userId, me.userId), inArray(userGames.igdbId, igdbIds)));
      ownedIgdbIds = new Set(owned.map((o) => o.igdbId));
    } catch (err) {
      console.error('[steam-import] duplicate check failed:', err);
    }
  }

  const games = MOCK_GAMES.filter((g) => !g.igdbMatch || !ownedIgdbIds.has(g.igdbMatch.igdbId));
  const alreadyOwnedCount = MOCK_GAMES.length - games.length;

  return res.status(200).json({ games, alreadyOwnedCount });
}
