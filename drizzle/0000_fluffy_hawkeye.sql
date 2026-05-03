CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id"),
	CONSTRAINT "follows_no_self_follow" CHECK ("follows"."follower_id" <> "follows"."following_id")
);
--> statement-breakpoint
CREATE TABLE "games_cache" (
	"igdb_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cover_url" text,
	"platforms" text[],
	"release_year" bigint,
	"summary" text,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "user_game_tags" (
	"user_game_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "user_game_tags_user_game_id_tag_id_pk" PRIMARY KEY("user_game_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"igdb_id" bigint NOT NULL,
	"rating" numeric(3, 1),
	"status" text NOT NULL,
	"played_on" text,
	"notes" text,
	"played_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_games_status_check" CHECK ("user_games"."status" in ('backlog','playing','played','dropped')),
	CONSTRAINT "user_games_rating_check" CHECK ("user_games"."rating" is null or ("user_games"."rating" >= 0.5 and "user_games"."rating" <= 10))
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_profiles_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_profiles_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_tags" ADD CONSTRAINT "user_game_tags_user_game_id_user_games_id_fk" FOREIGN KEY ("user_game_id") REFERENCES "public"."user_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_tags" ADD CONSTRAINT "user_game_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_igdb_id_games_cache_igdb_id_fk" FOREIGN KEY ("igdb_id") REFERENCES "public"."games_cache"("igdb_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_username_lower_idx" ON "profiles" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_unique" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "tags_user_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_game_tags_user_game_idx" ON "user_game_tags" USING btree ("user_game_id");--> statement-breakpoint
CREATE INDEX "user_game_tags_tag_idx" ON "user_game_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_games_user_igdb_unique" ON "user_games" USING btree ("user_id","igdb_id");--> statement-breakpoint
CREATE INDEX "user_games_user_status_idx" ON "user_games" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "user_games_user_rating_idx" ON "user_games" USING btree ("user_id","rating" desc);