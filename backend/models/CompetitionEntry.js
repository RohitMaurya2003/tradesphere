const mongoose = require('mongoose');

const competitionEntrySchema = new mongoose.Schema({
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    virtualBalance: {
        type: Number,
        required: true
    },
    initialBalance: {
        type: Number,
        required: true
    },
    // Virtual portfolio for this contest
    portfolio: [{
        symbol: String,
        quantity: Number,
        averagePrice: Number,
        currentPrice: Number,
        investedAmount: Number,
        currentValue: Number,
        profitLoss: Number,
        profitLossPercent: Number
    }],
    // Virtual transactions for this contest
    transactions: [{
        type: {
            type: String,
            enum: ['BUY', 'SELL']
        },
        symbol: String,
        quantity: Number,
        price: Number,
        totalAmount: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    // Derivative positions (options/futures)
    derivativePositions: [{
        type: {
            type: String,
            enum: ['CALL', 'PUT', 'FUTURE']
        },
        symbol: String,
        strike: Number,
        expiry: Date,
        quantity: Number,
        entryPrice: Number,
        currentPrice: Number,
        profitLoss: Number,
        timestamp: Date
    }],
    // Performance metrics
    totalReturns: {
        type: Number,
        default: 0
    },
    totalReturnsPercent: {
        type: Number,
        default: 0
    },
    dayReturns: {
        type: Number,
        default: 0
    },
    totalTrades: {
        type: Number,
        default: 0
    },
    profitableTrades: {
        type: Number,
        default: 0
    },
    winRate: {
        type: Number,
        default: 0
    },
    maxDrawdown: {
        type: Number,
        default: 0
    },
    sharpeRatio: {
        type: Number,
        default: 0
    },
    // Ranking
    rank: {
        type: Number,
        default: null
    },
    // Strategy focus
    primaryStrategy: {
        type: String,
        enum: ['equity', 'options', 'futures', 'mixed'],
        default: 'equity'
    },
    // Achievements earned during this contest
    achievementsEarned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    joinedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast leaderboard queries
competitionEntrySchema.index({ contest: 1, totalReturnsPercent: -1 });
competitionEntrySchema.index({ contest: 1, user: 1 }, { unique: true });

// Calculate performance metrics
competitionEntrySchema.methods.calculateMetrics = function() {
    const portfolioValue = this.portfolio.reduce((sum, pos) => sum + (pos.currentValue || 0), 0);
    const totalValue = this.virtualBalance + portfolioValue;
    
    this.totalReturns = totalValue - this.initialBalance;
    this.totalReturnsPercent = ((this.totalReturns / this.initialBalance) * 100);
    
    this.totalTrades = this.transactions.length;
    this.profitableTrades = this.transactions.filter(t => {
        // Simplified - in reality need to match buy/sell pairs
        return t.type === 'SELL';
    }).length;
    
    this.winRate = this.totalTrades > 0 ? (this.profitableTrades / this.totalTrades) * 100 : 0;
    
    this.lastUpdated = Date.now();
    
    return this;
};

module.exports = mongoose.model('CompetitionEntry', competitionEntrySchema);
