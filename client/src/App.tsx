import { User$findCurrent } from '@dl/api'
import { ThemeProvider } from '@material-ui/styles'
import { createMuiTheme } from '@material-ui/core/styles'
import { createContext } from 'react'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'

import { NavBar } from './components/NavBar'
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

// Flesh and Blood-flavoured palette: deep red primary, near-black secondary.
const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#b71c1c',
    },
    secondary: {
      main: '#212121',
    },
  },
})

export const UserContext = createContext<User$findCurrent['response'] | undefined>(undefined)

export default function App(): JSX.Element {
  captureToken()
  const [user] = useCurrentUser()

  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={user.data}>
        <ReferenceDataProvider>
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
        </ReferenceDataProvider>
      </UserContext.Provider>
    </ThemeProvider>
  )
}
