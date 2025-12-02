import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import SellModal from './SellModal';
import toast from 'react-hot-toast';

function Portfolio() {
    const [portfolio, setPortfolio] = useState({ stocks: [] });
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [livePrices, setLivePrices] = useState({});

    useEffect(() => {
        fetchPortfolio();
        // Set up live price updates every 10 seconds
        const interval = setInterval(updateLivePrices, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchPortfolio = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/portfolio');
            setPortfolio(response.data);
            await updateLivePrices(response.data.stocks);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
            toast.error('Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const updateLivePrices = async (stocks = portfolio.stocks) => {
        if (!stocks.length) return;

        try {
            const symbols = stocks.map(stock => stock.symbol).join(',');
            const response = await axios.get(`http://localhost:5000/api/stocks/batch?symbols=${symbols}`);

            const newLivePrices = {};
            response.data.forEach(stock => {
                if (stock && stock.symbol) {
                    newLivePrices[stock.symbol] = stock.price;
                }
            });

            setLivePrices(newLivePrices);
        } catch (error) {
            console.error('Error updating live prices:', error);
        }
    };

    const openSellModal = (stock) => {
        const currentPrice = livePrices[stock.symbol] || stock.averagePrice;
        setSelectedStock({
            ...stock,
            currentPrice: currentPrice
        });
        setIsSellModalOpen(true);
    };

    const handleSellSuccess = () => {
        setIsSellModalOpen(false);
        setSelectedStock(null);
        fetchPortfolio();
        toast.success('Stock sold successfully!');
    };

    // In your Portfolio.jsx, simplify the calculateProfitLoss function:
    const calculateProfitLoss = (stock) => {
        // Now the backend provides all this data
        return {
            value: stock.profitLoss || 0,
            percent: stock.profitLossPercentage || 0,
            totalValue: stock.currentValue || stock.totalInvested,
            currentPrice: stock.currentPrice || stock.averagePrice
        };
    };

    const getTotalPortfolioValue = () => {
        return portfolio.stocks.reduce((total, stock) => {
            const pl = calculateProfitLoss(stock);
            return total + pl.totalValue;
        }, 0);
    };

    const getTotalInvested = () => {
        return portfolio.stocks.reduce((total, stock) => total + stock.totalInvested, 0);
    };

    const getTotalProfitLoss = () => {
        return getTotalPortfolioValue() - getTotalInvested();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-white text-lg">Loading portfolio...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">My Portfolio</h1>
                    <p className="text-gray-400">Track your investments and performance</p>
                </motion.div>

                {/* Portfolio Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Portfolio Value */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Value</p>
                                <p className="text-2xl font-bold text-white">${getTotalPortfolioValue().toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Invested */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Invested</p>
                                <p className="text-2xl font-bold text-white">${getTotalInvested().toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-purple-500/20 rounded-lg">
                                <Package className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Total P&L */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total P&L</p>
                                <p className={`text-2xl font-bold ${
                                    getTotalProfitLoss() >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    ${getTotalProfitLoss().toFixed(2)}
                                </p>
                                <p className={`text-sm ${
                                    getTotalProfitLoss() >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {((getTotalProfitLoss() / getTotalInvested()) * 100).toFixed(2)}%
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${
                                getTotalProfitLoss() >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                                {getTotalProfitLoss() >= 0 ? (
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                ) : (
                                    <TrendingDown className="w-6 h-6 text-red-400" />
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Number of Holdings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Holdings</p>
                                <p className="text-2xl font-bold text-white">{portfolio.stocks.length}</p>
                            </div>
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <Package className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Stocks Table */}
                {portfolio.stocks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No stocks in your portfolio
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Start building your portfolio by buying some stocks from the dashboard.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Stock</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Quantity</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Avg Price</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Current Price</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Total Value</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">P&L</th>
                                    <th className="text-left py-4 px-6 text-gray-400 font-semibold">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                <AnimatePresence>
                                    {portfolio.stocks.map((stock, index) => {
                                        const pl = calculateProfitLoss(stock);
                                        const isPositive = pl.value >= 0;

                                        return (
                                            <motion.tr
                                                key={stock.symbol}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                            >
                                                {/* Stock Symbol and Name */}
                                                <td className="py-4 px-6">
                                                    <div>
                                                        <div className="font-semibold text-white">{stock.symbol}</div>
                                                        <div className="text-gray-400 text-sm">
                                                            {stock.companyName || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Quantity */}
                                                <td className="py-4 px-6">
                                                    <div className="text-white font-semibold">
                                                        {stock.quantity}
                                                    </div>
                                                </td>

                                                {/* Average Price */}
                                                <td className="py-4 px-6">
                                                    <div className="text-white">
                                                        ${stock.averagePrice.toFixed(2)}
                                                    </div>
                                                </td>

                                                {/* Current Price */}
                                                <td className="py-4 px-6">
                                                    <div className="text-white font-semibold">
                                                        ${pl.currentPrice.toFixed(2)}
                                                    </div>
                                                    <div className={`text-xs ${
                                                        pl.currentPrice >= stock.averagePrice ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {pl.currentPrice >= stock.averagePrice ? '+' : ''}
                                                        {((pl.currentPrice - stock.averagePrice) / stock.averagePrice * 100).toFixed(2)}%
                                                    </div>
                                                </td>

                                                {/* Total Value */}
                                                <td className="py-4 px-6">
                                                    <div className="text-white font-semibold">
                                                        ${pl.totalValue.toFixed(2)}
                                                    </div>
                                                </td>

                                                {/* Profit/Loss */}
                                                <td className="py-4 px-6">
                                                    <div className={`flex items-center space-x-1 ${
                                                        isPositive ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                        {isPositive ? (
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        ) : (
                                                            <ArrowDownRight className="w-4 h-4" />
                                                        )}
                                                        <div>
                                                            <div className="font-semibold">
                                                                ${pl.value.toFixed(2)}
                                                            </div>
                                                            <div className="text-xs">
                                                                {pl.percent.toFixed(2)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 px-6">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => openSellModal(stock)}
                                                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-semibold text-sm"
                                                    >
                                                        Sell
                                                    </motion.button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Sell Modal */}
            <AnimatePresence>
                {isSellModalOpen && selectedStock && (
                    <SellModal
                        stock={selectedStock}
                        onClose={() => setIsSellModalOpen(false)}
                        onSuccess={handleSellSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default Portfolio;