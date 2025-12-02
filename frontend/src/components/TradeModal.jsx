import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

function TradeModal({ isOpen, onClose, stock, type, onSuccess, contestId = null, contestBalance = null }) {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const { user, updateUserBalance } = useAuth();

    if (!isOpen || !stock) return null;

    // Use currentPrice instead of price for consistency
    const currentPrice = stock.currentPrice || stock.price || 0;
    const totalAmount = quantity * currentPrice;
    
    // Use contest balance if in contest mode, otherwise use user balance
    const availableBalance = contestBalance !== null ? contestBalance : (user?.balance || 0);
    const maxBuyQuantity = Math.floor(availableBalance / currentPrice);
    const isPositive = (stock.change || 0) >= 0;
    const isContestMode = contestId !== null;

    const handleTrade = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('token');

            // Validate inputs
            const tradeQuantity = parseInt(quantity);
            const tradePrice = parseFloat(currentPrice);

            if (isNaN(tradeQuantity) || tradeQuantity <= 0) {
                toast.error('Please enter a valid quantity');
                return;
            }

            if (isNaN(tradePrice) || tradePrice <= 0) {
                toast.error('Invalid stock price');
                return;
            }

            console.log('Sending trade data:', {
                symbol: stock.symbol,
                quantity: tradeQuantity,
                price: tradePrice,
                isContestMode,
                contestId
            });

            // Choose API endpoint based on contest mode
            const endpoint = isContestMode
                ? `http://localhost:5000/api/competitions/contests/${contestId}/trade`
                : `http://localhost:5000/api/portfolio/${type.toLowerCase()}`;

            const response = await axios.post(
                endpoint,
                {
                    symbol: stock.symbol,
                    quantity: tradeQuantity,
                    price: tradePrice,
                    type: type.toUpperCase() // Contest API expects uppercase type
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

            // Update user balance (only for regular portfolio trades)
            if (!isContestMode && response.data.balance !== undefined) {
                updateUserBalance(response.data.balance);
            }

            const modeText = isContestMode ? 'in contest' : '';
            toast.success(`Successfully ${type.toLowerCase()}ed ${quantity} shares of ${stock.symbol} ${modeText}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Trade error:', error);
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Trade failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                                <div className={`p-2 rounded-lg ${
                                    type === 'BUY'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {type === 'BUY' ? (
                                        <TrendingUp className="w-5 h-5" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {type} {stock?.symbol}
                                    </h2>
                                    <p className="text-gray-400 text-sm">{stock?.companyName || stock?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Current Price */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Current Price</span>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-white">
                                        ₹{currentPrice.toFixed(2)}
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
                                            {isPositive ? '+' : ''}₹{Math.abs(stock.change || 0).toFixed(2)} ({stock.changePercent || 0}%)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quantity Input */}
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">
                                Quantity to {type}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={type === 'BUY' ? maxBuyQuantity : undefined}
                                value={quantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    setQuantity(Math.max(1, value));
                                }}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            {type === 'BUY' && (
                                <p className="text-gray-400 text-sm mt-2">
                                    Maximum you can buy: {maxBuyQuantity} shares
                                    {isContestMode && <span className="text-blue-400 ml-2">(Contest Mode)</span>}
                                </p>
                            )}
                        </div>

                        {/* Total Amount */}
                        <div className="bg-white/5 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Total Amount</span>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white">
                                        ₹{totalAmount.toFixed(2)}
                                    </div>
                                    {type === 'BUY' && (
                                        <div className="text-gray-400 text-sm">
                                            Available: ₹{availableBalance.toFixed(2)}
                                            {isContestMode && <span className="text-blue-400 ml-1">(Virtual)</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

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
                                onClick={handleTrade}
                                disabled={loading || (type === 'BUY' && totalAmount > availableBalance)}
                                className={`flex-1 py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-50 ${
                                    type === 'BUY'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                        : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    `Confirm ${type}`
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TradeModal;