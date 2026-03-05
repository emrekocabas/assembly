// ============ STATE ============
const PEER_PREFIX = 'science-show-';
let peer = null;
let conn = null;
let currentSlide = 0;
let totalSlides = 8;
let slideNames = [
    '🎬 Title', '👋 Who Am I?', '🖥️ Computers',
    '💻 Coding', '🤖 Robot Game', '🧠 AI',
    '👩‍💻 Ada Lovelace', '🎉 Finale'
];

// ============ CONNECTION ============
function connect() {
    showStatus('Connecting to Firebase...', '');

    try {
        // Listen to state changes from presentation
        db.ref('presentation/state').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                currentSlide = data.currentSlide || 0;
                totalSlides = data.totalSlides || 8;
                if (data.slideNames) slideNames = data.slideNames;
                updateUI();

                // If it's the first time receiving state, show UI
                if (document.getElementById('control-screen').classList.contains('hidden')) {
                    showStatus('Connected! ✅', 'success');

                    // Mark remote as connected
                    const presenceRef = db.ref('presentation/remoteConnected');
                    presenceRef.set(true);
                    presenceRef.onDisconnect().set(false);

                    setTimeout(() => {
                        document.getElementById('connect-screen').classList.add('hidden');
                        document.getElementById('control-screen').classList.remove('hidden');
                    }, 500);
                    vibrate();
                }
            }
        });

        // Timeout if no state received
        setTimeout(() => {
            if (document.getElementById('control-screen').classList.contains('hidden')) {
                showStatus('Make sure the presentation is open on the computer.', 'error');
            }
        }, 5000);

    } catch (e) {
        showStatus('Failed to connect. Check internet.', 'error');
        console.error("Firebase error:", e);
    }
}

// Auto-connect on load
document.addEventListener('DOMContentLoaded', () => {
    connect();
});

// ============ SEND COMMANDS ============
function send(data) {
    data.timestamp = Date.now();
    db.ref('presentation/command').set(data);
    vibrate();
}

function nextSlide() { send({ type: 'goto', slide: Math.min(currentSlide + 1, totalSlides - 1) }); }
function prevSlide() { send({ type: 'goto', slide: Math.max(currentSlide - 1, 0) }); }
function reveal() { send({ type: 'reveal' }); }
function revealAI() { send({ type: 'revealAI' }); }
function showAIAnswer() { send({ type: 'showAIAnswer' }); }
function robotMove(dir) { send({ type: 'robot', direction: dir }); }
function confetti() { send({ type: 'confetti' }); }
function resetRobot() { send({ type: 'reset-robot' }); }

// ============ UI UPDATES ============
function updateUI() {
    // Slide counter
    document.getElementById('slide-counter').textContent =
        `${currentSlide + 1} / ${totalSlides}`;

    // Slide name
    document.getElementById('slide-name').textContent =
        slideNames[currentSlide] || '';

    // Prev/next buttons
    document.getElementById('btn-prev').disabled = currentSlide === 0;
    document.getElementById('btn-next').disabled = currentSlide === totalSlides - 1;

    // Hide all panels
    document.querySelectorAll('.action-panel').forEach(p => p.classList.add('hidden'));

    // Show relevant panel
    switch (currentSlide) {
        case 2: // Computers everywhere
            document.getElementById('panel-reveal').classList.remove('hidden');
            break;
        case 3: // Coding steps
            document.getElementById('panel-reveal').classList.remove('hidden');
            break;
        case 4: // Robot game
            document.getElementById('panel-robot').classList.remove('hidden');
            break;
        case 5: // AI demo
            document.getElementById('panel-ai').classList.remove('hidden');
            break;
    }

    // Confetti button on last slide
    const confettiBtn = document.getElementById('btn-confetti');
    if (currentSlide === totalSlides - 1) {
        confettiBtn.classList.remove('hidden');
    } else {
        confettiBtn.classList.add('hidden');
    }
}

function showStatus(msg, type) {
    const el = document.getElementById('connect-status');
    el.textContent = msg;
    el.className = type || '';
}

function vibrate() {
    if (navigator.vibrate) navigator.vibrate(30);
}

// ============ KEYBOARD SUPPORT ============
// Keyboard support not needed since there's no code input anymore

