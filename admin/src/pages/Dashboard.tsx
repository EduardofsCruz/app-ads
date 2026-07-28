import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

interface Stat {
  label: string
  table: string
  link: string
  churchScoped?: boolean
  count?: number
}

const STATS: Stat[] = [
  { label: 'Usuários', table: 'profiles', link: '/users' },
  { label: 'Devocionais', table: 'devotionals', link: '/devotionals', churchScoped: true },
  { label: 'Eventos', table: 'events', link: '/events', churchScoped: true },
  { label: 'Cursos', table: 'courses', link: '/courses', churchScoped: true },
  { label: 'Perguntas de quiz', table: 'quiz_questions', link: '/quiz' },
  { label: 'Jogos de palavras', table: 'word_games', link: '/word-games' },
  { label: 'Testemunhos', table: 'testimonials', link: '/testimonials', churchScoped: true },
  { label: 'Pedidos de oração', table: 'prayer_requests', link: '/prayer-requests', churchScoped: true },
  { label: 'Parceiros do clube', table: 'benefit_partners', link: '/benefit-partners' },
]

export default function Dashboard() {
  const { selectedChurch } = useAuth()
  const [stats, setStats] = useState<Stat[]>(STATS)

  useEffect(() => {
    Promise.all(
      STATS.map(async (s) => {
        let q = supabase.from(s.table).select('*', { count: 'exact', head: true })
        if (s.churchScoped && selectedChurch) q = q.eq('church_id', selectedChurch)
        const { count } = await q
        return { ...s, count: count ?? 0 }
      }),
    ).then(setStats)
  }, [selectedChurch])

  return (
    <div>
      <div className="page-head">
        <h1>Visão geral</h1>
      </div>
      <div className="stats-grid">
        {stats.map((s) => (
          <Link key={s.table} to={s.link} className="card stat">
            <span className="stat-count">{s.count ?? '…'}</span>
            <span className="stat-label">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
