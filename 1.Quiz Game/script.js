// 🧠 Grab all important DOM elements by their ID
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startButton = document.getElementById("start-btn");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");
const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-btn");
const progressBar = document.getElementById("progress");

// 🧩 Java basic questions – intermediate level
const quizQuestions = [
    {
        question: "Which keyword is used to inherit a class in Java?",
        answers: [
            { text: "implement", correct: false },
            { text: "extends", correct: true },
            { text: "inherits", correct: false },
            { text: "super", correct: false }
        ]
    },
    {
        question: "What is the size of an int variable in Java?",
        answers: [
            { text: "4 bytes", correct: true },
            { text: "2 bytes", correct: false },
            { text: "8 bytes", correct: false },
            { text: "Depends on OS", correct: false }
        ]
    },
    {
        question: "Which of these is NOT a valid Java primitive type?",
        answers: [
            { text: "boolean", correct: false },
            { text: "string", correct: true },
            { text: "double", correct: false },
            { text: "char", correct: false }
        ]
    },
    {
        question: "What will `10 / 3` return in Java (int division)?",
        answers: [
            { text: "3.333", correct: false },
            { text: "3", correct: true },
            { text: "3.0", correct: false },
            { text: "Error", correct: false }
        ]
    },
    {
        question: "Which method is the entry point for any Java program?",
        answers: [
            { text: "start()", correct: false },
            { text: "run()", correct: false },
            { text: "init()", correct: false },
            { text: "main()", correct: true }
        ]
    }
];

// 📊 Game state variables
let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;

// 📌 Set total questions on screen once at the start
totalQuestionsSpan.textContent = quizQuestions.length;
maxScoreSpan.textContent = quizQuestions.length;

// 🟠 Start and restart button event listeners
startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);

// 🟢 Start the quiz (reset everything)
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    scoreSpan.textContent = 0;

    startScreen.classList.remove("active");
    quizScreen.classList.add("active");

    showQuestion();
}

// 🧾 Show a question and load its answer options
function showQuestion() {
    answersDisabled = false;

    const currentQuestion = quizQuestions[currentQuestionIndex];

    // Update current question number
    currentQuestionSpan.textContent = currentQuestionIndex + 1;

    // Update progress bar
    const progressPercent = (currentQuestionIndex / quizQuestions.length) * 100;
    progressBar.style.width = progressPercent + "%";

    // Show question text
    questionText.textContent = currentQuestion.question;

    // Clear old answers
    answersContainer.innerHTML = "";

    // Create buttons for each answer option
    currentQuestion.answers.forEach((answer) => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.classList.add("answer-btn");
        button.dataset.correct = answer.correct;
        button.addEventListener("click", selectAnswer);
        answersContainer.appendChild(button);
    });
}

// 🖱️ Handle when a user clicks an answer
function selectAnswer(event) {
    if (answersDisabled) return;
    answersDisabled = true;

    const selectedButton = event.target;
    const isCorrect = selectedButton.dataset.correct === "true";

    // Show correct and incorrect styles
    Array.from(answersContainer.children).forEach((button) => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        } else if (button === selectedButton) {
            button.classList.add("incorrect");
        }
    });

    // Update score if correct
    if (isCorrect) {
        score++;
        scoreSpan.textContent = score;
    }

    // Wait 1 second, then move to next question or results
    setTimeout(() => {
        currentQuestionIndex++;

        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1000);
}

// 🏁 Show final score + message
function showResults() {
    quizScreen.classList.remove("active");
    resultScreen.classList.add("active");

    finalScoreSpan.textContent = score;

    const percentage = (score / quizQuestions.length) * 100;

    if (percentage === 100) {
        resultMessage.textContent = "Perfect! You're a genius!";
    } else if (percentage >= 80) {
        resultMessage.textContent = "Great job! You know your stuff!";
    } else if (percentage >= 60) {
        resultMessage.textContent = "Good effort! Keep learning!";
    } else if (percentage >= 40) {
        resultMessage.textContent = "Not bad! Try again to improve!";
    } else {
        resultMessage.textContent = "Keep studying! You'll get better!";
    }
}

// 🔁 Restart the quiz and go back to question 1
function restartQuiz() {
    resultScreen.classList.remove("active");
    startQuiz();
}
