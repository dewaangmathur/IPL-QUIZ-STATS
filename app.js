// ─── app.js ──────────────────────────────────────────────────────────────────
import { db, ref, set, get, update, onValue } from "./firebase.js";
import {
  FAMILY, QUESTIONS, RCB_SQUAD, GT_SQUAD,
  rcbBatAR, rcbBowlAR, gtBatAR, gtBowlAR,
  scoreAll, calcPrizes, parseNum
} from "./data.js";

// ─── STATE ───────────────────────────────────────────────────────────────────
let me = null;
let isAdmin = false;
let gs = {
  matchStatus: "pre",
  tossWinner: "",
  battingFirst: "",
  score: { gt:{runs:0,wickets:0,overs:0,status:""}, rcb:{runs:0,wickets:0,overs:0,status:""} },
  actuals: {},
};
let allPreds  = {};
let localPreds = {};
let scored    = [];

// Modal state
let modalOnPick = null;
let modalSelected = null;

// ─── FIREBASE LISTENERS ──────────────────────────────────────────────────────
onValue(ref(db, "gameState"), snap => {
  if (snap.exists()) gs = { ...gs, ...snap.val() };
  renderMiniScoreBar();
  renderLiveCard();
  updatePredictLockUI();
  // Re-render Q3 margin widget since battingFirst may have changed
  const mq = QUESTIONS.find(q => q.id === "q_margin");
  if (mq && document.getElementById("s-predict").classList.contains("active")) renderQBody(mq);
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
  window.scrollTo(0, 0);
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
    el.textContent = `🪙 Toss: ${gs.tossWinner} won · ${gs.battingFirst || "?"} batting first`;
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
document.getElementById("admin-pw").addEventListener("keydown", e => { if (e.key === "Enter") tryAdminLogin(); });

// ─── MARGIN HELPER ────────────────────────────────────────────────────────────
// Figures out the margin unit label from the user's Match Winner pick + battingFirst
function getMarginUnit() {
  const winner = localPreds["q_winner"];       // "RCB" | "GT" | ""
  const batting = gs.battingFirst;             // "RCB" | "GT" | ""

  if (!winner) return null;                    // winner not picked yet

  if (!batting) {
    // Admin hasn't set battingFirst yet — let user toggle manually
    return localPreds["q_margin_type"] || "runs";
  }

  // If winner == batting team → they defended → win by RUNS
  // If winner != batting team → they chased → win by WICKETS
  return winner === batting ? "runs" : "wickets";
}

function getMarginLabel() {
  const winner = localPreds["q_winner"];
  const unit   = getMarginUnit();
  if (!winner) return "Pick Match Winner first ↑";
  if (!unit)   return "runs";
  return `${winner} wins by … ${unit}`;
}

// ─── PREDICTION FORM BUILD ────────────────────────────────────────────────────
function buildPredictForm() {
  const wrap = document.getElementById("predict-content");
  wrap.innerHTML = "";
  let lastSection = null;

  QUESTIONS.forEach((q, idx) => {
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
        <span class="q-num">${idx + 1}</span>
        <div class="q-info">
          <div class="q-label">${q.label}</div>
          <div class="q-hint" id="qhint-${q.id}">${q.hint || ""}</div>
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

  // ── TEAM ──
  if (q.type === "team") {
    body.innerHTML = `
      <div class="team-cards">
        <div class="team-card rcb-card ${val === "RCB" ? "selected" : ""}" data-qid="${q.id}" data-val="RCB">
          <div class="tc-flag">🔴</div>
          <div class="tc-short rcb-color">RCB</div>
          <div class="tc-full">Royal Challengers<br>Bengaluru</div>
        </div>
        <div class="team-card gt-card ${val === "GT" ? "selected" : ""}" data-qid="${q.id}" data-val="GT">
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
        // Q3 margin depends on Q2 winner → re-render it
        if (q.id === "q_winner") {
          const mq = QUESTIONS.find(x => x.id === "q_margin");
          if (mq) renderQBody(mq);
        }
      });
    });

  // ── MARGIN (Q3) ──
  } else if (q.type === "margin") {
    const winner  = localPreds["q_winner"];
    const unit    = getMarginUnit();       // "runs" | "wickets" | null
    const numVal  = val !== undefined && val !== "" ? val : 10;
    const hintEl  = document.getElementById(`qhint-${q.id}`);

    if (!winner) {
      // Winner not picked yet
      body.innerHTML = `<div class="margin-no-winner">⬆️ Pick your Match Winner first to unlock this question</div>`;
      if (hintEl) hintEl.textContent = "";
      return;
    }

    const unitLabel = unit === "runs" ? "runs" : "wickets";
    const maxVal    = unit === "wickets" ? 10 : 150;
    const minVal    = 1;

    if (hintEl) {
      hintEl.textContent = unit
        ? `${winner} wins by … (${unitLabel})`
        : "Select margin type";
    }

    // If admin hasn't set battingFirst, show manual toggle
    const showToggle = !gs.battingFirst;

    body.innerHTML = `
      ${showToggle ? `
        <div class="margin-type-row">
          <button class="margin-type-btn ${unit === "runs" ? "sel" : ""}" data-mt="runs">🏏 Runs</button>
          <button class="margin-type-btn ${unit === "wickets" ? "sel" : ""}" data-mt="wickets">🎯 Wickets</button>
        </div>` : `
        <div class="margin-unit-badge ${unit === "runs" ? "runs-badge" : "wkts-badge"}">
          ${unit === "runs" ? "🏏 Wins by RUNS (batting team won)" : "🎯 Wins by WICKETS (chasing team won)"}
        </div>`}
      ${buildNumStepper(q.id, numVal, minVal, maxVal, unitLabel)}
    `;

    if (showToggle) {
      body.querySelectorAll(".margin-type-btn").forEach(b => {
        b.addEventListener("click", () => {
          localPreds["q_margin_type"] = b.dataset.mt;
          renderQBody(q);
        });
      });
    }
    attachStepperListeners(body, q.id, minVal, maxVal);

  // ── PLAYER ──
  } else if (q.type === "player") {
    const picked = val ? findPlayer(val) : null;
    body.innerHTML = `
      <button class="player-pick-btn ${picked ? "picked" : ""}" data-qid="${q.id}">
        <span class="ppb-icon">${picked ? (picked.team === "RCB" ? "🔴" : "🔵") : "🙋"}</span>
        <span class="ppb-text">
          ${picked
            ? `<div class="ppb-name">${picked.name}</div><div class="ppb-team">${picked.team} · ${picked.roleLabel}</div>`
            : `<div class="ppb-name" style="color:var(--t2)">Tap to select player</div>`}
        </span>
        <span class="ppb-arrow">›</span>
      </button>`;
    body.querySelector(".player-pick-btn").addEventListener("click", () => openModal(q));

  // ── NUMBER ──
  } else if (q.type === "number") {
    const v = val !== undefined ? val : q.default;
    body.innerHTML = buildNumStepper(q.id, v, q.min, q.max, "");
    attachStepperListeners(body, q.id, q.min, q.max);

  // ── BOWLING ──
  } else if (q.type === "bowling") {
    const parts   = val ? val.split("/") : ["3", "24"];
    const wkts    = parseInt(parts[0]) || 3;
    const runs    = parseInt(parts[1]) || 24;
    const bowler  = localPreds[`${q.id}_bowler`] ? findPlayer(localPreds[`${q.id}_bowler`]) : null;
    body.innerHTML = `
      <button class="player-pick-btn ${bowler ? "picked" : ""}" data-qid="${q.id}_bowler" style="margin-bottom:12px;">
        <span class="ppb-icon">${bowler ? (bowler.team === "RCB" ? "🔴" : "🔵") : "🎯"}</span>
        <span class="ppb-text">
          ${bowler
            ? `<div class="ppb-name">${bowler.name}</div><div class="ppb-team">${bowler.team}</div>`
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
          <div class="bowling-sub-label">Runs Conceded</div>
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

// ── NUM STEPPER ──
function buildNumStepper(id, val, min, max, unit) {
  return `
    <div class="num-stepper" id="stepper-${id}">
      <button class="ns-btn big" data-sid="${id}" data-dir="-10">−10</button>
      <button class="ns-btn"     data-sid="${id}" data-dir="-1">−</button>
      <input  class="ns-input"   id="nsinput-${id}" type="number" value="${val}" min="${min}" max="${max}"/>
      <button class="ns-btn"     data-sid="${id}" data-dir="1">+</button>
      <button class="ns-btn big" data-sid="${id}" data-dir="10">+10</button>
    </div>
    ${unit ? `<div class="ns-label">${unit}</div>` : ""}`;
}

function attachStepperListeners(body, id, min, max, onChangeCb) {
  const getInp = () => document.getElementById(`nsinput-${id}`);

  body.querySelectorAll(`[data-sid="${id}"]`).forEach(btn => {
    const fire = () => {
      const inp = getInp(); if (!inp) return;
      let v = parseInt(inp.value) || 0;
      v = Math.max(min, Math.min(max, v + parseInt(btn.dataset.dir)));
      inp.value = v;
      localPreds[id] = v;
      if (onChangeCb) onChangeCb(); else { markAnswered(id); updateProgress(); }
    };
    btn.addEventListener("click", fire);

    // Long-press repeat
    let timer, interval;
    btn.addEventListener("pointerdown", () => { timer = setTimeout(() => { interval = setInterval(fire, 80); }, 400); });
    ["pointerup","pointerleave","pointercancel"].forEach(e => btn.addEventListener(e, () => { clearTimeout(timer); clearInterval(interval); }));
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
      if (onChangeCb) onChangeCb(); else { markAnswered(id); updateProgress(); }
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
  document.getElementById("progress-bar").style.setProperty("--pct", pct + "%");
  document.getElementById("progress-label").textContent = `${done} / ${QUESTIONS.length}`;
}

function updatePredictLockUI() {
  const locked = gs.matchStatus !== "pre";
  document.getElementById("submit-area").classList.toggle("hidden", locked);
  document.getElementById("locked-banner").classList.toggle("hidden", !locked);
  const chip = document.getElementById("predict-lock-chip");
  chip.textContent = locked ? "🔒 Locked" : "✅ Open";
  chip.className = "lock-chip " + (locked ? "locked" : "open");
  document.querySelectorAll("#predict-content button, #predict-content input").forEach(el => {
    el.disabled = locked;
  });
}

// ─── MINI SCORE BAR ───────────────────────────────────────────────────────────
function renderMiniScoreBar() {
  const bar = document.getElementById("mini-score-bar");
  if (!bar) return;
  const { score, matchStatus, battingFirst } = gs;
  const gt  = score?.gt  || {};
  const rcb = score?.rcb || {};
  const fmt = t => (t.runs !== undefined && t.runs !== null) ? `${t.runs}/${t.wickets ?? 0} (${t.overs ?? 0} ov)` : "—";
  const statusMap   = { pre:"pre", live:"live", completed:"done" };
  const statusLabel = { pre:"Pre-Match", live:"● LIVE", completed:"Done" };
  bar.innerHTML = `
    <span class="msb-team rcb-color">RCB</span>
    <span class="msb-score msb-rcb">${fmt(rcb)}</span>
    <span class="msb-sep">·</span>
    <span class="msb-team gt-color">GT</span>
    <span class="msb-score msb-gt">${fmt(gt)}</span>
    ${battingFirst ? `<span class="msb-sep">·</span><span style="font-size:.72rem;color:var(--t3)">${battingFirst} batting 1st</span>` : ""}
    <span class="msb-status ${statusMap[matchStatus] || "pre"}">${statusLabel[matchStatus] || "Pre-Match"}</span>`;
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────
document.getElementById("btn-submit").addEventListener("click", async () => {
  if (!me || gs.matchStatus !== "pre") return;

  const missing = [];
  QUESTIONS.forEach(q => {
    const v = localPreds[q.id];
    if (v === undefined || v === null || v === "") missing.push(q);
  });

  if (missing.length) {
    missing.forEach(q => {
      const card = document.getElementById(`qcard-${q.id}`);
      card?.classList.add("error-highlight");
      setTimeout(() => card?.classList.remove("error-highlight"), 1800);
    });
    showToast(`⚠️ ${missing.length} question${missing.length > 1 ? "s" : ""} unanswered — highlighted red!`);
    const first = document.getElementById(`qcard-${missing[0].id}`);
    first?.scrollIntoView({ behavior:"smooth", block:"center" });
    return;
  }

  // Store the computed margin type so scoring can use it
  const mUnit = getMarginUnit();
  if (mUnit) localPreds["q_margin_type"] = mUnit;

  try {
    await set(ref(db, `predictions/${me.id}`), { ...localPreds });
    showToast("🚀 Predictions locked in!");
    setTimeout(() => showDash(), 700);
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
  const gt  = score?.gt  || {};
  const rcb = score?.rcb || {};
  const fmt = t => (t.runs !== undefined && t.runs !== null) ? `${t.runs}/${t.wickets ?? 0}` : "—";

  document.getElementById("lc-rcb-score").textContent = fmt(rcb);
  document.getElementById("lc-rcb-ov").textContent    = rcb.overs !== undefined ? `(${rcb.overs} ov)` : "";
  document.getElementById("lc-gt-score").textContent  = fmt(gt);
  document.getElementById("lc-gt-ov").textContent     = gt.overs !== undefined ? `(${gt.overs} ov)` : "";

  const statusEl = document.getElementById("lc-status");
  const map = {
    pre:       ["pre",       "🟡 Pre-Match · Predictions Open"],
    live:      ["live",      "🔴 LIVE"],
    completed: ["completed", "✅ Match Complete"],
  };
  const [cls, txt] = map[matchStatus] || map.pre;
  statusEl.className = "lc-status " + cls;
  statusEl.textContent = txt;

  const info = document.getElementById("lc-innings-info");
  const lines = [];
  if (battingFirst) lines.push(`${battingFirst} batting 1st`);
  if (actuals?.q_winner) {
    const margin     = actuals.q_margin;
    const marginType = actuals.q_margin_type || "runs";
    lines.push(`Winner: ${actuals.q_winner}${margin ? ` by ${margin} ${marginType}` : ""}`);
  }
  info.textContent = lines.join(" · ");
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function renderLeaderboard() {
  const panel = document.getElementById("tab-leaderboard");
  const { prizes, pool } = calcPrizes(scored);
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type") && !k.includes("_bowler"));
  const rankEmoji  = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","1️⃣1️⃣"];
  const rankClass  = ["gold","silver","bronze","","","","","","","",""];
  const scoreMap = {};
  scored.forEach(r => scoreMap[r.playerId] = r);
  const rows = FAMILY.map(p => ({
    ...p,
    ...(scoreMap[p.id] || { total:0, rank:FAMILY.length, breakdown:{} }),
    hasPred: !!allPreds[p.id],
  }));
  rows.sort((a,b) => b.total - a.total);
  let html = `<div class="lb-wrap">`;
  rows.forEach((r, i) => {
    const isMe  = me && r.id === me.id;
    const prize = prizes[r.id] ?? 0;
    const correct = Object.values(r.breakdown || {}).filter(b => ["correct","exact","closest"].includes(b.label)).length;
    html += `
      <div class="lb-row ${isMe ? "me" : ""} ${rankClass[i] || ""}">
        <span class="lb-rank">${rankEmoji[i] || i+1}</span>
        <div class="lb-info">
          <div class="lb-name">${r.emoji} ${r.name}${isMe ? ' <span style="font-size:.7rem;color:var(--t2)">· you</span>' : ""}</div>
          <div class="lb-sub">${r.hasPred ? (hasActuals ? `${correct}/${QUESTIONS.length} correct` : "✅ Submitted") : "⏳ Not submitted"}</div>
        </div>
        <div class="lb-right">
          <div class="lb-pts">${r.total} pts</div>
          ${hasActuals && prize > 0 ? `<div class="lb-money">₹${prize}</div>` : ""}
        </div>
      </div>`;
  });
  html += `</div>
    <div class="prize-note" style="margin-top:12px;">
      💰 Prize Pool: <strong>₹${pool}</strong> &nbsp;·&nbsp; ₹100/person<br>
      ${hasActuals
        ? `🥇 ₹${prizes[rows[0]?.id]||0} &nbsp;·&nbsp; 🥈 ₹${prizes[rows[1]?.id]||0} &nbsp;·&nbsp; 🥉 ₹${prizes[rows[2]?.id]||0}`
        : "Prizes calculated after match ends"}
    </div>`;
  panel.innerHTML = html;
}

// ─── MY PICKS ─────────────────────────────────────────────────────────────────
function renderMyPicks() {
  const panel = document.getElementById("tab-mypicks");
  if (!me) { panel.innerHTML = ""; return; }
  const preds      = allPreds[me.id] || {};
  const myScore    = scored.find(r => r.playerId === me.id);
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type") && !k.includes("_bowler"));
  let lastSection = null;
  let html = "";
  QUESTIONS.forEach((q, idx) => {
    if (q.section && q.section !== lastSection) {
      if (lastSection !== null) html += `</div></div>`;
      lastSection = q.section;
      html += `<div class="picks-card"><div class="picks-section-head">${q.section}</div>`;
    }
    const pred  = preds[q.id];
    const br    = myScore?.breakdown?.[q.id];
    const label = br?.label || "pending";
    const pts   = (br?.pts || 0) + (br?.bonus || 0);
    let ptsBadge = "";
    if (hasActuals && gs.actuals?.[q.id]) {
      const cls = { correct:"pts-correct", wrong:"pts-wrong", exact:"pts-exact",
                    closest:"pts-closest", off:"pts-off", no_pred:"pts-wrong" }[label] || "pts-pending";
      ptsBadge = `<span class="pick-pts-badge ${cls}">${pts > 0 ? "+" + pts : label === "off" ? "miss" : "0"}</span>`;
      if (label === "off" && br?.diff) ptsBadge += `<br><span class="diff-tag">off by ${br.diff}</span>`;
    } else {
      ptsBadge = `<span class="pick-pts-badge pts-pending">+${q.pts}?</span>`;
    }
    html += `
      <div class="pick-row">
        <span class="pick-qnum">${idx + 1}</span>
        <span class="pick-qlabel">${q.label}</span>
        <div style="text-align:right">
          <div class="pick-val">${formatPredDisplay(q, preds) || "<span style='color:var(--t3)'>—</span>"}</div>
          ${ptsBadge}
        </div>
      </div>`;
  });
  if (lastSection) html += `</div></div>`;
  html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px;text-align:center;margin-top:4px;">
    <span style="font-size:.8rem;color:var(--t2);">Your Total Points</span><br>
    <span style="font-size:2rem;font-weight:900;color:#818CF8;">${myScore?.total || 0}</span>
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

// ─── ALL PICKS — FULL RESULTS TABLE ──────────────────────────────────────────
function renderAllPicks() {
  const panel = document.getElementById("tab-allpicks");
  const hasActuals = gs.actuals && Object.keys(gs.actuals).some(k => !k.includes("_type") && !k.includes("_bowler"));
  const scoreMap = {};
  scored.forEach(r => scoreMap[r.playerId] = r);

  // Sort family by points for this view too
  const sortedFamily = [...FAMILY].sort((a,b) => {
    const pa = scoreMap[a.id]?.total || 0;
    const pb = scoreMap[b.id]?.total || 0;
    return pb - pa;
  });

  let html = "";

  if (!hasActuals) {
    // Pre-results: show each question, everyone's pick side by side
    html += `<div class="results-note">⏳ Results will appear here after admin fills the final answers</div>`;
    QUESTIONS.forEach((q, idx) => {
      html += `<div class="allq-block">
        <div class="allq-head"><span>Q${idx+1}: ${q.label}</span><span class="allq-pts-tag">+${q.pts}pts</span></div>`;
      FAMILY.forEach(p => {
        const pred = allPreds[p.id]?.[q.id];
        const display = pred !== undefined && pred !== null && pred !== ""
          ? formatPredDisplay(q, allPreds[p.id]) : null;
        html += `<div class="allq-row">
          <span class="allq-name">${p.emoji} ${p.name}</span>
          <span class="allq-val ${display ? "" : "empty"}">${display || "—"}</span>
        </div>`;
      });
      html += `</div>`;
    });

  } else {
    // POST-RESULTS: big summary table per question
    QUESTIONS.forEach((q, idx) => {
      const actual = gs.actuals?.[q.id];
      if (!actual && actual !== 0) return;
      const actualDisplay = formatActualDisplay(q, gs.actuals);

      // Gather all picks with their result
      const picks = sortedFamily.map(p => {
        const pred  = allPreds[p.id]?.[q.id];
        const br    = scoreMap[p.id]?.breakdown?.[q.id];
        const label = br?.label || (pred ? "pending" : "empty");
        const pts   = (br?.pts || 0) + (br?.bonus || 0);
        const display = (pred !== undefined && pred !== null && pred !== "")
          ? formatPredDisplay(q, allPreds[p.id]) : null;
        return { p, pred, display, label, pts, diff: br?.diff };
      });

      // Sort: correct first, then by diff ascending, wrong last
      const order = { exact:0, correct:0, closest:1, off:2, wrong:3, no_pred:4, empty:5, pending:2 };
      picks.sort((a,b) => (order[a.label]??3) - (order[b.label]??3) || (a.diff||999) - (b.diff||999));

      const winners = picks.filter(x => ["correct","exact","closest"].includes(x.label));
      const losers  = picks.filter(x => !["correct","exact","closest"].includes(x.label));

      html += `<div class="res-block">
        <div class="res-head">
          <div class="res-q">Q${idx+1} · ${q.label}</div>
          <div class="res-actual">✅ ${actualDisplay}</div>
        </div>
        <div class="res-rows">`;

      picks.forEach(({ p, display, label, pts, diff }) => {
        const isCorrect = ["correct","exact","closest"].includes(label);
        const icon = label === "exact" ? "🎯" : label === "closest" ? "📍" : isCorrect ? "✅" : label === "empty" || label === "no_pred" ? "—" : "❌";
        const rowCls = label === "exact" ? "res-row exact" : label === "closest" ? "res-row closest" : isCorrect ? "res-row correct" : "res-row wrong";
        const ptsTxt = pts > 0 ? `+${pts}` : label === "off" && diff ? `off by ${diff}` : label === "empty" || label === "no_pred" ? "—" : "0";
        const ptsCls = pts > 0 ? "res-pts win" : label === "off" ? "res-pts near" : "res-pts lose";
        html += `<div class="${rowCls}">
          <span class="res-icon">${icon}</span>
          <span class="res-name">${p.emoji} ${p.name}</span>
          <span class="res-pred">${display || "<span style='color:var(--t3)'>not submitted</span>"}</span>
          <span class="${ptsCls}">${ptsTxt}</span>
        </div>`;
      });

      html += `</div></div>`;
    });

    // Final summary mini-leaderboard at bottom
    html += `<div class="res-summary-head">🏆 Final Standings</div>`;
    html += `<div class="res-summary">`;
    const { prizes } = calcPrizes(scored);
    const rankEmoji = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","1️⃣1️⃣"];
    sortedFamily.forEach((p, i) => {
      const s = scoreMap[p.id];
      const pts = s?.total || 0;
      const prize = prizes[p.id] ?? 0;
      const correct = Object.values(s?.breakdown || {}).filter(b => ["correct","exact","closest"].includes(b.label)).length;
      const isMe = me && p.id === me.id;
      html += `<div class="res-summary-row ${isMe ? "me" : ""}">
        <span class="rs-rank">${rankEmoji[i] || i+1}</span>
        <span class="rs-name">${p.emoji} ${p.name}</span>
        <span class="rs-correct">${correct}/${QUESTIONS.length}</span>
        <span class="rs-pts">${pts}pts</span>
        ${prize > 0 ? `<span class="rs-money">₹${prize}</span>` : `<span class="rs-money" style="color:var(--t3)">—</span>`}
      </div>`;
    });
    html += `</div>`;
  }

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
function openModal(q, forceFilter, isBowlerField) {
  const filter = forceFilter || q.filter || "all";
  const existVal = isBowlerField ? localPreds[`${q.id}_bowler`] : localPreds[q.id];
  modalSelected = existVal ? findPlayer(existVal) : null;

  document.getElementById("modal-title").textContent = q.label;
  document.getElementById("modal-search").value = "";
  buildModalPlayers(filter);
  document.getElementById("player-modal").classList.remove("hidden");
  setTimeout(() => document.getElementById("modal-search").focus(), 150);

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
  if      (filter === "batAR")  { rcbList = rcbBatAR();  gtList = gtBatAR();  }
  else if (filter === "bowlAR") { rcbList = rcbBowlAR(); gtList = gtBowlAR(); }
  else                          { rcbList = RCB_SQUAD;   gtList = GT_SQUAD;   }

  renderTeamInModal("modal-rcb", rcbList, "rcb");
  renderTeamInModal("modal-gt",  gtList,  "gt");
}

function renderTeamInModal(containerId, squad, team) {
  const el = document.getElementById(containerId);
  const groupNames = { bat:"🏏 Batters / WK", ar:"⚡ All-Rounders", bowl:"🎯 Bowlers" };

  let html = "";
  for (const role of ["bat","ar","bowl"]) {
    const players = squad.filter(p => p.role === role);
    if (!players.length) continue;
    html += `<div class="role-group"><div class="role-group-label">${groupNames[role]}</div><div class="player-chips">`;
    players.forEach(p => {
      const isSel = modalSelected?.name === p.name;
      html += `<button class="p-chip ${isSel ? `sel-${team}` : ""}" data-name="${p.name}" data-team="${team.toUpperCase()}">
        ${p.name}<span class="p-chip-role">${p.roleLabel}</span>
      </button>`;
    });
    html += `</div></div>`;
  }
  el.innerHTML = html;

  el.querySelectorAll(".p-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".p-chip").forEach(c => c.classList.remove("sel-rcb","sel-gt"));
      chip.classList.add(`sel-${chip.dataset.team.toLowerCase()}`);
      modalSelected = { name: chip.dataset.name, team: chip.dataset.team };
    });
  });
}

document.getElementById("modal-search").addEventListener("input", function() {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll(".p-chip").forEach(chip => {
    chip.style.display = chip.dataset.name.toLowerCase().includes(q) ? "" : "none";
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
  modalSelected = null; modalOnPick = null;
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function syncAdminFields() {
  const sv = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
  sv("a-toss",      gs.tossWinner);
  sv("a-bat",       gs.battingFirst);
  sv("a-status",    gs.matchStatus);
  sv("a-rcb-r",     gs.score?.rcb?.runs);
  sv("a-rcb-w",     gs.score?.rcb?.wickets);
  sv("a-rcb-o",     gs.score?.rcb?.overs);
  sv("a-rcb-status",gs.score?.rcb?.status);
  sv("a-gt-r",      gs.score?.gt?.runs);
  sv("a-gt-w",      gs.score?.gt?.wickets);
  sv("a-gt-o",      gs.score?.gt?.overs);
  sv("a-gt-status", gs.score?.gt?.status);

  if (gs.actuals) {
    QUESTIONS.forEach(q => {
      if (q.type === "bowling") {
        const parts = gs.actuals[q.id] ? gs.actuals[q.id].split("/") : ["",""];
        sv(`ar-${q.id}_w`, parts[0]);
        sv(`ar-${q.id}_r`, parts[1]);
        sv(`ar-${q.id}_bowler`, gs.actuals[`${q.id}_bowler`]);
      } else if (q.type === "margin") {
        sv(`ar-${q.id}`,      gs.actuals[q.id]);
        sv(`ar-${q.id}_type`, gs.actuals[`${q.id}_type`]);
      } else {
        sv(`ar-${q.id}`, gs.actuals[q.id]);
      }
    });
  }
}

function buildAdminResultsForm() {
  const form = document.getElementById("admin-results-form");
  form.innerHTML = "";

  QUESTIONS.forEach(q => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "border-bottom:1px solid var(--border);padding:12px 0;display:flex;flex-direction:column;gap:8px;";

    const label = document.createElement("div");
    label.className = "ar-label";
    label.textContent = q.label;
    wrap.appendChild(label);

    if (q.type === "team") {
      wrap.appendChild(mkSel(`ar-${q.id}`, [["","— Select —"],["RCB","RCB"],["GT","GT"]]));

    } else if (q.type === "margin") {
      // Smart: derive margin type from battingFirst + winner, but let admin override
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;";
      const numInp = mkInput(`ar-${q.id}`, "number", "e.g. 24");
      numInp.min = "1"; numInp.max = "200"; numInp.style.flex = "1";
      const typeS = mkSel(`ar-${q.id}_type`, [["runs","Runs"],["wickets","Wickets"]]);
      typeS.style.flex = "1";
      // Auto-set type based on setup
      if (gs.battingFirst && gs.actuals?.q_winner) {
        typeS.value = gs.actuals.q_winner === gs.battingFirst ? "runs" : "wickets";
      }
      row.appendChild(numInp); row.appendChild(typeS);
      wrap.appendChild(row);

    } else if (q.type === "player") {
      // Searchable text input for admin speed
      const inp = mkInput(`ar-${q.id}`, "text", "Player name");
      inp.setAttribute("list", `datalist-${q.id}`);
      const dl = document.createElement("datalist");
      dl.id = `datalist-${q.id}`;
      // Build correct player list per filter
      let pool = [...RCB_SQUAD, ...GT_SQUAD];
      if (q.filter === "batAR")  pool = [...rcbBatAR(), ...gtBatAR()];
      if (q.filter === "bowlAR") pool = [...rcbBowlAR(), ...gtBowlAR()];
      pool.forEach(p => {
        const opt = document.createElement("option"); opt.value = p.name; dl.appendChild(opt);
      });
      wrap.appendChild(dl);
      wrap.appendChild(inp);

    } else if (q.type === "number") {
      const inp = mkInput(`ar-${q.id}`, "number", "0");
      inp.min = String(q.min); inp.max = String(q.max);
      wrap.appendChild(inp);

    } else if (q.type === "bowling") {
      const hint = document.createElement("div");
      hint.style.cssText = "font-size:.72rem;color:var(--t2);";
      hint.textContent = "Wickets / Runs conceded / Bowler name";
      wrap.appendChild(hint);

      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;";
      const wI = mkInput(`ar-${q.id}_w`, "number", "Wkts"); wI.min="0"; wI.max="10"; wI.style.flex="1";
      const rI = mkInput(`ar-${q.id}_r`, "number", "Runs"); rI.min="0"; rI.max="99"; rI.style.flex="1";
      row.appendChild(wI); row.appendChild(rI);
      wrap.appendChild(row);

      // Bowler autocomplete
      const bInp = mkInput(`ar-${q.id}_bowler`, "text", "Bowler name (optional)");
      bInp.setAttribute("list", `datalist-bowl-${q.id}`);
      const dl2 = document.createElement("datalist"); dl2.id = `datalist-bowl-${q.id}`;
      [...rcbBowlAR(), ...gtBowlAR()].forEach(p => {
        const opt = document.createElement("option"); opt.value = p.name; dl2.appendChild(opt);
      });
      wrap.appendChild(dl2);
      wrap.appendChild(bInp);
    }

    form.appendChild(wrap);
  });
}

function mkSel(id, opts) {
  const s = document.createElement("select"); s.className = "a-select"; s.id = id;
  opts.forEach(([v,l]) => { const o = document.createElement("option"); o.value=v; o.textContent=l; s.appendChild(o); });
  return s;
}
function mkInput(id, type, ph) {
  const i = document.createElement("input"); i.type=type; i.id=id; i.className="a-input"; i.placeholder=ph; return i;
}

document.getElementById("btn-save-setup").addEventListener("click", async () => {
  try {
    await update(ref(db,"gameState"), {
      tossWinner:  document.getElementById("a-toss").value,
      battingFirst: document.getElementById("a-bat").value,
      matchStatus: document.getElementById("a-status").value,
    });
    showToast("✅ Setup saved!");
  } catch(e) { showToast("❌ Error saving"); console.error(e); }
});

document.getElementById("btn-save-score").addEventListener("click", async () => {
  try {
    await update(ref(db,"gameState/score"), {
      rcb: {
        runs:    parseInt(document.getElementById("a-rcb-r").value) || 0,
        wickets: parseInt(document.getElementById("a-rcb-w").value) || 0,
        overs:   parseFloat(document.getElementById("a-rcb-o").value) || 0,
        status:  document.getElementById("a-rcb-status").value,
      },
      gt: {
        runs:    parseInt(document.getElementById("a-gt-r").value) || 0,
        wickets: parseInt(document.getElementById("a-gt-w").value) || 0,
        overs:   parseFloat(document.getElementById("a-gt-o").value) || 0,
        status:  document.getElementById("a-gt-status").value,
      },
    });
    showToast("📡 Score updated live!");
  } catch(e) { showToast("❌ Error updating score"); console.error(e); }
});

document.getElementById("btn-save-results").addEventListener("click", async () => {
  const actuals = {};
  QUESTIONS.forEach(q => {
    if (q.type === "bowling") {
      const w = document.getElementById(`ar-${q.id}_w`)?.value;
      const r = document.getElementById(`ar-${q.id}_r`)?.value;
      if (w !== "" || r !== "") actuals[q.id] = `${w||0}/${r||0}`;
      const b = document.getElementById(`ar-${q.id}_bowler`)?.value;
      if (b) actuals[`${q.id}_bowler`] = b;
    } else if (q.type === "margin") {
      const v  = document.getElementById(`ar-${q.id}`)?.value;
      const mt = document.getElementById(`ar-${q.id}_type`)?.value || "runs";
      if (v) { actuals[q.id] = parseFloat(v); actuals[`${q.id}_type`] = mt; }
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
    showToast("🏁 Results saved — scores updating for everyone!");
  } catch(e) { showToast("❌ Error saving results"); console.error(e); }
});

function renderAdminPlayerStatus() {
  const el = document.getElementById("admin-player-status");
  if (!el) return;
  el.innerHTML = FAMILY.map(p => {
    const has = !!allPreds[p.id];
    return `<div class="admin-player-row">
      <span class="apr-name">${p.emoji} ${p.name}</span>
      <span class="apr-status ${has ? "status-done" : "status-pend"}">${has ? "✅ Done" : "⏳ Pending"}</span>
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
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}