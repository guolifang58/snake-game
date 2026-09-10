// ===== 获取页面元素 =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");

// ===== 游戏配置 =====
const gridSize = 20; // 每个格子的像素大小
const tileCount = canvas.width / gridSize; // 横向/纵向各有多少格(20x20)

// ===== 游戏状态 =====
let snake = []; // 蛇身坐标数组,第一个元素是蛇头
let food = { x: 0, y: 0 }; // 食物坐标
let direction = { x: 1, y: 0 }; // 当前移动方向(初始向右)
let nextDirection = { x: 1, y: 0 }; // 缓存下一次方向,防止一帧内反向
let score = 0;
let highScore = 0;
let gameLoop = null; // 定时器句柄
let speed = 150; // 每多少毫秒移动一步(越小越快)
let running = false; // 是否正在运行
let gameOver = false;

// ===== 初始化游戏 =====
function initGame() {
  // 蛇初始 3 节,位于中间,朝右
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 150;
  gameOver = false;
  scoreEl.textContent = "0";
  placeFood();
}

// ===== 随机放置食物(不能放在蛇身上) =====
function placeFood() {
  let valid = false;
  while (!valid) {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
    valid = !snake.some(function (part) {
      return part.x === food.x && part.y === food.y;
    });
  }
}

// ===== 每一帧的逻辑 =====
function update() {
  // 采用缓存的方向
  direction = nextDirection;

  // 计算蛇头新位置
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // 撞墙检测
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    endGame();
    return;
  }

  // 咬到自己检测
  if (snake.some(function (part) {
    return part.x === head.x && part.y === head.y;
  })) {
    endGame();
    return;
  }

  // 蛇头前进一节
  snake.unshift(head);

  // 是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore;
    }
    placeFood();
    // 每吃 3 个食物加速一点(最快 60ms)
    if (score % 30 === 0 && speed > 60) {
      speed -= 10;
      restartLoop();
    }
  } else {
    // 没吃到食物,尾巴移除(保持长度)
    snake.pop();
  }

  draw();
}

// ===== 绘制画面 =====
function draw() {
  // 清空背景
  ctx.fillStyle = "#0f1a2b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 画食物(红色圆点)
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 画蛇(每节一个圆角方块,蛇头颜色不同)
  snake.forEach(function (part, index) {
    ctx.fillStyle = index === 0 ? "#ffd93d" : "#4ecca3";
    ctx.fillRect(
      part.x * gridSize + 1,
      part.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2
    );
  });
}

// ===== 游戏结束 =====
function endGame() {
  running = false;
  gameOver = true;
  clearInterval(gameLoop);
  overlay.classList.remove("hidden");
  overlayTitle.textContent = "游戏结束!得分 " + score + " · 按空格重来";
  startBtn.textContent = "开始 / 暂停";
}

// ===== 重新开始游戏循环 =====
function restartLoop() {
  clearInterval(gameLoop);
  gameLoop = setInterval(update, speed);
}

// ===== 开始 / 暂停 =====
function togglePause() {
  if (gameOver) {
    startNewGame();
    return;
  }
  if (running) {
    running = false;
    clearInterval(gameLoop);
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "已暂停 · 按空格继续";
  } else {
    running = true;
    overlay.classList.add("hidden");
    restartLoop();
  }
}

// ===== 开新局 =====
function startNewGame() {
  initGame();
  running = true;
  overlay.classList.add("hidden");
  draw();
  restartLoop();
}

// ===== 键盘控制 =====
document.addEventListener("keydown", function (e) {
  const key = e.key.toLowerCase();

  // 空格:开始/暂停
  if (key === " " || e.code === "Space") {
    e.preventDefault();
    if (!running || gameOver) {
      if (gameOver) startNewGame();
      else togglePause();
    } else {
      togglePause();
    }
    return;
  }

  // 方向键 / WASD:改变移动方向(禁止 180 度掉头)
  if ((key === "arrowup" || key === "w") && direction.y === 0) {
    nextDirection = { x: 0, y: -1 };
  } else if ((key === "arrowdown" || key === "s") && direction.y === 0) {
    nextDirection = { x: 0, y: 1 };
  } else if ((key === "arrowleft" || key === "a") && direction.x === 0) {
    nextDirection = { x: -1, y: 0 };
  } else if ((key === "arrowright" || key === "d") && direction.x === 0) {
    nextDirection = { x: 1, y: 0 };
  }
});

// ===== 按钮事件 =====
startBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", startNewGame);

// ===== 页面加载完成:画初始画面 =====
initGame();
draw();
