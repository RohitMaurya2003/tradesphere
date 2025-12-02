const mongoose = require('mongoose');

const alertRuleSchema = new mongoose.Schema({
    symbol: { type: String, required: true, trim: true },
    condition: { type: String, enum: ['above', 'below', 'percentUp', 'percentDown'], required: true },
    threshold: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date }
}, { _id: false });

const watchlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    symbols: { type: [String], default: [] },
    alerts: { type: [alertRuleSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

watchlistSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Watchlist', watchlistSchema);
