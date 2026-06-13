CREATE TYPE "public"."rsvp_attendance" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."rsvp_side" AS ENUM('groom', 'bride');--> statement-breakpoint
CREATE TABLE "guest_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"key" text NOT NULL,
	"uploader_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"pin_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rsvp_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"attendance" "rsvp_attendance" NOT NULL,
	"side" "rsvp_side",
	"headcount" integer,
	"meal" text,
	"phone" text,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest_uploads" ADD CONSTRAINT "guest_uploads_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ADD CONSTRAINT "guestbook_entries_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_uploads_invitation_id_idx" ON "guest_uploads" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "guestbook_entries_invitation_id_idx" ON "guestbook_entries" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "rsvp_responses_invitation_id_idx" ON "rsvp_responses" USING btree ("invitation_id");