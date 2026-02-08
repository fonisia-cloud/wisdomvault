# WisdomVault (Vercel + Supabase + iFlow)

WisdomVault is a gamified learning app for mistake capture, review planning, and AI tutoring.

This version is now full-stack:
- Frontend: Vite + React
- Backend: Supabase (Auth + Postgres + RLS + Edge Function)
- AI Tutor: iFlow API (`Qwen3-VL-Plus`)
- Mobile install: PWA (iPhone/iPad Safari Add to Home Screen)

## 1) Local Setup

Prerequisites:
- Node.js 18+
- Supabase project
- Supabase CLI (recommended)

Install dependencies:

```bash
npm install
```

Create local env file:

```bash
cp .env.example .env.local
```

Fill these values in `.env.local`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Run frontend:

```bash
npm run dev
```

## 2) Supabase Database Setup

SQL schema is in:
- `supabase/migrations/001_init.sql`
- `supabase/migrations/002_align_legacy_schema.sql` (only if your project had old tables already)

Apply it in one of two ways:

1. Supabase SQL Editor: paste and run file content.
2. Supabase CLI migration flow.

If you upgraded from an old schema (for example `mistakes.user_id` still references `app_users`), run `002_align_legacy_schema.sql` after `001_init.sql`.

What it creates:
- `profiles`
- `mistakes`
- `rewards`
- `app_settings`
- `parent_settings`
- `chat_messages`
- RLS policies for per-user isolation
- Trigger `handle_new_user` to initialize profile/settings after signup

## 3) Edge Function Setup (`ai-tutor` + `ocr-question`)

Function paths:
- `supabase/functions/ai-tutor/index.ts`
- `supabase/functions/ocr-question/index.ts`

Set function secrets in Supabase:
- `IFLOW_API_KEY` = your iFlow key
- `IFLOW_BASE_URL` = `https://apis.iflow.cn/v1`
- `IFLOW_MODEL` = `Qwen3-VL-Plus`
- `IFLOW_VISION_MODEL` = `Qwen3-VL-Plus` (optional, for OCR)

Deploy functions (example):

```bash
supabase functions deploy ai-tutor
supabase functions deploy ocr-question
```

## 4) Vercel Deployment

Set Vercel environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then deploy with Vercel normally.

Important Supabase Auth settings (Dashboard -> Authentication -> URL Configuration):
- `Site URL`: your Vercel production URL (for example `https://your-app.vercel.app`)
- `Redirect URLs`: include both preview and production callback URLs if needed

For this project (email confirm disabled), signup/login should work directly after deployment.

## 5) iPhone/iPad Home Screen App Mode

1. Open deployed URL in Safari.
2. Tap Share -> Add to Home Screen.
3. Launch from icon.

This project includes:
- `public/manifest.webmanifest`
- `public/sw.js`
- app icons in `public/icons`
- Apple web-app meta tags in `index.html`

## 6) Auth Setting Recommendation

For fast onboarding/demo, keep Supabase email confirmation **disabled** at first.
You can enable it later when your auth flow is finalized.

## 7) Post-Deploy Smoke Test

1. Open Vercel URL in desktop browser and iPhone/iPad Safari.
2. Register a new account and confirm you enter `/home`.
3. Add one mistake in `/tagging` and verify it appears in `/vault` after refresh.
4. Open AI tutor and send a message; verify response appears.
5. In Supabase table editor, verify rows are written to `mistakes` and `chat_messages`.
6. In Safari, use Share -> Add to Home Screen and launch from icon.
