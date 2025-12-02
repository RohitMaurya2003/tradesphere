import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const PriceStats = ({ stockData }) => {
    const currentPrice = stockData.currentPrice || stockData.price || 0;
    const change = stockData.change || 0;
    const changePercent = stockData.changePercent || 0;
    const isPositive = change >= 0;
    const openPrice = stockData.open || 0;
    const highPrice = stockData.high || 0;
    const lowPrice = stockData.low || 0;
    const volume = stockData.volume || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
        >
            <div className="space-y-4">
                <div>
                    <div className="text-4xl font-bold text-white">₹{currentPrice.toFixed(2)}</div>
                    <div className={`flex items-center space-x-2 text-lg ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {isPositive ? (
                            <TrendingUp className="w-5 h-5" />
                        ) : (
                            <TrendingDown className="w-5 h-5" />
                        )}
                        <span>
              {isPositive ? '+' : ''}₹{Math.abs(change).toFixed(2)} ({isPositive ? '+' : ''}{changePercent}%)
            </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">Open</div>
                        <div className="text-white font-semibold">₹{openPrice.toFixed(2)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">Volume</div>
                        <div className="text-white font-semibold">
                            {volume ? `${(volume / 1000000).toFixed(1)}M` : 'N/A'}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">High</div>
                        <div className="text-white font-semibold">₹{highPrice.toFixed(2)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">Low</div>
                        <div className="text-white font-semibold">₹{lowPrice.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PriceStats;