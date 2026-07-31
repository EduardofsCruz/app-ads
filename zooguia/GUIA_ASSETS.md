# 📹 Guia de Gestão de Assets (Vídeos, Imagens, Áudio)

Este documento descreve como adicionar e gerenciar assets (vídeos, imagens, áudio) para o ZooGuia de forma escalável.

## 🎯 Arquitetura

```
┌─────────────────────────────────────┐
│     Navegador (Usuario)             │
└────────────┬────────────────────────┘
             │
             ├─→ CDN Primário (Cloudinary/Bunny/AWS)
             │   └─→ Múltiplos formatos (WebM, MP4, etc)
             │
             └─→ Fallback Local (/img/animais, /sons)
                 └─→ Assets de baixa qualidade/offline
```

## 📦 Tipos de Assets

### Vídeos
- **Localização primária**: CDN (recomendado)
- **Fallback local**: `/zooguia/img/animais/`
- **Formatos suportados**: WebM (recomendado), MP4
- **Nomes**: `{id}-guia.webm`, `{id}-video.mp4`
- **Tamanho**: ~800KB-2MB (comprimido)

### Áudio
- **Localização**: `/zooguia/sons/`
- **Formato**: MP3
- **Nome**: `{id}.mp3`
- **Fallback**: Som sintetizado se arquivo não existir

### Imagens/Frames
- **Localização**: `/zooguia/img/animais/`
- **Formatos**: WebP (preferido), PNG, JPG
- **Nomes**: `{id}.webp`, `{id}-2.webp` (para animações)
- **Tamanho**: ~20-60KB por frame

## 🚀 Adicionar Novo Animal com Vídeo

### Passo 1: Preparar Assets

```bash
# 1. Comprimir vídeo para ~1.5MB
ffmpeg -i video_original.mp4 \
  -vf "scale=1280:720" \
  -c:v libx264 \
  -preset medium \
  -b:v 1500k \
  -c:a aac \
  -b:a 128k \
  -y \
  novo-animal-guia.mp4

# 2. Converter para WebM (mais comprimido = ~800KB)
ffmpeg -i video_original.mp4 \
  -vf "scale=1280:720" \
  -c:v libvpx-vp9 \
  -b:v 800k \
  -c:a libopus \
  novo-animal-guia.webm

# 3. Extrair frames para fallback
ffmpeg -i video_original.mp4 \
  -vf "scale=500:-1" \
  -q:v 8 \
  novo-animal-%d.jpg

# 4. Converter frames para WebP (mais leve)
cwebp -q 80 novo-animal-1.jpg -o novo-animal.webp
```

### Passo 2: Upload para CDN

**Opção A: Cloudinary (Recomendado - Free 25GB)**
```bash
# Instalar CLI
npm install -g cloudinary-cli

# Upload
cloudinary upload novo-animal-guia.webm \
  --folder zooguia/videos
```

**Opção B: Bunny CDN (~$0.01/GB)**
```bash
# Via FTP/API
# Detalhes em: https://bunny.net/
```

**Opção C: AWS S3 + CloudFront**
```bash
# Upload para S3
aws s3 cp novo-animal-guia.webm \
  s3://seu-bucket/zooguia/videos/

# CloudFront automaticamente cache
```

### Passo 3: Configurar URLs

Editar `config/assets.js`:

```javascript
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://seu-cdn.com/zooguia",  // ← SEUS VÍDEOS
    fallback: "./img/animais",
  },
  // ... resto da config
};
```

### Passo 4: Adicionar ao data/animais.json

```json
{
  "id": "novo-animal",
  "nome": "Nome do Animal",
  "emoji": "🦁",
  "area": "Savana",
  "lat": -15.8455,
  "lng": -47.9422,
  "curiosidade": "...",
  "trilha": "pata",
  "som": "novo-animal"
}
```

### Passo 5: Adicionar Áudio (Opcional)

```bash
# Colocar em: /zooguia/sons/novo-animal.mp3
# Suporta MP3, OGG, WAV

# Se não existir, usa som sintetizado automaticamente
```

## 📊 Estimar Tamanho Total

| Quantidade | Vídeos | Imagens | Áudio | **Total** |
|-----------|--------|---------|-------|-----------|
| 10 animais | 8 MB | 3 MB | 1 MB | **12 MB** ✅ |
| 30 animais | 24 MB | 9 MB | 3 MB | **36 MB** ✅ |
| 50 animais | 40 MB | 15 MB | 5 MB | **60 MB** ✅ |

**No CDN**: Praticamente ilimitado (e mais rápido!)

## ⚙️ Otimizações Implementadas

### 1. Lazy Loading
- Vídeos carregam só quando animal é selecionado
- Pré-carregamento inteligente em background

### 2. Fallback Automático
```
Tentativa 1: CDN Primário (Cloudinary)
    ↓ falha
Tentativa 2: Vídeo local (WebM)
    ↓ falha
Tentativa 3: Vídeo alternativo (MP4)
    ↓ falha
Frames estáticos (WebP) + Emoji
```

### 3. Cache Inteligente
- Service Worker v12: Cache-first para mídia
- TTL: 7 dias (ajustável em assets.js)
- Limpa caches antigos automaticamente

### 4. Adaptativo por Conexão
- Detecção de dados limitados (celular)
- Skip pré-carregamento se `saveData=true`
- Redimensionamento de vídeo em conexões fracas

## 🔧 Configuração do CDN

### Cloudinary

```javascript
// No lugar de config/assets.js
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://res.cloudinary.com/seu-user/image/upload/zooguia",
    fallback: "./img/animais",
  },
};

// URL resultante:
// https://res.cloudinary.com/seu-user/image/upload/zooguia/videos/elefante.webm
```

### Bunny CDN

```javascript
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://seu-pullzone.b-cdn.net/zooguia",
    fallback: "./img/animais",
  },
};

// URL resultante:
// https://seu-pullzone.b-cdn.net/zooguia/videos/elefante.webm
```

## 📈 Monitoramento

Adicionar ao início de `app.js`:

```javascript
// Monitorar carregamento de assets
window.addEventListener('error', (e) => {
  if (e.filename?.includes('/videos/') || e.filename?.includes('/audio/')) {
    console.warn('Asset failed:', e.filename);
    // Pode enviar para analytics
  }
});
```

## ✅ Checklist: Adicionar Novo Animal

- [ ] Vídeo comprimido: ~1.5MB MP4 ou ~800KB WebM
- [ ] Frames WebP para fallback: ~20KB cada
- [ ] Áudio MP3: ~300-500KB (opcional)
- [ ] Upload para CDN primário
- [ ] Adicionar entrada em `data/animais.json`
- [ ] Testar no navegador (Ctrl+F5 para limpar cache)
- [ ] Testar offline (desabilitar internet no DevTools)
- [ ] Testar em conexão lenta (throttle no DevTools)

## 📚 Recursos

- [Cloudinary Free Tier](https://cloudinary.com/pricing)
- [Bunny CDN Preços](https://bunny.net/pricing)
- [FFmpeg Documentação](https://ffmpeg.org/documentation.html)
- [WebP Converter](https://developers.google.com/speed/webp/docs/cwebp)

---

**Última atualização**: Jul 2026 | Versão: 2.0
