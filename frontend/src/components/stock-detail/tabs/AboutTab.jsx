import React from 'react';
import { Info, Building } from 'lucide-react';

const AboutTab = ({ stockData }) => (
    <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Info className="w-5 h-5 text-yellow-400" />
                <span>Company Description</span>
            </h3>
            <p className="text-gray-300 leading-relaxed">
                {stockData.companyName} is a leading Indian company with strong market presence and consistent performance.
                The company has demonstrated robust growth and maintains a competitive edge in its sector through
                strategic investments and innovation.
            </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-400" />
                <span>Company Details</span>
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Industry</span>
                    <span className="text-white font-semibold">Diversified</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sector</span>
                    <span className="text-white font-semibold">Various</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Exchange</span>
                    <span className="text-white font-semibold">{stockData.exchange || 'NSE'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Currency</span>
                    <span className="text-white font-semibold">{stockData.currency || 'INR'}</span>
                </div>
            </div>
        </div>
    </div>
);

export default AboutTab;