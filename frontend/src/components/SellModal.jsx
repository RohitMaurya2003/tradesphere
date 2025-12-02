import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { X, TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function SellModal({ stock, onClose, onSuccess }) {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(stock.currentPrice);
    const { user, updateUserBalance } = useAuth();

    useEffect(() => {
        // Fetch latest price when modal opens
        fetchCurrentPrice();
    }, [stock.symbol]);

    const fetchCurrentPrice = async () => {
        try {
            const response = await axios.get(`/stocks/quote/${stock.symbol}`);
            if (response.data && response.data.price) {
                setCurrentPrice(response.data.price);
            }
        } catch (error) {
            console.error('Error fetching current price:', error);
            // Keep the existing price if fetch fails
        }
    };

    const totalSaleValue = quantity * currentPrice;
    const profitLoss = totalSaleValue - (quantity * stock.averagePrice);
    const profitLossPercent = ((profitLoss / (quantity * stock.averagePrice)) * 100);
    const isPositive = profitLoss >= 0;

    const handleSell = async () => {
        if (quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        if (quantity > stock.quantity) {
            toast.error(`You only own ${stock.quantity} shares`);
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                '/portfolio/sell',
                {
                    symbol: stock.symbol,
                    quantity: parseInt(quantity),
                    price: currentPrice
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Update user balance
            updateUserBalance(response.data.balance);

            toast.success(`Successfully sold ${quantity} shares of ${stock.symbol}`);
            onSuccess();
        } catch (error) {
            console.error('Sell error:', error);
            const errorMessage = error.response?.data?.error || 'Sell failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (value) => {
        const newQuantity = Math.max(0, Math.min(stock.quantity, parseInt(value) || 0));
        setQuantity(newQuantity);
    };

    const setMaxQuantity = () => {
        setQuantity(stock.quantity);
    };

    const setHalfQuantity = () => {
        setQuantity(Math.floor(stock.quantity / 2));
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <TrendingDown className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Sell {stock.symbol}
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    {stock.companyName || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stock Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-gray-400 text-sm">Owned</div>
                            <div className="text-white font-semibold">{stock.quantity} shares</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-gray-400 text-sm">Avg Price</div>
                            <div className="text-white font-semibold">${stock.averagePrice.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Current Price */}
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Current Price</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">
                                    ${currentPrice.toFixed(2)}
                                </div>
                                <div className={`text-sm flex items-center space-x-1 ${
                                    isPositive ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {isPositive ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    <span>
                    {isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-2">
                            Quantity to Sell
                        </label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="number"
                                min="1"
                                max={stock.quantity}
                                value={quantity}
                                onChange={(e) => handleQuantityChange(e.target.value)}
                                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Quick Quantity Buttons */}
                        <div className="flex space-x-2">
                            <button
                                onClick={setHalfQuantity}
                                className="flex-1 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-red-500/30 transition-colors text-sm"
                            >
                                50%
                            </button>
                            <button
                                onClick={setMaxQuantity}
                                className="flex-1 py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-red-500/30 transition-colors text-sm"
                            >
                                100%
                            </button>
                        </div>
                    </div>

                    {/* Sale Details */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Sale Value</span>
                            <span className="text-white font-semibold">${totalSaleValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">P&L</span>
                            <span className={`font-semibold ${
                                isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                {isPositive ? '+' : ''}${profitLoss.toFixed(2)} ({profitLossPercent.toFixed(2)}%)
              </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Remaining Shares</span>
                            <span className="text-white font-semibold">
                {stock.quantity - quantity}
              </span>
                        </div>
                    </div>

                    {/* Warning for large sales */}
                    {quantity === stock.quantity && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400 text-sm">
                  You're selling all your shares of {stock.symbol}
                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSell}
                            disabled={loading || quantity <= 0 || quantity > stock.quantity}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-semibold disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                `Sell ${quantity} Shares`
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SellModal;