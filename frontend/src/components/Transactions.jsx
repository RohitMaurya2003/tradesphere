import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('/transactions');
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                >
                    <Loader2 className="text-cyan-400 w-10 h-10" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0f1a] to-[#010409] text-white px-6 py-10">
            <motion.h1
                className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Transaction History
            </motion.h1>

            {transactions.length === 0 ? (
                <motion.div
                    className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-10 text-center shadow-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-semibold text-cyan-300 mb-2">
                        No transactions yet 🚀
                    </h2>
                    <p className="text-gray-400">
                        Your buy and sell history will appear here soon.
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    className="overflow-hidden rounded-2xl backdrop-blur-lg bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(0,255,255,0.1)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <table className="min-w-full">
                        <thead>
                        <tr className="bg-white/10 text-cyan-300 uppercase text-xs tracking-wider">
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Symbol</th>
                            <th className="px-6 py-3 text-left">Quantity</th>
                            <th className="px-6 py-3 text-left">Price</th>
                            <th className="px-6 py-3 text-left">Total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {transactions.map((t, index) => (
                            <motion.tr
                                key={t._id}
                                className="hover:bg-white/10 transition-all duration-200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                    <div>{new Date(t.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(t.timestamp).toLocaleTimeString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${
                                                t.type === 'BUY'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-400/30'
                                            }`}
                                        >
                                            {t.type === 'BUY' ? (
                                                <ArrowUpCircle className="w-4 h-4" />
                                            ) : (
                                                <ArrowDownCircle className="w-4 h-4" />
                                            )}
                                            {t.type}
                                        </span>
                                </td>
                                <td className="px-6 py-4 text-gray-200 font-medium">{t.symbol}</td>
                                <td className="px-6 py-4 text-gray-300">{t.quantity}</td>
                                <td className="px-6 py-4 text-gray-300">
                                    ${t.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-cyan-300 font-semibold">
                                    ₹{t.totalAmount.toFixed(2)}
                                </td>
                            </motion.tr>
                        ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
        </div>
    );
}

export default Transactions;
