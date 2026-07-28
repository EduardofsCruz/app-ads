/* Painel Administrativo — Clínica Vittalit */

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.VITTALIT;
const db = window.sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FN_URL = SUPABASE_URL + '/functions/v1/vittalit-admin';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '';
const fmtCpf = (c) => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '—';
const flash = (el, text, ok = false) => {
  el.textContent = text;
  el.classList.remove('ok', 'err');
  el.classList.add('show', ok ? 'ok' : 'err');
  setTimeout(() => el.classList.remove('show'), 6000);
};

let me = null;
let patients = [];
let current = null; // paciente aberto no detalhe

/* ---------- auth ---------- */
$('#loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = $('#loginBtn'); const msg = $('#authMsg');
  msg.classList.remove('show');
  btn.disabled = true; btn.textContent = 'Entrando…';
  const { error } = await db.auth.signInWithPassword({
    email: $('#login').value.trim().toLowerCase(),
    password: $('#password').value,
  });
  btn.disabled = false; btn.textContent = 'Entrar';
  if (error) { flash(msg, 'E-mail ou senha incorretos.'); return; }
  boot();
});

$('#logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });

async function boot() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return;
  const { data: profile } = await db.from('vittalit_users').select('*').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'admin') {
    await db.auth.signOut();
    flash($('#authMsg'), 'Este acesso não tem permissão de administrador.');
    return;
  }
  me = profile;
  $('#authScreen').classList.add('hidden');
  $('#appScreen').classList.remove('hidden');
  $('#whoName').textContent = profile.full_name;
  loadPatients();
  loadSettings();
}

/* ---------- tabs / navegação ---------- */
const showPanel = (name) => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
};
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showPanel(t.dataset.tab)));
$('#backBtn').addEventListener('click', () => { current = null; showPanel('patients'); });

/* ---------- modais ---------- */
document.querySelectorAll('.modal-bg').forEach((m) => {
  m.addEventListener('click', (ev) => { if (ev.target === m) m.classList.remove('show'); });
  m.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', () => m.classList.remove('show')));
});

/* ---------- edge function helper ---------- */
async function callAdminFn(payload) {
  const { data: { session } } = await db.auth.getSession();
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/* ---------- pacientes ---------- */
async function loadPatients() {
  const { data } = await db.from('vittalit_users')
    .select('*').eq('role', 'patient').order('full_name');
  patients = data || [];
  renderPatients();
}

function renderPatients() {
  const q = $('#patientSearch').value.trim().toLowerCase();
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const list = patients.filter((p) => !q || norm(p.full_name).includes(norm(q)) || (p.cpf || '').includes(q.replace(/\D/g, '') || '§'));
  const box = $('#patientList');
  if (!list.length) {
    box.innerHTML = `<p class="empty">${patients.length ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.<br><small>Clique em "+ Novo paciente" para começar.</small>'}</p>`;
    return;
  }
  box.innerHTML = list.map((p) => `
    <div class="item click" data-id="${p.id}">
      <span class="ic"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
      <div class="tx"><b>${esc(p.full_name)}</b><small>CPF ${fmtCpf(p.cpf)}${p.phone ? ' · ' + esc(p.phone) : ''}</small></div>
      <span class="badge blue">abrir ›</span>
    </div>`).join('');
  box.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => openPatient(el.dataset.id)));
}
$('#patientSearch').addEventListener('input', renderPatients);

/* novo paciente */
$('#newPatientBtn').addEventListener('click', () => {
  ['np_name', 'np_cpf', 'np_phone', 'np_email'].forEach((id) => $('#' + id).value = '');
  $('#np_birth').value = '';
  $('#np_pass').value = 'Vit' + Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
  $('#patientModal').classList.add('show');
});

$('#createPatientBtn').addEventListener('click', async () => {
  const btn = $('#createPatientBtn'); const msg = $('#patientMsg');
  btn.disabled = true; btn.textContent = 'Cadastrando…';
  const out = await callAdminFn({
    action: 'create_patient',
    full_name: $('#np_name').value,
    cpf: $('#np_cpf').value,
    phone: $('#np_phone').value,
    birth_date: $('#np_birth').value,
    email: $('#np_email').value,
    password: $('#np_pass').value,
  });
  btn.disabled = false; btn.textContent = 'Cadastrar paciente';
  if (out.error) { flash(msg, out.error); return; }
  flash(msg, `Paciente cadastrado! Login: ${out.login} — anote a senha.`, true);
  loadPatients();
  setTimeout(() => $('#patientModal').classList.remove('show'), 1800);
});

/* ---------- detalhe do paciente ---------- */
async function openPatient(id) {
  current = patients.find((p) => p.id === id);
  if (!current) return;
  showPanel('detail');
  const box = $('#detailBox');
  box.innerHTML = '<div class="card"><p class="empty">Carregando…</p></div>';

  const [{ data: exams }, { data: plans }, { data: pregs }] = await Promise.all([
    db.from('vittalit_exams').select('*').eq('patient_id', id).order('exam_date', { ascending: false }),
    db.from('vittalit_meal_plans').select('*').eq('patient_id', id).order('updated_at', { ascending: false }).limit(1),
    db.from('vittalit_pregnancies').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(1),
  ]);
  const plan = plans?.[0];
  const preg = pregs?.[0];

  box.innerHTML = `
    <div class="card">
      <h3>${esc(current.full_name)}</h3>
      <p style="color:var(--muted);font-size:.88rem">
        CPF ${fmtCpf(current.cpf)} · ${current.phone ? esc(current.phone) + ' · ' : ''}${current.birth_date ? 'nasc. ' + fmtDate(current.birth_date) : ''}
      </p>
      <div class="toolrow" style="margin:14px 0 0">
        <button class="btn btn-soft btn-sm" id="pwBtn">Redefinir senha</button>
        <button class="btn btn-danger btn-sm" id="delBtn">Excluir paciente</button>
      </div>
      <div class="msg" id="detailMsg" style="margin-top:12px"></div>
    </div>

    <div class="card">
      <div class="toolrow" style="margin-bottom:8px">
        <h3 style="margin:0;flex:1">Resultados de exames (${exams?.length || 0})</h3>
        <button class="btn btn-primary btn-sm" id="newExamBtn" style="width:auto">+ Adicionar exame</button>
      </div>
      <div id="examRows">${(exams || []).map((e) => `
        <div class="item">
          <div class="tx"><b>${esc(e.title)}</b><small>${fmtDate(e.exam_date)}${e.gestation_week ? ` · ${e.gestation_week} sem` : ''} · ${e.category}${e.file_path ? '' : ' · sem arquivo'}</small></div>
          <div class="actions">
            ${e.file_path ? `<button class="btn btn-soft btn-sm" data-view="${esc(e.file_path)}">Ver</button>` : ''}
            <button class="btn btn-danger btn-sm" data-delexam="${e.id}" data-path="${esc(e.file_path || '')}">Excluir</button>
          </div>
        </div>`).join('') || '<p class="empty">Nenhum exame lançado.</p>'}
      </div>
    </div>

    <div class="card">
      <h3>Plano alimentar</h3>
      <div class="field">
        <label>Título</label>
        <input id="planTitle" value="${esc(plan?.title || 'Plano alimentar')}">
      </div>
      <div class="field">
        <label>Conteúdo (## para títulos, - para itens, **negrito**)</label>
        <textarea id="planContent" placeholder="## Café da manhã&#10;- 1 fruta&#10;- ...">${esc(plan?.content || '')}</textarea>
      </div>
      <div class="toolrow">
        <button class="btn btn-primary btn-sm" id="savePlanBtn" style="width:auto">Salvar plano</button>
        ${plan ? `<label style="display:flex;align-items:center;gap:8px;font-size:.86rem;font-weight:600;color:var(--muted)"><input type="checkbox" id="planActive" ${plan.active ? 'checked' : ''}> Plano ativo (visível ao paciente)</label>` : ''}
      </div>
    </div>

    <div class="card">
      <h3>Gestação</h3>
      <div class="grid3">
        <div class="field"><label>DUM (última menstruação)</label><input id="pregLmp" type="date" value="${preg?.lmp_date || ''}"></div>
        <div class="field"><label>DPP (parto previsto)</label><input id="pregDue" type="date" value="${preg?.due_date || ''}"></div>
        <div class="field"><label>Acompanhamento ativo?</label>
          <select id="pregActive"><option value="yes" ${preg?.active ? 'selected' : ''}>Sim</option><option value="no" ${!preg || !preg.active ? 'selected' : ''}>Não</option></select>
        </div>
      </div>
      <div class="field"><label>Orientações (visível à paciente)</label><input id="pregNotes" value="${esc(preg?.notes || '')}"></div>
      <button class="btn btn-primary btn-sm" id="savePregBtn" style="width:auto">Salvar gestação</button>
    </div>`;

  const dmsg = $('#detailMsg');

  $('#pwBtn').addEventListener('click', async () => {
    const pass = prompt('Nova senha para ' + current.full_name + ' (mín. 6 caracteres):', 'Vit' + Math.random().toString(36).slice(2, 8));
    if (!pass) return;
    const out = await callAdminFn({ action: 'reset_password', user_id: current.id, password: pass });
    flash(dmsg, out.error || 'Senha redefinida! Anote e entregue ao paciente: ' + pass, !out.error);
  });

  $('#delBtn').addEventListener('click', async () => {
    if (!confirm(`Excluir ${current.full_name}? Todos os exames e arquivos serão apagados. Esta ação não pode ser desfeita.`)) return;
    const out = await callAdminFn({ action: 'delete_patient', user_id: current.id });
    if (out.error) { flash(dmsg, out.error); return; }
    await loadPatients();
    showPanel('patients');
  });

  $('#newExamBtn').addEventListener('click', () => {
    ['ex_title', 'ex_notes', 'ex_week'].forEach((id) => $('#' + id).value = '');
    $('#ex_date').value = new Date().toISOString().slice(0, 10);
    $('#ex_cat').value = 'outros';
    $('#ex_file').value = '';
    $('#examModal').classList.add('show');
  });

  box.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', async () => {
    const { data } = await db.storage.from('vittalit').createSignedUrl(b.dataset.view, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }));

  box.querySelectorAll('[data-delexam]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Excluir este exame?')) return;
    if (b.dataset.path) await db.storage.from('vittalit').remove([b.dataset.path]);
    await db.from('vittalit_exams').delete().eq('id', b.dataset.delexam);
    openPatient(current.id);
  }));

  $('#savePlanBtn').addEventListener('click', async () => {
    const btn = $('#savePlanBtn');
    btn.disabled = true;
    const payload = {
      patient_id: current.id,
      title: $('#planTitle').value.trim() || 'Plano alimentar',
      content: $('#planContent').value,
      active: $('#planActive') ? $('#planActive').checked : true,
      created_by: me.id,
      updated_at: new Date().toISOString(),
    };
    const q = plan
      ? db.from('vittalit_meal_plans').update(payload).eq('id', plan.id)
      : db.from('vittalit_meal_plans').insert(payload);
    const { error } = await q;
    btn.disabled = false;
    flash(dmsg, error ? error.message : 'Plano alimentar salvo!', !error);
    if (!error && !plan) openPatient(current.id);
  });

  $('#savePregBtn').addEventListener('click', async () => {
    const btn = $('#savePregBtn');
    btn.disabled = true;
    const payload = {
      patient_id: current.id,
      lmp_date: $('#pregLmp').value || null,
      due_date: $('#pregDue').value || null,
      active: $('#pregActive').value === 'yes',
      notes: $('#pregNotes').value.trim() || null,
    };
    const q = preg
      ? db.from('vittalit_pregnancies').update(payload).eq('id', preg.id)
      : db.from('vittalit_pregnancies').insert(payload);
    const { error } = await q;
    btn.disabled = false;
    flash(dmsg, error ? error.message : 'Dados da gestação salvos!', !error);
  });
}

/* salvar exame (modal) */
$('#saveExamBtn').addEventListener('click', async () => {
  if (!current) return;
  const btn = $('#saveExamBtn'); const msg = $('#examMsg');
  const title = $('#ex_title').value.trim();
  if (!title) { flash(msg, 'Informe o título do exame.'); return; }
  btn.disabled = true; btn.textContent = 'Salvando…';

  let filePath = null;
  const file = $('#ex_file').files[0];
  if (file) {
    const clean = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    filePath = `exams/${current.id}/${Date.now()}-${clean}`;
    const { error: upErr } = await db.storage.from('vittalit').upload(filePath, file, { contentType: file.type });
    if (upErr) {
      btn.disabled = false; btn.textContent = 'Salvar exame';
      flash(msg, 'Erro ao enviar arquivo: ' + upErr.message);
      return;
    }
  }

  const week = parseInt($('#ex_week').value, 10);
  const { error } = await db.from('vittalit_exams').insert({
    patient_id: current.id,
    title,
    category: $('#ex_cat').value,
    exam_date: $('#ex_date').value || new Date().toISOString().slice(0, 10),
    gestation_week: Number.isFinite(week) ? week : null,
    notes: $('#ex_notes').value.trim() || null,
    file_path: filePath,
    created_by: me.id,
  });
  btn.disabled = false; btn.textContent = 'Salvar exame';
  if (error) { flash(msg, error.message); return; }
  flash(msg, 'Exame salvo! O paciente já pode ver no portal.', true);
  setTimeout(() => { $('#examModal').classList.remove('show'); openPatient(current.id); }, 1200);
});

/* ---------- configurações do site ---------- */
const SETTING_KEYS = ['whatsapp', 'phone', 'email', 'facebook', 'address'];

async function loadSettings() {
  const { data } = await db.from('vittalit_settings').select('key,value');
  (data || []).forEach((r) => {
    const el = $('#set_' + r.key);
    if (el) el.value = r.value;
  });
}

$('#saveSettingsBtn').addEventListener('click', async () => {
  const btn = $('#saveSettingsBtn'); const msg = $('#settingsMsg');
  btn.disabled = true;
  const rows = SETTING_KEYS.map((k) => ({
    key: k,
    value: ($('#set_' + k).value || '').trim(),
    updated_at: new Date().toISOString(),
  }));
  const wa = rows.find((r) => r.key === 'whatsapp');
  wa.value = wa.value.replace(/\D/g, '');
  const { error } = await db.from('vittalit_settings').upsert(rows);
  btn.disabled = false;
  flash(msg, error ? error.message : 'Configurações salvas! O site já usa os novos dados.', !error);
});

/* ---------- minha conta ---------- */
$('#changePassBtn').addEventListener('click', async () => {
  const msg = $('#accountMsg');
  const p1 = $('#newPass').value, p2 = $('#newPass2').value;
  if (p1.length < 6) { flash(msg, 'A senha deve ter ao menos 6 caracteres.'); return; }
  if (p1 !== p2) { flash(msg, 'As senhas não conferem.'); return; }
  const { error } = await db.auth.updateUser({ password: p1 });
  flash(msg, error ? error.message : 'Senha alterada com sucesso!', !error);
  if (!error) { $('#newPass').value = ''; $('#newPass2').value = ''; }
});

/* sessão persistida */
boot();
