import React from 'react';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialsTab = ({ financialData }) => (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span>Financial Performance</span>
        </h3>

        <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹ Cr)" />
                    <Bar dataKey="profit" fill="#10b981" name="Profit (₹ Cr)" />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Revenue Growth</div>
                <div className="text-green-400 font-semibold text-xl">+18.5%</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Profit Margin</div>
                <div className="text-green-400 font-semibold text-xl">29.2%</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
                <div className="text-gray-400 text-sm">ROE</div>
                <div className="text-green-400 font-semibold text-xl">15.8%</div>
            </div>
        </div>
    </div>
);

export default FinancialsTab;