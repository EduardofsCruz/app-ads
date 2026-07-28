import { createClient } from '@supabase/supabase-js'

// Produção (sdt-bsb-production). A anon key é pública por design; a segurança
// vem das políticas RLS. Use .env (VITE_SUPABASE_URL/ANON_KEY) para apontar
// para o staging durante testes.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://rnjcvbgnvuwagudkftyq.supabase.co'
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuamN2YmdudnV3YWd1ZGtmdHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDY4OTAsImV4cCI6MjA2NzA4Mjg5MH0.0-kSaDhaKqHBlcdqF8ABfZJJnhpijo6CsIXOcDudWYU'

export const supabase = createClient(url, anonKey)
