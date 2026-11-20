# Employee Information, Benefits & Leave Management

A Thai-first (+ English) employee portal: identity/auth, HR profile data, and
(in later phases) benefits and leave management.

**Status:** Phases 1–4 of 11 are implemented — bootstrap, database schema,
identity/auth, and the design system + first real screens (login,
forgot/reset password, dashboard, profile). Benefits, leave, announcements,
the developer portal, QA and delivery are **not** built yet; the Prisma
schema and permission scaffolding exist so those phases plug in without a
rework.

## Stack

SvelteKit + Svelte 5 + TypeScript (strict) · Tailwind CSS 4 · MySQL 8 via
Prisma 7 (driver-adapter client, `@prisma/adapter-mariadb`) · Argon2id
passwords · opaque hashed session tokens · `@sveltejs/adapter-node`.

## Setup

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# edit .env: DATABASE_URL, ORIGIN, and (optionally) SMTP_* / SEED_*_EMAIL

# 3. Start MySQL (and, optionally, Adminer on http://localhost:8080)
docker compose up -d mysql
docker compose --profile dev up -d adminer   # optional, dev only

# 4. Generate the Prisma client (also runs automatically on `npm install`
#    via the `postinstall` hint below if you choose to wire one up; for now
#    run it explicitly)
npx prisma generate

# 5. Run the initial migration against your real MySQL instance
npx prisma migrate dev --name init

# 6. Seed synthetic departments/positions + demo ADMIN/DEVELOPER/USER
#    accounts (random passwords, printed once to the console)
npx prisma db seed

# 7. Start the dev server
npm run dev -- --open
```

## What exists right now

- **Auth**: `/login`, `/logout`, `/forgot-password`, `/reset-password/[token]`.
  Argon2id hashing, opaque session tokens (only SHA-256 hashes stored),
  sliding session renewal, a fixed-window login rate limiter, and an
  enumeration-safe forgot-password flow. With no SMTP configured (the
  `.env.example` default), the reset link is shown directly on the page
  instead of a fake "email sent" message.
- **RBAC scaffolding**: `src/lib/permissions/roles.ts` (shared capability
  matrix) and `src/lib/server/permissions/guards.ts` (server-side
  enforcement — the only place a request's outcome may depend on role).
  `USER` / `DEVELOPER` / `ADMIN`; `DEVELOPER` never gets implicit HR data
  access.
- **Design system**: white/blue tokens in `src/routes/layout.css`,
  `AppShell` / `Sidebar` / `Topbar` / `FormField` / `Toast` /
  `LanguageSwitcher` in `src/lib/components/`.
- **i18n**: `src/lib/i18n/{th,en}.json` dictionaries, Thai by default,
  persisted in an `eb_locale` cookie, a `getT()` helper for components, and
  `translate()` for server-side (Thai-by-default) validation messages.
- **Real screens**: `(app)/dashboard` (greets the signed-in user by name/role
  from the DB; honest empty states, no fake numbers) and `(app)/profile`
  (real Employee/User data + a working password-change form).
- **Full Prisma schema** (`prisma/schema.prisma`): identity tables are live;
  Benefits/Leave/Announcements/Notifications/AuditLog/FeatureFlag/SystemEvent
  models exist for later phases.

## Verification run during this session

- `npx prisma format` / `npx prisma validate` — **passed**.
- `npx prisma generate` — **passed** (see the tsconfig note below).
- `npm run check` (svelte-kit sync + svelte-check) — **passed**.
- `npm run lint` (prettier --check + eslint) — **passed**.
- `npm run build` — **passed**.
- `npm run dev`, exercised with `curl` against the running server (no live
  MySQL available):
  - `GET /` → `303` redirect to `/login` (unauthenticated).
  - `GET /login` → `200`, renders in Thai by default (`<title>เข้าสู่ระบบ ·
...`).
  - `GET /login` with `Cookie: eb_locale=en` → `200`, renders in English and
    `<html lang="en">`.
  - `POST /login` with an invalid email / empty password → `400`, real Zod
    errors in Thai ("กรุณากรอกอีเมลให้ถูกต้อง", "กรุณากรอกข้อมูลนี้").
  - `POST /login` with a well-formed but unverifiable login → `503`, the
    Thai message "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
    ในอีกสักครู่" — the server logged the underlying driver error and kept
    serving requests; it did not crash.

No live MySQL was available in this environment, so the following are
**not yet verified end-to-end** and are the first things to do against a
real database:

1. `npx prisma migrate dev --name init`
2. `npx prisma db seed`
3. Actually signing in with a seeded account, changing its password, and
   confirming the forgot/reset-password email flow (dev-mode link) end to end.

## Prisma generate + tsconfig (read before touching `prisma/schema.prisma`)

Prisma 7's TypeScript client generator walks **up** from its `output`
directory looking for the nearest `tsconfig.json` to resolve compiler
options. This project's root `tsconfig.json` extends SvelteKit's virtual
`$app/tsconfig`, which Prisma's generator cannot resolve — if it has to walk
all the way up to the root tsconfig, `prisma generate` fails with
`File '$app/tsconfig' not found`.

The fix is `src/generated/tsconfig.json`: a small, **tracked** (not
gitignored) placeholder tsconfig that stops the upward walk one level before
it would reach the root. `src/generated/prisma/` (the actual generated
client) IS gitignored as normal — only that one placeholder file is tracked.
Do not delete `src/generated/tsconfig.json`, and do not move the client
`output` path in `schema.prisma` without keeping an equivalent stopper in
place.

## Deviations from the original spec

This project's scaffolded SvelteKit version (`@sveltejs/kit@^3`) is new
enough that several conventions the spec assumed (`$env/dynamic/private`,
a generated `.svelte-kit/tsconfig.json`, the `$lib` alias) have changed or
moved. Every item below was confirmed against the actually-installed
versions (via their real type declarations / CLI output), not assumed from
older SvelteKit/Prisma knowledge.

- **Env vars go through SvelteKit's own typed env system, not
  `$env/dynamic/private`.** This version replaces `$env/static|dynamic/*`
  with an explicit, schema-validated system: `src/env.ts` calls
  `defineEnvVars()` (from `@sveltejs/kit/env`) with a Zod schema per
  variable, and the validated values are exposed through the generated
  `$app/env/private` module. `src/lib/server/env.ts` is a thin convenience
  wrapper around that so the rest of the app has one `env` object to
  import, same as the spec asked for — the validation now happens inside
  SvelteKit's own startup sequence instead of a hand-rolled Zod call.
- **The `$lib` alias is deprecated in this SvelteKit version** in favor of
  Node "subpath imports" (`#lib/*` via `package.json` `imports`). We tried
  that route first, but this project's installed TypeScript (6.x) only
  resolves a `package.json` `imports` subpath when its target has a single,
  literal extension — which can't cleanly cover a directory mixing `.ts`,
  `.svelte.ts`, and `.svelte` files. We kept the deprecated `alias` option
  in `vite.config.ts` (`alias: { $lib: 'src/lib' }`); it still works
  end-to-end (Vite, svelte-check, build) and prints two harmless warnings
  on every `sync`/`dev`/`build` (`config_option_deprecated_alias` and a
  `tsconfig_invalid` "paths was overwritten" notice) — both cosmetic,
  confirmed by `$lib` imports resolving correctly in `npm run check` (0
  errors) and a working production build.
- **Internal `<a href>`s go through `resolve()` from `$app/paths`.** This
  SvelteKit version lints every internal navigation href with
  `svelte/no-navigation-without-resolve`, which wants route IDs (e.g.
  `/(app)/dashboard`, including the route-group syntax) resolved to a real
  pathname at render time, not hand-written path strings. The one
  deliberate exception is the forgot-password page's dev-mode reset link,
  which is a full absolute URL built from `ORIGIN` + a token — not an
  internal route — so that one `<a>` has an explicit, commented
  `eslint-disable-next-line` instead.
- **Prisma config lives partly in `prisma.config.ts`, not just
  `schema.prisma`.** Prisma 7 moved the datasource `url` out of
  `schema.prisma` entirely (it's now a schema validation error) and removed
  Rust-engine-based direct connections. `PrismaClient` is instantiated with
  an explicit `@prisma/adapter-mariadb` adapter (`src/lib/server/db.ts`)
  built from the validated `DATABASE_URL`; the CLI (`migrate`/`db seed`/
  `studio`) reads the same URL from `prisma.config.ts`.
- **`prisma/seed.ts` cannot use `$lib/...`, `$app/env/*`, or any Vite
  alias.** It runs via `tsx` outside of Vite/SvelteKit, so those don't
  exist there. It builds its own `PrismaClient` from
  `process.env.DATABASE_URL` (loaded by `prisma.config.ts`'s
  `dotenv/config` import) and imports the password-hashing helper by
  relative path. It was type-checked in isolation (a standalone `tsc`
  pass) since it's outside the app's own `tsconfig.json` `include`.
- **No `svelte.config.js`.** This SvelteKit version configures the
  `sveltekit()` Vite plugin (including the adapter) directly in
  `vite.config.ts`; there's nothing to put in a separate config file.
#   e m p l o y e e - b e n e f i t s  
 