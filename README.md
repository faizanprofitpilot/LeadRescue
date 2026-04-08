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

   Copy [`.env.example`](.env.example) to `.env.local` and fill values. **`NEXT_PUBLIC_APP_URL`** must be the public origin Twilio will call (no trailing slash), e.g. `https://leadrescue.xyz` in production (or your tunnel URL locally). It is used when **provisioning** numbers to set Voice and SMS webhooks to `/api/twilio/voice` and `/api/twilio/sms`.

3. **Supabase**

   - Create a project.
   - Run migrations in order: [`20250324120000_initial.sql`](supabase/migrations/20250324120000_initial.sql), [`20250324200000_niche_home_services.sql`](supabase/migrations/20250324200000_niche_home_services.sql) (if applicable), [`20250328120000_leadrescue_product_upgrade.sql`](supabase/migrations/20250328120000_leadrescue_product_upgrade.sql), [`20250329140000_sms_thread_routing.sql`](supabase/migrations/20250329140000_sms_thread_routing.sql), [`20250329190000_user_subscriptions.sql`](supabase/migrations/20250329190000_user_subscriptions.sql), then [`20250330170000_tfv_opt_in_image_urls.sql`](supabase/migrations/20250330170000_tfv_opt_in_image_urls.sql), [`20250330180000_tfv_last_polled_at.sql`](supabase/migrations/20250330180000_tfv_last_polled_at.sql), and [`20250330190000_tfv_email_notifications.sql`](supabase/migrations/20250330190000_tfv_email_notifications.sql). If Supabase reports a missing column on `toll_free_verifications` (schema cache), run [`supabase/sql/ensure_toll_free_verification_columns.sql`](supabase/sql/ensure_toll_free_verification_columns.sql) once in the SQL Editor. To grant yourself the $49/mo plan after migrating, run [`supabase/sql/grant_monthly_49_plan.sql`](supabase/sql/grant_monthly_49_plan.sql) in the SQL Editor (adjust `user_id` if needed).
   - Auth → URL configuration: add `NEXT_PUBLIC_APP_URL` and redirect `/auth/callback`.

4. **Twilio (operator account)**

   - Use **your** Twilio account credentials in `.env.local`. The app **searches and purchases US toll-free** numbers for each business and sets webhooks automatically; customers do not enter SIDs or phone numbers in the UI.
   - **Toll-free verification (TFV):** onboarding submits to Twilio’s Messaging toll-free verification API. Optional env vars are listed in [`.env.example`](.env.example) (`TWILIO_CUSTOMER_PROFILE_SID`, `TWILIO_TFV_OPT_IN_IMAGE_URLS` to override the default proof URL, use-case categories, message volume, registration authority). Dashboard loads sync TFV status from Twilio when a submission id exists, but **polling is throttled** (no call if status is already `approved` or `rejected`, otherwise at most once per `TWILIO_TFV_SYNC_MIN_INTERVAL_SEC`, default 120s) so navigation does not hammer Twilio or slow every page. **Outbound SMS on toll-free lines is suppressed until** `line_verification_status` is `approved` (inbound is still accepted and stored when a conversation exists).
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

SMS (including toll-free verification) and telecom rules are the **operator’s** responsibility. LeadRescue includes an in-app **texting line verification** flow, persists registration details and consent copy, submits to Twilio’s toll-free verification API, and mirrors review status back from Twilio on dashboard load. Follow-up SMS is sent in the context of an inbound call forwarded to the app, and toll-free AI replies are gated until Twilio approval.

## Scripts

- `npm run dev`: development
- `npm run build`: production build
- `npm run start`: start production server
- `npm run lint`: ESLint
