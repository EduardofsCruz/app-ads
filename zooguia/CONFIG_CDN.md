# ☁️ Configuração de CDN para ZooGuia

Guia prático para integrar seu CDN preferido.

## 🚀 Opção 1: Cloudinary (Recomendado - Grátis)

### Setup Inicial

1. **Criar conta**: https://cloudinary.com/users/register/free
   - Plano Free: 25GB de storage, 25GB bandwidth/mês
   - Sem cartão de crédito

2. **Obter credenciais**:
   - Dashboard → Settings → API Keys
   - Copiar `Cloud Name`

3. **Configurar no projeto**:

```javascript
// Editar: config/assets.js
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://res.cloudinary.com/SEU_CLOUD_NAME/image/upload",
    fallback: "./img/animais",
  },
};
```

### Upload de Vídeos

**Opção A: Web Dashboard**
1. Dashboard → Media Library
2. Upload → Upload files
3. Selecionar vídeos
4. Organizar em pastas: `zooguia/videos`

**Opção B: CLI (automático)**
```bash
# Instalar
npm install -g cloudinary-cli

# Configurar credenciais
cloudinary auth set

# Upload em massa
cloudinary upload scripts/compress-videos.sh zooguia/videos/**/*.webm
```

**Opção C: API (script Python)**
```python
# install: pip install cloudinary
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name="SEU_CLOUD_NAME",
    api_key="SEU_API_KEY",
    api_secret="SEU_API_SECRET"
)

for video in glob.glob("img/animais/*.webm"):
    cloudinary.uploader.upload(
        video,
        resource_type="video",
        folder="zooguia/videos"
    )
```

### URLs Resultantes

Padrão: `https://res.cloudinary.com/CLOUD_NAME/image/upload/TRANSFORMAÇÕES/zooguia/ARQUIVO`

Exemplos:
```
# Vídeo WebM
https://res.cloudinary.com/seu-cloud/image/upload/q_80/zooguia/videos/elefante.webm

# Com transformação (resize automático)
https://res.cloudinary.com/seu-cloud/image/upload/w_1280,h_720,q_80/zooguia/videos/elefante.webm
```

---

## 🌐 Opção 2: Bunny CDN (Mais Barato - $0.01/GB)

### Setup Inicial

1. **Criar conta**: https://bunny.net/signup
   - Promo: Primeiros $10 grátis
   - Sem contrato, cancela qualquer hora

2. **Criar Pull Zone**:
   - Aplicativos → Pull Zones → Criar
   - Origin: seu servidor ou Bunny Cloud
   - Ativar: Optimization, Caching

3. **Obter URL**:
   - Pull Zone → CNAME → Copiar

4. **Configurar no projeto**:

```javascript
// config/assets.js
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://seu-pullzone.b-cdn.net",
    fallback: "./img/animais",
  },
};
```

### Upload de Vídeos

**Opção A: FTP**
```bash
# Usar FileZilla ou outro cliente FTP
Host: ftp.b-cdn.net
User: seu-user
Pass: sua-senha
Diretório: /zooguia/videos/
```

**Opção B: API (cURL)**
```bash
API_KEY="seu-api-key"
PULLZONE_ID="seu-pullzone-id"

curl -X POST \
  https://api.bunny.net/pullzone/$PULLZONE_ID/files \
  -H "AccessKey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @arquivo.json
```

### URLs Resultantes

```
# Padrão
https://seu-pullzone.b-cdn.net/zooguia/videos/elefante.webm

# Com cache headers (automático)
# Cache: 7 dias
```

---

## 💾 Opção 3: AWS S3 + CloudFront (Profissional)

### Setup Inicial

1. **AWS Account**: https://aws.amazon.com/free
   - Free Tier: 5GB S3 + 50GB CloudFront/mês

2. **Criar S3 Bucket**:
   ```bash
   aws s3 mb s3://seu-bucket-zooguia --region us-east-1
   aws s3api put-bucket-cors --bucket seu-bucket-zooguia \
     --cors-configuration file://cors.json
   ```

3. **Criar CloudFront Distribution**:
   - Origin: seu S3 bucket
   - Ativar: Compress, Caching, HTTP/2

4. **Configurar no projeto**:

```javascript
// config/assets.js
const ASSETS_CONFIG = {
  cdn: {
    primary: "https://d123xyz.cloudfront.net",
    fallback: "./img/animais",
  },
};
```

### Upload de Vídeos

```bash
# Upload em massa
aws s3 sync img/animais s3://seu-bucket-zooguia/videos \
  --region us-east-1 \
  --exclude "*" \
  --include "*.webm" \
  --include "*.mp4"

# Com cache headers
aws s3 sync img/animais s3://seu-bucket-zooguia/videos \
  --cache-control max-age=31536000,public \
  --region us-east-1
```

### URLs Resultantes

```
# CloudFront (rápido, global)
https://d123xyz.cloudfront.net/videos/elefante.webm

# S3 direto (sem cache)
https://seu-bucket-zooguia.s3.amazonaws.com/videos/elefante.webm
```

---

## 📊 Comparação

| Feature | Cloudinary | Bunny | AWS S3 |
|---------|-----------|-------|--------|
| **Setup** | ⭐⭐⭐ Fácil | ⭐⭐⭐ Fácil | ⭐ Complexo |
| **Custo** | Grátis (25GB) | $0.01/GB | Variável |
| **Performance** | 🚀 Excelente | 🚀 Excelente | 🚀 Excelente |
| **Painel Web** | ✅ Sim | ✅ Sim | ❌ Não (AWS) |
| **Transformações** | ✅ Sim | ⚠️ Limitado | ❌ Não |
| **CORS** | ✅ Automático | ⚠️ Manual | ✅ Automático |

**Recomendação**: Comece com **Cloudinary** (grátis, simples, poderoso).

---

## 🔗 Integração com Código

### Exemplo Prático: Elefante

**Estrutura de pastas no CDN**:
```
zooguia/
├── videos/
│   ├── elefante.webm       (800 KB)
│   ├── elefante.mp4        (1.5 MB)
│   ├── zebra.webm          (900 KB)
│   └── ...
├── audio/
│   ├── elefante.mp3        (400 KB)
│   ├── zebra.mp3           (350 KB)
│   └── ...
└── images/
    ├── elefante.webp       (45 KB)
    └── ...
```

**No navegador, ao selecionar elefante**:
```javascript
carregarGuia({ id: "elefante", ... })

// Tenta carregar:
1. https://cdn.seu-dominio.com/zooguia/videos/elefante.webm (CDN)
   ↓ se falhar
2. ./img/animais/elefante-guia.mp4 (Local fallback)
   ↓ se falhar
3. Usa frames estáticos + som sintetizado
```

---

## ⚡ Otimizações Recomendadas

### 1. Transformações no CDN

**Cloudinary** (automático com URL):
```javascript
// Resize + compress + convert
https://res.cloudinary.com/seu-cloud/image/upload/w_1280,h_720,q_80,f_webp/zooguia/videos/elefante.webm
```

**Bunny** (via painel):
- Otimização de vídeo: ✅ Ativar
- Cache: 7 dias
- Compressão: ✅ Ativar

### 2. Pré-carregamento

```javascript
// Em data/animais.json, opcional:
{
  "id": "elefante",
  "nome": "Elefante",
  "media": {
    "video": "elefante.webm",    // CDN carrega automático
    "audio": "elefante.mp3",
    "priority": "high"           // Pré-carrega na boot
  }
}
```

### 3. Monitoramento

**Google Analytics 4**:
```javascript
// Rastrear carregamento de assets
gtag('event', 'video_play', {
  'video_title': 'elefante-guia',
  'video_duration': '15s',
  'video_cdn': 'cloudinary'
});
```

---

## ✅ Checklist: Deploy com CDN

- [ ] Conta CDN criada
- [ ] API Keys configuradas
- [ ] `config/assets.js` atualizado
- [ ] Primeiros 5 vídeos uploaded
- [ ] URLs testadas no navegador
- [ ] Cache headers configurados
- [ ] Fallback local funcionando
- [ ] Service Worker atualizado (v12)
- [ ] Test offline
- [ ] Monitorar tráfego/custos

---

## 🆘 Troubleshooting

**"404 no vídeo"**
- ✅ Verificar CDN está online
- ✅ Verificar URL no browser (copy-paste)
- ✅ Verificar CORS headers
- ✅ Verificar fallback local funciona

**"Vídeo carrega lento"**
- ✅ Verificar bitrate (deve ser ~800kbps)
- ✅ Ativar compressão no CDN
- ✅ Ativar cache headers (7 dias)

**"Caro demais"**
- ✅ Reduzir bitrate (1000kbps → 800kbps)
- ✅ Usar WebM em vez de MP4
- ✅ Migrar para Bunny CDN ($0.01/GB)

---

**Última atualização**: Jul 2026 | v2.0
