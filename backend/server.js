const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// Configure CORS for production and development
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://tradesphere.vercel.app',
    'https://tradesphere-frontend.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());


// Import routes
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.log('❌ Auth routes failed to load:', error.message);
}

try {
    const stocksRoutes = require('./routes/stocks');
    app.use('/api/stocks', stocksRoutes);
    console.log('✅ Stocks routes loaded');
} catch (error) {
    console.log('❌ Stocks routes failed to load:', error.message);
}

try {
    const portfolioRoutes = require('./routes/portfolio');
    app.use('/api/portfolio', portfolioRoutes);
    console.log('✅ Portfolio routes loaded');
} catch (error) {
    console.log('❌ Portfolio routes loaded failed to load:', error.message);
}

try {
    const transactionsRoutes = require('./routes/transactions');
    app.use('/api/transactions', transactionsRoutes);
    console.log('✅ Transactions routes loaded');
} catch (error) {
    console.log('❌ Transactions routes failed to load:', error.message);
}

try {
    const analysisRoutes = require('./routes/analysis');
    app.use('/api/analysis', analysisRoutes);
    console.log('✅ Analysis routes loaded');
} catch (error) {
    console.log('❌ Analysis routes failed to load:', error.message);
}

// Watchlist routes
try {
    const watchlistRoutes = require('./routes/watchlist');
    app.use('/api/watchlists', watchlistRoutes);
    console.log('✅ Watchlist routes loaded');
} catch (error) {
    console.log('❌ Watchlist routes failed to load:', error.message);
}

// Derivatives routes
try {
    const derivativesRoutes = require('./routes/derivatives');
    app.use('/api/derivatives', derivativesRoutes);
    console.log('✅ Derivatives routes loaded');
} catch (error) {
    console.log('❌ Derivatives routes failed to load:', error.message);
}

// Competition routes
try {
    const competitionsRoutes = require('./routes/competitions');
    app.use('/api/competitions', competitionsRoutes);
    console.log('✅ Competitions routes loaded');
} catch (error) {
    console.log('❌ Competitions routes failed to load:', error.message);
}

// Database connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
    });

// Basic health check
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'OK',
        message: 'Server is running',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Test route to check if API is working
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🚨 Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
});