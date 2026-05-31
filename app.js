// ─── app.js ──────────────────────────────────────────────────────────────────
import { db, ref, set, get, update, onValue } from "./firebase.js";
import {
  FAMILY, QUESTIONS, RCB_SQUAD, GT_SQUAD,
  rcbBatAR, rcbBowlAR, gtBatAR, gtBowlAR,
  scoreAll, calcPrizes, parseNum
} from "./data.js";

// ─── STATE ──────────────────────────────────────────────────────────────────
let me = null;           // { id, name, emoji }
let isAdmin = false;
let gs = {               // gameState from Firebase
  matchStatus: "pre",
  tossWinner: "",
  battingFirst: "",
  score: { gt:{runs:0,wickets:0,overs:0,status:""}, rcb:{runs:0,wickets:0,overs:0,status:""} },
  actuals: {},
};
let allPreds = {};       // { playerId: { qId: val } }
let localPreds = {};     // working predictions for current user
let scored = [];         // output of scoreAll(), refreshed on Firebase changes

// Modal state
let modalQid = null;
let modalSelected = null; // { name, team }
let modalFilter = "all";

// ─── FIREBASE LISTENERS ──────────────────────────────────────────────────────
onValue(ref(db, "gameState"), snap => {
  if (snap.exists()) gs = { ...gs, ...snap.val() };
  renderMiniScoreBar();
  renderLiveCard();
  updatePredictLockUI();
  recomputeAndRender();
  if (document.getElementById("s-admin").classList.contains("active")) syncAdminFields();
  updateHeroBadge();
});

onValue(ref(db, "predictions"), snap => {
  allPreds = snap.exists() ? snap.val() : {};
  recomputeAndRender();
  if (document.getElementById("s-admin").classList.contains("active")) renderAdminPlayerStatus();
});

function recomputeAndRender() {
  scored = scoreAll(allPreds, gs.actuals || {});
  if (document.getElementById("s-dash").classList.contains("active")) {
    renderLeaderboard();
    renderMyPicks();
    renderAllPicks();
  }
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0,0);
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildNameGrid();
  buildPredictForm();
  buildAdminResultsForm();
  setupListeners();
});

// ─── NAME GRID ───────────────────────────────────────────────────────────────
function buildNameGrid() {
  const g = document.getElementById("name-grid");
  g.innerHTML = "";
  FAMILY.forEach(p => {
    const b = document.createElement("button");
    b.className = "name-btn";
    b.innerHTML = `<span class="nb-emoji">${p.emoji}</span>${p.name}`;
    b.addEventListener("click", () => enterAsPlayer(p));
    g.appendChild(b);
  });
}

function updateHeroBadge() {
  const el = document.getElementById("hero-toss-badge");
  if (!el) return;
  if (gs.tossWinner) {
    el.textContent = `🪙 Toss: ${gs.tossWinner} won · ${gs.battingFirst||"?"} batting`;
    el.style.display = "inline-block";
  } else {
    el.style.display = "none";
  }
}

function enterAsPlayer(p) {
  me = p; isAdmin = false;
  localPreds = { ...(allPreds[p.id] || {}) };
  show("s-predict");
  document.getElementById("predict-title").textContent = `${p.emoji} ${p.name}`;
  refreshPredictForm();
  updatePredictLockUI();
  renderMiniScoreBar();
}

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────
document.getElementById("btn-open-admin-login").addEventListener("click", () => {
  show("s-admin-login");
  document.getElementById("admin-pw").value = "";
  document.getElementById("admin-err").classList.add("hidden");
});
document.getElementById("btn-back-admin-login").addEventListener("click", () => show("s-name"));
document.getElementById("btn-back-admin").addEventListener("click", () => show("s-name"));
document.getElementById("btn-back-predict").addEventListener("click", () => show("s-name"));
document.getElementById("btn-back-dash").addEventListener("click", () => show("s-name"));

function tryAdminLogin() {
  if (document.getElementById("admin-pw").value === "1234") {
    isAdmin = true; me = { id:"admin", name:"Admin", emoji:"⚙️" };
    show("s-admin");
    syncAdminFields();
    renderAdminPlayerStatus();
  } else {
    document.getElementById("admin-err").classList.remove("hidden");
  }
}
document.getElementById("btn-admin-go").addEventListener("click", tryAdminLogin);
document.getElementById("admin-pw").addEventListener("keydown", e => { if(e.key==="Enter") tryAdminLogin(); });

// ─── PREDICTION FORM BUILD ────────────────────────────────────────────────────
function buildPredictForm() {
  const wrap = document.getElementById("predict-content");
  wrap.innerHTML = "";
  let lastSection = null;

  QUESTIONS.forEach((q, idx) => {
    // Section label
    if (q.section && q.section !== lastSection) {
      lastSection = q.section;
      const sl = document.createElement("div");
      sl.className = "section-label";
      sl.textContent = q.section;
      wrap.appendChild(sl);
    }

    const card = document.createElement("div");
    card.className = "q-card";
    card.id = `qcard-${q.id}`;

    card.innerHTML = `
      <div class="q-head">
        <span class="q-num">${idx+1}</span>
        <div class="q-info">
          <div class="q-label">${q.label}</div>
          ${q.hint ? `<div class="q-hint">${q.hint}</div>` : ""}
        </div>
        <span class="q-pts">+${q.pts}pts</span>
      </div>
      <div class="q-body" id="qbody-${q.id}"></div>
    `;
    wrap.appendChild(card);
    renderQBody(q);
  });
}

function renderQBody(q) {
  const body = document.getElementById(`qbody-${q.id}`);
  if (!body) return;
  const val = localPreds[q.id];

  if (q.type === "team") {
    body.innerHTML = `
      <div class="team-cards">
        <div class="team-card rcb-card ${val==="RCB"?"selected":""}" data-qid="${q.id}" data-val="RCB">
          <div class="tc-flag">🔴</div>
          <div class="tc-short rcb-color">RCB</div>
          <div class="tc-full">Royal Challengers<br>Bengaluru</div>
        </div>
        <div class="team-card gt-card ${val==="GT"?"selected":""}" data-qid="${q.id}" data-val="GT">
          <div class="tc-flag">🔵</div>
          <div class="tc-short gt-color">GT</div>
          <div class="tc-full">Gujarat<br>Titans</div>
        </div>
      </div>`;
    body.querySelectorAll(".team-card").forEach(tc => {
      tc.addEventListener("click", () => {
        localPreds[q.id] = tc.dataset.val;
        renderQBody(q);
        markAnswered(q.id);
        updateProgress();
        // Re-render margin if winner changed
        const mq = QUESTIONS.find(x => x.id === "q_margin");
        if (q.id === "q_winner" && mq) renderQBody(mq);
      });
    });

  } else if (q.type === "margin") {
    const winner = localPreds["q_winner"] || "";
    const marginType = localPreds[`${q.id}_type`] || "runs";
    const marginVal  = localPreds[q.id] !== undefined ? localPreds[q.id] : 10;
    body.innerHTML = `
      ${winner ? `<div class="q-hint" style="margin-bottom:10px;">${winner} wins by…</div>` : `<div class="q-hint" style="margin-bottom:10px;">Pick Match Winner first, then set margin</div>`}
      <div class="margin-type-row">
        <button class="margin-type-btn ${marginType==="runs"?"sel":""}" data-mt="runs">🏏 Runs</button>
        <button class="margin-type-btn ${marginType==="wickets"?"sel":""}" data-mt="wickets">🎯 Wickets</button>
      </div>
      ${buildNumStepper(q.id, marginVal, 1, 150, marginType==="runs"?"runs":"wickets")}
    `;
    body.querySelectorAll(".margin-type-btn").forEach(b => {
      b.addEventListener("click", () => {
        localPreds[`${q.id}_type`] = b.dataset.mt;
        renderQBody(q);
      });
    });
    attachStepperListeners(body, q.id, 1, 150);

  } else if (q.type === "player") {
    const picked = val ? findPlayer(val) : null;
    body.innerHTML = `
      <button class="player-pick-btn ${picked?"picked":""}" data-qid="${q.id}">
        <span class="ppb-icon">${picked ? (picked.team==="RCB"?"🔴":"🔵") : "🙋"}</span>
        <span class="ppb-text">
          ${picked
            ? `<div class="ppb-name">${picked.name}</div><div class="ppb-team">${picked.team} · ${picked.roleLabel}</div>`
            : `<div class="ppb-name" style="color:var(--t2)">Tap to select player</div>`}
        </span>
        <span class="ppb-arrow">›</span>
      </button>`;
    body.querySelector(".player-pick-btn").addEventListener("click", () => openModal(q));

  } else if (q.type === "number") {
    const v = val !== undefined ? val : q.default;
    body.innerHTML = buildNumStepper(q.id, v, q.min, q.max, "");
    attachStepperListeners(body, q.id, q.min, q.max);

  } else if (q.type === "bowling") {
    const bwls = val ? val.split("/") : ["3","24"];
    const wkts = parseInt(bwls[0]) || 3;
    const runs  = parseInt(bwls[1]) || 24;
    const bowlerPicked = localPreds[`${q.id}_bowler`] ? findPlayer(localPreds[`${q.id}_bowler`]) : null;
    body.innerHTML = `
      <button class="player-pick-btn ${bowlerPicked?"picked":""}" data-qid="${q.id}_bowler" style="margin-bottom:12px;">
        <span class="ppb-icon">${bowlerPicked ? (bowlerPicked.team==="RCB"?"🔴":"🔵") : "🎯"}</span>
        <span class="ppb-text">
          ${bowlerPicked
            ? `<div class="ppb-name">${bowlerPicked.name}</div><div class="ppb-team">${bowlerPicked.team}</div>`
            : `<div class="ppb-name" style="color:var(--t2)">Select bowler (optional)</div>`}
        </span>
        <span class="ppb-arrow">›</span>
      </button>
      <div class="bowling-row">
        <div>
          <div class="bowling-sub-label">Wickets</div>
          ${buildNumStepper(`${q.id}_w`, wkts, 0, 10, "wkts")}
        </div>
        <div>
          <div class="bowling-sub-label">Runs Given</div>
          ${buildNumStepper(`${q.id}_r`, runs, 0, 99, "runs")}
        </div>
      </div>`;
    body.querySelector(`[data-qid="${q.id}_bowler"]`).addEventListener("click", () => openModal(q, "bowlAR", true));
    attachStepperListeners(body, `${q.id}_w`, 0, 10, () => syncBowling(q.id));
    attachStepperListeners(body, `${q.id}_r`, 0, 99, () => syncBowling(q.id));
  }
}

function syncBowling(qid) {
  const w = localPreds[`${qid}_w`] !== undefined ? localPreds[`${qid}_w`] : 3;
  const r = localPreds[`${qid}_r`] !== undefined ? localPreds[`${qid}_r`] : 24;
  localPreds[qid] = `${w}/${r}`;
  markAnswered(qid);
  updateProgress();
}

// Stepper builder
function buildNumStepper(id, val, min, max, unit) {
  return `
    <div class="num-stepper" id="stepper-${id}">
      <button class="ns-btn big" data-sid="${id}" data-dir="-10">−10</button>
      <button class="ns-btn" data-sid="${id}" data-dir="-1">−</button>
      <input class="ns-input" id="nsinput-${id}" type="number" value="${val}" min="${min}" max="${max}"/>
      <button class="ns-btn" data-sid="${id}" data-dir="1">+</button>
      <button class="ns-btn big" data-sid="${id}" data-dir="10">+10</button>
    </div>
    ${unit ? `<div class="ns-label">${unit}</div>` : ""}
  `;
}

function attachStepperListeners(body, id, min, max, onChangeCb) {
  const getInp = () => document.getElementById(`nsinput-${id}`);
  body.querySelectorAll(`[data-sid="${id}"]`).forEach(btn => {
    btn.addEventListener("click", () => {
      const inp = getInp(); if (!inp) return;
      let v = parseInt(inp.value)||0;
      v = Math.max(min, Math.min(max, v + parseInt(btn.dataset.dir)));
      inp.value = v;
      localPreds[id] = v;
      if (onChangeCb) onChangeCb(); else { markAnswered(id.split("_")[0]+"_"+id.split("_")[1]); updateProgress(); }
    });
    // long-press repeat
    let timer, interval;
    btn.addEventListener("pointerdown", () => {
      timer = setTimeout(() => {
        interval = setInterval(() => btn.click(), 80);
      }, 400);
    });
    ["pointerup","pointerleave"].forEach(e => btn.addEventListener(e, () => { clearTimeout(timer); clearInterval(interval); }));
  });
  // Direct typing
  const inp = getInp();
  if (inp) {
    inp.addEventListener("input", () => {
      let v = parseInt(inp.value);
      if (isNaN(v)) return;
      v = Math.max(min, Math.min(max, v));
      inp.value = v;
      localPreds[id] = v;
      if (onChangeCb) onChangeCb(); else { updateProgress(); }
    });
    inp.addEventListener("focus", () => inp.select());
  }
}

function refreshPredictForm() {
  QUESTIONS.forEach(q => {
    renderQBody(q);
    markAnswered(q.id, true);
  });
  updateProgress();
}

function markAnswered(qid, silent) {
  const card = document.getElementById(`qcard-${qid}`);
  if (!card) return;
  const val = localPreds[qid];
  const has = val !== undefined && val !== null && val !== "";
  card.classList.toggle("answered", has);
  if (!silent) card.classList.remove("error-highlight");
}

function updateProgress() {
  let done = 0;
  QUESTIONS.forEach(q => {
    const v = localPreds[q.id];
    if (v !== undefined && v !== null && v !== "") done++;
  });
  const pct = Math.round((done / QUESTIONS.length) * 100);
  document.getElementById("progress-bar").style.setProperty("--pct", pct+"%");
  document.getElementById("progress-label").textContent = `${done} / ${QUESTIONS.length}`;
}

function updatePredictLockUI() {
  const locked = gs.matchStatus !== "pre";
  document.getElementById("submit-area").classList.toggle("hidden", locked);
  document.getElementById("locked-banner").classList.toggle("hidden", !locked);
  const chip = document.getElementById("predict-lock-chip");
  chip.textContent = locked ? "🔒 Locked" : "✅ Open";
  chip.className = "lock-chip " + (locked ? "locked" : "open");
  // Disable interactivity
  document.querySelectorAll("#predict-content button, #predict-content input").forEach(el => {
    el.disabled = locked;
  });
}

// ─── MINI SCORE BAR ───────────────────────────────────────────────────────────
function renderMiniScoreBar() {
  const bar = document.getElementById("mini-score-bar");
  if (!bar) return;
  const { score, matchStatus, battingFirst } = gs;
  const gt = score?.gt || {};
  const rcb = score?.rcb || {};

  const fmtScore = (t) =>
    (t.runs !== undefined && t.runs !== null)
      ? `${t.runs}/${t.wickets??0} (${t.overs??0})`
      : "—";

  const statusMap = { pre:"pre", live:"live", completed:"done" };
  const statusLabel = { pre:"Pre-Match", live:"● LIVE", completed:"Done" };

  bar.innerHTML = `
    <span class="msb-team rcb-color">RCB</span>
    <span class="msb-score msb-rcb">${fmtScore(rcb)}</span>
    <span class="msb-sep">·</span>
    <span class="msb-team gt-color">GT</span>
    <span class="msb-score msb-gt">${fmtScore(gt)}</span>
    ${battingFirst ? `<span class="msb-sep">·</span><span style="font-size:.72rem;color:var(--t3)">${battingFirst} batting 1st</span>` : ""}
    <span class="msb-status ${statusMap[matchStatus]||"pre"}">${statusLabel[matchStatus]||"Pre-Match"}</span>
  `;
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
document.getElementById("btn-submit").addEventListener("click", async () => {
  if (!me || gs.matchStatus !== "pre") return;

  // Validate all answered
  const missing = [];
  QUESTIONS.forEach(q => {
    const v = localPreds[q.id];
    const empty = v === undefined || v === null || v === "";
    const card = document.getElementById(`qcard-${q.id}`);
    if (empty) {
      missing.push(q.id);
      card?.classList.add("error-highlight");
      setTimeout(() => card?.classList.remove("error-highlight"), 1500);
    }
  });
  if (missing.length) {
    showToast(`⚠️ ${missing.length} question${missing.length>1?"s":""} unanswered — highlighted in red!`);
    // scroll to first missing
    const first = document.getElementById(`qcard-${missing[0]}`);
    first?.scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }

  try {
    // Store margin type alongside value
    const toSave = { ...localPreds };
    await set(ref(db, `predictions/${me.id}`), toSave);
    showToast("🚀 Predictions locked in!");
    setTimeout(() => showDash(), 600);
  } catch(e) {
    showToast("❌ Save failed, try again");
    console.error(e);
  }
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function showDash() {
  show("s-dash");
  document.getElementById("dash-title").textContent = me ? `${me.emoji} ${me.name}` : "Dashboard";
  renderLiveCard();
  recomputeAndRender();
}
document.getElementById("btn-refresh").addEventListener("click", recomputeAndRender);

// ─── LIVE CARD ────────────────────────────────────────────────────────────────
function renderLiveCard() {
  const { score, matchStatus, battingFirst, actuals } = gs;
  const gt = score?.gt || {};
  const rcb = score?.rcb || {};

  const fmtS = (t) =>
    (t.runs !== undefined && t.runs !== null) ? `${t.runs}/${t.wickets??0}` : "—";
  document.getElementById("lc-gt-score").textContent = fmtS(gt);
  document.getElementById("lc-gt-ov").textContent = gt.overs !== undefined ? `(${gt.overs} ov)` : "";
  document.getElementById("lc-rcb-score").textContent = fmtS(rcb);
  document.getElementById("lc-rcb-ov").textContent = rcb.overs !== undefined ? `(${rcb.overs} ov)` : "";

  const statusEl = document.getElementById("lc-status");
  const map = { pre:["pre","🟡 Pre-Match · Predictions Open"], live:["live","🔴 LIVE"], completed:["completed","✅ Match Complete"] };
  const [cls, txt] = map[matchStatus] || map.pre;
  statusEl.className = "lc-status " + cls;
  statusEl.textContent = txt;

  const info = document.getElementById("lc-innings-info");
  const lines = [];
  if (battingFirst) lines.push(`${battingFirst} batting 1st`);
  if (actuals?.q_winner) lines.push(`Winner: ${actuals.q_winner}`);
  if (actuals?.q_margin) lines.push(`Margin: ${actuals.q_margin} ${actuals.q_margin_type||""}`);
  info.textContent = lines.join(" · ");
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function renderLeaderboard() {
  const panel = document.getElementById("tab-leaderboard");
  const { prizes, pool } = calcPrizes(scored);
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type"));
  const rankEmoji = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","1️⃣1️⃣"];
  const rankClass = ["gold","silver","bronze","","","","","","","",""];

  // Build a map: playerId → scored row
  const scoreMap = {};
  scored.forEach(r => scoreMap[r.playerId] = r);

  // Include ALL family members even if no prediction
  const rows = FAMILY.map((p, i) => {
    const s = scoreMap[p.id] || { total:0, rank: FAMILY.length, breakdown:{} };
    const hasPred = !!allPreds[p.id];
    return { ...p, ...s, hasPred };
  });
  rows.sort((a,b) => b.total - a.total);

  let html = `<div class="lb-wrap">`;
  rows.forEach((r, i) => {
    const isMe = me && r.id === me.id;
    const prize = prizes[r.id] ?? 0;
    html += `
      <div class="lb-row ${isMe?"me":""} ${rankClass[i]||""}">
        <span class="lb-rank">${rankEmoji[i]||i+1}</span>
        <div class="lb-info">
          <div class="lb-name">${r.emoji} ${r.name}${isMe?' <span style="font-size:.7rem;color:var(--t2)">· you</span>':""}</div>
          <div class="lb-sub">${r.hasPred ? "✅ Submitted" : "⏳ Not submitted"}</div>
        </div>
        <div class="lb-right">
          <div class="lb-pts">${r.total} pts</div>
          ${hasActuals && prize > 0 ? `<div class="lb-money">₹${prize}</div>` : ""}
        </div>
      </div>`;
  });
  html += `</div>
    <div class="prize-note" style="margin-top:12px;">
      💰 Prize Pool: <strong>₹${pool}</strong> · ₹100/person<br>
      ${hasActuals
        ? `🥇 ₹${prizes[rows[0]?.id]||0} · 🥈 ₹${prizes[rows[1]?.id]||0} · 🥉 ₹${prizes[rows[2]?.id]||0}`
        : "Prizes calculated after match ends"}
    </div>`;
  panel.innerHTML = html;
}

// ─── MY PICKS ─────────────────────────────────────────────────────────────────
function renderMyPicks() {
  const panel = document.getElementById("tab-mypicks");
  if (!me) { panel.innerHTML = ""; return; }
  const preds = allPreds[me.id] || {};
  const myScore = scored.find(r => r.playerId === me.id);
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type"));

  let lastSection = null;
  let html = "";

  QUESTIONS.forEach((q, idx) => {
    if (q.section && q.section !== lastSection) {
      if (lastSection !== null) html += `</div></div>`;
      lastSection = q.section;
      html += `<div class="picks-card"><div class="picks-section-head">${q.section}</div>`;
    }

    const pred = preds[q.id];
    const br   = myScore?.breakdown?.[q.id];
    const label = br?.label || "pending";
    const pts   = (br?.pts||0) + (br?.bonus||0);

    let ptsBadge = "";
    if (hasActuals && gs.actuals?.[q.id]) {
      const cls = { correct:"pts-correct", wrong:"pts-wrong", exact:"pts-exact",
                    closest:"pts-closest", off:"pts-off", no_pred:"pts-wrong" }[label] || "pts-pending";
      ptsBadge = `<span class="pick-pts-badge ${cls}">${pts > 0 ? "+"+pts : label==="off" ? "off" : "0"}</span>`;
      if (label === "off" && br.diff !== null) ptsBadge += `<br><span class="diff-tag">off by ${br.diff}</span>`;
    } else {
      ptsBadge = `<span class="pick-pts-badge pts-pending">+${q.pts}?</span>`;
    }

    const predDisplay = formatPredDisplay(q, preds);
    html += `
      <div class="pick-row">
        <span class="pick-qnum">${idx+1}</span>
        <span class="pick-qlabel">${q.label}</span>
        <div style="text-align:right">
          <div class="pick-val">${predDisplay || "<span style='color:var(--t3)'>—</span>"}</div>
          ${ptsBadge}
        </div>
      </div>`;
  });
  if (lastSection) html += `</div></div>`;

  const totalPts = myScore?.total || 0;
  html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center;margin-top:4px;">
    <span style="font-size:.8rem;color:var(--t2);">Total Points</span><br>
    <span style="font-size:2rem;font-weight:900;color:#818CF8;">${totalPts}</span>
  </div>`;
  panel.innerHTML = html;
}

function formatPredDisplay(q, preds) {
  const v = preds?.[q.id];
  if (v === undefined || v === null || v === "") return "";
  if (q.type === "margin") {
    const mt = preds?.[`${q.id}_type`] || "runs";
    return `${v} ${mt}`;
  }
  if (q.type === "bowling") {
    const bowler = preds?.[`${q.id}_bowler`];
    return v + (bowler ? ` (${bowler})` : "");
  }
  return String(v);
}

// ─── ALL PICKS ─────────────────────────────────────────────────────────────────
function renderAllPicks() {
  const panel = document.getElementById("tab-allpicks");
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type"));

  const scoreMap = {};
  scored.forEach(r => scoreMap[r.playerId] = r);

  let html = "";
  QUESTIONS.forEach((q, idx) => {
    const actual = gs.actuals?.[q.id];
    html += `
      <div class="allq-block">
        <div class="allq-head">
          <span>Q${idx+1}: ${q.label}</span>
          ${hasActuals && actual ? `<span class="allq-actual">✓ ${formatActualDisplay(q, gs.actuals)}</span>` : ""}
        </div>`;

    FAMILY.forEach(p => {
      const pred = allPreds[p.id]?.[q.id];
      const br = scoreMap[p.id]?.breakdown?.[q.id];
      const label = br?.label || (pred ? "pending" : "empty");
      const isEmpty = !pred && pred !== 0;

      let valClass = "allq-val";
      if (!isEmpty && hasActuals && actual) {
        const clsMap = { correct:"correct", wrong:"wrong", exact:"exact",
                         closest:"closest", off:"", no_pred:"wrong" };
        if (clsMap[label] !== undefined) valClass += " " + clsMap[label];
      } else if (isEmpty) valClass += " empty";

      const display = isEmpty ? "not submitted" : formatPredDisplay(q, allPreds[p.id]);
      const diff = (br?.diff && label === "off") ? `<span class="allq-diff"> (off by ${br.diff})</span>` : "";

      html += `
        <div class="allq-row">
          <span class="allq-name">${p.emoji} ${p.name}</span>
          <span class="${valClass}">${display}${diff}</span>
        </div>`;
    });
    html += `</div>`;
  });
  panel.innerHTML = html;
}

function formatActualDisplay(q, actuals) {
  const v = actuals?.[q.id];
  if (!v && v !== 0) return "";
  if (q.type === "margin") {
    const mt = actuals?.[`${q.id}_type`] || "runs";
    return `${v} ${mt}`;
  }
  if (q.type === "bowling") {
    const bowler = actuals?.[`${q.id}_bowler`];
    return v + (bowler ? ` (${bowler})` : "");
  }
  return String(v);
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    const id = t.dataset.tab;
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(`tab-${id}`).classList.add("active");
  });
});

// ─── PLAYER MODAL ─────────────────────────────────────────────────────────────
let modalOnPick = null;

function openModal(q, forceFilter, isBowlerField) {
  modalQid = q.id;
  modalFilter = forceFilter || q.filter || "all";

  const existVal = isBowlerField ? localPreds[`${q.id}_bowler`] : localPreds[q.id];
  modalSelected = existVal ? findPlayer(existVal) : null;

  document.getElementById("modal-title").textContent = q.label;
  document.getElementById("modal-search").value = "";
  buildModalPlayers(modalFilter);
  document.getElementById("player-modal").classList.remove("hidden");
  document.getElementById("modal-search").focus();

  modalOnPick = (player) => {
    if (isBowlerField) {
      localPreds[`${q.id}_bowler`] = player.name;
      if (q.type === "bowling") syncBowling(q.id);
    } else {
      localPreds[q.id] = player.name;
      markAnswered(q.id);
      updateProgress();
    }
    renderQBody(q);
  };
}

function buildModalPlayers(filter) {
  let rcbList, gtList;
  if (filter === "batAR") { rcbList = rcbBatAR(); gtList = gtBatAR(); }
  else if (filter === "bowlAR") { rcbList = rcbBowlAR(); gtList = gtBowlAR(); }
  else { rcbList = RCB_SQUAD; gtList = GT_SQUAD; }

  renderTeamInModal("modal-rcb", rcbList, "rcb");
  renderTeamInModal("modal-gt", gtList, "gt");
}

function renderTeamInModal(containerId, squad, team) {
  const el = document.getElementById(containerId);
  const groups = { bat:"🏏 Batters / WK", ar:"⚡ All-Rounders", bowl:"🎯 Bowlers" };
  const roleOrder = team === "rcb" ? ["bat","ar","bowl"] : ["bat","ar","bowl"]; // same order

  let html = "";
  for (const role of roleOrder) {
    const players = squad.filter(p => p.role === role);
    if (!players.length) continue;
    html += `<div class="role-group"><div class="role-group-label">${groups[role]}</div><div class="player-chips" id="chips-${team}-${role}">`;
    players.forEach(p => {
      const isSel = modalSelected?.name === p.name;
      html += `<button class="p-chip ${isSel ? `sel-${team}` : ""}" data-name="${p.name}" data-team="${team.toUpperCase()}">
        ${p.name}
        <span class="p-chip-role">${p.roleLabel}</span>
      </button>`;
    });
    html += `</div></div>`;
  }
  el.innerHTML = html;
  el.querySelectorAll(".p-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      // Deselect all
      document.querySelectorAll(".p-chip").forEach(c => c.classList.remove("sel-rcb","sel-gt"));
      chip.classList.add(`sel-${chip.dataset.team.toLowerCase()}`);
      modalSelected = { name: chip.dataset.name, team: chip.dataset.team };
    });
  });
}

// Search
document.getElementById("modal-search").addEventListener("input", function() {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll(".p-chip").forEach(chip => {
    const match = chip.dataset.name.toLowerCase().includes(q);
    chip.classList.toggle("hidden-chip", !match);
  });
});

document.getElementById("modal-confirm").addEventListener("click", () => {
  if (!modalSelected) { showToast("Please select a player first"); return; }
  modalOnPick && modalOnPick(modalSelected);
  closeModal();
});
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", closeModal);
function closeModal() {
  document.getElementById("player-modal").classList.add("hidden");
  modalSelected = null; modalQid = null; modalOnPick = null;
}

// ─── ADMIN ─────────────────────────────────────────────────────────────────────
function syncAdminFields() {
  const sv = (id, val) => { const el = document.getElementById(id); if(el && val !== undefined && val !== null) el.value = val; };
  sv("a-toss", gs.tossWinner);
  sv("a-bat", gs.battingFirst);
  sv("a-status", gs.matchStatus);
  sv("a-gt-r", gs.score?.gt?.runs);
  sv("a-gt-w", gs.score?.gt?.wickets);
  sv("a-gt-o", gs.score?.gt?.overs);
  sv("a-gt-status", gs.score?.gt?.status);
  sv("a-rcb-r", gs.score?.rcb?.runs);
  sv("a-rcb-w", gs.score?.rcb?.wickets);
  sv("a-rcb-o", gs.score?.rcb?.overs);
  sv("a-rcb-status", gs.score?.rcb?.status);
  // Fill actuals
  if (gs.actuals) {
    QUESTIONS.forEach(q => {
      const v = gs.actuals[q.id];
      if (q.type === "bowling") {
        const bwls = v ? v.split("/") : ["",""];
        sv(`ar-${q.id}_w`, bwls[0]);
        sv(`ar-${q.id}_r`, bwls[1]);
        sv(`ar-${q.id}_bowler`, gs.actuals[`${q.id}_bowler`]);
      } else if (q.type === "margin") {
        sv(`ar-${q.id}`, v);
        sv(`ar-${q.id}_type`, gs.actuals[`${q.id}_type`]);
      } else {
        sv(`ar-${q.id}`, v);
      }
    });
  }
}

function buildAdminResultsForm() {
  const form = document.getElementById("admin-results-form");
  form.innerHTML = "";
  QUESTIONS.forEach(q => {
    const div = document.createElement("div");
    div.className = "admin-result-row";
    div.style.flexDirection = "column"; div.style.alignItems = "stretch"; div.style.gap = "8px";
    div.innerHTML = `<div class="ar-label">${q.label}</div>`;

    if (q.type === "team") {
      const sel = mkSel(`ar-${q.id}`, [["","— Select —"],["GT","GT"],["RCB","RCB"]]);
      div.appendChild(sel);
    } else if (q.type === "margin") {
      const row = document.createElement("div"); row.style.display="flex"; row.style.gap="8px";
      const inp = mkInput(`ar-${q.id}`, "number", "0"); inp.min="0"; inp.max="200"; inp.style.flex="1";
      const typeS = mkSel(`ar-${q.id}_type`, [["runs","Runs"],["wickets","Wickets"]]);
      typeS.style.flex="1";
      row.appendChild(inp); row.appendChild(typeS);
      div.appendChild(row);
    } else if (q.type === "player") {
      // Simple text input for admin convenience
      const inp = mkInput(`ar-${q.id}`, "text", "Player name");
      div.appendChild(inp);
    } else if (q.type === "number") {
      const inp = mkInput(`ar-${q.id}`, "number", "0");
      inp.min = String(q.min); inp.max = String(q.max);
      div.appendChild(inp);
    } else if (q.type === "bowling") {
      const row = document.createElement("div"); row.style.display="flex"; row.style.gap="8px";
      const wI = mkInput(`ar-${q.id}_w`, "number","0"); wI.min="0"; wI.max="10"; wI.placeholder="Wkts"; wI.style.flex="1";
      const rI = mkInput(`ar-${q.id}_r`, "number","0"); rI.min="0"; rI.max="99"; rI.placeholder="Runs"; rI.style.flex="1";
      row.appendChild(wI); row.appendChild(rI);
      div.appendChild(row);
      const bI = mkInput(`ar-${q.id}_bowler`, "text","Bowler name");
      div.appendChild(bI);
    }
    form.appendChild(div);
  });
}

function mkSel(id, opts) {
  const s = document.createElement("select"); s.className="a-select"; s.id=id;
  opts.forEach(([v,l]) => { const o=document.createElement("option"); o.value=v; o.textContent=l; s.appendChild(o); });
  return s;
}
function mkInput(id, type, ph) {
  const i = document.createElement("input"); i.type=type; i.id=id;
  i.className="a-input"; i.placeholder=ph; return i;
}

document.getElementById("btn-save-setup").addEventListener("click", async () => {
  try {
    await update(ref(db,"gameState"), {
      tossWinner: document.getElementById("a-toss").value,
      battingFirst: document.getElementById("a-bat").value,
      matchStatus: document.getElementById("a-status").value,
    });
    showToast("✅ Setup saved!");
  } catch(e) { showToast("❌ Error"); console.error(e); }
});

document.getElementById("btn-save-score").addEventListener("click", async () => {
  try {
    await update(ref(db,"gameState/score"), {
      gt: {
        runs:    parseInt(document.getElementById("a-gt-r").value)||0,
        wickets: parseInt(document.getElementById("a-gt-w").value)||0,
        overs:   parseFloat(document.getElementById("a-gt-o").value)||0,
        status:  document.getElementById("a-gt-status").value,
      },
      rcb: {
        runs:    parseInt(document.getElementById("a-rcb-r").value)||0,
        wickets: parseInt(document.getElementById("a-rcb-w").value)||0,
        overs:   parseFloat(document.getElementById("a-rcb-o").value)||0,
        status:  document.getElementById("a-rcb-status").value,
      },
    });
    showToast("📡 Score updated!");
  } catch(e) { showToast("❌ Error"); console.error(e); }
});

document.getElementById("btn-save-results").addEventListener("click", async () => {
  const actuals = {};
  QUESTIONS.forEach(q => {
    if (q.type === "bowling") {
      const w = document.getElementById(`ar-${q.id}_w`)?.value;
      const r = document.getElementById(`ar-${q.id}_r`)?.value;
      if (w || r) actuals[q.id] = `${w||0}/${r||0}`;
      const bname = document.getElementById(`ar-${q.id}_bowler`)?.value;
      if (bname) actuals[`${q.id}_bowler`] = bname;
    } else if (q.type === "margin") {
      const v = document.getElementById(`ar-${q.id}`)?.value;
      const mt = document.getElementById(`ar-${q.id}_type`)?.value;
      if (v) { actuals[q.id] = parseFloat(v); actuals[`${q.id}_type`] = mt||"runs"; }
    } else if (q.type === "number") {
      const v = document.getElementById(`ar-${q.id}`)?.value;
      if (v !== "" && v !== undefined) actuals[q.id] = parseFloat(v);
    } else {
      const v = document.getElementById(`ar-${q.id}`)?.value;
      if (v) actuals[q.id] = v;
    }
  });
  try {
    await update(ref(db,"gameState"), { actuals });
    showToast("🏁 Results saved! Scores calculating…");
  } catch(e) { showToast("❌ Error"); console.error(e); }
});

function renderAdminPlayerStatus() {
  const el = document.getElementById("admin-player-status");
  if (!el) return;
  el.innerHTML = FAMILY.map(p => {
    const has = !!allPreds[p.id];
    return `<div class="admin-player-row">
      <span class="apr-name">${p.emoji} ${p.name}</span>
      <span class="apr-status ${has?"status-done":"status-pend"}">${has?"✅ Done":"⏳ Pending"}</span>
    </div>`;
  }).join("");
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function findPlayer(name) {
  return [...RCB_SQUAD,...GT_SQUAD].find(p => p.name === name)
    || (name ? { name, team:"?", roleLabel:"?" } : null);
}

let toastTmr;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => t.classList.add("hidden"), 2800);
}

function setupListeners() {
  // Keyboard shortcut
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
}
