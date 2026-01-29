/**
 * OffSec AI Mentor - Backend Server v2.0
 * 
 * FEATURES:
 * - User authentication (register/login)
 * - Assessment with question variation
 * - Personalized roadmaps with resources
 * - Progress tracking & checklist
 * - Chat history persistence
 * 
 * ENDPOINTS:
 * Auth: POST /api/register, /api/login, /api/logout, GET /api/me
 * Assessment: POST /api/generate-questions, /api/evaluate-assessment
 * Roadmap: POST /api/generate-roadmap, GET /api/roadmaps
 * Chat: POST /api/mentor-chat, GET /api/chat-history
 * Checklist: GET /api/checklist, POST /api/checklist, PUT /api/checklist/:id
 * Stats: GET /api/stats
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

// ============================================================================
// CONFIGURATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables from .env file
require('dotenv').config();

// AI Provider Configuration - supports OpenAI, Groq, Deepseek, or Gemini
// Priority: GROQ (free) > OPENAI > DEEPSEEK > GEMINI
// If GROQ rate limits, automatically fallback to OPENAI
// If OPENAI rate limits, automatically fallback to DEEPSEEK
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Determine which AI provider to use (primary)
let AI_PROVIDER = 'none';
let AI_API_KEY = '';
let AI_MODEL = '';
let AI_API_URL = '';

// Fallback provider configuration (1st fallback)
let FALLBACK_PROVIDER = 'none';
let FALLBACK_API_KEY = '';
let FALLBACK_MODEL = '';
let FALLBACK_API_URL = '';

// Secondary fallback provider configuration (2nd fallback)
let FALLBACK2_PROVIDER = 'none';
let FALLBACK2_API_KEY = '';
let FALLBACK2_MODEL = '';
let FALLBACK2_API_URL = '';

if (GROQ_API_KEY) {
    AI_PROVIDER = 'groq';
    AI_API_KEY = GROQ_API_KEY;
    AI_MODEL = 'llama-3.3-70b-versatile';
    AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    console.log('✅ Primary: Groq API (LLaMA 3.3 70B)');
    
    // Set up fallback chain: OpenAI -> Deepseek
    if (OPENAI_API_KEY) {
        FALLBACK_PROVIDER = 'openai';
        FALLBACK_API_KEY = OPENAI_API_KEY;
        FALLBACK_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        FALLBACK_API_URL = 'https://api.openai.com/v1/chat/completions';
        console.log('✅ Fallback 1: OpenAI API (' + FALLBACK_MODEL + ')');
        
        // Third fallback: Deepseek
        if (DEEPSEEK_API_KEY) {
            FALLBACK2_PROVIDER = 'deepseek';
            FALLBACK2_API_KEY = DEEPSEEK_API_KEY;
            FALLBACK2_MODEL = 'deepseek-chat';
            FALLBACK2_API_URL = 'https://api.deepseek.com/chat/completions';
            console.log('✅ Fallback 2: Deepseek API (deepseek-chat)');
        }
    } else if (DEEPSEEK_API_KEY) {
        FALLBACK_PROVIDER = 'deepseek';
        FALLBACK_API_KEY = DEEPSEEK_API_KEY;
        FALLBACK_MODEL = 'deepseek-chat';
        FALLBACK_API_URL = 'https://api.deepseek.com/chat/completions';
        console.log('✅ Fallback: Deepseek API (deepseek-chat)');
    }
} else if (OPENAI_API_KEY) {
    AI_PROVIDER = 'openai';
    AI_API_KEY = OPENAI_API_KEY;
    AI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    AI_API_URL = 'https://api.openai.com/v1/chat/completions';
    console.log('✅ Using OpenAI API (' + AI_MODEL + ')');
} else if (GEMINI_API_KEY) {
    AI_PROVIDER = 'gemini';
    AI_API_KEY = GEMINI_API_KEY;
    AI_MODEL = 'gemini-2.5-flash';
    AI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    console.log('✅ Using Google Gemini API (2.5 Flash)');
} else {
    console.error('❌ ERROR: No AI API key found!');
    console.error('   Please set one of: GROQ_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY in your .env file');
    console.error('');
    console.error('   💡 TIP: Groq offers a FREE API key with generous limits:');
    console.error('      1. Go to https://console.groq.com');
    console.error('      2. Sign up and get a free API key');
    console.error('      3. Add GROQ_API_KEY=your_key to your .env file');
    process.exit(1);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Auth middleware - extracts user from session
app.use((req, res, next) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
        req.user = db.validateSession(sessionId);
    }
    next();
});

// ============================================================================
// RESOURCES DATABASE (Curated learning resources)
// ============================================================================

const RESOURCES = {
    youtube: {
        channels: [
            { name: 'John Hammond', url: 'https://youtube.com/@_JohnHammond', focus: 'CTFs, malware analysis, general hacking' },
            { name: 'IppSec', url: 'https://youtube.com/@ippsec', focus: 'HTB walkthroughs, methodology' },
            { name: 'NetworkChuck', url: 'https://youtube.com/@NetworkChuck', focus: 'Networking, beginner-friendly' },
            { name: 'The Cyber Mentor', url: 'https://youtube.com/@TCMSecurityAcademy', focus: 'Pentesting, career guidance' },
            { name: 'LiveOverflow', url: 'https://youtube.com/@LiveOverflow', focus: 'Binary exploitation, CTFs' },
            { name: 'David Bombal', url: 'https://youtube.com/@davidbombal', focus: 'Networking, certifications' },
            { name: 'HackerSploit', url: 'https://youtube.com/@HackerSploit', focus: 'Pentesting tutorials' },
            { name: 'STÖK', url: 'https://youtube.com/@STOKfredrik', focus: 'Bug bounty, web security' },
            { name: 'Nahamsec', url: 'https://youtube.com/@NahamSec', focus: 'Bug bounty, recon' },
            { name: '13Cubed', url: 'https://youtube.com/@13Cubed', focus: 'DFIR, forensics' }
        ]
    },
    platforms: {
        free: [
            { name: 'TryHackMe', url: 'https://tryhackme.com', type: 'Guided learning', difficulty: 'Beginner-Intermediate' },
            { name: 'HackTheBox', url: 'https://hackthebox.com', type: 'CTF machines', difficulty: 'Intermediate-Advanced' },
            { name: 'PicoCTF', url: 'https://picoctf.org', type: 'Beginner CTF', difficulty: 'Beginner' },
            { name: 'OverTheWire', url: 'https://overthewire.org/wargames', type: 'Linux wargames', difficulty: 'Beginner' },
            { name: 'VulnHub', url: 'https://vulnhub.com', type: 'Downloadable VMs', difficulty: 'All levels' },
            { name: 'PortSwigger Academy', url: 'https://portswigger.net/web-security', type: 'Web security', difficulty: 'All levels' },
            { name: 'Pwn.College', url: 'https://pwn.college', type: 'Binary exploitation', difficulty: 'Intermediate' },
            { name: 'CryptoHack', url: 'https://cryptohack.org', type: 'Cryptography', difficulty: 'Intermediate' }
        ],
        paid: [
            { name: 'HTB Academy', url: 'https://academy.hackthebox.com', type: 'Structured courses', price: '$$' },
            { name: 'TCM Security', url: 'https://academy.tcm-sec.com', type: 'Pentesting courses', price: '$$' },
            { name: 'Offensive Security', url: 'https://offsec.com', type: 'OSCP/OSWE prep', price: '$$$' },
            { name: 'PentesterLab', url: 'https://pentesterlab.com', type: 'Web pentesting', price: '$$' }
        ]
    },
    htbPaths: [
        { name: 'Penetration Tester', machines: 'Starting Point → Easy → Medium', cert: 'HTB CPTS' },
        { name: 'Bug Bounty Hunter', machines: 'Web challenges + machines', cert: 'HTB CBBH' },
        { name: 'SOC Analyst', machines: 'Sherlock challenges', cert: 'HTB CDSA' }
    ],
    thmPaths: [
        { name: 'Pre-Security', duration: '40 hours', level: 'Beginner', focus: 'Basics' },
        { name: 'Complete Beginner', duration: '64 hours', level: 'Beginner', focus: 'Linux, web, scripting' },
        { name: 'Jr Penetration Tester', duration: '56 hours', level: 'Intermediate', focus: 'Pentesting methodology' },
        { name: 'Offensive Pentesting', duration: '47 hours', level: 'Intermediate', focus: 'OSCP prep' },
        { name: 'Red Teaming', duration: '48 hours', level: 'Advanced', focus: 'Red team ops' },
        { name: 'Cyber Defense', duration: '48 hours', level: 'Intermediate', focus: 'Blue team' }
    ],
    htbProLabs: [
        { name: 'Dante', difficulty: 'Beginner', focus: 'AD basics, pivoting intro', machines: 14 },
        { name: 'Offshore', difficulty: 'Intermediate', focus: 'Full AD attack chain', machines: 17 },
        { name: 'RastaLabs', difficulty: 'Advanced', focus: 'Realistic red team', machines: 15 },
        { name: 'Cybernetics', difficulty: 'Advanced', focus: 'Enterprise environment', machines: 22 },
        { name: 'APTLabs', difficulty: 'Expert', focus: 'APT simulation', machines: 18 }
    ],
    certifications: {
        beginner: [
            { name: 'CompTIA Security+', provider: 'CompTIA', focus: 'Security fundamentals', duration: '2-3 months' },
            { name: 'eJPT', provider: 'INE', focus: 'Junior pentesting', duration: '1-2 months' },
            { name: 'BTL1', provider: 'Security Blue Team', focus: 'Blue team basics', duration: '2 months' }
        ],
        intermediate: [
            { name: 'PNPT', provider: 'TCM Security', focus: 'Practical pentesting', duration: '2-3 months' },
            { name: 'eCPPT', provider: 'INE', focus: 'Professional pentesting', duration: '3-4 months' },
            { name: 'HTB CPTS', provider: 'HackTheBox', focus: 'Pentesting', duration: '3-4 months' },
            { name: 'CCD', provider: 'CyberDefenders', focus: 'Blue team', duration: '2-3 months' }
        ],
        advanced: [
            { name: 'OSCP', provider: 'OffSec', focus: 'Penetration testing', duration: '4-6 months' },
            { name: 'OSWE', provider: 'OffSec', focus: 'Web exploitation', duration: '3-4 months' },
            { name: 'OSEP', provider: 'OffSec', focus: 'Evasion', duration: '4-5 months' },
            { name: 'CRTO', provider: 'Zero-Point Security', focus: 'Red team ops', duration: '2-3 months' }
        ]
    },
    tools: {
        reconnaissance: ['Nmap', 'Masscan', 'Rustscan', 'Amass', 'Subfinder', 'httpx', 'Shodan'],
        webTesting: ['Burp Suite', 'OWASP ZAP', 'Nikto', 'Gobuster', 'ffuf', 'SQLMap', 'wfuzz'],
        exploitation: ['Metasploit', 'searchsploit', 'msfvenom', 'CrackMapExec', 'Impacket'],
        passwordAttacks: ['Hashcat', 'John the Ripper', 'Hydra', 'CeWL', 'Crunch'],
        postExploitation: ['Mimikatz', 'BloodHound', 'PowerView', 'Rubeus', 'Covenant', 'Ligolo-ng'],
        wireless: ['Aircrack-ng', 'Wifite', 'Bettercap'],
        forensics: ['Volatility', 'Autopsy', 'Wireshark', 'FTK Imager'],
        scripting: ['Python', 'Bash', 'PowerShell']
    },
    books: [
        { title: 'The Web Application Hacker\'s Handbook', author: 'Dafydd Stuttard', level: 'Intermediate' },
        { title: 'Penetration Testing', author: 'Georgia Weidman', level: 'Beginner' },
        { title: 'Hacking: The Art of Exploitation', author: 'Jon Erickson', level: 'Intermediate' },
        { title: 'Red Team Field Manual', author: 'Ben Clark', level: 'Reference' },
        { title: 'The Hacker Playbook 3', author: 'Peter Kim', level: 'Intermediate' },
        { title: 'Black Hat Python', author: 'Justin Seitz', level: 'Intermediate' },
        { title: 'Bug Bounty Bootcamp', author: 'Vickie Li', level: 'Beginner-Intermediate' },
        { title: 'Practical Malware Analysis', author: 'Sikorski & Honig', level: 'Advanced' }
    ]
};

// ============================================================================
// PROMPTS - Enhanced with resources
// ============================================================================

const PROMPTS = {
    /**
     * Generate assessment questions with variation
     */
    questionGeneration: (mode, usedHashes = [], retakeCount = 0) => {
        const isOscp = mode === 'oscp';
        
        const oscpTopics = `
OSCP-LEVEL TOPICS (scenario-based, practical):
1. Active Directory: Kerberoasting concepts, AS-REP roasting theory, trust relationships
2. Privilege Escalation: SUID/capabilities concepts, service misconfigurations, kernel exploit methodology
3. Network Pivoting: Port forwarding concepts, tunneling theory, lateral movement planning
4. Web Exploitation: SQLi methodology, file upload bypasses, LFI/RFI theory
5. Password Attacks: Hash types, cracking methodology, spray attack concepts
6. Buffer Overflow: Stack concepts, DEP/ASLR theory (no actual shellcode)

QUESTION STYLE FOR OSCP MODE:
- HTB/Pro Labs scenario style
- "During an engagement, you discover..." type questions  
- Methodology-focused, not exploit code
- Decision-making scenarios
- Similar to Dante/Offshore lab scenarios`;

        const beginnerTopics = `
BEGINNER-LEVEL TOPICS (foundational):
1. Networking: TCP/IP, OSI model, common ports/protocols, subnetting basics
2. Linux: File permissions, common commands, directory structure
3. Web Security: HTTP methods, OWASP Top 10 concepts, cookies/sessions
4. Security Fundamentals: CIA triad, authentication, encryption basics
5. Reconnaissance: Passive vs active, OSINT concepts, enumeration theory`;

        return `You are creating a FRESH assessment for ${isOscp ? 'OSCP-prep learners (advanced)' : 'beginner cybersecurity learners'}.

CRITICAL: Generate COMPLETELY NEW questions. This is retake #${retakeCount + 1}.
${usedHashes.length > 0 ? `\nAVOID these previously used question patterns - create entirely different scenarios and angles.` : ''}

${isOscp ? oscpTopics : beginnerTopics}

REQUIREMENTS:
- 10 questions total: 6-7 multiple choice, 3-4 short answer
- Each question must be UNIQUE - different scenario, different angle
- Include realistic scenarios ${isOscp ? 'like HTB/Dante style' : 'for learning'}
- Test understanding and methodology, not memorization
- Add random elements: different IPs, ports, usernames, scenarios each time

JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Unique scenario-based question",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Exact text of correct option",
      "explanation": "Why this is correct + learning insight",
      "hint": "Guiding hint without giving away answer",
      "topic": "networking|linux|web|security|recon|${isOscp ? 'ad|privesc|pivoting' : ''}"
    }
  ]
}

STRICT RULES:
✗ NO actual exploit code
✗ NO real CVE details
✗ NO step-by-step hacking commands
✓ Focus on methodology and concepts
✓ Make each question feel fresh and different`;
    },

    /**
     * Evaluation prompt - enhanced
     */
    evaluation: `You are evaluating a cybersecurity assessment. Analyze carefully and provide a detailed JSON response.

OUTPUT FORMAT:
{
  "level": "Beginner" | "Foundation" | "Intermediate" | "Advanced",
  "score": <number 0-100>,
  "strengths": ["Specific strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Growth area 1", "Growth area 2", "Growth area 3"],
  "focusSuggestion": "Personalized 2-3 sentence recommendation with specific next steps.",
  "topicScores": {
    "networking": <0-100>,
    "linux": <0-100>,
    "web": <0-100>,
    "security": <0-100>
  }
}

LEVEL CRITERIA:
- "Beginner": < 40% - needs fundamentals
- "Foundation": 40-60% - ready for guided hands-on
- "Intermediate": 60-80% - ready for CTFs and labs
- "Advanced": > 80% - ready for advanced challenges

Be encouraging but honest. Output ONLY valid JSON.`,

    /**
     * Roadmap prompt - generates HIGHLY DETAILED structured JSON roadmap
     */
    roadmap: (level, weaknesses, cert, resources) => `Create a comprehensive ${cert} learning roadmap for a ${level}-level learner with these focus areas: ${weaknesses.join(', ')}.

MUST INCLUDE:
1. **Executive Summary**: 2-3 sentences on their learning journey and goals
2. **6-8 Learning Phases** with:
   - Clear outcomes and capabilities gained
   - Week-by-week topics and labs
   - Platforms: TryHackMe, HackTheBox, PortSwigger
   - Estimated weekly hours
   
3. **Tools Mastery Guide** (Nmap, Burp, Linux, etc):
   - When and why to use each tool
   - Key commands for beginners
   - Advanced techniques for later phases

4. **Curated Resources**:
   - YouTube channels (John Hammond, IppSec, NetworkChuck, etc)
   - Essential books with why they matter
   - Platforms comparison (cost, what to use each for)

5. **Daily Study Schedule**: Realistic routine mixing theory and hands-on

6. **Success Metrics**: Weekly checkpoints and capability gains

7. **Addressing Weaknesses**: How each phase tackles their specific gaps

8. **Motivation Tips**: Common challenges and how to overcome them

RESPOND WITH VALID JSON (no markdown blocks, pure JSON only):
{
  "executive_summary": "[2-3 sentences on journey]",
  "phases": [
    {
      "phase": 1,
      "name": "[Name]",
      "duration": "3-4 weeks",
      "outcomes": ["[Outcome 1]", "[Outcome 2]"],
      "weeks": [{"week": 1, "topics": ["[Topic]"], "labs": ["[Lab]"]}],
      "tools": ["[Tool 1]", "[Tool 2]"],
      "hours_per_week": 15
    }
  ],
  "tools_guide": [
    {"name": "[Tool]", "purpose": "[Why]", "commands": ["[cmd1]", "[cmd2]"], "when": "[When to use]"}
  ],
  "resources": {
    "youtube": [{"channel": "[Name]", "why": "[Value]"}],
    "books": [{"title": "[Title]", "author": "[Author]", "for_what": "[Purpose]"}],
    "platforms": [{"name": "[Platform]", "cost": "[Free/Paid]", "for": "[Purpose]"}]
  },
  "daily_schedule": "[Morning theory, afternoon labs, evening practice]",
  "success_metrics": ["[Milestone 1]", "[Milestone 2]"],
  "address_weaknesses": {"focus": "${weaknesses.join(', ')}", "how": "[Addressed in phases X, Y, Z]"},
  "motivation": "[Handle common challenges and celebrate wins]"
}`,

    /**
     * Mentor chat - professional and structured
     */
    mentorChat: `You are "OffSec Mentor" - an experienced cybersecurity professional providing structured career and study guidance.

RESPONSE STYLE:
1. Brief acknowledgment (1 sentence)
2. Main content with headers and bullets
3. Actionable takeaway

FORMAT:
• **Bold** for key terms
• Bullet points for lists
• Tables for comparisons (HTML syntax)
• Short paragraphs (2-3 sentences max)

ALLOWED TOPICS:
✓ Career paths, certifications, study strategies
✓ Motivation, lab building, interview prep
✓ Platform recommendations (THM, HTB, etc.)
✓ Tool learning priorities
✓ Resource recommendations

BOUNDARIES:
✗ NO exploit code or commands
✗ NO vulnerability details
✗ NO illegal activity discussion

If restricted topic: "I focus on career guidance. For hands-on techniques, I recommend legal platforms like TryHackMe or HackTheBox."

Keep responses 150-300 words, structured and scannable.`
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function for fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

// Call only primary AI provider (no fallback) - for roadmap generation
async function callAIPrimary(prompt, expectJson = false, retries = 3) {
    console.log(`📤 Calling ${AI_PROVIDER.toUpperCase()} API (Primary Only - No Fallback)...`);
    
    const result = await tryCallAI(AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_API_URL, prompt, expectJson, retries);
    
    if (result.success) {
        return result.data;
    }
    
    throw new Error(result.error);
}

async function callAI(prompt, expectJson = false, retries = 3) {
    console.log(`📤 Calling ${AI_PROVIDER.toUpperCase()} API...`);
    
    // Try with primary provider first
    const result = await tryCallAI(AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_API_URL, prompt, expectJson, retries);
    
    // If primary fails with rate limit and fallback available, try fallback
    if (!result.success && result.rateLimit && FALLBACK_PROVIDER !== 'none') {
        console.log(`🔄 Switching to fallback ${FALLBACK_PROVIDER.toUpperCase()} API...`);
        const fallbackResult = await tryCallAI(FALLBACK_PROVIDER, FALLBACK_API_KEY, FALLBACK_MODEL, FALLBACK_API_URL, prompt, expectJson, retries);
        if (fallbackResult.success) {
            console.log(`✅ ${FALLBACK_PROVIDER.toUpperCase()} API succeeded!`);
            return fallbackResult.data;
        }
        
        // If first fallback also fails with rate limit and second fallback available, try it
        if (!fallbackResult.success && fallbackResult.rateLimit && FALLBACK2_PROVIDER !== 'none') {
            console.log(`🔄 Switching to secondary fallback ${FALLBACK2_PROVIDER.toUpperCase()} API...`);
            const fallback2Result = await tryCallAI(FALLBACK2_PROVIDER, FALLBACK2_API_KEY, FALLBACK2_MODEL, FALLBACK2_API_URL, prompt, expectJson, retries);
            if (fallback2Result.success) {
                console.log(`✅ ${FALLBACK2_PROVIDER.toUpperCase()} API succeeded!`);
                return fallback2Result.data;
            }
        }
        
        // If all APIs fail, throw error
        throw new Error(result.error);
    }
    
    if (result.success) {
        return result.data;
    }
    
    throw new Error(result.error);
}

async function tryCallAI(provider, apiKey, model, apiUrl, prompt, expectJson = false, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            let response, data;
            
            if (provider === 'gemini') {
                // Gemini API has different format
                const requestBody = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: expectJson ? 0.3 : 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192
                    }
                };
                if (expectJson) {
                    requestBody.generationConfig.responseMimeType = 'application/json';
                }

                response = await fetchWithTimeout(`${apiUrl}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }, 45000);

                if (response.ok) {
                    data = await response.json();
                    if (data.candidates?.[0]?.content?.parts) {
                        console.log(`✅ ${provider.toUpperCase()} API call successful`);
                        return { success: true, data: data.candidates[0].content.parts.map(p => p.text).join('') };
                    }
                    throw new Error('Invalid API response from Gemini');
                }
            } else {
                // OpenAI and Groq use the same API format
                const messages = [{ role: 'user', content: prompt }];
                
                if (expectJson) {
                    messages.unshift({
                        role: 'system',
                        content: 'You are a helpful assistant. Always respond with valid JSON only, no markdown code blocks or explanations. Just pure JSON.'
                    });
                }

                const requestBody = {
                    model: model,
                    messages,
                    temperature: expectJson ? 0.3 : 0.7,
                    max_tokens: 4096
                };

                // Only use response_format for OpenAI (Groq doesn't support it reliably)
                if (expectJson && provider === 'openai') {
                    requestBody.response_format = { type: 'json_object' };
                }

                response = await fetchWithTimeout(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                }, 45000);

                if (response.ok) {
                    data = await response.json();
                    if (data.choices?.[0]?.message?.content) {
                        console.log(`✅ ${provider.toUpperCase()} API call successful`);
                        return { success: true, data: data.choices[0].message.content };
                    }
                    throw new Error('Invalid API response');
                }
            }

            // Handle errors
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429) {
                if (attempt < retries) {
                    // Exponential backoff: 5s, 15s, 30s for rate limits
                    const waitTimes = [5, 15, 30];
                    const waitTime = waitTimes[Math.min(attempt, waitTimes.length - 1)];
                    console.log(`⏳ ${provider.toUpperCase()} rate limited, waiting ${waitTime}s before retry ${attempt + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }
                // Return rate limit error so caller can use fallback
                return { success: false, rateLimit: true, error: `${provider.toUpperCase()} rate limit exceeded` };
            }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        } catch (error) {
            if (attempt === retries) {
                console.error(`❌ ${provider.toUpperCase()} API error:`, error.message);
                return { success: false, rateLimit: false, error: error.message };
            }
            console.log(`⚠️ ${provider.toUpperCase()} Attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return { success: false, rateLimit: false, error: 'Max retries exceeded' };
}

function parseJsonResponse(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
        if (match) {
            const cleaned = (match[1] || match[0]).replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            return JSON.parse(cleaned);
        }
        throw new Error('No valid JSON found');
    }
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

app.post('/api/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const result = db.registerUser(email, username, password);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }
        
        // Auto-login after registration
        const login = db.loginUser(email, password);
        res.json(login);
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;
        
        if (!emailOrUsername || !password) {
            return res.status(400).json({ error: 'Email/username and password required' });
        }
        
        const result = db.loginUser(emailOrUsername, password);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        
        res.json(result);
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

app.post('/api/logout', (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
        db.logoutUser(sessionId);
    }
    res.json({ success: true });
});

app.get('/api/me', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.user });
});

// ============================================================================
// ASSESSMENT ENDPOINTS
// ============================================================================

app.post('/api/generate-questions', async (req, res) => {
    console.log('\n🎯 POST /api/generate-questions');
    
    try {
        const { mode = 'beginner' } = req.body;
        
        if (!['beginner', 'oscp'].includes(mode)) {
            return res.status(400).json({ error: 'Invalid mode' });
        }

        // Get previously used questions to ensure variety
        let usedHashes = [];
        let retakeCount = 0;
        try {
            if (req.user) {
                usedHashes = db.getUsedQuestionHashes(req.user.id, mode);
                const history = db.getAssessmentHistory(req.user.id);
                retakeCount = history.filter(a => a.mode === mode).length;
            }
        } catch (dbError) {
            console.warn('⚠️  Database error (continuing):', dbError.message);
        }

        const prompt = PROMPTS.questionGeneration(mode, usedHashes, retakeCount);
        
        console.log('📤 Calling Groq API for question generation...');
        // Use retries=1 to fail fast when APIs are rate-limited
        const response = await callAI(prompt, true, 1);
        console.log('📄 Groq response received, length:', response?.length || 0);
        const parsed = parseJsonResponse(response);
        
        if (!parsed.questions?.length) {
            throw new Error('Invalid questions format - no questions in response');
        }

        // Save questions to prevent repetition if database is available
        try {
            if (req.user && parsed.questions) {
                db.saveUsedQuestions(req.user.id, parsed.questions, mode);
            }
        } catch (dbError) {
            console.warn('⚠️  Could not save questions to database:', dbError.message);
        }

        console.log('✅ Generated', parsed.questions.length, 'questions');
        res.json(parsed);
    } catch (error) {
        console.error('❌ Error in generate-questions:', error.message);
        console.error('Stack:', error.stack);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            console.log('🎓 Both APIs rate-limited, returning demo questions...');
            // Return demo questions when both APIs are rate-limited
            const demoQuestions = {
                questions: [
                    {
                        type: "multiple-choice",
                        question: "What is the primary purpose of a firewall?",
                        options: ["To provide internet connection", "To filter and monitor network traffic", "To increase internet speed", "To store data"],
                        correctAnswer: "To filter and monitor network traffic",
                        explanation: "A firewall controls incoming and outgoing traffic based on predetermined security rules.",
                        hint: "Think about network security",
                        topic: "networking"
                    },
                    {
                        type: "multiple-choice",
                        question: "Which command is used to list files in a Linux directory?",
                        options: ["dir", "list", "ls", "show"],
                        correctAnswer: "ls",
                        explanation: "The 'ls' command lists the contents of a directory in Linux.",
                        hint: "It's a short command name",
                        topic: "linux"
                    },
                    {
                        type: "multiple-choice",
                        question: "What does SSH stand for?",
                        options: ["Secure Shell", "Secure Service Host", "System Secure Host", "Secure System Hardware"],
                        correctAnswer: "Secure Shell",
                        explanation: "SSH (Secure Shell) is a cryptographic network protocol for secure remote login.",
                        hint: "Think about secure remote access",
                        topic: "networking"
                    }
                ]
            };
            return res.status(200).json(demoQuestions);
        }
        
        res.status(500).json({ 
            error: 'Failed to generate questions', 
            details: error.message 
        });
    }
});

app.post('/api/evaluate-assessment', async (req, res) => {
    console.log('\n📊 POST /api/evaluate-assessment');
    
    try {
        const { answers, questions, mode } = req.body;
        
        if (!answers || !questions) {
            return res.status(400).json({ error: 'Answers and questions required' });
        }

        const answersText = Object.entries(answers)
            .map(([idx, answer]) => {
                const q = questions[parseInt(idx)];
                return `Q${parseInt(idx) + 1} (${q?.topic || 'general'}): ${q?.question}\nAnswer: ${answer}\nCorrect: ${q?.correctAnswer || 'N/A'}`;
            })
            .join('\n\n');

        const prompt = `${PROMPTS.evaluation}\n\nAssessment:\n${answersText}`;
        
        console.log('📤 Calling Groq API for evaluation...');
        const response = await callAI(prompt, true);
        console.log('📄 Groq response received, length:', response?.length || 0);
        const parsed = parseJsonResponse(response);
        
        // Save to database if logged in
        try {
            if (req.user) {
                db.saveAssessment(req.user.id, {
                    mode: mode || 'beginner',
                    score: parsed.score || 0,
                    level: parsed.level,
                    strengths: parsed.strengths,
                    weaknesses: parsed.weaknesses,
                    questions,
                    answers
                });
            }
        } catch (dbError) {
            console.warn('⚠️  Could not save assessment to database:', dbError.message);
        }

        console.log('✅ Evaluation complete - Level:', parsed.level, '- Score:', parsed.score);
        res.json(parsed);
    } catch (error) {
        console.error('❌ Error in evaluate-assessment:', error.message);
        console.error('Stack:', error.stack);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            return res.status(429).json({
                error: 'API Rate Limited',
                details: 'The AI service is currently overloaded. Please wait a few minutes and try again. Consider upgrading to a paid API tier for better reliability.',
                retryAfter: 300
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to evaluate assessment', 
            details: error.message 
        });
    }
});

// ============================================================================
// ROADMAP ENDPOINTS
// ============================================================================

app.post('/api/generate-roadmap', async (req, res) => {
    console.log('\n🗺️ POST /api/generate-roadmap');
    
    try {
        const { level, weaknesses, cert } = req.body;
        
        if (!level || !weaknesses || !cert) {
            return res.status(400).json({ error: 'Level, weaknesses, and cert required' });
        }

        const prompt = PROMPTS.roadmap(level, weaknesses, cert, RESOURCES);
        
        console.log('📤 Calling AI API for roadmap generation (fast fallback chain)...');
        // Use fallback chain with only 1 retry for fast response
        const response = await callAI(prompt, false, 1);
        console.log('📄 Roadmap response received, length:', response?.length || 0);

        // Save roadmap if logged in
        try {
            if (req.user) {
                db.saveRoadmap(req.user.id, {
                    title: `${cert} Roadmap - ${new Date().toLocaleDateString()}`,
                    content: response,
                    targetCert: cert,
                    level
                });
            }
        } catch (dbError) {
            console.warn('⚠️  Could not save roadmap to database:', dbError.message);
        }

        console.log('✅ Roadmap generated');
        res.json({ roadmap: response });
    } catch (error) {
        console.error('❌ Error in generate-roadmap:', error.message);
        console.error('Stack:', error.stack);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            console.log('🗺️ All APIs rate-limited, returning demo roadmap...');
            // Return a demo roadmap when all APIs are rate-limited
            const demoRoadmap = `# ${req.body.cert} Certification Roadmap
## Your Personalized Learning Path

### Phase 1: Foundations (Weeks 1-3)
**Objective**: Build core cybersecurity knowledge

- **Networking Fundamentals**
  - TCP/IP Model and OSI Layers
  - Common Protocols (HTTP, DNS, DHCP, SMTP)
  - Network Addressing and Subnetting
  
- **Linux Essentials** (${req.body.weaknesses?.includes('Linux') ? '⭐ PRIORITY' : 'Standard'})
  - File system navigation and permissions
  - User and group management
  - Shell scripting basics
  
- **Security Concepts**
  - CIA Triad and security principles
  - Common threat vectors
  - Defense-in-depth strategies

**Resources**:
- TryHackMe: Linux Fundamentals rooms
- YouTube: NetworkChuck Linux crash course

---

### Phase 2: Intermediate Skills (Weeks 4-8)
**Objective**: Develop practical offensive security skills

- **Web Security**
  - OWASP Top 10 vulnerabilities
  - SQL Injection and XSS
  - Authentication & authorization flaws
  
- **System Hardening**
  - Access controls and permissions
  - Firewall configuration
  - Service security hardening
  
- **Reconnaissance Techniques**
  - Active and passive information gathering
  - Vulnerability scanning
  - Network mapping tools

**Resources**:
- HackTheBox: Easy difficulty machines
- TryHackMe: Security assessment courses

---

### Phase 3: Practical Exploitation (Weeks 9-14)
**Objective**: Hands-on hacking experience

- **Lab Work**
  - Complete 15-20 capture-the-flag challenges
  - Solve 10+ HackTheBox machines
  - Participate in practice penetration tests
  
- **Tool Proficiency**
  - Nmap, Metasploit, Burp Suite
  - Wireshark for packet analysis
  - Exploitation frameworks

- **Methodology**
  - Penetration testing reports
  - Vulnerability assessment documentation
  - Risk analysis frameworks

---

### Phase 4: Advanced Topics (Weeks 15+)
**Objective**: Master advanced techniques

- **Advanced Exploitation**
  - Privilege escalation techniques
  - Lateral movement strategies
  - Post-exploitation activities
  
- **Specialized Areas**
  - Web application testing
  - Wireless security
  - Cloud security basics
  
- **Certification Prep**
  - Practice exams and reviews
  - Weak area reinforcement
  - Mock assessments

---

## Daily Schedule Recommendation

| Time | Activity | Duration |
|------|----------|----------|
| 8-9 AM | Theory & Concepts | 1 hour |
| 9-12 PM | Lab Work & Practice | 3 hours |
| 12-1 PM | Lunch Break | 1 hour |
| 1-4 PM | Hands-on Challenges | 3 hours |
| 4-5 PM | Review & Notes | 1 hour |

**Total: 8 hours/day (flexible)**

---

## Key Resources

**Platforms**:
- TryHackMe (Free & Paid): Interactive labs and guided learning
- HackTheBox: Real-world-like challenges
- OverTheWire: Wargames for practice

**YouTube Channels**:
- NetworkChuck: Networking and security fundamentals
- John Hammond: CTF walkthroughs and tutorials
- LiveOverflow: Advanced security concepts

**Books**:
- "Penetration Testing" by Georgia Weidman
- "The Web Application Hacker's Handbook"
- "Linux Command Line" by William E. Shotts Jr.

---

## Success Milestones

✓ Complete all foundational courses
✓ Solve 20+ CTF challenges
✓ Pass 3 practice exams with 80%+ score
✓ Build and configure personal lab environment
✓ Document findings and create sample report
✓ Network with security community

---

## Progress Tracking

After each phase:
- Review weak areas identified
- Adjust study plan as needed
- Document lessons learned
- Update skill matrix

**Remember**: Security mastery is a marathon, not a sprint. Consistency beats intensity!`;
            return res.status(200).json({ roadmap: demoRoadmap });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate roadmap', 
            details: error.message 
        });
    }
});

app.get('/api/roadmaps', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const roadmaps = db.getUserRoadmaps(req.user.id);
    res.json({ roadmaps });
});

app.get('/api/roadmaps/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const roadmap = db.getRoadmap(req.params.id, req.user.id);
    if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
    }
    res.json({ roadmap });
});

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

app.post('/api/mentor-chat', async (req, res) => {
    console.log('\n💬 POST /api/mentor-chat');
    
    try {
        const { message, context = {} } = req.body;
        
        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        let contextInfo = '';
        if (context.level) contextInfo += `\nLevel: ${context.level}`;
        if (context.weaknesses?.length) contextInfo += `\nFocus: ${context.weaknesses.join(', ')}`;
        if (context.cert) contextInfo += `\nTarget: ${context.cert}`;

        const prompt = `${PROMPTS.mentorChat}${contextInfo}\n\nUser: "${message}"`;
        
        console.log('📤 Calling Groq API for mentor chat...');
        // Use fewer retries for mentor chat to fail faster and fallback quicker
        const response = await callAI(prompt, false, 1);
        console.log('📄 Groq response received');

        // Save chat history if logged in
        try {
            if (req.user) {
                db.saveChatMessage(req.user.id, 'user', message);
                db.saveChatMessage(req.user.id, 'mentor', response);
            }
        } catch (dbError) {
            console.warn('⚠️  Could not save chat to database:', dbError.message);
        }

        console.log('✅ Mentor response sent');
        res.json({ reply: response });
    } catch (error) {
        console.error('❌ Error in mentor-chat:', error.message);
        console.error('Stack:', error.stack);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            console.log('💬 Both APIs rate-limited, returning helpful guidance...');
            // Return helpful guidance when both APIs are rate-limited
            const demoReply = "I'm currently helping many learners and the AI service is temporarily overloaded. Here's what I'd recommend in the meantime:\n\n" +
                "1. **Practice with TryHackMe** - Complete beginner-friendly rooms\n" +
                "2. **Study Linux Basics** - Focus on file system navigation and permissions\n" +
                "3. **Learn Networking** - Understand TCP/IP and common protocols\n" +
                "4. **Set up a lab** - Create a virtual machine for hands-on practice\n\n" +
                "Please try again in a few minutes when the service is less busy!";
            return res.status(200).json({ reply: demoReply });
        }
        
        res.status(500).json({ 
            error: 'Failed to get response', 
            details: error.message 
        });
    }
});

// Helper function to generate fallback mentor responses

app.get('/api/chat-history', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const history = db.getChatHistory(req.user.id);
    res.json({ history });
});

app.delete('/api/chat-history', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    db.clearChatHistory(req.user.id);
    res.json({ success: true });
});

// ============================================================================
// CHECKLIST ENDPOINTS
// ============================================================================

app.get('/api/checklist', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const checklist = db.getChecklist(req.user.id);
    res.json({ checklist });
});

app.post('/api/checklist', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const { title, category } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title required' });
    }
    const result = db.addChecklistItem(req.user.id, title, category);
    res.json(result);
});

app.put('/api/checklist/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const result = db.toggleChecklistItem(req.user.id, req.params.id);
    res.json(result);
});

app.delete('/api/checklist/:id', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const result = db.deleteChecklistItem(req.user.id, req.params.id);
    res.json(result);
});

// ============================================================================
// STATS & RESOURCES ENDPOINTS
// ============================================================================

app.get('/api/stats', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Login required' });
    }
    const stats = db.getUserStats(req.user.id);
    res.json({ stats });
});

app.get('/api/resources', (req, res) => {
    res.json({ resources: RESOURCES });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        version: '2.0',
        timestamp: new Date().toISOString()
    });
});

// Serve static files (CSS, images, etc.) 
app.use(express.static(path.join(__dirname)));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║   🎓 OffSec AI Mentor v2.0 - Backend Server                    ║');
    console.log('║                                                                ║');
    console.log(`║   🚀 Server running on http://localhost:${PORT}                  ║`);
    console.log('║                                                                ║');
    console.log('║   New Features:                                                ║');
    console.log('║   • User authentication & sessions                            ║');
    console.log('║   • Question variation (no repeats!)                           ║');
    console.log('║   • Progress tracking & checklist                              ║');
    console.log('║   • Curated resources (YT, books, tools)                       ║');
    console.log('║   • OSCP mode with Pro Labs style questions                    ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
