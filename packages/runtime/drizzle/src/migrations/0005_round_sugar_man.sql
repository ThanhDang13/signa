CREATE TYPE "public"."validation_status" AS ENUM('valid', 'invalid_qr', 'invalid_selections', 'invalid_confidence');--> statement-breakpoint
CREATE TABLE "ballot_scan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"ballot_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"s3_key" text NOT NULL,
	"selections" jsonb NOT NULL,
	"qr_verified" boolean NOT NULL,
	"processing_metadata" jsonb NOT NULL,
	"validation_status" "validation_status" NOT NULL,
	"validation_errors" jsonb,
	"processed_at" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL,
	CONSTRAINT "ballot_scan_results_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "omr_processing_outbox" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "ballot_scan_results" ADD CONSTRAINT "ballot_scan_results_request_id_omr_processing_outbox_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."omr_processing_outbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ballot_scan_results_ballot_id_idx" ON "ballot_scan_results" USING btree ("ballot_id");--> statement-breakpoint
CREATE INDEX "ballot_scan_results_user_created_idx" ON "ballot_scan_results" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "omr_processing_outbox_active_ballot_idx" ON "omr_processing_outbox" USING btree ("ballot_id") WHERE "omr_processing_outbox"."status" IN ('pending', 'processing');
