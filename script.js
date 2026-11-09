document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let count = 0;
    let highest = 0;
    let lowest = 0;
    let totalIncreases = 0;
    let totalDecreases = 0;
    let isMuted = true; // Respecting muted-by-default requirement
    const maxHistoryItems = 10;

    // --- DOM Elements ---
    const displayValue = document.getElementById('counter-value');
    const btnIncrease = document.getElementById('btn-increase');
    const btnDecrease = document.getElementById('btn-decrease');
    const btnReset = document.getElementById('btn-reset');
    
    const statHighest = document.getElementById('stat-highest');
    const statLowest = document.getElementById('stat-lowest');
    const statIncreases = document.getElementById('stat-increases');
    const statDecreases = document.getElementById('stat-decreases');
    
    const historyList = document.getElementById('history-list');
    const btnSound = document.getElementById('btn-sound');
    const btnTheme = document.getElementById('btn-theme');
    const tiltCard = document.getElementById('tilt-card');

    // --- Audio System (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playSound = (type) => {
        if (isMuted) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'increase') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        } else if (type === 'decrease') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        } else if (type === 'reset') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        }

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    };

    // --- Core Logic Functions ---
    const updateDisplay = () => {
        displayValue.textContent = count;
        
        // Update Stats
        statHighest.textContent = highest;
        statLowest.textContent = lowest;
        statIncreases.textContent = totalIncreases;
        statDecreases.textContent = totalDecreases;

        // Pop Animation Trigger
        displayValue.classList.remove('pop');
        void displayValue.offsetWidth; // Trigger reflow
        displayValue.classList.add('pop');
    };

    const addHistoryLog = (action, valueChange) => {
        // Remove empty state message if it exists
        const emptyMsg = historyList.querySelector('.history-empty');
        if (emptyMsg) emptyMsg.remove();

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const li = document.createElement('li');
        li.className = `history-item ${action.toLowerCase()}`;
        
        li.innerHTML = `
            <span class="history-action">${action} (${valueChange})</span>
            <span class="history-time">${time}</span>
        `;

        historyList.prepend(li);

        // Keep history list to max length
        if (historyList.children.length > maxHistoryItems) {
            historyList.removeChild(historyList.lastChild);
        }
    };

    const handleIncrease = () => {
        count++;
        totalIncreases++;
        if (count > highest) highest = count;
        playSound('increase');
        updateDisplay();
        addHistoryLog('Increase', count);
    };

    const handleDecrease = () => {
        count--;
        totalDecreases++;
        if (count < lowest) lowest = count;
        playSound('decrease');
        updateDisplay();
        addHistoryLog('Decrease', count);
    };

    const handleReset = () => {
        if (count === 0) return; // Don't log reset if already zero
        count = 0;
        playSound('reset');
        updateDisplay();
        addHistoryLog('Reset', 0);
    };

    // --- Event Listeners ---
    btnIncrease.addEventListener('click', handleIncrease);
    btnDecrease.addEventListener('click', handleDecrease);
    btnReset.addEventListener('click', handleReset);

    // Toggle Sound
    btnSound.addEventListener('click', () => {
        isMuted = !isMuted;
        const icon = btnSound.querySelector('i');
        if (isMuted) {
            icon.className = 'ph ph-speaker-slash';
            btnSound.classList.remove('active');
        } else {
            icon.className = 'ph ph-speaker-high';
            btnSound.classList.add('active');
            playSound('increase'); // Feedback that sound is on
        }
    });

    // Theme Toggle
    btnTheme.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        
        const icon = btnTheme.querySelector('i');
        icon.className = newTheme === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore inputs to prevent overriding forms (if added later)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            btnIncrease.click(); // Triggers visual active states if implemented, or just runs logic
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            btnDecrease.click();
        } else if (e.key.toLowerCase() === 'r') {
            btnReset.click();
        }
    });

    // 3D Tilt Effect on Mouse Move
    tiltCard.addEventListener('mousemove', (e) => {
        // Respect prefers-reduced-motion
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const rect = tiltCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation (max 10 degrees)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        
        tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    // Reset tilt on mouse leave
    tiltCard.addEventListener('mouseleave', () => {
        tiltCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });
});