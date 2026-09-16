CREATE TYPE "public"."role" AS ENUM('USER', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password" text NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
