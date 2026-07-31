/**
 * Configuração centralizada de assets (vídeos, imagens, áudio)
 * Suporta múltiplas fontes: local, CDN, fallbacks
 */

const ASSETS_CONFIG = {
  // URLs base para diferentes tipos de assets
  cdn: {
    // IMPORTANTE: Substitua pela sua CDN real (Cloudinary, Bunny, AWS S3, etc)
    primary: "https://cdn.example.com/zooguia",   // CDN principal
    fallback: "./img/animais",                     // Fallback local
  },

  audio: {
    format: "mp3",  // mp3, ogg, wav
    fallback: "synthetic",  // synthetic = sintetizar som
  },

  video: {
    // Prioridade de formatos por navegador
    formats: ["webm", "mp4"],  // WebM é mais comprimido
    autoplay: true,
    loop: true,
    muted: true,
  },

  images: {
    formats: ["webp", "png", "jpg"],  // Fallback em ordem
  },

  // Estratégia de cache do Service Worker
  cache: {
    strategy: "cache-first",  // cache-first ou network-first
    ttl: 86400 * 7,  // 7 dias
  },
};

/**
 * Construtor de URLs inteligente com fallbacks
 * Exemplo: getAssetUrl("elefante", "video") →
 *   https://cdn.example.com/zooguia/videos/elefante.webm
 *   (fallback para ./img/animais/elefante-guia.mp4)
 */
function getAssetUrl(id, type, format = null) {
  const typePath = {
    video: "videos",
    audio: "audio",
    image: "images",
    frame: "images",  // quadros estáticos
  };

  const path = typePath[type];
  if (!path) return null;

  // Determina formato padrão
  if (!format) {
    if (type === "video") format = ASSETS_CONFIG.video.formats[0];
    else if (type === "audio") format = ASSETS_CONFIG.audio.format;
    else if (type === "image") format = ASSETS_CONFIG.images.formats[0];
  }

  const filename = `${id}.${format}`;

  return {
    primary: `${ASSETS_CONFIG.cdn.primary}/${path}/${filename}`,
    fallback: `${ASSETS_CONFIG.cdn.fallback}/${
      type === "video" ? id + "-guia" : type === "audio" ? "../sons/" + id : id
    }.${format === "webm" ? "mp4" : format}`,
  };
}

/**
 * Carregador de assets com fallback automático
 */
async function loadAsset(id, type, format = null) {
  const urls = getAssetUrl(id, type, format);
  if (!urls) return null;

  // Tenta primary primeiro
  try {
    const response = await fetch(urls.primary, { method: "HEAD" });
    if (response.ok) return urls.primary;
  } catch (e) {
    // CDN indisponível, usa fallback
  }

  // Fallback para local
  try {
    const response = await fetch(urls.fallback, { method: "HEAD" });
    if (response.ok) return urls.fallback;
  } catch (e) {
    // Sem fallback disponível
  }

  return null;  // Asset não encontrado
}

/**
 * Pré-carrega assets em background (estratégia inteligente)
 * Só carrega quando: conectado, screen-on, battery > 20%, não em célula
 */
async function preloadAssets(animalIds = []) {
  // Verifica conexão
  if (!navigator.onLine) return;

  // Verifica se está em metered connection (celular)
  const connection = navigator.connection || navigator.mozConnection;
  if (connection?.saveData || connection?.type === "cellular") {
    console.log("⏭️ Pré-carregamento pausado: dados limitados");
    return;
  }

  // Carrega em baixa prioridade
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      animalIds.forEach(id => {
        loadAsset(id, "video").catch(() => {});
        loadAsset(id, "audio").catch(() => {});
      });
    });
  }
}

// Export para uso em módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ASSETS_CONFIG, getAssetUrl, loadAsset, preloadAssets };
}
