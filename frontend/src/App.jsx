import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Transactions from './components/Transactions';
import StockDetail from './components/StockDetail'; // Make sure this import exists
import Watchlist from './components/Watchlist';
import Options from './components/Options';
import Futures from './components/Futures';
import OptionsChain from './components/OptionsChain';
import Competitions from './components/Competitions';
import ContestDetail from './components/ContestDetail';
import './index.css';

// Root route decides between landing and dashboard automatically
function RootRoute() {
    const { user } = useAuth();
    return user ? (
        <>
            <Navbar />
            <Dashboard />
        </>
    ) : (
        <LandingPage />
    );
}

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/" />;
}

function PublicRoute({ children }) {
    const { user } = useAuth();
    return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-background text-foreground">
                    <Routes>
                        {/* Root Smart Route */}
                        <Route path="/" element={<RootRoute />} />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Dashboard />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/portfolio"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Portfolio />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/transactions"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Transactions />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/watchlists"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Watchlist />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/options"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Options />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/options-chain"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <OptionsChain />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/futures"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Futures />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        {/* Stock Detail Route - Make sure this exists */}
                        <Route
                            path="/stock/:symbol"
                            element={
                                <ProtectedRoute>
                                    <StockDetail />
                                </ProtectedRoute>
                            }
                        />
                        {/* Competitions Routes */}
                        <Route
                            path="/competitions"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <Competitions />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/contest/:id"
                            element={
                                <ProtectedRoute>
                                    <>
                                        <Navbar />
                                        <ContestDetail />
                                    </>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>

                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1f2937',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            },
                            success: {
                                style: {
                                    background: '#059669',
                                },
                            },
                            error: {
                                style: {
                                    background: '#dc2626',
                                },
                            },
                        }}
                    />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;