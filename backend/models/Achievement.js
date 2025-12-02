const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '🏆' // emoji or icon name
    },
    category: {
        type: String,
        enum: ['trading', 'performance', 'risk', 'milestone', 'social'],
        required: true
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    // Criteria to unlock
    criteria: {
        type: {
            type: String,
            enum: ['trades_count', 'win_rate', 'returns_percent', 'drawdown', 'sharpe_ratio', 'options_trades', 'contest_rank', 'custom']
        },
        value: Number,
        comparison: {
            type: String,
            enum: ['greater_than', 'less_than', 'equals', 'greater_equal', 'less_equal']
        }
    },
    points: {
        type: Number,
        default: 10
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// User's earned achievements
const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true
    },
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        default: null // null if earned outside contest
    },
    earnedAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed // Store context like final rank, win rate, etc.
    }
});

userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };
