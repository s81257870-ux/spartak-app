import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex flex-col" style={{ height: '100svh', background: 'var(--bg-app)' }}>
      <main className="flex-1 overflow-y-auto pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
