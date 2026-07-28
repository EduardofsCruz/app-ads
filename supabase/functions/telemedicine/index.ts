// =============================================================================
// SDT BSB — Edge Function: telemedicina via API de parceiro (scaffold)
//
// Estrutura preparada para plugar qualquer parceiro (Conexa, Docway, etc.):
// cada parceiro é um "adapter" resolvido pelo slug cadastrado em
// public.telemedicine_providers. Segredos por parceiro ficam em secrets com o
// prefixo do slug, ex.: TELE_CONEXA_API_KEY.
//
// Ações (POST { action, ... }):
//   request  — cria a solicitação na API do parceiro a partir de uma linha de
//              telemedicine_appointments com status 'requested'
//   cancel   — cancela a consulta no parceiro e marca 'canceled'
// =============================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface Adapter {
  createAppointment(input: {
    cpfOrEmail: string;
    specialty: string | null;
    scheduledAt: string | null;
  }): Promise<{ externalId: string; joinUrl: string | null; scheduledAt: string | null }>;
  cancelAppointment(externalId: string): Promise<void>;
}

// Adapter de exemplo — substituir pelas chamadas reais quando o contrato com o
// parceiro for fechado. Um adapter novo = um bloco novo neste registro.
const adapters: Record<string, (env: (k: string) => string | undefined) => Adapter> = {
  // conexa: (env) => ({ ... usa env("TELE_CONEXA_API_KEY") ... }),
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "não autenticado" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { action, appointment_id } = await req.json().catch(() => ({}));
  if (!appointment_id) return json({ error: "appointment_id obrigatório" }, 400);

  const { data: appointment } = await admin
    .from("telemedicine_appointments")
    .select("*, telemedicine_providers(slug, is_active)")
    .eq("id", appointment_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!appointment) return json({ error: "consulta não encontrada" }, 404);

  const provider = appointment.telemedicine_providers;
  if (!provider?.is_active) return json({ error: "provedor inativo" }, 409);

  const makeAdapter = adapters[provider.slug];
  if (!makeAdapter) {
    return json({ error: `nenhum adapter implementado para '${provider.slug}'` }, 501);
  }
  const adapter = makeAdapter((k) => Deno.env.get(k));

  try {
    switch (action) {
      case "request": {
        const result = await adapter.createAppointment({
          cpfOrEmail: user.email ?? "",
          specialty: appointment.specialty,
          scheduledAt: appointment.scheduled_at,
        });
        await admin.from("telemedicine_appointments").update({
          status: "scheduled",
          external_id: result.externalId,
          join_url: result.joinUrl,
          scheduled_at: result.scheduledAt ?? appointment.scheduled_at,
          updated_at: new Date().toISOString(),
        }).eq("id", appointment.id);
        return json({ ok: true, join_url: result.joinUrl });
      }
      case "cancel": {
        if (appointment.external_id) await adapter.cancelAppointment(appointment.external_id);
        await admin.from("telemedicine_appointments")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", appointment.id);
        return json({ ok: true });
      }
      default:
        return json({ error: "action inválida (use request | cancel)" }, 400);
    }
  } catch (e) {
    return json({ error: `falha no parceiro: ${e instanceof Error ? e.message : e}` }, 502);
  }
});
