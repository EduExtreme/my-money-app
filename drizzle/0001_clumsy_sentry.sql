CREATE TABLE "salaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_day" integer DEFAULT 5 NOT NULL,
	"start_month" text NOT NULL,
	"end_month" text,
	"account_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "salaries_start_month_idx" ON "salaries" USING btree ("start_month");--> statement-breakpoint
CREATE INDEX "salaries_status_idx" ON "salaries" USING btree ("status");