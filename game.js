
/* Safety Arkanoid + 5대 안전지킴이 (stage clear random message)
   Uses user's attached UI pack image as sprite (assets/ui_pack.jpg) for vibe.
*/
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');

const uiImg = new Image();
uiImg.src = 'assets/ui_pack.jpg';

const hpEl = document.getElementById('hp');
const pressureEl = document.getElementById('pressure');
const scoreEl = document.getElementById('score');
const stageEl = document.getElementById('stage');
const comboEl = document.getElementById('combo');

const modal = document.getElementById('modal');
const over = document.getElementById('over');
const btnNext = document.getElementById('btnNext');
const btnRetry = document.getElementById('btnRetry');

const kNum = document.getElementById('kNum');
const kTitle = document.getElementById('kTitle');
const kDesc = document.getElementById('kDesc');
const congrats = document.getElementById('congrats');

const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');

const keepers = [
  { num: 1, title: "착용하자! 안전장구", desc: "작업에 맞는 개인보호구(안전모, 절연장갑, 안전화 등) 반드시 착용" },
  { num: 2, title: "시행하자! 안전회의", desc: "작업 전 TBM 안전회의로 위험요인·대책 공유" },
  { num: 3, title: "확인하자! 검전접지", desc: "작업 전 검전으로 무전압 확인 후 접지 실시" },
  { num: 4, title: "수행하자! 활선방호", desc: "충전부 인근 작업 시 활선방호구 설치로 감전사고 예방" },
  { num: 5, title: "준수하자! 작업절차", desc: "정해진 작업절차와 안전수칙을 준수하여 작업" },
];
let lastKeeper = -1;
function showRandomKeeper(){
  let idx = Math.floor(Math.random()*keepers.length);
  if(idx === lastKeeper) idx = (idx+1) % keepers.length;
  lastKeeper = idx;
  const k = keepers[idx];
  kNum.textContent = k.num;
  kTitle.textContent = k.title;
  kDesc.textContent = k.desc;

  const cheers = [
    "🎉 클리어! 오늘도 무사고를 향해!",
    "👏 좋아요! 안전은 습관입니다.",
    "⭐ 훌륭해요! 다음 스테이지도 가봅시다.",
    "🏆 멋집니다! 기준을 지키면 이깁니다.",
    "🔥 최고! 압박이 와도 절차는 지킵니다.",
  ];
  congrats.textContent = cheers[Math.floor(Math.random()*cheers.length)];

  modal.classList.remove('hidden');
  paused = true;
}

function hideKeeper(){
  modal.classList.add('hidden');
  paused = false;
  // small delay before next stage starts
  setTimeout(()=>{ stageStart(); }, 250);
}

btnNext.addEventListener('click', hideKeeper);
btnRetry.addEventListener('click', () => { over.classList.add('hidden'); startGame(); });

btnPause.addEventListener('click', () => {
  if(gameOver) return;
  paused = !paused;
  btnPause.textContent = paused ? '▶' : '⏸';
});
btnRestart.addEventListener('click', () => startGame());

// ---------- Game parameters ----------
let stage = 1;
let score = 0;
let hp = 100;
let pressure = 0;
let combo = 0;
let bestCombo = 0;

let paused = false;
let gameOver = false;

const paddle = {
  x: 0, y: 0,
  w: 140, h: 16,
  targetX: 0,
  speed: 0.22, // smoothing
};

const balls = []; // multiple balls
const particles = [];

const BRICK_ROWS_BASE = 4;
const BRICK_COLS = 10;
const BRICK_H = 34;
const BRICK_PAD = 10;

// risk bricks: critical stay -> pressure rises -> paddle shrinks
const brickTypes = [
  { icon: "⚡", kind: "critical", hp: 2 },
  { icon: "🔥", kind: "critical", hp: 2 },
  { icon: "🪜", kind: "normal", hp: 1 },
  { icon: "🚗", kind: "normal", hp: 1 },
  { icon: "📞", kind: "normal", hp: 1 },
  { icon: "🧤", kind: "normal", hp: 1 },
];

// powerups (spawn sometimes on brick break)
const powerups = []; // {x,y,vy,type,ttl}
const POWER_TYPES = [
  { type:'expand', icon:'🛡', label:'패들+'},
  { type:'multiball', icon:'🟣', label:'멀티볼'},
  { type:'slow', icon:'🧊', label:'슬로우'},
];

let bricks = [];

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

function resizeCanvas(){
  const rect = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(rect.width * dpr);
  cv.height = Math.round((rect.width * 2/3) * dpr); // 3:2-ish
}
window.addEventListener('resize', () => { resizeCanvas(); layout(); });

function layout(){
  paddle.y = cv.height - 28;
  paddle.h = Math.max(12, cv.width*0.018);
  paddle.w = Math.max(110, cv.width*0.18);
  paddle.x = (cv.width - paddle.w)/2;
  paddle.targetX = paddle.x;
}

function hud(){
  hpEl.textContent = Math.round(hp);
  pressureEl.textContent = Math.round(pressure);
  scoreEl.textContent = score;
  stageEl.textContent = stage;
  comboEl.textContent = combo;
}

function spawnBall(x, y, speed){
  const ang = (Math.random()*0.9 + 0.15) * Math.PI; // mostly upwards
  const s = speed;
  balls.push({
    x, y, r: Math.max(7, cv.width*0.010),
    dx: Math.cos(ang)*s*(Math.random()<0.5?-1:1),
    dy: -Math.abs(Math.sin(ang)*s),
  });
}

function resetBalls(){
  balls.length = 0;
  const baseSpeed = 5 + stage*0.55;
  spawnBall(cv.width/2, cv.height*0.62, baseSpeed);
}

function createBricks(){
  bricks = [];
  const rows = Math.min(9, BRICK_ROWS_BASE + stage);
  const pad = BRICK_PAD;
  const bw = (cv.width - pad*(BRICK_COLS+1)) / BRICK_COLS;
  const bh = Math.max(26, cv.width*0.040);

  for(let r=0;r<rows;r++){
    for(let c=0;c<BRICK_COLS;c++){
      const t = brickTypes[Math.floor(Math.random()*brickTypes.length)];
      bricks.push({
        x: pad + c*(bw + pad),
        y: 70 + r*(bh + pad*0.65),
        w: bw,
        h: bh,
        icon: t.icon,
        kind: t.kind,
        hp: t.hp,
        maxHp: t.hp,
      });
    }
  }
}

function stageStart(){
  paused = false;
  gameOver = false;
  pressure = 0;
  combo = 0;
  bestCombo = Math.max(bestCombo, combo);
  powerups.length = 0;
  particles.length = 0;

  resetBalls();
  createBricks();
  hud();
}

function startGame(){
  stage = 1;
  score = 0;
  hp = 100;
  pressure = 0;
  combo = 0;
  bestCombo = 0;
  paused = false;
  gameOver = false;
  modal.classList.add('hidden');
  over.classList.add('hidden');

  resizeCanvas();
  layout();
  stageStart();
}

function addParticles(x,y, n, good=true){
  for(let i=0;i<n;i++){
    particles.push({
      x, y,
      vx:(Math.random()*2-1)*4,
      vy:(Math.random()*2-1)*4 - 1,
      life: 22 + Math.random()*12,
      good
    });
  }
}

function maybeSpawnPowerup(x,y){
  // 18% chance; slightly higher on critical bricks
  if(Math.random() > 0.18) return;
  const p = POWER_TYPES[Math.floor(Math.random()*POWER_TYPES.length)];
  powerups.push({ x, y, vy: 2.8 + stage*0.15, type: p.type, icon:p.icon, ttl: 9000 });
}

function applyPowerup(type){
  if(type === 'expand'){
    paddle.w = Math.min(paddle.w * 1.25, cv.width*0.30);
  } else if(type === 'multiball'){
    // add one more ball
    if(balls.length < 3){
      spawnBall(paddle.x + paddle.w/2, paddle.y - 40, 5.4 + stage*0.55);
    }
  } else if(type === 'slow'){
    balls.forEach(b => { b.dx *= 0.86; b.dy *= 0.86; });
  }
  score += 25;
  addParticles(paddle.x + paddle.w/2, paddle.y-10, 18, True);
}

function loseHP(amount){
  hp = clamp(hp - amount, 0, 100);
  combo = 0;
  if(hp <= 0){
    gameOver = true;
    paused = true;
    over.classList.remove('hidden');
  }
}

function updatePressure(){
  // pressure rises with remaining critical bricks and stage
  const crit = bricks.filter(b => b.kind === 'critical').length;
  const base = Math.min(80, (crit * 4) + stage*2);
  // if balls are many, slightly reduce pressure (player doing well)
  const relief = Math.min(12, (balls.length-1) * 6);
  pressure = clamp(base - relief, 0, 100);
}

function effectivePaddleWidth(){
  // shrink with pressure (harder)
  const shrink = 1 - (pressure/100)*0.38;
  return paddle.w * shrink;
}

function draw(){
  ctx.clearRect(0,0,cv.width,cv.height);

  // background
  const g = ctx.createLinearGradient(0,0,0,cv.height);
  g.addColorStop(0, '#1e293b');
  g.addColorStop(1, '#0f172a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,cv.width,cv.height);

  // light silhouettes
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#93a4b8';
  for(let i=0;i<9;i++){
    const x = (i/9)*cv.width;
    const bw = 24 + (i%3)*18;
    const bh = 70 + (i%4)*40;
    ctx.fillRect(x, cv.height*0.36 - bh, bw, bh);
  }
  ctx.globalAlpha = 1;

  // decorative UI pack as faint watermark (using attached image)
  if(uiImg.complete){
    ctx.globalAlpha = 0.08;
    const s = Math.min(cv.width, cv.height);
    ctx.drawImage(uiImg, cv.width - s*0.45, cv.height - s*0.45, s*0.42, s*0.42);
    ctx.globalAlpha = 1;
  }

  // bricks
  bricks.forEach(b => {
    const isCrit = b.kind === 'critical';
    ctx.fillStyle = isCrit ? 'rgba(239,68,68,.90)' : 'rgba(245,158,11,.90)';
    roundRect(b.x, b.y, b.w, b.h, 10);
    // hp stripe
    if(b.maxHp > 1){
      ctx.fillStyle = b.hp === 2 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.15)';
      ctx.fillRect(b.x, b.y + b.h - 6, b.w*(b.hp/b.maxHp), 6);
    }

    ctx.font = `950 ${Math.max(18, b.h*0.55)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0b1020';
    ctx.fillText(b.icon, b.x + b.w/2, b.y + b.h/2 - 1);

    // subtle label (tiny)
    ctx.font = `900 ${Math.max(10, b.h*0.28)}px system-ui`;
    ctx.fillStyle = 'rgba(11,16,32,.75)';
    const label = isCrit ? '치명' : '일반';
    ctx.fillText(label, b.x + b.w/2, b.y + b.h - b.h*0.22);
  });

  // powerups falling
  powerups.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(10, cv.width*0.015), 0, Math.PI*2);
    ctx.fillStyle = 'rgba(56,189,248,.18)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56,189,248,.55)';
    ctx.stroke();

    ctx.font = `950 ${Math.max(16, cv.width*0.02)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(p.icon, p.x, p.y);
  });

  // paddle
  const w = effectivePaddleWidth();
  const px = paddle.x + (paddle.w - w)/2;
  ctx.fillStyle = 'rgba(56,189,248,.95)';
  roundRect(px, paddle.y, w, paddle.h, 10);
  // glow
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = 'rgba(56,189,248,.95)';
  roundRect(px, paddle.y-4, w, paddle.h+8, 12);
  ctx.globalAlpha = 1;

  // balls
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.stroke();
  });

  // particles
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.life -= 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;

    const a = Math.max(0, p.life / 32);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.good ? 'rgba(34,197,94,.95)' : 'rgba(239,68,68,.95)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2, cv.width*0.004), 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if(p.life <= 0) particles.splice(i,1);
  }

  // top warning bar for pressure
  if(pressure > 0){
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = pressure > 60 ? 'rgba(239,68,68,.95)' : 'rgba(245,158,11,.95)';
    ctx.fillRect(0,0, cv.width*(pressure/100), 8);
    ctx.globalAlpha = 1;
  }
}

function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

function movePaddle(){
  paddle.x += (paddle.targetX - paddle.x) * paddle.speed;
  paddle.x = clamp(paddle.x, 0, cv.width - paddle.w);
}

function moveBalls(){
  balls.forEach(ball => {
    ball.x += ball.dx;
    ball.y += ball.dy;

    if(ball.x + ball.r > cv.width || ball.x - ball.r < 0) ball.dx *= -1;
    if(ball.y - ball.r < 0) ball.dy *= -1;

    // paddle collision
    const w = effectivePaddleWidth();
    const px = paddle.x + (paddle.w - w)/2;
    if(ball.y + ball.r >= paddle.y &&
       ball.x >= px && ball.x <= px + w &&
       ball.dy > 0
    ){
      // reflection angle based on hit position
      const hit = (ball.x - (px + w/2)) / (w/2);
      const speed = Math.sqrt(ball.dx*ball.dx + ball.dy*ball.dy);
      ball.dx = speed * hit * 0.95;
      ball.dy = -Math.abs(speed * (0.9 - Math.abs(hit)*0.2));
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      score += 2 + Math.min(8, Math.floor(combo/4));
      addParticles(ball.x, ball.y, 6, true);
    }

    // bottom
    if(ball.y - ball.r > cv.height){
      // lose a ball
      ball.dead = true;
      loseHP(12);
      addParticles(cv.width/2, cv.height*0.75, 18, false);
    }
  });
  // remove dead balls
  for(let i=balls.length-1;i>=0;i--){
    if(balls[i].dead) balls.splice(i,1);
  }
  if(balls.length === 0 && !gameOver){
    // respawn
    combo = 0;
    resetBalls();
  }
}

function movePowerups(){
  for(let i=powerups.length-1;i>=0;i--){
    const p = powerups[i];
    p.y += p.vy;
    p.ttl -= 16;

    // catch by paddle
    const w = effectivePaddleWidth();
    const px = paddle.x + (paddle.w - w)/2;
    if(p.y >= paddle.y-10 && p.y <= paddle.y + paddle.h + 10 && p.x >= px && p.x <= px+w){
      applyPowerup(p.type);
      powerups.splice(i,1);
      continue;
    }
    // drop out
    if(p.y > cv.height + 30 || p.ttl <= 0) powerups.splice(i,1);
  }
}

function collideBricks(){
  // For each ball, check bricks (simple AABB)
  balls.forEach(ball => {
    for(let i=0;i<bricks.length;i++){
      const b = bricks[i];
      if(ball.x > b.x && ball.x < b.x+b.w && ball.y > b.y && ball.y < b.y+b.h){
        // hit
        b.hp -= 1;
        const isCrit = b.kind === 'critical';

        if(b.hp <= 0){
          bricks.splice(i,1);
          i--;

          // scoring
          const base = isCrit ? 20 : 10;
          score += base + Math.min(10, Math.floor(combo/3));
          addParticles(ball.x, ball.y, isCrit ? 22 : 14, true);

          maybeSpawnPowerup(b.x + b.w/2, b.y + b.h/2);

          // pressure relief when critical cleared
          if(isCrit){
            pressure = clamp(pressure - 6, 0, 100);
          }

          // small combo reward
          combo += 1;
          bestCombo = Math.max(bestCombo, combo);
        }else{
          // chip damage hit: smaller score
          score += 4;
          addParticles(ball.x, ball.y, 10, true);
        }

        // bounce: flip dy (good enough)
        ball.dy *= -1;

        return;
      }
    }
  });
}

function tick(){
  if(paused){ draw(); requestAnimationFrame(tick); return; }
  if(gameOver){ draw(); requestAnimationFrame(tick); return; }

  updatePressure();
  movePaddle();
  moveBalls();
  collideBricks();
  movePowerups();

  // natural pressure drain if player clears a lot
  if(combo >= 6) pressure = clamp(pressure - 0.25, 0, 100);

  // pressure also slowly chips hp if too high (harder)
  if(pressure >= 80 && Math.random() < 0.04){
    loseHP(2);
  }

  hud();
  draw();

  // stage clear
  if(bricks.length === 0){
    paused = true;
    stage += 1;
    score += 50;
    showRandomKeeper();
  }

  requestAnimationFrame(tick);
}

// ---- Controls ----
function setTargetFromClientX(clientX){
  const rect = cv.getBoundingClientRect();
  const dpr = cv.width / rect.width;
  const x = (clientX - rect.left) * dpr;
  paddle.targetX = clamp(x - paddle.w/2, 0, cv.width - paddle.w);
}
cv.addEventListener('pointermove', (e) => {
  if(gameOver) return;
  setTargetFromClientX(e.clientX);
});
cv.addEventListener('pointerdown', (e) => {
  if(gameOver) return;
  setTargetFromClientX(e.clientX);
});
document.addEventListener('keydown', (e) => {
  if(gameOver) return;
  if(e.key === 'ArrowLeft') paddle.targetX -= 40;
  if(e.key === 'ArrowRight') paddle.targetX += 40;
  paddle.targetX = clamp(paddle.targetX, 0, cv.width - paddle.w);
});

// Start
uiImg.onload = () => {
  startGame();
  requestAnimationFrame(tick);
};
// if image fails, still start
uiImg.onerror = () => {
  startGame();
  requestAnimationFrame(tick);
};
