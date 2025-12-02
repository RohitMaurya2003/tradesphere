# 📈 TradeSphere - Advanced Stock Trading Platform

A full-stack paper trading application for Indian stock markets with AI-powered analysis, options/futures trading, and gamified competitions.

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?logo=tailwindcss&logoColor=white)

## ✨ Features

### 🎯 Core Trading
- **Paper Trading** - Practice with ₹1,00,000 virtual money
- **Real-Time Data** - Live stock quotes from Yahoo Finance & FMP APIs
- **Portfolio Management** - Track holdings, P&L, and performance
- **Transaction History** - Complete trade log with detailed insights

### 📊 Advanced Features
- **Options Trading** - Full options chain with Greeks (Delta, Gamma, Theta, Vega)
- **Futures Contracts** - Trade Nifty/Bank Nifty futures
- **AI Analysis** - Google Gemini-powered stock analysis & recommendations
- **Technical Charts** - Interactive price charts with Recharts
- **Watchlists** - Create multiple watchlists to track favorite stocks

### 🏆 Gamification
- **Trading Competitions** - Weekly, monthly contests with leaderboards
- **Achievements System** - 11+ badges for trading milestones
- **Social Features** - Compare performance with other traders
- **Ranking System** - Live leaderboard with portfolio values

### 🛡️ Security
- **JWT Authentication** - Secure user sessions
- **Password Hashing** - bcrypt encryption
- **Rate Limiting** - API abuse prevention
- **CORS Protection** - Cross-origin request security

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Hot Toast** - Notifications

### Backend
- **Node.js + Express** - Server framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Express Rate Limit** - Request throttling

### APIs
- **Yahoo Finance** - Real-time stock data
- **Financial Modeling Prep (FMP)** - Historical data
- **Google Gemini AI** - Stock analysis

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- API Keys:
  - [FMP API Key](https://site.financialmodelingprep.com/developer/docs)
  - [Google Gemini API Key](https://ai.google.dev/)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_min_32_characters
FMP_API_KEY=your_fmp_api_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
EOF

# Seed competitions and achievements (optional)
node seed-competitions.js

# Start backend server
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (if needed)
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🎮 Usage

### 1. Register/Login
- Create account or login with existing credentials
- Get ₹1,00,000 virtual money to start trading

### 2. Dashboard
- View 20 trending Indian stocks
- Search for any NSE/BSE listed stock
- See your portfolio summary

### 3. Trading
- Click Buy/Sell on any stock card
- Enter quantity and execute trade
- View real-time P&L updates

### 4. Competitions
- Join weekly/monthly trading contests
- Compete with traders across India
- Win exclusive badges

### 5. Options & Futures
- Navigate to Options/Futures section
- View full options chain with Greeks
- Trade derivatives with virtual money

## 📂 Project Structure

```
stock-trading-app/
├── backend/
│   ├── models/           # Mongoose schemas
│   │   ├── User.js
│   │   ├── Portfolio.js
│   │   ├── Transaction.js
│   │   ├── Contest.js
│   │   ├── CompetitionEntry.js
│   │   └── Achievement.js
│   ├── routes/           # API endpoints
│   │   ├── auth.js
│   │   ├── stocks-fmp.js
│   │   ├── portfolio.js
│   │   ├── competitions.js
│   │   ├── derivatives.js
│   │   └── analysis.js
│   ├── middleware/
│   │   └── auth.js       # JWT verification
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── Competitions.jsx
│   │   │   ├── Options.jsx
│   │   │   ├── Futures.jsx
│   │   │   └── TradeModal.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tradesphere
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
FMP_API_KEY=your_financial_modeling_prep_api_key
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Stocks
- `GET /api/stocks/batch?symbols=RELIANCE,TCS` - Get multiple stocks
- `GET /api/stocks/search/:query` - Search stocks
- `GET /api/stocks/quote/:symbol` - Get single stock

### Portfolio
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/buy` - Buy stocks
- `POST /api/portfolio/sell` - Sell stocks

### Competitions
- `GET /api/competitions/contests` - List all contests
- `GET /api/competitions/contests/:id` - Get contest details
- `POST /api/competitions/contests/:id/join` - Join contest
- `POST /api/competitions/contests/:id/trade` - Execute contest trade
- `GET /api/competitions/contests/:id/leaderboard` - Get rankings

### Analysis
- `POST /api/analysis/analyze` - Get AI stock analysis

## 🐛 Known Issues

- Yahoo Finance API may have rate limits - use FMP as fallback
- Options Greeks calculated using simplified Black-Scholes model
- Real-time data has ~15 second delay (free tier limitation)

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Algo trading sandbox
- [ ] Backtesting engine
- [ ] Social trading (copy trades)
- [ ] Advanced charting (TradingView integration)
- [ ] News integration
- [ ] Tax calculator (STCG/LTCG)
- [ ] Portfolio rebalancing suggestions

## 📄 License

MIT License - feel free to use this project for learning purposes

## 👤 Author

**Rohit Maurya**
- GitHub: [@RohitMaurya2003](https://github.com/RohitMaurya2003)

## 🙏 Acknowledgments

- Yahoo Finance for stock data
- Financial Modeling Prep for API
- Google Gemini for AI capabilities
- TailwindCSS for beautiful UI
- MongoDB for cloud database

## ⭐ Show your support

Give a ⭐️ if this project helped you learn or build something awesome!

---

**Happy Trading! 📈**
