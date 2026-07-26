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
| 📋 **Animais** | Lista com busca; mostra a distância de cada animal até você, ordenada do mais perto para o mais longe |
| 🗺️ **Mapa** | Mapa real (OpenStreetMap) com os recintos, sua posição e uma linha até o destino |
| 📸 **Radar AR** | Câmera aberta com uma seta sobreposta que gira conforme você vira o celular; ao chegar a menos de 30 m, o animal "aparece" na tela comemorando 🎉 |

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

Para testar no celular de verdade, publique em qualquer hospedagem com HTTPS
gratuito, por exemplo:

- **GitHub Pages** (Settings → Pages → apontar para a pasta `zooguia/`)
- **Netlify** / **Vercel** / **Cloudflare Pages** (arrastar a pasta e pronto)

Depois é só abrir o link no celular, dar as permissões de localização, câmera e
bússola (no iPhone a bússola pede confirmação extra) e usar "Adicionar à tela
de início" para instalar.

## ⚠️ Sobre as coordenadas dos recintos

As posições em `data/animais.json` são **aproximadas/fictícias**, dentro da área
do zoo, apenas para demonstrar o funcionamento. Para uso real:

1. Caminhe até cada recinto com o app do mapa aberto e anote a coordenada; ou
2. Peça o mapa georreferenciado à administração do zoológico (Fundação Jardim
   Zoológico de Brasília).

Basta editar o JSON — nenhuma mudança de código é necessária.

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
