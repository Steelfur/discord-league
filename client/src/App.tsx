import { User$findCurrent } from '@dl/api'
import { ThemeProvider } from '@material-ui/styles'
import { createMuiTheme } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'
import { createContext } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'

import { NavBar } from './components/NavBar'
import { ConfirmProvider } from './components/ConfirmProvider'
import { ReferenceDataProvider } from './hooks/useReferenceData'
import { useCurrentUser } from './hooks/useCurrentUser'
import { captureToken } from './utils/auth'
import { MyMatchesView } from './views/MyMatchesView/MyMatchesView'
import { TournamentView } from './views/TournamentView/TournamentView'
import { UserView } from './views/UserView'
import { UserProfile } from './views/UserProfile'
import { AdminHeroesView } from './views/AdminHeroesView'
import { TournamentDetailView } from './views/TournamentDetailView/TournamentDetailView'
import { PodDetailView } from './views/PodDetailView/PodDetailView'

// Dark, glass-surfaced theme. The Rathe artwork sits behind everything (see
// index.scss); panels are translucent slate with a blur so the scene reads
// through without hurting legibility. Crimson primary keeps the FaB identity;
// the cyan accent picks up the water and aurora in the art.
const GLASS = 'rgba(24, 26, 37, 0.72)'
const APPBAR_GLASS = 'rgba(15, 12, 20, 0.66)'
const HAIRLINE = 'rgba(255, 255, 255, 0.09)'

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: { main: '#ff5252', contrastText: '#1c0606' },
    secondary: { main: '#4dd0e1', contrastText: '#04181c' },
    background: { default: 'transparent', paper: GLASS },
    text: { primary: '#f4f5f7', secondary: 'rgba(233, 236, 245, 0.66)' },
    divider: HAIRLINE,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    h4: { fontWeight: 700, letterSpacing: '0.01em' },
    h5: { fontWeight: 600, letterSpacing: '0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  props: {
    MuiPaper: { elevation: 0 },
    MuiAppBar: { elevation: 0 },
    MuiButton: { disableElevation: true },
    MuiTextField: { variant: 'outlined', size: 'small' },
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '::-webkit-scrollbar': { width: 10, height: 10 },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.16)',
          borderRadius: 8,
        },
        '::-webkit-scrollbar-thumb:hover': { background: 'rgba(255, 255, 255, 0.26)' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
      },
    },
    MuiPaper: {
      root: {
        backgroundColor: GLASS,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${HAIRLINE}`,
        boxShadow: '0 18px 44px -24px rgba(0, 0, 0, 0.75)',
      },
      rounded: { borderRadius: 14 },
    },
    MuiAppBar: {
      root: {
        backgroundColor: APPBAR_GLASS,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${HAIRLINE}`,
        color: '#f4f5f7',
      },
      colorPrimary: { backgroundColor: APPBAR_GLASS, color: '#f4f5f7' },
    },
    MuiButton: {
      root: { borderRadius: 10 },
      containedPrimary: { boxShadow: '0 8px 24px -8px rgba(255, 82, 82, 0.55)' },
    },
    MuiTab: { root: { textTransform: 'none', fontWeight: 600, minWidth: 0 } },
    MuiTableCell: {
      root: { borderBottom: `1px solid ${HAIRLINE}` },
      head: { color: 'rgba(233, 236, 245, 0.66)', fontWeight: 600 },
    },
    MuiDivider: { root: { backgroundColor: HAIRLINE } },
    MuiTooltip: {
      tooltip: {
        backgroundColor: 'rgba(8, 9, 16, 0.94)',
        border: `1px solid ${HAIRLINE}`,
        fontSize: '0.75rem',
      },
    },
    MuiOutlinedInput: {
      notchedOutline: { borderColor: 'rgba(255, 255, 255, 0.16)' },
    },
  },
})

export const UserContext = createContext<User$findCurrent['response'] | undefined>(undefined)

export default function App(): JSX.Element {
  captureToken()
  const [user] = useCurrentUser()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserContext.Provider value={user.data}>
        <ReferenceDataProvider>
          <ConfirmProvider>
          <BrowserRouter>
            <NavBar />
            <br />
            <Switch>
              <Route path="/tournaments">
                <TournamentView />
              </Route>
              <Route path="/tournament/:id">
                <TournamentDetailView />
              </Route>
              <Route path="/pod/:id">
                <PodDetailView />
              </Route>
              <Route path="/my-matches">
                <MyMatchesView />
              </Route>
              <Route path="/users">
                <UserView />
              </Route>
              <Route path="/user/:id">
                <UserProfile />
              </Route>
              <Route path="/admin/heroes">
                <AdminHeroesView />
              </Route>
              <Redirect from="/" exact to="/tournaments" />
            </Switch>
          </BrowserRouter>
          </ConfirmProvider>
        </ReferenceDataProvider>
      </UserContext.Provider>
    </ThemeProvider>
  )
}
