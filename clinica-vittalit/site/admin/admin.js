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
  loadTeam();
  loadPartners();
  loadOmbudsman();
}

/* ---------- tabs / navegação ---------- */
const showPanel = (name) => {
  if (!name) return;
  document.querySelectorAll('.tab[data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
};
document.querySelectorAll('.tab[data-tab]').forEach((t) => t.addEventListener('click', () => showPanel(t.dataset.tab)));
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
  flash(msg, out.emailed
    ? `Paciente cadastrado! O acesso foi enviado por e-mail. Login: ${out.login}`
    : `Paciente cadastrado! Login: ${out.login} — anote a senha e entregue ao paciente.`, true);
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

  const [{ data: exams }, { data: pregs }] = await Promise.all([
    db.from('vittalit_exams').select('*').eq('patient_id', id).order('exam_date', { ascending: false }),
    db.from('vittalit_pregnancies').select('*').eq('patient_id', id).order('created_at', { ascending: false }).limit(1),
  ]);
  const preg = pregs?.[0];

  box.innerHTML = `
    <div class="card">
      <h3>${esc(current.full_name)}</h3>
      <p style="color:var(--muted);font-size:.88rem">
        CPF ${fmtCpf(current.cpf)} · ${current.phone ? esc(current.phone) + ' · ' : ''}${current.birth_date ? 'nasc. ' + fmtDate(current.birth_date) : ''}
      </p>
      <div class="toolrow" style="margin:14px 0 0">
        <button class="btn btn-soft btn-sm" id="pwBtn">Redefinir senha</button>
        <button class="btn btn-soft btn-sm" id="mailBtn">Enviar acesso por e-mail</button>
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

  $('#mailBtn').addEventListener('click', async () => {
    const email = prompt(
      'E-mail do paciente para receber o acesso:\n(se o paciente já tem e-mail cadastrado, deixe em branco para usar o mesmo)',
      '');
    if (email === null) return;
    const pass = 'Vit' + Math.random().toString(36).slice(2, 8) + Math.floor(Math.random() * 90 + 10);
    if (!confirm(`Será gerada uma NOVA senha (${pass}) e enviada por e-mail junto com o CPF de login. Continuar?`)) return;
    const out = await callAdminFn({ action: 'send_access_email', user_id: current.id, email: email.trim(), password: pass });
    flash(dmsg, out.error || `Acesso enviado para ${out.email}! Nova senha: ${pass}`, !out.error);
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

/* ---------- equipe (corpo técnico) ---------- */
async function uploadPublic(file, folder) {
  const clean = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${folder}/${Date.now()}-${clean}`;
  const { error } = await db.storage.from('vittalit-public').upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return path;
}
const publicUrl = (p) => `${SUPABASE_URL}/storage/v1/object/public/vittalit-public/${p}`;

async function loadTeam() {
  const { data } = await db.from('vittalit_team').select('*').order('sort').order('name');
  const box = $('#teamList');
  box.innerHTML = (data || []).map((t) => `
    <div class="item">
      ${t.photo_path ? `<img src="${publicUrl(esc(t.photo_path))}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex:none">` : '<span class="ic">👤</span>'}
      <div class="tx"><b>${esc(t.name)}</b><small>${esc(t.role)}${t.detail ? ' · ' + esc(t.detail) : ''}</small></div>
      <div class="actions">
        <button class="btn btn-soft btn-sm" data-tmvis="${t.id}" data-v="${t.visible}">${t.visible ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn btn-danger btn-sm" data-tmdel="${t.id}">Excluir</button>
      </div>
    </div>`).join('') || '<p class="empty">Nenhum profissional cadastrado — o site esconde a seção até você adicionar.</p>';

  box.querySelectorAll('[data-tmvis]').forEach((b) => b.addEventListener('click', async () => {
    await db.from('vittalit_team').update({ visible: b.dataset.v !== 'true' }).eq('id', b.dataset.tmvis);
    loadTeam();
  }));
  box.querySelectorAll('[data-tmdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Excluir este profissional do site?')) return;
    await db.from('vittalit_team').delete().eq('id', b.dataset.tmdel);
    loadTeam();
  }));
}

$('#addTeamBtn').addEventListener('click', async () => {
  const msg = $('#teamMsg'); const btn = $('#addTeamBtn');
  const name = $('#tm_name').value.trim(); const role = $('#tm_role').value.trim();
  if (!name || !role) { flash(msg, 'Preencha nome e especialidade.'); return; }
  btn.disabled = true;
  try {
    let photo_path = null;
    const f = $('#tm_photo').files[0];
    if (f) photo_path = await uploadPublic(f, 'team');
    const { error } = await db.from('vittalit_team').insert({
      name, role, detail: $('#tm_detail').value.trim() || null, photo_path,
    });
    if (error) throw new Error(error.message);
    ['tm_name', 'tm_role', 'tm_detail'].forEach((id) => $('#' + id).value = '');
    $('#tm_photo').value = '';
    flash(msg, 'Profissional adicionado! Já está visível no site.', true);
    loadTeam();
  } catch (e) { flash(msg, e.message); }
  btn.disabled = false;
});

/* ---------- parceiros ---------- */
async function loadPartners() {
  const { data } = await db.from('vittalit_partners').select('*').order('sort').order('name');
  const box = $('#partnerList');
  box.innerHTML = (data || []).map((p) => `
    <div class="item">
      ${p.logo_path ? `<img src="${publicUrl(esc(p.logo_path))}" style="width:42px;height:42px;border-radius:10px;object-fit:contain;flex:none;background:#fff">` : '<span class="ic">🤝</span>'}
      <div class="tx"><b>${esc(p.name)}</b><small>${p.detail ? esc(p.detail) : ''}${p.url ? ' · ' + esc(p.url) : ''}</small></div>
      <div class="actions">
        <button class="btn btn-soft btn-sm" data-ptvis="${p.id}" data-v="${p.visible}">${p.visible ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn btn-danger btn-sm" data-ptdel="${p.id}">Excluir</button>
      </div>
    </div>`).join('') || '<p class="empty">Nenhum parceiro cadastrado — o site esconde a seção até você adicionar.</p>';

  box.querySelectorAll('[data-ptvis]').forEach((b) => b.addEventListener('click', async () => {
    await db.from('vittalit_partners').update({ visible: b.dataset.v !== 'true' }).eq('id', b.dataset.ptvis);
    loadPartners();
  }));
  box.querySelectorAll('[data-ptdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Excluir este parceiro do site?')) return;
    await db.from('vittalit_partners').delete().eq('id', b.dataset.ptdel);
    loadPartners();
  }));
}

$('#addPartnerBtn').addEventListener('click', async () => {
  const msg = $('#partnerMsg'); const btn = $('#addPartnerBtn');
  const name = $('#pt_name').value.trim();
  if (!name) { flash(msg, 'Informe o nome do parceiro.'); return; }
  btn.disabled = true;
  try {
    let logo_path = null;
    const f = $('#pt_logo').files[0];
    if (f) logo_path = await uploadPublic(f, 'partners');
    const { error } = await db.from('vittalit_partners').insert({
      name, url: $('#pt_url').value.trim() || null, detail: $('#pt_detail').value.trim() || null, logo_path,
    });
    if (error) throw new Error(error.message);
    ['pt_name', 'pt_url', 'pt_detail'].forEach((id) => $('#' + id).value = '');
    $('#pt_logo').value = '';
    flash(msg, 'Parceiro adicionado! Já está visível no site.', true);
    loadPartners();
  } catch (e) { flash(msg, e.message); }
  btn.disabled = false;
});

/* ---------- ouvidoria ---------- */
let ombFilter = 'todas';
let ombRows = [];
const OMB_STATUS = { nova: ['Nova', 'blue'], em_analise: ['Em análise', 'gray'], resolvida: ['Resolvida', 'green'] };

document.querySelectorAll('[data-omb]').forEach((t) => t.addEventListener('click', () => {
  ombFilter = t.dataset.omb;
  document.querySelectorAll('[data-omb]').forEach((x) => x.classList.toggle('active', x === t));
  renderOmbudsman();
}));

async function loadOmbudsman() {
  const { data } = await db.from('vittalit_ombudsman').select('*').order('created_at', { ascending: false });
  ombRows = data || [];
  const novas = ombRows.filter((r) => r.status === 'nova').length;
  const badge = $('#ombCount');
  badge.style.display = novas ? '' : 'none';
  badge.textContent = novas;
  renderOmbudsman();
}

function renderOmbudsman() {
  const box = $('#ombList');
  const rows = ombRows.filter((r) => ombFilter === 'todas' || r.kind === ombFilter);
  if (!rows.length) { box.innerHTML = '<p class="empty">Nenhuma mensagem por aqui. 🎉</p>'; return; }
  box.innerHTML = rows.map((r) => {
    const [label, color] = OMB_STATUS[r.status] || OMB_STATUS.nova;
    return `
    <div class="item" style="align-items:flex-start">
      <span class="ic">${r.kind === 'denuncia' ? '🛡️' : '💬'}</span>
      <div class="tx" style="white-space:normal">
        <b style="white-space:normal">${r.kind === 'denuncia' ? 'Denúncia' : 'Ouvidoria'} · ${new Date(r.created_at).toLocaleString('pt-BR')}</b>
        <small>${r.name ? 'De: ' + esc(r.name) : 'Anônimo'}${r.contact ? ' · retorno: ' + esc(r.contact) : ''}</small>
        <p style="font-size:.9rem;margin-top:8px;white-space:pre-wrap">${esc(r.message)}</p>
      </div>
      <div class="actions" style="flex-direction:column;align-items:flex-end">
        <span class="badge ${color}">${label}</span>
        <select data-ombst="${r.id}" style="font-size:.8rem;padding:6px 8px;border-radius:8px;border:1.5px solid var(--line)">
          ${Object.entries(OMB_STATUS).map(([k, [l]]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <button class="btn btn-danger btn-sm" data-ombdel="${r.id}">Excluir</button>
      </div>
    </div>`;
  }).join('');

  box.querySelectorAll('[data-ombst]').forEach((s) => s.addEventListener('change', async () => {
    await db.from('vittalit_ombudsman').update({ status: s.value }).eq('id', s.dataset.ombst);
    loadOmbudsman();
  }));
  box.querySelectorAll('[data-ombdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Excluir esta mensagem definitivamente?')) return;
    await db.from('vittalit_ombudsman').delete().eq('id', b.dataset.ombdel);
    loadOmbudsman();
  }));
}

/* ---------- configurações do site ---------- */
const SETTING_KEYS = ['whatsapp', 'phone', 'email', 'instagram', 'facebook', 'address'];

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
