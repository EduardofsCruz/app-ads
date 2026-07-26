/* ZooGuia Brasília — protótipo PWA de navegação até os animais
 * Lista + mapa (Leaflet) + "Radar AR" com câmera, GPS e bússola. */

const estado = {
  animais: [],
  zoo: null,
  posicao: null,        // {lat, lng, accuracy}
  heading: null,        // graus a partir do Norte (0-360)
  alvo: null,           // animal selecionado
  mapa: null,
  marcadorUsuario: null,
  linhaRota: null,
  streamCamera: null,
  rafAR: null,
};

const RAIO_CHEGADA_M = 30; // distância para considerar "você chegou"

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
  const itens = estado.animais
    .filter((a) => !f || a.nome.toLowerCase().includes(f) || a.area.toLowerCase().includes(f))
    .map((a) => {
      const d = estado.posicao ? distanciaMetros(estado.posicao, a) : null;
      return { ...a, dist: d };
    })
    .sort((x, y) => (x.dist ?? Infinity) - (y.dist ?? Infinity));

  ul.innerHTML = itens.map((a) => `
    <li class="animal-card">
      <span class="animal-emoji">${a.emoji}</span>
      <div class="animal-info">
        <div class="animal-nome">${a.nome}</div>
        <div class="animal-area">${a.area}</div>
        ${a.dist != null ? `<div class="animal-dist">📍 a ${formataDist(a.dist)} de você</div>` : ""}
      </div>
      <div class="animal-acoes">
        <button class="btn-mini btn-mapa" data-id="${a.id}" data-acao="mapa">🗺️ Mapa</button>
        <button class="btn-mini btn-ar" data-id="${a.id}" data-acao="ar">📸 AR</button>
      </div>
    </li>`).join("");
}

document.getElementById("lista-animais").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-id]");
  if (!btn) return;
  const animal = estado.animais.find((a) => a.id === btn.dataset.id);
  if (!animal) return;
  definirAlvo(animal);
  if (btn.dataset.acao === "mapa") {
    mostrarView("mapa");
    focarNoMapa(animal);
  } else {
    mostrarView("ar");
    iniciarAR();
  }
});

document.getElementById("busca").addEventListener("input", (ev) => renderLista(ev.target.value));

function definirAlvo(animal) {
  estado.alvo = animal;
  document.getElementById("ar-alvo").textContent = `${animal.emoji} ${animal.nome}`;
  atualizarRota();
}

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
}

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
  loopAR();
}

function pararAR() {
  if (estado.rafAR) cancelAnimationFrame(estado.rafAR);
  estado.rafAR = null;
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
        chegou.querySelector(".ar-emoji").textContent = estado.alvo.emoji;
        chegou.classList.remove("oculto");
        distEl.textContent = `Você chegou ao recinto! (${formataDist(d)})`;
      } else {
        chegou.classList.add("oculto");
        distEl.textContent = `📍 ${formataDist(d)} — siga a seta`;
        desenharSeta(ctx, w, h, rumo, d);
      }
    }
    estado.rafAR = requestAnimationFrame(frame);
  }
  frame();
}

function desenharSeta(ctx, w, h, rumoAlvo, dist) {
  // ângulo relativo entre onde o celular aponta e onde o animal está
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

  let rel = (rumoAlvo - heading + 540) % 360 - 180; // -180..180
  const alinhado = Math.abs(rel) < 20;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rel * Math.PI / 180);
  ctx.fillStyle = alinhado ? "rgba(76,175,80,0.95)" : "rgba(255,202,40,0.95)";
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  const s = Math.min(w, h) * 0.16;
  ctx.beginPath();               // seta apontando "para cima" antes da rotação
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.6, s * 0.5);
  ctx.lineTo(0, s * 0.15);
  ctx.lineTo(-s * 0.6, s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 17px system-ui";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillText(
    alinhado ? "✅ É por aqui! Siga em frente" : (rel > 0 ? "↻ Gire para a direita" : "↺ Gire para a esquerda"),
    cx, cy + Math.min(w, h) * 0.16 + 40
  );
  ctx.shadowBlur = 0;
}

document.getElementById("btn-iniciar-ar").addEventListener("click", iniciarAR);
document.getElementById("btn-parar-ar").addEventListener("click", pararAR);

// ---------- boot ----------
async function boot() {
  const resp = await fetch("data/animais.json");
  const dados = await resp.json();
  estado.zoo = dados.zoo;
  estado.animais = dados.animais;
  renderLista();
  try { iniciarMapa(); } catch (e) { console.warn("Mapa indisponível:", e); }
  iniciarGPS();
  iniciarBussola();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

boot().catch((e) => toast("Erro ao carregar dados: " + e.message));
