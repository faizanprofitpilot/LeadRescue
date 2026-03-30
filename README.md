# LeadRescue

AI-powered **missed-call recovery** for **home service** businesses (HVAC, plumbing, electrical, and similar trades). Owners keep their existing business number, forward missed or unanswered calls to a **LeadRescue toll-free line** we provision on our Twilio account, and LeadRescue texts the homeowner back, collects job details (including address) over SMS, saves structured leads in Supabase, and emails the owner via Resend.

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Twilio (Voice + SMS webhooks)
- OpenAI (SMS reply + JSON extraction, validated with Zod)
- Resend (HTML lead summary email)
- Deploy on Vercel

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy [`.env.example`](.env.example) to `.env.local` and fill values. **`NEXT_PUBLIC_APP_URL`** must be the public origin Twilio will call (no trailing slash), e.g. `https://your-app.vercel.app` in production. It is used when **provisioning** numbers to set Voice and SMS webhooks to `/api/twilio/voice` and `/api/twilio/sms`.

3. **Supabase**

   - Create a project.
   - Run migrations in order: [`20250324120000_initial.sql`](supabase/migrations/20250324120000_initial.sql), [`20250324200000_niche_home_services.sql`](supabase/migrations/20250324200000_niche_home_services.sql) (if applicable), [`20250328120000_leadrescue_product_upgrade.sql`](supabase/migrations/20250328120000_leadrescue_product_upgrade.sql), then [`20250329140000_sms_thread_routing.sql`](supabase/migrations/20250329140000_sms_thread_routing.sql). The last migration adds deterministic SMS routing on `conversations` (`business_id`, `caller_phone_normalized`, `last_message_at`, stale/closed fields, partial unique index for one active thread per caller, and unique `messages.provider_message_sid` for webhook retries).
   - Auth → URL configuration: add `NEXT_PUBLIC_APP_URL` and redirect `/auth/callback`.

4. **Twilio (operator account)**

   - Use **your** Twilio account credentials in `.env.local`. The app **searches and purchases US toll-free** numbers for each business and sets webhooks automatically; customers do not enter SIDs or phone numbers in the UI.
   - For local webhook testing, use a tunnel (e.g. ngrok) and set `NEXT_PUBLIC_APP_URL` to the tunnel origin, or temporarily use `TWILIO_SKIP_SIGNATURE_VERIFY=true` (never in production).

5. **Resend**

   - Verify sending domain or use Resend’s test sender per their docs.
   - Set `RESEND_FROM_EMAIL` to an allowed from-address.

6. **Run**

   ```bash
   npm run dev
   ```

7. **App flow**

   - Sign up → **Setup** (`/dashboard/onboarding`): business basics → **Generate LeadRescue number** → **Verify your texting line** → knowledge base → forwarding confirmation → optional test.
   - Configure carrier / VoIP **missed-call forwarding** to the assigned LeadRescue number.
   - Missed call → voice webhook → first SMS → customer replies → AI thread (uses per-business knowledge base) → lead in dashboard → email summary when complete.

## Internal API (optional)

Protected by header `x-internal-secret: <INTERNAL_API_SECRET>`:

- `POST /api/internal/extract-lead`: body `{ "conversationId": "uuid" }`
- `POST /api/internal/send-summary`: body `{ "leadId": "uuid" }`

## Compliance note

SMS (including toll-free verification) and telecom rules are the **operator’s** responsibility. LeadRescue includes an in-app **texting line verification** flow and stores registration details; wire the Twilio Trust Hub adapter when you are ready for API-based submission. Follow-up SMS is sent in the context of an inbound call forwarded to the app.

## Scripts

- `npm run dev`: development
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: ESLint
