import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trophy, TrendingUp, TrendingDown, Award, Users, Share2, ArrowLeft, Zap, Target, Search, RefreshCw } from 'lucide-react';
import TradeModal from './TradeModal';
import StockCard from './StockCard';

function ContestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [myEntry, setMyEntry] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasJoined, setHasJoined] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState('BUY');
    
    // Stock trading terminal states
    const [stocks, setStocks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [loadingStocks, setLoadingStocks] = useState(false);
    const [showTradingTerminal, setShowTradingTerminal] = useState(false);

    // Popular Indian stocks
    const trendingStocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
        'ICICIBANK', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'ITC',
        'LT', 'HCLTECH', 'AXISBANK', 'MARUTI', 'ASIANPAINT',
        'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'NESTLEIND'
    ];

    useEffect(() => {
        fetchContestDetails();
        fetchMyEntry();
        fetchLeaderboard();
    }, [id]);

    useEffect(() => {
        if (showTradingTerminal && stocks.length === 0) {
            fetchTrendingStocks();
        }
    }, [showTradingTerminal]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery.trim()) {
                searchStocks();
            } else {
                setSearchResults([]);
                setShowSearchResults(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const fetchTrendingStocks = async () => {
        try {
            setLoadingStocks(true);
            const token = localStorage.getItem('token');
            const symbolsString = trendingStocks.join(',');
            const response = await axios.get(`/stocks/batch?symbols=${symbolsString}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStocks(response.data);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            toast.error('Failed to load stocks');
        } finally {
            setLoadingStocks(false);
        }
    };

    const searchStocks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/stocks/search/${encodeURIComponent(searchQuery)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(response.data);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const selectSearchResult = async (stockSymbol) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/stocks/quote/${stockSymbol}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data) {
                setStocks(prev => {
                    const filtered = prev.filter(s => s.symbol !== stockSymbol);
                    return [response.data, ...filtered];
                });
                setSearchResults([]);
                setSearchQuery('');
                setShowSearchResults(false);
            }
        } catch (error) {
            toast.error(`Failed to fetch ${stockSymbol} data`);
        }
    };

    const openTradeModal = (stock, type) => {
        if (!stock) return;
        setSelectedStock(stock);
        setTradeType(type);
        setTradeModalOpen(true);
    };

    const handleTradeSuccess = () => {
        setTradeModalOpen(false);
        fetchMyEntry();
        fetchLeaderboard();
        if (showTradingTerminal) {
            fetchTrendingStocks();
        }
    };

    const fetchContestDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/competitions/contests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setContest(response.data);
        } catch (error) {
            console.error('Error fetching contest:', error);
            toast.error('Failed to load contest details');
        }
    };

    const fetchMyEntry = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/competitions/contests/${id}/my-entry`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyEntry(response.data);
            setHasJoined(true);
        } catch (error) {
            // Not joined yet
            setHasJoined(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/competitions/contests/${id}/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaderboard(response.data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    const joinContest = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/competitions/contests/${id}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('🎉 Joined contest! Start trading now.');
            fetchMyEntry();
            fetchLeaderboard();
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to join contest';
            toast.error(msg);
        }
    };

    const shareResults = () => {
        const text = `I'm competing in "${contest?.name}" on our trading platform! ${
            myEntry ? `Current rank: #${myEntry.rank || '?'} with ${myEntry.totalReturnsPercent?.toFixed(2)}% returns!` : 'Join me!'
        }`;
        
        if (navigator.share) {
            navigator.share({
                title: contest?.name,
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text + '\n' + window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-lg">Loading contest...</div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
                <div className="text-white text-lg">Contest not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/competitions')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Competitions
                </button>

                {/* Contest Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="w-8 h-8 text-yellow-400" />
                                <h1 className="text-3xl font-bold text-white">{contest.name}</h1>
                            </div>
                            <p className="text-gray-400 mb-4">{contest.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-gray-300">{contest.participantCount} participants</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-300">₹{(contest.initialBalance / 1000).toFixed(0)}K starting capital</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={shareResults}
                                className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
                            >
                                <Share2 className="w-5 h-5" />
                                Share
                            </motion.button>
                            {!hasJoined && contest.status !== 'completed' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={joinContest}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold"
                                >
                                    <Zap className="w-5 h-5" />
                                    Join Contest
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Trading Terminal Toggle */}
                {hasJoined && contest.status === 'active' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowTradingTerminal(!showTradingTerminal)}
                            className="w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-green-600 hover:via-blue-600 hover:to-purple-700 transition-all font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                        >
                            <Target className="w-6 h-6" />
                            {showTradingTerminal ? 'Hide Trading Terminal' : 'Open Trading Terminal'}
                            <span className="text-sm font-normal">(₹{myEntry?.virtualBalance?.toFixed(0)} available)</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* Full Trading Terminal */}
                <AnimatePresence>
                    {showTradingTerminal && hasJoined && contest.status === 'active' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 rounded-2xl p-6">
                                {/* Search Bar */}
                                <div className="mb-6 relative">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search stocks (e.g., RELIANCE, TCS, INFY)..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    
                                    {/* Search Results Dropdown */}
                                    {showSearchResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                                            {searchResults.map((result, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => selectSearchResult(result.symbol)}
                                                    className="w-full px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-b-0"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-white font-semibold">{result.symbol}</div>
                                                            <div className="text-gray-400 text-sm">{result.name}</div>
                                                        </div>
                                                        <div className="text-blue-400 text-sm">{result.exchange}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Refresh Button */}
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                        Available Stocks
                                    </h3>
                                    <motion.button
                                        whileHover={{ scale: 1.05, rotate: 180 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={fetchTrendingStocks}
                                        disabled={loadingStocks}
                                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-5 h-5 text-blue-400 ${loadingStocks ? 'animate-spin' : ''}`} />
                                    </motion.button>
                                </div>

                                {/* Stock Cards Grid */}
                                {loadingStocks ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="text-gray-400 mt-4">Loading stocks...</p>
                                    </div>
                                ) : stocks.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">No stocks loaded. Click refresh to load stocks.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {stocks.map((stock, idx) => (
                                            <StockCard
                                                key={stock.symbol || idx}
                                                stock={stock}
                                                onBuy={() => openTradeModal(stock, 'BUY')}
                                                onSell={() => openTradeModal(stock, 'SELL')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: My Performance */}
                    {hasJoined && myEntry && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Award className="w-6 h-6 text-yellow-400" />
                                    My Performance
                                </h2>
                                
                                {/* Rank */}
                                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">{getRankBadge(myEntry.rank)}</div>
                                        <div className="text-gray-300 text-sm">Current Rank</div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Virtual Balance</span>
                                        <span className="text-white font-semibold">₹{myEntry.virtualBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Total P&L</span>
                                        <span className={`font-semibold ${
                                            myEntry.totalReturns >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {myEntry.totalReturns >= 0 ? '+' : ''}₹{myEntry.totalReturns?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Returns</span>
                                        <span className={`font-semibold flex items-center gap-1 ${
                                            myEntry.totalReturnsPercent >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {myEntry.totalReturnsPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {myEntry.totalReturnsPercent?.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Total Trades</span>
                                        <span className="text-white font-semibold">{myEntry.totalTrades}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Win Rate</span>
                                        <span className="text-white font-semibold">{myEntry.winRate?.toFixed(1)}%</span>
                                    </div>
                                </div>

                                {/* Portfolio Holdings */}
                                {myEntry.portfolio && myEntry.portfolio.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h3 className="text-sm font-semibold text-white mb-3">Current Holdings</h3>
                                        <div className="space-y-2">
                                            {myEntry.portfolio.map((position, idx) => (
                                                <div key={idx} className="bg-white/5 rounded-lg p-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-white font-semibold">{position.symbol}</span>
                                                        <span className={`text-sm font-semibold ${
                                                            position.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                            {position.profitLoss >= 0 ? '+' : ''}₹{position.profitLoss?.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                                        <span>{position.quantity} shares @ ₹{position.averagePrice?.toFixed(2)}</span>
                                                        <span className={position.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                            {position.profitLossPercent >= 0 ? '+' : ''}{position.profitLossPercent?.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Current: ₹{position.currentPrice?.toFixed(2)} | Value: ₹{position.currentValue?.toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Achievements */}
                                {myEntry.achievementsEarned && myEntry.achievementsEarned.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <h3 className="text-sm font-semibold text-white mb-3">Achievements Earned</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {myEntry.achievementsEarned.map((ach, idx) => (
                                                <span key={idx} className="text-2xl" title={ach.name}>
                                                    {ach.icon}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Right: Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={hasJoined ? 'lg:col-span-2' : 'lg:col-span-3'}
                    >
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-6 h-6 text-yellow-400" />
                                Leaderboard - Top 10
                            </h2>

                            {leaderboard.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    No participants yet. Be the first to join!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {leaderboard.map((entry, index) => (
                                        <motion.div
                                            key={entry._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                                                entry.user?._id === myEntry?.user
                                                    ? 'bg-blue-500/20 border border-blue-500/30'
                                                    : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl w-8 text-center">
                                                    {getRankBadge(index + 1)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold">
                                                        {entry.user?.username || 'Anonymous'}
                                                        {entry.user?._id === myEntry?.user && (
                                                            <span className="ml-2 text-xs text-blue-400">(You)</span>
                                                        )}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {entry.totalTrades} trades • {entry.winRate?.toFixed(1)}% win rate
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-lg font-bold flex items-center gap-1 ${
                                                    entry.totalReturnsPercent >= 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                    {entry.totalReturnsPercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                                    {entry.totalReturnsPercent?.toFixed(2)}%
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    ₹{((entry.totalValue || entry.virtualBalance || 0) / 1000).toFixed(1)}K
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Trade Modal */}
            {selectedStock && (
                <TradeModal
                    isOpen={tradeModalOpen}
                    onClose={() => {
                        setTradeModalOpen(false);
                        setSelectedStock(null);
                    }}
                    stock={selectedStock}
                    type={tradeType}
                    contestId={id}
                    contestBalance={myEntry?.virtualBalance}
                    onSuccess={handleTradeSuccess}
                />
            )}
        </div>
    );
}

export default ContestDetail;
