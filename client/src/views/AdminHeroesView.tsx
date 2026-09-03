import { Hero } from '@dl/api'
import { useContext, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Container,
  FormControl,
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
import { Redirect } from 'react-router-dom'

import { api } from '../api'
import { UserContext } from '../App'
import { ClassDot } from '../components/HeroTag'
import { Loading } from '../components/Loading'
import { MessageSnackBar } from '../components/MessageSnackBar'
import { isAdmin } from '../hooks/useUsers'
import { useReferenceData } from '../hooks/useReferenceData'

export function AdminHeroesView() {
  const currentUser = useContext(UserContext)
  const { heroes, classes, loading, reload } = useReferenceData()

  const [busyId, setBusyId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [newName, setNewName] = useState('')
  const [newClassId, setNewClassId] = useState<number | ''>('')

  const className = useMemo(
    () => (id: number) => classes.find((c) => c.id === id)?.name ?? '',
    [classes]
  )

  const sortedHeroes = useMemo(
    () =>
      [...heroes].sort(
        (a, b) => className(a.classId).localeCompare(className(b.classId)) || a.name.localeCompare(b.name)
      ),
    [heroes, className]
  )

  if (!currentUser) {
    return <Loading />
  }
  if (!isAdmin(currentUser)) {
    return <Redirect to="/tournaments" />
  }

  async function toggleActive(hero: Hero) {
    setBusyId(hero.id)
    try {
      await api.Hero.update({ heroId: hero.id, body: { active: !hero.active } })
      reload()
    } catch {
      setMessage({ text: `Could not update ${hero.name}`, error: true })
    } finally {
      setBusyId(null)
    }
  }

  async function changeClass(hero: Hero, classId: number) {
    setBusyId(hero.id)
    try {
      await api.Hero.update({ heroId: hero.id, body: { classId } })
      reload()
    } catch {
      setMessage({ text: `Could not update ${hero.name}`, error: true })
    } finally {
      setBusyId(null)
    }
  }

  async function addHero() {
    if (!newName.trim() || newClassId === '') {
      return
    }
    setBusyId(-1)
    try {
      await api.Hero.create({ body: { name: newName.trim(), classId: newClassId, active: true } })
      setNewName('')
      setNewClassId('')
      reload()
      setMessage({ text: 'Hero added', error: false })
    } catch {
      setMessage({ text: 'Could not add hero', error: true })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Manage Heroes
      </Typography>
      <Typography gutterBottom>
        Untick a hero to hide it from registration and match reports (e.g. once it reaches Living
        Legend). Existing results keep the hero. Add newly released heroes below.
      </Typography>

      <Paper style={{ padding: 16, margin: '16px 0', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="New hero name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <FormControl style={{ minWidth: 180 }}>
          <InputLabel id="new-hero-class">Class</InputLabel>
          <Select
            labelId="new-hero-class"
            value={newClassId}
            onChange={(e) => setNewClassId(e.target.value as number)}
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
          onClick={addHero}
          disabled={busyId === -1 || !newName.trim() || newClassId === ''}
        >
          Add hero
        </Button>
      </Paper>

      {loading && heroes.length === 0 ? (
        <Loading />
      ) : (
        <TableContainerLike>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Active</TableCell>
                <TableCell>Hero</TableCell>
                <TableCell>Class</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedHeroes.map((hero) => (
                <TableRow key={hero.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={hero.active}
                      disabled={busyId === hero.id}
                      onChange={() => toggleActive(hero)}
                    />
                  </TableCell>
                  <TableCell>{hero.name}</TableCell>
                  <TableCell>
                    <FormControl style={{ minWidth: 160 }}>
                      <Select
                        value={hero.classId}
                        disabled={busyId === hero.id}
                        onChange={(e) => changeClass(hero, e.target.value as number)}
                        renderValue={(value) => (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ClassDot classId={value as number} small /> {className(value as number)}
                          </span>
                        )}
                      >
                        {classes.map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainerLike>
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

function TableContainerLike(props: { children: React.ReactNode }) {
  return <Paper style={{ overflowX: 'auto' }}>{props.children}</Paper>
}
