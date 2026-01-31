# Deploying OffSec AI Mentor to Vercel

Follow these steps to deploy your AI Mentor to [Vercel](https://vercel.com).

## ⚠️ Important Note on Persistence
This application uses **SQLite** for its database. Vercel's serverless environment is **ephemeral**, meaning:
- **Any data saved (users, assessments, roadmaps) will be lost** whenever the serverless function restarts or a new deployment occurs.
- SQLite is NOT recommended for production use on Vercel.
- **For a permanent deployment with data persistence, please use [Render with a Persistent Disk](DEPLOY_RENDER.md).**

If you just want to demo the UI and AI features quickly, Vercel is a great option!

## Deployment Steps

### 1. Create a New Project
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** and select **Project**.
3. Import your GitHub/GitLab repository.

### 2. Configure Settings
Vercel should automatically detect the settings based on the included `vercel.json`:
- **Framework Preset:** Other (detected via `vercel.json`)
- **Root Directory:** `./`

### 3. Environment Variables
Add the following environment variables in the project settings:

| Key | Value | Description |
|-----|-------|-------------|
| `GROQ_API_KEY` | `your_key` | (Optional) Primary AI key |
| `OPENAI_API_KEY` | `your_key` | (Optional) |
| `GEMINI_API_KEY` | `your_key` | (Optional) |
| `DEEPSEEK_API_KEY` | `your_key` | (Optional) |

### 4. Deploy
Click **Deploy**. Once finished, Vercel will provide you with a production URL.

## Using Your Own Keys
Users can always go to the **Settings (⚙️)** in the application to use their own personal API keys. These are stored in the browser's `localStorage` and will work perfectly even on Vercel.
