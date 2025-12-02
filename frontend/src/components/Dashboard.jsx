import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Search, TrendingUp, RefreshCw, Star } from 'lucide-react';
import StockCard from './StockCard';
import TradeModal from './TradeModal';
import toast from 'react-hot-toast';

function Dashboard() {
    const [stocks, setStocks] = useState([]);
    const [portfolioMetrics, setPortfolioMetrics] = useState({
        invested: 0,
        currentValue: 0,
        totalReturnValue: 0,
        totalReturnPercent: 0,
        dayReturnValue: 0,
        dayReturnPercent: 0,
        holdingsCount: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStock, setSelectedStock] = useState(null);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState('BUY');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [filterType, setFilterType] = useState('gainers'); // gainers | losers | volume | all

    // Popular Indian stocks to show on dashboard
    const trendingStocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
        'ICICIBANK', 'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'ITC',
        'LT', 'HCLTECH', 'AXISBANK', 'MARUTI', 'ASIANPAINT',
        'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'NESTLEIND'
    ];

    // Load trending stocks on component mount
    useEffect(() => {
        fetchTrendingStocks();
    }, []);

    // Fetch trending stocks using batch endpoint
    const fetchTrendingStocks = async () => {
        try {
            setLoading(true);
            setError('');

            // Use batch endpoint for better performance
            const symbols = trendingStocks.join(',');
            const response = await axios.get(`/api/stocks/batch?symbols=${symbols}`);

            const validStocks = response.data.filter(Boolean);

            // Remove duplicates and ensure we have valid data
            const uniqueStocks = validStocks.filter((stock, index, self) =>
                index === self.findIndex(s => s.symbol === stock.symbol)
            );

            console.log('Fetched stocks:', uniqueStocks);
            setStocks(uniqueStocks);

            if (uniqueStocks.length === 0) {
                setError('Unable to fetch trending stocks data');
            }
        } catch (error) {
            console.error('Error fetching trending stocks:', error);
            setError('Failed to load stock data');

            // Fallback: try individual requests
            try {
                const stockPromises = trendingStocks.map(symbol =>
                    axios.get(`/stocks/quote/${symbol}`)
                        .then(res => res.data)
                        .catch(() => null)
                );

                const stockData = await Promise.all(stockPromises);
                const validStocks = stockData.filter(Boolean);
                const uniqueStocks = validStocks.filter((stock, index, self) =>
                    index === self.findIndex(s => s.symbol === stock.symbol)
                );

                setStocks(uniqueStocks);

                if (uniqueStocks.length > 0) {
                    setError('');
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch user transactions and compute portfolio metrics
    const fetchPortfolioMetrics = async () => {
        try {
            // Attempt to get transactions; if not logged in, silently ignore
            const txResp = await axios.get('/api/transactions').catch(() => null);
            if (!txResp || !Array.isArray(txResp.data) || txResp.data.length === 0) {
                return; // No transactions – keep defaults
            }

            const transactions = txResp.data;
            const positionMap = {}; // symbol => { quantity, totalCost }
            transactions.forEach(tx => {
                const sym = tx.symbol.toUpperCase();
                if (!positionMap[sym]) positionMap[sym] = { quantity: 0, totalCost: 0 };
                const pos = positionMap[sym];
                if (tx.type === 'BUY') {
                    pos.quantity += tx.quantity;
                    pos.totalCost += tx.quantity * tx.price;
                } else if (tx.type === 'SELL') {
                    // Realistic cost reduction: remove proportional cost based on avg cost
                    if (pos.quantity > 0) {
                        const avgCost = pos.totalCost / pos.quantity;
                        pos.quantity -= tx.quantity;
                        pos.totalCost -= avgCost * tx.quantity;
                        if (pos.quantity <= 0) {
                            pos.quantity = 0;
                            pos.totalCost = 0;
                        }
                    }
                }
            });

            // Remove zeroed positions
            Object.keys(positionMap).forEach(sym => {
                if (positionMap[sym].quantity <= 0) delete positionMap[sym];
            });

            const heldSymbols = Object.keys(positionMap);
            if (heldSymbols.length === 0) return;

            // Ensure we have price data for all held symbols
            const known = {}; stocks.forEach(s => { known[s.symbol] = s; });
            const missing = heldSymbols.filter(sym => !known[sym]);
            let extraQuotes = [];
            if (missing.length > 0) {
                try {
                    const batchResp = await axios.get(`/api/stocks/batch?symbols=${missing.join(',')}`);
                    extraQuotes = batchResp.data.filter(Boolean);
                } catch (e) {
                    // Fallback individual
                    const promises = missing.map(m => axios.get(`/api/stocks/quote/${m}`).then(r => r.data).catch(()=>null));
                    extraQuotes = (await Promise.all(promises)).filter(Boolean);
                }
            }

            const allQuotesMap = { ...known };
            extraQuotes.forEach(q => { allQuotesMap[q.symbol] = q; });

            let invested = 0;
            let currentValue = 0;
            let dayReturnValue = 0;
            heldSymbols.forEach(sym => {
                const pos = positionMap[sym];
                const quote = allQuotesMap[sym];
                if (!quote) return;
                const qty = pos.quantity;
                const avgCost = pos.totalCost / (qty || 1);
                const price = Number(quote.currentPrice || quote.price || 0);
                const changePct = typeof quote.changePercent !== 'undefined' ? parseFloat(String(quote.changePercent).toString().replace('%','')) : 0;
                invested += pos.totalCost;
                currentValue += qty * price;
                dayReturnValue += qty * price * (changePct / 100);
            });

            const totalReturnValue = currentValue - invested;
            const totalReturnPercent = invested > 0 ? (totalReturnValue / invested) * 100 : 0;
            const dayReturnPercent = currentValue > 0 ? (dayReturnValue / currentValue) * 100 : 0;

            setPortfolioMetrics({
                invested,
                currentValue,
                totalReturnValue,
                totalReturnPercent,
                dayReturnValue,
                dayReturnPercent,
                holdingsCount: heldSymbols.length
            });
        } catch (e) {
            // Ignore errors (likely unauthenticated)
        }
    };

    // Recompute portfolio whenever stock quotes refresh
    useEffect(() => {
        if (stocks.length > 0) {
            fetchPortfolioMetrics();
        }
    }, [stocks]);

    // Manual refresh with timestamp to prevent caching
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            toast.success('Refreshing stock prices...');

            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const symbols = trendingStocks.join(',');

            const response = await axios.get(`/api/stocks/batch?symbols=${symbols}&t=${timestamp}`);

            const validStocks = response.data.filter(Boolean);
            const uniqueStocks = validStocks.filter((stock, index, self) =>
                index === self.findIndex(s => s.symbol === stock.symbol)
            );

            setStocks(uniqueStocks);

            // Check if we have actual changes
            const hasChanges = uniqueStocks.some(stock =>
                Math.abs(stock.change) > 0.01 || Math.abs(stock.changePercent) > 0.01
            );

            if (hasChanges) {
                toast.success('Stock prices updated!');
            } else {
                toast('Prices are current', { icon: 'ℹ️' });
            }

        } catch (error) {
            console.error('Refresh error:', error);
            toast.error('Failed to refresh prices');
        } finally {
            setRefreshing(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (query.length > 1) {
            try {
                setShowSearchResults(true);
                const response = await axios.get(
                    `/api/stocks/search/${query}`
                );
                setSearchResults(response.data || []);
            } catch (error) {
                console.error('Error searching stocks:', error);
                setSearchResults([]);
            }
        } else {
            setShowSearchResults(false);
            setSearchResults([]);
        }
    };

    // View stock details when clicked from search results
    const viewStockDetails = async (stockSymbol) => {
        try {
            const response = await axios.get(
                `/api/stocks/quote/${stockSymbol}`
            );

            if (response.data) {
                const stockData = response.data;

                // Add to stocks array to display
                setStocks(prev => {
                    const filtered = prev.filter(s => s.symbol !== stockSymbol);
                    return [stockData, ...filtered];
                });

                setSearchResults([]);
                setSearchQuery('');
                setShowSearchResults(false);
                toast.success(`Showing ${stockSymbol} details`);
            }
        } catch (error) {
            toast.error(`Failed to fetch ${stockSymbol} data`);
        }
    };

    const openTradeModal = (stock, type) => {
        if (!stock) return;
        setSelectedStock(stock);
        setTradeType(type);
        setIsTradeModalOpen(true);
    };

    const ensureDefaultWatchlist = async () => {
        try {
            const listsResp = await axios.get('/api/watchlists');
            const existing = (listsResp.data || []).find(l => l.name === 'My Watchlist');
            if (existing) return existing._id;
            const createResp = await axios.post('/api/watchlists', { name: 'My Watchlist' });
            return createResp.data._id;
        } catch (e) {
            toast.error('Watchlist error');
            return null;
        }
    };

    const addToWatchlist = async (symbol) => {
        const wlId = await ensureDefaultWatchlist();
        if (!wlId) return;
        try {
            const resp = await axios.post(`/api/watchlists/${wlId}/symbols`, { symbol });
            toast.success(`${symbol} added to watchlist`);
        } catch (e) {
            toast.error('Failed to add to watchlist');
        }
    };

    // Helper: normalize numeric fields that may arrive as strings (e.g. "0.61%")
    const getNumeric = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return isFinite(val) ? val : 0;
        if (typeof val === 'string') {
            const cleaned = val.replace('%', '').trim();
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        }
        return 0;
    };

    // Filtered view for movers table
    const filteredStocks = stocks.slice().filter(s => {
        const changePct = getNumeric(s.changePercent);
        switch (filterType) {
            case 'gainers':
                return changePct > 0;
            case 'losers':
                return changePct < 0;
            case 'volume':
                return (s.volume || 0) > 0; // placeholder – could sort later
            default:
                return true;
        }
    }).sort((a,b) => Math.abs(getNumeric(b.changePercent)) - Math.abs(getNumeric(a.changePercent))).slice(0,10);

    const productsTools = [
        { label: 'IPO', badge: '13 open' },
        { label: 'Bonds', badge: '1 open' },
        { label: 'ETF Screener' },
        { label: 'Intraday Screener' },
        { label: 'Stocks SIP' },
        { label: 'MTF stocks' },
        { label: 'Events calendar' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    {/* Indices / Ticker strip */}
                    {stocks.length > 0 && (
                        <div className="mb-4 overflow-x-auto">
                            <div className="flex gap-3 whitespace-nowrap">
                                {stocks.slice(0, 8).map((s) => (
                                    <div key={`tick-${s.symbol}`} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm flex items-center gap-2">
                                        <span className="text-white font-semibold">{s.symbol}</span>
                                        <span className="text-gray-300">₹{Number(s.currentPrice || 0).toFixed(2)}</span>
                                        <span className={`${getNumeric(s.changePercent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{getNumeric(s.changePercent).toFixed(2)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Indian Stock Market
                            </h1>
                            <p className="text-gray-400">
                                Real-time trending Indian stocks and prices
                            </p>
                        </div>

                        <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search Indian stocks (e.g., RELIANCE, TCS, INFY)..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                            {showSearchResults && searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute z-10 w-full mt-2 bg-gray-800 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto"
                                >
                                    {searchResults
                                        .filter((stock, index, self) =>
                                            index === self.findIndex(s => s.symbol === stock.symbol)
                                        )
                                        .slice(0, 10)
                                        .map((stock) => {
                                            // Clean up company name - remove "Limited", "Ltd", extra spaces
                                            const cleanName = (stock.name || stock.longname || stock.shortname || '')
                                                .replace(/\s+Limited$/i, '')
                                                .replace(/\s+Ltd\.?$/i, '')
                                                .replace(/\s+Corporation$/i, '')
                                                .replace(/\s+Corp\.?$/i, '')
                                                .replace(/\s+Inc\.?$/i, '')
                                                .replace(/\s{2,}/g, ' ')
                                                .trim();
                                            
                                            return (
                                                <div
                                                    key={`search-${stock.symbol}-${stock.exchange}`}
                                                    className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors group"
                                                    onClick={() => viewStockDetails(stock.symbol)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-white">{stock.symbol}</div>
                                                        <div className="text-sm text-gray-400 truncate">{cleanName}</div>
                                                        <div className="text-xs text-gray-500">{stock.exchange || 'NSE'}</div>
                                                    </div>
                                                    <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                                                </div>
                                            );
                                        })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trending Info */}
                    {stocks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 flex items-center space-x-2 text-sm text-gray-400"
                        >
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>Showing {stocks.length} trending stocks</span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Tabs / Sections */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
                    {/* Most traded / movers left side (span 8) */}
                    <div className="xl:col-span-8 space-y-6">
                        {/* Most traded (reuse first 4) */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-semibold">Most traded stocks</h2>
                                <button className="text-xs text-blue-400 hover:underline">See more</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stocks.slice(0,4).map(s => (
                                    <div key={`traded-${s.symbol}`} className="rounded-xl border border-white/10 bg-black/20 p-3 flex flex-col gap-2">
                                        <div className="text-sm text-white font-semibold">{s.symbol}</div>
                                        <div className="text-xs text-gray-400 line-clamp-2">{s.companyName || s.name}</div>
                                        <div className="text-gray-300 text-sm">₹{Number(s.currentPrice||0).toFixed(2)}</div>
                                        <div className={`text-xs font-semibold ${getNumeric(s.changePercent)>=0?'text-emerald-400':'text-red-400'}`}>{getNumeric(s.changePercent).toFixed(2)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top market movers table */}
                        {/* <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <h2 className="text-white font-semibold mr-auto">Top market movers</h2>
                                {['gainers','losers','volume','all'].map(f => (
                                    <button
                                        key={f}
                                        onClick={()=>setFilterType(f)}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterType===f ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/30 text-gray-300 border-white/10 hover:bg-black/50'}`}
                                    >{f.charAt(0).toUpperCase()+f.slice(1)}</button>
                                ))}
                                <div className="relative">
                                    <select className="bg-black/30 text-xs text-gray-300 px-3 py-1.5 rounded-full border border-white/10 focus:outline-none">
                                        <option>NIFTY 100</option>
                                        <option>NIFTY 50</option>
                                        <option>Bank NIFTY</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 border-b border-white/10">
                                            <th className="py-2 text-left font-medium">Company</th>
                                            <th className="py-2 text-left font-medium">Price</th>
                                            <th className="py-2 text-left font-medium">Change %</th>
                                            <th className="py-2 text-left font-medium">Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map(s => (
                                            <tr key={`row-${s.symbol}`} className="border-b border-white/5 last:border-b-0 hover:bg-white/5">
                                                <td className="py-2 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${getNumeric(s.changePercent)>=0?'bg-emerald-400':'bg-red-400'}`}></div>
                                                        <span className="text-white font-medium">{s.symbol}</span>
                                                        <span className="text-xs text-gray-400 truncate max-w-[160px]">{s.companyName || s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 text-gray-300">₹{Number(s.currentPrice||0).toFixed(2)}</td>
                                                <td className={`py-2 font-semibold ${getNumeric(s.changePercent)>=0?'text-emerald-400':'text-red-400'}`}>{getNumeric(s.changePercent).toFixed(2)}%</td>
                                                <td className="py-2 text-gray-400">{(s.volume || Math.floor(Math.random()*1000000)).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {filteredStocks.length===0 && (
                                            <tr><td colSpan="4" className="py-6 text-center text-gray-500">No data</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div> */}
                    </div>

                    {/* Right side panels (span 4) */}
                    <div className="xl:col-span-4 space-y-6">
                        {/* Investments summary */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <h2 className="text-white font-semibold mb-2">Your investments</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Current</span><span className="text-white font-semibold">₹ {portfolioMetrics.currentValue.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">1D returns</span><span className={`${portfolioMetrics.dayReturnValue>=0?'text-emerald-400':'text-red-400'} font-semibold`}>₹ {portfolioMetrics.dayReturnValue.toFixed(2)} ({portfolioMetrics.dayReturnPercent.toFixed(2)}%)</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Total returns</span><span className={`${portfolioMetrics.totalReturnValue>=0?'text-emerald-400':'text-red-400'} font-semibold`}>{portfolioMetrics.totalReturnValue>=0?'+':''}₹ {portfolioMetrics.totalReturnValue.toFixed(2)} ({portfolioMetrics.totalReturnPercent.toFixed(2)}%)</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Invested</span><span className="text-gray-300">₹ {portfolioMetrics.invested.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Holdings</span><span className="text-gray-300">{portfolioMetrics.holdingsCount}</span></div>
                            </div>
                            <div className="mt-4 h-24 rounded-lg bg-black/20 border border-white/10 flex items-center justify-center text-gray-400 text-xs">Portfolio chart coming soon</div>
                        </div>

                        {/* Products & Tools */}
                        {/* <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <h2 className="text-white font-semibold mb-3">Products & Tools</h2>
                            <div className="space-y-3">
                                {productsTools.map(p => (
                                    <div key={`prod-${p.label}`} className="flex items-center justify-between text-sm py-2 border-b border-white/10 last:border-b-0">
                                        <span className="text-gray-300">{p.label}</span>
                                        {p.badge && <span className="text-xs px-2 py-1 rounded-md bg-emerald-600/30 text-emerald-300 border border-emerald-600/40">{p.badge}</span>}
                                    </div>
                                ))}
                            </div>
                        </div> */}
                    </div>
                </div>

                {/* Stock Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, index) => (
                            <StockCard key={index} isLoading={true} />
                        ))}
                    </div>
                ) : (
                    <>
                        {stocks.length > 0 ? (
                            <motion.div
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                <AnimatePresence>
                                    {stocks
                                        .filter((stock, index, self) =>
                                            index === self.findIndex(s => s.symbol === stock.symbol)
                                        )
                                        .map((stock, index) => (
                                            <motion.div
                                                key={`${stock.symbol}-${stock.currentPrice}-${index}-${Date.now()}`}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <StockCard
                                                    stock={stock}
                                                    onBuy={() => openTradeModal(stock, 'BUY')}
                                                    onSell={() => openTradeModal(stock, 'SELL')}
                                                    onAddToWatchlist={addToWatchlist}
                                                />
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16"
                            >
                                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No stocks available
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Check your connection and try refreshing
                                </p>
                                <button
                                    onClick={handleRefresh}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            {/* Trade Modal */}
            {selectedStock && (
                <TradeModal
                    isOpen={isTradeModalOpen}
                    onClose={() => setIsTradeModalOpen(false)}
                    stock={selectedStock}
                    type={tradeType}
                    onSuccess={() => {
                        setIsTradeModalOpen(false);
                        fetchTrendingStocks();
                    }}
                />
            )}
            <footer>
                hii
            </footer>
        </div>
    );
}

export default Dashboard;