import { spawn } from 'child_process'
import { Request, Response } from 'express'

import env from '../env'

/**
 * Admin-only. Streams a plain-SQL pg_dump of the database as a download.
 * Restore later with:  psql "<DATABASE_URL>" < fab-league-backup.sql
 */
export async function handler(_req: Request, res: Response): Promise<void> {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  res.setHeader('Content-Type', 'application/sql')
  res.setHeader('Content-Disposition', `attachment; filename="fab-league-${stamp}.sql"`)

  const dump = spawn('pg_dump', [
    env.databaseUrl,
    '--no-owner',
    '--no-privileges',
    '--clean',
    '--if-exists',
  ])

  let stderr = ''
  dump.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })
  dump.stdout.pipe(res)

  dump.on('error', (err) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/plain')
      res.status(500).send(`Could not run pg_dump: ${err.message}`)
    } else {
      res.destroy()
    }
  })

  dump.on('close', (code) => {
    if (code !== 0 && !res.writableEnded) {
      // eslint-disable-next-line no-console
      console.error('pg_dump failed:', stderr)
      res.destroy()
    }
  })
}
