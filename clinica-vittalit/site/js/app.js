/* Clínica Vittalit — interações e animações */

/* ---------- dados ---------- */
const ESPECIALIDADES = [
  { n: 'Alergista e Imunologia', d: 'Diagnóstico e tratamento de alergias e imunidade.', i: 'shield' },
  { n: 'Cardiologia', d: 'Cuidado completo com a saúde do seu coração.', i: 'heart' },
  { n: 'Clínica Geral', d: 'Seu primeiro passo para um cuidado integral.', i: 'steth' },
  { n: 'Dermatologia', d: 'Saúde e beleza da sua pele em boas mãos.', i: 'sun' },
  { n: 'Ecocardiografia', d: 'Imagem avançada para avaliar o coração.', i: 'pulse' },
  { n: 'Endocrinologia', d: 'Hormônios, tireoide, diabetes e metabolismo.', i: 'drop' },
  { n: 'Estética Avançada', d: 'Laser, toxina botulínica, preenchimento e mais.', i: 'spark' },
  { n: 'Fisioterapia', d: 'Reabilitação funcional e pilates clínico.', i: 'move' },
  { n: 'Gastroenterologia', d: 'Saúde do aparelho digestivo.', i: 'steth' },
  { n: 'Geriatria', d: 'Cuidado especializado para a melhor idade.', i: 'user' },
  { n: 'Ginecologia / Obstetrícia e Estética Íntima', d: 'Saúde da mulher em todas as fases.', i: 'flower' },
  { n: 'Medicina do Trabalho', d: 'Saúde ocupacional para empresas e trabalhadores.', i: 'brief' },
  { n: 'Neuropsicologia', d: 'Avaliação e reabilitação cognitiva.', i: 'brain' },
  { n: 'Nutrição', d: 'Especialista em materno-infantil: gestação, fertilidade, introdução alimentar e menopausa.', i: 'leaf' },
  { n: 'Ortopedia', d: 'Ossos, músculos e articulações sem dor.', i: 'bone' },
  { n: 'Otorrinolaringologia', d: 'Ouvido, nariz e garganta.', i: 'ear' },
  { n: 'Pneumologia', d: 'Saúde respiratória e do pulmão.', i: 'lungs' },
  { n: 'Psicologia', d: 'Cuidado com a sua saúde emocional.', i: 'chat' },
  { n: 'Psicanálise', d: 'Escuta e acompanhamento terapêutico.', i: 'chat' },
  { n: 'Psiquiatria', d: 'Tratamento especializado em saúde mental.', i: 'brain' },
  { n: 'Quiropraxia', d: 'Saúde da coluna e alívio de dores.', i: 'spine' },
  { n: 'Reumatologia', d: 'Articulações, autoimunidade e dores crônicas.', i: 'bone' },
  { n: 'Transplante Capilar', d: 'Especialista em recuperação capilar com naturalidade.', i: 'spark' },
  { n: 'Ultrassonografia', d: 'Todos os ultrassons com agenda aberta.', i: 'scan' },
];

const ICONS = {
  heart: '<path d="M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 7.5 5c1.8 0 3.4 1 4.5 2.5C13.1 6 14.7 5 16.5 5A4.5 4.5 0 0 1 21 9.5c0 4-4 7.5-9 11.5z"/>',
  steth: '<path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2.2"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  drop: '<path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z"/>',
  spark: '<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
  move: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v5m0 0-3.5 8m3.5-8 3.5 8M7 10.5c3 1.6 7 1.6 10 0"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 0-3-3M12 9a3 3 0 1 1 3-3M15 12a3 3 0 1 1 3 3M9 12a3 3 0 1 0-3 3M12 15v6"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  brain: '<path d="M9.5 3A3.5 3.5 0 0 0 6 6.5c-1.7.3-3 1.8-3 3.5 0 1 .4 1.9 1 2.5-.6.6-1 1.5-1 2.5A3.5 3.5 0 0 0 6.5 18.5 3.5 3.5 0 0 0 12 20V6.5A3.5 3.5 0 0 0 9.5 3z"/><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c1.7.3 3 1.8 3 3.5 0 1-.4 1.9-1 2.5.6.6 1 1.5 1 2.5a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 12 20V6.5A3.5 3.5 0 0 1 14.5 3z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  bone: '<path d="M17 10c.7-.7 1.7-1 2.5-.7a2.5 2.5 0 1 0-3.3-3.3c.3.8 0 1.8-.7 2.5l-8 8c-.7.7-1.7 1-2.5.7a2.5 2.5 0 1 0 3.3 3.3c-.3-.8 0-1.8.7-2.5z"/>',
  ear: '<path d="M6 8.5a6 6 0 0 1 12 0c0 4-4 4.5-4 8a3 3 0 0 1-6 0"/><path d="M10 8.5a2 2 0 0 1 4 0c0 1.7-2 2-2 4"/>',
  lungs: '<path d="M12 4v6m0 0c0 2-1 3-2.5 3.5L7 14.6C5 15.3 4 17 4 19v1h5.5c1 0 1.5-.7 1.5-1.5zm0 0c0 2 1 3 2.5 3.5l2.5 1.1c2 .7 3 2.4 3 4.4v1h-5.5c-1 0-1.5-.7-1.5-1.5z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H4l2.5-2.5A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14h3"/>',
  spine: '<path d="M12 2v20M8 5h8M7 9h10M7 13h10M8 17h8"/>',
  scan: '<path d="M4 14a8 8 0 1 1 16 0"/><path d="M12 14v7M8 21h8"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
};

const EXAMES = {
  cardio: [
    'Holter', 'MAPA', 'Ecocardiograma', 'Eletrocardiograma',
    'Doppler de carótidas e vertebrais', 'Doppler de artérias renais',
    'Duplex scan venoso e arterial — membros inferiores e superiores',
  ],
  gineco: [
    'Coleta de citologia', 'Retirada de DIU', 'Biópsia de colo', 'Colposcopia',
    'Cauterização química', 'Inserção de Implanon', 'DIU Mirena e DIU de cobre',
    'Sessão de LED', 'Estética íntima — clareamento íntimo', 'Tratamento de Fraxx',
  ],
  ultra: [
    'Ultrassom de mamas e axilas', 'Transvaginal com e sem Doppler', 'Pélvico transabdominal',
    'Obstétrico com Doppler e perfil biofísico fetal', 'Morfológico 1º e 2º trimestre',
    'Obstétrico simples 2º trimestre', 'Obstétrico transvaginal 1º trimestre',
    'Abdome superior', 'Abdome total', 'Fígado e vias biliares',
    'Rins e vias urinárias', 'Próstata-pelve',
  ],
  outros: [
    'Espirometria', 'Testes para alergias', 'Videonasofibroscopia', 'Videolaringoscopia',
    'Tratamento de lesões cutâneas', 'Reparo tecidual no pós-operatório',
  ],
};

/* ---------- nav ---------- */
const nav = document.getElementById('nav');
const burger = document.getElementById('burger');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 24), { passive: true });
burger.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

/* ---------- especialidades ---------- */
const grid = document.getElementById('specGrid');
const count = document.getElementById('specCount');
const empty = document.getElementById('specEmpty');

grid.innerHTML = ESPECIALIDADES.map((e, idx) => `
  <article class="spec-card rv" style="--d:${(idx % 8) * 0.05}s" data-name="${e.n.toLowerCase()}">
    <span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[e.i] || ICONS.steth}</svg></span>
    <h3>${e.n}</h3>
    <p>${e.d}</p>
  </article>`).join('');

const cards = [...grid.querySelectorAll('.spec-card')];
const updateCount = (n) => count.textContent = `${n} especialidade${n === 1 ? '' : 's'}`;
updateCount(cards.length);

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
document.getElementById('specSearch').addEventListener('input', (ev) => {
  const q = norm(ev.target.value.trim().toLowerCase());
  let shown = 0;
  cards.forEach(c => {
    const hit = norm(c.dataset.name).includes(q);
    c.classList.toggle('hide', !hit);
    if (hit) shown++;
  });
  empty.classList.toggle('show', shown === 0);
  updateCount(shown);
});

/* ---------- exames: tabs ---------- */
const check = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
Object.entries(EXAMES).forEach(([key, list]) => {
  document.querySelector(`[data-panel="${key}"]`).innerHTML =
    list.map(x => `<div class="exam">${check}${x}</div>`).join('');
});
document.getElementById('examTabs').addEventListener('click', (ev) => {
  const btn = ev.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.dataset.panel === btn.dataset.tab));
});

/* ---------- marquee duplicado para loop infinito ---------- */
const track = document.getElementById('marqueeTrack');
track.innerHTML += track.innerHTML;

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

/* ---------- contadores ---------- */
const cio = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    cio.unobserve(en.target);
    const el = en.target, target = +el.dataset.count, t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

/* ---------- ano ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- contato dinâmico (editável no painel admin) ---------- */
(async () => {
  const cfg = window.VITTALIT;
  if (!cfg) return;
  try {
    const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/vittalit_settings?select=key,value`, {
      headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return;
    const settings = Object.fromEntries((await res.json()).map((r) => [r.key, r.value]));

    if (settings.whatsapp) {
      document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
        a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + settings.whatsapp);
      });
    }
    if (settings.phone) {
      const digits = settings.phone.replace(/\D/g, '');
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => { a.href = 'tel:+55' + digits; });
      document.querySelectorAll('[data-set="phone"]').forEach((el) => { el.textContent = settings.phone; });
    }
    if (settings.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => { a.href = 'mailto:' + settings.email; });
      document.querySelectorAll('[data-set="email"]').forEach((el) => { el.textContent = settings.email; });
    }
  } catch { /* sem rede: mantém os dados padrão do HTML */ }
})();
