/* Minigame PhD controls */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.font = "18px Muli";
const phdButton = document.getElementById("phdButton");
const legend = document.getElementById("gameLegend");

const papers = [];
const player = { x: 130, y: 360, width: 17, height: 28, score: 0 };
let gameActive = true;

// Use emoji placeholders for papers
/*const paperIcons = {
  ACCEPT: "📄✅",
  REJECT: "📄❌"
};*/

const paperIcons = {
  ACCEPT: new Image(),
  REJECT: new Image()
};

paperIcons.ACCEPT.src = "assets/img/minigame/thumb/up.png";
paperIcons.REJECT.src = "assets/img/minigame/thumb/down.png";

const imgWidth = 28;
const imgHeight = 28;

// Animation states
const animations = {
  idleRight: [
    "assets/img/minigame/idleRight/0.png",
    "assets/img/minigame/idleRight/1.png",
    "assets/img/minigame/idleRight/2.png",
    "assets/img/minigame/idleRight/3.png"
  ],
  idleLeft: [
    "assets/img/minigame/idleLeft/0.png",
    "assets/img/minigame/idleLeft/1.png",
    "assets/img/minigame/idleLeft/2.png",
    "assets/img/minigame/idleLeft/3.png"
  ],
  walkRight: [
    "assets/img/minigame/walkRight/0.png",
    "assets/img/minigame/walkRight/1.png",
    "assets/img/minigame/walkRight/2.png",
    "assets/img/minigame/walkRight/3.png",
    "assets/img/minigame/walkRight/4.png",
    "assets/img/minigame/walkRight/5.png"
  ],
  walkLeft: [
    "assets/img/minigame/walkLeft/0.png",
    "assets/img/minigame/walkLeft/1.png",
    "assets/img/minigame/walkLeft/2.png",
    "assets/img/minigame/walkLeft/3.png",
    "assets/img/minigame/walkLeft/4.png",
    "assets/img/minigame/walkLeft/5.png"
  ]
};

// Spawn papers
let lastSpawn = 0;
const spawnInterval = 1000; // ms

function loadFrames(frameList, callback) {
  let loaded = [];
  let count = 0;

  frameList.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      count++;
      if (count === frameList.length) callback(loaded);
    };
    loaded.push(img);
  });

  return loaded;
}

// Load animations
let loadedAnimations = {};
for (const state in animations) {
  loadedAnimations[state] = loadFrames(animations[state], () => {});
}

let currentAnim = "idleRight";
let currentFrame = 0;
let frameTimer = 0;
const frameInterval = 120; // ms per frame

// Animation switching with reset
function setAnim(state) {
  if (currentAnim !== state) {
    currentAnim = state;
    currentFrame = 0;
    frameTimer = 0;
  }
}

let direction = 1; // 1 = right, -1 = left

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    setAnim("walkRight");
    direction = 1;
    player.x = Math.min(canvas.width - player.width, player.x + 10);
  }
  if (e.key === "ArrowLeft") {
    setAnim("walkLeft");
    direction = -1;
    player.x = Math.max(0, player.x - 10);
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    if (direction == 1) setAnim("idleRight");
    else setAnim("idleLeft");
  }
});

function isColliding(p, player) {

  return !(
    p.x + p.width < player.x ||       // paper is left of player
    p.x > player.x + player.width ||     // paper is right of player
    p.y + p.height < player.y ||      // paper is above player
    p.y > player.y + player.height       // paper is below player
  );
}

let lastTime = 0;

function gameLoop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const dt = (timestamp - lastTime) / 16.67; // normalize to ~60fps
  lastTime = timestamp;
  
  // spawn papers
  if (timestamp - lastSpawn > spawnInterval) {
    lastSpawn = timestamp;
    const type = Math.random() < 0.5 ? "ACCEPT" : "REJECT";
    papers.push({ x: Math.random() * 260, y: 0, type, width: imgWidth, height: imgHeight });
  }

  // --- Character Animation ---
  const frames = loadedAnimations[currentAnim] || [];
  if (timestamp - frameTimer > frameInterval) {
    frameTimer = timestamp;
    currentFrame = (currentFrame + 1) % frames.length;
  }
  
    const img = frames[currentFrame];

    if (img){  
        if (direction === -1) {
          ctx.drawImage(img, player.x + player.width/2, player.y - img.height/2, -img.width, img.height);
        } else {
          ctx.drawImage(img, player.x - img.width/2, player.y - img.height/2);
        }
    }
  
  // --- Papers ---
  for (let i = 0; i < papers.length; i++) {
    const p = papers[i];
    // ctx.font = "18px Muli";
    ctx.fillStyle = p.type === "ACCEPT" ? "green" : "red";
    // ctx.fillText(paperIcons[p.type], p.x, p.y);
    ctx.drawImage(
      paperIcons[p.type],
      p.x,
      p.y,
      imgWidth, // width
      imgHeight  // height
    );
    p.y += 2 * dt;

    // Collision check
    if (isColliding(p, player)) {
      if (p.type === "ACCEPT") player.score++;
      if (p.type === "REJECT") player.score--;
      papers.splice(i, 1);
      i--;
      continue;
    }

    // Remove missed papers
    if (p.y > canvas.height) {
      papers.splice(i, 1);
      i--;
    }
  }

  // --- UI ---
  ctx.fillStyle = "black";
  // ctx.font = "18px Muli";
  ctx.fillText("Score: " + player.score, 10, 20);

  // Unlock PhD button
    if (player.score >= 5 && gameActive) {
      gameActive = false;
      papers.splice(0, papers.length);

      // Collapse canvas
      canvas.classList.add("collapsed");
      
      legend.classList.add("collapsed");

      // Show button after animation finishes
      setTimeout(() => {
        phdButton.style.display = "block";
      }, 800); // match transition duration
    }
    
    // if (papers.length > 100) papers.shift();

  if (gameActive) requestAnimationFrame(gameLoop);
}

function preloadImages(sources) {
  return Promise.all(
    sources.map(src => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    }))
  );
}

const allSources = [
  paperIcons.ACCEPT.src,
  paperIcons.REJECT.src,
  ...Object.values(animations).flat()
];

preloadImages(allSources).then(() => {
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});

// Button action
phdButton.onclick = () => {
  alert("🎉 Congratulations, you got your PhD!");
  // TODO: upgrade character avatar here
};