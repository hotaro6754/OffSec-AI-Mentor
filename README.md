
<div align="center">

![OffSec AI Mentor](https://img.shields.io/badge/OffSec-AI%20Mentor-ff006e?style=for-the-badge&logo=security&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-00d4ff?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production%20ready-06d6a0?style=for-the-badge)

**AI-Powered Certification Readiness System for Offensive Security Learners**

[🌐 Live Demo](https://offsec-ai-mentor.onrender.com/) • [📁 Repository](https://github.com/hotaro6754/OffSec-AI-Mentor) • [🐛 Issues](https://github.com/hotaro6754/OffSec-AI-Mentor/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technical Stack](#technical-stack)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Security Considerations](#security-considerations)
- [Deployment Guide](#deployment-guide)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**OffSec AI Mentor** is a production-ready, AI-powered educational guidance platform for aspiring offensive security professionals. It provides structured skill assessment, personalized certification roadmaps, and ethical mentorship—focusing on readiness evaluation and strategic guidance without teaching exploitation techniques.

### Mission Statement

> "To provide aspiring cybersecurity professionals with structured, honest, and ethical guidance that transforms certification ambition into actionable preparation plans."

---

## 🔍 The Problem

The offensive security certification landscape presents critical challenges:

### 1. The Readiness Gap
Many learners purchase expensive certification exams (OSCP: $1,599-$2,599) without adequate preparation, resulting in:
- Financial loss from failed attempts
- Demoralization and career doubt
- Wasted time on misaligned study materials
- Inability to identify specific knowledge deficiencies

### 2. Information Overload
- Thousands of disconnected tutorials
- Conflicting advice on "the right path"
- No standardized readiness metrics
- Difficulty correlating skills to certification requirements

### 3. Lack of Structured Guidance
Common questions:
- "Am I ready for OSCP or should I start with something else?"
- "What should I study first?"
- "Which certification matches my career goals?"

---

## 💡 The Solution

OffSec AI Mentor addresses these through a **three-phase guidance system**:

### Phase 1: Objective Assessment
- AI-generated questions evaluate foundational knowledge
- No certification bias in initial evaluation
- Identifies specific strengths and weaknesses

### Phase 2: Strategic Planning
- Matches learner level to appropriate certification
- Generates phase-based preparation roadmaps
- Explains rationale behind each recommendation

### Phase 3: Ongoing Mentorship
- Constrained AI chat for career and study guidance
- Ethical guardrails prevent misuse
- Unlimited reassessment for progress tracking

---

## ✨ Key Features

### 1. Dynamic Foundational Assessment

| Feature | Description |
|---------|-------------|
| **AI-Generated Questions** | 8-10 unique questions per session using Groq LLaMA 3.3 70B |
| **Question Variation** | New questions every retake to prevent memorization |
| **Topic Coverage** | Networking, Linux, web security, enumeration logic |
| **Format Mix** | 60% multiple-choice, 40% short-answer |
| **No Certification Bias** | Pure foundation evaluation first |

**Technical Implementation:**
```javascript
async function generateAssessment(userLevel, mode = 'standard') {
    const prompt = buildAssessmentPrompt({
        level: userLevel,
        targetQuestionCount: mode === 'oscp' ? 15 : 10,
        formatMix: { mcq: 0.6, shortAnswer: 0.4 }
    });
    
    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: ASSESSMENT_SYSTEM_PROMPT }],
        temperature: 0.7,
        max_tokens: 2000
    });
    
    return parseAssessmentQuestions(response.choices[0].message.content);
}
```

2. Intelligent Evaluation Engine

Classification System:

Level	Characteristics	Recommendation	
Beginner	Basic CLI familiarity, limited networking knowledge	Start with PEN-103 or eJPT	
Foundation	Comfortable Linux administration, understands protocols	Ready for structured certification prep	
Intermediate	Active Directory knowledge, lab experience	Direct certification preparation	

Analysis Dimensions:
- Strength Domains: Areas of demonstrated competence
- Weak Domains: Knowledge gaps requiring attention
- Confidence Gaps: Overestimated knowledge areas
- Conceptual Blinds: Fundamental misunderstandings

3. Certification-Aligned Roadmaps

Supported Certifications:

Certification	Level	Focus Area	Estimated Prep	
OSCP	Intermediate	Penetration Testing	16-24 weeks	
OSEP	Advanced	Evasion & Persistence	20-30 weeks	
OSWE	Advanced	Web Exploitation	16-24 weeks	
OSED	Expert	Windows Exploitation	30-40 weeks	
OSCE³	Expert	Expert-level Pentesting	40-52 weeks	
OSEE	Expert	Advanced Exploitation	50-60 weeks	

Roadmap Structure:

```
Phase 1: Foundations (Weeks 1-4)
├── Linux proficiency deep-dive
├── Networking protocol mastery
├── Scripting fundamentals (Python, Bash)
└── Lab environment setup

Phase 2: Core Skills (Weeks 5-12)
├── Enumeration methodology
├── Vulnerability assessment
├── Exploitation concepts (theoretical)
└── Documentation and reporting

Phase 3: Certification Alignment (Weeks 13-24)
├── Exam-specific preparation
├── Time management training
├── Mock exam scenarios
└── Mindset and endurance building
```

4. OSCP Mode (Advanced Readiness)

Purpose: Exam-simulation assessment for candidates nearing certification.

Differences from Standard Mode:

Aspect	Standard Mode	OSCP Mode	
Difficulty	Foundational	Advanced	
Question Count	10	15	
Format	Mixed	Scenario-heavy	
Focus	Knowledge	Application	
Output	Learning path	Exam readiness score	

Readiness Report Example:

```
OSCP Readiness: 72%
├── Critical Areas (Must Fix):
│   ├── Active Directory Enumeration (45%)
│   └── Privilege Escalation Linux (52%)
├── Development Areas:
│   ├── Web Exploitation (68%)
│   └── Buffer Overflow Basics (71%)
└── Strong Areas:
    ├── Information Gathering (89%)
    └── Reporting (85%)
```

5. Guided Mentor Chat

Design Philosophy:
- Post-roadmap access only
- Intent-based interaction
- Automatic deflection of exploitation requests
- Professional, warm, encouraging tone

Available Intents:

Intent	Icon	Purpose	
Career Goals	💼	Certification selection for career paths	
Certification Selection	🎯	Matching goals to specific credentials	
Feeling Stuck	🤔	Motivation and strategy when blocked	
Study Strategy	⏱️	Time management and learning optimization	

Safety Mechanisms:

```javascript
function processChatRequest(userMessage, userContext) {
    const intent = classifyIntent(userMessage);
    
    if (intent === 'EXPLOIT_REQUEST' || intent === 'PAYLOAD_REQUEST') {
        return {
            type: 'ETHICAL_REMINDER',
            message: 'I can only provide guidance on authorized lab environments.',
            redirect: 'STUDY_STRATEGY'
        };
    }
    
    return generateMentorResponse(intent, userContext);
}
```

6. Export & Persistence

Feature	Description	
Clipboard Copy	One-click formatted roadmap copy	
.txt Export	Structured text file for offline study	
Unlimited Retakes	Track progress over time with new questions each attempt	
Progress Comparison	Visualize improvement between assessments	

---

🏗️ System Architecture

High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │   Future: CLI       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          └────────────────┴────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│                    (Express.js Server)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Routes    │  │  Middleware │  │   Rate Limiting     │ │
│  │   Handler   │  │   (Auth,    │  │                     │ │
│  │             │  │   CORS)     │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          └────────────────┴────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Assessment  │  │  Evaluation │  │   Roadmap           │ │
│  │   Engine    │  │    Engine   │  │   Generator         │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Chat     │  │   Export    │  │   User Management   │ │
│  │   Engine    │  │   Service   │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          └────────────────┴────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA & AI LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   SQLite    │  │    Groq     │  │   Fallback Cache    │ │
│  │  Database   │  │    API      │  │   (Questions)       │ │
│  │             │  │ (LLaMA 3.3) │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Component Flows

Assessment Flow:

```
User → Frontend → POST /api/assessment/generate → 
AssessmentEngine → Groq API → Parse Questions → 
Store in Session → Return to User
```

Evaluation Flow:

```
User Submit → POST /api/assessment/submit →
EvaluationEngine → Analyze Answers → Classify Level →
Identify Gaps → Generate Feedback → Store Results →
Return Evaluation + Recommendations
```

Roadmap Flow:

```
Select Cert → POST /api/roadmap/generate →
RoadmapGenerator → Load Cert Requirements →
Compare to Evaluation → Build Phases →
AI Enhancement (Groq) → Return Structured Roadmap
```

---

🛠️ Technical Stack

Frontend

Technology	Purpose	Version	
HTML5	Semantic structure	Living Standard	
CSS3	Neo-brutalist styling	Custom design system	
Vanilla JavaScript	Application logic	ES2022+	
AOS.js	Scroll animations	2.3.4	
GSAP	Micro-interactions	3.12.2	
Lenis	Smooth scrolling	1.0.42	
Lucide Icons	SVG iconography	0.263.1	

Design System: Neo-Brutalism

```css
:root {
    --primary: #ff006e;      /* Hot Pink - Actions */
    --secondary: #00d4ff;    /* Cyan - Accents */
    --accent: #ffd60a;       /* Yellow - Warnings */
    --success: #06d6a0;      /* Green - Success */
    --black: #000000;        /* Text, Borders */
    --white: #ffffff;        /* Backgrounds */
    --gray: #f4f4f4;         /* Secondary backgrounds */
}
```

Typography:
- Display: Space Mono (700)
- Body: IBM Plex Mono (400, 500)
- Code: JetBrains Mono

Backend

Technology	Purpose	Version	
Node.js	Runtime environment	18.x LTS	
Express.js	Web framework	4.18.2	
SQLite	Database	3.41.0	
better-sqlite3	SQLite driver	8.7.0	
bcryptjs	Password hashing	2.4.3	
dotenv	Environment management	16.3.1	
cors	Cross-origin handling	2.8.5	
helmet	Security headers	7.1.0	

AI Integration

Provider	Model	Use Case	Fallback Priority	
Groq	LLaMA 3.3 70B	Primary AI operations	1 (Primary)	
OpenAI	GPT-3.5/4	Alternative	2	
Deepseek	Deepseek-Chat	Alternative	3	
Google	Gemini 2.5 Flash	Alternative	4	

Groq Configuration:

```javascript
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const defaultParams = {
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.9
};
```

---

📦 Installation & Setup

Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- Git
- Groq API Key ([Get Free Key](https://console.groq.com))

Step-by-Step Installation

1. Clone Repository

```bash
git clone https://github.com/hotaro6754/OffSec-AI-Mentor.git
cd OffSec-AI-Mentor
```

2. Install Dependencies

```bash
npm install
```

3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Groq API Key (Primary - Recommended)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your_random_session_secret_here

# Database
DATABASE_PATH=./database.db
```

4. Start Development Server

```bash
# Standard start
npm start

# Development mode with auto-reload
npm run dev

# Production mode
npm run prod
```

5. Verify Installation

Open browser and navigate to: `http://localhost:3000`

---

⚙️ Configuration

Environment Variables Reference

Variable	Required	Default	Description	
`GROQ_API_KEY`	Yes	-	Groq API authentication	
`PORT`	No	3000	Server port	
`NODE_ENV`	No	development	Environment mode	
`SESSION_SECRET`	Yes	-	Session encryption key	
`DATABASE_PATH`	No	./database.db	SQLite file location	
`LOG_LEVEL`	No	info	Logging verbosity	
`CORS_ORIGIN`	No	*	Allowed CORS origins	

Advanced Configuration

Custom Assessment Parameters (`config/assessment.js`):

```javascript
module.exports = {
    questionCount: {
        standard: 10,
        oscpMode: 15
    },
    difficultyWeights: {
        beginner: [0.7, 0.2, 0.1], // Easy, Medium, Hard
        foundation: [0.3, 0.5, 0.2],
        intermediate: [0.1, 0.3, 0.6]
    },
    passingThresholds: {
        beginner: 0.6,
        foundation: 0.7,
        intermediate: 0.8
    }
};
```

---

📡 API Documentation

Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

Authentication
Session-based authentication with `Cookie: sessionId=<token>`.

Endpoints

Assessment Endpoints

Generate Assessment

```http
POST /api/assessment/generate
Content-Type: application/json

{
    "mode": "standard"
}
```

Response:

```json
{
    "success": true,
    "data": {
        "assessmentId": "uuid",
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "What does TCP stand for?",
                "options": ["...", "..."],
                "category": "networking"
            }
        ],
        "timeLimit": 1800
    }
}
```

Submit Assessment

```http
POST /api/assessment/submit
Content-Type: application/json

{
    "assessmentId": "uuid",
    "answers": [
        {"questionId": "q1", "answer": "Transmission Control Protocol"}
    ]
}
```

Response:

```json
{
    "success": true,
    "data": {
        "evaluation": {
            "level": "foundation",
            "score": 72,
            "strengths": ["networking", "linux"],
            "weaknesses": ["web_security"]
        }
    }
}
```

Roadmap Endpoints

Generate Roadmap

```http
POST /api/roadmap/generate
Content-Type: application/json

{
    "evaluationId": "uuid",
    "targetCert": "OSCP"
}
```

Chat Endpoints

Send Message

```http
POST /api/chat/message
Content-Type: application/json

{
    "roadmapId": "uuid",
    "message": "I feel overwhelmed",
    "intent": "feeling_stuck"
}
```

Error Handling

```json
{
    "success": false,
    "error": {
        "code": "ASSESSMENT_EXPIRED",
        "message": "This assessment session has expired",
        "details": "Please start a new assessment"
    }
}
```

Error Codes:

Code	HTTP Status	Description	
`INVALID_API_KEY`	401	Authentication failed	
`ASSESSMENT_EXPIRED`	400	Session timeout	
`RATE_LIMITED`	429	Too many requests	
`AI_UNAVAILABLE`	503	AI provider down	

---

🗄️ Database Schema

Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │  assessments    │       │   roadmaps      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ username        │  │    │ user_id (FK)    │──┘    │ user_id (FK)    │
│ email           │  │    │ mode            │       │ assessment_id   │
│ password_hash   │  │    │ questions_json  │       │ certification   │
│ created_at      │  │    │ answers_json    │       │ phases_json     │
└─────────────────┘  │    │ score           │       └─────────────────┘
                     │    │ level           │
                     │    │ strengths_json  │
                     │    │ weaknesses_json │
                     │    │ created_at      │
                     │    └─────────────────┘
                     │
                     │    ┌─────────────────┐
                     └───►│  chat_sessions  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ user_id (FK)    │
                          │ roadmap_id (FK) │
                          │ messages_json   │
                          │ created_at      │
                          └─────────────────┘
```

Table Definitions

users

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);
```

assessments

```sql
CREATE TABLE assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    mode VARCHAR(20) DEFAULT 'standard',
    questions_json TEXT NOT NULL,
    answers_json TEXT,
    score INTEGER,
    level VARCHAR(20),
    strengths_json TEXT,
    weaknesses_json TEXT,
    blind_spots_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

🔒 Security Considerations

API Key Security

```javascript
// config/security.js
require('dotenv').config();

module.exports = {
    groqApiKey: process.env.GROQ_API_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    allowedOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']
};

// Validation on startup
function validateConfig() {
    const required = ['GROQ_API_KEY', 'SESSION_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}
```

Security Headers (Helmet)

```javascript
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.groq.com"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

Input Validation

```javascript
const { body, validationResult } = require('express-validator');

const assessmentValidators = [
    body('mode').optional().isIn(['standard', 'oscp']),
    body('userId').optional().isUUID(),
    validateResults
];

function validateResults(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                details: errors.array()
            }
        });
    }
    next();
}
```

Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please try again later'
        }
    }
});

const assessmentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5
});

app.use('/api/', apiLimiter);
app.use('/api/assessment/generate', assessmentLimiter);
```

Content Safety

```javascript
const PROHIBITED_PATTERNS = [
    /exploit\s+(?:code|payload)/i,
    /how\s+(?:to|do\s+I)\s+hack/i,
    /(?:sql\s*injection|xss|rce)\s+(?:payload|exploit)/i,
    /bypass\s+(?:authentication|login)/i,
    /(?:brute\s*force|crack)\s+(?:password|hash)/i
];

function contentSafetyCheck(message) {
    const violations = PROHIBITED_PATTERNS.filter(pattern => pattern.test(message));
    
    if (violations.length > 0) {
        return {
            safe: false,
            reason: 'Request contains potentially harmful content',
            action: 'redirect_to_ethical_guidance'
        };
    }
    
    return { safe: true };
}
```

---

🚀 Deployment Guide

Platform: Render (Recommended)

Step 1: Prepare Repository
Ensure your repository includes:
- `package.json` with start script
- `.env.example` (without real values)
- `README.md`

Step 2: Create Web Service
1. Log in to [Render](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: offsec-ai-mentor
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (or paid for production)

Step 3: Environment Variables
In Render dashboard, add:

```
GROQ_API_KEY=your_groq_api_key
SESSION_SECRET=your_session_secret
NODE_ENV=production
PORT=10000
```

Step 4: Deploy
Click "Create Web Service". Render automatically builds and deploys.

Platform: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway variables set GROQ_API_KEY=your_key
railway up
```

Platform: Heroku

```bash
heroku login
heroku create offsec-ai-mentor
heroku config:set GROQ_API_KEY=your_key
heroku config:set SESSION_SECRET=your_secret
git push heroku main
```

Docker Deployment

Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Production Checklist

- Environment variables configured
- Database persistence set up
- HTTPS enabled
- Rate limiting active
- Error monitoring configured
- Logging configured
- Backup strategy for database
- Health check endpoint implemented
- CORS properly configured
- Security headers enabled

---

🤝 Contributing

Contribution Guidelines

We welcome contributions that:
- Improve user experience
- Enhance accessibility
- Fix bugs
- Improve documentation
- Add ethical learning resources

Process:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

Code Standards

JavaScript
- ESLint configuration included
- Prettier for formatting
- JSDoc for documentation
- Max function length: 50 lines
- Max file length: 300 lines

CSS
- BEM naming convention
- Mobile-first media queries
- CSS variables for theming

Commits
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance

Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/OffSec-AI-Mentor.git

# Install dependencies
npm install

# Create branch
git checkout -b feature/your-feature

# Start dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

---

🗺️ Roadmap

Version 1.1 (Q2 2024)
- Study resource recommendations
- Progress tracking dashboard
- Milestone celebrations
- Dark mode toggle

Version 1.2 (Q3 2024)
- User accounts (optional)
- Assessment history
- Progress analytics
- Community features

Version 2.0 (Q4 2024)
- Additional certification support (eJPT, PNPT)
- Integration with learning platforms
- Mobile app (React Native)
- AI model fine-tuning

Future Ideas
- Study group matching
- Mentor marketplace
- Certification success prediction
- Personalized lab recommendations

---

📝 Changelog

[1.0.0] - 2024-01-15
- Initial production release
- Dynamic assessment with Groq AI
- 6 OffSec certification roadmaps
- Guided mentor chat with safety constraints
- Export functionality
- Neo-brutalist design system
- Mobile-responsive layout

[0.9.0] - 2024-01-01 (Beta)
- Beta testing with community
- Security audit
- Performance optimization

---

📄 License

MIT License

Copyright (c) 2024 OffSec AI Mentor Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

---

🙏 Acknowledgments

- Offensive Security for creating the certification standards
- Groq for providing fast, affordable AI inference
- Neo-brutalism design community for aesthetic inspiration
- All contributors who tested and provided feedback

---

💬 Support

Getting Help

GitHub Issues: https://github.com/hotaro6754/OffSec-AI-Mentor/issues

Discussions: https://github.com/hotaro6754/OffSec-AI-Mentor/discussions

FAQ

Q: Is this tool free?
A: Yes, completely free. You need your own Groq API key (free tier available).

Q: Does it teach hacking?
A: No. It provides educational guidance, readiness assessment, and study planning only.

Q: Is my data safe?
A: Yes. Data is stored locally in SQLite. No external sharing. Passwords are hashed.

Q: Can I use this for my team?
A: Yes. Deploy internally and configure as needed.

---

Built with ❤️ for the OffSec Community

"A calm, experienced mentor helping learners find direction—not teaching them how to hack."

---

