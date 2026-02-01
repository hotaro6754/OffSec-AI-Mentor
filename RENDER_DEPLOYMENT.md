# Render Deployment Instructions

## Prerequisites
- Render.com account (free tier available)
- GitHub repository with your code pushed

## Step-by-Step Deployment

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Deploy on Render.com
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (OffSec-AI-Mentor)
4. Configure:
   - **Name**: offsec-ai-mentor
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or upgrade for better performance)

### 5. Environment Variables (Optional)
The app uses:
- `NODE_ENV=production` (set automatically)
- `PORT=3000` (set automatically)

### 6. Deployment
- Click "Create Web Service"
- Render will auto-deploy when you push to GitHub
- Your app will be live at: `https://offsec-ai-mentor.onrender.com`

## What's Included

✅ **render.yaml** - Infrastructure as Code configuration
✅ **Procfile** - Process file for Render
✅ **.renderignore** - Files to exclude from deployment
✅ **package.json** - Dependencies and Node version specified
✅ **server-v2.js** - Main app (uses PORT env variable)

## Notes

- SQLite database (offsec_mentor.db) will be created on first run
- **Data persistence**: Render ephemeral filesystem means data is lost on redeploy. Consider adding PostgreSQL for production.
- Free tier has limitations: auto-sleeps after 15 mins of inactivity
- For paid tier: persistent storage and better performance

## Monitoring

After deployment:
- Check logs: https://dashboard.render.com → Your Service → Logs
- View live app: https://offsec-ai-mentor.onrender.com

## Production Ready Features

✅ Express.js with CORS enabled
✅ Better-sqlite3 for fast database operations
✅ Bcryptjs for password hashing
✅ Proper error handling
✅ Static file serving
✅ Node.js 18+ support

## Next Steps

1. Push this code to GitHub
2. Create Render account and connect GitHub
3. Deploy via Render dashboard
4. Test the deployment
5. Custom domain configuration (if needed)
