const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "menu"; 
// menu | playing | paused | gameover

let bird = {
    x: 80,
    y: 200,
    width: 30,
    height: 30,
    gravity: 0.5,
    lift: -7,
    velocity: 0
};

let coins = [];
let pipes = [];
let clouds = [];
let frame = 0;
let score = 0;
let level = 1;
let highScore = localStorage.getItem("highScore") || 0;

const sounds = {
    flap: new Audio("sounds/flap.wav"),
    hit: new Audio("sounds/hit.wav"),
    score: new Audio("sounds/score.wav"),
    start: new Audio("sounds/start.wav"),
    bg: new Audio("sounds/bg.mp3")
};

// Volume setup
sounds.bg.volume = 0.25;
sounds.flap.volume = 0.5;
sounds.hit.volume = 0.6;
sounds.score.volume = 0.6;
sounds.start.volume = 0.6;

// Loop background music
sounds.bg.loop = true;

// Load audio trước để giảm delay
Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
});

// Hàm phát âm thanh mượt hơn
function playSound(sound) {
    const s = sound.cloneNode();

    s.volume = sound.volume;

    s.play().catch(() => {
        console.log("Audio blocked until interaction.");
    });
}

function flap() {
    if (gameState !== "playing") return;

    bird.velocity = bird.lift;

    // 🔊 flap sound
    playSound(sounds.flap);
}

document.addEventListener("mousedown", (e) => {

    if (gameState === "menu") {
        startGame();
        function pauseGame() {

    if (gameState !== "playing") return;

    gameState = "paused";

    sounds.bg.pause();
}

function resumeGame() {

    if (gameState !== "paused") return;

    gameState = "playing";

    sounds.bg.play().catch(() => {});
}
    }

    

    else if (gameState === "gameover") {
        location.reload();
    }

    else if (gameState === "playing") {

        if (e.button === 2) {
            e.preventDefault();
        }

        flap();
    }
});

document.addEventListener("keydown", e => {

    if (e.code === "Space") {

        if (gameState === "menu") {
            startGame();
        }

        else if (gameState === "gameover") {
            location.reload();
        }

        else if (gameState === "playing") {
            flap();
        }
    }


    if (e.code === "Escape") {

        if (gameState === "playing") {
            pauseGame();
        }

        else if (gameState === "paused") {
            resumeGame();
        }
    }
});

document.addEventListener("contextmenu", e => e.preventDefault());

function drawCloud3D(c) {

    ctx.save();

    ctx.globalAlpha = c.alpha || 0.95;

    let gradient = ctx.createRadialGradient(
        c.x - c.size * 0.3,
        c.y - c.size * 0.3,
        c.size * 0.2,
        c.x,
        c.y,
        c.size * 1.2
    );

    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.5, "#f5f7fa");
    gradient.addColorStop(1, "#dfe6ee");

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(c.x - c.size * 0.6, c.y, c.size * 0.6, 0, Math.PI * 2);
    ctx.arc(c.x, c.y - c.size * 0.2, c.size * 0.8, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.7, c.y, c.size * 0.65, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.2, c.y + c.size * 0.2, c.size * 0.7, 0, Math.PI * 2);

   ctx.closePath();

// tô mây
ctx.fill();

// viền đen nhẹ
ctx.strokeStyle = "rgba(0,0,0,0.12)";
ctx.lineWidth = 2;
ctx.stroke();

ctx.restore();
}

function updateLevel() {
    level = Math.floor(score / 5) + 1;
}

function getDifficulty() {
    return {
        pipeSpeed: 2 + level * 0.4,
        gap: Math.max(90, 140 - level * 5),
        spawnRate: Math.max(80, 140 - level * 3)
    };
}

function update() {

    frame++;

    updateLevel();

    let diff = getDifficulty();

    // Bird physics
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Spawn clouds
    if (frame % 150 === 0) {

        clouds.push({
            x: canvas.width + 100,
            y: Math.random() * (canvas.height - 150) + 50,
            size: Math.random() * 30 + 35,
            speed: Math.random() * 0.8 + 0.4,
            alpha: Math.random() * 0.2 + 0.75
        });
    }

    // Move clouds
    clouds.forEach(c => c.x -= c.speed);

    clouds = clouds.filter(c => c.x > -150);

    // Spawn pipes
    if (frame % diff.spawnRate === 0) {

        let minHeight = 50;
        let maxHeight = canvas.height - diff.gap - 50;

        let top = Math.random() * (maxHeight - minHeight) + minHeight;

        pipes.push({
            x: canvas.width,
            top: top,
            bottom: top + diff.gap,
            passed: false
        });
    }

    // Pipes update
    pipes.forEach(p => {

        p.x -= diff.pipeSpeed;

        // 💥 Collision
        if (
            bird.x < p.x + 50 &&
            bird.x + bird.width > p.x &&
            (bird.y < p.top || bird.y + bird.height > p.bottom)
        ) {
            endGame();
        }

        // 🏆 Score
        if (!p.passed && p.x + 50 < bird.x) {

            score++;

            // 🔊 score sound
            playSound(sounds.score);

            p.passed = true;
        }
    });

    pipes = pipes.filter(p => p.x > -50);

    // Death check
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
    }
}

function endGame() {

    if (gameState === "gameover") return;

    // 🔊 hit sound
    playSound(sounds.hit);

    // ⏹ stop music
    sounds.bg.pause();

    gameState = "gameover";

    if (score > highScore) {

        highScore = score;

        localStorage.setItem("highScore", highScore);
    }
}

function draw() {

    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clouds
    clouds.forEach(c => drawCloud3D(c));

    // Bird
    ctx.save();

    ctx.translate(
        bird.x + bird.width / 2,
        bird.y + bird.height / 2
    );

    ctx.rotate(
        Math.max(-0.4, Math.min(bird.velocity * 0.04, 0.4))
    );

    // Body
    ctx.fillStyle = "#facc15";

    ctx.beginPath();

    ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);

    ctx.fill();

    // Wing
    ctx.fillStyle = "#fbbf24";

    let wingOffset = Math.sin(frame * 0.3) * 5;

    ctx.beginPath();

    ctx.ellipse(-5, wingOffset, 10, 6, 0, 0, Math.PI * 2);

    ctx.fill();

    // Eye
    ctx.fillStyle = "white";

    ctx.beginPath();

    ctx.arc(8, -5, 6, 0, Math.PI * 2);

    ctx.fill();

    // Pupil
    ctx.fillStyle = "black";

    ctx.beginPath();

    ctx.arc(10, -5, 3, 0, Math.PI * 2);

    ctx.fill();

    // Beak
    ctx.fillStyle = "#f97316";

    ctx.beginPath();

    ctx.moveTo(15, 0);
    ctx.lineTo(25, 5);
    ctx.lineTo(15, 10);

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    // Pipes
    ctx.fillStyle = "#22c55e";

    pipes.forEach(p => {

        ctx.fillRect(p.x, 0, 50, p.top);

        ctx.fillRect(
            p.x,
            p.bottom,
            50,
            canvas.height - p.bottom
        );
    });

    // UI
    ctx.fillStyle = "#1e293b";

    ctx.font = "bold 20px Arial";

    ctx.fillText("Score: " + score, 15, 35);
    ctx.fillText("Level: " + level, 15, 65);
    ctx.fillText("Best: " + highScore, 15, 95);
}


// ======================================================
// 🧠 MENU
// ======================================================

function drawMenu() {

    // ==================================================
    // BACKGROUND
    // ==================================================

    let gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
    );

    gradient.addColorStop(0, "#7dd3fc");
    gradient.addColorStop(1, "#e0f2fe");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ==================================================
    // FLOATING CLOUDS
    // ==================================================

    clouds.forEach(c => drawCloud3D(c));

    if (frame % 120 === 0) {

        clouds.push({
            x: canvas.width + 100,
            y: Math.random() * 250 + 50,
            size: Math.random() * 30 + 35,
            speed: Math.random() * 0.5 + 0.2,
            alpha: 0.9
        });
    }

    clouds.forEach(c => c.x -= c.speed);

    clouds = clouds.filter(c => c.x > -200);

    // ==================================================
    // TITLE
    // ==================================================

    ctx.save();

    ctx.textAlign = "center";

    let pulse = Math.sin(frame * 0.05) * 5;

    ctx.shadowColor = "#0ea5e9";
    ctx.shadowBlur = 30;

    ctx.fillStyle = "#0f172a";

    ctx.font = `bold ${70 + pulse * 0.2}px Arial`;

    ctx.fillText(
        "FLAPPY BIRD",
        canvas.width / 2,
        220 + pulse * 0.3
    );

    // HARDCORE text
    ctx.fillStyle = "#ef4444";

    ctx.font = "bold 38px Arial";

    ctx.fillText(
        "HARDCORE",
        canvas.width / 2,
        280
    );

    ctx.restore();

    // ==================================================
    // ANIMATED BIRD
    // ==================================================

    let birdY = 380 + Math.sin(frame * 0.08) * 15;

    ctx.save();

    ctx.translate(canvas.width / 2, birdY);

    // body
    ctx.fillStyle = "#facc15";

    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fill();

    // wing
    ctx.fillStyle = "#fbbf24";

    ctx.beginPath();

    ctx.ellipse(
        -10,
        Math.sin(frame * 0.3) * 8,
        18,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // eye
    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(10, -8, 8, 0, Math.PI * 2);
    ctx.fill();

    // pupil
    ctx.fillStyle = "black";

    ctx.beginPath();
    ctx.arc(13, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = "#f97316";

    ctx.beginPath();

    ctx.moveTo(30, 0);
    ctx.lineTo(48, 8);
    ctx.lineTo(30, 16);

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    // ==================================================
    // START BUTTON
    // ==================================================

    let btnWidth = 280;
    let btnHeight = 70;

    let btnX = canvas.width / 2 - btnWidth / 2;
    let btnY = 520;

    // glow
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 20;

    // button bg
    ctx.fillStyle = "#0ea5e9";

    ctx.beginPath();

    ctx.roundRect(
        btnX,
        btnY,
        btnWidth,
        btnHeight,
        20
    );

    ctx.fill();

    // button text
    ctx.shadowBlur = 0;

    ctx.fillStyle = "white";

    ctx.font = "bold 30px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "START GAME",
        canvas.width / 2,
        btnY + 45
    );

    // ==================================================
    // CONTROLS
    // ==================================================

    ctx.fillStyle = "#334155";

    ctx.font = "22px Arial";

    ctx.fillText(
        "SPACE or LEFT CLICK to flap",
        canvas.width / 2,
        640
    );

    // ==================================================
    // HIGH SCORE
    // ==================================================

    ctx.fillStyle = "#f59e0b";

    ctx.font = "bold 28px Arial";

    ctx.fillText(
        "BEST SCORE: " + highScore,
        canvas.width / 2,
        700
    );

    ctx.textAlign = "left";
}


// ======================================================
// 💀 GAME OVER SCREEN
// ======================================================

function drawGameOver() {

    ctx.fillStyle = "rgba(224, 242, 254, 0.3)";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ef4444";

    ctx.font = "bold 45px Arial";

    ctx.textAlign = "center";

    ctx.fillText("GAME OVER", canvas.width / 2, 260);

    ctx.fillStyle = "#1e293b";

    ctx.font = "bold 28px Arial";

    ctx.fillText("Score: " + score, canvas.width / 2, 320);

    ctx.font = "20px Arial";

    ctx.fillStyle = "#475569";

    ctx.fillText("Click to restart", canvas.width / 2, 380);

    ctx.textAlign = "left";
}


// ======================================================
// 🚀 START GAME
// ======================================================

function startGame() {

    gameState = "playing";

    score = 0;

    pipes = [];
    clouds = [];

    bird.y = 200;
    bird.velocity = 0;

    // 🔊 start sound
    playSound(sounds.start);

    // 🎵 bg music
    sounds.bg.currentTime = 0;

    sounds.bg.play().catch(() => {
        console.log("Music blocked.");
    });
}


// ======================================================
// 🔁 GAME LOOP
// ======================================================

function gameLoop() {

    if (gameState === "menu") {

        drawMenu();
    }

    else if (gameState === "playing") {

        update();

        draw();
        
        
    }

    else if (gameState === "gameover") {

        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();