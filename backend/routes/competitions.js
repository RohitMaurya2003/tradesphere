const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Contest = require('../models/Contest');
const CompetitionEntry = require('../models/CompetitionEntry');
const { Achievement, UserAchievement } = require('../models/Achievement');
const axios = require('axios');

// Get all contests
router.get('/contests', async (req, res) => {
    try {
        const contests = await Contest.find()
            .sort({ startDate: -1 })
            .limit(20);
        
        // Update statuses
        contests.forEach(contest => contest.updateStatus());
        await Promise.all(contests.map(c => c.save()));
        
        res.json(contests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get active contests
router.get('/contests/active', async (req, res) => {
    try {
        const now = new Date();
        const contests = await Contest.find({
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ startDate: -1 });
        
        res.json(contests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get contest by ID
router.get('/contests/:id', async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }
        contest.updateStatus();
        await contest.save();
        res.json(contest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new contest (admin/any user for now)
router.post('/contests', auth, async (req, res) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            initialBalance,
            prizePool,
            maxParticipants,
            contestType,
            rules
        } = req.body;
        
        const contest = new Contest({
            name,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            initialBalance: initialBalance || 100000,
            prizePool,
            maxParticipants,
            contestType: contestType || 'weekly',
            rules: rules || [
                'Only virtual money will be used',
                'All trades are simulated with real market prices',
                'Contest ends automatically at end date',
                'Top performers win badges and recognition'
            ],
            createdBy: req.user.id
        });
        
        contest.updateStatus();
        await contest.save();
        
        res.status(201).json(contest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Join a contest
router.post('/contests/:id/join', auth, async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }
        
        contest.updateStatus();
        if (contest.status !== 'active' && contest.status !== 'upcoming') {
            return res.status(400).json({ error: 'Contest is not open for joining' });
        }
        
        // Check if already joined
        const existing = await CompetitionEntry.findOne({
            contest: contest._id,
            user: req.user.id
        });
        
        if (existing) {
            return res.status(400).json({ error: 'Already joined this contest' });
        }
        
        // Check max participants
        if (contest.maxParticipants && contest.participantCount >= contest.maxParticipants) {
            return res.status(400).json({ error: 'Contest is full' });
        }
        
        const entry = new CompetitionEntry({
            contest: contest._id,
            user: req.user.id,
            virtualBalance: contest.initialBalance,
            initialBalance: contest.initialBalance,
            portfolio: [],
            transactions: []
        });
        
        await entry.save();
        
        // Increment participant count
        contest.participantCount += 1;
        await contest.save();
        
        res.status(201).json(entry);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Already joined this contest' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Get user's contest entry with live prices
router.get('/contests/:id/my-entry', auth, async (req, res) => {
    try {
        const entry = await CompetitionEntry.findOne({
            contest: req.params.id,
            user: req.user.id
        }).populate('contest').populate('achievementsEarned');
        
        if (!entry) {
            return res.status(404).json({ error: 'Not joined this contest' });
        }
        
        // Update portfolio with live prices
        if (entry.portfolio && entry.portfolio.length > 0) {
            for (let position of entry.portfolio) {
                try {
                    // Fetch current price from Yahoo Finance
                    const quoteResp = await axios.get(`http://localhost:5000/api/stocks/quote/${position.symbol}`);
                    const currentPrice = quoteResp.data.currentPrice || quoteResp.data.price;
                    
                    // Update position with live data
                    position.currentPrice = currentPrice;
                    position.currentValue = position.quantity * currentPrice;
                    position.investedAmount = position.quantity * position.averagePrice;
                    position.profitLoss = position.currentValue - position.investedAmount;
                    position.profitLossPercent = ((position.profitLoss / position.investedAmount) * 100);
                } catch (err) {
                    console.error(`Error fetching price for ${position.symbol}:`, err.message);
                    // Keep old price if fetch fails
                }
            }
        }
        
        // Recalculate metrics with updated prices
        entry.calculateMetrics();
        await entry.save();
        
        // Calculate user's rank by counting entries with better returns
        const betterEntries = await CompetitionEntry.countDocuments({
            contest: req.params.id,
            totalReturnsPercent: { $gt: entry.totalReturnsPercent }
        });
        
        entry.rank = betterEntries + 1;
        await entry.save();
        
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute trade in contest (virtual)
router.post('/contests/:id/trade', auth, async (req, res) => {
    try {
        const { symbol, quantity, type, price } = req.body; // type: BUY or SELL
        
        if (!symbol || !quantity || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const entry = await CompetitionEntry.findOne({
            contest: req.params.id,
            user: req.user.id
        }).populate('contest');
        
        if (!entry) {
            return res.status(404).json({ error: 'Not joined this contest' });
        }
        
        // Check contest is active
        entry.contest.updateStatus();
        if (entry.contest.status !== 'active') {
            return res.status(400).json({ error: 'Contest is not active' });
        }
        
        // Get current price if not provided
        let currentPrice = price;
        if (!currentPrice) {
            try {
                const quoteResp = await axios.get(`http://localhost:5000/api/stocks/quote/${symbol}`);
                currentPrice = quoteResp.data.currentPrice || quoteResp.data.price;
            } catch (err) {
                return res.status(400).json({ error: 'Could not fetch stock price' });
            }
        }
        
        const totalAmount = quantity * currentPrice;
        
        if (type === 'BUY') {
            // Check sufficient balance
            if (entry.virtualBalance < totalAmount) {
                return res.status(400).json({ error: 'Insufficient virtual balance' });
            }
            
            // Deduct balance
            entry.virtualBalance -= totalAmount;
            
            // Update portfolio
            const existingPos = entry.portfolio.find(p => p.symbol === symbol);
            if (existingPos) {
                const totalQty = existingPos.quantity + quantity;
                const totalInvested = existingPos.investedAmount + totalAmount;
                existingPos.quantity = totalQty;
                existingPos.averagePrice = totalInvested / totalQty;
                existingPos.investedAmount = totalInvested;
                existingPos.currentPrice = currentPrice;
                existingPos.currentValue = totalQty * currentPrice;
                existingPos.profitLoss = existingPos.currentValue - existingPos.investedAmount;
                existingPos.profitLossPercent = (existingPos.profitLoss / existingPos.investedAmount) * 100;
            } else {
                entry.portfolio.push({
                    symbol,
                    quantity,
                    averagePrice: currentPrice,
                    currentPrice,
                    investedAmount: totalAmount,
                    currentValue: totalAmount,
                    profitLoss: 0,
                    profitLossPercent: 0
                });
            }
            
        } else if (type === 'SELL') {
            // Check if holding stock
            const position = entry.portfolio.find(p => p.symbol === symbol);
            if (!position || position.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient holdings to sell' });
            }
            
            // Add to balance
            entry.virtualBalance += totalAmount;
            
            // Update portfolio
            position.quantity -= quantity;
            if (position.quantity === 0) {
                entry.portfolio = entry.portfolio.filter(p => p.symbol !== symbol);
            } else {
                position.investedAmount = position.quantity * position.averagePrice;
                position.currentValue = position.quantity * currentPrice;
                position.currentPrice = currentPrice;
                position.profitLoss = position.currentValue - position.investedAmount;
                position.profitLossPercent = (position.profitLoss / position.investedAmount) * 100;
            }
        }
        
        // Record transaction
        entry.transactions.push({
            type,
            symbol,
            quantity,
            price: currentPrice,
            totalAmount,
            timestamp: new Date()
        });
        
        // Recalculate metrics
        entry.calculateMetrics();
        
        await entry.save();
        
        // Check achievements
        await checkAndAwardAchievements(entry);
        
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get leaderboard for a contest with live prices
router.get('/contests/:id/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // STEP 1: Fetch ALL entries (not just top 10) to compare properly
        console.log(`🔄 Fetching ALL contest entries for live comparison...`);
        const allEntries = await CompetitionEntry.find({ contest: req.params.id })
            .populate('user', 'username email')
            .populate('achievementsEarned');
        
        console.log(`📊 Found ${allEntries.length} total participants`);
        
        // STEP 2: Update ALL entries with live prices
        console.log(`💹 Updating ALL portfolios with live market prices...`);
        let entriesWithTrades = 0;
        let entriesWithoutTrades = 0;
        
        for (let entry of allEntries) {
            if (entry.portfolio && entry.portfolio.length > 0) {
                entriesWithTrades++;
                console.log(`  🔄 Updating ${entry.user.username}'s portfolio (${entry.portfolio.length} positions)...`);
                
                for (let position of entry.portfolio) {
                    try {
                        const quoteResp = await axios.get(`http://localhost:5000/api/stocks/quote/${position.symbol}`);
                        const currentPrice = quoteResp.data.currentPrice || quoteResp.data.price;
                        
                        position.currentPrice = currentPrice;
                        position.currentValue = position.quantity * currentPrice;
                        position.investedAmount = position.quantity * position.averagePrice;
                        position.profitLoss = position.currentValue - position.investedAmount;
                        position.profitLossPercent = ((position.profitLoss / position.investedAmount) * 100);
                        
                        console.log(`    📈 ${position.symbol}: ₹${currentPrice} → P&L: ₹${position.profitLoss.toFixed(2)}`);
                    } catch (err) {
                        console.error(`❌ Error fetching price for ${position.symbol}:`, err.message);
                    }
                }
                entry.calculateMetrics();
                console.log(`  ✅ ${entry.user.username}: Total Returns = ${entry.totalReturnsPercent.toFixed(2)}%`);
            } else {
                entriesWithoutTrades++;
                console.log(`  ⚪ ${entry.user.username}: No trades yet (₹${entry.virtualBalance.toFixed(2)})`);
            }
        }
        
        console.log(`📊 Summary: ${entriesWithTrades} with trades, ${entriesWithoutTrades} without trades`);
        
        // STEP 3: Save all updated entries
        console.log(`💾 Saving ${allEntries.length} updated entries...`);
        await Promise.all(allEntries.map(e => e.save()));
        
        // STEP 4: Sort ALL entries by live returns% (not stale data)
        allEntries.sort((a, b) => b.totalReturnsPercent - a.totalReturnsPercent);
        
        // STEP 5: Assign ranks to ALL participants
        allEntries.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        // Save ranks for all
        await Promise.all(allEntries.map(e => e.save()));
        
        // STEP 6: Return only top N for display (but all were updated!)
        const leaderboard = allEntries.slice(0, limit);
        console.log(`✅ Returning top ${limit} after comparing all ${allEntries.length} live portfolios`);
        
        // Log detailed leaderboard data
        console.log(`\n🏆 LEADERBOARD DATA BEING SENT:`);
        leaderboard.forEach((entry, idx) => {
            console.log(`  ${idx + 1}. ${entry.user.username}:`);
            console.log(`     Virtual Balance: ₹${entry.virtualBalance.toFixed(2)}`);
            console.log(`     Portfolio Value: ₹${entry.portfolioValue?.toFixed(2) || 0}`);
            console.log(`     Total Value: ₹${entry.totalValue?.toFixed(2) || 0}`);
            console.log(`     Total Returns: ₹${entry.totalReturns?.toFixed(2) || 0} (${entry.totalReturnsPercent.toFixed(2)}%)`);
            console.log(`     Trades: ${entry.totalTrades}, Win Rate: ${entry.winRate?.toFixed(2) || 0}%`);
            console.log(`     Portfolio: ${entry.portfolio.length} positions`);
        });
        console.log(`\n`);
        
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get full leaderboard with pagination
router.get('/contests/:id/leaderboard/full', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        const total = await CompetitionEntry.countDocuments({ contest: req.params.id });
        
        const leaderboard = await CompetitionEntry.find({ contest: req.params.id })
            .populate('user', 'username email')
            .sort({ totalReturnsPercent: -1 })
            .skip(skip)
            .limit(limit);
        
        leaderboard.forEach((entry, index) => {
            entry.rank = skip + index + 1;
        });
        
        res.json({
            leaderboard,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
    try {
        const achievements = await Achievement.find({ isActive: true })
            .sort({ tier: 1, points: -1 });
        res.json(achievements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's achievements
router.get('/achievements/my', auth, async (req, res) => {
    try {
        const userAchievements = await UserAchievement.find({ user: req.user.id })
            .populate('achievement')
            .populate('contest', 'name')
            .sort({ earnedAt: -1 });
        res.json(userAchievements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all contests user has joined
router.get('/my-contests', auth, async (req, res) => {
    try {
        const entries = await CompetitionEntry.find({ user: req.user.id })
            .populate('contest')
            .sort({ createdAt: -1 });
        
        // Return just the contest IDs for quick lookup
        const contestIds = entries.map(e => e.contest._id.toString());
        res.json({ contestIds, entries });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper: Check and award achievements
async function checkAndAwardAchievements(entry) {
    try {
        const achievements = await Achievement.find({ isActive: true });
        
        for (const achievement of achievements) {
            // Check if already earned
            const alreadyEarned = await UserAchievement.findOne({
                user: entry.user,
                achievement: achievement._id
            });
            
            if (alreadyEarned) continue;
            
            let shouldAward = false;
            const criteria = achievement.criteria;
            
            switch (criteria.type) {
                case 'trades_count':
                    shouldAward = compare(entry.totalTrades, criteria.value, criteria.comparison);
                    break;
                case 'win_rate':
                    shouldAward = compare(entry.winRate, criteria.value, criteria.comparison);
                    break;
                case 'returns_percent':
                    shouldAward = compare(entry.totalReturnsPercent, criteria.value, criteria.comparison);
                    break;
                case 'contest_rank':
                    shouldAward = compare(entry.rank, criteria.value, criteria.comparison);
                    break;
            }
            
            if (shouldAward) {
                const userAchievement = new UserAchievement({
                    user: entry.user,
                    achievement: achievement._id,
                    contest: entry.contest,
                    metadata: {
                        returns: entry.totalReturnsPercent,
                        rank: entry.rank,
                        winRate: entry.winRate
                    }
                });
                
                await userAchievement.save();
                entry.achievementsEarned.push(achievement._id);
            }
        }
        
        await entry.save();
    } catch (error) {
        console.error('Error awarding achievements:', error);
    }
}

function compare(value, target, comparison) {
    switch (comparison) {
        case 'greater_than': return value > target;
        case 'less_than': return value < target;
        case 'equals': return value === target;
        case 'greater_equal': return value >= target;
        case 'less_equal': return value <= target;
        default: return false;
    }
}

module.exports = router;
