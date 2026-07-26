# 🦁 ZooGuia Brasília

Protótipo de **PWA (Progressive Web App)** para ajudar visitantes do Jardim Zoológico
de Brasília a encontrarem os animais — com **GPS**, **mapa** e um **"Radar AR"**
estilo Pokémon GO, que usa a câmera e a bússola do celular para apontar uma seta
até o recinto escolhido.

> Nasceu de uma dor real: o zoo é enorme, a sinalização é fraca e é fácil se
> perder com crianças a tiracolo. 🧒🦒

## O que o app faz

| Aba | Função |
|-----|--------|
| 📋 **Animais** | Lista com busca; mostra a distância de cada animal até você, ordenada do mais perto para o mais longe. Toque na ⭐ para favoritar (fica salvo no aparelho) e use os filtros "Favoritos" e "🚻 Apoio" (banheiros, bebedouros, restaurante, parquinho) |
| 🧭 **Roteiro** | Escolha com antecedência os animais que quer ver (ou importe os favoritos) e o app calcula a **melhor ordem de visita** — vizinho mais próximo + refinamento 2-opt, partindo da entrada ou da sua posição GPS. Marque cada parada como "✅ Visitei" e o app indica a próxima |
| 🗺️ **Mapa** | Mapa real (OpenStreetMap) com os recintos, pontos de apoio, sua posição, linha até o destino e a rota do roteiro com paradas numeradas — ou o **mapa ilustrado oficial** do zoo, com zoom |
| 📸 **Radar AR** | Câmera aberta com uma seta sobreposta que gira conforme você vira o celular; ao chegar a menos de 30 m, o animal "aparece" na tela comemorando 🎉 |

Favoritos, roteiro e paradas visitadas ficam salvos no celular (localStorage) —
a família pode montar o plano em casa e usar no dia seguinte no zoo.

Por ser PWA, dá para **instalar na tela inicial** (sem loja de aplicativos) e o
app **funciona offline** depois da primeira visita — essencial, porque o sinal de
internet dentro do zoo costuma ser ruim.

## Como funciona a "realidade aumentada"

Não usamos nenhum framework pesado de AR — só APIs nativas do navegador:

1. **Geolocation API** (`watchPosition`) dá a posição do visitante em tempo real.
2. Calculamos **distância** (fórmula de Haversine) e **rumo** (bearing) até o recinto.
3. **DeviceOrientation API** dá a direção da bússola (para onde o celular aponta).
4. **getUserMedia** abre a câmera traseira como plano de fundo.
5. Uma seta desenhada em `<canvas>` gira pela diferença entre o rumo do alvo e a
   bússola — quando os dois se alinham, a seta fica verde: "é por aqui!".

## Como testar

As APIs de câmera e GPS **exigem HTTPS** (ou `localhost`). Opções:

```bash
# teste local no computador
cd zooguia
python3 -m http.server 8000
# abra http://localhost:8000
```

### Publicando na HostGator

O app é 100% estático — basta subir os arquivos, sem instalar nada no servidor:

1. Entre no **cPanel → Gerenciador de Arquivos** (ou use FTP/FileZilla).
2. Envie o **conteúdo** da pasta `zooguia/` para `public_html/zooguia/`
   (ou para `public_html/` se quiser no domínio raiz). Não esqueça o
   `.htaccess` — ele é oculto; ative "Mostrar arquivos ocultos" no cPanel.
3. Garanta que o site abre em **HTTPS** (a HostGator oferece SSL gratuito em
   cPanel → SSL/TLS Status → Run AutoSSL). Sem HTTPS, câmera e GPS não funcionam.
4. Abra `https://seudominio.com.br/zooguia/` no celular, dê as permissões de
   localização, câmera e bússola (no iPhone a bússola pede confirmação extra)
   e use "Adicionar à tela de início" para instalar.

> Ao atualizar arquivos no servidor, incremente a versão dos caches no topo do
> `sw.js` (`v2` → `v3`…) para os visitantes receberem a nova versão.

## ⚠️ Sobre as coordenadas dos recintos

O plantel segue o **mapa ilustrado oficial** do zoo (incluído no app), mas as
posições em `data/animais.json` são **aproximadas**. Três jeitos de corrigi-las:

1. **Modo 📌 Calibrar (recomendado)** — na aba Animais, ative o chip "📌 Calibrar",
   fique em frente a cada recinto e toque em "📌 Aqui": o app grava sua posição
   GPS como a posição do recinto (vale só naquele aparelho). Depois toque em
   "📋 Copiar ajustes" e cole o JSON no `data/animais.json` para valer para todos.
2. **Google Maps** — toque e segure sobre o recinto no Google Maps, copie a
   latitude/longitude exibida e cole no JSON.
3. Peça o mapa georreferenciado à administração (Fundação Jardim Zoológico
   de Brasília).

## Limitações conhecidas do protótipo

- A rota é em **linha reta** ("como o tucano voa"), não segue as trilhas do zoo.
  Uma evolução seria mapear os caminhos internos e usar roteamento (ex.: grafo
  simples ou OSRM com os caminhos do OpenStreetMap).
- A bússola de alguns aparelhos Android é imprecisa perto de estruturas metálicas;
  o app mostra aviso quando a bússola não está disponível.
- GPS tem precisão típica de 5–15 m ao ar livre — suficiente para "chegar perto",
  e por isso o raio de chegada é de 30 m.

## Ideias de evolução

- 🏆 Gamificação: "caderneta" de animais vistos, medalhas para as crianças
- 🔊 Áudio-guia por recinto (acessibilidade)
- 🚻 Pontos de apoio: banheiros, lanchonetes, fraldários, saídas
- 📶 Beacons Bluetooth nos recintos para precisão maior que o GPS
- 🗓️ Horários de alimentação dos animais com notificações
