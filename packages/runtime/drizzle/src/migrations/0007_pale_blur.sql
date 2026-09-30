ALTER TYPE "public"."validation_status" ADD VALUE 'invalid_markers' BEFORE 'invalid_qr';--> statement-breakpoint
ALTER TABLE "ballot_scan_results" DROP COLUMN "s3_url";