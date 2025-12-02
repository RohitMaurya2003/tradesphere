import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

function Futures() {
    const [symbol, setSymbol] = useState('RELIANCE');
    const [contracts, setContracts] = useState([]);
    const [selected, setSelected] = useState(null);
    const [payoff, setPayoff] = useState([]);

    const load = async () => {
        try {
            const r = await axios.get(`http://localhost:5000/api/derivatives/futures?symbol=${symbol}`);
            setContracts(r.data || []);
        } catch (e) { toast.error('Failed to load futures'); }
    };

    useEffect(() => { load(); }, []);

    const previewPayoff = async (c, side='BUY') => {
        setSelected({ ...c, side });
        try {
            const r = await axios.post('http://localhost:5000/api/derivatives/futures/payoff', {
                entryPrice: c.price, lotSize: c.lotSize, side
            });
            setPayoff(r.data.points || []);
        } catch (e) { setPayoff([]); }
    };

    const trade = async (action) => {
        if (!selected) return;
        try {
            const r = await axios.post(`http://localhost:5000/api/derivatives/futures/${action}`, {
                symbol, price: selected.price, lotSize: selected.lotSize, quantity: 1, marginPercent: selected.marginPercent
            });
            toast.success(`${action} futures ${symbol} @ ${selected.price} opened`);
        } catch (e) { toast.error(e.response?.data?.error || 'Trade failed'); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-8">
            <div className="max-w-6xl mx-auto px-4">
                <motion.h1 initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="text-3xl font-bold mb-4">Futures</motion.h1>
                <div className="flex gap-2 mb-6">
                    <input value={symbol} onChange={e=>setSymbol(e.target.value)} className="px-3 py-2 rounded bg-white/10 border border-white/20" placeholder="Symbol (e.g., RELIANCE)" />
                    <button onClick={load} className="px-4 py-2 rounded bg-cyan-600">Load</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="font-semibold mb-2">Contracts</div>
                        <div className="space-y-2">
                            {contracts.map((c, i) => (
                                <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
                                    <div>
                                        <div className="font-semibold">{c.symbol} Futures</div>
                                        <div className="text-sm text-gray-300">Price ₹{c.price} • Lot {c.lotSize} • Margin {c.marginPercent}%</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={()=>previewPayoff(c,'BUY')} className="px-3 py-1 rounded bg-green-600">Buy</button>
                                        <button onClick={()=>previewPayoff(c,'SELL')} className="px-3 py-1 rounded bg-red-600">Sell</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="font-semibold mb-2">Payoff Preview</div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={payoff}>
                                    <XAxis dataKey="price" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {selected && (
                            <div className="mt-4 flex gap-2">
                                <button onClick={()=>trade(selected.side)} className="px-4 py-2 rounded bg-cyan-600">Confirm {selected.side}</button>
                                <button onClick={()=>setSelected(null)} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Futures;
