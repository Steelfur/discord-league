/* eslint-disable @typescript-eslint/no-var-requires */
const url = require('url')

const {
  username: user,
  password,
  hostname: host,
  port,
  pathname,
} = new url.URL(process.env.DATABASE_URL)
const database = pathname.slice(1)

// Managed Postgres on a public host usually needs SSL; a Railway/Render internal
// URL, or local docker, does not. Default: SSL off, opt in with DATABASE_SSL=true.
const ssl =
  String(process.env.DATABASE_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: false } : false

const connection = { user, password, host, port: parseInt(port, 10), database, ssl }

module.exports = {
  development: {
    client: 'pg',
    connection,
    migrations: { tableName: 'knex_migrations' },
  },
  production: {
    client: 'pg',
    connection,
    migrations: { tableName: 'knex_migrations' },
  },
}
