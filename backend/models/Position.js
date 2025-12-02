const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['OPTION', 'FUTURE'], required: true },
    side: { type: String, enum: ['BUY', 'SELL'], required: true },
    symbol: { type: String, required: true },
    expiry: { type: Date, required: true },
    strike: { type: Number }, // for options
    type: { type: String, enum: ['CALL', 'PUT'] },
    lotSize: { type: Number, default: 25 },
    quantity: { type: Number, required: true },
    entryPrice: { type: Number, required: true }, // premium for options, futures price for futures
    marginBlocked: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    isOpen: { type: Boolean, default: true }
});

module.exports = mongoose.model('Position', positionSchema);
