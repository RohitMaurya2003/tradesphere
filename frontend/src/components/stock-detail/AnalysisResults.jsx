import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Target, Activity } from 'lucide-react';

const AnalysisResults = ({ analysisResult }) => {
    if (!analysisResult) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6"
        >
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span>🤖 Gemini AI Analysis Results</span>
                {analysisResult.symbol && (
                    <span className="text-sm text-gray-400 ml-2">({analysisResult.symbol})</span>
                )}
            </h3>

            {/* Display formatted analysis results */}
            <div className="space-y-4">
                {/* Recommendation Badge */}
                {analysisResult.recommendation && (
                    <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-400">Recommendation:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            analysisResult.recommendation.toLowerCase().includes('buy') 
                                ? 'bg-green-500/20 text-green-400' 
                                : analysisResult.recommendation.toLowerCase().includes('sell')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {analysisResult.recommendation}
                        </span>
                    </div>
                )}

                {/* Risk Level */}
                {analysisResult.riskLevel && (
                    <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-gray-400">Risk Level:</span>
                        <span className="text-orange-400 font-semibold">{analysisResult.riskLevel}</span>
                    </div>
                )}

                {/* Target Price */}
                {analysisResult.targetPrice && (
                    <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-400">Target Price:</span>
                        <span className="text-blue-400 font-semibold">{analysisResult.targetPrice}</span>
                    </div>
                )}

                {/* Overall Analysis */}
                {analysisResult.analysis && (
                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-400 mb-2 flex items-center space-x-2">
                            <Brain className="w-4 h-4" />
                            <span>Overall Analysis</span>
                        </h4>
                        <p className="text-gray-300 leading-relaxed">{analysisResult.analysis}</p>
                    </div>
                )}

                {/* Buy Reasons */}
                {analysisResult.buyReasons && analysisResult.buyReasons.length > 0 && (
                    <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/20">
                        <h4 className="font-semibold text-green-400 mb-3 flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Reasons to Buy ✅</span>
                        </h4>
                        <ul className="text-gray-300 space-y-2">
                            {analysisResult.buyReasons.map((reason, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                    <span className="text-green-400 mt-1">•</span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Sell/Risk Reasons */}
                {analysisResult.sellReasons && analysisResult.sellReasons.length > 0 && (
                    <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/20">
                        <h4 className="font-semibold text-red-400 mb-3 flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Risks & Concerns ⚠️</span>
                        </h4>
                        <ul className="text-gray-300 space-y-2">
                            {analysisResult.sellReasons.map((reason, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Timestamp */}
                {analysisResult.timestamp && (
                    <div className="text-xs text-gray-500 text-right">
                        Generated: {new Date(analysisResult.timestamp).toLocaleString()}
                    </div>
                )}

                {/* Fallback: show raw data if structure is different */}
                {!analysisResult.analysis && !analysisResult.buyReasons && !analysisResult.sellReasons && (
                    <div className="bg-white/5 rounded-lg p-4">
                        <pre className="text-gray-300 whitespace-pre-wrap text-sm overflow-x-auto">
                            {JSON.stringify(analysisResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AnalysisResults;