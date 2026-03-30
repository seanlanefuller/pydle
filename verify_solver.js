
const WORDS = ["APPLE", "PLANE", "RAISE", "RIDER", "STARE"]; // Small subset for testing logic correctness
const WORD_LENGTH = 5;

function getFeedback(guessString, solution) {
    let guessArray = Array.from(guessString);
    let secretArray = Array.from(solution);
    let resultColors = new Array(5).fill("wrong");

    // First pass: Correct position (Green)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArray[i] === secretArray[i]) {
            resultColors[i] = "correct";
            secretArray[i] = null; // Mark as used
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

function solve(secretWord, pastGuesses) {
    console.log(`Secret: ${secretWord}, Past: ${pastGuesses}`);

    // Filter WORDS
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

    return candidates;
}

// Test Case 1: Secret APPLE, Guess RAISE
// Expected: APPLE and PLANE should be valid. RAISE should be invalid (self-consistent but it's the bad guess itself? No, RAISE would produce same feedback against itself? 
// Wait. getFeedback("RAISE", "RAISE") -> all green.
// actualFeedback("RAISE", "APPLE") -> [w, y, w, w, g]
// So RAISE is NOT a candidate because it assumes itself is the answer? No.
// hypotheticalFeedback("RAISE", "RAISE") is all green.
// actualFeedback is NOT all green.
// So RAISE is filtered out correctly.

let result1 = solve("APPLE", ["RAISE"]);
console.log("Candidates check 1:", result1.includes("APPLE") ? "PASS" : "FAIL");
console.log("Candidates check 2:", result1.includes("PLANE") ? "PASS" : "FAIL");
console.log("Candidates check 3:", !result1.includes("RAISE") ? "PASS" : "FAIL");
console.log("Found:", result1);

