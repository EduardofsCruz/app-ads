/* Portal do Paciente — Clínica Vittalit */

const { SUPABASE_URL, SUPABASE_ANON_KEY, PATIENT_EMAIL_DOMAIN } = window.VITTALIT;
const db = window.sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (s) => document.querySelector(s);
const authScreen = $('#authScreen');
const appScreen = $('#appScreen');

const CAT_LABEL = {
  ultrassom: 'Ultrassom', cardiologico: 'Cardiológico', ginecologico: 'Ginecológico',
  laboratorial: 'Laboratorial', outros: 'Exame',
};
const ICONS = {
  exam: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 10h8M8 14h5"/></svg>',
  scan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14v7M8 21h8"/></svg>',
  heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 7.5 5c1.8 0 3.4 1 4.5 2.5C13.1 6 14.7 5 16.5 5A4.5 4.5 0 0 1 21 9.5c0 4-4 7.5-9 11.5z"/></svg>',
};
const iconFor = (cat) => cat === 'ultrassom' ? ICONS.scan : cat === 'cardiologico' ? ICONS.heart : ICONS.exam;

const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- login ---------- */
$('#loginForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = $('#loginBtn');
  const msg = $('#authMsg');
  msg.classList.remove('show');
  btn.disabled = true; btn.textContent = 'Entrando…';

  const raw = $('#login').value.trim();
  const email = raw.includes('@') ? raw.toLowerCase() : raw.replace(/\D/g, '') + '@' + PATIENT_EMAIL_DOMAIN;
  const { error } = await db.auth.signInWithPassword({ email, password: $('#password').value });

  btn.disabled = false; btn.textContent = 'Entrar';
  if (error) {
    msg.textContent = 'CPF/e-mail ou senha incorretos. Confira os dados ou fale com a clínica.';
    msg.classList.add('show');
    return;
  }
  boot();
});

$('#logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });

/* ---------- tabs ---------- */
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === t.dataset.tab));
}));

/* ---------- app ---------- */
let me = null;

async function boot() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return;

  const { data: profile } = await db.from('vittalit_users').select('*').eq('id', user.id).maybeSingle();
  if (!profile) {
    await db.auth.signOut();
    const msg = $('#authMsg');
    msg.textContent = 'Este acesso não pertence ao portal de pacientes.';
    msg.classList.add('show');
    return;
  }
  if (profile.role === 'admin') {
    // sessão de administrador: o portal é exclusivo dos pacientes
    const msg = $('#authMsg');
    msg.innerHTML = 'Você está conectado como <b>administrador</b>. O portal é exclusivo para pacientes.<br><br>'
      + '<a href="../admin/" class="btn btn-primary" style="display:inline-flex;width:auto;padding:10px 18px;font-size:.9rem">Ir para o painel administrativo</a> '
      + '<button type="button" id="adminOut" class="btn btn-soft" style="display:inline-flex;width:auto;padding:10px 18px;font-size:.9rem">Sair e entrar como paciente</button>';
    msg.classList.add('show');
    document.getElementById('adminOut').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });
    return;
  }
  me = profile;

  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  const first = profile.full_name.split(' ')[0];
  $('#whoName').textContent = profile.full_name;
  $('#hello').textContent = `Olá, ${first}! 👋`;

  loadExams();
  loadPregnancy();
}

async function loadExams() {
  const box = $('#examList');
  const { data: exams, error } = await db.from('vittalit_exams')
    .select('*').eq('patient_id', me.id).order('exam_date', { ascending: false });

  if (error || !exams?.length) {
    box.innerHTML = `<div class="card"><p class="empty">${ICONS.exam}<br>Você ainda não tem resultados disponíveis.<br><small>Assim que a clínica liberar um exame, ele aparece aqui.</small></p></div>`;
    return;
  }
  box.innerHTML = `<div class="card">` + exams.map((e) => `
    <div class="item">
      <span class="ic">${iconFor(e.category)}</span>
      <div class="tx">
        <b>${esc(e.title)}</b>
        <small>${CAT_LABEL[e.category] || 'Exame'} · ${fmtDate(e.exam_date)}${e.gestation_week ? ` · ${e.gestation_week} semanas` : ''}${e.notes ? ` · ${esc(e.notes)}` : ''}</small>
      </div>
      ${e.file_path
        ? `<div class="actions"><button class="btn btn-soft btn-sm" data-dl="${esc(e.file_path)}">Baixar PDF</button></div>`
        : '<span class="badge gray">sem arquivo</span>'}
    </div>`).join('') + `</div>`;

  box.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true; b.textContent = 'Gerando…';
    const { data, error: err } = await db.storage.from('vittalit').createSignedUrl(b.dataset.dl, 3600);
    b.disabled = false; b.textContent = 'Baixar PDF';
    if (err || !data?.signedUrl) { alert('Não foi possível gerar o link agora. Tente novamente.'); return; }
    window.open(data.signedUrl, '_blank');
  }));
}

async function loadPregnancy() {
  const { data: pregs } = await db.from('vittalit_pregnancies')
    .select('*').eq('patient_id', me.id).eq('active', true).limit(1);
  const preg = pregs?.[0];
  if (!preg) return; // aba fica oculta

  $('#pregTab').classList.remove('hidden');
  const box = $('#pregView');

  // idade gestacional: a partir da DUM, ou DPP - 280 dias
  const start = preg.lmp_date
    ? new Date(preg.lmp_date + 'T12:00:00')
    : preg.due_date ? new Date(new Date(preg.due_date + 'T12:00:00').getTime() - 280 * 864e5) : null;

  let heroHtml = '';
  if (start) {
    const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 864e5));
    const weeks = Math.min(Math.floor(days / 7), 42);
    const rest = days % 7;
    const pct = Math.min(100, Math.round((days / 280) * 100));
    const due = preg.due_date ? new Date(preg.due_date + 'T12:00:00') : new Date(start.getTime() + 280 * 864e5);
    heroHtml = `
      <div class="preg-hero">
        <p>Sua gestação</p>
        <b>${weeks} semanas${rest ? ` e ${rest} dia${rest > 1 ? 's' : ''}` : ''} 🤰</b>
        <div class="preg-bar"><i style="width:${pct}%"></i></div>
        <div class="preg-meta"><span>Início</span><span>${pct}% — parto previsto: ${due.toLocaleDateString('pt-BR')}</span></div>
      </div>`;
  }

  const { data: examsRaw } = await db.from('vittalit_exams')
    .select('*').eq('patient_id', me.id).not('gestation_week', 'is', null)
    .order('gestation_week', { ascending: true });
  const exams = (examsRaw || []).filter((e) => e.gestation_week);

  const tl = exams?.length ? `
    <div class="card">
      <h3>Linha do tempo dos seus ultrassons</h3>
      <div class="tl">${exams.map((e) => `
        <div class="tl-item">
          <div class="item" style="margin:0">
            <span class="ic">${iconFor(e.category)}</span>
            <div class="tx"><b>${e.gestation_week} semanas — ${esc(e.title)}</b><small>${fmtDate(e.exam_date)}${e.notes ? ` · ${esc(e.notes)}` : ''}</small></div>
            ${e.file_path ? `<button class="btn btn-soft btn-sm" data-dl="${esc(e.file_path)}">Ver</button>` : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>` :
    `<div class="card"><p class="empty">Os ultrassons da sua gestação aparecerão aqui, semana a semana. 💙</p></div>`;

  box.innerHTML = heroHtml + tl + (preg.notes ? `<div class="card"><h3>Orientações da equipe</h3><p style="font-size:.94rem">${esc(preg.notes)}</p></div>` : '');

  box.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', async () => {
    const { data } = await db.storage.from('vittalit').createSignedUrl(b.dataset.dl, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }));
}

/* telefone dinâmico no link de "esqueci a senha" */
(async () => {
  try {
    const { data } = await db.from('vittalit_settings').select('key,value').eq('key', 'phone');
    const phone = data?.[0]?.value;
    if (phone) {
      const link = document.querySelector('[data-phone-link]');
      if (link) link.href = 'tel:+55' + phone.replace(/\D/g, '');
    }
  } catch { /* mantém o padrão */ }
})();

/* sessão persistida */
boot();
