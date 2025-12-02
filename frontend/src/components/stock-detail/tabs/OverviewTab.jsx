import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Brain } from 'lucide-react';

const OverviewTab = ({ performanceData, onAnalyzeClick, isAnalyzing }) => (
    <div className="grid md:grid-cols-2 gap-6">
        {/* Performance */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>Performance</span>
            </h3>
            <div className="space-y-3">
                {Object.entries(performanceData).map(([period, data]) => (
                    <div key={period} className="flex justify-between items-center py-2">
                        <span className="text-gray-400">{period}</span>
                        <span className={`font-semibold ${
                            data.isPositive ? 'text-green-400' : 'text-red-400'
                        }`}>
              {data.isPositive ? '+' : ''}{data.value}%
            </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-400" />
                    <span>Key Metrics</span>
                </h3>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAnalyzeClick}
                    disabled={isAnalyzing}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isAnalyzing
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                    } text-white`}
                >
                    <Brain className="w-4 h-4" />
                    <span>{isAnalyzing ? 'Analyzing...' : 'AI Analysis'}</span>
                </motion.button>
            </div>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="text-white font-semibold">₹15.2L Cr</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">P/E Ratio</span>
                    <span className="text-white font-semibold">24.3</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Dividend Yield</span>
                    <span className="text-white font-semibold">1.8%</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">52W High</span>
                    <span className="text-white font-semibold">₹320.50</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">52W Low</span>
                    <span className="text-white font-semibold">₹210.25</span>
                </div>
            </div>
        </div>
    </div>
);

export default OverviewTab;