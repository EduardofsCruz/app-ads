import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Field, Resource } from '../resources'

type Row = Record<string, any>

const AGE_LABELS: Record<string, string> = { children: 'Crianças', adolescent: 'Adolescentes', adult: 'Adultos' }
const DIFF_LABELS: Record<string, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }

function toDatetimeLocal(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ResourceCrud({ resource }: { resource: Resource }) {
  const { profile, churches, selectedChurch } = useAuth()
  const params = useParams()
  const parentId = resource.parent ? params.parentId : undefined

  const [rows, setRows] = useState<Row[]>([])
  const [relationOptions, setRelationOptions] = useState<Record<string, Row[]>>({})
  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<Row>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const churchLabel = useMemo(
    () => Object.fromEntries(churches.map((c) => [c.id, c.name])),
    [churches],
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from(resource.table).select('*').limit(500)
    if (resource.parent && parentId) query = query.eq(resource.parent.column, parentId)
    if (resource.churchScoped && selectedChurch) query = query.eq('church_id', selectedChurch)
    if (resource.orderBy) {
      query = query.order(resource.orderBy.column, { ascending: resource.orderBy.ascending ?? true })
    }
    const { data, error: err } = await query
    if (err) setError(err.message)
    setRows((data as Row[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Carrega opções das relações usadas no formulário.
    resource.fields
      .filter((f) => f.type === 'relation' && f.relation)
      .forEach((f) => {
        supabase
          .from(f.relation!.table)
          .select(`id, ${f.relation!.labelColumn}`)
          .order(f.relation!.labelColumn)
          .then(({ data }) =>
            setRelationOptions((prev) => ({ ...prev, [f.name]: (data as Row[]) ?? [] })),
          )
      })
  }, [resource.key, selectedChurch, parentId])

  const openCreate = () => {
    const initial: Row = {}
    resource.fields.forEach((f) => {
      if (f.type === 'checkbox') initial[f.name] = true
    })
    setForm(initial)
    setCreating(true)
    setEditing(null)
    setError(null)
  }

  const openEdit = (row: Row) => {
    const values: Row = {}
    resource.fields.forEach((f) => {
      if (f.type === 'datetime') values[f.name] = toDatetimeLocal(row[f.name])
      else if (f.type === 'array') values[f.name] = (row[f.name] ?? []).join(', ')
      else values[f.name] = row[f.name]
    })
    setForm(values)
    setEditing(row)
    setCreating(false)
    setError(null)
  }

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }

  const serialize = (): Row | { __error: string } => {
    const out: Row = {}
    for (const f of resource.fields) {
      let v = form[f.name]
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v)
      else if (f.type === 'array')
        v = typeof v === 'string'
          ? v.split(',').map((s: string) => s.trim()).filter(Boolean)
          : v ?? []
      else if (f.type === 'checkbox') v = Boolean(v)
      else if (f.type === 'datetime') v = v ? new Date(v).toISOString() : null
      else if (v === '' || v === undefined) v = null
      if (f.required && (v === null || (Array.isArray(v) && v.length === 0)))
        return { __error: `Preencha o campo "${f.label}".` }
      out[f.name] = v
    }
    if (resource.churchScoped) {
      const church = profile?.role === 'admin_local' ? profile.church_id : selectedChurch
      if (!church) return { __error: 'Selecione uma igreja no topo para criar/editar conteúdo.' }
      out.church_id = church
    }
    if (resource.parent && parentId) out[resource.parent.column] = parentId
    return out
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const payload = serialize()
    if ('__error' in payload) {
      setError(payload.__error as string)
      return
    }
    setSaving(true)
    setError(null)
    const result = editing
      ? await supabase.from(resource.table).update(payload).eq('id', editing.id)
      : await supabase.from(resource.table).insert(payload)
    setSaving(false)
    if (result.error) {
      setError(
        result.error.message.includes('row-level security')
          ? 'Permissão negada pelas políticas de segurança (verifique seu papel e a igreja selecionada).'
          : result.error.message,
      )
      return
    }
    closeForm()
    load()
  }

  const remove = async (row: Row) => {
    if (!confirm(`Excluir ${resource.singular.toLowerCase()}? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await supabase.from(resource.table).delete().eq('id', row.id)
    if (err) setError(err.message)
    else load()
  }

  const formatCell = (field: Field | undefined, name: string, value: any): string => {
    if (value === null || value === undefined) return '—'
    if (name === 'church_id') return churchLabel[value] ?? '—'
    if (name === 'age_group') return AGE_LABELS[value] ?? value
    if (name === 'difficulty') return DIFF_LABELS[value] ?? value
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
    if (Array.isArray(value)) return value.join(', ')
    if (field?.type === 'datetime' || /(_at|_date|^datetime$)/.test(name))
      return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    if (field?.options) return field.options.find((o) => o.value === value)?.label ?? value
    const s = String(value)
    return s.length > 80 ? s.slice(0, 80) + '…' : s
  }

  const fieldByName = (name: string) => resource.fields.find((f) => f.name === name)
  const showForm = creating || editing !== null
  const canCreate = resource.canCreate !== false
  const canDelete = resource.canDelete !== false

  return (
    <div>
      <div className="page-head">
        <h1>{resource.title}</h1>
        {canCreate && (
          <button className="btn primary" onClick={openCreate}>
            + Nova {resource.singular.toLowerCase() === resource.singular ? resource.singular : resource.singular}
          </button>
        )}
      </div>

      {resource.churchScoped && !selectedChurch && profile?.role === 'admin_global' && (
        <p className="hint">
          Exibindo conteúdo de todas as igrejas. Selecione uma igreja no topo para criar registros.
        </p>
      )}
      {error && !showForm && <p className="error">{error}</p>}

      {showForm && (
        <form className="card form" onSubmit={save}>
          <h2>{editing ? `Editar ${resource.singular.toLowerCase()}` : `Nova ${resource.singular.toLowerCase()}`}</h2>
          {resource.fields.map((f) => (
            <label key={f.name} className={f.type === 'checkbox' ? 'field checkbox' : 'field'}>
              <span>{f.label}{f.required ? ' *' : ''}</span>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.name] ?? ''}
                  rows={4}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                >
                  <option value="">Selecione…</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === 'relation' ? (
                <select
                  value={form[f.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                >
                  <option value="">{f.relation?.optional ? '(nenhum)' : 'Selecione…'}</option>
                  {(relationOptions[f.name] ?? []).map((o) => (
                    <option key={o.id} value={o.id}>{o[f.relation!.labelColumn]}</option>
                  ))}
                </select>
              ) : f.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={Boolean(form[f.name])}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : f.type === 'time' ? 'time' : 'text'}
                  value={form[f.name] ?? ''}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </label>
          ))}
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="btn" onClick={closeForm}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="hint">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="hint">Nenhum registro encontrado.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {resource.listColumns.map((c) => (
                  <th key={c}>{fieldByName(c)?.label ?? c}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id ?? JSON.stringify(row)}>
                  {resource.listColumns.map((c) => (
                    <td key={c}>{formatCell(fieldByName(c), c, row[c])}</td>
                  ))}
                  <td className="row-actions">
                    {resource.childLink && (
                      <Link className="btn small" to={`/${resource.key}/${row.id}/${resource.childLink.key}`}>
                        {resource.childLink.label}
                      </Link>
                    )}
                    <button className="btn small" onClick={() => openEdit(row)}>Editar</button>
                    {canDelete && (
                      <button className="btn small danger" onClick={() => remove(row)}>Excluir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
