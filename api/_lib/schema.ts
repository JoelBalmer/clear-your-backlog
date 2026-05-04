import {
  pgTable,
  text,
  uuid,
  bigint,
  numeric,
  date,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  check,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    emailOptOut: boolean('email_opt_out').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('profiles_username_lower_idx').on(sql`lower(${t.username})`)],
);

export const gamesCache = pgTable('games_cache', {
  igdbId: bigint('igdb_id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  coverUrl: text('cover_url'),
  platforms: text('platforms').array(),
  releaseYear: bigint('release_year', { mode: 'number' }),
  summary: text('summary'),
  cachedAt: timestamp('cached_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userGames = pgTable(
  'user_games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    igdbId: bigint('igdb_id', { mode: 'number' })
      .notNull()
      .references(() => gamesCache.igdbId),
    rating: numeric('rating', { precision: 3, scale: 1 }),
    status: text('status').notNull(),
    playedOn: text('played_on'),
    notes: text('notes'),
    playedAt: date('played_at'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('user_games_user_igdb_unique').on(t.userId, t.igdbId),
    index('user_games_user_status_idx').on(t.userId, t.status),
    index('user_games_user_rating_idx').on(t.userId, sql`${t.rating} desc`),
    check('user_games_status_check', sql`${t.status} in ('backlog','playing','played','dropped','wishlist')`),
    check('user_games_rating_check', sql`${t.rating} is null or (${t.rating} >= 0.5 and ${t.rating} <= 10)`),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
  },
  (t) => [
    uniqueIndex('tags_user_name_unique').on(t.userId, t.name),
    index('tags_user_idx').on(t.userId),
  ],
);

export const userGameTags = pgTable(
  'user_game_tags',
  {
    userGameId: uuid('user_game_id')
      .notNull()
      .references(() => userGames.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.userGameId, t.tagId] }),
    index('user_game_tags_user_game_idx').on(t.userGameId),
    index('user_game_tags_tag_idx').on(t.tagId),
  ],
);

export const follows = pgTable(
  'follows',
  {
    followerId: text('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followingId: text('following_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index('follows_following_idx').on(t.followingId),
    check('follows_no_self_follow', sql`${t.followerId} <> ${t.followingId}`),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Game = typeof gamesCache.$inferSelect;
export type NewGame = typeof gamesCache.$inferInsert;
export type UserGame = typeof userGames.$inferSelect;
export type NewUserGame = typeof userGames.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
