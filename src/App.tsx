import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { usePlayerStore } from './store/playerStore'
import { useMatchStore } from './store/matchStore'
import { useTrainingStore } from './store/trainingStore'
import { useFineStore } from './store/fineStore'
import { useThemeStore } from './store/themeStore'
import Layout from './components/layout/Layout'
import IdentitySheet from './components/onboarding/IdentitySheet'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import NewPlayer from './pages/NewPlayer'
import Matches from './pages/Matches'
import NewMatch from './pages/NewMatch'
import MatchDetail from './pages/MatchDetail'
import Stats from './pages/Stats'
import Trainings from './pages/Trainings'
import Boedekasse from './pages/Boedekasse'

function AppContent() {
  const initPlayers   = usePlayerStore((s) => s.init)
  const initMatches   = useMatchStore((s) => s.init)
  const initTrainings = useTrainingStore((s) => s.init)
  const initFines     = useFineStore((s) => s.init)
  const initTheme     = useThemeStore((s) => s.init)
  const players       = usePlayerStore((s) => s.players)

  const [showIdentitySheet, setShowIdentitySheet] = useState(() => {
    const hasId    = !!localStorage.getItem('spartak_my_player_id')
    const dismissed = localStorage.getItem('spartak_identity_dismissed') === 'true'
    return !hasId && !dismissed
  })

  useEffect(() => {
    async function boot() {
      // Players and matches can load in parallel.
      // Trainings must wait for matches so we can exclude match-day dates.
      // Fines are independent and can load alongside everything else.
      await Promise.all([initPlayers(), initMatches(), initFines()])
      const matchDates = new Set(
        useMatchStore.getState().matches.map((m) => m.date.slice(0, 10)),
      )
      await initTrainings(matchDates)
    }
    boot().catch(console.error)
  }, [initPlayers, initMatches, initTrainings, initFines])

  useEffect(() => {
    const cleanup = initTheme()
    return cleanup
  }, [initTheme])

  const handleIdentitySelect = (playerId: string) => {
    localStorage.setItem('spartak_my_player_id', playerId)
    setShowIdentitySheet(false)
  }

  const handleIdentityDismiss = () => {
    localStorage.setItem('spartak_identity_dismissed', 'true')
    setShowIdentitySheet(false)
  }

  return (
    <>
      {showIdentitySheet && players.length > 0 && (
        <IdentitySheet
          onSelect={handleIdentitySelect}
          onDismiss={handleIdentityDismiss}
        />
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Home />} />
          <Route path="/spillere"      element={<Players />} />
          <Route path="/spillere/ny"   element={<NewPlayer />} />
          <Route path="/spillere/:id"  element={<PlayerDetail />} />
          <Route path="/kampe"         element={<Matches />} />
          <Route path="/kampe/ny"      element={<NewMatch />} />
          <Route path="/kampe/:id"     element={<MatchDetail />} />
          <Route path="/traeninger"    element={<Trainings />} />
          <Route path="/statistik"     element={<Stats />} />
          <Route path="/boedekasse"    element={<Boedekasse />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
