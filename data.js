// ─── SQUADS ──────────────────────────────────────────────────────────────────
export const RCB_SQUAD = [
  { name:"Rajat Patidar",     role:"bat",  roleLabel:"🏏 Batter (c)" },
  { name:"Virat Kohli",       role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Phil Salt",         role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Devdutt Padikkal",  role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Tim David",         role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Jordan Cox",        role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Jitesh Sharma",     role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Jacob Bethell",     role:"ar",   roleLabel:"⚡ Batting AR" },
  { name:"Venkatesh Iyer",    role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Krunal Pandya",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Romario Shepherd",  role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Kanishk Chouhan",   role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Vihaan Malhotra",   role:"ar",   roleLabel:"⚡ Batting AR" },
  { name:"Mangesh Yadav",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Josh Hazlewood",    role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Bhuvneshwar Kumar", role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Suyash Sharma",     role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Rasikh Salam",      role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Abhinandan Singh",  role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Satvik Deswal",     role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Jacob Duffy",       role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Richard Gleeson",   role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Vicky Ostwal",      role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Swapnil Singh",     role:"bowl", roleLabel:"🎯 Bowler" },
];

export const GT_SQUAD = [
  { name:"Shubman Gill",       role:"bat",  roleLabel:"🏏 Batter (c)" },
  { name:"Anuj Rawat",         role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Jos Buttler",        role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Sai Sudharsan",      role:"bat",  roleLabel:"🏏 Batter" },
  { name:"M Shahrukh Khan",    role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Kumar Kushagra",     role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Connor Esterhuizen", role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Glenn Phillips",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Rashid Khan",        role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Washington Sundar",  role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Jason Holder",       role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Rahul Tewatia",      role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Nishant Sindhu",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Manav Suthar",       role:"ar",   roleLabel:"⚡ Bowling AR" },
  { name:"Mohammed Siraj",     role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Kagiso Rabada",      role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Prasidh Krishna",    role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Sai Kishore",        role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Arshad Khan",        role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Ashok Sharma",       role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Gurnoor Brar",       role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Kulwant Khejroliya", role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Ishant Sharma",      role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Jayant Yadav",       role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Luke Wood",          role:"bowl", roleLabel:"🎯 Bowler" },
];

export const rcbBatAR  = () => RCB_SQUAD.filter(p => p.role !== "bowl");
export const rcbBowlAR = () => RCB_SQUAD.filter(p => p.role !== "bat");
export const gtBatAR   = () => GT_SQUAD.filter(p => p.role !== "bowl");
export const gtBowlAR  = () => GT_SQUAD.filter(p => p.role !== "bat");

// ─── FAMILY ──────────────────────────────────────────────────────────────────
export const FAMILY = [
  { id:"ragini_taiji",     name:"Ragini Taiji",     emoji:"👩" },
  { id:"pankaj_tauji",     name:"Pankaj Tauji",     emoji:"👨" },
  { id:"harry_bhaiya",     name:"Harry Bhaiya",     emoji:"🧑" },
  { id:"sameer_phufaji",   name:"Sameer Phufaji",   emoji:"👨" },
  { id:"bharti_bhua",      name:"Bharti Bhua",      emoji:"👩" },
  { id:"ayushi_didi",      name:"Ayushi Didi",      emoji:"👩‍🦱" },
  { id:"saurabh_jijaji",   name:"Saurabh Jijaji",   emoji:"🧔" },
  { id:"siddhanth_mathur", name:"Vishu",            emoji:"🧑‍💼" },
  { id:"devu",             name:"Devu",             emoji:"🙋" },
  { id:"anchal_mathur",    name:"Anchal",           emoji:"👧" },
  { id:"vishal_mathur",    name:"Vishal",           emoji:"👦" },
];

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
// REMOVED: Best Bowling Figures (q_bowling)
// ADDED:   Winning team's choice - bat or bowl (q_bat_bowl) between Q1 and Q2

export const QUESTIONS = [
  // ── Section 1: Team ──
  {
    section: "🏏 Team Predictions",
    id:      "q_toss",
    label:   "Toss Winner",
    type:    "team",
    scoring: "binary",
    pts:     2,
  },
  {
    // NEW: after toss, what will toss winner choose?
    section: null,
    id:      "q_bat_bowl",
    label:   "Toss Winner Will Choose…",
    type:    "choice",
    options: ["Batting","Bowling"],
    optionEmojis: ["🏏","🎯"],
    scoring: "binary",
    pts:     3,
    hint:    "What will the toss winner elect to do?",
  },
  {
    section: null,
    id:      "q_winner",
    label:   "Match Winner",
    type:    "team",
    scoring: "binary",
    pts:     5,
  },
  {
    section: null,
    id:      "q_margin",
    label:   "Winning Margin",
    type:    "margin",
    scoring: "closest",
    pts:     8,
    hint:    "Auto-sets runs/wickets based on your Match Winner pick",
  },
  // ── Section 2: Player ──
  {
    section: "⭐ Player Predictions",
    id:      "q_potm",
    label:   "Player of the Match",
    type:    "player",
    scoring: "binary",
    pts:     8,
    filter:  "all",
  },
  {
    section: null,
    id:      "q_top_scorer",
    label:   "Highest Run Scorer",
    type:    "player",
    scoring: "binary",
    pts:     5,
    filter:  "batAR",
  },
  {
    section: null,
    id:      "q_top_sr",
    label:   "Highest Strike Rate Batter",
    type:    "player",
    scoring: "binary",
    pts:     4,
    filter:  "batAR",
  },
  {
    section: null,
    id:      "q_most_wkts",
    label:   "Most Wickets",
    type:    "player",
    scoring: "binary",
    pts:     5,
    filter:  "bowlAR",
  },
  {
    section: null,
    id:      "q_best_econ",
    label:   "Best Economy Bowler",
    type:    "player",
    scoring: "binary",
    pts:     4,
    filter:  "bowlAR",
  },
  {
    section: null,
    id:      "q_most_sixes",
    label:   "Most Sixes Hitter",
    type:    "player",
    scoring: "binary",
    pts:     3,
    filter:  "batAR",
  },
  {
    section: null,
    id:      "q_most_fours",
    label:   "Most Fours Hitter",
    type:    "player",
    scoring: "binary",
    pts:     3,
    filter:  "batAR",
  },
  // ── Section 3: Innings ──
  {
    section: "📊 Innings Stats",
    id:      "q_inn1",
    label:   "First Innings Score",
    type:    "number",
    scoring: "closest",
    pts:     5,
    min:     80,
    max:     280,
    default: 165,
  },
  {
    section: null,
    id:      "q_sixes",
    label:   "Total Match Sixes",
    type:    "number",
    scoring: "closest",
    pts:     4,
    min:     0,
    max:     50,
    default: 12,
  },
];

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
export function scoreAll(predictions, actuals) {
  if (!actuals || Object.keys(actuals).length === 0) {
    return Object.keys(predictions).map(pid => ({
      playerId: pid, total: 0, breakdown: {}
    }));
  }

  const rows = Object.entries(predictions).map(([pid, preds]) => {
    let total = 0;
    const breakdown = {};
    for (const q of QUESTIONS) {
      const pred   = preds?.[q.id];
      const actual = actuals?.[q.id];
      if (!actual && actual !== 0) {
        breakdown[q.id] = { pts:0, bonus:0, label:"pending", diff:null };
        continue;
      }
      if (pred === undefined || pred === null || pred === "") {
        breakdown[q.id] = { pts:0, bonus:0, label:"no_pred", diff:null };
        continue;
      }
      if (q.scoring === "binary") {
        const correct = String(pred).trim().toLowerCase() === String(actual).trim().toLowerCase();
        const pts = correct ? q.pts : 0;
        breakdown[q.id] = { pts, bonus:0, label: correct ? "correct" : "wrong", diff:null };
        total += pts;
      } else if (q.scoring === "closest") {
        const predN = parseNum(pred);
        const actN  = parseNum(actual);
        if (isNaN(predN) || isNaN(actN)) {
          breakdown[q.id] = { pts:0, bonus:0, label:"wrong", diff:null };
        } else if (predN === actN) {
          breakdown[q.id] = { pts: q.pts + 3, bonus:0, label:"exact", diff:0 };
          total += q.pts + 3;
        } else {
          breakdown[q.id] = { pts:0, bonus:0, label:"off", diff: Math.abs(predN - actN) };
        }
      }
    }
    return { playerId: pid, total, breakdown };
  });

  // Closest bonus +5
  for (const q of QUESTIONS) {
    if (q.scoring !== "closest") continue;
    const actual = actuals?.[q.id];
    if (!actual && actual !== 0) continue;
    const actN = parseNum(actual);
    if (isNaN(actN)) continue;
    const withDiff = rows
      .map(r => ({ pid: r.playerId, diff: r.breakdown[q.id]?.diff }))
      .filter(x => x.diff !== null && x.diff !== undefined && x.diff > 0);
    if (!withDiff.length) continue;
    const minDiff = Math.min(...withDiff.map(x => x.diff));
    const closest = withDiff.filter(x => x.diff === minDiff);
    if (closest.length === 1) {
      const winner = rows.find(r => r.playerId === closest[0].pid);
      if (winner) {
        winner.breakdown[q.id].bonus = 5;
        winner.breakdown[q.id].label = "closest";
        winner.total += 5;
      }
    }
  }

  rows.sort((a,b) => b.total - a.total);
  let rank = 1;
  rows.forEach((r,i) => {
    if (i > 0 && r.total < rows[i-1].total) rank = i + 1;
    r.rank = rank;
  });
  return rows;
}

export function parseNum(v) {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? NaN : n;
}

export function calcPrizes(ranked) {
  const pool = 1100;
  const dist = [0.40, 0.25, 0.15, 0.07, 0.05, 0.04, 0.04];
  const prizes = {};
  let given = 0;
  ranked.forEach((r, i) => {
    const p = Math.round(pool * (dist[i] ?? 0));
    prizes[r.playerId] = p;
    given += p;
  });
  if (ranked.length > 0) prizes[ranked[0].playerId] += (pool - given);
  return { prizes, pool };
}