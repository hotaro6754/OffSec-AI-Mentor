# OffSec AI Mentor

## 🎯 Project Overview

**OffSec AI Mentor** is a production-ready, AI-powered learning guidance tool for offensive security learners. It helps users:

- **Assess** their current cybersecurity skill level with dynamic, AI-generated questions
- **Evaluate** their strengths and weaknesses objectively
- **Choose** a target OffSec certification (OSCP, OSEP, OSWE, OSED, OSCE³, OSEE)
- **Receive** a personalized, phase-based learning roadmap aligned with their chosen cert
- **Discuss** learning goals, mindset, and strategy with a guided, constrained mentor AI
- **Export** their roadmap for offline study

This is an **educational guidance tool only**—not a hacking tutorial, not a vulnerability scanner, not a penetration testing platform. It mentors learners toward ethical offensive security mastery.

---

## ✨ Key Features

### 1. **Dynamic Skill Assessment**
- 8–10 AI-generated questions per attempt
- Mix of multiple-choice and short-answer formats
- Topics: networking, Linux, web fundamentals, security concepts
- No certification mentions (pure foundational assessment)
- **Questions vary every time you retake**

### 2. **Intelligent Skill Evaluation**
- Classifies learner level: **Beginner**, **Foundation**, or **Intermediate**
- Identifies specific **strength areas**
- Identifies specific **weak areas** for targeted growth
- Suggests **learning focus** based on assessment

### 3. **Certification-Aligned Roadmap**
- Users select from **6 OffSec certifications**: OSCP, OSEP, OSWE, OSED, OSCE³, OSEE
- Roadmap is **personalized** by:
  - Current skill level
  - Identified weaknesses
  - Target certification requirements
- **Phase-based structure** (Foundations → Core Skills → Cert Alignment)
- Explains **why** each phase matters
- Ethical tone: no promises, only guidance

### 4. **Guided Mentor Chat**
- Appears **after the roadmap** (not a free-form hacking chatbot)
- Pre-defined intent buttons:
  - 💼 Discuss Career Goals
  - 🎯 Help Choose Certs
  - 🤔 I Feel Stuck
  - ⏱️ Study Time Tips
- Constrained to **safe topics only**: mindset, goals, time management, motivation
- Automatically deflects unsafe requests
- Warm, professional, encouraging tone

### 5. **Roadmap Management**
- 📋 **Copy** roadmap to clipboard
- 📥 **Export** as `.txt` file for offline reference

### 6. **Retake Assessment**
- 🔁 Generate new questions every time
- Fresh evaluation and roadmap
- No limit on attempts

### 7. **Learning Mode Toggle**
- Switch between Beginner and OSCP difficulty levels
- Located in fixed bottom-right corner
- Optional feature for future enhancements

---

## 🛡️ Ethical Design

### **What This Tool DOES:**
✅ Provide educational guidance  
✅ Assess foundational cybersecurity knowledge  
✅ Help learners plan their study path  
✅ Mentor on mindset, goals, and learning strategy  
✅ Celebrate learner growth  

### **What This Tool DOES NOT Do:**
❌ Teach hacking techniques  
❌ Provide exploit code  
❌ Share payloads or commands  
❌ Give step-by-step attack instructions  
❌ Weaponize vulnerabilities  
❌ Promise certification success  
❌ Replace hands-on practice  

---

## 🏗️ Tech Stack

### **Frontend**
- **HTML5** — Semantic structure
- **CSS3** — Neo-brutalism design system
- **Vanilla JavaScript** — No frameworks, pure DOM manipulation

### **Backend**
- **Node.js with Express** — RESTful API server
- **SQLite with better-sqlite3** — User and progress persistence
- **bcryptjs** — Secure password hashing
- **dotenv** — Environment variable management

### **AI/LLM**
- **Multiple AI Providers Supported:**
  - **Groq** (LLaMA 3.3 70B) — Free tier, recommended
  - **OpenAI** (GPT-3.5/4) — Paid
  - **Deepseek** — Paid alternative
  - **Google Gemini** (2.5 Flash) — Free/Paid
- **Automatic Fallback Chain** — Seamless provider switching on rate limits
- **Authentication:** API Key via environment variables (secure)

### **Animations & Polish**
- **AOS.js** — Scroll-reveal animations
- **GSAP** — Micro-interactions and button feedback
- **Lenis** — Smooth, butter-like scrolling
- **Lucide Icons** — Clean, modern SVG icons
- **Google Fonts** — Space Mono (display) + IBM Plex Mono (body)

### **Deployment**
- Works in any modern browser
- No build step required
- Deploy as-is to any static host (GitHub Pages, Netlify, Vercel, etc.)

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js** v18 or higher
- **npm** or **yarn**
- **API Key** from one of the supported providers:
  - [Groq](https://console.groq.com) (Recommended - Free tier)
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Deepseek](https://platform.deepseek.com)
  - [Google Gemini](https://aistudio.google.com/app/apikey)

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hotaro6754/OffSec-AI-Mentor.git
   cd OffSec-AI-Mentor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API key:**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key (choose one):
   ```bash
   # Option 1: Groq (Recommended - Free)
   GROQ_API_KEY=your_groq_api_key_here
   
   # Option 2: OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
   
   # Option 3: Deepseek
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   
   # Option 4: Google Gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **⚠️ IMPORTANT:** 
   - Never commit your `.env` file to git
   - The `.env` file is already in `.gitignore`
   - Multiple API keys enable automatic fallback

4. **Start the server:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### **Getting a Free API Key (Groq - Recommended)**

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into your `.env` file as `GROQ_API_KEY`

**Why Groq?**
- ✅ Generous free tier
- ✅ Fast inference (LLaMA 3.3 70B)
- ✅ No credit card required
- ✅ Great for development and testing

---

## 📝 Application Flow

### **1. Hero Section**
Clean landing page with project name and CTA: "Assess My Skill Level"

### **2. Skill Assessment**
- Dynamic questions generated by Gemini
- Progress bar and question counter
- Navigate with Previous/Next buttons
- Final submission triggers evaluation

### **3. Skill Evaluation**
- Shows current level, strengths, weaknesses
- Encouraging, honest feedback
- CTA: "Choose Your Certification"

### **4. Certification Selection**
- User selects ONE of 6 OffSec certs
- Clear descriptions for each
- Auto-proceeds to roadmap generation

### **5. Personalized Roadmap**
- Phase-based learning plan
- Specific to chosen cert + assessed level
- Why each phase matters
- Copy/export actions available

### **6. Guided Mentor Chat**
- Welcome message + intent buttons
- User selects topic or types custom question
- AI provides warm, ethical guidance
- Session persists during visit

### **7. Actions**
- Retake Assessment (generates new questions)

### **8. Footer**
- Ethical disclaimer
- Project credits
- Safe, transparent messaging

---

## 🛡️ Robust Error Handling & Fallback System

### **Assessment Generation (Always Works)**
The application ensures assessments **never fail** for users:

1. **Primary:** Attempts to generate questions using AI API
2. **Fallback:** If AI fails (network error, rate limit, invalid key):
   - Automatically switches to **predefined fallback questions**
   - User never sees an error
   - Questions are still varied and educational
   - Covers all core topics (Linux, networking, web security, etc.)

**Fallback Questions:**
- 10 questions for beginner mode
- 10 questions for OSCP mode
- Mix of multiple-choice and short-answer
- High-quality, manually curated content

### **Roadmap Generation (AI-Only)**
Roadmaps **must** be generated by AI for personalization:

1. **Primary:** Calls AI API with assessment results
2. **Retry:** Automatically retries once on failure (with 1s delay)
3. **Friendly Error:** If all retries fail, shows user-friendly message:
   - "AI is taking longer than expected. Please try again."
   - No technical error details exposed
   - Clear "Try Again" button

**During Generation:**
- ETA countdown (15-25 seconds)
- Rotating developer jokes for entertainment
- Smooth loading animations

### **Developer Jokes Examples**
```
🔧 75% of bugs are fixed by checking the API key...
🚀 If it works on localhost, it's production ready, right?
🎯 Generating roadmap... responsibly hacking knowledge...
🔑 Blaming the API key in 3...2...1...
🤖 Teaching AI about responsible disclosure...
```

---

## 📱 Mobile Responsive

- **Desktop (1200px+):** Full multi-column layouts
- **Tablet (768px–1199px):** Responsive grid adjustments
- **Mobile (<768px):** Single-column, touch-friendly buttons

All sections tested and optimized for mobile viewing.

---

## ♿ Accessibility

- **Semantic HTML5** structure
- **ARIA labels** on interactive elements
- **Keyboard navigation** support (Tab, Enter)
- **Focus indicators** on all buttons
- **High contrast** color ratios (WCAG AA+)
- **Readable fonts** (monospace, 16px base size)

---

## 🎨 Design Language: Neo-Brutalism

### **Visual Characteristics**
- **Thick black borders** (3–4px)
- **High contrast** color palette
- **Block-based layout** (no curves)
- **border-radius: 0** (sharp edges, brutal)
- **Monospace typography** (Space Mono, IBM Plex Mono)
- **Minimal shadows** and decorative effects
- **Hacker / technical aesthetic**

### **Color System**
```
Primary:   #ff006e (hot pink)    — Actions, highlights
Secondary: #00d4ff (cyan)        — Accents, secondary elements
Accent:    #ffd60a (yellow)      — Warnings, important notes
Success:   #06d6a0 (green)       — Positive feedback
Black:     #000000 (black)       — Text, borders
White:     #ffffff (white)       — Backgrounds, contrast
```

### **Animations**
- Scroll-reveal (AOS): fade-up, slide-in
- Button feedback: translate on hover/click, shadow
- Chat bubbles: slide-in from sides
- Progress bar: smooth width transition
- Roadmap phases: staggered reveal
- **All animations are subtle and purposeful**

---

## 🧪 Testing

1. Open `index.html`
2. Click "Assess My Skill Level"
3. Answer 8–10 questions honestly
4. Review your evaluation
5. Select a target certification
6. Wait for roadmap to generate
7. Chat with the mentor
8. Copy or export your roadmap
9. Retake the assessment (new questions each time!)

### **Expected Behavior:**
- ✅ Questions vary each time you retake
- ✅ Evaluation reflects your answers
- ✅ Roadmap aligns with your cert + level
- ✅ Mentor refuses unsafe topics
- ✅ Animations are smooth but not intrusive
- ✅ Mobile-responsive design

---

## 📄 Files Included

```
OffSec-AI-Mentor/
├── index.html              # Main HTML structure
├── style.css               # Neo-brutalism stylesheet
├── app.js                  # Frontend JavaScript (production)
├── server-v2.js           # Backend API server (production)
├── database.js            # SQLite user/progress management
├── package.json           # Node.js dependencies
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules (includes .env)
├── README.md              # This file
├── SECURITY.md            # Security & ethical guidelines
├── ARCHITECTURE.txt       # Technical architecture
├── database.db            # SQLite database (auto-created)
├── app-new.js             # Deprecated frontend (legacy)
├── app-old.js             # Deprecated frontend (legacy)
├── server.js              # Deprecated server (legacy)
├── app.py                 # Deprecated Streamlit version (legacy)
└── requirements.txt       # Python dependencies (for app.py)
```

**Production Files:**
- `server-v2.js` — Primary backend server (use this)
- `app.js` — Primary frontend application (use this)
- `index.html` — Main HTML page
- `style.css` — Styles
- `database.js` — Database layer

---

## 🔐 Security & Privacy

### **API Key Security**
- ✅ **Never hardcode API keys** in source code
- ✅ **Always use environment variables** (`.env` file)
- ✅ **Keep `.env` in `.gitignore`** (prevents accidental commits)
- ✅ **Rotate keys regularly** for production use
- ✅ **Backend-only exposure** — API keys never sent to frontend

### **Previous Security Issue (Fixed)**
Earlier versions had hardcoded API keys in:
- `server.js` (line 35) ❌ **FIXED**
- `app.py` (line 313) ❌ **FIXED**
- `app-new.js` (line 10) ❌ **FIXED**

**All hardcoded keys have been removed** and replaced with environment variable loading.

### **Data & Privacy**
- ✅ User data stored locally in SQLite database
- ✅ Passwords hashed with bcryptjs
- ✅ Session-based authentication
- ✅ No external data sharing
- ✅ All AI calls go to respective providers (check their privacy policies)

### **For Production Deployment:**
1. Use environment variables on hosting platform (Vercel, Railway, etc.)
2. Enable HTTPS/SSL
3. Set secure CORS policies
4. Implement rate limiting
5. Monitor API usage and costs
6. Never expose `.env` files publicly

---

## 💡 Future Features (v2.0)

- Study resource recommendations (books, labs, courses)
- Progress tracking (optional account)
- Difficulty-based roadmap variants (Beginner vs OSCP mode)
- Milestone celebrations & encouragement
- Integration with learning platforms

---

## 📞 Support & Contribution

### **Reporting Issues**
Found a bug or have feedback? Please open an issue on GitHub or contact the maintainers.

### **Contributing**
We welcome ethical improvements! Please ensure all changes:
- Maintain educational focus
- Don't introduce hacking content
- Improve UX or performance
- Follow the neo-brutalism design language

---

## ⚖️ Legal & Ethical Disclaimer

**OffSec AI Mentor is an educational guidance tool only.**

- Does **not** guarantee certification success
- Does **not** teach hacking or exploitation
- Does **not** provide attack instructions
- Is **not** a replacement for hands-on practice
- **Offensive security skills must only be used in authorized environments with permission**

By using this tool, you agree to apply your learning ethically and legally.

---

## 📄 License

This project is provided as-is for educational purposes within the OffSec community.

---

## 👋 Built With ❤️ for the OffSec Community

**"A calm, experienced OffSec mentor helping a learner find direction — not teaching them how to hack."**

---

### Quick Links
- [OffSec Official](https://www.offensive-security.com)
- [OffSec Community](https://www.offensive-security.com/community)
- [Google Gemini API](https://ai.google.dev)

---

**Version:** 1.0.0 (Production-Ready)  
**Last Updated:** January 2026  
**Status:** ✅ Ready for OffSec MCP Submission
