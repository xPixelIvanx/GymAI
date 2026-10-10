import { Suspense, lazy } from 'react'
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ProgressPage } from './features/progress/ProgressPage'
import { RoutinesPage } from './features/routines/RoutinesPage'
import { TodayPage } from './features/today/TodayPage'
import { WorkoutPlayer } from './features/today/WorkoutPlayer'
import { useAuth } from './lib/auth'
const CoachPage = lazy(() => import('./features/coach/CoachPage').then((m) => ({ default: m.CoachPage })))
const Preview = lazy(() => import('./dev/Preview').then((m) => ({ default: m.Preview })))
import { IconCoach, IconMe, IconProgress, IconRoutines, IconToday } from './ui/icons'

const TABS = [
  { to: '/hoy', label: 'Hoy', icon: <IconToday /> },
  { to: '/coach', label: 'Coach', icon: <IconCoach /> },
  { to: '/progreso', label: 'Progreso', icon: <IconProgress /> },
  { to: '/rutinas', label: 'Rutinas', icon: <IconRoutines /> },
  { to: '/yo', label: 'Yo', icon: <IconMe /> },
]

function Shell() {
  const { user, loading } = useAuth()
  if (loading) return <main className="page"><p className="muted">Cargando…</p></main>
  if (!user) return <AuthPage />
  return (
    <div className="shell">
      <nav className="tabbar" aria-label="Principal">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to}>
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {import.meta.env.DEV && <Route path="__preview" element={<Suspense fallback={null}><Preview /></Suspense>} />}
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/hoy" replace />} />
        <Route path="hoy" element={<TodayPage />} />
        <Route path="entrenar/:routineId/:workoutId" element={<WorkoutPlayer />} />
        <Route path="coach" element={<Suspense fallback={null}><CoachPage /></Suspense>} />
        <Route path="progreso" element={<ProgressPage />} />
        <Route path="rutinas" element={<RoutinesPage />} />
        <Route path="yo" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/hoy" replace />} />
      </Route>
    </Routes>
  )
}
