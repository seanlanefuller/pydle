document.addEventListener("DOMContentLoaded", () => {
    const NUMBER_OF_GUESSES = 6;
    const WORD_LENGTH = 5;
    let currentGuessIndex = 0;
    let nextLetterPosition = 0;
    let guesses = [[]];
    let secretWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    let gameOver = false;
    let isAnimating = false;

    console.log("Secret Word: " + secretWord);

    const board = document.getElementById("board");
    const messageContainer = document.getElementById("message-container");
    const gameOverScreen = document.getElementById("game-over-screen");
    const gameOverMessage = document.getElementById("game-over-message");
    const restartButton = document.getElementById("restart-button");

    // --- Sound Engine ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function ensureAudio() {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type = "sine", duration = 0.1, vol = 0.1) {
        ensureAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // (Rest of sound functions...)

    function playSoundAndVibrate(type) {
        // Haptic feedback if available
        if (navigator.vibrate) {
            if (type === 'error') navigator.vibrate(200);
            else navigator.vibrate(10);
        }

        switch (type) {
            case 'type':
                playTone(600 + Math.random() * 200, "sine", 0.05, 0.05);
                break;
            case 'backspace':
                playTone(300, "square", 0.05, 0.05);
                break;
            case 'enter':
                playTone(500, "triangle", 0.1, 0.1);
                break;
            case 'error':
                playTone(150, "sawtooth", 0.3, 0.2);
                playTone(100, "sawtooth", 0.3, 0.2);
                break;
            case 'flip':
                playTone(400, "sine", 0.1, 0.05);
                break;
            case 'win':
                // Arpeggio
                setTimeout(() => playTone(523.25, "sine", 0.2, 0.2), 0);
                setTimeout(() => playTone(659.25, "sine", 0.2, 0.2), 100);
                setTimeout(() => playTone(783.99, "sine", 0.4, 0.2), 200);
                setTimeout(() => playTone(1046.50, "sine", 0.6, 0.1), 300);
                break;
        }
    }


    // --- Initialization ---
    restartButton.addEventListener("click", restartGame);

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        for (let j = 0; j < WORD_LENGTH; j++) {
            let tile = document.createElement("div");
            tile.classList.add("tile");
            tile.setAttribute("id", `tile-${i}-${j}`);
            board.appendChild(tile);
        }
    }

    // --- Input Handling ---
    document.addEventListener("keydown", (e) => {
        if (isAnimating) return;
        showMessage("");
        ensureAudio();

        if (gameOver) {
            if (e.key === "Enter") restartGame();
            return;
        }

        let key = e.key;
        if (key === "Backspace") {
            handleDelete();
            return;
        }
        if (key === "Enter") {
            handleEnter();
            return;
        }
        if (key.length === 1 && key.match(/[a-z]/i)) {
            handleInput(key.toUpperCase());
        }
    });

    const keys = document.querySelectorAll(".keyboard-row button");
    for (const key of keys) {
        key.addEventListener("click", (e) => {
            if (isAnimating) return;
            ensureAudio();
            if (gameOver) {
                // On screen keyboard Enter also restarts if game over
                if (e.currentTarget.getAttribute("data-key") === "ENTER") restartGame();
                return;
            }
            const dataKey = e.currentTarget.getAttribute("data-key");
            if (dataKey === "ENTER") handleEnter();
            else if (dataKey === "Backspace") handleDelete();
            else handleInput(dataKey);

            e.currentTarget.blur();
        });
    }

    function handleInput(letter) {
        if (nextLetterPosition < WORD_LENGTH) {
            playSoundAndVibrate('type');
            let currentReview = guesses[currentGuessIndex];
            currentReview.push(letter);

            let tile = document.getElementById(`tile-${currentGuessIndex}-${nextLetterPosition}`);
            tile.textContent = letter;
            tile.setAttribute("data-state", "active");
            tile.classList.add("active"); // Trigger pop animation via CSS if needed, though data-state handles border

            // Remove pop animation class after it plays to allow re-triggering?
            // Actually CSS 'animation' property triggers on class addition usually.

            nextLetterPosition++;
        }
    }

    function handleDelete() {
        if (nextLetterPosition > 0) {
            playSoundAndVibrate('backspace');
            let currentReview = guesses[currentGuessIndex];
            currentReview.pop();
            nextLetterPosition--;

            let tile = document.getElementById(`tile-${currentGuessIndex}-${nextLetterPosition}`);
            tile.textContent = "";
            tile.setAttribute("data-state", "empty");
            tile.classList.remove("active");
        }
    }

    function handleEnter() {
        let currentReview = guesses[currentGuessIndex];
        if (currentReview.length !== WORD_LENGTH) {
            triggerShake();
            showMessage("Not enough letters");
            return;
        }

        let guessString = currentReview.join("");
        if (!WORDS.includes(guessString)) {
            triggerShake();
            showMessage("Not in word list");
            return;
        }

        playSoundAndVibrate('enter');
        checkGuess(guessString);
    }

    function triggerShake() {
        playSoundAndVibrate('error');
        const rowStart = currentGuessIndex;
        for (let i = 0; i < WORD_LENGTH; i++) {
            let tile = document.getElementById(`tile-${rowStart}-${i}`);
            tile.classList.remove("shake");
            void tile.offsetWidth; // trigger reflow
            tile.classList.add("shake");
        }
    }

    function showGameOver(won, word) {
        gameOver = true;
        if (won) {
            gameOverMessage.textContent = "Splendid!";
            gameOverMessage.style.color = "#00e676"; // Green hint
        } else {
            gameOverMessage.textContent = `The word was ${word}`;
            gameOverMessage.style.color = "white";
        }
        setTimeout(() => {
            gameOverScreen.classList.remove("hidden");
        }, 1000); // 1s delay
    }

    function checkGuess(guessString) {
        isAnimating = true;
        let row = currentGuessIndex;
        let resultColors = getFeedback(guessString, secretWord);
        let guessArray = Array.from(guessString);

        // Animate Flip
        guessArray.forEach((letter, i) => {
            setTimeout(() => {
                playSoundAndVibrate('flip');
                let tile = document.getElementById(`tile-${row}-${i}`);
                tile.classList.add("flip");

                // Change color halfway through flip
                setTimeout(() => {
                    tile.setAttribute("data-state", resultColors[i]);
                    updateKeyboardColor(letter, resultColors[i]);
                }, 300); // 300ms matches 50% of 0.6s animation (css)

            }, i * 300); // Stagger the flips
        });

        // After all animations
        setTimeout(() => {
            isAnimating = false;

            // Check Win/Loss
            if (guessString === secretWord) {
                playSoundAndVibrate('win');
                showMessage("Splendid!");

                // Dance Animation
                for (let i = 0; i < WORD_LENGTH; i++) {
                    let tile = document.getElementById(`tile-${row}-${i}`);
                    setTimeout(() => {
                        tile.classList.add("dance");
                    }, i * 100);
                }
                showGameOver(true, secretWord);

            } else {
                if (currentGuessIndex === NUMBER_OF_GUESSES - 1) {
                    showMessage(`Game Over. Word was ${secretWord}`);
                    playSoundAndVibrate('error');
                    showGameOver(false, secretWord);
                } else {
                    currentGuessIndex++;
                    guesses.push([]);
                    nextLetterPosition = 0;
                }
            }
        }, (WORD_LENGTH * 300) + 600); // 5 * 300 + buffer
    }

    function getFeedback(guessString, solution) {
        let guessArray = Array.from(guessString);
        let secretArray = Array.from(solution);
        let resultColors = new Array(5).fill("wrong");

        // First pass: Correct position (Green)
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessArray[i] === secretArray[i]) {
                resultColors[i] = "correct";
                secretArray[i] = null;
            }
        }

        // Second pass: Wrong position (Yellow)
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (resultColors[i] === "wrong") {
                let indexInSecret = secretArray.indexOf(guessArray[i]);
                if (indexInSecret !== -1) {
                    resultColors[i] = "wrong-location";
                    secretArray[indexInSecret] = null;
                }
            }
        }
        return resultColors;
    }

    function updateKeyboardColor(letter, color) {
        let button = document.querySelector(`button[data-key="${letter}"]`);
        if (!button) return;

        // Removing inline styles from previous version
        if (button.style.backgroundColor) {
            button.style.backgroundColor = '';
            button.style.borderColor = '';
        }

        // Logic to not downgrade color (Correct > WrongLocation > Wrong)
        // Check current class
        let currentClass = "";
        if (button.classList.contains("correct")) currentClass = "correct";
        else if (button.classList.contains("wrong-location")) currentClass = "wrong-location";
        else if (button.classList.contains("wrong")) currentClass = "wrong";

        if (currentClass === "correct") return;

        if (color === "correct") {
            button.classList.remove("wrong-location", "wrong");
            button.classList.add("correct");
        } else if (color === "wrong-location") {
            if (currentClass !== "correct") {
                button.classList.remove("wrong");
                button.classList.add("wrong-location");
            }
        } else if (color === "wrong") {
            if (currentClass !== "correct" && currentClass !== "wrong-location") {
                button.classList.add("wrong");
            }
        }
    }

    function showMessage(msg) {
        messageContainer.textContent = msg;
    }

    function restartGame() {
        window.location.reload();
    }

    document.getElementById("suggest-button").addEventListener("click", suggestGuess);

    function suggestGuess() {
        if (gameOver || isAnimating) return;

        let pastGuesses = [];
        for (let i = 0; i < currentGuessIndex; i++) {
            pastGuesses.push(guesses[i].join(""));
        }

        let candidates = WORDS.filter(candidate => {
            for (let pastGuess of pastGuesses) {
                let actualFeedback = getFeedback(pastGuess, secretWord);
                let hypotheticalFeedback = getFeedback(pastGuess, candidate);
                for (let k = 0; k < 5; k++) {
                    if (actualFeedback[k] !== hypotheticalFeedback[k]) return false;
                }
            }
            return true;
        });

        if (candidates.length > 0) {
            let suggestion = candidates[Math.floor(Math.random() * candidates.length)];
            showMessage(`Try this: ${suggestion}`);
        } else {
            showMessage("No words found!");
        }
        document.getElementById("suggest-button").blur();
    }
});
