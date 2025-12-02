import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, PieChart, History, Bell, Layers3, Sigma, User, LogOut, Menu, X, Trophy } from 'lucide-react';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: TrendingUp },
    { path: '/portfolio', label: 'Portfolio', icon: PieChart },
    { path: '/competitions', label: 'Competitions', icon: Trophy },
    { path: '/transactions', label: 'Transactions', icon: History },
    { path: '/watchlists', label: 'Watchlists', icon: Bell },
    // { path: '/options', label: 'Options', icon: Layers3 },
    // { path: '/options-chain', label: 'Options Chain', icon: Layers3 },
    // { path: '/futures', label: 'Futures', icon: Sigma },
];

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const NavLink = ({ item }) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
            <Link
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
            >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
            </Link>
        );
    };

    return (
        <div>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 w-full z-50 transition-all duration-300 ${
                    scrolled ? 'bg-gray-900/60 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">TradeHub</span>
                        </motion.div>

                        <div className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => (
                                <NavLink key={item.path} item={item} />
                            ))}
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <>
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 text-white">
                                        <div className="text-sm text-gray-300">Balance</div>
                                        <div className="font-semibold">₹{user.balance?.toFixed(2) || '0.00'}</div>
                                    </motion.div>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 hover:bg-white/20 transition-colors">
                                        <User className="w-4 h-4" />
                                        {user.username}
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white px-4 py-2 rounded-lg border border-red-500/30 transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <Link className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors" to="/login">Login</Link>
                                    <Link className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200" to="/register">Sign Up</Link>
                                </>
                            )}
                        </div>

                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-40 md:hidden bg-gray-900/95 backdrop-blur-lg">
                        <div className="flex flex-col h-full pt-20 pb-8 px-6 gap-6">
                            {navItems.map((item) => (
                                <NavLink key={item.path} item={item} />
                            ))}
                            {user && (
                                <div className="mt-auto flex flex-col gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-white">
                                        <div className="text-gray-300 text-sm">Balance</div>
                                        <div className="text-xl font-semibold">₹{user.balance?.toFixed(2) || '0.00'}</div>
                                        <div className="text-gray-400 text-sm mt-1">{user.username}</div>
                                    </div>
                                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white px-4 py-3 rounded-xl border border-red-500/30 transition-colors">
                                        <LogOut className="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="h-16" />
        </div>
    );
}

export default Navbar;
