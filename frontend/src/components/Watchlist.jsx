import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bell, BellOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function Watchlist() {
    const [lists, setLists] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const resp = await axios.get('http://localhost:5000/api/watchlists');
            setLists(resp.data || []);
        } catch (e) {
            toast.error('Failed to load watchlists');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const create = async () => {
        if (!name.trim()) return;
        try {
            const resp = await axios.post('http://localhost:5000/api/watchlists', { name });
            setLists([resp.data, ...lists]);
            setName('');
            toast.success('Watchlist created');
        } catch (e) {
            toast.error('Create failed');
        }
    };

    const remove = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/watchlists/${id}`);
            setLists(lists.filter(l => l._id !== id));
            toast.success('Deleted');
        } catch (e) { toast.error('Delete failed'); }
    };

    const addSymbol = async (id, symbol) => {
        if (!symbol.trim()) return;
        try {
            const resp = await axios.post(`http://localhost:5000/api/watchlists/${id}/symbols`, { symbol });
            setLists(lists.map(l => l._id === id ? resp.data : l));
            toast.success('Symbol added');
        } catch (e) { toast.error('Add symbol failed'); }
    };

    const evaluate = async (id) => {
        try {
            const resp = await axios.post(`http://localhost:5000/api/watchlists/${id}/evaluate`);
            const triggered = resp.data.results.filter(r => r.triggered);
            if (triggered.length) {
                toast.success(`Alerts triggered: ${triggered.map(t => `${t.symbol}`).join(', ')}`);
            } else {
                toast('No alerts triggered', { icon: '🔔' });
            }
        } catch (e) { toast.error('Evaluation failed'); }
    };

    if (loading) {
        return <div className="text-white p-6">Loading watchlists...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8 text-white">
            <div className="max-w-4xl mx-auto px-4">
                <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-6">Watchlists</motion.h1>

                <div className="flex gap-2 mb-6">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="New watchlist name" className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20" />
                    <button onClick={create} className="px-4 py-2 bg-green-600 rounded flex items-center gap-2"><Plus className="w-4 h-4"/>Create</button>
                </div>

                <AnimatePresence>
                    {lists.map((l, idx) => (
                        <motion.div key={l._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-lg font-semibold">{l.name}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => evaluate(l._id)} className="px-3 py-1 bg-blue-600 rounded flex items-center gap-1"><Bell className="w-4 h-4"/>Evaluate</button>
                                    <button onClick={() => remove(l._id)} className="px-3 py-1 bg-red-600 rounded flex items-center gap-1"><Trash2 className="w-4 h-4"/>Delete</button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {(l.symbols || []).map(s => (
                                    <span key={s} className="px-2 py-1 rounded bg-white/10 border border-white/20 text-sm">{s}</span>
                                ))}
                                {(!l.symbols || l.symbols.length === 0) && (
                                    <span className="text-gray-400 text-sm">No symbols yet</span>
                                )}
                            </div>

                            <SymbolAdder onAdd={(sym) => addSymbol(l._id, sym)} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function SymbolAdder({ onAdd }) {
    const [symbol, setSymbol] = useState('');
    return (
        <div className="flex gap-2">
            <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Add symbol (e.g., RELIANCE)" className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20" />
            <button onClick={() => { onAdd(symbol); setSymbol(''); }} className="px-4 py-2 bg-cyan-600 rounded flex items-center gap-2"><CheckCircle className="w-4 h-4"/>Add</button>
        </div>
    );
}

export default Watchlist;
