ALTER TABLE "user_games" DROP CONSTRAINT "user_games_status_check";--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_status_check" CHECK ("user_games"."status" in ('backlog','playing','played','dropped','wishlist'));
