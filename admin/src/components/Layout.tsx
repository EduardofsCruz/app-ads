import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { resources } from '../resources'

const GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Conteúdo', keys: ['devotionals', 'events', 'notifications', 'live-streams', 'christian-tips', 'service-times'] },
  { title: 'Ensino', keys: ['courses', 'quiz', 'word-games'] },
  { title: 'Comunidade', keys: ['testimonials', 'prayer-requests', 'users'] },
  { title: 'Serviços', keys: ['benefit-partners', 'telemedicine'] },
  { title: 'Administração', keys: ['churches'] },
]

export default function Layout() {
  const { profile, churches, selectedChurch, setSelectedChurch, signOut } = useAuth()
  const isGlobal = profile?.role === 'admin_global'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <strong>SDT BSB</strong>
          <span>Painel Administrativo</span>
        </div>
        <nav>
          <NavLink to="/" end>Início</NavLink>
          {GROUPS.map((g) => {
            const items = g.keys
              .map((k) => resources.find((r) => r.key === k)!)
              .filter((r) => r && (!r.adminGlobalOnly || isGlobal))
            if (items.length === 0) return null
            return (
              <div key={g.title} className="nav-group">
                <span className="nav-title">{g.title}</span>
                {items.map((r) => (
                  <NavLink key={r.key} to={`/${r.key}`}>{r.title}</NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          {isGlobal ? (
            <select
              value={selectedChurch ?? ''}
              onChange={(e) => setSelectedChurch(e.target.value || null)}
            >
              <option value="">Todas as igrejas</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}/{c.state}</option>
              ))}
            </select>
          ) : (
            <span className="church-chip">
              {churches.find((c) => c.id === profile?.church_id)?.name ?? 'Minha igreja'}
            </span>
          )}
          <div className="user-info">
            <span>{profile?.full_name}</span>
            <small>{profile?.role === 'admin_global' ? 'Admin global' : 'Admin da igreja'}</small>
            <button className="btn small" onClick={signOut}>Sair</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
