import { Class, Hero } from '@dl/api'
import { useContext, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete'
import { Redirect } from 'react-router-dom'

import { api } from '../api'
import { UserContext } from '../App'
import { ClassDot } from '../components/HeroTag'
import { Loading } from '../components/Loading'
import { MessageSnackBar } from '../components/MessageSnackBar'
import { isAdmin } from '../hooks/useUsers'
import { useReferenceData } from '../hooks/useReferenceData'

/** Text field that reports its value only when it changes and loses focus / Enter is pressed. */
function EditableName(props: { value: string; disabled?: boolean; onSave: (next: string) => void }) {
  const [draft, setDraft] = useState(props.value)
  const commit = () => {
    const next = draft.trim()
    if (next && next !== props.value) {
      props.onSave(next)
    } else {
      setDraft(props.value)
    }
  }
  return (
    <TextField
      value={draft}
      disabled={props.disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      fullWidth
    />
  )
}

export function AdminHeroesView() {
  const currentUser = useContext(UserContext)
  const { heroes, classes, loading, reload } = useReferenceData()

  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [newHeroName, setNewHeroName] = useState('')
  const [newHeroClassId, setNewHeroClassId] = useState<number | ''>('')
  const [newClassName, setNewClassName] = useState('')

  const className = useMemo(
    () => (id: number) => classes.find((c) => c.id === id)?.name ?? '',
    [classes]
  )
  const sortedHeroes = useMemo(
    () =>
      [...heroes].sort(
        (a, b) =>
          className(a.classId).localeCompare(className(b.classId)) || a.name.localeCompare(b.name)
      ),
    [heroes, className]
  )

  if (!currentUser) return <Loading />
  if (!isAdmin(currentUser)) return <Redirect to="/tournaments" />

  async function run(key: string, fn: () => Promise<unknown>, okMsg?: string) {
    setBusy(key)
    try {
      await fn()
      reload()
      if (okMsg) setMessage({ text: okMsg, error: false })
    } catch (e: unknown) {
      const text =
        (e && typeof e === 'object' && 'data' in e && typeof (e as { data: unknown }).data === 'function'
          ? String((e as { data: () => unknown }).data())
          : '') || 'Something went wrong'
      setMessage({ text, error: true })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Container>
      {/* ---------- Classes ---------- */}
      <Typography variant="h4" gutterBottom>
        Classes
      </Typography>
      <Paper style={{ padding: 16, margin: '8px 0 16px', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <TextField
          label="New class name"
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />
        <Button
          color="primary"
          variant="contained"
          disabled={busy === 'class-add' || !newClassName.trim()}
          onClick={() =>
            run(
              'class-add',
              () => api.Class.create({ body: { name: newClassName.trim() } }),
              'Class added'
            ).then(() => setNewClassName(''))
          }
        >
          Add class
        </Button>
      </Paper>
      <Paper style={{ overflowX: 'auto', marginBottom: 32 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Active</TableCell>
              <TableCell>Class</TableCell>
              <TableCell align="right">Heroes</TableCell>
              <TableCell align="right">Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((c: Class) => {
              const count = heroes.filter((h) => h.classId === c.id).length
              return (
                <TableRow key={c.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={c.active}
                      disabled={busy === `class-${c.id}`}
                      onChange={() =>
                        run(`class-${c.id}`, () =>
                          api.Class.update({ classId: c.id, body: { active: !c.active } })
                        )
                      }
                    />
                  </TableCell>
                  <TableCell style={{ minWidth: 220 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ClassDot classId={c.id} small />
                      <EditableName
                        value={c.name}
                        disabled={busy === `class-${c.id}`}
                        onSave={(name) =>
                          run(`class-${c.id}`, () =>
                            api.Class.update({ classId: c.id, body: { name } })
                          )
                        }
                      />
                    </span>
                  </TableCell>
                  <TableCell align="right">{count}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={busy === `class-${c.id}` || count > 0}
                      title={count > 0 ? 'Move or delete its heroes first' : 'Delete class'}
                      onClick={() =>
                        run(
                          `class-${c.id}`,
                          () => api.Class.remove({ classId: c.id }),
                          'Class deleted'
                        )
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* ---------- Heroes ---------- */}
      <Typography variant="h4" gutterBottom>
        Heroes
      </Typography>
      <Typography gutterBottom>
        Untick a hero to hide it from registration and match reports (e.g. Living Legend). Delete
        only removes heroes that have never been used.
      </Typography>
      <Paper style={{ padding: 16, margin: '8px 0 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="New hero name"
          value={newHeroName}
          onChange={(e) => setNewHeroName(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <FormControl style={{ minWidth: 180 }}>
          <InputLabel id="new-hero-class">Class</InputLabel>
          <Select
            labelId="new-hero-class"
            value={newHeroClassId}
            onChange={(e) => setNewHeroClassId(e.target.value as number)}
          >
            {classes.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          color="primary"
          variant="contained"
          disabled={busy === 'hero-add' || !newHeroName.trim() || newHeroClassId === ''}
          onClick={() =>
            run(
              'hero-add',
              () =>
                api.Hero.create({
                  body: { name: newHeroName.trim(), classId: newHeroClassId as number, active: true },
                }),
              'Hero added'
            ).then(() => {
              setNewHeroName('')
              setNewHeroClassId('')
            })
          }
        >
          Add hero
        </Button>
      </Paper>

      {loading && heroes.length === 0 ? (
        <Loading />
      ) : (
        <Paper style={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Active</TableCell>
                <TableCell>Hero</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="right">Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedHeroes.map((hero: Hero) => (
                <TableRow key={hero.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={hero.active}
                      disabled={busy === `hero-${hero.id}`}
                      onChange={() =>
                        run(`hero-${hero.id}`, () =>
                          api.Hero.update({ heroId: hero.id, body: { active: !hero.active } })
                        )
                      }
                    />
                  </TableCell>
                  <TableCell style={{ minWidth: 260 }}>
                    <EditableName
                      value={hero.name}
                      disabled={busy === `hero-${hero.id}`}
                      onSave={(name) =>
                        run(`hero-${hero.id}`, () =>
                          api.Hero.update({ heroId: hero.id, body: { name } })
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl style={{ minWidth: 170 }}>
                      <Select
                        value={hero.classId}
                        disabled={busy === `hero-${hero.id}`}
                        onChange={(e) =>
                          run(`hero-${hero.id}`, () =>
                            api.Hero.update({
                              heroId: hero.id,
                              body: { classId: e.target.value as number },
                            })
                          )
                        }
                      >
                        {classes.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={busy === `hero-${hero.id}`}
                      title="Delete hero"
                      onClick={() =>
                        run(
                          `hero-${hero.id}`,
                          () => api.Hero.remove({ heroId: hero.id }),
                          'Hero deleted'
                        )
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {message && (
        <MessageSnackBar
          open
          onClose={() => setMessage(null)}
          error={message.error}
          message={message.text}
        />
      )}
    </Container>
  )
}
