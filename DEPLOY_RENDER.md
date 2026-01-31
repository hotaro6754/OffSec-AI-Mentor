# Deploying OffSec AI Mentor to Render

Follow these steps to deploy your AI Mentor to [Render](https://render.com).

## Prerequisites
- A [Render](https://render.com) account.
- A GitHub or GitLab repository with your code.
- At least one AI API key (Groq, OpenAI, Gemini, or Deepseek).

## Deployment Steps

### 1. Create a New Web Service
1. Log in to your Render Dashboard.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub/GitLab repository.

### 2. Configure Service Settings
Render should automatically detect the `render.yaml` file (if you use Blueprints) or you can set it up manually:

- **Name:** `offsec-ai-mentor`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server-v2.js`

### 3. Environment Variables
Add the following environment variables in the **Environment** tab:

| Key | Value | Description |
|-----|-------|-------------|
| `PORT` | `3000` | The port the server listens on |
| `GROQ_API_KEY` | `your_key` | (Optional) Primary AI key |
| `OPENAI_API_KEY` | `your_key` | (Optional) |
| `GEMINI_API_KEY` | `your_key` | (Optional) |
| `DEEPSEEK_API_KEY` | `your_key` | (Optional) |
| `DATABASE_PATH` | `/var/data/offsec_mentor.db` | Required if using a Disk |

### 4. Data Persistence (SQLite)
Render's file system is ephemeral on the Free tier. To keep your user data and roadmaps across restarts:

1. **Upgrade to a paid plan** (Starter or higher).
2. Go to the **Disks** tab.
3. Click **Add Disk**.
4. **Name:** `mentor-data`
5. **Mount Path:** `/var/data`
6. **Size:** `1 GB` (minimum)

If you stay on the **Free tier**, you don't need to add a disk, but the database will reset every time the service sleeps or redeploys.

## Post-Deployment
Once deployed, Render will provide you with a URL (e.g., `https://offsec-ai-mentor.onrender.com`). You can now access your application online!

### Using Your Own Keys
Even after deployment, users can still go to the **Settings (⚙️)** in the app to use their own personal API keys, which will be stored in their browser and prioritized over the server's keys.
