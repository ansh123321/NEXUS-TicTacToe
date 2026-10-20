/* =========================================
   NEXUS — TIC-TAC-TOE + MINIMAX AI
   ========================================= */

const cells = document.querySelectorAll(".cell");
const modeButtons = document.querySelectorAll(".mode-btn");

const turnIndicator = document.getElementById("turn-indicator");
const turnText = document.getElementById("turn-text");

const scoreXElement = document.getElementById("score-x");
const scoreOElement = document.getElementById("score-o");
const scoreDrawElement = document.getElementById("score-draw");

const scoreCardX = document.getElementById("score-card-x");
const scoreCardO = document.getElementById("score-card-o");

const playerNameX = document.getElementById("player-name-x");
const playerNameO = document.getElementById("player-name-o");

const resetButton = document.getElementById("reset-btn");
const newGameButton = document.getElementById("new-game-btn");

const resultMessage = document.getElementById("result-message");
const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultDescription = document.getElementById("result-description");

const difficultyPanel = document.getElementById("difficulty-panel");
const difficultySelect = document.getElementById("difficulty-select");

const soundToggle = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const soundLabel = document.getElementById("sound-label");

let soundEnabled = true;
let audioContext = null;

const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;
let gameMode = "pvp";
let aiTimer = null;

let scores = {
    X: 0,
    O: 0,
    draws: 0
};

initializeGame();

function initializeGame() {
    cells.forEach((cell) => {
        cell.addEventListener("click", handleCellClick);
    });

    

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const selectedMode = button.dataset.mode;

            if (selectedMode === gameMode) return;

            gameMode = selectedMode;

            updateModeButtons();
            updatePlayerNames();
            updateDifficultyVisibility();
            resetRound();
        });
    });

    difficultySelect.addEventListener("change", resetRound);

    resetButton.addEventListener("click", resetRound);
    newGameButton.addEventListener("click", startNewGame);
    soundToggle.addEventListener("click", toggleSound);

    updateModeButtons();
    updatePlayerNames();
    updateDifficultyVisibility();
    updateTurnIndicator();
    updateScoreboard();
}

function handleCellClick(event) {
    const index = Number(event.currentTarget.dataset.index);

    if (!gameActive || board[index] !== "") return;

    // O is controlled by the computer in AI mode.
    if (gameMode === "ai" && currentPlayer === "O") return;

    makeMove(index, currentPlayer);

    if (!gameActive) return;

    switchPlayer();

    if (gameMode === "ai" && currentPlayer === "O") {
        scheduleAIMove();
    }
}

function makeMove(index, player) {
    if (board[index] !== "" || !gameActive) return;

    board[index] = player;

    const cell = cells[index];

    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.disabled = true;
    cell.setAttribute("aria-label", `${getCellName(index)}, ${player}`);
    playSound("move");

    checkGameResult();
}

function switchPlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnIndicator();
}

function checkGameResult() {
    const winningCombination = WINNING_COMBINATIONS.find(([a, b, c]) =>
        board[a] !== "" &&
        board[a] === board[b] &&
        board[b] === board[c]
    );

    if (winningCombination) {
        finishGame("win", winningCombination);
        return;
    }

    if (board.every((cell) => cell !== "")) {
        finishGame("draw");
    }
}

function finishGame(result, winningCombination = []) {
    gameActive = false;
    clearTimeout(aiTimer);

    cells.forEach((cell) => {
        cell.disabled = true;
    });

    if (result === "win") {
        const winner = board[winningCombination[0]];
        scores[winner]++;
        playSound("win");

        winningCombination.forEach((index) => {
            cells[index].classList.add("winner");
        });

        resultIcon.textContent = "✦";

        if (gameMode === "ai") {
            resultTitle.textContent = winner === "X" ? "YOU WIN!" : "AI WINS!";
        } else {
            resultTitle.textContent = `${winner} WINS!`;
        }

        resultDescription.textContent =
            winner === "X"
                ? `${playerNameX.textContent} takes the round.`
                : `${playerNameO.textContent} takes the round.`;

        turnText.textContent = "ROUND COMPLETE";
    } else {
        scores.draws++;
        playSound("draw");

        resultIcon.textContent = "◇";
        resultTitle.textContent = "IT'S A DRAW!";
        resultDescription.textContent = "A close match. Ready for another round?";
        turnText.textContent = "MATCH DRAWN";
    }

    resultMessage.hidden = false;

    updateScoreboard();
    updateTurnIndicator();
}

function updateScoreboard() {
    scoreXElement.textContent = scores.X;
    scoreOElement.textContent = scores.O;
    scoreDrawElement.textContent = scores.draws;
}

function updateModeButtons() {
    modeButtons.forEach((button) => {
        const active = button.dataset.mode === gameMode;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function updatePlayerNames() {
    if (gameMode === "ai") {
        playerNameX.textContent = "YOU";
        playerNameO.textContent = "NEXUS AI";
    } else {
        playerNameX.textContent = "PLAYER X";
        playerNameO.textContent = "PLAYER O";
    }
}

function updateDifficultyVisibility() {
    difficultyPanel.hidden = gameMode !== "ai";
}

function updateTurnIndicator() {
    const name =
        currentPlayer === "X"
            ? playerNameX.textContent
            : playerNameO.textContent;

    if (gameActive) {
        turnText.textContent =
            gameMode === "ai" && currentPlayer === "O"
                ? "NEXUS AI IS THINKING..."
                : `${name}'S TURN`;
    }

    turnIndicator.classList.toggle("is-o", currentPlayer === "O");

    scoreCardX.classList.toggle(
        "active-score",
        gameActive && currentPlayer === "X"
    );

    scoreCardO.classList.toggle(
        "active-score",
        gameActive && currentPlayer === "O"
    );
}

function resetRound() {
    clearTimeout(aiTimer);

    board = Array(9).fill("");
    currentPlayer = "X";
    gameActive = true;

    cells.forEach((cell, index) => {
        cell.textContent = "";
        cell.disabled = false;

        cell.classList.remove("x", "o", "winner");
        cell.setAttribute("aria-label", getCellName(index));
    });

    resultMessage.hidden = true;

    updateTurnIndicator();
}

function startNewGame() {
    scores = { X: 0, O: 0, draws: 0 };

    updateScoreboard();
    resetRound();
}

function getCellName(index) {
    const names = [
        "Top left cell",
        "Top middle cell",
        "Top right cell",
        "Middle left cell",
        "Center cell",
        "Middle right cell",
        "Bottom left cell",
        "Bottom middle cell",
        "Bottom right cell"
    ];

    return names[index];
}

/* =========================================
   COMPUTER OPPONENT
   ========================================= */

function scheduleAIMove() {
    clearTimeout(aiTimer);

    updateTurnIndicator();

    // Short delay makes the computer feel like a real opponent.
    aiTimer = setTimeout(() => {
        if (!gameActive || gameMode !== "ai" || currentPlayer !== "O") {
            return;
        }

        const index = chooseAIMove();

        if (index === -1) return;

        makeMove(index, "O");

        if (!gameActive) return;

        switchPlayer();
    }, 450);
}

function chooseAIMove() {
    const difficulty = difficultySelect.value;

    if (difficulty === "easy") {
        return chooseRandomMove();
    }

    if (difficulty === "medium") {
        // Win if possible; otherwise block the human's immediate win.
        const winningMove = findImmediateMove("O");

        if (winningMove !== -1) return winningMove;

        const blockingMove = findImmediateMove("X");

        if (blockingMove !== -1) return blockingMove;

        return chooseStrategicMove();
    }

    // Impossible: use minimax to choose an optimal move.
    return chooseBestMove();
}

function chooseRandomMove() {
    const available = getAvailableMoves(board);

    if (available.length === 0) return -1;

    return available[Math.floor(Math.random() * available.length)];
}

function findImmediateMove(player) {
    for (const index of getAvailableMoves(board)) {
        board[index] = player;

        const wins = getWinner(board) === player;

        board[index] = "";

        if (wins) return index;
    }

    return -1;
}

function chooseStrategicMove() {
    // Prefer the center.
    if (board[4] === "") return 4;

    // Then prefer an available corner.
    const corners = [0, 2, 6, 8].filter((index) => board[index] === "");

    if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
    }

    return chooseRandomMove();
}

function chooseBestMove() {
    let bestScore = -Infinity;
    let bestMoves = [];

    for (const index of getAvailableMoves(board)) {
        board[index] = "O";

        const score = minimax(board, 0, false);

        board[index] = "";

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [index];
        } else if (score === bestScore) {
            bestMoves.push(index);
        }
    }

    if (bestMoves.length === 0) return -1;

    // Randomize equally good moves to avoid repetitive play.
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(position, depth, maximizing) {
    const winner = getWinner(position);

    if (winner === "O") return 10 - depth;
    if (winner === "X") return depth - 10;

    const available = getAvailableMoves(position);

    if (available.length === 0) return 0;

    if (maximizing) {
        let best = -Infinity;

        for (const index of available) {
            position[index] = "O";

            best = Math.max(
                best,
                minimax(position, depth + 1, false)
            );

            position[index] = "";
        }

        return best;
    }

    let best = Infinity;

    for (const index of available) {
        position[index] = "X";

        best = Math.min(
            best,
            minimax(position, depth + 1, true)
        );

        position[index] = "";
    }

    return best;
}

function getAvailableMoves(position) {
    const available = [];

    position.forEach((value, index) => {
        if (value === "") available.push(index);
    });

    return available;
}

function getWinner(position) {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
        if (
            position[a] !== "" &&
            position[a] === position[b] &&
            position[b] === position[c]
        ) {
            return position[a];
        }
    }

    return null;
}

/* =========================================
   NEXUS — PROCEDURAL SOUND ENGINE
   ========================================= */

function toggleSound() {
    soundEnabled = !soundEnabled;

    soundToggle.setAttribute(
        "aria-pressed",
        String(soundEnabled)
    );

    soundToggle.setAttribute(
        "aria-label",
        soundEnabled ? "Mute sound effects" : "Enable sound effects"
    );

    soundIcon.textContent = soundEnabled ? "♫" : "♪";
    soundLabel.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";

    if (soundEnabled) {
        playSound("move");
    }
}

function playSound(type) {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const now = audioContext.currentTime;

        const patterns = {
            move: [
                { frequency: 520, duration: 0.07, offset: 0 }
            ],

            win: [
                { frequency: 523, duration: 0.13, offset: 0 },
                { frequency: 659, duration: 0.13, offset: 0.14 },
                { frequency: 784, duration: 0.22, offset: 0.28 }
            ],

            draw: [
                { frequency: 390, duration: 0.14, offset: 0 },
                { frequency: 330, duration: 0.2, offset: 0.16 }
            ]
        };

        const notes = patterns[type] || patterns.move;

        notes.forEach((note) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(
                note.frequency,
                now + note.offset
            );

            gain.gain.setValueAtTime(0.0001, now + note.offset);

            gain.gain.exponentialRampToValueAtTime(
                0.08,
                now + note.offset + 0.015
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + note.offset + note.duration
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start(now + note.offset);
            oscillator.stop(now + note.offset + note.duration + 0.02);
        });
    } catch (error) {
        console.warn("Audio playback is unavailable:", error);
    }
}