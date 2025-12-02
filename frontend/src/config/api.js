// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    PROFILE: `${API_BASE_URL}/auth/profile`,
  },
  
  // Stocks
  STOCKS: {
    SEARCH: (query) => `${API_BASE_URL}/stocks/search/${encodeURIComponent(query)}`,
    QUOTE: (symbol) => `${API_BASE_URL}/stocks/quote/${symbol}`,
    BATCH: (symbols) => `${API_BASE_URL}/stocks/batch?symbols=${symbols}`,
  },
  
  // Portfolio
  PORTFOLIO: {
    GET: `${API_BASE_URL}/portfolio`,
    BUY: `${API_BASE_URL}/portfolio/buy`,
    SELL: `${API_BASE_URL}/portfolio/sell`,
  },
  
  // Transactions
  TRANSACTIONS: `${API_BASE_URL}/transactions`,
  
  // Analysis
  ANALYSIS: `${API_BASE_URL}/analysis/analyze`,
  
  // Watchlists
  WATCHLISTS: {
    GET_ALL: `${API_BASE_URL}/watchlists`,
    CREATE: `${API_BASE_URL}/watchlists`,
    DELETE: (id) => `${API_BASE_URL}/watchlists/${id}`,
    ADD_SYMBOL: (id) => `${API_BASE_URL}/watchlists/${id}/symbols`,
    EVALUATE: (id) => `${API_BASE_URL}/watchlists/${id}/evaluate`,
  },
  
  // Derivatives
  DERIVATIVES: {
    OPTIONS: (symbol) => `${API_BASE_URL}/derivatives/options?symbol=${symbol}`,
    OPTIONS_PAYOFF: `${API_BASE_URL}/derivatives/options/payoff`,
    OPTIONS_TRADE: (action) => `${API_BASE_URL}/derivatives/options/${action}`,
    FUTURES: (symbol) => `${API_BASE_URL}/derivatives/futures?symbol=${symbol}`,
    FUTURES_PAYOFF: `${API_BASE_URL}/derivatives/futures/payoff`,
    FUTURES_TRADE: (action) => `${API_BASE_URL}/derivatives/futures/${action}`,
  },
  
  // Competitions
  COMPETITIONS: {
    CONTESTS: (id) => `${API_BASE_URL}/competitions/contests/${id}`,
    MY_ENTRY: (id) => `${API_BASE_URL}/competitions/contests/${id}/my-entry`,
    LEADERBOARD: (id) => `${API_BASE_URL}/competitions/contests/${id}/leaderboard`,
    JOIN: (id) => `${API_BASE_URL}/competitions/contests/${id}/join`,
    TRADE: (id) => `${API_BASE_URL}/competitions/contests/${id}/trade`,
  },
};

export default API_ENDPOINTS;
