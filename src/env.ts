// Public origin of the app. Explicit HOST wins; otherwise fall back to the
// domain Railway injects, so a fresh deploy works before a custom domain.
const host =
  process.env.HOST ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${process.env.PORT || 8080}`)

export default {
  databaseUrl: String(process.env.DATABASE_URL),
  discordBotToken: String(process.env.DISCORD_BOT_TOKEN),
  discordClientId: String(process.env.DISCORD_CLIENT_ID),
  discordClientSecret: String(process.env.DISCORD_CLIENT_SECRET),
  host,
  jwtSecret: String(process.env.JWT_SECRET),
  nodeEnv: String(process.env.NODE_ENV).trim(),
  sentryDsn: process.env.SENTRY_DSN || undefined,
  serverPort: parseInt(String(process.env.PORT), 10),
}
