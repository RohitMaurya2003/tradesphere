import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BookmarkPlus } from 'lucide-react';

function StockCard({ stock, onBuy, onSell, onAddToWatchlist, isLoading }) {
    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
            >
                <div className="shimmer h-6 w-24 rounded mb-2"></div>
                <div className="shimmer h-8 w-20 rounded mb-4"></div>
                <div className="shimmer h-20 rounded mb-4"></div>
                <div className="flex space-x-3">
                    <div className="shimmer h-10 flex-1 rounded-lg"></div>
                    <div className="shimmer h-10 flex-1 rounded-lg"></div>
                </div>
            </motion.div>
        );
    }

    if (!stock) return null;

    // Enhanced data extraction with fallbacks
    const currentPrice = stock.currentPrice || stock.price || stock.lastPrice || 0;

    // Handle change amount - check multiple possible field names
    const change = stock.change || stock.priceChange || stock.changeAmount || 0;

    // Handle change percentage - check multiple possible field names and formats
    let changePercent = stock.changePercent || stock.pChange || stock.percentageChange || 0;

    // Convert to number and handle NaN
    changePercent = parseFloat(changePercent);

    // If changePercent is NaN or 0 but we have change and currentPrice, calculate it
    if ((isNaN(changePercent) || changePercent === 0) && change !== 0 && currentPrice !== 0) {
        const previousPrice = currentPrice - change;
        if (previousPrice > 0) {
            changePercent = (change / previousPrice) * 100;
        } else {
            changePercent = 0;
        }
    }

    // Ensure changePercent is a valid number
    if (isNaN(changePercent)) {
        changePercent = 0;
    }

    // Format the percentage to 2 decimal places
    const formattedChangePercent = changePercent.toFixed(2);

    const isPositive = change >= 0;

    // Generate mock sparkline data
    const generateSparklineData = () => {
        const basePrice = currentPrice - change;
        return Array.from({ length: 10 }, (_, i) => ({
            value: basePrice + (change / 10) * i + (Math.random() - 0.5) * change * 0.1,
        }));
    };

    const sparklineData = generateSparklineData();

    const handleBuyClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onBuy();
    };

    const handleSellClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSell();
    };

    // Debug: Check what data we're actually receiving
    console.log('Stock data:', stock);
    console.log('Calculated values:', { currentPrice, change, changePercent: formattedChangePercent, isPositive });

    const navigate = useNavigate();
    const [showActions, setShowActions] = useState(false); // retain for future hover expansion

    const handleNavigate = () => {
        if (stock?.symbol) {
            navigate(`/stock/${stock.symbol}`);
        }
    };

    const handleAddWatchlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAddToWatchlist) onAddToWatchlist(stock.symbol);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300 group cursor-pointer relative"
            onClick={handleNavigate}
        >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            {stock.symbol}
                        </h3>
                        <p className="text-gray-400 text-sm">{stock.companyName || stock.name || stock.symbol}</p>
                        <p className="text-gray-500 text-xs">{stock.exchange || 'NSE'}</p>
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
                        isPositive
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                        {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                        ) : (
                            <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold text-sm">
                            {isPositive ? '+' : ''}{formattedChangePercent}%
                        </span>
                    </div>
                    {/* Hover Watchlist Button */}
                    <button
                        onClick={handleAddWatchlist}
                        className="opacity-0 group-hover:opacity-100 absolute top-4 right-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 transition-opacity"
                        aria-label="Add to Watchlist"
                        title="Add to Watchlist"
                    >
                        <BookmarkPlus className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Price */}
                <div className="mb-4">
                    <p className="text-2xl font-bold text-white">₹{currentPrice.toFixed(2)}</p>
                    <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}₹{Math.abs(change).toFixed(2)} ({isPositive ? '+' : ''}{formattedChangePercent}%)
                    </p>
                </div>

                {/* Sparkline Chart */}
                <div className="h-16 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? '#10b981' : '#ef4444'}
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Persistent Action Buttons */}
                <div className="flex space-x-3 mt-4" onClick={(e)=>e.preventDefault()}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBuyClick}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold"
                    >
                        Buy
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSellClick}
                        className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 px-4 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-semibold"
                    >
                        Sell
                    </motion.button>
                </div>
            </motion.div>
        
    );
}

export default StockCard;