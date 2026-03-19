import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useMatchStore } from '../store/matchStore'

export default function NewMatch() {
  const navigate = useNavigate()
  const addMatch = useMatchStore((s) => s.addMatch)

  const today = new Date().toISOString().split('T')[0]

  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')
  const [scoreUs, setScoreUs] = useState('0')
  const [scoreThem, setScoreThem] = useState('0')
  const [isCompleted, setIsCompleted] = useState(false)

  const submit = () => {
    if (!opponent.trim()) return
    const id = addMatch({
      opponent: opponent.trim(),
      date,
      location: location.trim() || 'Ukendt sted',
      scoreUs: parseInt(scoreUs) || 0,
      scoreThem: parseInt(scoreThem) || 0,
    })
    if (isCompleted) {
      // Mark as completed immediately
      useMatchStore.getState().completeMatch(id)
    }
    navigate(`/kampe/${id}`)
  }

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-green-400 active:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-white">Ny kamp</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Modstander *</label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="Modstanderhold"
            autoFocus
            className="w-full bg-[#1a1d27] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500/50 placeholder-slate-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Dato</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1a1d27] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Sted</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="f.eks. Valby Idrætspark"
            className="w-full bg-[#1a1d27] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500/50 placeholder-slate-500"
          />
        </div>

        {/* Toggle for completed match */}
        <div className="flex items-center justify-between bg-[#1a1d27] rounded-xl px-4 py-3.5">
          <span className="text-white text-sm">Kampen er afsluttet</span>
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isCompleted ? 'bg-green-500' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isCompleted ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {isCompleted && (
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block">Resultat</label>
            <div className="flex items-center gap-3 bg-[#1a1d27] rounded-xl p-4">
              <div className="flex-1 text-center">
                <p className="text-slate-400 text-xs mb-2">Spartak</p>
                <input
                  type="number"
                  min="0"
                  value={scoreUs}
                  onChange={(e) => setScoreUs(e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-3xl font-bold text-center rounded-lg py-2 focus:outline-none border border-white/10 focus:border-green-500/50"
                />
              </div>
              <span className="text-slate-500 text-2xl font-bold">–</span>
              <div className="flex-1 text-center">
                <p className="text-slate-400 text-xs mb-2">Modstander</p>
                <input
                  type="number"
                  min="0"
                  value={scoreThem}
                  onChange={(e) => setScoreThem(e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-3xl font-bold text-center rounded-lg py-2 focus:outline-none border border-white/10 focus:border-green-500/50"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!opponent.trim()}
          className="w-full bg-green-500 disabled:bg-green-900 disabled:text-green-700 text-black font-bold py-4 rounded-2xl text-base mt-2 active:scale-[0.98] transition-transform"
        >
          Opret kamp
        </button>
      </div>
    </div>
  )
}
