# PROJETO: GERALDO BROTHERS

Crie um game profissional chamado **Geraldo Brothers**, do gênero **2D Platform Racing Multiplayer**, inspirado nos conceitos clássicos de jogos de plataforma lateral, porém com **identidade visual, personagens, cenários, inimigos, obstáculos, itens, efeitos sonoros e músicas 100% originais**.

Não copie personagens, sprites, mapas, blocos, moedas, inimigos, músicas, sons, nomes, animações ou elementos protegidos de Mario/Nintendo ou de qualquer outra franquia existente.

O objetivo é criar uma propriedade intelectual própria chamada **Geraldo Brothers**.

---

# 1. CONCEITO DO GAME

O game será uma corrida de plataforma 2D multiplayer para até **4 jogadores simultâneos pela internet**.

Cada jogador controla seu próprio personagem e precisa atravessar obstáculos, inimigos, plataformas, armadilhas e desafios até chegar ao final da terceira fase.

O vencedor será o **primeiro jogador que concluir todas as fases**.

A partida deve continuar para os demais jogadores, permitindo determinar:

1º lugar
2º lugar
3º lugar
4º lugar

Mostrar ao final um pódio com a classificação e o tempo de cada jogador.

---

# 2. PLATAFORMAS

O jogo deve funcionar diretamente no navegador:

- Desktop
- Notebook
- Android
- iPhone/iPad

Criar como aplicação web responsiva/PWA.

Não exigir instalação para jogar pelo navegador.

No celular, disponibilizar controles touch na tela.

No computador, permitir teclado e opcionalmente gamepad.

---

# 3. TECNOLOGIA

Utilizar preferencialmente:

Frontend/Game:

- TypeScript
- Phaser 3
- HTML5 Canvas/WebGL
- Vite

Backend:

- Node.js
- TypeScript
- Socket.IO/WebSocket

Arquitetura:

- Cliente/Servidor
- Multiplayer em tempo real
- Servidor autoritativo para elementos importantes da partida

Criar código modular, organizado e preparado para crescimento.

Separar módulos como:

- Game Engine
- Multiplayer
- Lobby
- Players
- Levels
- Physics
- Enemies
- Obstacles
- Items
- Audio
- UI
- Input
- Networking
- Ranking

O backend deverá possuir documentação Swagger/OpenAPI para APIs HTTP existentes.

---

# 4. MENU PRINCIPAL

Criar uma tela inicial moderna e profissional contendo:

**GERALDO BROTHERS**

Botões:

[JOGAR ONLINE]

[CRIAR SALA]

[ENTRAR EM SALA]

[COMO JOGAR]

[CONFIGURAÇÕES]

Permitir ativar/desativar:

- Música
- Efeitos sonoros
- Tela cheia
- Vibração no celular

---

# 5. MULTIPLAYER

Permitir partidas online com:

- 2 jogadores
- 3 jogadores
- 4 jogadores

Ao criar uma sala, gerar um código curto, por exemplo:

**GB-4827**

O jogador poderá compartilhar esse código.

Outro jogador seleciona:

**ENTRAR EM SALA**

e informa o código.

Também preparar arquitetura para futuramente suportar matchmaking automático.

---

# 6. LOBBY

Antes da partida, mostrar os jogadores conectados.

Cada jogador poderá informar seu nome.

Exemplo:

Geraldo
João
Carlos
Pedro

Todos utilizam o mesmo modelo-base de personagem, mas cada jogador deverá ser facilmente identificado através de cores diferentes.

Exemplo:

Jogador 1 — azul
Jogador 2 — vermelho
Jogador 3 — verde
Jogador 4 — amarelo

As roupas e combinações devem possuir design próprio do Geraldo Brothers.

Mostrar acima do personagem seu nome.

No lobby, permitir selecionar a cor disponível.

Exibir:

Jogador 1 — PRONTO
Jogador 2 — PRONTO
Jogador 3 — aguardando
Jogador 4 — PRONTO

A partida começa quando todos confirmarem **PRONTO**.

---

# 7. CÂMERA INDIVIDUAL

Esta funcionalidade é essencial.

Cada jogador deverá enxergar o jogo a partir da posição do **seu próprio personagem**.

Não utilizar uma câmera compartilhada entre todos os jogadores.

Exemplo:

Se Geraldo estiver na posição X = 5000 e João estiver em X = 2500, Geraldo deverá visualizar a região próxima de X = 5000 enquanto João visualizará a região próxima de X = 2500.

Cada navegador/celular executará sua própria câmera seguindo o jogador local.

Os outros jogadores deverão aparecer normalmente quando estiverem dentro da região visível.

Se estiverem muito distantes, mostrar opcionalmente um pequeno indicador na borda da tela informando se determinado competidor está à frente ou atrás.

---

# 8. MOVIMENTAÇÃO

Implementar:

- andar para esquerda
- andar para direita
- correr
- pular
- pulo variável conforme tempo pressionando o botão
- colisões
- plataformas
- queda
- pequenas animações de impacto
- morte/respawn

Os controles precisam responder rapidamente.

Desktop:

A/D ou setas — movimentação
SPACE — pular
SHIFT — correr

Mobile:

Criar controles touch semitransparentes.

Esquerda:
← →

Direita:
PULAR
CORRER

Permitir múltiplos toques simultaneamente.

---

# 9. FÍSICA

Criar física de plataforma extremamente agradável e responsiva.

Implementar:

- aceleração
- desaceleração
- gravidade
- velocidade máxima
- controle aéreo
- colisão
- detecção de chão
- coyote time
- jump buffering

Esses recursos devem deixar os controles precisos sem tornar o jogo excessivamente difícil.

---

# 10. FASES

Criar inicialmente **3 fases completas**.

## FASE 1 — CAMPOS DE GERALDO

Ambiente alegre e colorido.

Elementos:

- gramados
- árvores
- pedras
- pontes
- plataformas
- buracos
- pequenos inimigos
- plataformas móveis

Dificuldade: fácil.

Objetivo: ensinar naturalmente os controles.

---

## FASE 2 — MINAS SUBTERRÂNEAS

Ambiente subterrâneo.

Elementos:

- cavernas
- cristais
- plataformas
- carrinhos
- pontes quebradas
- pedras caindo
- armadilhas
- plataformas móveis
- inimigos próprios

Dificuldade: média.

---

## FASE 3 — FORTALEZA DE LAVA

Última fase.

Ambiente mais dramático.

Elementos:

- lava
- plataformas móveis
- engrenagens
- fogo
- armadilhas
- pontes
- áreas que desmoronam
- inimigos mais difíceis
- grandes saltos

Dificuldade: difícil.

No final deverá existir um grande portal/bandeira/artefato ORIGINAL representando a chegada.

O primeiro jogador que alcançar o objetivo vence.

---

# 11. CHECKPOINTS

Cada fase deverá possuir checkpoints.

Quando o jogador cair ou perder, não deverá necessariamente retornar ao começo.

Retornar ao último checkpoint alcançado.

Mostrar rapidamente:

**CHECKPOINT!**

Os checkpoints precisam ser sincronizados pelo servidor.

---

# 12. OBSTÁCULOS

Utilizar conceitos comuns de jogos de plataforma, porém com desenhos e comportamentos próprios.

Exemplos:

- plataformas móveis
- buracos
- pedras
- fogo
- espinhos estilizados
- objetos que caem
- plataformas temporárias
- plataformas que desaparecem
- paredes móveis
- inimigos terrestres
- inimigos voadores
- objetos lançados
- zonas de velocidade

Não copiar visualmente obstáculos de franquias existentes.

---

# 13. ITENS

Criar itens originais espalhados pelas fases.

Exemplos:

**Cristais GB**

Itens colecionáveis que aumentam a pontuação.

**Turbo**

Aumenta temporariamente a velocidade.

**Escudo**

Protege contra um impacto.

**Super Pulo**

Aumenta temporariamente a altura do salto.

**Ímã**

Atrai Cristais GB próximos.

Criar aparência própria para todos os itens.

---

# 14. MULTIPLAYER EM TEMPO REAL

Utilizar WebSocket/Socket.IO.

Sincronizar:

- posição
- direção
- velocidade
- animação
- estado
- pulos
- mortes
- respawns
- checkpoints
- itens relevantes
- progresso
- chegada
- ranking

Não transmitir simplesmente a posição sem tratamento.

Implementar:

- interpolation
- extrapolation limitada
- client-side prediction quando apropriado
- server reconciliation
- rate limiting
- validação de eventos
- proteção básica contra cheating

O servidor deverá ser autoritativo sobre resultados importantes.

---

# 15. OTIMIZAÇÃO DE REDE

Não enviar eventos desnecessários.

Utilizar atualização eficiente.

Interpolar movimentos remotos para evitar personagens "teletransportando" devido à latência.

Mostrar indicador de conexão:

PING 42ms

Caso o jogador seja desconectado, tentar reconectar automaticamente durante alguns segundos.

Se conseguir:

**Reconectado à partida**

e continuar do estado sincronizado pelo servidor.

---

# 16. HUD

Durante a partida mostrar discretamente:

FASE 1/3

POSIÇÃO: 2º/4

TEMPO: 01:42

PING: 38ms

CRISTAIS: 27

Mostrar também pequenos indicadores dos adversários.

Evitar poluir a tela.

---

# 17. PROGRESSO DA CORRIDA

Adicionar na parte superior uma barra horizontal discreta mostrando o progresso relativo dos jogadores.

Exemplo:

INÍCIO ── 🔵 ─── 🟢 ───── 🔴 ── 🟡 ── CHEGADA

Cada marcador representa um jogador.

A posição deve ser calculada pelo progresso real dentro da fase e não somente pela coordenada X, permitindo fases com caminhos verticais ou curvas.

---

# 18. ÁUDIO

Criar uma trilha sonora ORIGINAL de plataforma arcade alegre e energética.

Não copiar, reproduzir ou criar imitação próxima das músicas de Mario ou de outras franquias.

Criar temas próprios para:

- menu
- fase 1
- fase 2
- fase 3
- vitória
- derrota

Criar efeitos sonoros próprios para:

- pulo
- aterrissagem
- item coletado
- impacto
- checkpoint
- queda
- turbo
- escudo
- inimigos
- início da corrida
- contagem regressiva
- chegada
- vitória

Implementar controle separado de volume:

Música
Efeitos

---

# 19. INÍCIO DA CORRIDA

Quando todos estiverem carregados, posicionar os jogadores lado a lado.

Executar:

3

2

1

GERALDO!

A corrida começa simultaneamente para todos.

O servidor deverá determinar o instante oficial de início para evitar vantagens por latência.

---

# 20. SISTEMA DE COLOCAÇÃO

Quando um jogador terminar:

**GERALDO CHEGOU EM 1º!**

Registrar tempo.

Os demais continuam jogando.

Exemplo:

🥇 Geraldo — 08:42
🥈 João — 09:01
🥉 Carlos — 09:27
4º Pedro — 10:13

Ao final mostrar:

**VENCEDOR**

Nome do jogador

Tempo total

Cristais coletados

Número de quedas

---

# 21. DESIGN

Criar identidade visual própria para Geraldo Brothers.

Estilo:

- cartoon 2D moderno
- divertido
- cores vibrantes
- animações fluidas
- iluminação suave
- partículas discretas
- interface moderna
- excelente legibilidade

Evitar qualquer sprite ou objeto visual que possa ser confundido com personagens, blocos, moedas, inimigos ou cenários de Mario.

---

# 22. RESPONSIVIDADE

O game precisa adaptar automaticamente:

- resolução
- escala
- HUD
- câmera
- controles
- interface

para diferentes tamanhos de tela.

Manter proporção visual consistente.

Em smartphones, considerar orientação horizontal como modo preferencial de jogo.

Exibir orientação para girar o aparelho quando necessário.

---

# 23. ESTRUTURA DO PROJETO

Utilizar arquitetura modular.

Exemplo:

/client
/game
/scenes
/players
/entities
/enemies
/items
/levels
/physics
/network
/audio
/ui
/input

/server
/rooms
/players
/game
/network
/validation
/ranking

/shared
/types
/events
/constants
/schemas

/assets
/sprites
/animations
/audio
/music
/maps

---

# 24. QUALIDADE DO CÓDIGO

Utilizar:

- TypeScript strict
- Clean Code
- SOLID quando fizer sentido
- Design Patterns somente quando agregarem simplicidade/manutenção
- módulos reutilizáveis
- interfaces claras
- tratamento de erros
- validação de entrada
- logs estruturados
- configuração por .env
- ESLint
- Prettier

Evitar overengineering.

Compartilhar tipos e contratos de eventos entre frontend e backend para evitar duplicação.

---

# 25. TESTES

Adicionar testes automatizados para componentes críticos:

- criação de sala
- entrada na sala
- limite de 4 jogadores
- nickname
- seleção de cor
- ready
- checkpoints
- ranking
- finalização
- reconexão
- validação dos eventos multiplayer

---

# 26. SEGURANÇA

Nunca confiar totalmente no cliente.

Validar no servidor:

- velocidade máxima
- movimentações impossíveis
- conclusão de fase
- checkpoints
- itens
- tempo de corrida
- eventos enviados
- frequência das mensagens

Adicionar rate limiting e sanitização de nickname.

---

# 27. ENTREGA

Entregar um projeto funcional, e não somente telas demonstrativas.

Preciso conseguir executar localmente com algo simples como:

npm install
npm run dev

Criar também:

npm run build
npm run test

Fornecer README.md contendo:

- requisitos
- instalação
- desenvolvimento
- produção
- arquitetura
- multiplayer
- configuração do servidor
- variáveis de ambiente
- deploy
- testes

Criar `.env.example`.

Não colocar secrets no repositório.

---

# 28. DEPLOY

Preparar o projeto para deploy real.

Frontend deverá poder ser hospedado via HTTPS.

Backend deverá suportar WebSocket seguro (WSS).

Criar Dockerfile e docker-compose quando apropriado.

Preparar configuração para execução atrás de Nginx/reverse proxy.

---

# 29. PRIMEIRA ENTREGA

Não tente construir todo o jogo de uma única vez sem validar a arquitetura.

Implemente inicialmente um **Vertical Slice jogável**, contendo:

- Menu
- Criar sala
- Entrar por código
- Lobby
- 2 a 4 jogadores
- Escolha de nome
- Escolha de cor
- Ready
- Primeira fase
- Multiplayer real
- Câmera independente
- Corrida
- Obstáculos básicos
- Checkpoint
- Sons
- Música original
- Ranking
- Vitória

Depois que esse núcleo estiver funcionando corretamente, implementar as fases 2 e 3.

O resultado final deverá parecer um **game comercial indie profissional**, simples de jogar, visualmente bonito, rápido e preparado para expansão futura.

Nome oficial:

# GERALDO BROTHERS

Slogan:

**Corra. Supere. Chegue primeiro.**
