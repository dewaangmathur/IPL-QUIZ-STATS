// ─── PLAYERS ─────────────────────────────────────────────────────────────────
// role: bat | ar | bowl
// Best 15 per team based on IPL 2024-25 performance

export const RCB_SQUAD = [
  // Batters / WK
  { name:"Virat Kohli",       role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Rajat Patidar",     role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Phil Salt",         role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Devdutt Padikkal",  role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Tim David",         role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Jitesh Sharma",     role:"bat",  roleLabel:"🏏 WK-Batter" },
  // All-rounders
  { name:"Krunal Pandya",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Romario Shepherd",  role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Jacob Bethell",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Venkatesh Iyer",    role:"ar",   roleLabel:"⚡ All-Rounder" },
  // Bowlers
  { name:"Josh Hazlewood",    role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Bhuvneshwar Kumar", role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Suyash Sharma",     role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Rasikh Salam",      role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Swapnil Singh",     role:"bowl", roleLabel:"🎯 Bowler" },
];

export const GT_SQUAD = [
  // Batters / WK
  { name:"Shubman Gill",      role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Sai Sudharsan",     role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Jos Buttler",       role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"M Shahrukh Khan",   role:"bat",  roleLabel:"🏏 Batter" },
  { name:"Kumar Kushagra",    role:"bat",  roleLabel:"🏏 WK-Batter" },
  { name:"Connor Esterhuizen",role:"bat",  roleLabel:"🏏 Batter" },
  // All-rounders
  { name:"Rashid Khan",       role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Washington Sundar", role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Glenn Phillips",    role:"ar",   roleLabel:"⚡ All-Rounder" },
  { name:"Rahul Tewatia",     role:"ar",   roleLabel:"⚡ All-Rounder" },
  // Bowlers
  { name:"Mohammed Siraj",    role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Kagiso Rabada",     role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Prasidh Krishna",   role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Sai Kishore",       role:"bowl", roleLabel:"🎯 Bowler" },
  { name:"Arshad Khan",       role:"bowl", roleLabel:"🎯 Bowler" },
];

// Filter helpers
export const rcbBatters  = () => RCB_SQUAD.filter(p => p.role === "bat");
export const rcbAR       = () => RCB_SQUAD.filter(p => p.role === "ar");
export const rcbBowlers  = () => RCB_SQUAD.filter(p => p.role === "bowl");
export const rcbBatAR    = () => RCB_SQUAD.filter(p => p.role !== "bowl");
export const rcbBowlAR   = () => RCB_SQUAD.filter(p => p.role !== "bat");

export const gtBatters   = () => GT_SQUAD.filter(p => p.role === "bat");
export const gtAR        = () => GT_SQUAD.filter(p => p.role === "ar");
export const gtBowlers   = () => GT_SQUAD.filter(p => p.role === "bowl");
export const gtBatAR     = () => GT_SQUAD.filter(p => p.role !== "bowl");
export const gtBowlAR    = () => GT_SQUAD.filter(p => p.role !== "bat");

// ─── FAMILY PLAYERS ──────────────────────────────────────────────────────────
export const FAMILY = [
  { id:"ragini_taiji",     name:"Ragini Taiji",     emoji:"👧" },
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
// type: team | player | number | bowling
// scoring: binary(10) | closest(exact15/closest+5) | bowling_exact(10)
export const QUESTIONS = [
  // ── Section 1: Team ──
  {
    section:"🏏 Team Predictions",
    id:"q_toss",        label:"Toss Winner",
    type:"team",        scoring:"binary",   pts:2,
  },
  {
    section:null,
    id:"q_winner",      label:"Match Winner",
    type:"team",        scoring:"binary",   pts:5,
  },
  {
    section:null,
    id:"q_margin",      label:"Winning Margin",
    type:"margin",      scoring:"closest",  pts:8,
    hint:"Number only — admin picks runs/wickets",
  },
  // ── Section 2: Player ──
  {
    section:"⭐ Player Predictions",
    id:"q_potm",        label:"Player of the Match",
    type:"player",      scoring:"binary",   pts:8,
    filter:"all",
  },
  {
    section:null,
    id:"q_top_scorer",  label:"Highest Run Scorer",
    type:"player",      scoring:"binary",   pts:5,
    filter:"batAR",
  },
  {
    section:null,
    id:"q_top_sr",      label:"Highest Strike Rate Batter",
    type:"player",      scoring:"binary",   pts:4,
    filter:"batAR",
  },
  {
    section:null,
    id:"q_most_wkts",   label:"Most Wickets",
    type:"player",      scoring:"binary",   pts:5,
    filter:"bowlAR",
  },
  {
    section:null,
    id:"q_best_econ",   label:"Best Economy Bowler",
    type:"player",      scoring:"binary",   pts:4,
    filter:"bowlAR",
  },
  {
    section:null,
    id:"q_first_wkt",   label:"First Wicket Taker",
    type:"player",      scoring:"binary",   pts:4,
    filter:"bowlAR",
  },
  {
    section:null,
    id:"q_first_six",   label:"First Six Hitter",
    type:"player",      scoring:"binary",   pts:3,
    filter:"batAR",
  },
  // ── Section 3: Innings ──
  {
    section:"📊 Innings Stats",
    id:"q_inn1",        label:"First Innings Score",
    type:"number",      scoring:"closest",  pts:5,
    min:80, max:280,    default:165,
  },
  {
    section:null,
    id:"q_sixes",       label:"Total Match Sixes",
    type:"number",      scoring:"closest",  pts:4,
    min:0,  max:50,     default:12,
  },
  // ── Section 4: Advanced ──
  {
    section:"🎯 Advanced",
    id:"q_bowling",     label:"Best Bowling Figures",
    type:"bowling",     scoring:"bowling_exact", pts:8,
    filter:"bowlAR",
  },
];

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────
export function scoreAll(predictions, actuals) {
  // predictions: { playerId: { qId: value } }
  // actuals: { qId: value }
  // Returns: [{ playerId, total, breakdown: { qId: { pts, bonus, label } } }]

  if (!actuals || Object.keys(actuals).length === 0) {
    return Object.keys(predictions).map(pid => ({
      playerId: pid, total: 0, breakdown: {}
    }));
  }

  const rows = Object.entries(predictions).map(([pid, preds]) => {
    let total = 0;
    const breakdown = {};
    for (const q of QUESTIONS) {
      const pred = preds?.[q.id];
      const actual = actuals?.[q.id];
      if (!actual && actual !== 0) {
        breakdown[q.id] = { pts:0, bonus:0, label:"pending", diff: null };
        continue;
      }
      if (pred === undefined || pred === null || pred === "") {
        breakdown[q.id] = { pts:0, bonus:0, label:"no_pred", diff: null };
        continue;
      }

      if (q.scoring === "binary" || q.scoring === "bowling_exact") {
        const correct = String(pred).trim().toLowerCase() === String(actual).trim().toLowerCase();
        const pts = correct ? q.pts : 0;
        breakdown[q.id] = { pts, bonus:0, label: correct ? "correct" : "wrong", diff: null };
        total += pts;

      } else if (q.scoring === "closest") {
        const predN = parseNum(pred);
        const actN  = parseNum(actual);
        if (isNaN(predN) || isNaN(actN)) {
          breakdown[q.id] = { pts:0, bonus:0, label:"wrong", diff: null };
        } else if (predN === actN) {
          breakdown[q.id] = { pts: q.pts + 3, bonus:0, label:"exact", diff: 0 };
          total += q.pts + 3;
        } else {
          breakdown[q.id] = { pts:0, bonus:0, label:"off", diff: Math.abs(predN - actN) };
        }
      }
    }
    return { playerId: pid, total, breakdown };
  });

  // Closest bonus: for each "closest" question, +5 to unique nearest
  for (const q of QUESTIONS) {
    if (q.scoring !== "closest") continue;
    const actual = actuals?.[q.id];
    if (!actual && actual !== 0) continue;
    const actN = parseNum(actual);
    if (isNaN(actN)) continue;

    const withDiff = rows
      .map(r => ({ pid: r.playerId, diff: r.breakdown[q.id]?.diff }))
      .filter(x => x.diff !== null && x.diff !== undefined && x.diff > 0);

    if (withDiff.length === 0) continue;
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

  // Sort & rank
  rows.sort((a,b) => b.total - a.total);
  let rank = 1;
  rows.forEach((r,i) => {
    if (i > 0 && r.total < rows[i-1].total) rank = i+1;
    r.rank = rank;
  });
  return rows;
}

export function parseNum(v) {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(String(v).replace(/[^\d.]/g,""));
  return isNaN(n) ? NaN : n;
}

// Prize pool ₹1100 (11 × ₹100)
export function calcPrizes(ranked) {
  const pool = 1100;
  const dist = [0.40, 0.25, 0.15, 0.07, 0.05, 0.04, 0.04];
  const prizes = {};
  let given = 0;
  ranked.forEach((r,i) => {
    const p = Math.round(pool * (dist[i]??0));
    prizes[r.playerId] = p;
    given += p;
  });
  if (ranked.length > 0) prizes[ranked[0].playerId] += (pool - given);
  return { prizes, pool };
}
