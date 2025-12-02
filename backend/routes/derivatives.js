const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Position = require('../models/Position');
const router = express.Router();

router.use(auth);

// Util: get underlying price
async function getUnderlying(symbol) {
    const r = await axios.get(`http://localhost:5000/api/stocks/quote/${symbol}`);
    return r.data?.price ?? r.data?.currentPrice;
}

// List basic option contracts (mock from underlying)
router.get('/options', async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) return res.status(400).json({ error: 'symbol required' });
        let spot = await getUnderlying(symbol).catch(() => null);
        if (!spot || isNaN(spot)) {
            // Fallback spot for common indices or generic equity
            if (/NIFTY|BANKNIFTY/i.test(symbol)) spot = 15000;
            else spot = 1000;
            console.warn('⚠️ Using fallback spot for', symbol, '->', spot);
        }
        const strikes = [-2, -1, 0, 1, 2].map(m => Math.round((spot + m * (spot * 0.05)) / 5) * 5);
        const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
        const contracts = [];
        for (const k of strikes) {
            const premiumCall = Math.max(5, Math.round(Math.abs(spot - k) * 0.4));
            const premiumPut = Math.max(5, Math.round(Math.abs(spot - k) * 0.35));
            contracts.push({ symbol, expiry, strike: k, type: 'CALL', lotSize: 25, premium: premiumCall, underlyingPrice: spot });
            contracts.push({ symbol, expiry, strike: k, type: 'PUT', lotSize: 25, premium: premiumPut, underlyingPrice: spot });
        }
        res.json(contracts);
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Options chain (mocked with IV/OI and moneyness)
router.get('/options/chain', async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) return res.status(400).json({ error: 'symbol required' });
        let spot = await getUnderlying(symbol).catch(() => null);
        if (!spot || isNaN(spot)) {
            if (/NIFTY|BANKNIFTY/i.test(symbol)) spot = 15000;
            else spot = 1000;
            console.warn('⚠️ Using fallback spot for', symbol, '->', spot);
        }
        const expiry = new Date(); expiry.setDate(expiry.getDate() + 14);
        const strikes = [];
        const step = Math.max(5, Math.round(spot * 0.01));
        for (let k = spot - step * 6; k <= spot + step * 6; k += step) {
            strikes.push(Math.round(k));
        }
        const rows = strikes.map(strike => {
            const m = Math.abs(strike - spot) / spot;
            const ivBase = 0.18 + (m * 0.6);
            const ivCall = +(ivBase * 100).toFixed(2);
            const ivPut = +(ivBase * 100).toFixed(2);
            const oiBase = Math.max(10000, Math.round(50000 * (1 - Math.min(1, m * 2))));
            const oiCall = oiBase + Math.round((Math.random() - 0.5) * 5000);
            const oiPut = oiBase + Math.round((Math.random() - 0.5) * 5000);
            const callPremium = Math.max(2, Math.round(Math.max(0, spot - strike) * 0.5 + ivBase * spot * 0.05));
            const putPremium = Math.max(2, Math.round(Math.max(0, strike - spot) * 0.5 + ivBase * spot * 0.05));
            return {
                strike: Math.round(strike),
                call: { premium: callPremium, iv: ivCall, oi: oiCall },
                put: { premium: putPremium, iv: ivPut, oi: oiPut },
            };
        });
        res.json({ symbol, expiry, spot, lotSize: 25, chain: rows });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// List basic futures contracts (mock from underlying)
router.get('/futures', async (req, res) => {
    try {
        const { symbol } = req.query;
        if (!symbol) return res.status(400).json({ error: 'symbol required' });
        const spot = await getUnderlying(symbol);
        const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
        const basis = spot * 0.01; // 1% basis
        const contracts = [
            { symbol, expiry, lotSize: 25, price: +(spot + basis).toFixed(2), marginPercent: 15, underlyingPrice: spot }
        ];
        res.json(contracts);
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Options payoff curve
router.post('/options/payoff', async (req, res) => {
    try {
        const { type, strike, premium, side = 'BUY', lotSize = 25 } = req.body || {};
        if (!type || !strike || !premium) return res.status(400).json({ error: 'type,strike,premium required' });
        const points = [];
        for (let s = strike * 0.6; s <= strike * 1.4; s += Math.max(1, strike * 0.02)) {
            const intrinsic = type === 'CALL' ? Math.max(0, s - strike) : Math.max(0, strike - s);
            let pnl = (intrinsic - premium) * lotSize;
            if (side === 'SELL') pnl = -pnl;
            points.push({ price: +s.toFixed(2), pnl: +pnl.toFixed(2) });
        }
        res.json({ points });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Futures payoff curve
router.post('/futures/payoff', async (req, res) => {
    try {
        const { entryPrice, lotSize = 25, side = 'BUY' } = req.body || {};
        if (!entryPrice) return res.status(400).json({ error: 'entryPrice required' });
        const points = [];
        const start = entryPrice * 0.9, end = entryPrice * 1.1;
        for (let s = start; s <= end; s += entryPrice * 0.01) {
            let pnl = (s - entryPrice) * lotSize;
            if (side === 'SELL') pnl = -pnl;
            points.push({ price: +s.toFixed(2), pnl: +pnl.toFixed(2) });
        }
        res.json({ points });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Greeks via Black-Scholes (approx)
router.post('/options/greeks', async (req, res) => {
    try {
        const { spot, strike, iv, timeDays, rate = 0.06, type = 'CALL' } = req.body || {};
        if (![spot, strike, iv, timeDays].every(v => typeof v === 'number')) {
            return res.status(400).json({ error: 'spot,strike,iv,timeDays must be numbers' });
        }
        const T = Math.max(1e-6, timeDays / 365);
        const sigma = iv / 100;
        const d1 = (Math.log(spot / strike) + (rate + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
        const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        function erf(x){
            const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
            const sign = x < 0 ? -1 : 1; x = Math.abs(x);
            const t = 1.0/(1.0 + p*x);
            const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x*x);
            return sign*y;
        }
        const delta = type === 'CALL' ? N(d1) : N(d1) - 1;
        const gamma = pdf(d1) / (spot * sigma * Math.sqrt(T));
        const vega = spot * pdf(d1) * Math.sqrt(T) / 100;
        const thetaCall = -(spot * pdf(d1) * sigma)/(2*Math.sqrt(T)) - rate*strike*Math.exp(-rate*T)*N(d2);
        const thetaPut = -(spot * pdf(d1) * sigma)/(2*Math.sqrt(T)) + rate*strike*Math.exp(-rate*T)*(1 - N(d2));
        const theta = (type === 'CALL' ? thetaCall : thetaPut) / 365;
        const rhoCall = strike * T * Math.exp(-rate*T) * N(d2) / 100;
        const rhoPut = -strike * T * Math.exp(-rate*T) * (1 - N(d2)) / 100;
        const rho = type === 'CALL' ? rhoCall : rhoPut;
        res.json({ delta:+delta.toFixed(2), gamma:+gamma.toFixed(4), theta:+theta.toFixed(2), vega:+vega.toFixed(2), rho:+rho.toFixed(2) });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Open option position (simulated)
router.post('/options/:action', async (req, res) => {
    try {
        const { action } = req.params; // buy/sell
        const { symbol, strike, type, premium, lotSize = 25, quantity = 1 } = req.body || {};
        if (!symbol || !strike || !type || !premium) return res.status(400).json({ error: 'symbol,strike,type,premium required' });
        const user = await User.findById(req.user.id);
        const cost = premium * lotSize * quantity;
        if (action.toUpperCase() === 'BUY') {
            if (user.balance < cost) return res.status(400).json({ error: 'Insufficient balance' });
            user.balance -= cost;
        } else {
            // credit for sell
            user.balance += cost;
        }
        await user.save();
        const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
        const pos = await Position.create({
            user: req.user.id,
            kind: 'OPTION', side: action.toUpperCase(), symbol, expiry, strike, type,
            lotSize, quantity, entryPrice: premium, marginBlocked: 0, pnl: 0
        });
        res.json({ message: 'Position opened', balance: user.balance, position: pos });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

// Open futures position (simulated)
router.post('/futures/:action', async (req, res) => {
    try {
        const { action } = req.params; // buy/sell
        const { symbol, price, lotSize = 25, quantity = 1, marginPercent = 15 } = req.body || {};
        if (!symbol || !price) return res.status(400).json({ error: 'symbol,price required' });
        const user = await User.findById(req.user.id);
        const margin = (price * lotSize * quantity) * (marginPercent / 100);
        if (user.balance < margin) return res.status(400).json({ error: 'Insufficient margin' });
        user.balance -= margin;
        await user.save();
        const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
        const pos = await Position.create({
            user: req.user.id,
            kind: 'FUTURE', side: action.toUpperCase(), symbol, expiry,
            lotSize, quantity, entryPrice: price, marginBlocked: margin, pnl: 0
        });
        res.json({ message: 'Position opened', balance: user.balance, position: pos });
    } catch (e) { res.status(500).json({ error: 'failed', details: e.message }); }
});

module.exports = router;

