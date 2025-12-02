const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get user portfolio with current market prices
router.get('/', async (req, res) => {
    try {
        console.log('📊 Fetching portfolio for user:', req.user.id);

        let portfolio = await Portfolio.findOne({ user: req.user.id });

        if (!portfolio) {
            console.log('📝 Creating new portfolio for user:', req.user.id);
            portfolio = await Portfolio.create({ user: req.user.id, stocks: [] });
            return res.json({
                stocks: [],
                summary: {
                    totalInvested: 0,
                    totalCurrentValue: 0,
                    totalProfitLoss: 0,
                    totalProfitLossPercentage: 0,
                    lastUpdated: new Date().toISOString()
                }
            });
        }

        console.log('🔍 Portfolio stocks:', portfolio.stocks);

        // If no stocks, return empty portfolio
        if (portfolio.stocks.length === 0) {
            return res.json({
                stocks: [],
                summary: {
                    totalInvested: 0,
                    totalCurrentValue: 0,
                    totalProfitLoss: 0,
                    totalProfitLossPercentage: 0,
                    lastUpdated: new Date().toISOString()
                }
            });
        }

        // Get current prices for all stocks using batch API
        const symbols = portfolio.stocks.map(stock => stock.symbol).join(',');
        let currentPricesData = [];

        try {
            console.log(`🔄 Fetching batch prices for symbols: ${symbols}`);
            const pricesResponse = await axios.get(`http://localhost:5000/api/stocks/batch?symbols=${symbols}`);
            currentPricesData = pricesResponse.data;
            console.log('✅ Batch prices fetched:', currentPricesData);
        } catch (error) {
            console.error('❌ Error fetching batch prices:', error.message);
            // If batch fails, try individual quotes
            currentPricesData = [];
            for (const stock of portfolio.stocks) {
                try {
                    const quoteResponse = await axios.get(`http://localhost:5000/api/stocks/quote/${stock.symbol}`);
                    currentPricesData.push(quoteResponse.data);
                } catch (individualError) {
                    console.error(`❌ Error fetching price for ${stock.symbol}:`, individualError.message);
                    // Use average price as fallback
                    currentPricesData.push({
                        symbol: stock.symbol,
                        currentPrice: stock.averagePrice,
                        companyName: `${stock.symbol} Limited`
                    });
                }
            }
        }

        // Create a map of current prices for easy lookup
        const currentPricesMap = {};
        currentPricesData.forEach(stockData => {
            if (stockData && stockData.symbol) {
                currentPricesMap[stockData.symbol] = {
                    currentPrice: stockData.currentPrice || stockData.price || stockData.averagePrice,
                    companyName: stockData.companyName || `${stockData.symbol} Limited`
                };
            }
        });

        // Calculate portfolio data with current prices
        const stocksWithCurrentData = portfolio.stocks.map(stock => {
            const currentPriceInfo = currentPricesMap[stock.symbol] || {
                currentPrice: stock.averagePrice,
                companyName: `${stock.symbol} Limited`
            };

            const currentPrice = currentPriceInfo.currentPrice;
            const currentValue = currentPrice * stock.quantity;
            const profitLoss = currentValue - stock.totalInvested;
            const profitLossPercentage = stock.totalInvested > 0 ? (profitLoss / stock.totalInvested) * 100 : 0;

            return {
                symbol: stock.symbol,
                quantity: stock.quantity,
                averagePrice: stock.averagePrice,
                totalInvested: stock.totalInvested,
                currentPrice: currentPrice,
                currentValue: parseFloat(currentValue.toFixed(2)),
                profitLoss: parseFloat(profitLoss.toFixed(2)),
                profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2)),
                companyName: currentPriceInfo.companyName,
                lastUpdated: new Date().toISOString()
            };
        });

        // Calculate portfolio totals
        const totalInvested = stocksWithCurrentData.reduce((sum, stock) => sum + stock.totalInvested, 0);
        const totalCurrentValue = stocksWithCurrentData.reduce((sum, stock) => sum + stock.currentValue, 0);
        const totalProfitLoss = totalCurrentValue - totalInvested;
        const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        const portfolioWithCurrentData = {
            _id: portfolio._id,
            user: portfolio.user,
            stocks: stocksWithCurrentData,
            summary: {
                totalInvested: parseFloat(totalInvested.toFixed(2)),
                totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
                totalProfitLoss: parseFloat(totalProfitLoss.toFixed(2)),
                totalProfitLossPercentage: parseFloat(totalProfitLossPercentage.toFixed(2)),
                lastUpdated: new Date().toISOString()
            },
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt
        };

        console.log('✅ Portfolio with current data:', {
            totalStocks: stocksWithCurrentData.length,
            totalInvested,
            totalCurrentValue,
            totalProfitLoss
        });

        res.json(portfolioWithCurrentData);
    } catch (error) {
        console.error('❌ Error fetching portfolio:', error);
        res.status(500).json({
            error: 'Failed to fetch portfolio',
            details: error.message
        });
    }
});

// Buy stocks (keep your existing buy function)
router.post('/buy', async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;

        // Validate request data
        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, quantity, price'
            });
        }

        const parsedQuantity = parseInt(quantity);
        const parsedPrice = parseFloat(price);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                error: 'Quantity must be a positive number'
            });
        }

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({
                error: 'Price must be a positive number'
            });
        }

        const totalCost = parsedQuantity * parsedPrice;
        const userId = req.user.id;

        console.log(`🛒 Buy request: ${parsedQuantity} ${symbol} @ ₹${parsedPrice} = ₹${totalCost} for user: ${userId}`);

        // Check if user has sufficient balance
        const user = await User.findById(userId);
        if (!user) {
            console.log('❌ User not found:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`💰 User balance: ₹${user.balance}, Required: ₹${totalCost}`);

        if (user.balance < totalCost) {
            console.log('❌ Insufficient balance');
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Update user balance
        user.balance -= totalCost;
        await user.save();
        console.log('✅ User balance updated:', user.balance);

        // Update portfolio
        let portfolio = await Portfolio.findOne({ user: userId });
        if (!portfolio) {
            console.log('📝 Creating new portfolio');
            portfolio = new Portfolio({ user: userId, stocks: [] });
        }

        const existingStockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);

        if (existingStockIndex > -1) {
            const existingStock = portfolio.stocks[existingStockIndex];
            const newTotalQuantity = existingStock.quantity + parsedQuantity;
            const newTotalInvested = existingStock.totalInvested + totalCost;

            portfolio.stocks[existingStockIndex].quantity = newTotalQuantity;
            portfolio.stocks[existingStockIndex].averagePrice = newTotalInvested / newTotalQuantity;
            portfolio.stocks[existingStockIndex].totalInvested = newTotalInvested;
            console.log(`📈 Updated existing stock: ${symbol}, new quantity: ${newTotalQuantity}`);
        } else {
            portfolio.stocks.push({
                symbol,
                quantity: parsedQuantity,
                averagePrice: parsedPrice,
                totalInvested: totalCost
            });
            console.log(`🆕 Added new stock: ${symbol}, quantity: ${parsedQuantity}`);
        }

        await portfolio.save();
        console.log('✅ Portfolio saved successfully');

        // Record transaction
        await Transaction.create({
            user: userId,
            type: 'BUY',
            symbol,
            quantity: parsedQuantity,
            price: parsedPrice,
            totalAmount: totalCost
        });
        console.log('✅ Transaction recorded');

        res.json({
            message: 'Stock purchased successfully',
            balance: user.balance,
            portfolio: portfolio.stocks
        });
    } catch (error) {
        console.error('❌ Error buying stock:', error);
        res.status(400).json({ error: error.message });
    }
});

// Sell stocks (keep your existing sell function)
router.post('/sell', async (req, res) => {
    try {
        const { symbol, quantity, price } = req.body;

        // Validate request data
        if (!symbol || !quantity || !price) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, quantity, price'
            });
        }

        const parsedQuantity = parseInt(quantity);
        const parsedPrice = parseFloat(price);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                error: 'Quantity must be a positive number'
            });
        }

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({
                error: 'Price must be a positive number'
            });
        }

        const totalRevenue = parsedQuantity * parsedPrice;
        const userId = req.user.id;

        console.log(`💰 Sell request: ${parsedQuantity} ${symbol} @ ₹${parsedPrice} = ₹${totalRevenue} for user: ${userId}`);

        // Check if user owns the stock and has sufficient quantity
        let portfolio = await Portfolio.findOne({ user: userId });
        if (!portfolio) {
            console.log('❌ No portfolio found for user:', userId);
            return res.status(400).json({ error: 'No stocks found' });
        }

        const existingStockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol);
        if (existingStockIndex === -1) {
            console.log('❌ Stock not found in portfolio:', symbol);
            return res.status(400).json({ error: 'Stock not found in portfolio' });
        }

        const existingStock = portfolio.stocks[existingStockIndex];
        if (existingStock.quantity < parsedQuantity) {
            console.log(`❌ Insufficient quantity: Have ${existingStock.quantity}, Trying to sell ${parsedQuantity}`);
            return res.status(400).json({ error: 'Insufficient stock quantity' });
        }

        // Update user balance
        const user = await User.findById(userId);
        user.balance += totalRevenue;
        await user.save();
        console.log('✅ User balance updated:', user.balance);

        // Update portfolio
        existingStock.quantity -= parsedQuantity;
        existingStock.totalInvested = existingStock.averagePrice * existingStock.quantity;

        // Remove stock if quantity becomes zero
        if (existingStock.quantity === 0) {
            portfolio.stocks.splice(existingStockIndex, 1);
            console.log(`🗑️ Removed stock from portfolio: ${symbol}`);
        }

        await portfolio.save();
        console.log('✅ Portfolio updated');

        // Record transaction
        await Transaction.create({
            user: userId,
            type: 'SELL',
            symbol,
            quantity: parsedQuantity,
            price: parsedPrice,
            totalAmount: totalRevenue
        });
        console.log('✅ Sell transaction recorded');

        res.json({
            message: 'Stock sold successfully',
            balance: user.balance,
            portfolio: portfolio.stocks
        });
    } catch (error) {
        console.error('❌ Error selling stock:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;