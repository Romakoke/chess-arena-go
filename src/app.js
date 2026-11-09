import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const game = new Chess();
const boardEl = document.querySelector("#board");
const movesEl = document.querySelector("#moves");
const statusEl = document.querySelector("#game-status");
const engineStatus = document.querySelector("#engine-status");
const difficulty = document.querySelector("#difficulty");
const undoBtn = document.querySelector("#undo");
const restartBtn = document.querySelector("#restart");

const glyphs = {
  w: { k:"♔", q:"♕", r:"♖", b:"♗", n:"♘", p:"♙" },
  b: { k:"♚", q:"♛", r:"♜", b:"♝", n:"♞", p:"♟︎" }
};
let selected = null;
let legalTargets = [];
let lastMove = null;
let thinking = false;
let engineReady = false;
let worker = null;
let gameHistory = [];

function makeEngine() {
  try {
    // npm install арқылы жүктелетін Stockfish 19 lite single-threaded нұсқасы.
    worker = new Worker("/engine/stockfish-19-lite-single.js");
    worker.onmessage = (event) => {
      const line = String(event.data || "");
      if (line === "uciok") {
        worker.postMessage("isready");
      } else if (line === "readyok") {
        engineReady = true;
        engineStatus.textContent = "Stockfish 19 дайын";
        render();
      } else if (line.startsWith("bestmove")) {
        const uci = line.split(/\s+/)[1];
        if (uci && uci !== "(none)" && thinking && !game.isGameOver()) {
          const move = { from: uci.slice(0,2), to: uci.slice(2,4) };
          if (uci.length > 4) move.promotion = uci[4];
          const played = game.move(move);
          if (played) {
            gameHistory.push(game.fen());
            lastMove = { from: played.from, to: played.to };
          }
        }
        thinking = false;
        render();
      }
    };
    worker.onerror = (event) => {
      engineStatus.textContent = "Stockfish жүктелмеді";
      statusEl.textContent = "Қозғалтқыш файлы табылмады. npm.cmd install командасын тексеріңіз.";
      console.error("Stockfish worker error:", event.message || event);
    };
    worker.postMessage("uci");
  } catch (error) {
    engineStatus.textContent = "Stockfish іске қосылмады";
    console.error(error);
  }
}

function renderBoard() {
  boardEl.innerHTML = "";
  const files = "abcdefgh";
  const ranks = "87654321";
  const legalMoves = selected ? game.moves({ square: selected, verbose: true }) : [];
  legalTargets = legalMoves.map(m => m.to);

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = files[f] + ranks[r];
      const piece = game.get(square);
      const el = document.createElement("button");
      el.type = "button";
      el.className = `square ${(r + f) % 2 === 0 ? "light" : "dark"}`;
      if (piece) el.classList.add(piece.color === "w" ? "white-piece" : "black-piece");
      if (selected === square) el.classList.add("selected");
      if (lastMove && (lastMove.from === square || lastMove.to === square)) el.classList.add("last");
      if (legalTargets.includes(square)) el.classList.add(piece ? "capture" : "target");
      el.dataset.square = square;
      if (piece) el.textContent = glyphs[piece.color][piece.type];
      if (f === 0 || r === 7) {
        const coord = document.createElement("span");
        coord.className = "coord";
        coord.textContent = f === 0 ? ranks[r] : files[f];
        el.append(coord);
      }
      el.addEventListener("click", () => onSquareClick(square));
      boardEl.append(el);
    }
  }
}

function onSquareClick(square) {
  if (thinking || game.isGameOver() || game.turn() !== "w") return;
  const piece = game.get(square);
  if (selected && legalTargets.includes(square)) {
    let promotion = undefined;
    const moving = game.get(selected);
    if (moving?.type === "p" && (square.endsWith("8") || square.endsWith("1"))) {
      const choice = (prompt("Фигураны таңдаңыз: q — ферзь, r — тура, b — піл, n — ат", "q") || "q").toLowerCase();
      promotion = ["q","r","b","n"].includes(choice) ? choice : "q";
    }
    const move = game.move({ from: selected, to: square, promotion });
    if (move) {
      lastMove = { from: move.from, to: move.to };
      gameHistory.push(game.fen());
      selected = null;
      render();
      if (!game.isGameOver()) askEngine();
      return;
    }
  }
  if (piece && piece.color === "w") {
    selected = square;
  } else {
    selected = null;
  }
  renderBoard();
}

function askEngine() {
  if (!engineReady || !worker || game.isGameOver()) {
    if (!engineReady) statusEl.textContent = "Бот жүктеліп жатыр...";
    return;
  }
  thinking = true;
  selected = null;
  render();
  worker.postMessage(`position fen ${game.fen()}`);
  worker.postMessage(`go depth ${difficulty.value}`);
}

function renderMoves() {
  const history = game.history();
  if (!history.length) {
    movesEl.innerHTML = '<div class="empty">Әзірге жүрістер жоқ</div>';
    return;
  }
  movesEl.innerHTML = "";
  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement("div");
    row.className = "move-row";
    const number = document.createElement("span");
    number.className = "move-num";
    number.textContent = `${Math.floor(i / 2) + 1}.`;
    const white = document.createElement("span");
    white.className = "move";
    white.textContent = history[i] || "";
    const black = document.createElement("span");
    black.className = "move";
    black.textContent = history[i + 1] || "";
    row.append(number, white, black);
    movesEl.append(row);
  }
  movesEl.scrollTop = movesEl.scrollHeight;
}

function renderStatus() {
  if (game.isCheckmate()) {
    statusEl.textContent = game.turn() === "w" ? "Мат! Бот жеңді." : "Мат! Сен жеңдің!";
  } else if (game.isDraw()) {
    statusEl.textContent = "Тең ойын";
  } else if (thinking) {
    statusEl.textContent = "Stockfish ойланып жатыр...";
  } else if (game.isCheck()) {
    statusEl.textContent = game.turn() === "w" ? "Саған шах!" : "Ботқа шах!";
  } else {
    statusEl.textContent = game.turn() === "w" ? "Жүріс сенде" : "Боттың жүрісі";
  }
  undoBtn.disabled = game.history().length < 2 || thinking;
}

function render() {
  renderBoard();
  renderMoves();
  renderStatus();
}

undoBtn.addEventListener("click", () => {
  if (thinking) return;
  // Бір рет басқанда адамның және боттың соңғы жүрісін бірге қайтарады.
  if (game.history().length >= 2) {
    game.undo();
    game.undo();
    lastMove = null;
    selected = null;
    render();
  }
});
restartBtn.addEventListener("click", () => {
  if (thinking && worker) worker.postMessage("stop");
  thinking = false;
  game.reset();
  gameHistory = [];
  selected = null;
  lastMove = null;
  render();
});
difficulty.addEventListener("change", () => {
  if (engineReady) engineStatus.textContent = `Stockfish 19 · depth ${difficulty.value}`;
});

render();
makeEngine();
