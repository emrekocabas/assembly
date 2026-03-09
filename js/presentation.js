// ============ CONFIGURATION ============
const TOTAL_SLIDES = 7;
const PEER_PREFIX = 'science-show-';
const GRID_SIZE = 5;

// ============ STATE ============
let currentSlide = 0;
let peer = null;
let remoteConn = null;
let roomCode = '';
let robotX = 0;
let robotY = 1;
const targetX = 4;
const targetY = 2;
let revealCounters = {};

// ============ SLIDE NAMES ============
const slideNames = [
    '🎬 Title',
    '👋 Who Am I?',
    '🖥️ Computers Everywhere',
    '💻 What Is Coding?',
    '🤖 Robot Game',
    '👩‍💻 Ada Lovelace',
    '🎉 Everyone Can Code!'
];

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    generateRobotGrid();
    initFirebase();
    setupKeyboard();
    updateSlideCounter();

    // Set remote URL display
    const urlEl = document.getElementById('remote-url');
    if (urlEl) {
        const baseUrl = window.location.href.replace(/\/?(index\.html)?$/, '');
        urlEl.textContent = baseUrl + '/manage/';
    }
});

// ============ FIREBASE CONNECTION ============
let lastCommandTimestamp = Date.now();

function initFirebase() {
    // Read initial state or set it if none exists
    db.ref('presentation/state').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data && data.currentSlide !== undefined) {
            // Force current slide within bounds if total slides shrunk
            currentSlide = Math.min(data.currentSlide, TOTAL_SLIDES - 1);
            goToSlide(currentSlide, true);
        }
        // Always overwite Firebase with current app's configuration
        sendState();
    });

    // Listen for state changes to stay in sync with other tabs
    db.ref('presentation/state').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.currentSlide !== undefined && data.currentSlide !== currentSlide) {
            goToSlide(data.currentSlide, true);
        }
    });

    // Listen for commands from the remote control
    db.ref('presentation/command').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.timestamp && data.timestamp > lastCommandTimestamp) {
            lastCommandTimestamp = data.timestamp;
            handleRemoteData(data);
        }
    });

    // Listen to remote connection presence
    db.ref('presentation/remoteConnected').on('value', (snapshot) => {
        const isConnected = snapshot.val();
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            if (isConnected) indicator.classList.add('connected');
            else indicator.classList.remove('connected');
        }
    });
}

function handleRemoteData(data) {
    console.log("Received remote command:", data.type);
    switch (data.type) {
        case 'next': nextSlide(); break;
        case 'prev': prevSlide(); break;
        case 'goto': goToSlide(data.slide); break;
        case 'reveal': revealNext(); break;
        case 'robot': moveRobot(data.direction); break;
        case 'confetti': triggerConfetti(); break;
        case 'reset-robot': resetRobot(); break;
        case 'reset-all': resetAll(); break;
    }
}

function sendState() {
    db.ref('presentation/state').set({
        currentSlide,
        totalSlides: TOTAL_SLIDES,
        slideNames,
        robotX,
        robotY,
        revealCounters: revealCounters || {}
    });
}

// ============ SLIDE NAVIGATION ============
function goToSlide(n, fromSync = false) {
    if (n < 0 || n >= TOTAL_SLIDES || n === currentSlide) return;

    const slides = document.querySelectorAll('.slide');
    if (slides[currentSlide]) {
        slides[currentSlide].classList.remove('active');
    }
    currentSlide = n;
    if (slides[currentSlide]) {
        slides[currentSlide].classList.add('active');
        // Reset entrance animations
        resetAnimations(slides[currentSlide]);
    }

    updateSlideCounter();

    // Auto-confetti on final slide
    if (n === TOTAL_SLIDES - 1) {
        setTimeout(triggerConfetti, 600);
    }

    if (!fromSync) {
        sendState();
    }
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

// Advance presentation smartly through interactive reveals
function advancePresentation() {
    const slide = document.querySelectorAll('.slide')[currentSlide];
    const items = slide.querySelectorAll('.reveal-item');

    // If we have items and haven't revealed all of them
    if (items.length > 0) {
        if (!revealCounters[currentSlide]) revealCounters[currentSlide] = 0;

        if (revealCounters[currentSlide] < items.length) {
            revealNext();
            return;
        }
    }

    // Default fallback line to go to next slide if no reveals
    nextSlide();
}

function resetAnimations(slide) {
    const items = slide.querySelectorAll('.animate-in');
    items.forEach(el => {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
    });
}

function updateSlideCounter() {
    const el = document.getElementById('slide-counter');
    if (el) el.textContent = `${currentSlide + 1} / ${TOTAL_SLIDES}`;
}

// ============ REVEAL LOGIC ============
function revealNext() {
    const slide = document.querySelectorAll('.slide')[currentSlide];
    const items = slide.querySelectorAll('.reveal-item');
    if (!items.length) return;

    if (!revealCounters[currentSlide]) revealCounters[currentSlide] = 0;

    const idx = revealCounters[currentSlide];
    if (idx < items.length) {
        items[idx].classList.add('visible');
        revealCounters[currentSlide]++;
    }
    sendState();
}

// ============ ROBOT GAME ============
function generateRobotGrid() {
    const grid = document.getElementById('robot-grid');
    if (!grid) return;

    grid.innerHTML = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (x === targetX && y === targetY) {
                cell.textContent = '⭐';
                cell.classList.add('target');
            }

            grid.appendChild(cell);
        }
    }
    updateRobotPosition();
}

function moveRobot(direction) {
    const prev = { x: robotX, y: robotY };

    switch (direction) {
        case 'up':
            robotY = Math.max(0, robotY - 1);
            break;
        case 'down':
            robotY = Math.min(GRID_SIZE - 1, robotY + 1);
            break;
        case 'left':
            if (robotX === 0) {
                prevSlide();
                return;
            }
            robotX = Math.max(0, robotX - 1);
            break;
        case 'right':
            if (robotX === GRID_SIZE - 1) {
                nextSlide();
                return;
            }
            robotX = Math.min(GRID_SIZE - 1, robotX + 1);
            break;
    }

    updateRobotPosition();

    if (robotX === targetX && robotY === targetY) {
        celebrateRobot();
    }

    sendState();
}

function updateRobotPosition() {
    document.querySelectorAll('.grid-cell .robot').forEach(r => r.remove());

    const cells = document.querySelectorAll('.grid-cell');
    const idx = robotY * GRID_SIZE + robotX;
    if (cells[idx]) {
        const robot = document.createElement('span');
        robot.className = 'robot';
        robot.textContent = '🤖';
        robot.style.fontSize = 'inherit';
        cells[idx].appendChild(robot);
    }
}

function resetRobot() {
    robotX = 0;
    robotY = 1;
    const grid = document.getElementById('robot-grid');
    if (grid) grid.classList.remove('celebrating');
    generateRobotGrid();
    sendState();
}

function celebrateRobot() {
    const grid = document.getElementById('robot-grid');
    if (grid) grid.classList.add('celebrating');

    const cells = document.querySelectorAll('.grid-cell');
    const idx = targetY * GRID_SIZE + targetX;
    if (cells[idx]) {
        cells[idx].innerHTML = '<span class="robot" style="font-size:inherit">🤖</span>🎉';
    }

    // Auto advance after 2 seconds
    setTimeout(() => {
        nextSlide();
    }, 2000);
}

function resetAll() {
    // Reveal state reset
    revealCounters = {};
    document.querySelectorAll('.reveal-item').forEach(el => {
        el.classList.remove('visible');
    });

    // Robot game reset
    robotX = 0;
    robotY = 1;
    const grid = document.getElementById('robot-grid');
    if (grid) grid.classList.remove('celebrating');
    generateRobotGrid();

    // Go to first slide, which will sendState over firebase
    goToSlide(0);
}

// ============ CONFETTI ============
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    container.innerHTML = '';
    const colors = ['#ff0000', '#00ff00', '#0055ff', '#ffff00',
        '#ff00ff', '#00ffff', '#ff8800', '#88ff00'];

    for (let i = 0; i < 80; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 2 + 's';
        piece.style.animationDuration = (2 + Math.random() * 3) + 's';
        piece.style.width = (6 + Math.random() * 10) + 'px';
        piece.style.height = (6 + Math.random() * 10) + 'px';
        container.appendChild(piece);
    }

    // Clean up after animation
    setTimeout(() => { container.innerHTML = ''; }, 6000);
}

// ============ KEYBOARD FALLBACK ============
function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (currentSlide === 4) moveRobot('up');
                else revealNext();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (currentSlide === 4) moveRobot('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (currentSlide === 4) moveRobot('left');
                else prevSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentSlide === 4) moveRobot('right');
                else advancePresentation();
                break;
            case ' ':
                e.preventDefault();
                if (currentSlide !== 4) advancePresentation();
                break;
            case 'r':
            case 'R':
                if (currentSlide !== 4) revealNext();
                break;
            case 'c':
            case 'C':
                triggerConfetti();
                break;
        }
    });
}


