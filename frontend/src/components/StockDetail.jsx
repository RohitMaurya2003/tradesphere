import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

// Import Tab Components
import OverviewTab from './stock-detail/tabs/OverviewTab';
import FinancialsTab from './stock-detail/tabs/FinancialsTab';
import AboutTab from './stock-detail/tabs/AboutTab';
import HoldingsTab from './stock-detail/tabs/HoldingsTab';

// Import New Components
import StockHeader from './stock-detail/StockHeader';
import PriceStats from './stock-detail/PriceStats';
import PriceChart from './stock-detail/PriceChart';
import AnalysisResults from './stock-detail/AnalysisResults';
import ActionButtons from './stock-detail/ActionButtons';
import TradeModal from './TradeModal';

function StockDetail() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRange, setSelectedRange] = useState('1Y');
    const [activeTab, setActiveTab] = useState('overview');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('BUY');
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Mock historical data for chart
    const historicalData = [
        { date: 'Jan', price: 2400, volume: 4500000 },
        { date: 'Feb', price: 2600, volume: 5200000 },
        { date: 'Mar', price: 2550, volume: 4800000 },
        { date: 'Apr', price: 2700, volume: 5100000 },
        { date: 'May', price: 2650, volume: 4900000 },
        { date: 'Jun', price: 2800, volume: 5500000 },
        { date: 'Jul', price: 2740, volume: 5300000 },
        { date: 'Aug', price: 2900, volume: 5700000 },
        { date: 'Sep', price: 2850, volume: 5600000 },
        { date: 'Oct', price: 3000, volume: 6000000 },
        { date: 'Nov', price: 2950, volume: 5800000 },
        { date: 'Dec', price: 2740, volume: 5400000 },
    ];

    // Mock financial data
    const financialData = [
        { year: '2020', revenue: 4500, profit: 1200, netWorth: 8900 },
        { year: '2021', revenue: 5200, profit: 1500, netWorth: 10400 },
        { year: '2022', revenue: 6100, profit: 1800, netWorth: 12200 },
        { year: '2023', revenue: 7200, profit: 2100, netWorth: 14300 },
    ];

    // Mock shareholding data
    const shareholdingData = [
        { name: 'Promoters', value: 45, color: '#10b981' },
        { name: 'Retail', value: 25, color: '#3b82f6' },
        { name: 'FII', value: 18, color: '#8b5cf6' },
        { name: 'DII', value: 12, color: '#f59e0b' },
    ];

    // Mock performance data
    const performanceData = {
        '1W': { value: 2.5, isPositive: true },
        '1M': { value: 8.2, isPositive: true },
        '3M': { value: 15.7, isPositive: true },
        '6M': { value: 22.3, isPositive: true },
        '1Y': { value: 34.1, isPositive: true },
        'YTD': { value: 28.6, isPositive: true },
    };

    useEffect(() => {
        fetchStockData();
    }, [symbol]);

    const fetchStockData = async () => {
        try {
            setLoading(true);
            console.log('Fetching Indian stock data for:', symbol);
            const response = await axios.get(`/api/stocks/quote/${symbol}`);
            console.log('Indian stock data received:', response.data);
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching Indian stock data:', error);
            // Use mock data if API fails
            setStockData({
                symbol: symbol,
                currentPrice: 2740.34,
                price: 2740.34,
                change: 52.5,
                changePercent: '1.95',
                open: 2695.50,
                high: 2768.80,
                low: 2682.20,
                volume: 2450000,
                companyName: `${symbol} Limited`,
                exchange: 'NSE',
                currency: 'INR'
            });
            toast.error('Using demo data - API connection failed');
        } finally {
            setLoading(false);
        }
    };

    const triggerN8NAnalysis = async () => {
        if (!stockData) {
            toast.error('No stock data available');
            return;
        }

        setIsAnalyzing(true);
        try {
            console.log('Analyzing stock with Gemini AI:', symbol);

            const response = await axios.post('/analysis/analyze', {
                query: symbol,
                stockData: stockData
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 60000
            });

            if (response.data) {
                setAnalysisResult(response.data);
                toast.success('🤖 AI analysis completed!');
                console.log('Gemini Analysis Result:', response.data);
            }

        } catch (error) {
            console.error('Error in stock analysis:', error);

            if (error.code === 'ECONNABORTED') {
                toast.error('Analysis is taking too long. Please try again.');
            } else if (error.response) {
                let msg = error.response.data?.message || error.response.data?.error || error.response.statusText || 'Please try again';
                if (typeof msg !== 'string') {
                    try { msg = JSON.stringify(msg); } catch (e) { msg = String(msg); }
                }
                toast.error(`Analysis failed: ${msg}`);
            } else if (error.request) {
                toast.error('Cannot connect to analysis service. Make sure backend is running.');
            } else {
                toast.error('Analysis failed. Please try again.');
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleWatchlist = () => {
        setIsInWatchlist(!isInWatchlist);
        toast.success(!isInWatchlist ? 'Added to watchlist' : 'Removed from watchlist');
    };

    const openModal = (type) => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleTradeSuccess = () => {
        setIsModalOpen(false);
        toast.success(`Stock ${modalType.toLowerCase()}ed successfully!`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">Loading Indian stock data...</div>
            </div>
        );
    }

    if (!stockData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">Indian stock not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-20">
            {/* Header */}
            <StockHeader
                stockData={stockData}
                isInWatchlist={isInWatchlist}
                onToggleWatchlist={toggleWatchlist}
                onAnalyzeClick={triggerN8NAnalysis}
                isAnalyzing={isAnalyzing}
                onBuyClick={() => openModal('BUY')}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Price and Chart Section */}
                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Price and Stats */}
                    <div className="lg:col-span-1">
                        <PriceStats stockData={stockData} />
                    </div>

                    {/* Chart */}
                    <div className="lg:col-span-2">
                        <PriceChart
                            historicalData={historicalData}
                            selectedRange={selectedRange}
                            onRangeChange={setSelectedRange}
                        />
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 bg-white/5 rounded-xl p-1 mb-6">
                    {['overview', 'financials', 'about', 'holdings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab
                                    ? 'bg-green-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'overview' && (
                            <OverviewTab
                                performanceData={performanceData}
                                onAnalyzeClick={triggerN8NAnalysis}
                                isAnalyzing={isAnalyzing}
                            />
                        )}
                        {activeTab === 'financials' && <FinancialsTab financialData={financialData} />}
                        {activeTab === 'about' && <AboutTab stockData={stockData} />}
                        {activeTab === 'holdings' && <HoldingsTab shareholdingData={shareholdingData} />}
                    </motion.div>
                </AnimatePresence>

                {/* Analysis Results */}
                <AnalysisResults analysisResult={analysisResult} />
            </div>

            {/* Sticky Action Buttons */}
            <ActionButtons
                onBuyClick={() => openModal('BUY')}
                onSellClick={() => openModal('SELL')}
                onAnalyzeClick={triggerN8NAnalysis}
                isAnalyzing={isAnalyzing}
            />

            {/* Trade Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <TradeModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        stock={stockData}
                        type={modalType}
                        onSuccess={handleTradeSuccess}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default StockDetail;