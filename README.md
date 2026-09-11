# Geraldo Brothers

**Corra. Supere. Chegue primeiro.**

Primeira entrega: vertical slice multiplayer jogável para 2–4 pessoas, com a fase **Campos de Geraldo**. Arte vetorial, personagens com óculos de exploração e lenços, besouros de pedra e composições sintetizadas foram criados para este projeto. Não usa sprites ou áudio de franquias existentes.

## Executar

Requisitos: Node.js 20.19+ (22 recomendado), npm e navegador moderno com Canvas/WebGL.

```powershell
cd "D:\Desenvolvimento\games\Geraldo Brothers"
npm install
npm run dev
```

Abra **http://localhost:5188**. Crie uma sala, copie o código e entre em outra aba, janela ou dispositivo. São necessárias **duas pessoas**, ambas com a fase carregada e status PRONTO. A sala comporta quatro jogadores; não existem adversários simulados.

A porta 5188 é fixa para evitar abrir por engano outro aplicativo que já ocupe a porta padrão do Vite. O backend usa 3001. Em desenvolvimento, Vite encaminha HTTP e Socket.IO ao backend por IPv4.

### Jogar pelo celular na rede local

Copie `.env.example` para `.env`. Configure `ALLOWED_ORIGIN` com os endereços usados pelos jogadores, separados por vírgula, por exemplo `http://localhost:5188,http://192.168.0.154:5188`. Reinicie `npm run dev`. No celular conectado ao mesmo Wi-Fi, abra `http://IP-DO-PC:5188`. Se necessário, permita a porta no firewall do seu sistema. Use orientação horizontal; a interface também se adapta à vertical.

### Controles

| Ação   | Teclado                  | Gamepad            |
| ------ | ------------------------ | ------------------ |
| Mover  | A/D ou setas             | Analógico esquerdo |
| Pular  | Espaço ou seta para cima | A / botão 0        |
| Correr | Shift                    | B / botão 1        |

Segure o pulo para saltar mais alto. Touch oferece botões com captura de ponteiro para multitoque. Bandeirolas amarelas ativam checkpoints. O arco luminoso encerra a corrida. Quem termina aguarda os outros, que continuam jogando; o pódio registra ordem, tempo, cristais e quedas.

## Validação

```sh
npm run test
npm run lint
npm run build
```

`tests/core.test.ts` verifica criação, capacidade, nickname, cores, ready/carregamento, reconexão, contratos, velocidade, checkpoints, pulo variável, coyote time, jump buffering, coleta, finalização e ranking.

`tests/course.test.ts` percorre a fase inteira com dois corredores usando exclusivamente inputs da simulação e verifica os checkpoints e a conclusão. A suíte contém 14 testes.

Com o servidor de desenvolvimento ativo, `node tests/browser.mjs` executa duas sessões reais no Edge headless, verifica entrada/largada/movimentação/reconexão/reload, percorre a fase por eventos de teclado até o pódio e captura cinco imagens desktop e mobile em `artifacts/`. É necessário Microsoft Edge instalado; pode-se alterar `channel` no script para usar outro navegador disponível. Esse script é separado dos testes unitários para não exigir um navegador em todo ambiente de CI.

Validação realizada nesta entrega: build de produção, lint, 14 testes, duas sessões no Edge até o pódio, layout mobile emulado sem overflow, e respostas HTTP 200 do pacote de produção para menu, health, OpenAPI, Swagger, manifesto e ícone. A auditoria npm final reportou zero vulnerabilidades. A renderização usa Phaser com Canvas 2D para evitar depender de aceleração gráfica. O bundle separado do Phaser tem cerca de 340 KiB comprimidos; o Vite avisa sobre seu tamanho descomprimido.

## Arquitetura

```text
client/
  main.ts       menu, lobby, configurações, HUD e pódio
  game.ts       cena Phaser, câmera local, render e reconciliação
  input.ts      teclado, gamepad e multitouch
  network.ts    Socket.IO, sessão e estimativa de relógio/ping
  audio.ts      música procedural e efeitos com Web Audio
  art.ts        personagens e ilustração originais em SVG
shared/
  types.ts      contratos cliente/servidor
  level.ts      plataformas, rota, inimigos, cristais e checkpoints
  physics.ts    simulação reutilizada no servidor e predição local
server/
  rooms.ts      salas, validação, sessão, estado e ranking
  index.ts      transporte, API HTTP, limites e loop de simulação
public/         manifesto, ícone e service worker
deploy/         reverse proxy Nginx
tests/          testes do núcleo e navegação
```

Servidor simula a 60 ticks/s e transmite snapshots a 20 Hz. Cliente transmite intenções a aproximadamente 30 Hz, nunca posição/tempo/itens. O servidor limita a velocidade por construção e calcula colisões, mortes, checkpoints, coletas e resultado. A física usa timestep fixo, aceleração/desaceleração, controle aéreo, coyote time de 110 ms e buffer de 120 ms.

A predição local compartilha a física, reaplica inputs ainda não reconhecidos após cada snapshot e suaviza competidores remotos com extrapolação limitada a 100 ms. Cada navegador acompanha exclusivamente o jogador local. O relógio de largada pertence ao servidor. Progresso é projetado sobre uma rota de segmentos, permitindo ampliar o formato para trajetos verticais.

Reconexão usa token aleatório de 192 bits, guardado em `sessionStorage` e nunca incluído nos snapshots. O estado fica reservado durante 15 segundos; jogadores ausentes depois desse prazo são removidos. Perda prolongada de inputs interrompe movimento. Validação Zod rejeita propriedades inesperadas, nomes inválidos e sequências fora do intervalo. Eventos recebem limite por conexão, e payloads são limitados a 4 KiB. A seleção de cor é exclusiva na sala.

## HTTP e eventos

- `GET /api/health`: status e quantidade de salas.
- `GET /api/openapi.json`: contrato OpenAPI.
- `/docs/`: documentação interativa Swagger UI.

Eventos tipados estão em `shared/types.ts`: `create`, `join`, `resume`, `profile`, `ready`, `loaded`, `input`, `leave`, `pingCheck`; servidor publica `snapshot` e `notice`. Criação/entrada/reconexão respondem `{ok, error?, code?, id?, token?}`. Salas privadas já separam gerenciamento de transporte para posterior adição de matchmaking. **Jogar online** inicia o fluxo de criar uma sala privada nesta entrega.

## Configuração

| Variável          | Padrão                  | Uso                                                                   |
| ----------------- | ----------------------- | --------------------------------------------------------------------- |
| `PORT`            | `3001`                  | Porta HTTP/Socket.IO do backend                                       |
| `HOST`            | `0.0.0.0`               | Interface de escuta                                                   |
| `ALLOWED_ORIGIN`  | `http://localhost:5188` | Origins autorizadas, separadas por vírgula                            |
| `VITE_SERVER_URL` | mesma origem            | URL pública do backend quando separado do frontend; aplicada no build |

Se alterar PORT em desenvolvimento, ajuste também o proxy de `vite.config.ts`. Variáveis `VITE_*` são públicas: nunca coloque segredos nelas. `.env` é ignorado pelo Git.

## Produção e deploy

```sh
npm ci
npm run build
# Configure ALLOWED_ORIGIN com a URL pública HTTPS antes de iniciar.
npm start
```

O Node serve `dist/`, APIs e Socket.IO em uma só origem. Alternativamente, hospede `dist/` em um serviço estático HTTPS, defina `VITE_SERVER_URL` no build e autorize a origem do frontend no backend.

```sh
docker compose up --build -d
```

O Compose publica http://localhost:8080 pelo Nginx. `deploy/nginx.conf` encaminha upgrades de WebSocket. Para internet, configure domínio e certificado TLS em um proxy de borda (ou adapte o Nginx para 443 com certificados montados). Use `ALLOWED_ORIGIN=https://seu-dominio` e encaminhe ao serviço; Socket.IO passa a usar HTTPS/WSS automaticamente. Certificados e domínio dependem do ambiente e não estão incluídos. Nenhum deploy externo foi realizado.

PWA inclui manifesto, ícone vetorial e cache do shell/recursos visitados. A partida sempre precisa de rede. A instalação varia conforme suporte do navegador, especialmente no iOS, e requer HTTPS fora de localhost. As fontes possuem fallback local; Google Fonts é uma melhoria opcional de tipografia.

## Escopo desta entrega e próximos passos

Incluído: menu, sala privada, lobby 2–4, nome/cor/ready, carregamento, primeira fase de 5.400 unidades, câmera independente, plataformas móveis, buracos, inimigos, checkpoints, cristais, áudio original de menu/corrida/vitória, ranking e pódio, controles responsivos, PWA e infraestrutura de deploy.

Ficam para as próximas entregas, após validar o núcleo: Minas Subterrâneas e Fortaleza de Lava; turbo/escudo/superpulo/ímã; armadilhas avançadas; matchmaking público; espectador com troca de câmera e indicadores fora da tela; temas adicionais de áudio e refinamento de animações.

Limites atuais: armazenamento em memória em um único processo; reiniciar o servidor encerra salas. Não há autenticação, persistência de ranking, matchmaking público ou mitigação distribuída de abuso. Para escala horizontal serão necessários roteamento consistente das salas e armazenamento/coordenação compartilhados. Não houve teste de carga, de dispositivos iOS físicos ou de redes móveis com latência elevada. Docker/TLS devem ser validados no ambiente de hospedagem. O projeto é uma base jogável validável, não uma alegação de certificação comercial ou de compatibilidade em todos os dispositivos.

Referências técnicas: [Phaser](https://docs.phaser.io/phaser/getting-started/installation), [Socket.IO](https://socket.io/docs/v4/), [Vite](https://vite.dev/guide/).
