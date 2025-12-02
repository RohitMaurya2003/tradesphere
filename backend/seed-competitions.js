const mongoose = require('mongoose');
require('dotenv').config();
const Contest = require('./models/Contest');
const { Achievement } = require('./models/Achievement');

const MONGODB_URI = process.env.MONGODB_URI;

// Sample contests
const contests = [
    {
        name: "Weekly Trading Championship - Week 1",
        description: "Compete with traders across India in this week-long paper trading contest. Start with ₹1,00,000 virtual money and aim for the highest returns!",
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Started yesterday
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
        initialBalance: 100000,
        prizePool: "Virtual Badges & Top Trader Recognition",
        contestType: "weekly",
        status: "active",
        rules: [
            "Only virtual money will be used - no real money required",
            "All trades execute at real market prices",
            "Trade stocks, options, and futures",
            "Contest ends automatically at end date",
            "Top 10 traders win exclusive badges"
        ]
    },
    {
        name: "Options Master Challenge",
        description: "Prove your options trading skills! Focus on options strategies to maximize returns with controlled risk.",
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Starts in 2 days
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 weeks duration
        initialBalance: 100000,
        prizePool: "Options Expert Badge + Leaderboard Glory",
        contestType: "custom",
        status: "upcoming",
        rules: [
            "Must execute at least 1 options trade to qualify",
            "Options Greeks will be your best friend",
            "Multi-leg strategies encouraged",
            "Risk management is key"
        ]
    },
    {
        name: "Monthly Trading Marathon",
        description: "Long-term strategy test! 30 days to build the best portfolio and maximize risk-adjusted returns.",
        startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        initialBalance: 200000,
        prizePool: "Monthly Champion Badge + Hall of Fame",
        contestType: "monthly",
        status: "upcoming",
        maxParticipants: 1000,
        rules: [
            "30-day paper trading marathon",
            "₹2,00,000 starting capital",
            "Limited to first 1000 participants",
            "Consistency matters - avoid big losses!"
        ]
    }
];

// Achievements
const achievements = [
    {
        name: "First Trade",
        description: "Execute your first trade in any contest",
        icon: "🎯",
        category: "milestone",
        tier: "bronze",
        criteria: {
            type: "trades_count",
            value: 1,
            comparison: "greater_equal"
        },
        points: 10,
        rarity: "common"
    },
    {
        name: "Active Trader",
        description: "Complete 10 trades",
        icon: "📈",
        category: "trading",
        tier: "silver",
        criteria: {
            type: "trades_count",
            value: 10,
            comparison: "greater_equal"
        },
        points: 25,
        rarity: "common"
    },
    {
        name: "Day Trader",
        description: "Execute 50+ trades in a contest",
        icon: "⚡",
        category: "trading",
        tier: "gold",
        criteria: {
            type: "trades_count",
            value: 50,
            comparison: "greater_equal"
        },
        points: 50,
        rarity: "rare"
    },
    {
        name: "Profitable Trader",
        description: "Achieve positive returns (>0%)",
        icon: "💰",
        category: "performance",
        tier: "silver",
        criteria: {
            type: "returns_percent",
            value: 0,
            comparison: "greater_than"
        },
        points: 20,
        rarity: "common"
    },
    {
        name: "Double Digit Returns",
        description: "Achieve 10%+ returns in a contest",
        icon: "🚀",
        category: "performance",
        tier: "gold",
        criteria: {
            type: "returns_percent",
            value: 10,
            comparison: "greater_equal"
        },
        points: 50,
        rarity: "rare"
    },
    {
        name: "Master Trader",
        description: "Achieve 25%+ returns - Elite performance!",
        icon: "👑",
        category: "performance",
        tier: "platinum",
        criteria: {
            type: "returns_percent",
            value: 25,
            comparison: "greater_equal"
        },
        points: 100,
        rarity: "legendary"
    },
    {
        name: "Consistent Winner",
        description: "Win rate above 60%",
        icon: "🎖️",
        category: "performance",
        tier: "gold",
        criteria: {
            type: "win_rate",
            value: 60,
            comparison: "greater_equal"
        },
        points: 75,
        rarity: "epic"
    },
    {
        name: "Podium Finish",
        description: "Finish in Top 3 of any contest",
        icon: "🥉",
        category: "milestone",
        tier: "gold",
        criteria: {
            type: "contest_rank",
            value: 3,
            comparison: "less_equal"
        },
        points: 100,
        rarity: "epic"
    },
    {
        name: "Champion",
        description: "Win 1st place in a contest!",
        icon: "🏆",
        category: "milestone",
        tier: "platinum",
        criteria: {
            type: "contest_rank",
            value: 1,
            comparison: "equals"
        },
        points: 200,
        rarity: "legendary"
    },
    {
        name: "Options Enthusiast",
        description: "Execute your first options trade",
        icon: "📊",
        category: "trading",
        tier: "silver",
        criteria: {
            type: "options_trades",
            value: 1,
            comparison: "greater_equal"
        },
        points: 30,
        rarity: "common"
    },
    {
        name: "Risk Manager",
        description: "Keep drawdown under 5%",
        icon: "🛡️",
        category: "risk",
        tier: "gold",
        criteria: {
            type: "drawdown",
            value: 5,
            comparison: "less_equal"
        },
        points: 60,
        rarity: "rare"
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Clear existing data (optional)
        console.log('🗑️ Clearing existing contests and achievements...');
        await Contest.deleteMany({});
        await Achievement.deleteMany({});
        
        // Insert contests
        console.log('📝 Inserting contests...');
        const insertedContests = await Contest.insertMany(contests);
        console.log(`✅ Inserted ${insertedContests.length} contests`);
        
        // Insert achievements
        console.log('🏆 Inserting achievements...');
        const insertedAchievements = await Achievement.insertMany(achievements);
        console.log(`✅ Inserted ${insertedAchievements.length} achievements`);
        
        console.log('\n🎉 Database seeded successfully!');
        console.log('\nContests created:');
        insertedContests.forEach(c => {
            console.log(`  - ${c.name} (${c.status})`);
        });
        
        console.log('\nAchievements created:');
        insertedAchievements.forEach(a => {
            console.log(`  - ${a.icon} ${a.name} (${a.tier})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
