/**
 * Express server that wraps the Vercel-style API handlers so the app can run
 * on Railway (or any Node.js host) without rewriting the API layer.
 *
 * VercelRequest / VercelResponse extend Node's IncomingMessage / ServerResponse,
 * which are also the base types for Express Request / Response — so the cast
 * to `any` below is safe and all existing handler code works unchanged.
 */
import express, { type Request, type Response } from 'express';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// API handlers — Vercel's file-based routing maps directly to these imports.
// Handlers that live under a [param] filename read the param from req.query,
// so we merge Express req.params into req.query before calling them.
import userGamesHandler from './api/user-games.js';
import userGamesIdHandler from './api/user-games/[id].js';
import gamesHandler from './api/games/[igdbId].js';
import igdbSearchHandler from './api/igdb-search.js';
import tagsHandler from './api/tags.js';
import profileHandler from './api/profile.js';
import followsHandler from './api/follows.js';
import feedHandler from './api/feed.js';
import accountHandler from './api/account.js';
import gameFriendsHandler from './api/game-friends.js';
import userGameTagsHandler from './api/user-game-tags.js';
import usersHandler from './api/users.js';
import steamImportHandler from './api/steam-import.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — Railway uses this to confirm the container is live.
app.get('/health', (_req, res) => res.json({ ok: true }));

// ── API routes ────────────────────────────────────────────────────────────────
// Dynamic-param routes must come before their prefix-only siblings so Express
// matches the more-specific path first.

app.all('/api/user-games/:id', (req: Request, res: Response) => {
  // req.query is a getter-only property on IncomingMessage's prototype in Express 5.
  // Object.assign would throw "Cannot set property query … which has only a getter".
  // Object.defineProperty shadows it with a plain own property instead.
  Object.defineProperty(req, 'query', {
    value: { ...req.query, id: req.params.id },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return userGamesIdHandler(req as any, res as any);
});
app.all('/api/user-games', (req: Request, res: Response) =>
  userGamesHandler(req as any, res as any),
);

app.all('/api/games/:igdbId', (req: Request, res: Response) => {
  Object.defineProperty(req, 'query', {
    value: { ...req.query, igdbId: req.params.igdbId },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  return gamesHandler(req as any, res as any);
});

app.all('/api/igdb-search', (req: Request, res: Response) =>
  igdbSearchHandler(req as any, res as any),
);
app.all('/api/tags', (req: Request, res: Response) => tagsHandler(req as any, res as any));
app.all('/api/profile', (req: Request, res: Response) => {
  console.log('[profile]', req.method, req.url, 'query:', JSON.stringify(req.query));
  for (const key of Object.keys(req.query)) {
    if (Array.isArray(req.query[key])) req.query[key] = (req.query[key] as string[])[0];
  }
  return profileHandler(req as any, res as any);
});
app.all('/api/follows', (req: Request, res: Response) => followsHandler(req as any, res as any));
app.all('/api/feed', (req: Request, res: Response) => feedHandler(req as any, res as any));
app.all('/api/account', (req: Request, res: Response) => accountHandler(req as any, res as any));
app.all('/api/game-friends', (req: Request, res: Response) =>
  gameFriendsHandler(req as any, res as any),
);
app.all('/api/user-game-tags', (req: Request, res: Response) =>
  userGameTagsHandler(req as any, res as any),
);
app.all('/api/users', (req: Request, res: Response) => usersHandler(req as any, res as any));
app.all('/api/steam-import', (req: Request, res: Response) =>
  steamImportHandler(req as any, res as any),
);

// ── Static frontend ───────────────────────────────────────────────────────────
// Serve the Vite build output and fall back to index.html for client-side routing.
const distPath = join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('{*path}', (_req, res) => res.sendFile(join(distPath, 'index.html')));

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
