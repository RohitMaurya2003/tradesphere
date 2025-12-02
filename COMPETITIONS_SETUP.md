# 🏆 Paper Trading Competitions - Setup Guide

## ✅ What's Been Implemented

### Backend (Node.js/Express)
- ✅ **Contest Model**: Weekly/monthly contests with status tracking
- ✅ **CompetitionEntry Model**: Individual user entries with portfolio, transactions, metrics
- ✅ **Achievement System**: Badges with criteria (trades count, win rate, returns, rank)
- ✅ **Competition API Routes** (`/api/competitions`):
  - `GET /contests` - List all contests
  - `GET /contests/active` - Get active contests
  - `POST /contests/:id/join` - Join a contest
  - `POST /contests/:id/trade` - Execute virtual trades
  - `GET /contests/:id/leaderboard` - Get top 10 leaderboard
  - `GET /contests/:id/my-entry` - Get user's performance
  - `GET /achievements` - List all achievements
  - `GET /achievements/my` - User's earned achievements

### Frontend (React)
- ✅ **Competitions Page**: Browse active/upcoming/completed contests
- ✅ **Contest Detail Page**: View leaderboard, personal performance, trade execution
- ✅ **Achievement Display**: Show earned badges with icons and tiers
- ✅ **Social Sharing**: Share results via native share API or clipboard
- ✅ **Real-time Rank Updates**: Dynamic leaderboard with animations
- ✅ **Navbar Integration**: Competition link with Trophy icon

### Features
- 🎯 **₹1,00,000 Virtual Money**: Start with virtual capital
- 📊 **Real-time Leaderboard**: Top 10 traders ranked by returns
- 🏅 **11 Achievements**: Bronze to Platinum badges
- 📈 **Performance Metrics**: Win rate, total trades, returns %, rank
- 🔄 **Auto Status Updates**: Contests auto-transition (upcoming → active → completed)
- 💬 **Social Sharing**: Native share or copy link
- 🎨 **Professional UI**: Framer Motion animations, gradient backgrounds

---

## 🚀 Setup Instructions

### 1. Seed Database with Contests & Achievements

```powershell
# Navigate to backend
cd D:\projects\stock-trading-app\backend

# Run seed script
node seed-competitions.js
```

**Expected Output:**
```
✅ Connected to MongoDB
🗑️ Clearing existing contests and achievements...
📝 Inserting contests...
✅ Inserted 3 contests
🏆 Inserting achievements...
✅ Inserted 11 achievements

🎉 Database seeded successfully!

Contests created:
  - Weekly Trading Championship - Week 1 (active)
  - Options Master Challenge (upcoming)
  - Monthly Trading Marathon (upcoming)

Achievements created:
  - 🎯 First Trade (bronze)
  - 📈 Active Trader (silver)
  - ⚡ Day Trader (gold)
  ... and 8 more
```

### 2. Restart Backend Server

```powershell
# In backend terminal
node server.js
```

**Look for:**
```
✅ Competitions routes loaded
```

### 3. Access Competitions

1. **Login** to your account
2. Click **"Competitions"** in navbar (Trophy icon 🏆)
3. See 3 contests:
   - **Active**: "Weekly Trading Championship - Week 1"
   - **Upcoming**: "Options Master Challenge", "Monthly Trading Marathon"

---

## 🎮 How to Use

### Join a Contest

1. Go to **Competitions** page
2. Click **"Join Contest"** on active contest
3. You'll be redirected to contest detail page
4. See your rank (initially last) and ₹1,00,000 balance

### Execute Trades (Coming Next)

To enable trading in contests, we need to integrate with your existing trading system. Two options:

**Option A: Quick Integration (Modify TradeModal)**
- Update `TradeModal.jsx` to detect if you're in a contest
- Route trades to `/api/competitions/contests/:id/trade` instead of regular trade endpoint

**Option B: Separate Contest Trading UI**
- Build dedicated trading interface in ContestDetail page
- Search stocks, show prices, buy/sell buttons
- Calls contest trade endpoint directly

### Earn Achievements

Achievements auto-unlock when criteria are met:
- 🎯 **First Trade**: Execute 1 trade
- 💰 **Profitable Trader**: Positive returns (>0%)
- 🚀 **Double Digit Returns**: 10%+ returns
- 🏆 **Champion**: Win 1st place
- 🥉 **Podium Finish**: Top 3
- ... and more!

### Share Results

1. Click **"Share"** button on contest detail page
2. Choose platform (if native share supported)
3. Or copy link to clipboard
4. Share on WhatsApp, Twitter, etc.

---

## 📁 Files Created

### Backend
```
backend/
├── models/
│   ├── Contest.js              ✅ Contest schema
│   ├── CompetitionEntry.js     ✅ User entries with portfolio
│   └── Achievement.js          ✅ Achievement + UserAchievement schemas
├── routes/
│   └── competitions.js         ✅ All competition endpoints
├── seed-competitions.js        ✅ Database seeder
└── server.js                   ✅ Updated with competition routes
```

### Frontend
```
frontend/src/
├── components/
│   ├── Competitions.jsx        ✅ Main competitions page
│   ├── ContestDetail.jsx       ✅ Contest detail + leaderboard
│   └── Navbar.jsx              ✅ Added Competition link
└── App.jsx                     ✅ Added competition routes
```

---

## 🎯 Next Steps to Complete Integration

### 1. Enable Trading in Contests (HIGH PRIORITY)

Update `TradeModal.jsx` to support contest trades:

```javascript
// In TradeModal.jsx, detect if in contest
const contestId = /* get from URL or context */;

// Modify handleTrade function
const handleTrade = async () => {
    const endpoint = contestId 
        ? `/api/competitions/contests/${contestId}/trade`
        : '/api/portfolio/trade';
    
    // ... rest of trade logic
};
```

### 2. Real Portfolio Integration

Contest trades currently update virtual portfolios. To sync with main portfolio view:
- Store `contestId` in transactions
- Filter transactions by contest in Portfolio page
- Or keep separate (recommended for paper trading)

### 3. Enhanced Features (Optional)

- **Contest Creation UI**: Let users create custom contests
- **Achievement Notifications**: Toast when badge earned
- **Historical Contests**: View past performance
- **Contest Analytics**: Charts showing performance over time
- **Team Contests**: Group competitions
- **Bracket Tournaments**: Elimination-style contests

---

## 🧪 Testing Guide

### Test Scenario 1: Join Contest
1. Login as user A
2. Go to Competitions → Join "Weekly Trading Championship"
3. Verify: You appear on leaderboard at rank #1 (only participant)

### Test Scenario 2: Multiple Users
1. Login as user B → Join same contest
2. Login as user A again
3. Both should appear on leaderboard
4. Ranks determined by returns %

### Test Scenario 3: Achievement Unlock
1. Execute your first trade (when trade integration ready)
2. Check "My Achievements" section
3. Should see: 🎯 First Trade badge

### Test Scenario 4: Social Share
1. Click "Share" button
2. On mobile: Native share dialog appears
3. On desktop: Link copied to clipboard
4. Paste in browser → Should open contest page

---

## 🎨 UI Preview

**Competitions Page:**
- Grid of contest cards
- Tabs: Active | Upcoming | Completed
- Each card shows: Status, participants, dates, prize pool
- "Join Contest" button (green gradient)

**Contest Detail Page:**
- Left panel: Your performance (rank, balance, returns, achievements)
- Right panel: Top 10 leaderboard
- Rank badges: 🥇🥈🥉 for top 3
- Color-coded returns: Green (profit) / Red (loss)
- Share button with Share2 icon

**Achievements:**
- Icons: 🎯📈⚡💰🚀👑🎖️🥉🏆📊🛡️
- Tiers: Bronze, Silver, Gold, Platinum
- Rarity: Common, Rare, Epic, Legendary
- Points: 10-200 per achievement

---

## 🐛 Troubleshooting

**Issue: "Competitions routes failed to load"**
- Check `server.js` has `const competitionsRoutes = require('./routes/competitions');`
- Verify all model files exist

**Issue: "Contest not found"**
- Run seed script: `node seed-competitions.js`
- Check MongoDB connection

**Issue: "Already joined this contest"**
- Each user can join once per contest
- Use different account or different contest

**Issue: Achievement not unlocking**
- Check achievement criteria in database
- Verify `calculateMetrics()` called after trades
- Check `checkAndAwardAchievements()` logic

---

## 📊 Database Schema Quick Reference

**Contest:**
- name, description, startDate, endDate, status
- initialBalance (₹1,00,000), prizePool
- participantCount, maxParticipants

**CompetitionEntry:**
- contest, user, virtualBalance
- portfolio[], transactions[]
- totalReturns, totalReturnsPercent, rank
- totalTrades, winRate, achievementsEarned[]

**Achievement:**
- name, description, icon, category, tier
- criteria { type, value, comparison }
- points, rarity

---

## 🎉 What Makes This Unique

✨ **Viral Growth**: Users invite friends → competitions grow
🎓 **Learning**: Risk-free practice with real market prices
🏆 **Gamification**: Achievements, leaderboards, ranks
📱 **Social**: Share results, follow top traders (future)
💡 **Paper Trading**: Perfect for beginners and strategy testing

This positions your app as **more than just a trading platform** — it's a **competitive learning community**! 🚀

---

Need help with:
1. Trading integration?
2. Custom contest creation UI?
3. Achievement notification system?
4. Contest analytics dashboard?

Let me know what to build next! 🎯
