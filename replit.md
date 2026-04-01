# Golf Charity Platform (GolfGives)

A Next.js 16 charity golf platform with Stripe payments, Supabase auth/database, and Resend email.

## Architecture

- **Framework**: Next.js 16.2.1 (App Router) with Turbopack
- **Auth & Database**: Supabase
- **Payments**: Stripe (subscriptions + webhooks)
- **Email**: Resend
- **Styling**: Tailwind CSS v4

## Running the App

```bash
npm run dev    # dev server on port 5000
npm run build  # production build
npm run start  # production server on port 5000
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for emails |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. https://your-app.replit.app) |

## Project Structure

```
app/
  api/             # API routes (Stripe webhook, checkout, subscription)
  admin/           # Admin dashboard
  charities/       # Charity listings
  dashboard/       # User dashboard
  login/           # Auth pages
  signup/
  subscribe/
components/        # Shared UI components
lib/
  supabase.js      # Supabase client
  email.js         # Resend email templates
hooks/
  useAuthGuard.js  # Auth protection hook
```

## Replit Configuration

- Port: **5000** (required for Replit webview)
- Host: **0.0.0.0** (required for Replit proxy)
- Workflow: "Start application" runs `npm run dev`
