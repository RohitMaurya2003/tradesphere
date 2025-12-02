import React from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

const ActionButtons = ({ onBuyClick, onSellClick, onAnalyzeClick, isAnalyzing }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-4 py-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onBuyClick}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-lg"
                    >
                        Buy
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onAnalyzeClick}
                        disabled={isAnalyzing}
                        className={`flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl transition-all font-semibold text-lg flex items-center justify-center space-x-2 ${
                            isAnalyzing
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:from-purple-600 hover:to-indigo-700'
                        }`}
                    >
                        <Brain className="w-5 h-5" />
                        <span>{isAnalyzing ? 'Analyzing...' : 'AI Analysis'}</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSellClick}
                        className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-xl hover:from-red-600 hover:to-pink-700 transition-all font-semibold text-lg"
                    >
                        Sell
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ActionButtons;