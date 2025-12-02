import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trophy, Users, Calendar, TrendingUp, Award, Zap, Target, Clock } from 'lucide-react';

function Competitions() {
    const navigate = useNavigate();
    const [contests, setContests] = useState([]);
    const [activeTab, setActiveTab] = useState('active'); // active, upcoming, completed
    const [loading, setLoading] = useState(true);
    const [myAchievements, setMyAchievements] = useState([]);
    const [myContestIds, setMyContestIds] = useState(new Set());

    useEffect(() => {
        fetchContests();
        fetchMyAchievements();
        fetchMyContests();
    }, []);

    const fetchContests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/competitions/contests');
            setContests(response.data);
        } catch (error) {
            console.error('Error fetching contests:', error);
            toast.error('Failed to load contests');
        } finally {
            setLoading(false);
        }
    };

    const fetchMyAchievements = async () => {
        try {
            const response = await axios.get('/api/competitions/achievements/my');
            setMyAchievements(response.data);
        } catch (error) {
            console.error('Error fetching achievements:', error);
        }
    };

    const fetchMyContests = async () => {
        try {
            const response = await axios.get('/api/competitions/my-contests');
            setMyContestIds(new Set(response.data.contestIds));
        } catch (error) {
            console.error('Error fetching my contests:', error);
        }
    };

    const filteredContests = contests.filter(c => c.status === activeTab);

    const joinContest = async (contestId) => {
        try {
            await axios.post(`/api/competitions/contests/${contestId}/join`);
            toast.success('🎉 Joined contest successfully!');
            navigate(`/contest/${contestId}`);
        } catch (error) {
            const msg = error.response?.data?.error || 'Failed to join contest';
            toast.error(msg);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-500/20 text-green-400 border-green-500/30',
            upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {status.toUpperCase()}
            </span>
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysRemaining = (endDate) => {
        const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days} days left` : 'Ended';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <Trophy className="w-10 h-10 text-yellow-400" />
                                Paper Trading Competitions
                            </h1>
                            <p className="text-gray-400">
                                Compete with traders across India • Win badges • Learn without risk
                            </p>
                        </div>
                    </div>

                    {/* My Achievements Summary */}
                    {myAchievements.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Award className="w-6 h-6 text-yellow-400" />
                                    <span className="text-white font-semibold">
                                        Your Achievements: {myAchievements.length}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {myAchievements.slice(0, 5).map((ua, idx) => (
                                        <span key={idx} className="text-2xl" title={ua.achievement?.name}>
                                            {ua.achievement?.icon}
                                        </span>
                                    ))}
                                    {myAchievements.length > 5 && (
                                        <span className="text-gray-400 text-sm">+{myAchievements.length - 5} more</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-2 bg-white/5 rounded-xl p-1">
                        {['active', 'upcoming', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === tab
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)} Contests
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Contests Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse">
                                <div className="h-6 bg-white/10 rounded mb-4"></div>
                                <div className="h-20 bg-white/10 rounded mb-4"></div>
                                <div className="h-10 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredContests.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No {activeTab} contests
                        </h3>
                        <p className="text-gray-400">Check back soon for new competitions!</p>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {filteredContests.map((contest, index) => (
                                <motion.div
                                    key={contest._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
                                >
                                    {/* Contest Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-8 h-8 text-yellow-400" />
                                            {myContestIds.has(contest._id) && (
                                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-full text-xs font-semibold">
                                                    Joined
                                                </span>
                                            )}
                                        </div>
                                        {getStatusBadge(contest.status)}
                                    </div>

                                    {/* Contest Title */}
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                                        {contest.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {contest.description}
                                    </p>

                                    {/* Contest Info */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Target className="w-4 h-4 text-green-400" />
                                            <span className="text-gray-300">
                                                Start: ₹{(contest.initialBalance / 1000).toFixed(0)}K
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            <span className="text-gray-300">
                                                {contest.participantCount || 0} participants
                                                {contest.maxParticipants && ` / ${contest.maxParticipants}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            <span className="text-gray-300">
                                                {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
                                            </span>
                                        </div>
                                        {contest.status === 'active' && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-orange-400" />
                                                <span className="text-orange-400 font-semibold">
                                                    {getDaysRemaining(contest.endDate)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Prize Pool */}
                                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-5 h-5 text-yellow-400" />
                                            <span className="text-white text-sm font-semibold">
                                                {contest.prizePool}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {myContestIds.has(contest._id) ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/contest/${contest._id}`)}
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                                        >
                                            <TrendingUp className="w-5 h-5" />
                                            View My Performance
                                        </motion.button>
                                    ) : contest.status === 'active' || contest.status === 'upcoming' ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => joinContest(contest._id)}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Join Contest
                                        </motion.button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/contest/${contest._id}`)}
                                            className="w-full bg-white/10 text-white py-3 px-4 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold"
                                        >
                                            View Results
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default Competitions;
