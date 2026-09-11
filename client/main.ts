import "./style.css";
import { landscape, runner } from "./art";
import { audio } from "./audio";
import { socket, connect, remember, session, ping, offset } from "./network";
import { COLORS, type Snapshot, type Reply } from "../shared/types";
import { createGame } from "./game";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `<main id="home"><header><a class="brand" href="/" aria-label="Geraldo Brothers início"><span class="brand-icon">g<span>b</span></span><span>GERALDO<br>BROTHERS</span></a><nav><span class="edition">MULTIPLAYER PLATFORM RACING</span><button class="icon-button" id="sound" aria-label="Ativar ou desativar música">♫</button><button class="icon-button" id="settings" aria-label="Configurações">⚙</button></nav></header><section class="hero"><div class="hero-art">${landscape()}</div><div class="hero-shade"></div><div class="hero-copy"><div class="eyebrow"><span></span> GRANDES CORRIDAS. BOAS COMPANHIAS.</div><h1>GERALDO<br><span>BROTHERS</span></h1><p class="slogan">Corra. Supere. <strong>Chegue primeiro.</strong></p><p class="description">O caminho é cheio de surpresas.<br>Junte a turma e transforme cada salto em uma disputa.</p><button id="online" class="primary"><span>JOGAR ONLINE</span><span>↗</span></button><div class="room-actions"><button id="create">＋ &nbsp; Criar sala</button><span></span><button id="join">⌘ &nbsp; Entrar em sala</button></div><div class="hero-meta"><span><i class="status-dot"></i> 2–4 jogadores</span><span>⌨ &nbsp; Teclado e touch</span><span>◎ &nbsp; Grátis no navegador</span></div></div><div class="scene-label"><span>01 / PRIMEIRA PARADA</span><strong>Campos de Geraldo</strong><small>Um bom começo para uma grande rivalidade.</small></div><div class="floating-tag">✦ &nbsp; A PRÓXIMA AVENTURA É SUA.</div></section><section class="below"><div class="intro"><span class="eyebrow">SALTOS CURTOS. DISPUTAS ÉPICAS.</span><h2>Uma corrida.<br>Mil histórias para contar.</h2><button id="how">Como jogar <span>↗</span></button></div><article class="feature"><span class="feature-icon">♧</span><h3>Juntos na largada.</h3><p>Crie uma sala, compartilhe o código e desafie até 3 amigos em tempo real.</p><small>01 &nbsp; REÚNA A TURMA</small></article><article class="feature"><span class="feature-icon">↗</span><h3>Cada salto conta.</h3><p>Encontre seu ritmo. Supere obstáculos, colete cristais e conquiste o caminho.</p><small>02 &nbsp; SUPERE O CAMINHO</small></article><article class="feature"><span class="feature-icon">⚑</span><h3>A glória é sua.</h3><p>Uma chegada, quatro histórias. Corra pelo primeiro lugar e encontre a turma no pódio.</p><small>03 &nbsp; DEIXE SUA MARCA</small></article></section><footer><span>© ${new Date().getFullYear()} Geraldo Brothers</span><span>FEITO PARA JOGAR JUNTO.</span><span class="version">VERTICAL SLICE · V0.1</span></footer></main><section id="race" hidden><div id="game-canvas"></div><div id="hud"><div><b>GERALDO BROTHERS</b><small>CAMPOS DE GERALDO · FASE 1/1</small></div><div id="race-stats"></div><button id="exit-race" class="icon-button" aria-label="Sair da corrida">×</button></div><div id="progress"></div><div id="countdown"></div><div id="finish-note" hidden></div><div id="touch"><div><button data-control="ArrowLeft" aria-label="Esquerda">←</button><button data-control="ArrowRight" aria-label="Direita">→</button></div><div><button data-control="ShiftLeft">CORRER</button><button data-control="Space" class="jump">PULAR</button></div></div><div id="rotate">↻ Para jogar melhor, vire o aparelho.</div></section><dialog id="modal"><button id="close-modal" aria-label="Fechar">×</button><div id="modal-content"></div></dialog><div id="toast" role="status" aria-live="polite"></div>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const modal = $<HTMLDialogElement>("modal");
let current: Snapshot | null = null;
let engine: ReturnType<typeof createGame> | null = null;
let lobby = false;
let busy = false;
let lobbySignature = "";
window.addEventListener("resize", () =>
  engine?.game.scale.resize(innerWidth, innerHeight),
);
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const sorted = (s: Snapshot) =>
  [...s.players].sort((a, b) =>
    a.finished !== null && b.finished !== null
      ? a.finished - b.finished
      : a.finished !== null
        ? -1
        : b.finished !== null
          ? 1
          : b.progress - a.progress,
  );
const time = (ms: number) =>
  `${Math.floor(ms / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((ms / 1000) % 60)
    .toString()
    .padStart(2, "0")}.${Math.floor((ms % 1000) / 100)}`;
function toast(message: string) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 3500);
}
window.addEventListener("gb-toast", (e) =>
  toast((e as CustomEvent<string>).detail),
);
function show(html: string) {
  $("modal-content").innerHTML = html;
  if (!modal.open) modal.showModal();
}
$("close-modal").onclick = () => {
  if (lobby) leave();
  else modal.close();
};
modal.addEventListener("cancel", (e) => {
  if (lobby) {
    e.preventDefault();
    leave();
  }
});
function form(join = false) {
  audio.start();
  show(
    `<span class="eyebrow">A TURMA SE ENCONTRA AQUI</span><h2>${join ? "Entre na corrida." : "Sua próxima disputa."}</h2><p>${join ? "Peça o código ao seu amigo e venha para a largada." : "Crie uma sala privada e convide até três amigos."}</p><form id="room-form"><label>SEU NOME<input id="nickname" required minlength="2" maxlength="18" autocomplete="nickname" placeholder="Como a turma te chama?" value="${escape(localStorage.getItem("gb-name") ?? "Geraldo")}"></label>${join ? '<label>CÓDIGO DA SALA<input id="room-code" required pattern="GB-[0-9]{4}" maxlength="7" placeholder="GB-4827" autocapitalize="characters"></label>' : ""}<div id="form-error" role="alert"></div><button class="primary" type="submit">${join ? "ENTRAR EM SALA" : "CRIAR SALA"} <span>↗</span></button></form><small class="muted">2 a 4 jogadores · Uma fase completa · Multiplayer real</small>`,
  );
  $<HTMLFormElement>("room-form").onsubmit = (e) => {
    e.preventDefault();
    if (busy) return;
    const name = $<HTMLInputElement>("nickname").value.trim(),
      code = join
        ? $<HTMLInputElement>("room-code").value.trim().toUpperCase()
        : "";
    busy = true;
    const btn = document.querySelector<HTMLButtonElement>("#room-form button")!;
    btn.disabled = true;
    btn.textContent = "CONECTANDO…";
    const done = (r: Reply) => {
      busy = false;
      if (!r.ok) {
        $("form-error").textContent = r.error ?? "Não foi possível conectar.";
        btn.disabled = false;
        btn.textContent = "TENTAR NOVAMENTE";
        return;
      }
      remember(r);
      localStorage.setItem("gb-name", name);
      lobby = true;
      engine ??= createGame();
      if (engine.scene.ready) socket.emit("loaded");
    };
    const send = () =>
      join
        ? socket.timeout(6000).emit("join", { name, code }, (err, r) =>
            done(
              err
                ? {
                    ok: false,
                    error: "Servidor indisponível. Tente novamente.",
                  }
                : r,
            ),
          )
        : socket.timeout(6000).emit("create", { name }, (err, r) =>
            done(
              err
                ? {
                    ok: false,
                    error: "Servidor indisponível. Tente novamente.",
                  }
                : r,
            ),
          );
    if (socket.connected) send();
    else {
      connect();
      socket.once("connect", send);
      setTimeout(() => {
        if (!socket.connected && busy) {
          socket.off("connect", send);
          done({
            ok: false,
            error:
              "Sem conexão com o servidor. Confira se npm run dev está em execução.",
          });
        }
      }, 6500);
    }
  };
}
$("create").onclick = () => form();
$("online").onclick = () => form();
$("join").onclick = () => form(true);
function renderLobby(s: Snapshot) {
  const me = s.players.find((p) => p.id === session.id);
  if (!me) return;
  show(
    `<span class="eyebrow">SALA PRIVADA · ${s.players.length}/4 CORREDORES</span><h2>Todo mundo na largada.</h2><p>Compartilhe o código. A corrida começa quando todos estiverem prontos.</p><button id="copy-code" class="code">${s.code}<small> COPIAR ↗</small></button><div class="players">${[
      0, 1, 2, 3,
    ]
      .map((i) => {
        const p = s.players[i];
        return p
          ? `<div class="player-card ${p.id === session.id ? "you" : ""}"><div class="avatar">${runner(COLORS[p.color])}</div><strong>${escape(p.name)} ${p.id === session.id ? "<small>VOCÊ</small>" : ""}</strong><span class="${p.ready ? "is-ready" : ""}">${!p.connected ? "Reconectando…" : p.ready ? "● PRONTO" : "○ Aguardando"}</span></div>`
          : '<div class="player-card empty"><div>＋</div><strong>Vaga livre</strong><span>Convide um amigo</span></div>';
      })
      .join(
        "",
      )}</div><div class="color-row"><span>SUA COR</span>${COLORS.map((c, i) => `<button aria-label="Cor ${["azul", "vermelha", "verde", "amarela"][i]}" data-color="${i}" class="swatch ${me.color === i ? "selected" : ""}" style="--swatch:${c}" ${s.players.some((p) => p.id !== me.id && p.color === i) ? "disabled" : ""}></button>`).join("")}</div><button id="ready" class="primary">${me.ready ? "CANCELAR PRONTO" : "ESTOU PRONTO"} <span>✓</span></button><small class="muted">${s.players.length < 2 ? "Aguardando pelo menos mais um jogador." : "Todos prontos? A largada será automática."}</small><button id="leave" class="text-button">Sair da sala</button>`,
  );
  $("copy-code").onclick = () =>
    navigator.clipboard
      ?.writeText(s.code)
      .then(() => toast("Código copiado!"))
      .catch(() => toast(`Compartilhe: ${s.code}`));
  $("ready").onclick = () => socket.emit("ready", !me.ready);
  $("leave").onclick = leave;
  document.querySelectorAll<HTMLButtonElement>("[data-color]").forEach(
    (b) =>
      (b.onclick = () =>
        socket.emit("profile", {
          name: me.name,
          color: Number(b.dataset.color),
        })),
  );
}
function leave() {
  socket.emit("leave");
  sessionStorage.removeItem("gb-session");
  Object.assign(session, { id: "", code: "", token: "" });
  lobby = false;
  current = null;
  modal.close();
  $("home").hidden = false;
  $("race").hidden = true;
  engine?.scene.controls?.destroy();
  engine?.game.destroy(true);
  engine = null;
  audio.theme = "menu";
  $("finish-note").hidden = true;
}
$("exit-race").onclick = () =>
  show(
    '<h2>Sair da corrida?</h2><p>Você perderá sua posição nesta sala.</p><button id="confirm-exit" class="primary">SAIR DA SALA</button>',
  );
document.addEventListener("click", (e) => {
  if ((e.target as HTMLElement).id === "confirm-exit") leave();
});
socket.on("snapshot", (s) => {
  const previousPhase = current?.phase;
  current = s;
  if (!session.id) return;
  engine?.scene.receive(s);
  if (s.phase === "lobby") {
    lobby = true;
    const signature = JSON.stringify(
      s.players.map((p) => [p.id, p.name, p.color, p.ready, p.connected]),
    );
    if (signature !== lobbySignature || !modal.open) {
      lobbySignature = signature;
      renderLobby(s);
    }
  } else {
    lobby = false;
    $("home").hidden = true;
    $("race").hidden = false;
    if (previousPhase !== s.phase) {
      modal.close();
      engine?.game.scale.resize(innerWidth, innerHeight);
    }
    audio.theme = s.phase === "finished" ? "victory" : "race";
    if (s.phase === "finished" && previousPhase !== "finished") podium(s);
  }
});
socket.on("notice", toast);
socket.on("disconnect", () => {
  if (session.id)
    toast("Conexão perdida. Tentando reconectar por 15 segundos…");
});
socket.on("connect", () => {
  if (session.token)
    socket.emit("resume", { code: session.code, token: session.token }, (r) => {
      if (r.ok) {
        remember(r);
        engine?.scene.pending.splice(0);
        if (engine) engine.scene.lastSend = 0;
      } else {
        toast(r.error ?? "Sessão expirada.");
        leave();
      }
    });
});
function podium(s: Snapshot) {
  const winners = sorted(s);
  show(
    `<span class="eyebrow">CORRIDA CONCLUÍDA</span><h2>${escape(winners[0]?.name ?? "")} venceu!</h2><p>O caminho foi melhor com a turma.</p><div class="results">${winners.map((p, i) => `<div><b>${["🥇", "🥈", "🥉", "4º"][i]}</b><span>${escape(p.name)}<small>${p.crystals} cristais · ${p.deaths} quedas</small></span><strong>${time(p.finished ?? 0)}</strong></div>`).join("")}</div><button id="again" class="primary">VOLTAR AO MENU <span>↗</span></button>`,
  );
  $("again").onclick = leave;
}
let lastCount = "";
setInterval(() => {
  if (!current || current.phase === "lobby") return;
  const me = current.players.find((p) => p.id === session.id);
  if (!me) return;
  const elapsed = Date.now() + offset - current.startAt;
  $("race-stats").innerHTML =
    `<span><small>POSIÇÃO</small><b>${sorted(current).findIndex((p) => p.id === me.id) + 1}º/${current.players.length}</b></span><span><small>TEMPO</small><b>${time(me.finished ?? Math.max(0, elapsed))}</b></span><span><small>CRISTAIS</small><b>✦ ${me.crystals}</b></span><span><small>CONEXÃO</small><b>${socket.connected ? `${ping} ms` : "Reconectando"}</b></span>`;
  $("progress").innerHTML = current.players
    .map(
      (p) =>
        `<i title="${escape(p.name)}" style="left:${2 + p.progress * 96}%;background:${COLORS[p.color]}"></i>`,
    )
    .join("");
  const count =
    current.phase === "countdown"
      ? String(
          Math.max(
            1,
            Math.ceil((current.startAt - Date.now() - offset) / 1000),
          ),
        )
      : elapsed < 800
        ? "GERALDO!"
        : "";
  $("countdown").textContent = count;
  if (count && count !== lastCount) audio.sfx("start");
  lastCount = count;
  if (me.finished !== null && current.phase !== "finished") {
    $("finish-note").hidden = false;
    $("finish-note").textContent =
      `Você chegou! ${time(me.finished)} · Aguardando os outros corredores…`;
  }
}, 100);
$("how").onclick = () =>
  show(
    '<span class="eyebrow">APRENDA NO PRIMEIRO SALTO</span><h2>Seu próximo melhor tempo.</h2><div class="instructions"><p><kbd>A</kbd> <kbd>D</kbd> ou <kbd>←</kbd> <kbd>→</kbd> para se mover.</p><p><kbd>ESPAÇO</kbd> para pular. Segure para ir mais alto.</p><p><kbd>SHIFT</kbd> para correr e alcançar plataformas distantes.</p><p>No celular, use os botões na tela. Gamepad: analógico, A para pular e B para correr.</p><p>✦ Colete cristais. Bandeirolas amarelas salvam seu checkpoint. Evite os besouros de pedra e atravesse o arco luminoso para concluir.</p><p>Abra a sala em 2 a 4 navegadores. A vitória é de quem chegar primeiro; os demais continuam até completar o ranking.</p></div>',
  );
function settings() {
  show(
    `<span class="eyebrow">DO SEU JEITO</span><h2>Configurações.</h2><label>MÚSICA <input id="music-volume" type="range" min="0" max="1" step=".05" value="${audio.music}"></label><label>EFEITOS SONOROS <input id="effects-volume" type="range" min="0" max="1" step=".05" value="${audio.effects}"></label><label class="check"><input id="vibrate" type="checkbox" ${audio.vibration ? "checked" : ""}> Vibração no celular</label><button id="fullscreen" class="secondary">Alternar tela cheia ⛶</button>`,
  );
  $<HTMLInputElement>("music-volume").oninput = (e) => {
    audio.start();
    audio.music = Number((e.target as HTMLInputElement).value);
    audio.save();
  };
  $<HTMLInputElement>("effects-volume").oninput = (e) => {
    audio.effects = Number((e.target as HTMLInputElement).value);
    audio.start();
    audio.sfx("crystal");
    audio.save();
  };
  $<HTMLInputElement>("vibrate").onchange = (e) => {
    audio.vibration = (e.target as HTMLInputElement).checked;
    audio.save();
  };
  $("fullscreen").onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Tela cheia indisponível neste navegador.");
    }
  };
}
$("settings").onclick = settings;
$("sound").onclick = () => {
  audio.start();
  audio.music = audio.music ? 0 : 0.25;
  audio.save();
  $("sound").textContent = audio.music ? "♫" : "♪";
  toast(audio.music ? "Música ativada" : "Música desativada");
};
if ("serviceWorker" in navigator)
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) void navigator.serviceWorker.register("/sw.js");
  });
try {
  const saved = JSON.parse(sessionStorage.getItem("gb-session") ?? "null");
  if (saved?.token) {
    Object.assign(session, saved);
    engine = createGame();
    connect();
  }
} catch {
  sessionStorage.removeItem("gb-session");
}
