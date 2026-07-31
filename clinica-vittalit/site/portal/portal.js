/* Portal do Paciente — Clínica Vittalit */

const { SUPABASE_URL, SUPABASE_ANON_KEY, PATIENT_EMAIL_DOMAIN } = window.VITTALIT;
const db = window.sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (s) => document.querySelector(s);
const authScreen = $('#authScreen');
const appScreen = $('#appScreen');

const CAT_LABEL = {
  ultrassom: 'Ultrassonografia', cardiologico: 'Cardiológico', ginecologico: 'Ginecológico',
  laboratorial: 'Laboratorial', imagem: 'Imagem', espirometria: 'Espirometria',
  endoscopia: 'Endoscopia', alergico: 'Teste alérgico', polissonografia: 'Polissonografia',
  outros: 'Exame',
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

/* ---------- recuperação de senha ---------- */
const FN_URL = SUPABASE_URL + '/functions/v1/vittalit-admin';
const fpMsg = (text, ok = false) => {
  const m = $('#forgotMsg');
  m.textContent = text;
  m.className = 'msg show ' + (ok ? 'ok' : 'err');
};
const callPublicFn = async (payload) => {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};

$('#forgotLink').addEventListener('click', (ev) => {
  ev.preventDefault();
  $('#loginForm').classList.add('hidden');
  $('#authMsg').classList.remove('show');
  $('#forgotBox').classList.remove('hidden');
  $('#forgotStep1').classList.remove('hidden');
  $('#forgotStep2').classList.add('hidden');
  $('#forgotMsg').className = 'msg';
  $('#fpCpf').value = $('#login').value;
});
$('#forgotBack').addEventListener('click', (ev) => {
  ev.preventDefault();
  $('#forgotBox').classList.add('hidden');
  $('#loginForm').classList.remove('hidden');
});

$('#fpSendBtn').addEventListener('click', async () => {
  const cpf = $('#fpCpf').value.replace(/\D/g, '');
  if (cpf.length !== 11) { fpMsg('Digite o CPF completo (11 números).'); return; }
  const btn = $('#fpSendBtn');
  btn.disabled = true; btn.textContent = 'Enviando…';
  const out = await callPublicFn({ action: 'forgot_request', cpf });
  btn.disabled = false; btn.textContent = 'Enviar código';
  if (out.error) { fpMsg(out.error); return; }
  if (out.no_email) {
    fpMsg('Este cadastro não possui e-mail. Ligue para a clínica e a recepção gera uma senha nova para você na hora.');
    return;
  }
  $('#fpSentTo').innerHTML = `Enviamos um código de 6 dígitos para <b>${esc(out.masked_email)}</b>. Ele vale por 15 minutos.`;
  $('#forgotStep1').classList.add('hidden');
  $('#forgotStep2').classList.remove('hidden');
  fpMsg('Código enviado! Confira também a caixa de spam.', true);
});

$('#fpSaveBtn').addEventListener('click', async () => {
  const cpf = $('#fpCpf').value.replace(/\D/g, '');
  const code = $('#fpCode').value.trim();
  const p1 = $('#fpPass').value, p2 = $('#fpPass2').value;
  if (!/^\d{6}$/.test(code)) { fpMsg('Digite o código de 6 números recebido por e-mail.'); return; }
  if (p1.length < 6) { fpMsg('A nova senha deve ter ao menos 6 caracteres.'); return; }
  if (p1 !== p2) { fpMsg('As senhas não conferem.'); return; }
  const btn = $('#fpSaveBtn');
  btn.disabled = true; btn.textContent = 'Salvando…';
  const out = await callPublicFn({ action: 'forgot_confirm', cpf, code, password: p1 });
  btn.disabled = false; btn.textContent = 'Salvar nova senha';
  if (out.error) { fpMsg(out.error); return; }
  $('#forgotBox').classList.add('hidden');
  $('#loginForm').classList.remove('hidden');
  $('#login').value = cpf;
  $('#password').value = '';
  const m = $('#authMsg');
  m.textContent = 'Senha alterada com sucesso! Entre com o CPF e a nova senha.';
  m.className = 'msg show ok';
});

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
}

async function loadExams() {
  const box = $('#examList');
  const [{ data: exams, error }, { data: files }] = await Promise.all([
    db.from('vittalit_exams').select('*').eq('patient_id', me.id)
      .eq('released', true).order('exam_date', { ascending: false }),
    db.from('vittalit_exam_files').select('*').eq('patient_id', me.id).order('created_at'),
  ]);

  if (error || !exams?.length) {
    box.innerHTML = `<div class="card"><p class="empty">${ICONS.exam}<br>Você ainda não tem resultados disponíveis.<br><small>Assim que a clínica liberar um exame, ele aparece aqui.</small></p></div>`;
    return;
  }

  const byExam = {};
  (files || []).forEach((f) => { (byExam[f.exam_id] ||= []).push(f); });

  box.innerHTML = `<div class="card">` + exams.map((e) => {
    const list = byExam[e.id] || [];
    const meta = [
      `Realizado em ${fmtDate(e.exam_date)}`,
      e.delivered_at ? `disponível desde ${fmtDate(e.delivered_at)}` : null,
      e.requesting_doctor ? `solicitado por ${esc(e.requesting_doctor)}` : null,
    ].filter(Boolean).join(' · ');
    const btns = list.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:9px">${list.map((f) => `
          <button class="btn btn-soft btn-sm" data-dl="${esc(f.file_path)}">
            ⬇ ${esc(f.file_name.length > 30 ? f.file_name.slice(0, 28) + '…' : f.file_name)}
          </button>`).join('')}</div>`
      : `<p class="hint" style="margin-top:6px">Resultado em digitação — em breve disponível aqui.</p>`;
    return `
      <div class="item" style="align-items:flex-start">
        <span class="ic">${iconFor(e.category)}</span>
        <div class="tx" style="white-space:normal">
          <b style="white-space:normal">${esc(e.title)}</b>
          <small>${CAT_LABEL[e.category] || 'Exame'} · ${meta}</small>
          ${e.notes ? `<small style="display:block;margin-top:3px">${esc(e.notes)}</small>` : ''}
          ${btns}
        </div>
        ${list.length ? `<span class="badge green">${list.length} arquivo${list.length > 1 ? 's' : ''}</span>` : '<span class="badge gray">aguardando</span>'}
      </div>`;
  }).join('') + `</div>`;

  box.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', async () => {
    const label = b.textContent;
    b.disabled = true; b.textContent = 'Abrindo…';
    const { data, error: err } = await db.storage.from('vittalit').createSignedUrl(b.dataset.dl, 3600);
    b.disabled = false; b.textContent = label;
    if (err || !data?.signedUrl) { alert('Não foi possível gerar o link agora. Tente novamente.'); return; }
    window.open(data.signedUrl, '_blank');
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
