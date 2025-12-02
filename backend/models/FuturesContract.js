const mongoose = require('mongoose');

const futuresContractSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    expiry: { type: Date, required: true, index: true },
    lotSize: { type: Number, default: 25 },
    price: { type: Number, required: true },
    marginPercent: { type: Number, default: 15 },
    underlyingPrice: { type: Number, required: true },
    exchange: { type: String, default: 'NSE' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FuturesContract', futuresContractSchema);
