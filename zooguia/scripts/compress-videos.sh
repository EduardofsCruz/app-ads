#!/bin/bash
# Script para comprimir vídeos automaticamente para o ZooGuia
# Uso: ./compress-videos.sh video.mp4 elefante

if [ $# -lt 2 ]; then
    echo "Uso: ./compress-videos.sh <video_original> <id_animal>"
    echo "Exemplo: ./compress-videos.sh video.mp4 elefante"
    exit 1
fi

INPUT="$1"
ANIMAL_ID="$2"
OUTPUT_DIR="../img/animais"

if [ ! -f "$INPUT" ]; then
    echo "❌ Arquivo não encontrado: $INPUT"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "🎬 Comprimindo vídeo: $INPUT"
echo "🆔 ID: $ANIMAL_ID"

# 1. MP4 otimizado (fallback principal)
echo "➡️  Comprimindo para MP4..."
ffmpeg -i "$INPUT" \
  -vf "scale=1280:720" \
  -c:v libx264 \
  -preset medium \
  -b:v 1500k \
  -c:a aac \
  -b:a 128k \
  -y \
  "$OUTPUT_DIR/${ANIMAL_ID}-guia.mp4" \
  2>&1 | grep -E "frame=|error" || echo "✅ MP4 pronto"

# 2. WebM VP9 (mais comprimido)
echo "➡️  Comprimindo para WebM..."
ffmpeg -i "$INPUT" \
  -vf "scale=1280:720" \
  -c:v libvpx-vp9 \
  -b:v 800k \
  -c:a libopus \
  -b:a 96k \
  -deadline good \
  -cpu-used 4 \
  -y \
  "$OUTPUT_DIR/${ANIMAL_ID}-guia.webm" \
  2>&1 | grep -E "frame=|error" || echo "✅ WebM pronto"

# 3. Extrair frames para fallback
echo "➡️  Extraindo frames..."
ffmpeg -i "$INPUT" \
  -vf "scale=800:-1,fps=0.5" \
  -q:v 8 \
  -y \
  "/tmp/${ANIMAL_ID}-%d.jpg" \
  2>&1 | grep -E "frame=|error" || true

# 4. Converter frames para WebP
echo "➡️  Convertendo frames para WebP..."
for frame in /tmp/${ANIMAL_ID}-*.jpg; do
    [ -f "$frame" ] || continue
    framename=$(basename "$frame" .jpg)
    framenum=$(echo "$framename" | sed "s/${ANIMAL_ID}-//")
    cwebp -q 80 "$frame" -o "$OUTPUT_DIR/${ANIMAL_ID}-${framenum}.webp" 2>/dev/null
done
rm -f /tmp/${ANIMAL_ID}-*.jpg

# Resumo
echo ""
echo "📊 Resumo:"
echo "========================================="
ls -lh "$OUTPUT_DIR" | grep "$ANIMAL_ID" | awk '{print $9, "(" $5 ")"}'
echo ""
echo "✅ Pronto para usar!"
echo ""
echo "📤 Próximo passo: Upload para CDN"
echo "   ou copiar para ./img/animais/"
