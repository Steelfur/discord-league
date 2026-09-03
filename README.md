# FaB League

A seasonal **Flesh and Blood** league manager: players sign in with Discord,
register a class + hero, get sorted into round-robin pods, report
Win / Loss / Draw / No-Show results, and the standings + a per-class power
ranking update automatically. Admins run seasons and manage the hero list.

Adapted from the L5R Discord League platform
(`l5r-discord-league/discord-league`).

## Stack

- **Server** — Node 20, Express, TypeScript (`src/`)
- **Client** — React 17 + Vite + Material-UI (`client/`), served by the server in production
- **Database** — PostgreSQL via Knex migrations (`migrations/`)
- **Auth** — "Sign in with Discord" (OAuth2) + JWT

## Run it locally

1. Install Node 20 and Yarn 1.x, plus Docker (for a local Postgres).
2. Start a database: `docker compose up -d`
3. Copy `.env.template` to `.env` and fill it in. For the local database use:
   `DATABASE_URL="postgres://postgres:password@localhost:5432/fab_league"` and
   `DATABASE_SSL="false"`.
4. Install deps: `yarn install` then `cd client && yarn install && cd ..`
5. Run migrations: `yarn migrate:latest`
6. Start both server and client: `yarn start:all:dev`
   - client dev server: http://localhost:3000 (proxies `/api` to the server)
   - server: http://localhost:8080

### Make yourself an admin

Sign in once, then in the database:
`UPDATE users SET permissions = 1 WHERE "discordId" = '<your discord id>';`

## Deploy to Railway

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub repo**,
   pick this repo.
3. In the project, **+ New → Database → PostgreSQL**.
4. On the app service, **Variables**, add (see `.env.template`):
   `NODE_ENV=production`, `JWT_SECRET`, `DISCORD_CLIENT_ID`,
   `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`,
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `DATABASE_SSL=false`.
   Leave `HOST` unset (it uses the Railway domain automatically).
5. On the app service, **Settings → Networking → Generate Domain**.
6. In the Discord Developer Portal, add an OAuth2 redirect:
   `https://<your-railway-domain>/api/auth/callback`.
7. Railway builds with `yarn build` and starts with `yarn start`, which runs
   the migrations before booting. Redeploys happen automatically on push.

The bracket stage is a built-in double-elimination bracket — no Challonge or
other external service.
