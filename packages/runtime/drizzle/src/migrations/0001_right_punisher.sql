CREATE TYPE "public"."election_status" AS ENUM('draft', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ballot_status" AS ENUM('pending', 'voted');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"form_structure" jsonb NOT NULL,
	"status" "election_status" DEFAULT 'draft' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"max_voters" integer,
	"created_by_id" uuid NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ballots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"signature" jsonb NOT NULL,
	"status" "ballot_status" DEFAULT 'pending' NOT NULL,
	"pdf_s3_key" text,
	"qr_code_data" text NOT NULL,
	"generated_at" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ballot_generation_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"election_id" uuid NOT NULL,
	"ballot_id" uuid NOT NULL,
	"timestamp" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"processed_at" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;