import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PriceChart = ({ historicalData, selectedRange, onRangeChange }) => {
    const timeRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'MAX'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6"
        >
            {/* Time Range Selector */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Price Chart (₹)</h3>
                <div className="flex space-x-2">
                    {timeRanges.map((range) => (
                        <button
                            key={range}
                            onClick={() => onRangeChange(range)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                selectedRange === range
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:text-white'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default PriceChart;