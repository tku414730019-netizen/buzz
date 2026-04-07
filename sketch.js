// ================================================
//  電流急急棒 - p5.js sketch.js
//  使用方式：
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
//  <script src="sketch.js"></script>
// ================================================

// ================================================
//  電流急急棒 - p5.js sketch.js
// ================================================

let W, H;
const RING_R = 14;
const TOLERANCE = 2;
const START_SNAP_R = 32;
const COUNTDOWN_SEC = 1.5;

// ── 1. 修正後的置中函式 ──────────────────────────────
function centerLevel(levelData) {
  if (!levelData.path || levelData.path.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  // 找出 Bounding Box
  for (const p of levelData.path) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const pathCenterX = (minX + maxX) / 2;
  const pathCenterY = (minY + maxY) / 2;

  // 使用目前畫布的實際寬高進行偏移計算
  const offsetX = width / 2 - pathCenterX;
  const offsetY = height / 2 - pathCenterY;

  // 同步平移路徑
  for (const p of levelData.path) {
    p.x += offsetX;
    p.y += offsetY;
  }

  // 同步平移障礙物
  if (levelData.obstacles) {
    for (const o of levelData.obstacles) {
      o.baseX += offsetX;
      o.baseY += offsetY;
    }
  }
}

// ── 2. 路徑生成 (使用 W, H) ───────────────────────────
function clampPt(x, y) {
  // 這裡使用全域的 W, H，確保在 setup 之後呼叫是正確的
  return { x: constrain(x, 50, W - 50), y: constrain(y, 42, H - 42) };
}

function genStraightPath() {
  const pts = [];
  for (let x = 80; x <= 600; x += 10) pts.push(clampPt(x, H / 2));
  return pts;
}

function genSPath() {
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    pts.push(clampPt(80 + t * 520, H / 2 + Math.sin(t * Math.PI * 2) * 125));
  }
  return pts;
}

function genSpiralPath() {
  const pts = [];
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const angle = t * Math.PI * 3.5;
    const r = 28 + t * 155;
    pts.push(clampPt(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r));
  }
  return pts;
}

function genZigzagPath() {
  const segs = [[80, 240], [180, 120], [280, 340], [380, 100], [480, 300], [600, 240]];
  const pts = [];
  for (let s = 0; s < segs.length - 1; s++) {
    const [x1, y1] = segs[s], [x2, y2] = segs[s + 1];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push(clampPt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t));
    }
  }
  return pts;
}

function genAdvancedPath() {
  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const t = i / 400;
    const x = 70 + t * 540;
    const y = H / 2 + Math.sin(t * Math.PI * 3) * 110 + Math.cos(t * Math.PI * 5) * 45;
    pts.push(clampPt(x, y));
  }
  return pts;
}

function genRandomPath() {
  const pts = [];

  // 🔧 隨機參數（每次關卡都不同）
  const amp1 = random(80, 140);   // 大波動
  const amp2 = random(30, 80);    // 小波動
  const freq1 = random(2, 4);     // 主頻率
  const freq2 = random(4, 7);     // 細節頻率

  for (let i = 0; i <= 400; i++) {
    const t = i / 400;

    const x = 70 + t * 540;

    const y =
      H / 2 +
      Math.sin(t * Math.PI * freq1) * amp1 +
      Math.cos(t * Math.PI * freq2) * amp2;

    pts.push(clampPt(x, y));
  }

  return pts;
}

function genObstaclesRandom(path) {
  const obs = [];

  for (let t of [0.2, 0.4, 0.6, 0.8]) {
    const idx = floor(t * (path.length - 1));
    const p = path[idx];

    obs.push({
      type: random() > 0.5 ? 'circle' : 'rect',
      baseX: p.x,
      baseY: p.y,
      axis: random() > 0.5 ? 'x' : 'y',
      amp: random(20, 40),
      speed: random(0.02, 0.05),
      phase: random(TWO_PI),
      r: 15,
      w: 20,
      h: 20
    });
  }

  return obs;
}

// ── 3. 障礙物 ──────────────────────────────────────
function obstaclePos(o, t) {
  const offset = Math.sin(t * o.speed + o.phase) * o.amp;
  return {
    cx: o.baseX + (o.axis === 'x' ? offset : 0),
    cy: o.baseY + (o.axis === 'y' ? offset : 0),
  };
}

function genObstacles1() {
  return [
    { type: 'circle', baseX: 232, baseY: 165, axis: 'y', amp: 30, speed: 0.038, phase: 0, r: 18 },
    { type: 'rect', baseX: 335, baseY: 278, axis: 'y', amp: 36, speed: 0.030, phase: 1.0, w: 22, h: 20 },
    { type: 'circle', baseX: 435, baseY: 178, axis: 'y', amp: 30, speed: 0.044, phase: 2.1, r: 16 },
  ];
}

function genObstacles2() {
  const obs = [];

  for (let t of [0.2, 0.35, 0.5, 0.7, 0.85]) {
    const x = 70 + t * 540;
    const y = H / 2 + Math.sin(t * Math.PI * 3) * 110 + Math.cos(t * Math.PI * 5) * 45;

    obs.push({
      type: random() > 0.5 ? 'circle' : 'rect',
      baseX: x,
      baseY: y,
      axis: random() > 0.5 ? 'x' : 'y',
      amp: random(20, 60),
      speed: random(0.02, 0.07),
      phase: random(TWO_PI),
      r: 15,
      w: 20,
      h: 20
    });
  }

  return obs;
}

function buildLevels() {
  return [
    { name: '直線通道', diff: '初級', pathWidth: 54, color: [0, 212, 255], path: genStraightPath(), obstacles: [] },
    { name: 'S 形彎道', diff: '初級', pathWidth: 50, color: [0, 255, 157], path: genSPath(), obstacles: [] },
    { name: '螺旋迷宮', diff: '中級', pathWidth: 44, color: [255, 204, 0], path: genSpiralPath(), obstacles: [] },
    { name: '障礙急彎', diff: '中級', pathWidth: 42, color: [255, 107, 53], path: genZigzagPath(), obstacles: genObstacles1() },
    { name: '電流大挑戰', diff: '高級', pathWidth: 36, color: [255, 51, 153], path: genAdvancedPath(), obstacles: genObstacles2() },
  ];
}

// ── 4. p5.js 主邏輯 (修正後的 setup) ──────────────────────
let LEVELS, gameState, level, lives, elapsed, levelStartTime, ring, trail, particles, sparkAngle, countdownStart, obsTime;

function setup() {
  createCanvas(windowWidth, windowHeight);

  W = width;
  H = height;

  LEVELS = buildLevels();

  for (let lv of LEVELS) {
    centerLevel(lv);
  }

  gameState = 'menu';
  level = 1;
  lives = 3;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  W = width;
  H = height;

  LEVELS = buildLevels();

  for (let lv of LEVELS) {
    centerLevel(lv);
  }
}

// ... 剩餘的 draw(), drawPath(), moveRing() 等函式保持不變 ...
// (因篇幅關係，以下省略重複的繪圖與邏輯函式，請延用原本的內容即可)


// ── 初始化 ────────────────────────────────────────
function resetGame() {
  level = 1;
  gotoLevel();
}

function gotoLevel() {
  lives = 3;                          // ← 每關重置三條命
  const start = LEVELS[level - 1].path[0];
  ring = { x: start.x, y: start.y };
  trail = [];
  particles = [];
  sparkAngle = 0;
  elapsed = 0;
  levelStartTime = 0;
  countdownStart = 0;
  obsTime = 0;
  gameState = 'waiting';
}

// 失敗後重試本關（不重置命數）
function retryLevel() {
  const start = LEVELS[level - 1].path[0];
  ring = { x: start.x, y: start.y };
  trail = [];
  particles = [];
  sparkAngle = 0;
  elapsed = 0;
  levelStartTime = 0;
  countdownStart = 0;
  obsTime = 0;
  gameState = 'waiting';
}



function draw() {
  background(10, 10, 26);
  drawGrid();

  if (gameState === 'menu') {
    drawMenu();

  } else if (gameState === 'waiting') {
    drawPath();
    drawObstacles();
    updateParticles(); drawParticles();
    drawWaitingPrompt();

  } else if (gameState === 'countdown') {
    drawPath();
    drawObstacles();
    updateParticles(); drawParticles();
    drawCountdownRing();
    checkLeaveStart();
    tickCountdown();

  } else if (gameState === 'playing') {
    obsTime++;
    elapsed = (millis() - levelStartTime) / 1000;
    moveRing();
    checkCollision();
    updateParticles(); updateTrail();
    drawPath();
    drawObstacles();
    drawTrail(); drawParticles();
    drawRing();
    drawPlayingHUD();

  } else if (gameState === 'success') {
    obsTime++;
    drawPath(); drawObstacles();
    updateParticles(); drawParticles();
    drawSuccessScreen();

  } else if (gameState === 'fail') {
    obsTime++;
    drawPath(); drawObstacles();
    updateParticles(); drawParticles();
    drawFailScreen();

  } else if (gameState === 'complete') {
    updateParticles(); drawParticles();
    drawCompleteScreen();
  }
}

// ── 起點偵測 & 倒數 ───────────────────────────────
function checkEnterStart() {
  if (gameState !== 'waiting') return;
  const start = LEVELS[level - 1].path[0];
  if (dist(mouseX, mouseY, start.x, start.y) < START_SNAP_R) {
    countdownStart = millis();
    ring.x = start.x;
    ring.y = start.y;
    gameState = 'countdown';
  }
}

function checkLeaveStart() {
  if (gameState !== 'countdown') return;
  const start = LEVELS[level - 1].path[0];
  if (dist(mouseX, mouseY, start.x, start.y) >= START_SNAP_R) {
    gameState = 'waiting';   // 離開起點，取消倒數
  }
}

function tickCountdown() {
  const ratio = (millis() - countdownStart) / (COUNTDOWN_SEC * 1000);
  if (ratio >= 1) {
    levelStartTime = millis();
    gameState = 'playing';
  }
}

// ── 倒數圓形進度條 ────────────────────────────────
function drawCountdownRing() {
  const lv = LEVELS[level - 1];
  const start = lv.path[0];
  const [r, g, b] = lv.color;
  const ratio = constrain((millis() - countdownStart) / (COUNTDOWN_SEC * 1000), 0, 1);
  const secsLeft = Math.ceil(COUNTDOWN_SEC * (1 - ratio));
  const arcD = (START_SNAP_R * 2 + 22) * 0.8;

  // 底圓（暗）
  noFill();
  stroke(r, g, b, 40);
  strokeWeight(6);
  circle(start.x, start.y, arcD);

  // 進度弧（順時針從頂部）
  stroke(r, g, b, 230);
  strokeWeight(6);
  strokeCap(ROUND);
  arc(start.x, start.y, arcD, arcD, -HALF_PI, -HALF_PI + ratio * TWO_PI);

  // 中心數字 / GO!
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(22);
  textStyle(BOLD);
  text(ratio >= 1 ? 'GO!' : secsLeft, start.x, start.y);
  textStyle(NORMAL);

  // 下方小提示
  fill(180);
  textSize(12);
  text('保持靜止…', start.x, start.y + START_SNAP_R + 20);

  // 滑鼠游標預覽
  noFill();
  stroke(0, 229, 255, 180);
  strokeWeight(2.5);
  circle(mouseX, mouseY, RING_R * 2);
  noStroke(); fill(255, 255, 255, 220);
  circle(mouseX, mouseY, 5);
}

// ── 移動與碰撞 ────────────────────────────────────
function moveRing() {
  ring.x += (mouseX - ring.x) * 0.22;
  ring.y += (mouseY - ring.y) * 0.22;
  sparkAngle += 0.1;
}

function checkCollision() {
  const lv = LEVELS[level - 1];

  if (!isOnPath(ring.x, ring.y) || hitsObstacle(ring.x, ring.y)) {
    spawnParticles(ring.x, ring.y, [255, 60, 60], 40, 'spark');
    spawnParticles(ring.x, ring.y, [255, 170, 0], 20, 'spark');
    lives--;
    gameState = 'fail';
    return;
  }

  const end = lv.path[lv.path.length - 1];
  if (dist(ring.x, ring.y, end.x, end.y) < 18) {
    spawnParticles(ring.x, ring.y, lv.color, 60, 'star');
    spawnParticles(ring.x, ring.y, [255, 255, 255], 30, 'star');
    gameState = level >= LEVELS.length ? 'complete' : 'success';
  }
}

function isOnPath(px, py) {
  const half = LEVELS[level - 1].pathWidth / 2 + TOLERANCE;
  for (const pt of LEVELS[level - 1].path) {
    if (dist(px, py, pt.x, pt.y) <= half) return true;
  }
  return false;
}

function hitsObstacle(px, py) {
  for (const o of LEVELS[level - 1].obstacles) {
    const { cx, cy } = obstaclePos(o, obsTime);
    if (o.type === 'rect') {
      const hw = o.w / 2, hh = o.h / 2;
      if (px > cx - hw - RING_R + 5 && px < cx + hw + RING_R - 5 &&
          py > cy - hh - RING_R + 5 && py < cy + hh + RING_R - 5) return true;
    } else {
      if (dist(px, py, cx, cy) < o.r + RING_R - 5) return true;
    }
  }
  return false;
}

// ── 粒子 ──────────────────────────────────────────
function spawnParticles(x, y, col, count, type) {
  for (let i = 0; i < count; i++) {
    const angle = random(TWO_PI);
    const spd = type === 'spark' ? random(2, 7) : random(1, 4);
    particles.push({
      x, y,
      vx: cos(angle) * spd, vy: sin(angle) * spd,
      life: 1.0,
      decay: type === 'spark' ? random(0.03, 0.06) : random(0.015, 0.03),
      r: type === 'spark' ? random(2, 4) : random(3, 6),
      col,
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.life -= p.decay;
  }
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  noStroke();
  for (const p of particles) {
    fill(p.col[0], p.col[1], p.col[2], p.life * 255);
    circle(p.x, p.y, p.r * 2 * p.life);
  }
}

// ── 軌跡 ──────────────────────────────────────────
function updateTrail() {
  trail.push({ x: ring.x, y: ring.y, life: 1.0 });
  if (trail.length > 20) trail.shift();
  for (const t of trail) t.life -= 0.055;
  trail = trail.filter(t => t.life > 0);
}

function drawTrail() {
  noStroke();
  for (const t of trail) {
    fill(0, 220, 255, t.life * 90);
    circle(t.x, t.y, RING_R * t.life * 1.2);
  }
}

// ── 畫面元件 ──────────────────────────────────────
function drawGrid() {
  stroke(0, 200, 255, 10);
  strokeWeight(1);
  for (let x = 0; x < W; x += 40) line(x, 0, x, H);
  for (let y = 0; y < H; y += 40) line(0, y, W, y);
}
function drawHeart(x, y, size, active = true) {
  push();
  translate(x, y);
  scale(size / 20);
  noStroke();
  if (active) fill(255, 80, 80);
  else fill(120, 40, 40); // 非啟用時顏色較暗
  beginShape();
  vertex(0, 0);
  bezierVertex(-10, -10, -20, 10, 0, 20);
  bezierVertex(20, 10, 10, -10, 0, 0);
  endShape(CLOSE);
  pop();
}
function drawPath() {
  const lv = LEVELS[level - 1];
  const path = lv.path;
  const [r, g, b] = lv.color;

  noFill();
  strokeCap(ROUND); strokeJoin(ROUND);

  stroke(r, g, b, 28); strokeWeight(lv.pathWidth + 16);
  beginShape(); for (const pt of path) vertex(pt.x, pt.y); endShape();

  // 改為較淺的邊緣顏色（由原本較深的 20,20,50 改為較亮的 70,70,120）
  stroke(70, 70, 120); strokeWeight(lv.pathWidth);
  beginShape(); for (const pt of path) vertex(pt.x, pt.y); endShape();

  stroke(r, g, b, 160); strokeWeight(2);
  beginShape(); for (const pt of path) vertex(pt.x, pt.y); endShape();

  // 起點
  const s = path[0];
  noStroke(); fill(0, 255, 136);
  circle(s.x, s.y, 22);
  fill(255); textAlign(CENTER, CENTER); textSize(10); textStyle(BOLD);
  text('S', s.x, s.y);

  // 終點
  const e = path[path.length - 1];
  const pulse = sin(frameCount * 0.08) * 15;
  fill(255, 140 + pulse, 0);
  circle(e.x, e.y, 26);
  fill(255); textSize(10); text('E', e.x, e.y);
  textStyle(NORMAL);
}

function drawObstacles() {
  for (const o of LEVELS[level - 1].obstacles) {
    const { cx, cy } = obstaclePos(o, obsTime);
    fill(220, 40, 40);
    stroke(255, 120, 120);
    strokeWeight(2);
    drawingContext.shadowColor = 'rgba(255,60,60,0.6)';
    drawingContext.shadowBlur = 10;
    if (o.type === 'rect') {
      rect(cx - o.w / 2, cy - o.h / 2, o.w, o.h, 4);
    } else {
      circle(cx, cy, o.r * 2);
    }
    drawingContext.shadowBlur = 0;
  }
}

function drawRing() {
  const t = frameCount * 0.08;
  noFill();

  stroke(0, 220, 255, 55 + sin(t) * 35);
  strokeWeight(1.5);
  circle(ring.x, ring.y, (RING_R + 8 + sin(t) * 3) * 2);

  stroke(0, 229, 255);
  strokeWeight(3);
  drawingContext.shadowColor = 'rgba(0,229,255,0.8)';
  drawingContext.shadowBlur = 14;
  circle(ring.x, ring.y, RING_R * 2);
  drawingContext.shadowBlur = 0;

  noStroke(); fill(255);
  circle(ring.x, ring.y, 6);

  stroke(100, 220, 255, 180 + random(-60, 60));
  strokeWeight(2);
  for (let i = 0; i < 3; i++) {
    const angle = sparkAngle + i * TWO_PI / 3;
    point(ring.x + cos(angle) * (RING_R + 2), ring.y + sin(angle) * (RING_R + 2));
  }
}

// ── 等待提示 ──────────────────────────────────────
function drawWaitingPrompt() {
  const lv = LEVELS[level - 1];
  const start = lv.path[0];
  const [r, g, b] = lv.color;

  const pulse = sin(frameCount * 0.07) * 0.5 + 0.5;

  // 起點呼吸光圈
  noFill();
  stroke(0, 255, 136, pulse * 180); strokeWeight(2);
  circle(start.x, start.y, START_SNAP_R * 2 + pulse * 20);
  stroke(0, 255, 136, pulse * 70); strokeWeight(1);
  circle(start.x, start.y, START_SNAP_R * 2 + pulse * 46);

  // 跳動箭頭
  const arrowX = start.x;
  const arrowY = start.y - 60 - pulse * 10;
  noStroke(); fill(0, 255, 136);
  triangle(arrowX, arrowY + 22, arrowX - 12, arrowY, arrowX + 12, arrowY);
  rect(arrowX - 4, arrowY - 18, 8, 20, 2);

  // 提示文字框
  const bx = W / 2, by = 38;
  fill(10, 10, 26, 210);
  stroke(r, g, b, 120); strokeWeight(1);
  rectMode(CENTER); rect(bx, by, 420, 50, 10); rectMode(CORNER);

  noStroke(); fill(255);
  textAlign(CENTER, CENTER); textSize(15); textStyle(BOLD);
  text('請將滑鼠移到起點 S，停留 1.5 秒後開始', bx, by - 7);
  textStyle(NORMAL); textSize(12); fill(180);
  text(`Level ${level} ／ ${lv.name}（${lv.diff}）　每關 ❤❤❤ 三條命`, bx, by + 13);

  // 滑鼠游標預覽
  const d = dist(mouseX, mouseY, start.x, start.y);
  const prox = constrain(1 - d / 130, 0, 1);
  noFill();
  stroke(0, 229, 255, 80 + prox * 160); strokeWeight(2);
  circle(mouseX, mouseY, RING_R * 2);
  noStroke(); fill(255, 255, 255, 80 + prox * 160);
  circle(mouseX, mouseY, 5);
}

// ── HUD ───────────────────────────────────────────
function drawPlayingHUD() {
  const lv = LEVELS[level - 1];
  const [r, g, b] = lv.color;

  noStroke(); fill(r, g, b, 200);
  textAlign(LEFT, TOP); textSize(13); textStyle(BOLD);
  text(`Level ${level}/${LEVELS.length}：${lv.name}`, 14, 12);
  textStyle(NORMAL);

  textAlign(RIGHT, TOP); fill(200); textSize(13);
  text(`${elapsed.toFixed(1)} 秒`, W - 14, 12);

  // 命數圓點（居中），使用 drawHeart 的 active 參數正確顯示
  for (let i = 0; i < 3; i++) {
    const active = i < lives;
    drawHeart(W / 2 - 30 + i * 30, 16, 18, active);
  }
}

// ── 選單 ──────────────────────────────────────────
function drawMenu() {
  const pts = LEVELS[0].path;
  noFill(); stroke(0, 212, 255, 20); strokeWeight(40);
  beginShape(); for (const pt of pts) vertex(pt.x, pt.y); endShape();

  noStroke(); textAlign(CENTER, CENTER);
  fill(0, 229, 255); textSize(40); textStyle(BOLD);
  drawingContext.shadowColor = 'rgba(0,229,255,0.6)';
  drawingContext.shadowBlur = 22;
  text('電流急急棒', W / 2, H / 2 - 90);
  drawingContext.shadowBlur = 0; textStyle(NORMAL);

  fill(180); textSize(15);
  text('用滑鼠引導光環通過電流通道', W / 2, H / 2 - 35);
  text('碰到邊界或障礙物即告失敗，每關三條命', W / 2, H / 2 - 8);
  text('共 5 個關卡，難度逐漸提升', W / 2, H / 2 + 18);

  const pulse = sin(frameCount * 0.06) * 0.3 + 0.7;
  fill(0, 255, 136, pulse * 255); textSize(18); textStyle(BOLD);
  text('點擊畫面開始遊戲', W / 2, H / 2 + 65);
  textStyle(NORMAL);
}

// ── 過關 ──────────────────────────────────────────
function drawSuccessScreen() {
  fill(0, 10, 30, 170); noStroke(); rect(0, 0, W, H);
  textAlign(CENTER, CENTER);

  const gv = sin(frameCount * 0.07) * 20;
  fill(0, 200 + gv, 100); textSize(40); textStyle(BOLD);
  drawingContext.shadowColor = '#00ff88'; drawingContext.shadowBlur = 22;
  text(`Level ${level} 通過！`, W / 2, H / 2 - 45);
  drawingContext.shadowBlur = 0; textStyle(NORMAL);

  fill(200); textSize(16);
  text(`用時 ${elapsed.toFixed(1)} 秒`, W / 2, H / 2 + 5);

  const pulse = sin(frameCount * 0.07) * 0.3 + 0.7;
  fill(255, 255, 255, pulse * 255); textSize(16);
  text('點擊畫面進入下一關 →', W / 2, H / 2 + 44);
}

// ── 失敗 ──────────────────────────────────────────
function drawFailScreen() {
  fill(30, 0, 0, 170); noStroke(); rect(0, 0, W, H);
  textAlign(CENTER, CENTER);

  const pulse = sin(frameCount * 0.08) * 15;
  fill(255, 60 + pulse, 60); textSize(40); textStyle(BOLD);
  drawingContext.shadowColor = '#ff3333'; drawingContext.shadowBlur = 22;
  text('⚡ 觸電了！', W / 2, H / 2 - 55);
  drawingContext.shadowBlur = 0; textStyle(NORMAL);

  fill(200); textSize(16);
  if (lives > 0) {
    text(`本關剩餘命數：${lives}　點擊重試`, W / 2, H / 2);
  } else {
    text('本關命數耗盡！點擊從本關重新開始（三條命）', W / 2, H / 2);
  }

  // 命數預覽
  for (let i = 0; i < 3; i++) {
    if (i < lives) fill(255, 80, 80);
    else fill(80, 25, 25);
    noStroke();
    circle(W / 2 - 22 + i * 22, H / 2 + 38, 14);
  }
}

// ── 全通關 ────────────────────────────────────────
function drawCompleteScreen() {
  fill(0, 10, 30, 200); noStroke(); rect(0, 0, W, H);
  textAlign(CENTER, CENTER);

  colorMode(HSB, 360, 100, 100);
  fill(frameCount % 360, 80, 100);
  colorMode(RGB, 255);
  textSize(38); textStyle(BOLD);
  text('🎉 全關通關！', W / 2, H / 2 - 55);
  textStyle(NORMAL);

  fill(220); textSize(16);
  text(`恭喜完成所有 ${LEVELS.length} 個關卡！`, W / 2, H / 2 - 5);

  const pulse = sin(frameCount * 0.06) * 0.3 + 0.7;
  fill(255, 255, 255, pulse * 255); textSize(15);
  text('點擊畫面重新挑戰', W / 2, H / 2 + 38);

  if (frameCount % 8 === 0) {
    spawnParticles(random(W), random(H / 3), [random(255), random(255), 255], 8, 'star');
  }
}

// ── 點擊 ──────────────────────────────────────────
function mousePressed() {
  if (gameState === 'menu') {
    LEVELS = buildLevels();
    for (let lv of LEVELS) {
      centerLevel(lv);
    }
    resetGame();
    return;
  }
  if (gameState === 'success') {
    level++;
    gotoLevel();   // 進入下一關，lives 在 gotoLevel() 內重置為 3
    return;
  }
  if (gameState === 'fail') {
    if (lives <= 0) lives = 3;  // 命數耗盡：重置三命再重試本關
    retryLevel();               // 重試本關，保留已扣命數
    return;
  }
  if (gameState === 'complete') {
    level = 1;
    LEVELS = buildLevels();
    for (let lv of LEVELS) {
      centerLevel(lv);
    }
    resetGame();
    return;
  }
}

// 滑鼠移動時在 waiting 狀態即時偵測
function mouseMoved()   { checkEnterStart(); }
function mouseDragged() { checkEnterStart(); }