/* ---------- DATA STRUCTURES ---------- */
const choices = ["rock", "paper", "scissors"];           // ARRAY
const rules = { rock: "scissors", paper: "rock", scissors: "paper" }; // OBJECT
const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };

/* ---------- CLASS (OOP) ---------- */
class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
  }
  addWin() {
    this.score++;
  }
}

/* ---------- STATE ---------- */
const WIN_TARGET = 3;    // first player to reach this many round-wins takes the match
let playerA = null;
let playerB = null;
let history = [];        // array of past round results
let currentTurn = "A";   // whose turn it is to pick this round
let pendingChoiceA = null;
let matchOver = false;
const maxRoundLabels = []; // built with a while loop below

// LOOP #1 (while): pre-build round labels "Round 1".."Round 20" for display use
let labelCount = 0;
while (labelCount < 20) {
  maxRoundLabels.push("Round " + (labelCount + 1));
  labelCount++;
}

// THEME: restore the viewer's last theme choice (per-browser only, wrapped in try/catch)
try {
  const savedTheme = localStorage.getItem("rps_theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
} catch (e) { /* storage unavailable, fall back to system theme */ }

function toggleTheme() {
  const isDark = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() === "#14161f";
  const next = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("rps_theme", next); } catch (e) { /* ignore */ }
}

/* ---------- FUNCTIONS ---------- */

// FUNCTION 1: decides the winner of one round (switch + if/else, same logic as console version)
function getRoundResult(a, b) {
  switch (a) {
    case "rock": case "paper": case "scissors": break;
    default: return "invalid";
  }
  if (a === b) return "tie";
  if (rules[a] === b) return "playerA";
  return "playerB";
}

// FUNCTION 2: renders the choice buttons (LOOP #2: a for loop builds them from the array)
function renderChoiceButtons(onPick) {
  let html = "";
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    html += `<button class="choice-btn" data-choice="${c}" onclick="${onPick}('${c}')">
               ${emojis[c]}<span class="label">${c}</span>
             </button>`;
  }
  return html;
}

// FUNCTION 3: renders the round history using .map() -- HIGHER-ORDER FUNCTION requirement
function renderHistory() {
  if (history.length === 0) return "";
  const rows = history.map(function (h, i) {
    return `<div>#${i + 1} — ${h.a} ${emojis[h.a]} vs ${h.b} ${emojis[h.b]} → ${h.winnerText}</div>`;
  });
  return `<div class="history">${rows.join("")}</div>`;
}

function pickA(choice) {
  pendingChoiceA = choice;
  currentTurn = "B";
  render();
}

// EFFECT: bursts a few emoji "confetti" pieces down the screen on a round win
function spawnConfetti() {
  const pieces = ["🎉", "✨", "🎊", "⭐"];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = (0.9 + Math.random() * 0.6) + "s";
    el.style.animationDelay = (Math.random() * 0.2) + "s";
    document.body.appendChild(el);
    el.addEventListener("animationend", function () { el.remove(); });
  }
}

function pickB(choice) {
  const result = getRoundResult(pendingChoiceA, choice);
  let winnerText = "Tie!";
  if (result === "playerA") { playerA.addWin(); winnerText = playerA.name + " wins"; spawnConfetti(); }
  else if (result === "playerB") { playerB.addWin(); winnerText = playerB.name + " wins"; spawnConfetti(); }

  history.unshift({ a: pendingChoiceA, b: choice, winnerText: winnerText, result: result });
  pendingChoiceA = null;

  if (playerA.score >= WIN_TARGET || playerB.score >= WIN_TARGET) {
    matchOver = true;
    spawnConfetti();
  } else {
    currentTurn = "A";
  }
  render();
}

function startGame() {
  const n1 = document.getElementById("p1name").value.trim() || "Player 1";
  const n2 = document.getElementById("p2name").value.trim() || "Player 2";
  playerA = new Player(n1);
  playerB = new Player(n2);
  history = [];
  currentTurn = "A";
  matchOver = false;
  render();
}

function resetGame() {
  playerA = null; playerB = null; history = []; matchOver = false;
  render();
}

/* ---------- RENDER ---------- */
function render() {
  const app = document.getElementById("app");
  const themeBtn = `<button class="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark">🌓</button>`;

  if (!playerA || !playerB) {
    app.innerHTML = `
      ${themeBtn}
      <h1>Rock · Paper · Scissors</h1>
      <div class="sub">1v1 — first to ${WIN_TARGET} round wins takes the match</div>
      <div class="row"><input id="p1name" placeholder="Player 1 name"></div>
      <div class="row"><input id="p2name" placeholder="Player 2 name"></div>
      <button style="width:100%" onclick="startGame()">Start Game</button>
    `;
    return;
  }

  const lastRound = history[0];

  if (matchOver) {
    const matchWinner = playerA.score >= WIN_TARGET ? playerA : playerB;
    app.innerHTML = `
      ${themeBtn}
      <div class="trophy">🏆</div>
      <div class="match-winner">${matchWinner.name} wins the match!</div>
      <div class="match-final-score">Final score — ${playerA.name}: ${playerA.score}  ·  ${playerB.name}: ${playerB.score}</div>
      ${renderHistory()}
      <div class="actions"><button style="width:100%" onclick="resetGame()">New Match</button></div>
    `;
    return;
  }

  // shows both picks as big pictures with a VS badge, then the winner banner
  const resultBlock = lastRound ? `
    <div class="battle">
      <div class="fighter ${lastRound.result === 'playerA' ? 'winner' : ''}">
        <div class="pic">${emojis[lastRound.a]}</div><div class="who">${playerA.name}</div>
      </div>
      <div class="vs">VS</div>
      <div class="fighter ${lastRound.result === 'playerB' ? 'winner' : ''}">
        <div class="pic">${emojis[lastRound.b]}</div><div class="who">${playerB.name}</div>
      </div>
    </div>
    <div class="result ${lastRound.result === 'tie' ? 'tie' : 'win'}">${lastRound.winnerText}</div>` : "";

  if (currentTurn === "A") {
    app.innerHTML = `
      ${themeBtn}
      <h1>Round ${history.length + 1}</h1>
      ${resultBlock}
      <div class="scoreboard">
        <div><div>${playerA.name}</div><div class="score ${lastRound && lastRound.result === 'playerA' ? 'bump' : ''}">${playerA.score}</div></div>
        <div><div>${playerB.name}</div><div class="score ${lastRound && lastRound.result === 'playerB' ? 'bump' : ''}">${playerB.score}</div></div>
      </div>
      <div class="turn-banner">${playerA.name}'s turn — pick secretly</div>
      <div class="choices">${renderChoiceButtons("pickA")}</div>
      ${renderHistory()}
      <div class="actions"><button class="ghost" onclick="resetGame()">New Game</button></div>
    `;
  } else {
    app.innerHTML = `
      ${themeBtn}
      <h1>Round ${history.length + 1}</h1>
      <div class="scoreboard">
        <div><div>${playerA.name}</div><div class="score">${playerA.score}</div></div>
        <div><div>${playerB.name}</div><div class="score">${playerB.score}</div></div>
      </div>
      <div class="turn-banner">${playerB.name}'s turn — pick secretly</div>
      <div class="choices">${renderChoiceButtons("pickB")}</div>
      ${renderHistory()}
      <div class="actions"><button class="ghost" onclick="resetGame()">New Game</button></div>
    `;
  }
}

render();
