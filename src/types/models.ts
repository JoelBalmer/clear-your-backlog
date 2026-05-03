// Plain types for frontend use. The DB schema (Drizzle table definitions)
// lives server-side in api/_lib/schema.ts; this module duplicates the shapes
// without pulling in drizzle-orm so frontend bundles stay small.
//
// Numeric and timestamp fields come back from the API as strings (Postgres
// numeric -> string in JSON, timestamp -> ISO string).

export type GameStatus = 'backlog' | 'playing' | 'played' | 'dropped';

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  emailOptOut: boolean;
  createdAt: string;
};

export type Game = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[] | null;
  releaseYear: number | null;
  summary: string | null;
  cachedAt: string;
};

export type UserGame = {
  id: string;
  userId: string;
  igdbId: number;
  rating: string | null;
  status: GameStatus;
  playedOn: string | null;
  notes: string | null;
  playedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string | null;
};

export type Follow = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

// Result shape for /api/igdb-search
export type IgdbResult = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  releaseYear: number | null;
  summary: string | null;
};

// Result shape for /api/user-games (joined with games_cache, includes tag IDs)
export type UserGameWithGame = {
  userGame: UserGame;
  game: Game;
  tagIds?: string[];
};

// Result shape for /api/feed
export type FeedItem = {
  userGame: UserGame;
  game: Game;
  actor: Profile;
};

// Result shape for /api/follows
export type FollowItem = {
  profile: Profile;
  since: string;
};

// Result shape for /api/users/:username
export type PublicProfile = {
  profile: Profile;
  counts: { followers: number; following: number; gamesPlayed: number };
  isFollowing: boolean;
  isSelf: boolean;
};

// Result shape for /api/game-friends
export type FriendPlayedItem = {
  profile: Profile;
  userGame: UserGame;
};
