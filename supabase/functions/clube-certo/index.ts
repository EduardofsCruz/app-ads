// =============================================================================
// SDT BSB — Edge Function: integração com o Clube Certo (clube de benefícios)
// Docs do parceiro: https://integrations.clubecerto.com.br/docs/
//
// Segredos necessários (supabase secrets set ...):
//   CLUBE_CERTO_BASE_URL      ex.: https://integrations.clubecerto.com.br
//   CLUBE_CERTO_API_TOKEN     token fornecido pelo Clube Certo
//   CLUBE_CERTO_COMPANY_CODE  código da empresa/convênio no Clube Certo
//
// Ações (POST { action: ... }):
//   join    — cadastra o usuário logado como beneficiário (usa o CPF salvo em
//             benefit_memberships, criado pelo app com status 'pending')
//   remove  — remove o beneficiário no parceiro e marca 'removed'
//   status  — consulta o status do beneficiário no parceiro
//
// IMPORTANTE: os paths exatos dos endpoints do Clube Certo devem ser
// confirmados na documentação (acesso mediante credenciais do convênio) e
// ajustados nos pontos marcados com TODO antes do deploy.
// =============================================================================
import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE_URL = Deno.env.get("CLUBE_CERTO_BASE_URL") ?? "";
const API_TOKEN = Deno.env.get("CLUBE_CERTO_API_TOKEN") ?? "";
const COMPANY_CODE = Deno.env.get("CLUBE_CERTO_COMPANY_CODE") ?? "";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!BASE_URL || !API_TOKEN || !COMPANY_CODE) {
    return json({ error: "integração Clube Certo não configurada (secrets ausentes)" }, 503);
  }

  // Cliente autenticado como o usuário chamador (valida o JWT do app).
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "não autenticado" }, 401);

  // Cliente administrativo para atualizar o estado da sincronização.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { action } = await req.json().catch(() => ({}));
  const { data: membership } = await admin
    .from("benefit_memberships")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return json({ error: "adesão não solicitada (CPF não cadastrado)" }, 404);

  const partnerHeaders = {
    "Content-Type": "application/json",
    // TODO: confirmar na doc o esquema de autenticação (header/token).
    Authorization: `Bearer ${API_TOKEN}`,
  };

  try {
    switch (action) {
      case "join": {
        const { data: profile } = await admin
          .from("profiles").select("full_name").eq("id", user.id).maybeSingle();
        // TODO: confirmar path e payload exatos na doc do Clube Certo.
        const res = await fetch(`${BASE_URL}/api/company/${COMPANY_CODE}/beneficiaries`, {
          method: "POST",
          headers: partnerHeaders,
          body: JSON.stringify({
            cpf: membership.cpf,
            name: profile?.full_name ?? "",
            email: user.email,
          }),
        });
        const body = await res.json().catch(() => ({}));
        await admin.from("benefit_memberships").update(
          res.ok
            ? { status: "active", external_id: body.id ?? null, synced_at: new Date().toISOString(), error_message: null }
            : { status: "failed", error_message: `HTTP ${res.status}` },
        ).eq("user_id", user.id);
        return json({ ok: res.ok, status: res.ok ? "active" : "failed" }, res.ok ? 200 : 502);
      }
      case "remove": {
        // TODO: confirmar path exato na doc do Clube Certo.
        const res = await fetch(
          `${BASE_URL}/api/company/${COMPANY_CODE}/beneficiaries/${membership.cpf}`,
          { method: "DELETE", headers: partnerHeaders },
        );
        await admin.from("benefit_memberships")
          .update({ status: res.ok ? "removed" : "failed", synced_at: new Date().toISOString() })
          .eq("user_id", user.id);
        return json({ ok: res.ok }, res.ok ? 200 : 502);
      }
      case "status": {
        // TODO: confirmar path exato na doc do Clube Certo.
        const res = await fetch(
          `${BASE_URL}/api/company/${COMPANY_CODE}/beneficiaries/${membership.cpf}`,
          { headers: partnerHeaders },
        );
        const body = await res.json().catch(() => ({}));
        return json({ ok: res.ok, partner: body, local: membership });
      }
      default:
        return json({ error: "action inválida (use join | remove | status)" }, 400);
    }
  } catch (e) {
    return json({ error: `falha ao chamar o parceiro: ${e instanceof Error ? e.message : e}` }, 502);
  }
});
