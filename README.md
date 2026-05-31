# 🏏 MAHA IPL Game Night

**GT vs RCB Final · IPL 2026 · Family Prediction Game**

---

## Deploy on Netlify (30 seconds)

1. Push this folder to `github.com/dewaangmathur/IPL-QUIZ-STATS`
2. Go to [netlify.com](https://netlify.com) → **Add new site** → Import from Git
3. Select the repo. **Build command**: *(leave blank)*. **Publish directory**: `.`
4. Deploy → Done! No npm, no build step.

---

## 13 Prediction Questions

| # | Question | Type | Points |
|---|---|---|---|
| 1 | Toss Winner | Team | 2 |
| 2 | Match Winner | Team | 5 |
| 3 | Winning Margin | Number | 8 |
| 4 | Player of the Match | Player | 8 |
| 5 | Highest Run Scorer | Player | 5 |
| 6 | Highest Strike Rate Batter | Player | 4 |
| 7 | Most Wickets | Player | 5 |
| 8 | Best Economy Bowler | Player | 4 |
| 9 | First Wicket Taker | Player | 4 |
| 10 | First Six Hitter | Player | 3 |
| 11 | First Innings Score | Number | 5 |
| 12 | Total Match Sixes | Number | 4 |
| 13 | Best Bowling Figures | Bowling | 8 |

**Scoring:** Exact numerical = +3 bonus · Closest unique numerical = +5 bonus

---

## Admin Panel

Password: `1234`

**During match:**
- Update GT + RCB score (runs / wickets / overs) after each innings
- All prediction tables update live for everyone automatically

**After match:**
- Fill Final Results section
- Leaderboard calculates scores + prize money instantly

---

## Prize Distribution (₹1100 pool)

| Rank | % | Amount |
|---|---|---|
| 🥇 1st | 40% | ₹440 |
| 🥈 2nd | 25% | ₹275 |
| 🥉 3rd | 15% | ₹165 |
| 4th | 7% | ₹77 |
| 5th | 5% | ₹55 |
| 6th–7th | 4% each | ₹44 each |

---

## Files

```
index.html     Main HTML
style.css      Dark cricket theme
app.js         All UI + Firebase logic
data.js        Players, questions, scoring engine
firebase.js    Firebase config
netlify.toml   Netlify config
```
