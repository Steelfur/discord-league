import url from 'url'
import knex from 'knex'

import env from '../../../env'

const databaseUrl =
  env.nodeEnv === 'test' ? 'postgres://user:password@host:1337/dbname' : env.databaseUrl
const { username: user, password, hostname: host, port, pathname } = new url.URL(databaseUrl)
const database = pathname.slice(1)

// Opt into SSL with DATABASE_SSL=true (needed for most public managed Postgres;
// not for a Railway/Render internal URL or local docker).
const ssl =
  String(process.env.DATABASE_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: false } : false

export const pg = knex({
  client: 'pg',
  connection: {
    user,
    password,
    host,
    port: parseInt(port, 10),
    database,
    ssl,
  },
  migrations: {
    tableName: 'knex_migrations',
  },
})
