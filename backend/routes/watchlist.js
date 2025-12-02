const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Watchlist = require('../models/Watchlist');
const router = express.Router();

// Auth for all routes
router.use(auth);

// Get all watchlists for current user
router.get('/', async (req, res) => {
    try {
        const lists = await Watchlist.find({ user: req.user.id }).lean();
        res.json(lists);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch watchlists', details: e.message });
    }
});

// Create new watchlist
router.post('/', async (req, res) => {
    try {
        const { name, symbols = [] } = req.body || {};
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'name is required' });
        }
        const wl = await Watchlist.create({ user: req.user.id, name: String(name).trim(), symbols });
        res.status(201).json(wl);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create watchlist', details: e.message });
    }
});

// Update watchlist (name, symbols)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, symbols } = req.body || {};
        const wl = await Watchlist.findOne({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        if (name) wl.name = String(name).trim();
        if (Array.isArray(symbols)) wl.symbols = symbols;
        await wl.save();
        res.json(wl);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update watchlist', details: e.message });
    }
});

// Delete watchlist
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const wl = await Watchlist.findOneAndDelete({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete watchlist', details: e.message });
    }
});

// Add symbol to watchlist
router.post('/:id/symbols', async (req, res) => {
    try {
        const { id } = req.params;
        const { symbol } = req.body || {};
        if (!symbol) return res.status(400).json({ error: 'symbol is required' });
        const wl = await Watchlist.findOne({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        if (!wl.symbols.includes(symbol)) wl.symbols.push(symbol);
        await wl.save();
        res.json(wl);
    } catch (e) {
        res.status(500).json({ error: 'Failed to add symbol', details: e.message });
    }
});

// Remove symbol from watchlist
router.delete('/:id/symbols/:symbol', async (req, res) => {
    try {
        const { id, symbol } = req.params;
        const wl = await Watchlist.findOne({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        wl.symbols = wl.symbols.filter(s => s !== symbol);
        await wl.save();
        res.json(wl);
    } catch (e) {
        res.status(500).json({ error: 'Failed to remove symbol', details: e.message });
    }
});

// Create or update price alert rule for a symbol
router.post('/:id/alerts', async (req, res) => {
    try {
        const { id } = req.params;
        const { symbol, condition, threshold, enabled = true } = req.body || {};
        if (!symbol || !condition || typeof threshold !== 'number') {
            return res.status(400).json({ error: 'symbol, condition, threshold are required' });
        }
        const wl = await Watchlist.findOne({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        const idx = wl.alerts.findIndex(a => a.symbol === symbol && a.condition === condition);
        const rule = { symbol, condition, threshold, enabled };
        if (idx >= 0) wl.alerts[idx] = { ...wl.alerts[idx], ...rule };
        else wl.alerts.push(rule);
        await wl.save();
        res.json(wl);
    } catch (e) {
        res.status(500).json({ error: 'Failed to set alert', details: e.message });
    }
});

// Evaluate alerts for a watchlist (simple on-demand check)
router.post('/:id/evaluate', async (req, res) => {
    try {
        const { id } = req.params;
        const wl = await Watchlist.findOne({ _id: id, user: req.user.id });
        if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
        const results = [];
        for (const alert of wl.alerts.filter(a => a.enabled)) {
            try {
                const quoteResp = await axios.get(`http://localhost:5000/api/stocks/quote/${alert.symbol}`);
                const price = quoteResp.data?.price ?? quoteResp.data?.currentPrice;
                if (typeof price !== 'number') continue;
                let triggered = false;
                if (alert.condition === 'above' && price > alert.threshold) triggered = true;
                if (alert.condition === 'below' && price < alert.threshold) triggered = true;
                // percentUp/percentDown need previousClose
                const prev = quoteResp.data?.previousClose;
                if (typeof prev === 'number' && prev > 0) {
                    const pct = ((price - prev) / prev) * 100;
                    if (alert.condition === 'percentUp' && pct >= alert.threshold) triggered = true;
                    if (alert.condition === 'percentDown' && pct <= -Math.abs(alert.threshold)) triggered = true;
                }
                if (triggered) {
                    alert.lastTriggeredAt = new Date();
                    results.push({ symbol: alert.symbol, condition: alert.condition, threshold: alert.threshold, price, triggered: true });
                } else {
                    results.push({ symbol: alert.symbol, condition: alert.condition, threshold: alert.threshold, price, triggered: false });
                }
            } catch (e) {
                results.push({ symbol: alert.symbol, error: e.message });
            }
        }
        await wl.save();
        res.json({ watchlistId: wl._id, results });
    } catch (e) {
        res.status(500).json({ error: 'Failed to evaluate alerts', details: e.message });
    }
});

module.exports = router;
