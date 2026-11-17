# HABITFLOW — FRIENDS LEADERBOARD CENTRE
## PHASE 1: COMPLETE CODEBASE AUDIT & SCORING ARCHITECTURE BLUEPRINT

**Status:** AUDIT & PLANNING COMPLETE (PHASE 1)  
**Execution Boundary:** STRICTLY NON-DESTRUCTIVE — NO PRODUCTION SQL, NO CODE MUTATIONS  
**Target Application:** HabitFlow (React 19 + TypeScript + Vite + Supabase + Tailwind CSS)  
**Timezone Standard:** Asia/Kolkata (IST, UTC+05:30)  
**Primary Authors:** Senior Full-Stack Engineer, Product Architect, Gamification Specialist & Supabase Security Engineer  

---

## 1. Existing Feature Inventory

A comprehensive inspection of the HabitFlow codebase reveals a mature, multi-layered personal habit and productivity system operating across client-side state, local persistence, and Supabase cloud infrastructure:

| Feature Domain | Existing Capabilities | Primary Code References | Storage / Persistence |
|---|---|---|---|
| **Habit Tracking & Execution** | Habit scheduling, time-of-day partitioning (`morning`, `afternoon`, `evening`), category tagging (`mindfulness`, `productivity`, `health`, `fitness`, `learning`), weekly completion targets, individual habit streaks. | `src/types/habit.ts`<br>`src/App.tsx`<br>`src/data/initialData.ts` | `localStorage['habitflow_habits_v1']`<br>State in `App.tsx` |
| **Football-Inspired Day Rating** | Continuous matchday player rating engine ($1.0$ to $10.0$ scale, 1 decimal), 5 tiers (`exceptional`, `great`, `good`, `steady`, `reset`), qualitative summary verdicts, positive highlights checklist. | `src/types/rating.ts`<br>`src/utils/dayRating.ts`<br>`src/components/Rating/DayRatingModal.tsx` | `localStorage['habitflow_day_ratings_v1']`<br>`public.daily_ratings` (Supabase) |
| **Financial Tracking & Daily Budget** | Daily spending limit allowance, categorized expenses, zero-spend day recognition, spending percentage, savings calculation. **Critical Rule:** Lend & Borrow (Debts) records are strictly segregated from daily spending calculations. | `src/types/budget.ts`<br>`src/utils/budgetStorage.ts`<br>`src/components/Budget/DailyBudgetTracker.tsx`<br>`src/components/Budget/LendBorrowTracker.tsx` | `localStorage['habitflow_budget_tracker_v1']` |
| **21-Day Challenges** | Solo and multiplayer challenge progression, Day 1 configuration lock, SHA-256 token invitations, daily check-ins, milestone rewards (+10 XP daily, +25 Day 7, +40 Day 14, +100 Perfect 21). | `src/types/challenge.ts`<br>`src/services/challengeService.ts`<br>`src/utils/challengeTime.ts`<br>`src/components/Challenges/ChallengesDashboard.tsx` | `public.challenges`<br>`public.challenge_participants`<br>`public.challenge_checkins`<br>`public.challenge_rewards`<br>`localStorage['habitflow_guest_checkins_v1']` |
| **User Progression & XP** | Habit completion rewards (+50 XP per toggle, -50 on undo), 21-day challenge milestone rewards, verified XP accumulation. | `src/App.tsx`<br>`src/context/AuthContext.tsx`<br>`src/services/challengeService.ts` | `localStorage['habitflow_user_xp_v1']`<br>`public.profiles.xp` |
| **3D Island Sanctuary** | Three.js procedurally textured island sanctuary that visually matures through 5 architectural stages based on genuine verified completions. | `src/components/Island3D/world/SanctuaryScene.ts`<br>`src/utils/sanctuaryGrowth.ts` | `localStorage['habitflow_sanctuary_stats_v1']` |
| **Ritual Calendar** | Monthly adherence heatmap, micro corner rating badges, itemized spend ledger per date, date notes and mindset reflection textarea. | `src/components/Calendar/RitualCalendar.tsx` | `localStorage['habitflow_cal_note_${date}']` |
| **AI Habit Advisor** | Contextual behavioral recommendations, execution tips, consultation modal based on completion rates. | `src/components/AICoachCard.tsx`<br>`src/components/AICoachModal.tsx` | In-memory React state |
| **Authentication & Profile** | Supabase Auth (email/password & Google OAuth), guest mode fallback, profile display name, avatar, account credentials. | `src/context/AuthContext.tsx`<br>`src/lib/supabase.ts` | Supabase Auth Session<br>`public.profiles` |
| **Accountability Circles (Prototype)** | Early prototype peer view in SectionView showing mock friend adherence scores and streak metrics. | `src/components/Views/SectionView.tsx` | In-memory prototype |

---

## 2. Source-File Map and Responsibilities

```
src/
├── types/
│   ├── habit.ts                    # Habit, HabitCategory, TimeOfDay, SanctuaryLifetimeStats
│   ├── budget.ts                   # BudgetTrackerState, ExpenseItem, DailyBudgetRecord, DebtRecord
│   ├── rating.ts                   # DayRating, RatingTier, DayRatingBreakdown, FriendsLeaderboardEntry
│   └── challenge.ts                # Challenge, LeaderboardEntry, ChallengeCheckin, ChallengeReward
├── utils/
│   ├── dayRating.ts                # Matchday rating engine (calculateDayRating, getRatingTier, persistence)
│   ├── challengeTime.ts            # Asia/Kolkata timezone helpers, IST date parsing, 21-day bound logic
│   ├── sanctuaryGrowth.ts          # Verified completion aggregation, getTodayDateString
│   ├── budgetStorage.ts            # LocalStorage handlers for expenses & daily limits
│   ├── sound.ts                    # Web Audio API procedural audio synthesis (crystal chimes, cues)
│   └── __tests__/
│       ├── dayRating.test.ts       # 19 tests verifying rating engine boundaries and debt exclusion
│       ├── dailyRatingArchitecture.test.ts # 7 tests for leaderboard derivations & estimate safety
│       ├── challengeTime.test.ts   # 7 tests for IST date calculations
│       └── productionPrivilegeAudit.test.ts # 11 tests verifying database privilege hardening
├── services/
│   ├── challengeService.ts         # Solo & Friends 21-day challenge lifecycle & checkin RPCs
│   └── ratingService.ts            # Daily rating persistence & leaderboard aggregation service
├── context/
│   └── AuthContext.tsx             # Supabase session management, profile hydration, guest state
├── components/
│   ├── Header.tsx                  # Top sticky header with star rating button & XP badge
│   ├── Sidebar.tsx                 # Navigation between Dashboard, Habits, Budget, Calendar, Challenges, Friends
│   ├── Rating/
│   │   └── DayRatingModal.tsx      # Modal breakdown of matchday rating, budget metrics & share CTA
│   ├── Calendar/
│   │   └── RitualCalendar.tsx      # Monthly grid with rating badges, itemized spend, reflection notes
│   ├── Challenges/
│   │   ├── ChallengesDashboard.tsx # Challenge lobby, active challenge list, quick check-in
│   │   ├── ChallengeCard.tsx       # Individual challenge visual card
│   │   ├── ChallengeDetailView.tsx # Day progression, check-in textarea, invite generation
│   │   └── ChallengeLeaderboard.tsx# Dedicated 21-day challenge leaderboard (consistency %)
│   ├── Budget/
│   │   ├── DailyBudgetTracker.tsx  # Daily allowance bar, expense entry, category breakdown
│   │   └── LendBorrowTracker.tsx   # Segregated debt tracker (strictly excluded from rating)
│   └── Views/
│       └── SectionView.tsx         # Host for Calendar, Budget, Challenges, Friends Leaderboard
└── App.tsx                         # Root component: state management, memoized rating calculation
supabase/
└── migrations/
    ├── 20261109000000_habitflow_challenges_schema.sql         # Base profiles, challenges & invitations
    ├── 20261115000000_habitflow_privilege_security_hardening.sql # Stripped dangerous privileges on 7 tables
    └── 20261117000000_habitflow_daily_ratings_schema.sql      # public.daily_ratings & reproduction RPC
```

---

## 3. Available Daily Performance Metrics

For any given calendar date $D$ in `Asia/Kolkata`, the following raw metrics exist or can be derived from the application state:

### A. Habit Metrics
1. **Total Scheduled Habits ($N_H$):** Count of all active habits configured by the user (typically 3 to 10).
2. **Completed Habits ($C_H$):** Count of habits marked `completed === true` on date $D$.
3. **Completion Ratio ($R_H$):** $R_H = C_H / N_H$ (clamped between $0.0$ and $1.0$).
4. **Morning Routine Sweep ($M_{\text{sweep}}$):** Boolean indicator whether all morning habits (`timeOfDay === 'morning'`) were completed.

### B. Consistency & Momentum Metrics
5. **Highest Active Habit Streak ($S_{\text{max}}$):** Maximum consecutive days completed across all active habits ($\max_{i} \text{streak}_i$).
6. **Habit Weekly Adherence ($W_{\text{adherence}}$):** Total completions this week compared against weekly target ($\sum \text{completedThisWeek} / \sum \text{targetPerWeek}$).
7. **Budget Saving Streak ($S_{\text{budget}}$):** Number of consecutive days the user spent under their set daily budget.
8. **Sanctuary Total Verified Completions ($T_{\text{sanctuary}}$):** Lifetime cumulative completions recorded in `SanctuaryLifetimeStats`.

### C. Financial Discipline Metrics
9. **Daily Budget Limit ($L$):** Set spending allowance in user's currency.
10. **Total Daily Expenses ($E$):** Sum of all expenses logged on date $D$ ($\sum \text{amount}_i$).
11. **Net Daily Savings ($S$):** $\max(0, L - E)$.
12. **Allowance Utilization ($P_E$):** $(E / L) \times 100$.
13. **Overrun Ratio ($O_E$):** $\max(0, (E - L) / L)$.
14. **Zero-Spend Indicator ($Z$):** True if $L > 0$ and $E = 0$.
*(Note: Debts and lend/borrow records are strictly excluded).*

### D. 21-Day Challenge Metrics
15. **Challenge Check-in Today ($C_{\text{today}}$):** True if the user recorded a check-in on date $D$ for any active challenge.
16. **Challenge Day Number ($D_{\text{num}}$):** Current progress day ($1$ to $21$).
17. **Challenge Consistency ($C_{\text{pct}}$):** Cumulative completed check-in days divided by elapsed days ($0\%$ to $100\%$).

### E. Holistic Rating Engine Metric
18. **Existing Day Rating ($R$):** The 1.0–10.0 score produced by `calculateDayRating()`.
19. **Day Rating Tier ($T_R$):** Qualitative band (`exceptional`, `great`, `good`, `steady`, `reset`).

### F. Progression Metric (Secondary / Non-Scoring)
20. **Daily XP Earned ($XP_{\text{day}}$):** Incremental experience points earned from habits (+50 per habit) and challenge check-ins (+10 to +100).
21. **Total Cumulative XP ($XP_{\text{total}}$):** Lifetime verified XP recorded on the user's profile.

---

## 4. Missing or Unreliable Data Analysis

| Data Signal | Condition of Unreliability | Root Cause in Existing Code | Recommended Architecture Handling |
|---|---|---|---|
| **Guest / Offline Data** | Highly vulnerable to device wipe, private browsing, or browser cache clearing. | Data stored only in `window.localStorage` without server replication. | In guest mode, leaderboard operates locally against mock peers or local circle. Server leaderboard requires authenticated Supabase session. |
| **Historical Days Without Saved Ratings** | Unverified heuristic estimates. | In `RitualCalendar.tsx`, past days without saved snapshots reconstruct a rating assuming `idx < count`. | Flagged as `isEstimated: true`. **Strictly excluded** from verified leaderboard averages. |
| **Timezone Boundary Discrepancies** | Midnight drift across timezones. | Local system clock (`new Date()`) differs from Asia/Kolkata (`UTC+05:30`). | **Enforced Rule:** All date strings and cutoffs must strictly evaluate in `Asia/Kolkata` using `Intl.DateTimeFormat`. |
| **Mid-Day Reads (Dynamic Drift)** | Viewing the leaderboard at 9:00 AM yields a low score because evening habits are not yet performed. | Scores update reactively in real time. | Leaderboard displays dynamic "Current Today Score" with a visual indicator that today's score is in-progress until midnight IST. |
| **Unrecorded / Inactive Days** | User does not open the app on a given day. | No client calculation or server sync occurs. | **Locked Policy:** Missing days are NOT treated as 0 or 100. They are marked as unscored. Period averages are computed only over scored days, with coverage percentage displayed. |
| **No Budget Configured** | User has not set a daily spending limit (`dailyLimit = 0`). | Financial impact evaluates to 0.0 points (`status: 'no_limit'`). | Financial discipline factor assigns a neutral baseline ($70/100$) so users without budget tracking are not unfairly penalized. |
| **No Challenge Enrolled** | User is not participating in any 21-day challenge. | `challengesCheckedInToday` is false. | Challenge factor assigns a neutral baseline ($70/100$) rather than zero, preserving fairness for solo habit trackers. |

---

## 5. Existing Day Rating Analysis

The existing Football-Inspired Day Rating engine (`calculateDayRating` in `src/utils/dayRating.ts`) computes an end-of-day matchday score on a **1.0 to 10.0 scale**:

$$\text{RawRating} = \text{baseRating}\,(5.0) + \text{habitsImpact} + \text{budgetImpact} + \text{streakImpact} + \text{challengeImpact} + \text{disciplineImpact}$$

$$\text{ClampedRating} = \min\left(10.0, \max\left(1.0, \frac{\text{round}(\text{RawRating} \times 10)}{10}\right)\right)$$

### Point Breakdown Weights:
- **Baseline:** Fixed constant of **`5.0`** points.
- **Habit Completion Ratio ($C_H / N_H$):** **`-1.8` to `+3.8` points**
  - $100\% \rightarrow +3.8$
  - $\ge 90\% \rightarrow +2.8$
  - $\ge 75\% \rightarrow +2.0$
  - $\ge 50\% \rightarrow +1.0$
  - $\ge 25\% \rightarrow -0.4$
  - $> 0\% \rightarrow -1.0$
  - $0\% \rightarrow -1.8$
- **Daily Budget Defense ($E$ vs $L$):** **`-1.0` to `+0.4` points**
  - Zero spend ($E = 0$): $+0.4$
  - Saved $\ge 50\%$ ($E \le 0.5L$): $+0.4$
  - Within limit ($E \le L$): $+0.2$
  - Excess $\le 100\%$ ($L < E \le 2L$): $-0.6$ penalty
  - Excess $> 100\%$ ($E > 2L$): $-1.0$ penalty
  - No limit ($L = 0$): $0.0$
- **Streak Longevity ($S_{\text{max}}$):** **`0.0` to `+0.5` points**
  - $\ge 14\text{ days} \rightarrow +0.5$
  - $\ge 7\text{ days} \rightarrow +0.4$
  - $\ge 3\text{ days} \rightarrow +0.2$
  - $\ge 1\text{ day} \rightarrow +0.1$
- **Challenge Check-in:** **`0.0` or `+0.4` points**
  - Checked in today $\rightarrow +0.4$
- **Morning Routine Sweep:** **`0.0` to `+0.3` points**
  - All morning habits done $\rightarrow +0.3$
  - Partial morning done $\rightarrow +0.1$

---

## 6. Double-Counting Risk Analysis

A critical requirement of the Friends Leaderboard is to prevent **double-counting** while honoring the user's requirement that the Overall Daily Performance Score combine:
1. Habit Performance
2. Existing Day Rating
3. Financial Discipline
4. Consistency
5. 21-Day Challenge Participation

### The Overlap Matrix

| Leaderboard Factor | Standalone Source Signal | Where It Appears Inside Existing Day Rating | Overlap Extent | Severity If Unmitigated |
|---|---|---|---|---|
| **1. Habit Performance** | Daily completion ratio ($C_H / N_H$) | `habitsImpact` ($-1.8$ to $+3.8$ pts) | **38% of Day Rating range** | **HIGH:** If Habits are weighted 40% and Day Rating 40%, habit completion accounts for $> 55\%$ of the total score, heavily double-penalizing missed habits. |
| **2. Existing Day Rating** | Continuous score $R \in [1.0, 10.0]$ | **Composite Container** | Entire entity | **ANCHOR:** It is the synthetic composite of all behaviors. |
| **3. Financial Discipline** | Spending $E$ vs Limit $L$ | `budgetImpact` ($-1.0$ to $+0.4$ pts) | **14% of Day Rating range** | **HIGH:** An overspend penalty in budget is duplicated by an overspend penalty inside the rating. |
| **4. Consistency** | Streaks ($S_{\text{max}}$) & weekly targets | `streakImpact` ($0$ to $+0.5$ pts) & `disciplineImpact` ($0$ to $+0.3$ pts) | **8% of Day Rating range** | **MEDIUM:** Streak length is rewarded both in the standalone factor and in the rating. |
| **5. 21-Day Challenge** | Check-in boolean $\mathbb{I}_{\text{checkin}}$ | `challengeImpact` ($0$ to $+0.4$ pts) | **4% of Day Rating range** | **LOW-MEDIUM:** Daily check-in gives points in both places. |

### Mathematical Principles to Eliminate Double-Counting
1. **Dampen the Composite Anchor:** Limit the weight of the Existing Day Rating to **25%**. At 25%, the Day Rating acts as a holistic "Execution Index" (capturing synergy, baseline 5.0 stability, and morning routine discipline) without allowing its sub-components to overpower the standalone metrics.
2. **Differentiate Metric Depth (Orthogonalization):**
   - **Habit Performance (35%):** Measures **pure completion percentage** ($C_H / N_H \times 100$) on a strictly linear scale.
   - **Financial Discipline (15%):** Measures **savings efficiency and allowance preservation ratio** (continuous 0–100 scale), whereas the Day Rating only applies discrete step bonuses ($+0.4, +0.2, -0.6, -1.0$).
   - **Consistency (15%):** Measures **streak durability and weekly target adherence** ($W_{\text{adherence}}$), which rewards long-term compounding habit retention beyond Day Rating's 0.5-point ceiling.
   - **21-Day Challenge (10%):** Measures **active campaign commitment and milestone momentum**.
   - **Day Rating (25%):** Integrates **overall matchday performance** including the crucial **Morning Kickoff sweep** (which is not captured in pure completion percentage).

---

## 7. Recommended Combined Scoring Formula

The **Overall Daily Performance Score (DPS)** on any valid day is a weighted sum normalized to **0.0 to 100.0**:

$$\text{DPS} = (w_H \times S_H) + (w_R \times S_R) + (w_B \times S_B) + (w_C \times S_C) + (w_{CH} \times S_{CH})$$

Where each sub-score $S_i \in [0, 100]$ and the weights satisfy:

$$w_H + w_R + w_B + w_C + w_{CH} = 35\% + 25\% + 15\% + 15\% + 10\% = 100\%$$

```
┌────────────────────────────────────────────────────────────────────────┐
│             OVERALL DAILY PERFORMANCE SCORE (100% TOTAL)               │
├────────────────────────────────────────────────────────────────────────┤
│  [35%] Habit Performance (Linear Completion Ratio)                     │
│  [25%] Existing Day Rating (Holistic Matchday Engine: Rating × 10)     │
│  [15%] Financial Discipline (Continuous Budget & Savings Efficiency)   │
│  [15%] Consistency & Momentum (Streak Maturity & Weekly Adherence)     │
│  [10%] 21-Day Challenge (Campaign Check-in & Commitment)               │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Factor Normalization Specifications ($S_i \in [0, 100]$)

#### 1. Habit Performance Score ($S_H$, Weight: 35%)
- **Source Data:** `habitsCompleted` ($C_H$) and `totalHabits` ($N_H$).
- **Formula:**
  $$S_H = \begin{cases} 
  \text{round}\left(\frac{C_H}{N_H} \times 100\right), & N_H > 0 \\ 
  70.0, & N_H = 0 \text{ (Neutral baseline for no scheduled habits)} 
  \end{cases}$$
- **Data Unavailable:** If habit record is missing, day is marked **Unscored**.

#### 2. Existing Day Rating Score ($S_R$, Weight: 25%)
- **Source Data:** `DayRating.rating` ($R \in [1.0, 10.0]$) from `calculateDayRating()`.
- **Formula:**
  $$S_R = \text{round}(R \times 10.0, 1)$$
  *(Range: $10.0$ to $100.0$)*.
- **Data Unavailable:** If no saved verified rating exists, day is marked **Unscored**.

#### 3. Financial Discipline Score ($S_B$, Weight: 15%)
- **Source Data:** `dailyLimit` ($L$) and `totalSpent` ($E$).
- **Formula:**
  $$S_B = \begin{cases}
  70.0, & L \le 0 \text{ (Neutral baseline: no daily limit configured)} \\
  100.0, & E = 0 \text{ (Zero-Spend Day: 100% savings preserved)} \\
  100.0 - \left(\frac{E}{L} \times 40.0\right), & 0 < E \le L \text{ (Under budget: scores 60 to 100 based on savings)} \\
  \max\left(0.0, 60.0 - \left(\frac{E - L}{L} \times 60.0\right)\right), & E > L \text{ (Over budget: drops from 60 to 0 as deficit doubles)}
  \end{cases}$$
- **Data Unavailable:** If budget tracker is not initialized, defaults to neutral $70.0$.

#### 4. Consistency & Momentum Score ($S_C$, Weight: 15%)
- **Source Data:** `highestStreak` ($S_{\text{max}}$) across active habits and `completedThisWeek` vs `targetPerWeek`.
- **Formula:**
  Combines active streak maturity (capped at 14 days) and weekly target compliance:
  $$\text{StreakScore} = \min\left(100.0, \frac{S_{\text{max}}}{14} \times 100.0\right)$$
  $$\text{WeeklyScore} = \min\left(100.0, \frac{\sum \text{completedThisWeek}}{\max\left(1, \sum \text{targetPerWeek}\right)} \times 100.0\right)$$
  $$S_C = \text{round}(0.6 \times \text{StreakScore} + 0.4 \times \text{WeeklyScore}, 1)$$
- **Data Unavailable:** Defaults to $0.0$ if no streaks exist.

#### 5. 21-Day Challenge Participation Score ($S_{CH}$, Weight: 10%)
- **Source Data:** Active challenge participation and `challengesCheckedInToday` ($\mathbb{I}_{\text{checkin}}$).
- **Formula:**
  $$S_{CH} = \begin{cases}
  100.0, & \text{Enrolled in active challenge AND checked in today} \\
  20.0, & \text{Enrolled in active challenge BUT missed today's check-in} \\
  70.0, & \text{Not currently enrolled in any challenge (Neutral baseline)}
  \end{cases}$$
- **Rationale for Neutral Baseline ($70.0$):** A user who focuses purely on daily habits should not suffer a permanent 10-point leaderboard handicap simply because no 21-day challenge is currently active in their circle. Enrolling and checking in awards the full $100.0$, rewarding active engagement.

---

## 8. Recommended Factor Weights and Justification

| Factor | Recommended Weight | Core Rationale & Gamification Balancing |
|---|---|---|
| **Habit Performance ($S_H$)** | **35%** | **Primary Core Metric:** HabitFlow is first and foremost a habit tracker. Pure daily execution must remain the largest single determinant of daily standing. |
| **Existing Day Rating ($S_R$)** | **25%** | **Holistic Matchday Engine:** Preserves the approved football-inspired rating as a major pillar. At 25%, it provides balanced cross-domain synergy (including morning routine sweep) without double-penalizing missed habits. |
| **Financial Discipline ($S_B$)** | **15%** | **Lifestyle Balance:** Rewards conscious spending and savings defense without allowing a bad financial day to completely destroy an otherwise disciplined habit routine. |
| **Consistency & Momentum ($S_C$)** | **15%** | **Anti-Procrastination Driver:** Rewards multi-day momentum and unbroken chains. Encourages daily retention rather than sporadic bursts of activity. |
| **21-Day Challenge ($S_{CH}$)** | **10%** | **Social & Campaign Engagement:** Provides a meaningful boost for participating in community and personal 21-day milestones while remaining fair to non-participants via neutral baselining. |
| **Total** | **100%** | Exact mathematical normalization. |

---

## 9. Five Worked Scoring Examples

### Example 1: User A — "The Disciplined Achiever"
- **Profile:** 5/5 habits completed (100%), Day Rating 10.0, spent ₹300 of ₹1000 limit (70% savings), 14-day streak, checked into active challenge.
- **Factor Sub-Scores:**
  - $S_H = 100.0 \times 0.35 = \mathbf{35.0}$
  - $S_R = (10.0 \times 10) \times 0.25 = \mathbf{25.0}$
  - $S_B = (100 - (300/1000 \times 40)) = 88.0 \times 0.15 = \mathbf{13.2}$
  - $S_C = 100.0 \times 0.15 = \mathbf{15.0}$
  - $S_{CH} = 100.0 \times 0.10 = \mathbf{10.0}$
- **Combined Daily Score:** $35.0 + 25.0 + 13.2 + 15.0 + 10.0 = \mathbf{98.2 / 100}$
- **Leaderboard Standing:** Rank #1 (Podium Gold).

### Example 2: User B — "High Habits, Financial Deficit"
- **Profile:** 5/5 habits completed (100%), Day Rating 8.4 (penalized by budget), spent ₹2200 of ₹1000 limit (120% overrun), 7-day streak, no active challenge.
- **Factor Sub-Scores:**
  - $S_H = 100.0 \times 0.35 = \mathbf{35.0}$
  - $S_R = (8.4 \times 10) \times 0.25 = \mathbf{21.0}$
  - $S_B = \max(0, 60 - (1200/1000 \times 60)) = 0.0 \times 0.15 = \mathbf{0.0}$
  - $S_C = ((7/14 \times 100) = 50.0) \times 0.15 = \mathbf{7.5}$
  - $S_{CH} = 70.0 \text{ (Neutral)} \times 0.10 = \mathbf{7.0}$
- **Combined Daily Score:** $35.0 + 21.0 + 0.0 + 7.5 + 7.0 = \mathbf{70.5 / 100}$
- **Analysis:** Demonstrates fair weighting. Despite blowing the daily budget, strong habit execution keeps the user at a respectable 70.5 without completely collapsing their score.

### Example 3: User C — "Moderate Habits, Elite Consistency"
- **Profile:** 3/5 habits completed (60%), Day Rating 7.2, spent ₹600 of ₹1000 limit (40% savings), 30-day streak ($S_{\text{max}} = 30 \rightarrow 100\%$), challenge checked in.
- **Factor Sub-Scores:**
  - $S_H = 60.0 \times 0.35 = \mathbf{21.0}$
  - $S_R = (7.2 \times 10) \times 0.25 = \mathbf{18.0}$
  - $S_B = (100 - (600/1000 \times 40)) = 76.0 \times 0.15 = \mathbf{11.4}$
  - $S_C = 100.0 \times 0.15 = \mathbf{15.0}$
  - $S_{CH} = 100.0 \times 0.10 = \mathbf{10.0}$
- **Combined Daily Score:** $21.0 + 18.0 + 11.4 + 15.0 + 10.0 = \mathbf{75.4 / 100}$
- **Analysis:** Long-term unbroken consistency and financial control elevate a moderate completion day into a solid 75.4 score.

### Example 4: User D — "New User (Day 2)"
- **Profile:** 2/2 habits completed (100%), Day Rating 9.0, no budget configured, 2-day streak, not enrolled in challenges.
- **Factor Sub-Scores:**
  - $S_H = 100.0 \times 0.35 = \mathbf{35.0}$
  - $S_R = (9.0 \times 10) \times 0.25 = \mathbf{22.5}$
  - $S_B = 70.0 \text{ (Neutral baseline)} \times 0.15 = \mathbf{10.5}$
  - $S_C = ((2/14 \times 100) = 14.3) \times 0.15 = \mathbf{2.1}$
  - $S_{CH} = 70.0 \text{ (Neutral baseline)} \times 0.10 = \mathbf{7.0}$
- **Combined Daily Score:** $35.0 + 22.5 + 10.5 + 2.1 + 7.0 = \mathbf{77.1 / 100}$
- **Analysis:** Neutral baselines prevent the new user from being unfairly penalized for unconfigured features, allowing their genuine discipline (100% habits) to shine.

### Example 5: User E — "Inactive / Missing Day (Policy in Action)"
- **Profile:** User was traveling or ill. Zero habits logged, zero budget entries, app unopened.
- **Application of Locked Missing-Day Policy:**
  - The day is **NOT assigned a score of 0.0**.
  - The day is **NOT assigned a score of 100.0**.
  - The day is classified as **`Unscored / Inactive`**.
  - **Weekly Leaderboard Calculation:**
    If User E has valid scores on Monday (85.0), Tuesday (90.0), Wednesday (88.0), and missed Thursday through Sunday:
    $$\text{Weekly Average} = \frac{85.0 + 90.0 + 88.0}{3} = \mathbf{87.7 / 100}$$
    $$\text{Coverage Display} = \mathbf{3 / 7\text{ Days Scored (43\% Coverage)}}$$
  - **Ranking Impact:** User E ranks with an 87.7 score, but displays low coverage (43%). On competitive leaderboards, a minimum coverage threshold (e.g., $\ge 4$ days) can be required for final podium championship eligibility without corrupting the mathematical average.

---

## 10. Daily, Weekly, Monthly, and All-Time Ranking Calculations

All periods evaluate boundaries in `Asia/Kolkata` (IST):

### 1. Daily Leaderboard
- **Evaluation Window:** Target Date $D$ from 00:00:00 to 23:59:59 IST.
- **Score:** That day's verified $\text{DPS}_D$.
- **Eligibility:** User must have a verified recorded score on date $D$.

### 2. Weekly Leaderboard
- **Evaluation Window:** Monday 00:00:00 IST through Sunday 23:59:59 IST (7 calendar days).
- **Formula:**
  $$\text{Score}_{\text{weekly}} = \frac{\sum_{d \in \text{ScoredDays}} \text{DPS}_d}{|\text{ScoredDays}|}$$
- **Coverage:** $|\text{ScoredDays}| / 7 \times 100\%$.

### 3. Monthly Leaderboard
- **Evaluation Window:** 1st day of month 00:00:00 IST through last day of month 23:59:59 IST ($M$ calendar days: 28, 29, 30, or 31).
- **Formula:**
  $$\text{Score}_{\text{monthly}} = \frac{\sum_{d \in \text{ScoredDays}} \text{DPS}_d}{|\text{ScoredDays}|}$$
- **Coverage:** $|\text{ScoredDays}| / M \times 100\%$.

### 4. All-Time Leaderboard
- **Evaluation Window:** From the user's first recorded verified score date through current date.
- **Formula:** Average of all verified historical daily performance scores.
- **Coverage:** Total verified scored days count.

### 5. Ranking Algorithm (Dense Rank with XP Tie-Breaker)
$$\text{Rank}(u) = \text{DENSE\_RANK}() \text{ OVER } (\text{ORDER BY } \text{Score}(u) \text{ DESC}, \text{VerifiedXP}(u) \text{ DESC})$$

---

## 11. Missing-Day and Enrollment Policies (LOCKED)

1. **No Artificial Zeros:** An inactive day is never recorded as 0.0. Averaging a zero would unfairly cut a disciplined user's weekly average in half.
2. **No Artificial Perfect Scores:** An inactive day is never recorded as 100.0.
3. **Transparent Coverage Metrics:** Every leaderboard display presents both the **Performance Score** and the **Scored-Day Count**:
   - `Daily`: `Scored Today` vs `Not Yet Scored`
   - `Weekly`: `5 / 7 Days Scored (71% Coverage)`
   - `Monthly`: `22 / 30 Days Scored (73% Coverage)`
   - `All-Time`: `142 Verified Days`
4. **Mid-Period Enrollment Rule:** When a user joins HabitFlow or befriends someone midway through a week or month:
   - Their coverage is calculated against **eligible days since enrollment**, not the full historical period:
     $$\text{EligibleDays} = \min(\text{PeriodLength}, \text{CurrentDate} - \text{EnrollmentDate} + 1)$$
     $$\text{Coverage} = \frac{\text{ScoredDays}}{\text{EligibleDays}} \times 100\%$$
5. **Technical / Synchronization Failure:** If a client fails to sync due to network offline status, the client displays `Pending Sync` locally. Once connection is restored, the verified day score is ingested server-side without penalty.

---

## 12. XP Policy — Locked Specification

- **Non-Scoring Rule:** XP is strictly excluded from the Overall Daily Performance Score calculation.
- **Secondary Statistic:** XP is displayed as a companion badge on leaderboard rows (e.g., `88.5/100 • 2,450 XP`).
- **Tie-Breaker Rule:**
  - If User A has `88.5` score and `2,450 XP`, and User B has `88.5` score and `1,900 XP`, User A takes higher rank.
  - **Shared-Rank Rule:** If both Performance Score AND verified XP are identical, the system assigns a **Shared Rank** (e.g., `T-2`, `T-2`). The next participant receives Rank #4 (Dense or Standard Competition Rank, product choice).

---

## 13. Friendship Eligibility and Privacy

### Eligibility Requirements
1. **Mutually Accepted Friendships Only:** Only users with a confirmed bidirectional record (`status: 'accepted'`) appear on each other's Friends Leaderboard.
2. **Exclusion of Non-Accepted Relations:**
   - Pending friend requests are strictly excluded.
   - Declined friend requests are excluded.
   - Blocked or removed friendships are immediately severed from leaderboard visibility.
3. **Challenge Co-Participants Do NOT Imply Friendship:** Participating in the same multiplayer challenge does not automatically grant friendship status or expose private friend leaderboard rankings.

### Strict Data Privacy Boundary
Friends on the leaderboard **MUST NEVER** see:
- Specific habit titles (e.g., "Take prescription medication", "Job interview prep").
- Habit categories or descriptions.
- Reflection notes or journal entries.
- Transaction names or financial notes (e.g., "Psychiatrist fee", "Cocktail bar").
- Actual budget amounts or debt ledgers.
- Account email addresses or phone numbers.

**Allowed Public Leaderboard Aggregates Only:**
- Display Name and Profile Avatar.
- Overall Daily Performance Score (and period average).
- Performance Tier Badge (`EXCEPTIONAL DAY`, `GREAT MOMENTUM`, etc.).
- Scored Days Count and Coverage Percentage.
- Total Verified XP.
- Leaderboard Rank and Period Trophy Badges.

---

## 14. 21-Day Challenge Leaderboard Preservation

The 21-Day Challenge system remains completely separate and independent:
- **Formula:**
  $$\text{ConsistencyPct} = \text{round}\left(\frac{\text{completedCheckins}}{\text{elapsedDays}} \times 100, 1\right)$$
- **Tie-Breakers (Preserved):**
  1. `consistency_pct` DESC
  2. `completed_days` DESC
  3. `last_checkin_at` ASC NULLS LAST (earlier check-in breaks tie)
- **Zero Influence from Outside Metrics:** Day Rating, XP, budget defense, and the new Friends Leaderboard score have **zero impact** on 21-day challenge rankings.
- **Challenge Lifecycle:** Day 1 configuration lock, token invitation boundaries, and final Day 21 ranking freeze remain exactly as specified in `20261109000000_habitflow_challenges_schema.sql`.

---

## 15. Supabase Database and Security Audit

### Current Migration State Inspection
1. `20261109000000_habitflow_challenges_schema.sql`: Base profiles, challenges, checkins, invitations.
2. `20261115000000_habitflow_privilege_security_hardening.sql`: Successfully revoked `TRUNCATE`, `TRIGGER`, and `REFERENCES` on all 7 base tables. Stripped public/anon permissions.
3. `20261117000000_habitflow_daily_ratings_schema.sql`: Authoring table `public.daily_ratings` and reproduction RPC `fn_record_daily_rating`.

### Security Audit Findings & Vulnerability Mitigation

| Security Domain | Vulnerability Identified in Existing Architecture | Proposed Hardening in Leaderboard Migration |
|---|---|---|
| **Friendship Relationship** | No `public.friendships` table exists in Supabase. Circle members were previously inferred from challenge participants. | Create `public.friendships` table with strict composite uniqueness `(user_id, friend_id)`, status constraint (`pending`, `accepted`, `declined`, `blocked`), and RLS preventing unauthorized access. |
| **Client Score Spoofing** | If the client submits `score: 98.5`, a malicious user could spoof perfect scores via DevTools. | **Zero Client Trust:** The server RPC `fn_record_daily_performance` accepts raw counts ($C_H, N_H, E, L, S_{\text{max}}$) and independently queries `public.challenge_checkins`. The server executes the formula and writes the verified score. |
| **Table Privilege Leakage** | New tables in PostgreSQL automatically grant default permissions to `PUBLIC` or `authenticated` if not explicitly revoked. | Issue explicit `REVOKE ALL ON public.friendships, public.daily_performance_scores FROM PUBLIC, anon;` and strip `TRUNCATE, TRIGGER, REFERENCES`. Direct client write operations are completely revoked. |
| **Friend Data Snooping** | Without careful RLS, a friend could query another friend's private habit links or raw spending. | RLS policies on `daily_performance_scores` expose **only aggregate score rows** to accepted friends. Source habit names and spending records remain in private client storage or user-only tables. |

---

## 16. Proposed Database Architecture (New Migration)

To be created as a separate migration: `supabase/migrations/20261118000000_habitflow_friends_leaderboard_centre.sql`:

```sql
BEGIN;

-- 1. Friendships Table (Bidirectional & Normalized)
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_friendship_pair UNIQUE (user_id, friend_id),
  CONSTRAINT chk_no_self_friendship CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_lookup 
  ON public.friendships (user_id, friend_id, status);

-- 2. Daily Performance Scores Table (Verified Server Snapshots)
CREATE TABLE IF NOT EXISTS public.daily_performance_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score_date date NOT NULL,
  performance_score numeric(4, 1) NOT NULL CHECK (performance_score >= 0.0 AND performance_score <= 100.0),
  habit_score numeric(4, 1) NOT NULL CHECK (habit_score >= 0.0 AND habit_score <= 100.0),
  day_rating_score numeric(4, 1) NOT NULL CHECK (day_rating_score >= 0.0 AND day_rating_score <= 100.0),
  budget_score numeric(4, 1) NOT NULL CHECK (budget_score >= 0.0 AND budget_score <= 100.0),
  consistency_score numeric(4, 1) NOT NULL CHECK (consistency_score >= 0.0 AND consistency_score <= 100.0),
  challenge_score numeric(4, 1) NOT NULL CHECK (challenge_score >= 0.0 AND challenge_score <= 100.0),
  tier text NOT NULL CHECK (tier IN ('exceptional', 'great', 'good', 'steady', 'reset')),
  tier_label text NOT NULL,
  calculation_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_score_date UNIQUE (user_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_perf_scores_user_date 
  ON public.daily_performance_scores (user_id, score_date DESC);
CREATE INDEX IF NOT EXISTS idx_perf_scores_date_score 
  ON public.daily_performance_scores (score_date, performance_score DESC);

-- 3. RLS & Least-Privilege Hardening
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_performance_scores ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.friendships FROM PUBLIC, anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.friendships FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;

REVOKE ALL ON public.daily_performance_scores FROM PUBLIC, anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES, INSERT, UPDATE, DELETE ON public.daily_performance_scores FROM authenticated;
GRANT SELECT ON public.daily_performance_scores TO authenticated;

-- RLS: Friendships visible only to the participants
CREATE POLICY "friendships_participant_policy" ON public.friendships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- RLS: Performance scores visible to user and accepted friends only
CREATE POLICY "performance_scores_friends_policy" ON public.daily_performance_scores
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE ((f.user_id = auth.uid() AND f.friend_id = daily_performance_scores.user_id)
         OR  (f.friend_id = auth.uid() AND f.user_id = daily_performance_scores.user_id))
        AND f.status = 'accepted'
    )
  );

COMMIT;
```

---

## 17. Proposed RPC and Service Architecture

### A. Server RPC: `fn_record_daily_performance` (Zero-Trust Calculation)
- **Signature:**
  ```sql
  CREATE OR REPLACE FUNCTION public.fn_record_daily_performance(
    p_score_date date,
    p_total_habits integer,
    p_habits_completed integer,
    p_daily_limit numeric,
    p_total_spent numeric,
    p_highest_streak integer,
    p_morning_total integer,
    p_morning_completed integer
  ) RETURNS jsonb
  ```
- **Execution Flow:**
  1. Validates `auth.uid()`.
  2. Queries `public.challenge_checkins` for `p_score_date` in IST (spoof-proof check).
  3. Evaluates Day Rating formula ($R$).
  4. Computes normalized sub-scores: $S_H, S_R, S_B, S_C, S_{CH}$.
  5. Computes weighted composite: $\text{DPS} = 0.35 S_H + 0.25 S_R + 0.15 S_B + 0.15 S_C + 0.10 S_{CH}$.
  6. Upserts into `public.daily_performance_scores` on conflict `(user_id, score_date)`.
  7. Returns verified score object.

### B. Server RPC: `fn_get_friends_leaderboard_centre`
- **Signature:**
  ```sql
  CREATE OR REPLACE FUNCTION public.fn_get_friends_leaderboard_centre(
    p_timeframe text, -- 'daily', 'weekly', 'monthly', 'all_time'
    p_target_date date DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
  ) RETURNS TABLE (...)
  ```
- **Execution Flow:**
  1. Finds all mutual friends where `status = 'accepted'`.
  2. Aggregates verified scores across period.
  3. Computes average score, scored days count, coverage percentage, and profile XP.
  4. Returns sorted ranking list ordered by `performance_score DESC, total_xp DESC`.

### C. Client Services
- `src/services/friendshipService.ts`: Send friend request, accept/decline request, unfriend, list active friends.
- `src/services/leaderboardCentreService.ts`: Fetch friends leaderboard by timeframe, fetch user's personal score history, submit daily performance metrics.

---

## 18. Proposed React Component Architecture

```
src/components/LeaderboardCentre/
├── LeaderboardCentreView.tsx           # Main container with toggle between Friends & Challenge tabs
├── FriendsLeaderboard/
│   ├── TimeframeFilterBar.tsx          # Daily / Weekly / Monthly / All-Time button pills
│   ├── LeaderboardPodium.tsx           # Visual 3-tier podium for Gold, Silver, Bronze champions
│   ├── LeaderboardTable.tsx            # Virtualized ranking list with avatar, score, tier, coverage
│   ├── LeaderboardRow.tsx              # Single row with rank movement indicator & tier badge
│   ├── PerformanceBreakdownDrawer.tsx  # Slide-over showing 5-factor breakdown when clicking a row
│   ├── SocialReactionBar.tsx           # Quick reactions (🔥, 👏, 💪, ⚡) for peer encouragement
│   └── FriendInviteCTA.tsx             # Modal trigger to add friends via username / email
├── ChallengeLeaderboard/
│   └── ChallengeLeaderboardView.tsx    # Unmodified preservation of existing 21-day challenge UI
└── Shared/
    ├── RankBadge.tsx                   # Crown (#1), Silver Medal (#2), Bronze Medal (#3), Number (#4+)
    └── CoveragePill.tsx                # e.g. "6/7d (86%)" with tooltip explanation
```

---

## 19. Testing Strategy and Edge Cases

### Test Suite Structure
1. **Mathematical Scoring Tests (`leaderboardScoring.test.ts`):**
   - Exact 100% weight sum ($35\% + 25\% + 15\% + 15\% + 10\% = 100\%$).
   - Normalization boundaries ($S_i \in [0.0, 100.0]$ under all input conditions).
   - Zero-habit edge case ($N_H = 0$).
   - Zero-budget edge case ($L = 0$).
   - Zero-spend day edge case ($E = 0$).
   - Massive overspend edge case ($E > 5L$).
   - Long streak saturation ($S_{\text{max}} \ge 14$).
2. **Missing-Day Policy Tests (`missingDayPolicy.test.ts`):**
   - Inactive day does not evaluate to 0.0 or 100.0.
   - 3 scored days out of 7 yield exact average over 3 days, not 7.
   - Coverage ratio exact match.
3. **Tie-Breaker Tests (`tieBreaker.test.ts`):**
   - Identical scores resolved by verified XP.
   - Identical scores AND identical XP yield shared rank (T-1, T-1).
4. **Security & SQL Tests (`leaderboardSecurityAudit.test.ts`):**
   - Non-friends cannot read another user's scores via RLS.
   - Direct `INSERT`/`UPDATE` blocked for authenticated role on `daily_performance_scores`.
   - TRUNCATE, TRIGGER, REFERENCES stripped on all new tables.
   - Server RPC verifies challenge check-in against database table.

---

## 20. Implementation Roadmap for Subsequent Phases

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PHASED IMPLEMENTATION ROADMAP                        │
├────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: Audit & Scoring Architecture (COMPLETED - STOPPED FOR REVIEW) │
│                                                                        │
│ PHASE 2: Database & Backend Migration                                  │
│   • Author 20261118000000_habitflow_friends_leaderboard_centre.sql    │
│   • Implement public.friendships & public.daily_performance_scores     │
│   • Implement fn_record_daily_performance & fn_get_friends_leaderboard│
│   • Run SQL privilege & RLS test suite                                │
│                                                                        │
│ PHASE 3: Client Services & Local Storage Hydration                     │
│   • Implement friendshipService.ts & leaderboardCentreService.ts       │
│   • Wire daily performance calculation to App.tsx execution cycle      │
│   • Add offline fallback & guest circle simulation                     │
│                                                                        │
│ PHASE 4: UI Leaderboard Centre Components                              │
│   • Implement LeaderboardCentreView with dual-tab architecture         │
│   • Build Podium, Table, Timeframe Switcher & Reactions                │
│   • Integrate into Sidebar navigation & SectionView                    │
│                                                                        │
│ PHASE 5: End-to-End Verification & Deployment Review                   │
│   • Comprehensive cross-browser & timezone verification                │
│   • Run full test suite, lint, and production build checks             │
│   • Prepare pull request report for deployment                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 21. Questions Requiring Product-Owner Approval

Before Phase 2 implementation begins, the following product decisions require your explicit sign-off:

1. **Approval of Factor Weights:**
   Do you approve the recommended weighting:
   - Habit Performance: **35%**
   - Existing Day Rating: **25%**
   - Financial Discipline: **15%**
   - Consistency & Streaks: **15%**
   - 21-Day Challenge Participation: **10%**  
   *(Total: 100%)*?

2. **Neutral Baseline for Optional Features ($70.0$ Score):**
   When a user has no daily budget limit set ($L = 0$) or is not enrolled in an active 21-day challenge, do you approve assigning a **neutral baseline of 70.0 points** for those specific sub-factors so non-participating users are not unfairly handicapped?

3. **Podium Minimum Coverage Requirement:**
   For the Weekly and Monthly Leaderboard podium (Gold, Silver, Bronze), should we require a **minimum coverage threshold** (e.g., $\ge 4$ scored days for weekly, $\ge 15$ scored days for monthly) to qualify for the top-three podium stands?

4. **Friendship Discovery Model:**
   For Phase 2 friend invitations, should friends be added via:
   - A. Unique 6-character Friend Code (e.g., `HABIT-7X9Q`)?
   - B. Email / Username search with mutual Accept/Decline?
   - C. Shareable Invite Link (similar to the 21-day challenge token system)?

---

## Execution Boundary Confirmation

- Audit and planning only.
- No application source code modified.
- No database migrations executed.
- No data deleted or reset.
- Working tree clean.

**Awaiting explicit product-owner approval on Section 21 before proceeding to Phase 2.**
