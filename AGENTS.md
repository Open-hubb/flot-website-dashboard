# Project instructions

## Stack and commands

- Next.js 14 App Router with TypeScript, Tailwind CSS, Prisma, and PostgreSQL.
- Install dependencies with `npm ci`.
- Run the local server with `npm run dev` (the default port is 3000).
- Run the production check with `npm run build`; it runs `prisma generate` before `next build`.
- `npm run lint` is defined as `next lint`.

## Key paths

- Dashboard pages and handlers: `app/`
- Shared server and validation code: `lib/`
- Database schema and migrations: `prisma/`
- Brand/static assets: `public/`

## Guardrails

- Keep every merchant-authenticated database operation scoped to `session.user.id`.
- Public merchant-site APIs must retain their consumers' bundled fallbacks; do not change an API response into an empty successful response.
- Do not use production credentials or databases while developing.
- Verify each focused change with `npm run build` before opening its PR.
