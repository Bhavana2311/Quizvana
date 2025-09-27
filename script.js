// Game State
let gameState = {
    currentQuestion: 0,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 10,
    timeLeft: 15,
    timer: null,
    xp: parseInt(localStorage.getItem('quivana_xp')) || 0,
    streak: parseInt(localStorage.getItem('quivana_streak')) || 0,
    bestStreak: parseInt(localStorage.getItem('quivana_best_streak')) || 0,
    gamesPlayed: parseInt(localStorage.getItem('quivana_games_played')) || 0,
    badges: JSON.parse(localStorage.getItem('quivana_badges')) || [],
    questions: [],
    selectedCategory: 'mixed'
};

// Badge Definitions
const badges = [
    { id: 'first_quiz', name: 'First Steps', emoji: '🚀', condition: () => gameState.gamesPlayed >= 1 },
    { id: 'perfect_score', name: 'Perfectionist', emoji: '💎', condition: () => gameState.correctAnswers === gameState.totalQuestions },
    { id: 'speed_demon', name: 'Speed Demon', emoji: '⚡', condition: () => gameState.score >= 1500 },
    { id: 'streak_master', name: 'Streak Master', emoji: '🔥', condition: () => gameState.streak >= 5 },
    { id: 'xp_hunter', name: 'XP Hunter', emoji: '🎯', condition: () => gameState.xp >= 500 },
    { id: 'quiz_veteran', name: 'Quiz Veteran', emoji: '👑', condition: () => gameState.gamesPlayed >= 10 }
];

// Sound Effects
const sounds = {
    correct: () => playBeep(800, 200),
    wrong: () => playBeep(300, 400),
    complete: () => playBeep(600, 300)
};

function playBeep(frequency, duration) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Sample Questions (can be replaced with API data)
const sampleQuestions = [
    {
        question: "What is the capital of France?",
        answers: ["London", "Berlin", "Paris", "Madrid"],
        correct: 2
    },
    {
        question: "Which planet is known as the Red Planet?",
        answers: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct: 1
    },
    {
        question: "What is 2 + 2?",
        answers: ["3", "4", "5", "6"],
        correct: 1
    },
    {
        question: "Who painted the Mona Lisa?",
        answers: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
        correct: 2
    },
    {
        question: "What is the largest ocean on Earth?",
        answers: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correct: 3
    },
    {
        question: "Which gas do plants absorb from the atmosphere?",
        answers: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        correct: 1
    },
    {
        question: "What is the smallest prime number?",
        answers: ["0", "1", "2", "3"],
        correct: 2
    },
    {
        question: "Which continent is the largest?",
        answers: ["Africa", "Asia", "North America", "Europe"],
        correct: 1
    },
    {
        question: "What is the chemical symbol for gold?",
        answers: ["Go", "Gd", "Au", "Ag"],
        correct: 2
    },
    {
        question: "How many sides does a hexagon have?",
        answers: ["5", "6", "7", "8"],
        correct: 1
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    shuffleArray(sampleQuestions);
    gameState.questions = sampleQuestions.slice(0, gameState.totalQuestions);
});

// Utility Functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateStats() {
    document.getElementById('xp').textContent = gameState.xp;
    document.getElementById('streak').textContent = gameState.streak;
}

function saveStats() {
    localStorage.setItem('quivana_xp', gameState.xp);
    localStorage.setItem('quivana_streak', gameState.streak);
    localStorage.setItem('quivana_best_streak', gameState.bestStreak);
    localStorage.setItem('quivana_games_played', gameState.gamesPlayed);
    localStorage.setItem('quivana_badges', JSON.stringify(gameState.badges));
}

function checkBadges() {
    const newBadges = [];
    badges.forEach(badge => {
        if (!gameState.badges.includes(badge.id) && badge.condition()) {
            gameState.badges.push(badge.id);
            newBadges.push(badge);
        }
    });
    return newBadges;
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Game Functions
async function startQuiz() {
    gameState.selectedCategory = document.getElementById('category-select').value;
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.correctAnswers = 0;
    
    // Check if custom questions exist, otherwise load category questions
    if (gameState.questions.length === 0) {
        if (gameState.selectedCategory === 'mixed') {
            shuffleArray(sampleQuestions);
            gameState.questions = sampleQuestions.slice(0, gameState.totalQuestions);
        } else {
            gameState.questions = await fetchTriviaQuestions(gameState.selectedCategory);
        }
    }
    
    showScreen('quiz');
    loadQuestion();
}

function loadQuestion() {
    if (gameState.currentQuestion >= gameState.totalQuestions) {
        endQuiz();
        return;
    }

    const question = gameState.questions[gameState.currentQuestion];
    
    // Update progress
    const progress = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 157;
    document.getElementById('progress-circle').style.strokeDashoffset = 157 - progress;
    document.getElementById('question-num').textContent = `${gameState.currentQuestion + 1}/${gameState.totalQuestions}`;
    
    // Load question
    document.getElementById('question-text').textContent = question.question;
    
    // Load answers
    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'answer';
        answerDiv.textContent = answer;
        answerDiv.onclick = () => selectAnswer(index);
        answersContainer.appendChild(answerDiv);
    });
    
    // Start timer
    startTimer();
}

function startTimer() {
    gameState.timeLeft = 15;
    updateTimer();
    
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            selectAnswer(-1); // Time's up
        }
    }, 1000);
}

function updateTimer() {
    const percentage = (gameState.timeLeft / 15) * 100;
    document.getElementById('timer-fill').style.width = percentage + '%';
}

function selectAnswer(selectedIndex) {
    clearInterval(gameState.timer);
    
    const question = gameState.questions[gameState.currentQuestion];
    const answers = document.querySelectorAll('.answer');
    
    // Show correct/wrong answers
    answers.forEach((answer, index) => {
        if (index === question.correct) {
            answer.classList.add('correct');
        } else if (index === selectedIndex && selectedIndex !== question.correct) {
            answer.classList.add('wrong');
        }
        answer.onclick = null; // Disable clicking
    });
    
    // Calculate score
    if (selectedIndex === question.correct) {
        gameState.correctAnswers++;
        const timeBonus = Math.floor(gameState.timeLeft * 2);
        gameState.score += 100 + timeBonus;
        gameState.streak++;
        sounds.correct();
        
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
    } else {
        gameState.streak = 0;
        sounds.wrong();
    }
    
    // Next question after delay
    setTimeout(() => {
        gameState.currentQuestion++;
        loadQuestion();
    }, 1500);
}

function endQuiz() {
    gameState.gamesPlayed++;
    
    // Calculate XP gained
    const baseXP = gameState.correctAnswers * 10;
    const streakBonus = gameState.streak * 5;
    const xpGained = baseXP + streakBonus;
    
    gameState.xp += xpGained;
    
    // Check for new badges
    const newBadges = checkBadges();
    
    // Update results screen
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('xp-gained').textContent = `+${xpGained}`;
    document.getElementById('accuracy').textContent = `${Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100)}%`;
    
    // Show badge notification if earned
    if (newBadges.length > 0) {
        const badge = newBadges[0];
        document.getElementById('badge-icon').textContent = badge.emoji;
        document.getElementById('badge-name').textContent = badge.name;
        document.getElementById('new-badge').style.display = 'block';
    } else {
        document.getElementById('new-badge').style.display = 'none';
    }
    
    sounds.complete();
    
    // Save stats
    saveStats();
    updateStats();
    
    showScreen('results');
}

function backToMenu() {
    // Reset questions for next quiz
    gameState.questions = [];
    gameState.totalQuestions = 10;
    showScreen('menu');
}

function showStats() {
    // Update stats display
    document.getElementById('total-xp').textContent = gameState.xp;
    document.getElementById('games-played').textContent = gameState.gamesPlayed;
    document.getElementById('best-streak').textContent = gameState.bestStreak;
    
    // Update badges display
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = '';
    
    badges.forEach(badge => {
        const badgeDiv = document.createElement('div');
        badgeDiv.className = `badge-item ${gameState.badges.includes(badge.id) ? '' : 'locked'}`;
        badgeDiv.innerHTML = `
            <span class="badge-emoji">${badge.emoji}</span>
            <span class="badge-title">${badge.name}</span>
        `;
        badgesGrid.appendChild(badgeDiv);
    });
    
    document.getElementById('stats-modal').style.display = 'block';
}

function closeStats() {
    document.getElementById('stats-modal').style.display = 'none';
}

function showSettings() {
    alert('Settings coming soon! 🚀');
}

// Tab Switching
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// Generate from File Upload
function generateFromFile() {
    const fileInput = document.getElementById('file-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const customQuestions = generateQuestionsFromText(text);
        
        if (customQuestions.length > 0) {
            gameState.questions = customQuestions;
            gameState.totalQuestions = customQuestions.length;
            alert(`Generated ${customQuestions.length} questions from your document! Click 'Start Quiz' to play.`);
        } else {
            alert('Could not generate questions from this document. Please try a different file.');
        }
    };
    
    reader.readAsText(file);
}

// Generate from Summary Text
function generateFromSummary() {
    const summaryText = document.getElementById('summary-input').value.trim();
    
    if (!summaryText) {
        alert('Please enter some text in the summary field!');
        return;
    }
    
    if (summaryText.length < 100) {
        alert('Please enter a longer summary (at least 100 characters) for better question generation.');
        return;
    }
    
    const customQuestions = generateQuestionsFromText(summaryText);
    
    if (customQuestions.length > 0) {
        gameState.questions = customQuestions;
        gameState.totalQuestions = customQuestions.length;
        alert(`Generated ${customQuestions.length} questions from your summary! Click 'Start Quiz' to play.`);
        document.getElementById('summary-input').value = ''; // Clear the textarea
    } else {
        alert('Could not generate questions from this summary. Please try adding more detailed content.');
    }
}

function generateQuestionsFromText(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questions = [];
    
    // Generate different types of questions
    const validSentences = sentences.filter(s => s.trim().split(' ').length > 5);
    const numQuestions = Math.min(10, validSentences.length);
    
    for (let i = 0; i < numQuestions; i++) {
        const sentence = validSentences[i].trim();
        const words = sentence.split(' ');
        
        if (Math.random() < 0.7) {
            // Fill in the blank questions (70%)
            const keyWordIndex = Math.floor(words.length / 3) + Math.floor(Math.random() * (words.length / 3));
            const keyWord = words[keyWordIndex];
            
            if (keyWord && keyWord.length > 2) {
                const questionText = sentence.replace(new RegExp(keyWord, 'gi'), '______');
                const wrongAnswers = generateWrongAnswers(keyWord);
                const allAnswers = [keyWord, ...wrongAnswers];
                shuffleArray(allAnswers);
                
                questions.push({
                    question: `Fill in the blank: ${questionText}`,
                    answers: allAnswers,
                    correct: allAnswers.indexOf(keyWord)
                });
            }
        } else {
            // True/False questions (30%)
            questions.push({
                question: `True or False: ${sentence}`,
                answers: ['True', 'False'],
                correct: 0 // Assume original statement is true
            });
        }
    }
    
    return questions.length > 0 ? questions : generateFallbackQuestions(text);
}

function generateFallbackQuestions(text) {
    const words = text.split(' ').filter(w => w.length > 3);
    const questions = [];
    
    for (let i = 0; i < Math.min(5, words.length); i++) {
        const word = words[i * 10] || words[i];
        questions.push({
            question: `Which word appears in the given text?`,
            answers: [word, 'random1', 'random2', 'random3'],
            correct: 0
        });
    }
    
    return questions;
}

function modifyForFalse(sentence) {
    const words = sentence.split(' ');
    const randomIndex = Math.floor(Math.random() * words.length);
    const originalWord = words[randomIndex];
    
    // Simple word replacement to make statement false
    const replacements = {
        'is': 'was',
        'was': 'is',
        'can': 'cannot',
        'will': 'would',
        'always': 'never',
        'never': 'always',
        'increase': 'decrease',
        'decrease': 'increase'
    };
    
    words[randomIndex] = replacements[originalWord.toLowerCase()] || 'NOT_' + originalWord;
    return words.join(' ');
}

function generateWrongAnswers(correctAnswer) {
    const commonWords = ['information', 'process', 'system', 'method', 'result', 'example', 'important', 'different', 'possible', 'necessary'];
    const wrongAnswers = [];
    
    // Add similar length words
    for (let i = 0; i < commonWords.length && wrongAnswers.length < 3; i++) {
        const word = commonWords[i];
        if (word !== correctAnswer.toLowerCase() && !wrongAnswers.includes(word)) {
            wrongAnswers.push(word);
        }
    }
    
    // Fill remaining with variations
    while (wrongAnswers.length < 3) {
        const variations = ['data', 'content', 'element', 'factor', 'aspect', 'feature'];
        const randomVar = variations[Math.floor(Math.random() * variations.length)];
        if (!wrongAnswers.includes(randomVar) && randomVar !== correctAnswer.toLowerCase()) {
            wrongAnswers.push(randomVar);
        } else {
            wrongAnswers.push(`option${wrongAnswers.length + 1}`);
        }
    }
    
    return wrongAnswers.slice(0, 3);
}

// Fetch questions from Open Trivia DB
async function fetchTriviaQuestions(category = '9') {
    try {
        const response = await fetch(`https://opentdb.com/api.php?amount=10&category=${category}&type=multiple`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results.map(item => {
                const allAnswers = [...item.incorrect_answers, item.correct_answer];
                shuffleArray(allAnswers);
                return {
                    question: decodeHTML(item.question),
                    answers: allAnswers.map(answer => decodeHTML(answer)),
                    correct: allAnswers.indexOf(item.correct_answer)
                };
            });
        }
    } catch (error) {
        console.log('API failed, using sample questions');
    }
    
    // Fallback to sample questions
    shuffleArray(sampleQuestions);
    return sampleQuestions.slice(0, gameState.totalQuestions);
}

function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('stats-modal');
    if (event.target === modal) {
        closeStats();
    }
}