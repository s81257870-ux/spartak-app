import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { usePlayerStore } from './store/playerStore'
import { useMatchStore } from './store/matchStore'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import NewPlayer from './pages/NewPlayer'
import Matches from './pages/Matches'
import NewMatch from './pages/NewMatch'
import MatchDetail from './pages/MatchDetail'
import Stats from './pages/Stats'

function AppContent() {
  const initPlayers = usePlayerStore((s) => s.init)
  const initMatches = useMatchStore((s) => s.init)

  useEffect(() => {
    Promise.all([initPlayers(), initMatches()]).catch(console.error)
  }, [initPlayers, initMatches])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"              element={<Home />} />
        <Route path="/spillere"      element={<Players />} />
        <Route path="/spillere/ny"   element={<NewPlayer />} />
        <Route path="/spillere/:id"  element={<PlayerDetail />} />
        <Route path="/kampe"         element={<Matches />} />
        <Route path="/kampe/ny"      element={<NewMatch />} />
        <Route path="/kampe/:id"     element={<MatchDetail />} />
        <Route path="/statistik"     element={<Stats />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
