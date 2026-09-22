CREATE TYPE "appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "conversation_channel" AS ENUM('SMS', 'WEB_CHAT');--> statement-breakpoint
CREATE TYPE "conversation_status" AS ENUM('AI_ACTIVE', 'HUMAN_ACTIVE', 'WAITING_FOR_HUMAN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "demo_session_status" AS ENUM('ACTIVE', 'COMPLETED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('WEBSITE', 'GOOGLE_ADS', 'FACEBOOK', 'INSTAGRAM', 'YELP', 'GOOGLE_BUSINESS', 'THUMBTACK', 'HOMEADVISOR', 'ANGI', 'MANUAL_PHONE');--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'WAITING_FOR_HUMAN', 'BOOKED', 'LOST', 'CLOSED');--> statement-breakpoint
CREATE TYPE "lead_urgency" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "handoff_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "integration_provider" AS ENUM('TWILIO', 'TELNYX', 'GOOGLE_CALENDAR', 'HUBSPOT', 'SALESFORCE');--> statement-breakpoint
CREATE TYPE "integration_status" AS ENUM('ACTIVE', 'INACTIVE', 'ERROR');--> statement-breakpoint
CREATE TYPE "integration_type" AS ENUM('SMS', 'CALENDAR', 'CRM');--> statement-breakpoint
CREATE TYPE "property_type" AS ENUM('RESIDENTIAL', 'COMMERCIAL');--> statement-breakpoint
CREATE TYPE "message_sender_type" AS ENUM('CUSTOMER', 'AI', 'HUMAN');--> statement-breakpoint
CREATE TYPE "phone_number_provider" AS ENUM('TWILIO', 'TELNYX');--> statement-breakpoint
CREATE TYPE "phone_number_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "phone_number_type" AS ENUM('SMS', 'VOICE', 'BOTH');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING'::"appointment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text,
	"website" text,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"phone_number_id" uuid,
	"channel" "conversation_channel" NOT NULL,
	"status" "conversation_status" DEFAULT 'AI_ACTIVE'::"conversation_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"name" text,
	"phone" text NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_business_phone_unique" UNIQUE("business_id","phone")
);
--> statement-breakpoint
CREATE TABLE "demo_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_token" text NOT NULL UNIQUE,
	"source" "lead_source" NOT NULL,
	"status" "demo_session_status" DEFAULT 'ACTIVE'::"demo_session_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "human_handoffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "handoff_status" DEFAULT 'PENDING'::"handoff_status" NOT NULL,
	"assigned_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"type" "integration_type" NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'ACTIVE'::"integration_status" NOT NULL,
	"credentials" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"demo_session_id" uuid,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'NEW'::"lead_status" NOT NULL,
	"service" text,
	"problem" text,
	"urgency" "lead_urgency",
	"property_type" "property_type",
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"preferred_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"sender_type" "message_sender_type" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"business_id" uuid NOT NULL,
	"number" text NOT NULL,
	"provider" "phone_number_provider" NOT NULL,
	"type" "phone_number_type" NOT NULL,
	"status" "phone_number_status" DEFAULT 'ACTIVE'::"phone_number_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_phone_number_id_phone_numbers_id_fkey" FOREIGN KEY ("phone_number_id") REFERENCES "phone_numbers"("id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "human_handoffs" ADD CONSTRAINT "human_handoffs_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_demo_session_id_demo_sessions_id_fkey" FOREIGN KEY ("demo_session_id") REFERENCES "demo_sessions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_business_id_businesses_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;