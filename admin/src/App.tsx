import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import ResourceCrud from './components/ResourceCrud'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { resources } from './resources'

function Gate() {
  const { loading, session, profile, signOut } = useAuth()

  if (loading) return <div className="center-page">Carregando…</div>
  if (!session) return <Login />
  if (!profile || !['admin_local', 'admin_global'].includes(profile.role) || !profile.is_active) {
    return (
      <div className="center-page">
        <div className="card login-card">
          <h1>Acesso restrito</h1>
          <p>Sua conta não tem permissão de administrador.</p>
          <button className="btn" onClick={signOut}>Sair</button>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        {resources.map((r) =>
          r.parent ? (
            <Route
              key={r.key}
              path={`/${r.parent.resourceKey}/:parentId/${r.key}`}
              element={<ResourceCrud resource={r} />}
            />
          ) : (
            <Route key={r.key} path={`/${r.key}`} element={<ResourceCrud resource={r} />} />
          ),
        )}
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </BrowserRouter>
  )
}
