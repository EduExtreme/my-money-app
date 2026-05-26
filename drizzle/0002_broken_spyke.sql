CREATE TABLE "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"instance_name" text NOT NULL,
	"remote_jid" text NOT NULL,
	"phone" text NOT NULL,
	"direction" text NOT NULL,
	"text" text,
	"event" text,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_pending_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"action_type" text NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb NOT NULL,
	"source_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_messages_message_id_idx" ON "whatsapp_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_phone_idx" ON "whatsapp_messages" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "whatsapp_pending_actions_phone_status_idx" ON "whatsapp_pending_actions" USING btree ("phone","status");--> statement-breakpoint
CREATE INDEX "whatsapp_pending_actions_expires_at_idx" ON "whatsapp_pending_actions" USING btree ("expires_at");