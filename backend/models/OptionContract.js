const mongoose = require('mongoose');

const optionContractSchema = new mongoose.Schema({
    symbol: { type: String, required: true, index: true },
    expiry: { type: Date, required: true, index: true },
    strike: { type: Number, required: true },
    type: { type: String, enum: ['CALL', 'PUT'], required: true },
    lotSize: { type: Number, default: 25 },
    premium: { type: Number, required: true },
    underlyingPrice: { type: Number, required: true },
    exchange: { type: String, default: 'NSE' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OptionContract', optionContractSchema);
