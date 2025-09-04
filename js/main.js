"use strict";


// ==========================
// 1) ชุดรูปตัวอย่าง (เปลี่ยน/เพิ่มได้)
// ใช้ไฟล์ในโฟลเดอร์เดียวกัน เช่น images/cat.jpg แล้วแก้ path ด้านล่าง
// answer: ใส่คำตอบหลายภาษา/หลายแบบได้
// hints: ใบ้ทีละบรรทัด

const pool = [
  {
    src: "../img/img1.jpg",
    answer: ["โบสถ์ไม้สักทอง", "วัดเขาย้อย"],
    hints: [
      "ทุกคนไปต้องกราบไหว้",
      "บวช",
      "มีสีทองอร่าม",
      "ข้างในมีพระพุทธรูป",
      "ติดภูเขา",
      "เฉลยนะ วัดเขาย้อย โบสถ์ไม้สักทอง",
    ],
  },
  {
    src: "../img/img2.jpg",
    answer: ["ไททรงดำ", "ไททรงดำ"],
    hints: [
      "ศูนย์วัฒนธรรม",
      "เครื่องแต่งกายเฉพาะ",
      "สืบทอดตั้งแต่โบราณ",
      "softpower",
      "softpower",
      "softpower",
    ],
  },
  {
    src: "../img/img3.jpg",
    answer: ["การะแม", "การะแม"],
    hints: [
      "ของเรื่องชื่อของเขาย้อย",
      "ของเรื่องชื่อของเขาย้อย",
      "ทานได้",
      "ทานได้",
      "เป็นขนม",
      "เป็นขนม",
    ],
  },
];

const $ = (sel) => document.querySelector(sel);
const imgEl = $("#img");
const maskEl = $("#mask");
const blurEl = $("#blur");
const hintText = $("#hintText");

const tilesLeftEl = $("#tilesLeft");
const scoreEl = $("#score");
const accEl = $("#acc");
const streakEl = $("#streak");
const roundPill = $("#roundPill");
const difficultySelect = $("#difficulty");

const guessInput = $("#guessInput");
const btnGuess = $("#btnGuess");
const btnHint = $("#btnHint");
const btnReveal = $("#btnReveal");
const btnReset = $("#btnReset");
const btnSkip = $("#btnSkip");
const btnAddImages = $("#btnAddImages");
const fileInput = $("#fileInput");

let state = {
  idx: 0,
  round: 0,
  answered: 0,
  correct: 0,
  score: 0,
  streak: 0,
  blur: 18,
  tiles: [],
  tilesClosed: 0,
  difficulty: "normal",
  revealedHints: 0,
};

const DIFF = {
  easy: { grid: 6, blur: 14, revealPerHint: 10 },
  normal: { grid: 8, blur: 18, revealPerHint: 12 },
  hard: { grid: 10, blur: 22, revealPerHint: 15 },
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\u200b]+/g, " ");
}

function pickNextIndex() {
  state.idx = (state.idx + 1) % pool.length;
  return state.idx;
}

function setDifficulty(d) {
  state.difficulty = d;
}

function setupMask() {
  const { grid, blur } = DIFF[state.difficulty];
  state.blur = blur;
  blurEl.style.setProperty("--blur", blur + "px");

  maskEl.innerHTML = "";
  maskEl.style.gridTemplateColumns = `repeat(${grid}, 1fr)`;
  maskEl.style.gridTemplateRows = `repeat(${grid}, 1fr)`;

  const total = grid * grid;
  state.tiles = Array.from({ length: total }, (_, i) => i);
  shuffle(state.tiles);
  state.tilesClosed = total;

  for (let i = 0; i < total; i++) {
    const cell = document.createElement("div");
    cell.dataset.i = i;
    maskEl.appendChild(cell);
  }
  tilesLeftEl.textContent = state.tilesClosed;
  document.getElementById("difficultyLabel").textContent =
    state.difficulty === "easy"
      ? "ง่าย"
      : state.difficulty === "hard"
      ? "ยาก"
      : "ปกติ";
}

function revealTiles(n = 8) {
  for (let k = 0; k < n; k++) {
    const i = state.tiles.pop();
    if (i === undefined) return;
    const cell = maskEl.querySelector(`[data-i="${i}"]`);
    if (cell) {
      cell.style.visibility = "hidden";
      state.tilesClosed--;
    }
  }
  tilesLeftEl.textContent = state.tilesClosed;
}

function reduceBlur(px = 3) {
  state.blur = Math.max(0, state.blur - px);
  blurEl.style.setProperty("--blur", state.blur + "px");
}

function loadRound(nextIndex) {
  state.round++;
  state.revealedHints = 0;
  roundPill.textContent = `รอบ ${state.round}`;
  const item = pool[nextIndex];
  imgEl.src = item.src;
  imgEl.onload = () => {
    /* ready */
  };
  setupMask();
  hintText.textContent = 'ใช้ปุ่ม "ใบ้" เพื่อเปิดช่อง/ลดความเบลอ';
  guessInput.value = "";
  guessInput.focus();
}

function checkAnswer() {
  const item = pool[state.idx];
  const g = normalize(guessInput.value);
  if (!g) return;
  const ok = item.answer.some((a) => normalize(a) === g);
  state.answered++;
  if (ok) {
    const base = 100;
    const bonus =
      Math.max(0, 50 - state.blur * 2) + Math.max(0, 40 - state.tilesClosed);
    const pts = base + bonus + state.streak * 10;
    state.score += pts;
    state.correct++;
    state.streak++;
    toast(`✅ ถูกต้อง! +${pts} คะแนน`);
    revealAll();
    updateStats();
    setTimeout(() => nextRound(), 2500); // Set time to show image when the user answer correct answer
  } else {
    state.streak = 0;
    toast("❌ ยังไม่ใช่ ลองใหม่/กดใบ้ดู");
    updateStats();
  }
}

function updateStats() {
  scoreEl.textContent = state.score;
  accEl.textContent = `${state.correct}/${state.answered}`;
  streakEl.textContent = state.streak;
}

function revealAll() {
  maskEl
    .querySelectorAll("div")
    .forEach((d) => (d.style.visibility = "hidden"));
  tilesLeftEl.textContent = 0;
  blurEl.style.setProperty("--blur", "0px");
}

function nextRound() {
  const i = pickNextIndex();
  loadRound(i);
}

function giveHint() {
  const item = pool[state.idx];
  const per = DIFF[state.difficulty].revealPerHint;
  revealTiles(per);
  reduceBlur(4);
  if (state.revealedHints < item.hints.length) {
    hintText.textContent = "ใบ้: " + item.hints[state.revealedHints++];
  } else {
    hintText.textContent = "ใบ้: เปิดภาพเพิ่มให้แล้ว!";
  }
}

function skip() {
  toast("⏭️ ข้ามรอบ");
  state.answered++;
  state.streak = 0;
  updateStats();
  nextRound();
}

function reveal() {
  const item = pool[state.idx];
  toast("🔎 เฉลย: " + (item.answer[0] || ""));
  revealAll();
  state.answered++;
  updateStats();
  setTimeout(() => nextRound(), 1100);
}

function resetAll() {
  state = {
    idx: -1,
    round: 0,
    answered: 0,
    correct: 0,
    score: 0,
    streak: 0,
    blur: 18,
    tiles: [],
    tilesClosed: 0,
    difficulty: state.difficulty,
    revealedHints: 0,
  };
  updateStats();
  pickNextIndex();
  loadRound(state.idx);
  toast("🔄 เริ่มใหม่แล้ว");
}

// Simple toast
let toastTimer;
function toast(msg) {
  clearTimeout(toastTimer);
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.top = "16px";
    t.style.transform = "translateX(-50%)";
    t.style.background = "rgba(0,0,0,.75)";
    t.style.color = "white";
    t.style.padding = "10px 14px";
    t.style.borderRadius = "12px";
    t.style.zIndex = "9999";
    t.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  toastTimer = setTimeout(() => {
    t.style.opacity = "0";
  }, 1200);
}

// เพิ่มรูปจากผู้ใช้
btnAddImages.addEventListener("click", async () => {
  const files = Array.from(fileInput.files || []);
  if (!files.length) {
    toast("กรุณาเลือกไฟล์รูปก่อน");
    return;
  }
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const base = f.name.split(".")[0];
    // รองรับชื่อไฟล์ที่มีคำตอบหลายคำคั่นด้วย - หรือ _ เช่น cat-แมว
    const parts = base.split(/[-_]/g).filter(Boolean);
    pool.push({
      src: url,
      answer: parts.length ? parts : [base],
      hints: ["อัปโหลดโดยผู้เล่น"],
    });
  }
  toast("✅ เพิ่มรูปเข้าชุดแล้ว " + files.length + " รูป");
  if (state.round === 0) {
    loadRound(state.idx);
  }
});

// EVENTS
btnGuess.addEventListener("click", checkAnswer);
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});
btnHint.addEventListener("click", giveHint);
btnReveal.addEventListener("click", reveal);
btnReset.addEventListener("click", resetAll);
btnSkip.addEventListener("click", skip);
difficultySelect.addEventListener("change", (e) => {
  setDifficulty(e.target.value);
  setupMask();
});

// INIT
setDifficulty("normal");
loadRound(0);
