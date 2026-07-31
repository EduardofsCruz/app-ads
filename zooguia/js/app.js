/* ZooGuia Brasília — protótipo PWA de navegação até os animais
 * Lista + favoritos + roteiro otimizado + mapa (Leaflet) + "Radar AR". */

const estado = {
  animais: [],
  servicos: [],
  zoo: null,
  ajustes: {},          // {id: {lat, lng}} — posições calibradas em campo
  modoCalibrar: false,
  filtroApoio: false,
  posicao: null,        // {lat, lng, accuracy}
  heading: null,        // graus a partir do Norte (0-360)
  alvo: null,           // animal selecionado
  favoritos: new Set(), // ids
  filtroFavoritos: false,
  selecaoRota: new Set(),   // ids marcados no planejamento
  rota: { ordem: [], visitados: new Set() },
  mapa: null,
  marcadorUsuario: null,
  linhaRota: null,
  camadaRoteiro: null,
  streamCamera: null,
  rafAR: null,
};

const RAIO_CHEGADA_M = 30; // distância para considerar "você chegou"

// ---------- persistência local ----------
function salvarLocal() {
  try {
    localStorage.setItem("zooguia.favoritos", JSON.stringify([...estado.favoritos]));
    localStorage.setItem("zooguia.rota", JSON.stringify({
      ordem: estado.rota.ordem.map((a) => a.id),
      visitados: [...estado.rota.visitados],
    }));
  } catch { /* modo anônimo etc. */ }
}

function carregarLocal() {
  try {
    const fav = JSON.parse(localStorage.getItem("zooguia.favoritos") || "[]");
    estado.favoritos = new Set(fav.filter((id) => porId(id)));
    const rota = JSON.parse(localStorage.getItem("zooguia.rota") || "null");
    if (rota && Array.isArray(rota.ordem)) {
      estado.rota.ordem = rota.ordem.map(porId).filter(Boolean);
      estado.rota.visitados = new Set((rota.visitados || []).filter((id) => porId(id)));
      estado.selecaoRota = new Set(estado.rota.ordem.map((a) => a.id));
    }
  } catch { /* dados corrompidos: ignora */ }
}

function porId(id) {
  return estado.animais.find((a) => a.id === id) || estado.servicos.find((s) => s.id === id);
}

// ---------- calibração dos recintos ----------
function carregarAjustes() {
  try {
    estado.ajustes = JSON.parse(localStorage.getItem("zooguia.ajustes") || "{}");
  } catch { estado.ajustes = {}; }
  aplicarAjustes();
}

function aplicarAjustes() {
  [...estado.animais, ...estado.servicos].forEach((p) => {
    const aj = estado.ajustes[p.id];
    if (aj && typeof aj.lat === "number" && typeof aj.lng === "number") {
      p.lat = aj.lat;
      p.lng = aj.lng;
    }
  });
}

function extrairCoordenada(texto) {
  // aceita "-15.84726, -47.93815" (copiar do Google Maps) ou URLs com @lat,lng
  const m = String(texto || "").match(/(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function salvarAjuste(ponto, coord, origem) {
  estado.ajustes[ponto.id] = coord;
  try { localStorage.setItem("zooguia.ajustes", JSON.stringify(estado.ajustes)); } catch {}
  aplicarAjustes();
  renderLista(document.getElementById("busca").value);
  toast(`📌 Posição de "${ponto.nome}" gravada ${origem}!`);
}

function colarCoordenada(ponto) {
  const texto = window.prompt(
    `Cole a coordenada de "${ponto.nome}" copiada do Google Maps\n(toque e segure no recinto no Google Maps e copie o número que aparece, ex.: -15.84726, -47.93815):`
  );
  if (texto == null) return;
  const coord = extrairCoordenada(texto);
  if (!coord) { toast("Não reconheci a coordenada 😕 — cole algo como -15.84726, -47.93815"); return; }
  salvarAjuste(ponto, coord, "a partir do Google Maps");
}

function calibrarAqui(ponto) {
  if (!estado.posicao) { toast("📡 Aguarde o GPS pegar sinal para calibrar."); return; }
  if (estado.posicao.accuracy > 25) {
    toast(`⚠️ Precisão do GPS ainda baixa (~${Math.round(estado.posicao.accuracy)} m). Gravei mesmo assim — repita se necessário.`);
  }
  salvarAjuste(ponto, { lat: estado.posicao.lat, lng: estado.posicao.lng }, "com o GPS");
}

// ---------- util geográfico ----------
function distanciaMetros(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function rumoGraus(a, b) {
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function formataDist(m) {
  return m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m";
}

// ---------- otimização da rota (caixeiro-viajante aproximado) ----------
function custoRota(inicio, ordem) {
  let total = 0, atual = inicio;
  for (const p of ordem) { total += distanciaMetros(atual, p); atual = p; }
  return total;
}

function melhorOrdem(inicio, pontos) {
  // 1) vizinho mais próximo
  const restantes = [...pontos];
  const ordem = [];
  let atual = inicio;
  while (restantes.length) {
    let idx = 0, menor = Infinity;
    restantes.forEach((p, i) => {
      const d = distanciaMetros(atual, p);
      if (d < menor) { menor = d; idx = i; }
    });
    atual = restantes.splice(idx, 1)[0];
    ordem.push(atual);
  }
  // 2) refinamento 2-opt: tenta desfazer cruzamentos invertendo trechos
  let melhorou = true;
  while (melhorou) {
    melhorou = false;
    for (let i = 0; i < ordem.length - 1; i++) {
      for (let j = i + 1; j < ordem.length; j++) {
        const nova = ordem.slice(0, i)
          .concat(ordem.slice(i, j + 1).reverse(), ordem.slice(j + 1));
        if (custoRota(inicio, nova) + 0.01 < custoRota(inicio, ordem)) {
          ordem.splice(0, ordem.length, ...nova);
          melhorou = true;
        }
      }
    }
  }
  return ordem;
}

// ---------- toast ----------
let toastTimer;
function toast(msg, ms = 3500) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("oculto");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("oculto"), ms);
}

// ---------- abas ----------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => mostrarView(tab.dataset.view));
});

function mostrarView(nome) {
  document.querySelectorAll(".tab").forEach((t) => {
    const ativo = t.dataset.view === nome;
    t.classList.toggle("active", ativo);
    t.setAttribute("aria-selected", ativo);
  });
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.id === "view-" + nome);
  });
  if (nome === "mapa" && estado.mapa) {
    setTimeout(() => estado.mapa.invalidateSize(), 60);
  }
}

// ---------- lista ----------
function renderLista(filtro = "") {
  const ul = document.getElementById("lista-animais");
  const f = filtro.trim().toLowerCase();
  const base = estado.filtroApoio ? estado.servicos : estado.animais;
  const itens = base
    .filter((a) => !f || a.nome.toLowerCase().includes(f) || a.area.toLowerCase().includes(f))
    .filter((a) => estado.filtroApoio || !estado.filtroFavoritos || estado.favoritos.has(a.id))
    .map((a) => ({ ...a, dist: estado.posicao ? distanciaMetros(estado.posicao, a) : null }))
    .sort((x, y) => (x.dist ?? Infinity) - (y.dist ?? Infinity));

  if (!itens.length) {
    ul.innerHTML = `<li class="lista-vazia">${estado.filtroFavoritos && !estado.filtroApoio
      ? "Você ainda não favoritou nenhum animal. Toque na ⭐ dos seus preferidos!"
      : "Nada encontrado."}</li>`;
    return;
  }

  const ehApoio = estado.filtroApoio;
  ul.innerHTML = itens.map((a) => `
    <li class="animal-card">
      ${ehApoio ? "" : `<button class="btn-fav ${estado.favoritos.has(a.id) ? "ativo" : ""}"
              data-id="${a.id}" data-acao="favorito"
              aria-label="Favoritar ${a.nome}">${estado.favoritos.has(a.id) ? "⭐" : "☆"}</button>`}
      <span class="animal-visu">
        <img class="animal-img" src="img/animais/${a.id}.webp" alt="" loading="lazy"
             onload="this.nextElementSibling.style.display='none'"
             onerror="if(!this.dataset.p){this.dataset.p=1;this.src='img/animais/${a.id}.png'}else{this.remove()}">
        <span class="animal-emoji">${a.emoji}</span>
      </span>
      <div class="animal-info">
        <div class="animal-nome">${a.nome} ${estado.ajustes[a.id] ? "📌" : ""}</div>
        <div class="animal-area">${a.area}</div>
        ${a.dist != null ? `<div class="animal-dist">📍 a ${formataDist(a.dist)} de você</div>` : ""}
      </div>
      <div class="animal-acoes">
        ${estado.modoCalibrar
          ? `<button class="btn-mini btn-calibrar" data-id="${a.id}" data-acao="calibrar">📌 Aqui</button>
             <button class="btn-mini btn-colar" data-id="${a.id}" data-acao="colar">🌐 Colar</button>`
          : ehApoio
            ? `<button class="btn-mini btn-mapa" data-id="${a.id}" data-acao="mapa">🗺️ Mapa</button>
               <button class="btn-mini btn-ar" data-id="${a.id}" data-acao="ar">📸 AR</button>`
            : `<button class="btn-mini btn-mapa" data-id="${a.id}" data-acao="info">ℹ️ Info</button>
               <button class="btn-mini btn-ar" data-id="${a.id}" data-acao="ar">📸 AR</button>`}
      </div>
    </li>`).join("");
}

document.getElementById("lista-animais").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-id]");
  if (!btn) return;
  const animal = porId(btn.dataset.id);
  if (!animal) return;
  if (btn.dataset.acao === "favorito") {
    if (estado.favoritos.has(animal.id)) estado.favoritos.delete(animal.id);
    else estado.favoritos.add(animal.id);
    salvarLocal();
    renderLista(document.getElementById("busca").value);
    return;
  }
  if (btn.dataset.acao === "calibrar") {
    calibrarAqui(animal);
    return;
  }
  if (btn.dataset.acao === "colar") {
    colarCoordenada(animal);
    return;
  }
  if (btn.dataset.acao === "info") {
    abrirFicha(animal);
    return;
  }
  definirAlvo(animal);
  if (btn.dataset.acao === "mapa") {
    mostrarView("mapa");
    focarNoMapa(animal);
  } else {
    mostrarView("ar");
    iniciarAR();
  }
});

// ---------- ficha do animal ----------
let fichaAnimal = null;
function abrirFicha(a) {
  fichaAnimal = a;
  document.getElementById("ficha-visu").innerHTML = `
    <img src="img/animais/${a.id}.webp" alt="${a.nome}"
         onload="this.nextElementSibling.style.display='none'"
         onerror="if(!this.dataset.p){this.dataset.p=1;this.src='img/animais/${a.id}.png'}else{this.remove()}">
    <span class="ficha-emoji">${a.emoji}</span>`;
  document.getElementById("ficha-nome").textContent = a.nome;
  document.getElementById("ficha-area").textContent = a.area;
  document.getElementById("ficha-dist").textContent =
    estado.posicao ? `📍 a ${formataDist(distanciaMetros(estado.posicao, a))} de você` : "";
  document.getElementById("ficha-curio").textContent = a.curiosidade ? `💡 ${a.curiosidade}` : "";
  document.getElementById("ficha-som").style.display = a.som ? "" : "none";
  document.getElementById("ficha").classList.remove("oculto");
  document.getElementById("ficha-fundo").classList.remove("oculto");
}
function fecharFicha() {
  document.getElementById("ficha").classList.add("oculto");
  document.getElementById("ficha-fundo").classList.add("oculto");
}
document.getElementById("ficha-fechar").addEventListener("click", fecharFicha);
document.getElementById("ficha-fundo").addEventListener("click", fecharFicha);
document.getElementById("ficha-som").addEventListener("click", () => fichaAnimal && tocarSom(fichaAnimal));
document.getElementById("ficha-mapa").addEventListener("click", () => {
  if (!fichaAnimal) return;
  definirAlvo(fichaAnimal);
  fecharFicha();
  mostrarView("mapa");
  focarNoMapa(fichaAnimal);
});
document.getElementById("ficha-ar").addEventListener("click", () => {
  if (!fichaAnimal) return;
  definirAlvo(fichaAnimal);
  fecharFicha();
  mostrarView("ar");
  iniciarAR();
});

// ---------- sons dos animais ----------
let audioCtx = null;
const somFalhou = new Set(); // ids sem arquivo em sons/
function ctxAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tocarSom(a) {
  if (!a || !a.som) return;
  if (!somFalhou.has(a.id)) {
    const audio = new Audio(`sons/${a.id}.mp3`); // gravação real, se existir
    audio.volume = 0.8;
    audio.play().catch(() => { somFalhou.add(a.id); sintetizarSom(a.som); });
    audio.onerror = () => { somFalhou.add(a.id); sintetizarSom(a.som); };
    return;
  }
  sintetizarSom(a.som);
}

function sintetizarSom(tipo) {
  let ac;
  try { ac = ctxAudio(); } catch { return; }
  const t0 = ac.currentTime;
  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);

  const osc = (forma, f0, dur, ini = 0, f1 = f0) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = forma;
    o.frequency.setValueAtTime(f0, t0 + ini);
    o.frequency.linearRampToValueAtTime(f1, t0 + ini + dur);
    g.gain.setValueAtTime(0, t0 + ini);
    g.gain.linearRampToValueAtTime(1, t0 + ini + 0.03);
    g.gain.linearRampToValueAtTime(0, t0 + ini + dur);
    o.connect(g).connect(master);
    o.start(t0 + ini);
    o.stop(t0 + ini + dur + 0.05);
  };
  const ruido = (dur, ini = 0, freq = 900) => {
    const n = ac.sampleRate * dur;
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filtro = ac.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.9, t0 + ini);
    g.gain.linearRampToValueAtTime(0, t0 + ini + dur);
    src.connect(filtro).connect(g).connect(master);
    src.start(t0 + ini);
  };

  switch (tipo) {
    case "felino":   osc("sawtooth", 85, 0.8, 0, 60); ruido(0.8, 0, 300); break;
    case "lobo":     osc("sine", 320, 1.3, 0, 620); osc("sine", 620, 0.6, 1.3, 380); break;
    case "elefante": osc("sawtooth", 240, 0.35, 0, 480); osc("sawtooth", 480, 0.45, 0.35, 520); break;
    case "ave":      [0, 0.16, 0.32, 0.52].forEach((i, k) => osc("sine", 2100 + k * 180, 0.11, i, 2500 + k * 120)); break;
    case "coruja":   osc("sine", 420, 0.35, 0, 380); osc("sine", 420, 0.5, 0.5, 340); break;
    case "macaco":   [0, 0.2, 0.4, 0.6].forEach((i, k) => osc("square", k % 2 ? 700 : 520, 0.13, i)); break;
    case "hiss":     ruido(0.9, 0, 2600); break;
    default:         osc("sawtooth", 130, 0.25, 0, 95); osc("sawtooth", 120, 0.3, 0.3, 90); break;
  }
}

document.getElementById("busca").addEventListener("input", (ev) => renderLista(ev.target.value));

document.getElementById("chip-todos").addEventListener("click", () => setFiltroLista("todos"));
document.getElementById("chip-favoritos").addEventListener("click", () => setFiltroLista("favoritos"));
document.getElementById("chip-apoio").addEventListener("click", () => setFiltroLista("apoio"));
function setFiltroLista(modo) {
  estado.filtroFavoritos = modo === "favoritos";
  estado.filtroApoio = modo === "apoio";
  document.getElementById("chip-todos").classList.toggle("active", modo === "todos");
  document.getElementById("chip-favoritos").classList.toggle("active", modo === "favoritos");
  document.getElementById("chip-apoio").classList.toggle("active", modo === "apoio");
  renderLista(document.getElementById("busca").value);
}

document.getElementById("chip-calibrar").addEventListener("click", () => {
  estado.modoCalibrar = !estado.modoCalibrar;
  document.getElementById("chip-calibrar").classList.toggle("active", estado.modoCalibrar);
  document.getElementById("calibrar-banner").classList.toggle("oculto", !estado.modoCalibrar);
  renderLista(document.getElementById("busca").value);
});

document.getElementById("btn-exportar-ajustes").addEventListener("click", async () => {
  const ids = Object.keys(estado.ajustes);
  if (!ids.length) { toast("Nenhum recinto calibrado ainda."); return; }
  const texto = JSON.stringify(estado.ajustes, null, 2);
  try {
    await navigator.clipboard.writeText(texto);
    toast(`📋 ${ids.length} posição(ões) copiada(s)! Cole no data/animais.json para valer para todos.`);
  } catch {
    toast("Não consegui copiar automaticamente — o navegador bloqueou o acesso.");
  }
});

// imagens do animal-guia no AR: quadros de caminhada (id.webp, id-2.webp…)
// para animar tromba/asas/passos, e id-fim.webp para a pose de chegada
const guia = { id: null, frames: [], fim: null, video: null, videoEl: null, inicio: 0, chegouTocado: false };
function carregarGuia(a) {
  if (guia.videoEl) { guia.videoEl.pause(); guia.videoEl.removeAttribute("src"); }
  guia.id = a.id;
  guia.frames = [];
  guia.fim = null;
  guia.video = null;
  guia.videoEl = null;
  guia.inicio = performance.now();
  guia.chegouTocado = false;

  // vídeo do animal "vivo" (id-guia.mp4, ou id-video.webm/mp4), com fundo removido ao vivo
  const vd = document.createElement("video");
  vd.muted = true;
  vd.loop = true;
  vd.playsInline = true;
  vd.setAttribute("playsinline", "");
  vd.onloadeddata = () => {
    if (guia.id !== a.id) return;
    guia.video = vd;
    vd.play().catch(() => {});
  };
  vd.onerror = () => {
    // Tenta em ordem: guia.mp4 → video.mp4 → video.webm
    const tentativa = (vd.dataset.tentativa || 0) * 1;
    if (tentativa === 0) {
      vd.dataset.tentativa = "1";
      vd.src = `img/animais/${a.id}-guia.mp4`; // novo vídeo prioritário
    } else if (tentativa === 1) {
      vd.dataset.tentativa = "2";
      vd.src = `img/animais/${a.id}-video.mp4`;
    }
  };
  guia.videoEl = vd;
  vd.src = `img/animais/${a.id}-video.webm`;

  const f1 = new Image();
  f1.onload = () => { if (guia.id === a.id) guia.frames[0] = f1; };
  f1.onerror = () => {
    const png = new Image();
    png.onload = () => { if (guia.id === a.id) guia.frames[0] = png; };
    png.src = `img/animais/${a.id}.png`;
  };
  f1.src = `img/animais/${a.id}.webp`;

  [2, 3].forEach((n) => {
    const im = new Image();
    im.onload = () => { if (guia.id === a.id) guia.frames[n - 1] = im; };
    im.src = `img/animais/${a.id}-${n}.webp`;
  });

  const fi = new Image();
  fi.onload = () => { if (guia.id === a.id) guia.fim = fi; };
  fi.src = `img/animais/${a.id}-fim.webp`;
}

function definirAlvo(animal) {
  estado.alvo = animal;
  document.getElementById("ar-alvo").textContent = `${animal.emoji} ${animal.nome}`;
  carregarGuia(animal);
  atualizarRota();
}

// ---------- roteiro (planejamento da visita) ----------
function renderSelecao() {
  const ul = document.getElementById("selecao-animais");
  ul.innerHTML = estado.animais.map((a) => `
    <li>
      <label class="selecao-item ${estado.selecaoRota.has(a.id) ? "marcado" : ""}">
        <input type="checkbox" data-id="${a.id}" ${estado.selecaoRota.has(a.id) ? "checked" : ""}>
        <span class="animal-emoji-sm">${a.emoji}</span>
        <span class="selecao-nome">${a.nome}</span>
        <span class="selecao-area">${a.area}</span>
        ${estado.favoritos.has(a.id) ? '<span class="selecao-fav">⭐</span>' : ""}
      </label>
    </li>`).join("");
}

document.getElementById("selecao-animais").addEventListener("change", (ev) => {
  const cb = ev.target.closest("input[data-id]");
  if (!cb) return;
  if (cb.checked) estado.selecaoRota.add(cb.dataset.id);
  else estado.selecaoRota.delete(cb.dataset.id);
  cb.closest(".selecao-item").classList.toggle("marcado", cb.checked);
});

document.getElementById("btn-usar-favoritos").addEventListener("click", () => {
  if (!estado.favoritos.size) { toast("Favorite alguns animais primeiro na aba 📋 ⭐"); return; }
  estado.favoritos.forEach((id) => estado.selecaoRota.add(id));
  renderSelecao();
});

document.getElementById("btn-limpar-selecao").addEventListener("click", () => {
  estado.selecaoRota.clear();
  renderSelecao();
});

document.getElementById("btn-montar-rota").addEventListener("click", () => {
  const escolhidos = [...estado.selecaoRota].map(porId).filter(Boolean);
  if (escolhidos.length < 2) { toast("Escolha pelo menos 2 animais para montar a rota 😉"); return; }
  const inicio = estado.posicao || estado.zoo.entrada;
  estado.rota.ordem = melhorOrdem(inicio, escolhidos);
  estado.rota.visitados = new Set();
  salvarLocal();
  renderRoteiro();
  desenharRoteiroNoMapa();
  const primeiro = estado.rota.ordem[0];
  definirAlvo(primeiro);
  toast(`Rota pronta! Primeira parada: ${primeiro.emoji} ${primeiro.nome}`);
});

document.getElementById("btn-refazer-rota").addEventListener("click", () => {
  estado.rota.ordem = [];
  estado.rota.visitados = new Set();
  salvarLocal();
  if (estado.camadaRoteiro) estado.camadaRoteiro.clearLayers();
  renderRoteiro();
  renderSelecao();
});

document.getElementById("btn-rota-mapa").addEventListener("click", () => {
  mostrarView("mapa");
  desenharRoteiroNoMapa(true);
});

function proximaParada() {
  return estado.rota.ordem.find((a) => !estado.rota.visitados.has(a.id)) || null;
}

function renderRoteiro() {
  const temRota = estado.rota.ordem.length > 0;
  document.getElementById("roteiro-selecao").classList.toggle("oculto", temRota);
  document.getElementById("roteiro-resultado").classList.toggle("oculto", !temRota);
  if (!temRota) return;

  const inicio = estado.posicao || estado.zoo.entrada;
  const total = custoRota(inicio, estado.rota.ordem);
  const feitas = estado.rota.visitados.size;
  const prox = proximaParada();
  document.getElementById("rota-resumo").innerHTML = prox
    ? `${estado.rota.ordem.length} paradas · ~${formataDist(total)} de caminhada · ${feitas} visitada${feitas === 1 ? "" : "s"}.<br>➡️ Próxima: <b>${prox.emoji} ${prox.nome}</b>`
    : `🎉 Roteiro concluído! Vocês visitaram ${feitas} animais.`;

  let anterior = inicio;
  document.getElementById("rota-paradas").innerHTML = estado.rota.ordem.map((a, i) => {
    const trecho = distanciaMetros(anterior, a);
    anterior = a;
    const visitado = estado.rota.visitados.has(a.id);
    const ehProx = prox && prox.id === a.id;
    return `
      <li class="rota-item ${visitado ? "visitado" : ""} ${ehProx ? "proxima" : ""}">
        <span class="rota-num">${i + 1}</span>
        <span class="animal-emoji-sm">${a.emoji}</span>
        <div class="rota-info">
          <div class="rota-nome">${a.nome} ${ehProx ? "⬅️ próxima" : ""}</div>
          <div class="rota-trecho">🚶 ${formataDist(trecho)} desde a parada anterior</div>
        </div>
        <div class="animal-acoes">
          <button class="btn-mini btn-ar" data-id="${a.id}" data-acao="ar">📸 AR</button>
          <button class="btn-mini ${visitado ? "btn-desfazer" : "btn-visitei"}"
                  data-id="${a.id}" data-acao="visitado">${visitado ? "↩️ Desfazer" : "✅ Visitei"}</button>
        </div>
      </li>`;
  }).join("");
}

document.getElementById("rota-paradas").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-id]");
  if (!btn) return;
  const animal = porId(btn.dataset.id);
  if (!animal) return;
  if (btn.dataset.acao === "visitado") {
    if (estado.rota.visitados.has(animal.id)) estado.rota.visitados.delete(animal.id);
    else estado.rota.visitados.add(animal.id);
    salvarLocal();
    renderRoteiro();
    const prox = proximaParada();
    if (prox) { definirAlvo(prox); toast(`➡️ Próxima parada: ${prox.emoji} ${prox.nome}`); }
    else if (estado.rota.visitados.size === estado.rota.ordem.length) {
      toast("🎉 Roteiro concluído! Parabéns, exploradores!");
    }
    return;
  }
  definirAlvo(animal);
  mostrarView("ar");
  iniciarAR();
});

// ---------- GPS ----------
function iniciarGPS() {
  const banner = document.getElementById("status-gps");
  if (!("geolocation" in navigator)) {
    banner.textContent = "❌ Este aparelho não tem GPS disponível no navegador.";
    banner.classList.add("erro");
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      estado.posicao = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      banner.textContent = `✅ GPS ativo (precisão ~${Math.round(pos.coords.accuracy)} m)`;
      banner.classList.add("ok");
      banner.classList.remove("erro");
      renderLista(document.getElementById("busca").value);
      atualizarUsuarioNoMapa();
      atualizarRota();
    },
    (err) => {
      banner.textContent = "⚠️ Sem GPS: " + (err.code === 1
        ? "permita o acesso à localização para ver as distâncias."
        : "sinal indisponível no momento.");
      banner.classList.add("erro");
    },
    { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
  );
}

// ---------- bússola ----------
function iniciarBussola() {
  const handler = (ev) => {
    if (typeof ev.webkitCompassHeading === "number") {
      estado.heading = ev.webkitCompassHeading; // iOS: já é rumo em relação ao Norte
    } else if (ev.absolute && typeof ev.alpha === "number") {
      estado.heading = (360 - ev.alpha) % 360;  // Android: alpha cresce anti-horário
    } else if (typeof ev.alpha === "number" && estado.heading == null) {
      estado.heading = (360 - ev.alpha) % 360;  // fallback não-absoluto
    }
  };
  if ("ondeviceorientationabsolute" in window) {
    window.addEventListener("deviceorientationabsolute", handler);
  }
  window.addEventListener("deviceorientation", handler);
}

async function pedirPermissaoBussola() {
  // iOS 13+ exige gesto do usuário + requestPermission
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const r = await DeviceOrientationEvent.requestPermission();
      if (r !== "granted") toast("Sem a bússola, a seta do radar não gira 😕");
    } catch { /* usuário negou */ }
  }
}

// ---------- mapa ----------
function iniciarMapa() {
  if (typeof L === "undefined") {
    // CDN do Leaflet não carregou (sem internet); o app segue com lista e AR
    document.getElementById("mapa").innerHTML =
      '<p style="padding:24px;text-align:center">🗺️ O mapa precisa de internet na primeira visita.<br>A lista e o Radar AR continuam funcionando!</p>';
    return;
  }
  const { centro } = estado.zoo;
  estado.mapa = L.map("mapa").setView([centro.lat, centro.lng], 16);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(estado.mapa);

  estado.animais.forEach((a) => {
    const icone = L.divIcon({
      className: "",
      html: `<div style="font-size:26px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5))">${a.emoji}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    L.marker([a.lat, a.lng], { icon: icone })
      .addTo(estado.mapa)
      .bindPopup(`<b>${a.emoji} ${a.nome}</b><br>${a.area}<br><i>${a.curiosidade}</i>`)
      .on("click", () => definirAlvo(a));
  });

  estado.servicos.forEach((s) => {
    const icone = L.divIcon({
      className: "",
      html: `<div class="marcador-servico">${s.emoji}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    L.marker([s.lat, s.lng], { icon: icone })
      .addTo(estado.mapa)
      .bindPopup(`<b>${s.emoji} ${s.nome}</b>`);
  });

  estado.camadaRoteiro = L.layerGroup().addTo(estado.mapa);
  if (estado.rota.ordem.length) desenharRoteiroNoMapa();
}

// alternância mapa GPS x mapa ilustrado oficial
function setMapaIlustrado(ilustrado) {
  document.getElementById("mapa").classList.toggle("oculto", ilustrado);
  document.getElementById("mapa-ilustrado").classList.toggle("oculto", !ilustrado);
  document.getElementById("mapa-destino").classList.toggle("some", ilustrado);
  document.getElementById("btn-mapa-gps").classList.toggle("active", !ilustrado);
  document.getElementById("btn-mapa-ilustrado").classList.toggle("active", ilustrado);
  if (!ilustrado && estado.mapa) setTimeout(() => estado.mapa.invalidateSize(), 60);
}
document.getElementById("btn-mapa-gps").addEventListener("click", () => setMapaIlustrado(false));
document.getElementById("btn-mapa-ilustrado").addEventListener("click", () => setMapaIlustrado(true));

let zoomIlustrado = 160; // largura da imagem em % do contêiner
function aplicarZoomIlustrado() {
  document.getElementById("img-ilustrado").style.width = zoomIlustrado + "%";
}
document.getElementById("btn-zoom-mais").addEventListener("click", () => {
  zoomIlustrado = Math.min(400, zoomIlustrado + 40); aplicarZoomIlustrado();
});
document.getElementById("btn-zoom-menos").addEventListener("click", () => {
  zoomIlustrado = Math.max(100, zoomIlustrado - 40); aplicarZoomIlustrado();
});

function atualizarUsuarioNoMapa() {
  if (!estado.mapa || !estado.posicao) return;
  const p = [estado.posicao.lat, estado.posicao.lng];
  if (!estado.marcadorUsuario) {
    estado.marcadorUsuario = L.circleMarker(p, {
      radius: 9, color: "#fff", weight: 2, fillColor: "#1976d2", fillOpacity: 1,
    }).addTo(estado.mapa).bindPopup("Você está aqui");
  } else {
    estado.marcadorUsuario.setLatLng(p);
  }
}

function focarNoMapa(animal) {
  if (!estado.mapa) return;
  estado.mapa.setView([animal.lat, animal.lng], 18);
  atualizarRota();
}

function desenharRoteiroNoMapa(enquadrar = false) {
  if (!estado.mapa || !estado.camadaRoteiro || !estado.rota.ordem.length) return;
  estado.camadaRoteiro.clearLayers();
  const inicio = estado.posicao || estado.zoo.entrada;
  const pontos = [[inicio.lat, inicio.lng], ...estado.rota.ordem.map((a) => [a.lat, a.lng])];
  L.polyline(pontos, { color: "#6a1b9a", weight: 5, opacity: 0.85 }).addTo(estado.camadaRoteiro);
  estado.rota.ordem.forEach((a, i) => {
    const visitado = estado.rota.visitados.has(a.id);
    L.marker([a.lat, a.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="marcador-num ${visitado ? "marcador-ok" : ""}">${visitado ? "✓" : i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(estado.camadaRoteiro);
  });
  if (enquadrar) estado.mapa.fitBounds(pontos, { padding: [40, 40] });
}

function atualizarRota() {
  const card = document.getElementById("mapa-destino");
  if (!estado.alvo) { card.classList.add("oculto"); return; }
  const a = estado.alvo;
  let texto = `<b>${a.emoji} ${a.nome}</b> — ${a.area}`;
  if (estado.posicao) {
    const d = distanciaMetros(estado.posicao, a);
    texto += `<br>📍 ${formataDist(d)} em linha reta`;
    if (estado.mapa) {
      const pontos = [[estado.posicao.lat, estado.posicao.lng], [a.lat, a.lng]];
      if (!estado.linhaRota) {
        estado.linhaRota = L.polyline(pontos, { color: "#e65100", weight: 4, dashArray: "8 8" }).addTo(estado.mapa);
      } else {
        estado.linhaRota.setLatLngs(pontos);
      }
    }
  }
  card.innerHTML = texto;
  card.classList.remove("oculto");
}

// ---------- Radar AR ----------
async function iniciarAR() {
  const stage = document.getElementById("ar-stage");
  if (!stage.classList.contains("oculto")) return; // já rodando

  if (!navigator.mediaDevices?.getUserMedia) {
    toast("Câmera não disponível neste navegador. Use o Mapa 🗺️");
    return;
  }
  await pedirPermissaoBussola();
  try {
    estado.streamCamera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
  } catch {
    toast("Não consegui acessar a câmera. Verifique as permissões.");
    return;
  }
  const video = document.getElementById("ar-video");
  video.srcObject = estado.streamCamera;
  document.getElementById("ar-intro").classList.add("oculto");
  stage.classList.remove("oculto");
  if (estado.alvo) {
    guia.inicio = performance.now(); // animação de "emergir" recomeça
    guia.videoEl?.play?.().catch(() => {});
    tocarSom(estado.alvo);           // o guia se anuncia
  }
  loopAR();
}

function pararAR() {
  if (estado.rafAR) cancelAnimationFrame(estado.rafAR);
  estado.rafAR = null;
  guia.videoEl?.pause?.();
  if (estado.streamCamera) {
    estado.streamCamera.getTracks().forEach((t) => t.stop());
    estado.streamCamera = null;
  }
  document.getElementById("ar-stage").classList.add("oculto");
  document.getElementById("ar-intro").classList.remove("oculto");
  document.getElementById("ar-encontrado").classList.add("oculto");
}

function loopAR() {
  const canvas = document.getElementById("ar-canvas");
  const ctx = canvas.getContext("2d");

  function frame() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    ctx.clearRect(0, 0, w, h);

    const distEl = document.getElementById("ar-distancia");
    const chegou = document.getElementById("ar-encontrado");

    if (!estado.alvo) {
      distEl.textContent = "Escolha um animal na aba 📋 Animais";
    } else if (!estado.posicao) {
      distEl.textContent = "📡 Aguardando sinal de GPS…";
    } else {
      const d = distanciaMetros(estado.posicao, estado.alvo);
      const rumo = rumoGraus(estado.posicao, estado.alvo);

      if (d <= RAIO_CHEGADA_M) {
        const fimImg = document.getElementById("ar-fim-img");
        if (guia.fim) {
          if (fimImg.src !== guia.fim.src) fimImg.src = guia.fim.src;
          fimImg.classList.remove("oculto");
          chegou.querySelector(".ar-emoji").style.display = "none";
        } else {
          fimImg.classList.add("oculto");
          chegou.querySelector(".ar-emoji").style.display = "";
        }
        chegou.querySelector(".ar-emoji").textContent = estado.alvo.emoji;
        chegou.classList.remove("oculto");
        distEl.textContent = `Você chegou ao recinto! (${formataDist(d)})`;
        if (!guia.chegouTocado) { guia.chegouTocado = true; tocarSom(estado.alvo); }
      } else {
        chegou.classList.add("oculto");
        guia.chegouTocado = false;
        distEl.textContent = `📍 ${formataDist(d)} — siga a trilha`;
        desenharGuia(ctx, w, h, rumo, d);
      }
    }
    estado.rafAR = requestAnimationFrame(frame);
  }
  frame();
}

// ponto numa curva de Bézier quadrática (0 <= u <= 1)
function pontoCurva(a, b, c, u) {
  const v = 1 - u;
  return v * v * a + 2 * v * u * b + u * u * c;
}

// tangente (direção) da curva no ponto u, em radianos
function anguloCurva(ax, bx, cx2, ay, by, cy2, u) {
  const dx = 2 * (1 - u) * (bx - ax) + 2 * u * (cx2 - bx);
  const dy = 2 * (1 - u) * (by - ay) + 2 * u * (cy2 - by);
  return Math.atan2(dy, dx);
}

// pegadas específicas de cada espécie, desenhadas no chão
function desenharPegada(ctx, tipo, s) {
  ctx.fillStyle = "rgba(101, 67, 33, 0.85)";
  if (tipo === "pata-grande") {
    // pata redonda de elefante/rinoceronte/hipopótamo, com unhas
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.ellipse(i * s * 0.28, -s * 0.55, s * 0.11, s * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (tipo === "casco") {
    // casco fendido de zebra/cervo
    ctx.beginPath(); ctx.ellipse(-s * 0.16, 0, s * 0.14, s * 0.34, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.16, 0, s * 0.14, s * 0.34, 0.15, 0, Math.PI * 2); ctx.fill();
  } else if (tipo === "ave-chao") {
    // três dedos de ema
    ctx.strokeStyle = "rgba(101, 67, 33, 0.85)";
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.lineCap = "round";
    for (const ang of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.lineTo(Math.sin(ang) * s * 0.55, s * 0.3 - Math.cos(ang) * s * 0.75);
      ctx.stroke();
    }
  } else {
    // pata clássica: almofada + 4 dedos
    ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.3, s * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = -0.85 + i * 0.57;
      ctx.beginPath();
      ctx.ellipse(Math.sin(a) * s * 0.4, s * 0.1 - Math.cos(a) * s * 0.48, s * 0.1, s * 0.13, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function desenharGuia(ctx, w, h, rumoAlvo, dist) {
  const heading = estado.heading;
  const cx = w / 2, cy = h / 2;

  if (heading == null) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(cx - 150, cy - 24, 300, 48);
    ctx.fillStyle = "#fff";
    ctx.font = "15px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("🧭 Bússola indisponível — use o Mapa", cx, cy + 5);
    return;
  }

  const rel = (rumoAlvo - heading + 540) % 360 - 180; // -180..180
  const alinhado = Math.abs(rel) < 20;
  const t = performance.now() / 1000;
  const alvo = estado.alvo;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ——— o elefante "pegando na mão" ———
  const emergindo = Math.min(1, (performance.now() - guia.inicio) / 900);
  const escEmerge = emergindo < 1
    ? 1.7 - 0.7 * emergindo + Math.sin(emergindo * Math.PI) * 0.25
    : 1;

  // Posição base: à frente do visitante
  const gx = cx;
  let gy = h * 0.35; // mais acima
  const tam = 320 * escEmerge;

  // ——— Lógica de orientação: "pegando na mão" ———
  // Se não está alinhado: elefante vira para frente mostrando a direção (rosto para visitante)
  // Se alinhado: elefante de costas, liderando para a frente

  let rotacao = 0; // rotação do animal em radianos
  let mensagem = "";
  let corFeedback = [255, 60, 60]; // vermelho por padrão

  if (alinhado) {
    // Alinhado: elefante tem costas para visitante, liderando
    rotacao = Math.PI; // virado para frente (costas para câmera)
    mensagem = `✅ Siga o ${alvo.emoji} em frente!`;
    corFeedback = [100, 200, 80]; // verde

    // Movimento suave para frente: ondula levemente de um lado para outro
    const ondulacao = Math.sin(t * 1.2) * 12;
    const subida = Math.sin(t * 1.5) * 6;

    ctx.save();
    ctx.translate(gx + ondulacao, gy - 40 + subida);
    ctx.scale(-1, 1); // espelho para estar de costas
    ctx.rotate(rotacao);
    desenharAnimalGuia(ctx, tam, false, t);
    ctx.restore();
  } else {
    // Desalinhado: elefante vira para mostrar a direção (rosto para visitante)
    // Muda orientação conforme para qual lado precisa virar
    rotacao = rel > 0 ? -Math.PI * 0.4 : Math.PI * 0.4; // inclinação para direita/esquerda

    const absRel = Math.abs(rel);
    if (absRel < 50) {
      mensagem = "Vire um pouco";
      corFeedback = [255, 200, 0]; // amarelo
    } else if (absRel < 90) {
      mensagem = rel > 0 ? "↻ Gire para a direita →" : "↺ Gire para a esquerda ←";
      corFeedback = [255, 130, 0]; // laranja
    } else {
      mensagem = rel > 0 ? "⟲ Gire bastante para a direita" : "⟳ Gire bastante para a esquerda";
      corFeedback = [255, 60, 60]; // vermelho
    }

    // Movimento pendular suave: balanço natural enquanto guia
    const balanço = Math.sin(t * 1.2) * 8;
    const bob = Math.abs(Math.sin(t * 1.5)) * 4;

    ctx.save();
    ctx.translate(gx + balanço, gy - 10 + bob);
    ctx.rotate(rotacao);
    desenharAnimalGuia(ctx, tam, false, t);
    ctx.restore();
  }

  // ——— Feedback visual: instrução colorida ———
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px system-ui";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillText(mensagem, cx, h * 0.15);

  // Barra de status colorida
  const barraAltura = 8;
  ctx.fillStyle = `rgba(${corFeedback[0]}, ${corFeedback[1]}, ${corFeedback[2]}, 0.3)`;
  ctx.fillRect(0, 0, w, barraAltura);
  ctx.fillStyle = `rgba(${corFeedback[0]}, ${corFeedback[1]}, ${corFeedback[2]}, 0.8)`;
  const largura = alinhado ? w : w * (Math.abs(rel) / 180);
  ctx.fillRect(0, 0, largura, barraAltura);

  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";
}

// remove o fundo branco de cada quadro do vídeo em tempo real
const chromaCv = document.createElement("canvas");
const chromaCtx = chromaCv.getContext("2d", { willReadFrequently: true });
function quadroVideoSemFundo(video) {
  const w = 320;
  const h = Math.max(1, Math.round(w * video.videoHeight / video.videoWidth));
  if (chromaCv.width !== w || chromaCv.height !== h) { chromaCv.width = w; chromaCv.height = h; }
  chromaCtx.drawImage(video, 0, 0, w, h);
  const dados = chromaCtx.getImageData(0, 0, w, h);
  const p = dados.data;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];
    const cr = g - r, cb = g - b;
    const brilho = (r + g + b) / 3;
    const minRGB = Math.min(r, g, b);
    const maxRGB = Math.max(r, g, b);

    // MUITO verde: g >> r e g >> b, ou brilho baixo mas verde relativo
    const verdeForte = g > 80 && cr > 30 && cb > 30;
    // Verde médio: detecta verde em qualquer brilho
    const verdeMedio = g >= Math.max(r, b) + 15;
    // Cinza/branco: todos os canais similares e altos
    const cinzaClaro = brilho > 180 && (maxRGB - minRGB) < 30;
    // Cores muito claras (>210 em média)
    const muitoClaro = brilho > 210;

    if (verdeForte || cinzaClaro || (verdeMedio && brilho > 100)) {
      p[i + 3] = 0; // totalmente transparente
    } else if ((verdeMedio || brilho > 160) && brilho < 250) {
      // Transição: quanto mais verde/claro, mais transparente
      const alfa = Math.max(0, 255 - (Math.max(cr, cb) * 6 + Math.max(0, brilho - 140) * 2));
      p[i + 3] = Math.min(255, alfa);
    } else if (muitoClaro) {
      // Branco muito claro também é fundo
      p[i + 3] = 0;
    }
  }
  chromaCtx.putImageData(dados, 0, 0);
  return chromaCv;
}

// desenha o animal-guia: vídeo "vivo" > quadros ilustrados (com
// transição suave entre eles) > emoji. Animais de chão são ancorados
// pelos pés (y = 0); voadores pelo centro.
function desenharAnimalGuia(ctx, tam, voador, t) {
  const desenhar = (fonte, fw, fh, alpha) => {
    const W = tam * 1.3;                    // largura fixa: o corpo não "pula"
    const H = W * (fh / fw);                // a altura varia (tromba erguida)
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * alpha;
    if (voador) ctx.drawImage(fonte, -W / 2, -H / 2, W, H);
    else ctx.drawImage(fonte, -W / 2, -H, W, H);
    ctx.globalAlpha = a0;
  };

  if (guia.video && guia.video.readyState >= 2 && guia.video.videoWidth) {
    const cv = quadroVideoSemFundo(guia.video);
    desenhar(cv, cv.width, cv.height, 1);
    return;
  }

  const quadros = guia.frames.filter(Boolean);
  if (quadros.length > 1) {
    const fase = t * 2.2;
    const i0 = Math.floor(fase) % quadros.length;
    const i1 = (i0 + 1) % quadros.length;
    const frac = fase - Math.floor(fase);
    const mistura = frac > 0.6 ? (frac - 0.6) / 0.4 : 0;  // fusão no fim do quadro
    desenhar(quadros[i0], quadros[i0].width, quadros[i0].height, 1 - mistura);
    if (mistura > 0) desenhar(quadros[i1], quadros[i1].width, quadros[i1].height, mistura);
  } else if (quadros.length === 1) {
    desenhar(quadros[0], quadros[0].width, quadros[0].height, 1);
  } else {
    ctx.font = `${Math.round(tam * 0.62)}px system-ui`;
    ctx.fillText(estado.alvo.emoji, 0, voador ? 0 : -tam * 0.28);
  }
}

document.getElementById("btn-iniciar-ar").addEventListener("click", iniciarAR);
document.getElementById("btn-parar-ar").addEventListener("click", pararAR);

// ---------- boot ----------
async function boot() {
  const resp = await fetch("data/animais.json");
  const dados = await resp.json();
  estado.zoo = dados.zoo;
  estado.animais = dados.animais;
  estado.servicos = dados.servicos || [];
  carregarAjustes();
  carregarLocal();
  renderLista();
  aplicarZoomIlustrado();
  renderSelecao();
  renderRoteiro();
  try { iniciarMapa(); } catch (e) { console.warn("Mapa indisponível:", e); }
  iniciarGPS();
  iniciarBussola();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot().catch((e) => toast("Erro ao carregar dados: " + e.message));
