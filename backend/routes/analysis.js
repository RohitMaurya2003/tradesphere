const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Load key from environment
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
if (!GEMINI_API_KEY) console.warn('❌ GEMINI_API_KEY not set');

let genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Helper: safe stringify
function safeStringify(obj) {
    if (typeof obj === 'string') return obj;
    try {
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return String(obj);
    }
}

// Helper: extract bullet points
function extractBulletPoints(text, keywords) {
    const lines = String(text || '').split('\n');
    const points = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^[\d\-\*•]/) || keywords.some(k => trimmed.toLowerCase().includes(k))) {
            const cleaned = trimmed.replace(/^[\d\-\*•\.\)]+\s*/, '').trim();
            if (cleaned.length > 5 && !/^\{|\[/.test(cleaned)) points.push(cleaned);
        }
    }
    return points.slice(0, 8);
}

// Discover models via REST (returns array of model objects or empty)
async function listAvailableModels() {
    if (!GEMINI_API_KEY) return [];
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
        const resp = await axios.get(url, { timeout: 8000 });
        return resp.data?.models || [];
    } catch (e) {
        console.warn('listAvailableModels failed:', e.message || e);
        return [];
    }
}

// Select best model id from list (string like "models/text-bison-001")
function pickModelId(models) {
    if (!Array.isArray(models) || models.length === 0) return null;
    // Prefer explicit gemini names
    const gemini = models.find(m => /gemini/i.test(m.name));
    if (gemini && gemini.name) return gemini.name;
    const bison = models.find(m => /bison/i.test(m.name));
    if (bison && bison.name) return bison.name;
    // fallback to first model with name
    const any = models.find(m => m.name);
    return any?.name || null;
}

// Return ordered candidate model ids (strings) by preference
function pickModelCandidates(models) {
    const ids = [];
    if (!Array.isArray(models)) return ids;
    // push all gemini models first
    models.filter(m => /gemini/i.test(m.name)).forEach(m => ids.push(m.name));
    // then bison
    models.filter(m => /bison/i.test(m.name)).forEach(m => { if (!ids.includes(m.name)) ids.push(m.name); });
    // then others
    models.filter(m => !/gemini|bison/i.test(m.name) && m.name).forEach(m => { if (!ids.includes(m.name)) ids.push(m.name); });
    return ids;
}

// Main analyze endpoint
router.post('/analyze', async (req, res) => {
    try {
        const { query, stockData } = req.body || {};
        if (!query) return res.status(400).json({ error: 'Stock symbol is required' });

        console.log('Analyzing stock:', query);

        // Discover available models and try candidates in order until one succeeds
        const models = await listAvailableModels();
        const candidates = pickModelCandidates(models);
        // ensure fallback at end
        if (!candidates.includes('models/text-bison-001')) candidates.push('models/text-bison-001');

        let lastError = null;
        let text = '';
        let usedModel = null;

        const prompt = `Analyze the stock ${query} in detail. Provide:\n\n1. A comprehensive analysis of the stock\n2. Key reasons to buy (at least 5 points)\n3. Key risks or reasons to be cautious (at least 5 points)\n4. Overall recommendation (Buy/Hold/Sell)\n\n${stockData ? `Current Stock Data:\n- Symbol: ${stockData.symbol}\n- Current Price: ${stockData.currentPrice || stockData.price}\n- Change: ${stockData.change} (${stockData.changePercent}%)\n- Volume: ${stockData.volume}\n- Exchange: ${stockData.exchange || 'NSE'}` : ''}\n\nFormat your response as JSON with keys: analysis, buyReasons, sellReasons, recommendation, targetPrice, riskLevel.`;

        for (const modelId of candidates) {
            try {
                console.log('Trying model:', modelId);
                const candidateModel = genAI.getGenerativeModel({ model: modelId });
                const result = await candidateModel.generateContent(prompt);
                const response = await result.response;
                try { text = response.text(); } catch (e) { text = safeStringify(response); }
                usedModel = modelId;
                console.log('Model succeeded:', modelId);
                break;
            } catch (mErr) {
                console.warn('Model failed:', modelId, safeStringify(mErr?.message || mErr));
                lastError = mErr;
                // continue to next candidate
            }
        }

        if (!text) {
            // All candidates failed
            console.error('All model candidates failed');
            const detail = safeStringify(lastError?.errorDetails || lastError?.message || lastError || 'No response');
            return res.status(500).json({ error: 'Analysis failed', message: detail });
        }

        console.log('Raw model text length:', (text || '').length);

        // Attempt parse
        let parsed;
        try {
            const cleaned = String(text).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            // fallback: create structured response
            parsed = {
                analysis: text,
                buyReasons: extractBulletPoints(text, ['buy', 'positive', 'strength', 'advantage']),
                sellReasons: extractBulletPoints(text, ['risk', 'negative', 'concern', 'weakness']),
                recommendation: 'See analysis',
                timestamp: new Date().toISOString()
            };
        }

        parsed.symbol = query;
        parsed.generatedAt = new Date().toISOString();

        return res.json(parsed);
    } catch (err) {
        console.error('Analysis error:', err);
        const detail = safeStringify(err?.errorDetails || err?.message || err);
        return res.status(500).json({ error: 'Analysis failed', message: detail });
    }
});

// Quick endpoint
router.get('/quick/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        if (!symbol) return res.status(400).json({ error: 'symbol required' });

        const models = await listAvailableModels();
        const candidates = pickModelCandidates(models);
        if (!candidates.includes('models/text-bison-001')) candidates.push('models/text-bison-001');

        let lastError = null;
        let text = '';
        let usedModel = null;

        const prompt = `Provide a brief 2-3 sentence analysis of ${symbol} stock for Indian market. Include current sentiment and key factor.`;

        for (const modelId of candidates) {
            try {
                console.log('Quick: trying model', modelId);
                const m = genAI.getGenerativeModel({ model: modelId });
                const result = await m.generateContent(prompt);
                const response = await result.response;
                try { text = response.text(); } catch (e) { text = safeStringify(response); }
                usedModel = modelId;
                break;
            } catch (e) {
                console.warn('Quick model failed', modelId, safeStringify(e?.message || e));
                lastError = e;
            }
        }

        if (!text) {
            const detail = safeStringify(lastError?.errorDetails || lastError?.message || lastError || 'No response');
            return res.status(500).json({ error: 'Quick analysis failed', message: detail });
        }

        return res.json({ symbol, quickAnalysis: text, model: usedModel, timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Quick analysis error:', err);
        const detail = safeStringify(err?.errorDetails || err?.message || err);
        return res.status(500).json({ error: 'Quick analysis failed', message: detail });
    }
});

// Reload key at runtime
router.post('/reload-key', (req, res) => {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key is required in body' });
    GEMINI_API_KEY = key;
    process.env.GEMINI_API_KEY = key;
    genAI = new GoogleGenerativeAI(key || '');
    console.log('🔁 GEMINI_API_KEY reloaded');
    return res.json({ ok: true });
});

module.exports = router;
