# 🚀 TradeSphere Deployment Guide

## Table of Contents
1. [Backend Deployment (Render)](#backend-deployment-render)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment](#post-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Backend Deployment (Render)

### ✅ Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account

### ✅ Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `RohitMaurya2003/tradesphere`
3. Configure the service:
   ```
   Name: tradesphere-backend
   Region: Singapore (or closest to you)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install --production
   Start Command: node server.js
   ```

### ✅ Step 3: Add Environment Variables
In Render dashboard, go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://rohitmaurya86930_db_user:0gLpMhRIGXKuPOeW@cluster0.dukqxoa.mongodb.net/stock-trading?retryWrites=true&w=majority
JWT_SECRET=stock_trading_app_rohit_maurya_86930_fmp_fyFWS7qZV8dXJ6GmqRhUo
FMP_API_KEY=fyFWS7qZV8dXJ6GmqRhUo79qNF1MxRPd
ALPHA_VANTAGE_API_KEY=EQHT62SMZANN69W7
GEMINI_API_KEY=AIzaSyDhJbyRHtuz9By63WH_7GKoQrCoiuQK3Gg
```

### ✅ Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Your backend will be at: `https://tradesphere-backend.onrender.com`

### ✅ Step 5: Test Backend
Visit: `https://tradesphere-backend.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "database": "Connected",
  "timestamp": "2025-12-02T..."
}
```

---

## Frontend Deployment (Vercel)

### ✅ Option A: Deploy via Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import `RohitMaurya2003/tradesphere`
5. Configure:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
6. **Environment Variables**:
   ```
   VITE_API_URL=https://tradesphere-backend.onrender.com/api
   ```
7. Click **Deploy**

### ✅ Option B: Deploy via CLI

```powershell
# Install Vercel CLI
cd frontend
npm install -g vercel

# Login to Vercel
vercel login

# Deploy production
vercel --prod

# Follow prompts:
# - Set project name: tradesphere
# - Select default settings
```

### Your frontend will be at: `https://tradesphere.vercel.app`

---

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
FMP_API_KEY=your_fmp_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
GEMINI_API_KEY=your_gemini_key
```

### Frontend (.env.production)
```env
VITE_API_URL=https://tradesphere-backend.onrender.com/api
```

---

## Post-Deployment

### ✅ Update Frontend API URL
After backend is deployed, update frontend environment variable:

1. **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. Update `VITE_API_URL` to your Render backend URL
3. Redeploy frontend

### ✅ Update Backend CORS
The backend is already configured to accept requests from:
- `https://tradesphere.vercel.app`
- `https://tradesphere-frontend.vercel.app`
- `http://localhost:5173` (development)

If your Vercel URL is different, add it to `backend/server.js` in the `allowedOrigins` array.

---

## Troubleshooting

### ❌ Issue: "Cannot find module './routes/ai-trading'"
**Solution**: This file was deleted. Make sure you're deploying the latest commit.

```bash
git pull origin main
git log --oneline -5  # Should show "Fix deployment: remove ai-trading routes"
```

### ❌ Issue: Backend not connecting to MongoDB
**Solution**: Check MongoDB Atlas network access
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (Allow from anywhere)

### ❌ Issue: CORS errors in frontend
**Solution**: 
1. Verify backend CORS settings in `server.js`
2. Add your Vercel URL to `allowedOrigins` array
3. Redeploy backend

### ❌ Issue: API calls failing
**Solution**: Check environment variables
1. Verify `VITE_API_URL` in Vercel matches your Render URL
2. Make sure it ends with `/api` (no trailing slash)

### ❌ Issue: Render build failing with node_modules errors
**Solution**: Your `.gitignore` is configured correctly now. This shouldn't happen.

---

## Alternative Deployment Options

### Option 1: Railway (Backend + Frontend)
- Similar to Render
- Free tier available
- https://railway.app

### Option 2: Netlify (Frontend)
- Alternative to Vercel
- Free tier available
- https://netlify.com

### Option 3: Heroku (Backend)
- $5/month (no free tier anymore)
- https://heroku.com

### Option 4: AWS Amplify (Full Stack)
- Free tier for 12 months
- More complex setup
- https://aws.amazon.com/amplify

---

## Cost Summary

| Service | Usage | Cost |
|---------|-------|------|
| Render (Backend) | 750 hours/month | **FREE** |
| Vercel (Frontend) | Unlimited bandwidth | **FREE** |
| MongoDB Atlas | 512MB storage | **FREE** |
| FMP API | 250 calls/day | **FREE** |
| **TOTAL** | | **₹0/month** |

---

## Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Environment variables added to Render
- [ ] Backend health check working
- [ ] Frontend deployed on Vercel
- [ ] Frontend API URL updated
- [ ] Test login/register
- [ ] Test stock search
- [ ] Test buy/sell trades
- [ ] Test portfolio display
- [ ] MongoDB connection working
- [ ] CORS configured correctly

---

## Production URLs

**Backend API**: `https://tradesphere-backend.onrender.com`  
**Frontend**: `https://tradesphere.vercel.app`  
**GitHub Repo**: `https://github.com/RohitMaurya2003/tradesphere`

---

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → View Logs
3. Check browser console for frontend errors
4. Test API endpoints manually using Postman or curl

---

**🎉 Congratulations! Your TradeSphere app is now live!**
