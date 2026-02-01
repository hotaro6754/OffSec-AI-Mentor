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

// AI Provider Configuration - Groq ONLY
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Determine which AI provider to use
let AI_PROVIDER = 'groq'; // Always Groq
let AI_MODEL = 'llama-3.3-70b-versatile';
let AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
let AI_API_KEY = GROQ_API_KEY || '';

if (GROQ_API_KEY) {
    console.log('✅ AI Provider: Groq API (LLaMA 3.3 70B)');
} else {
    AI_PROVIDER = 'none'; // Set to none if no system key, but defaults are still set for BYOK
    console.warn('⚠️  WARNING: No Groq API key found!');
    console.warn('   Assessment will use fallback questions only.');
    console.warn('   Roadmap generation will NOT be available.');
    console.warn('');
    console.warn('   💡 TIP: Get a FREE Groq API key:');
    console.warn('      1. Go to https://console.groq.com');
    console.warn('      2. Sign up and get a free API key');
    console.warn('      3. Add GROQ_API_KEY=your_key to your .env file');
    console.warn('');
}

if (AI_PROVIDER !== 'none') {
    console.log('✅ API key loaded successfully');
}


// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS - Allow all origins for this public learning app
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Groq-API-Key'],
    credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Auth middleware - extracts user from session and custom API keys
app.use((req, res, next) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
        req.user = db.validateSession(sessionId);
    }
    
    // Extract custom API keys from request headers
    req.customKeys = {
        groq: req.headers['x-groq-api-key']
    };
    next();
});

// ============================================================================
// RESOURCES DATABASE (Curated learning resources)
// ============================================================================

const RESOURCES = {
    youtube: {
        channels: [
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', focus: 'CTFs, malware analysis, general hacking' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', focus: 'HTB walkthroughs, methodology' },
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', focus: 'Networking, beginner-friendly' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', focus: 'Pentesting, career guidance' },
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', focus: 'Binary exploitation, CTFs' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Networking, certifications' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', focus: 'Pentesting tutorials' },
            { name: 'STÖK', url: 'https://www.youtube.com/@STOKfredrik', focus: 'Bug bounty, web security' },
            { name: 'Nahamsec', url: 'https://www.youtube.com/@NahamSec', focus: 'Bug bounty, recon' },
            { name: '13Cubed', url: 'https://www.youtube.com/@13Cubed', focus: 'DFIR, forensics' }
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
        { name: 'Penetration Tester', url: 'https://academy.hackthebox.com/path/preview/penetration-tester', cert: 'HTB CPTS' },
        { name: 'Bug Bounty Hunter', url: 'https://academy.hackthebox.com/path/preview/web-penetration-tester', cert: 'HTB CBBH' },
        { name: 'SOC Analyst', url: 'https://academy.hackthebox.com/path/preview/soc-analyst', cert: 'HTB CDSA' }
    ],
    thmPaths: [
        { name: 'Pre-Security', url: 'https://tryhackme.com/path/outline/presecurity', level: 'Beginner', focus: 'Basics' },
        { name: 'Complete Beginner', url: 'https://tryhackme.com/path/outline/beginner', level: 'Beginner', focus: 'Linux, web, scripting' },
        { name: 'Jr Penetration Tester', url: 'https://tryhackme.com/path/outline/jrpenetrationtester', level: 'Intermediate', focus: 'Pentesting methodology' },
        { name: 'Offensive Pentesting', url: 'https://tryhackme.com/path/outline/pentesting', level: 'Intermediate', focus: 'OSCP prep' },
        { name: 'Red Teaming', url: 'https://tryhackme.com/path/outline/redteaming', level: 'Advanced', focus: 'Red team ops' },
        { name: 'Cyber Defense', url: 'https://tryhackme.com/path/outline/cyberdefense', level: 'Intermediate', focus: 'Blue team' }
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
// FALLBACK QUESTIONS (used when AI APIs are unavailable)
// ============================================================================

const FALLBACK_QUESTIONS = {
    beginner: [
        {
            type: "multiple-choice",
            question: "What does the 'ls' command do in Linux?",
            options: ["Lists files and directories", "Links systems", "Loads software", "Lists servers"],
            correctAnswer: "Lists files and directories",
            explanation: "The 'ls' command lists the contents of a directory in Linux.",
            hint: "Think about viewing directory contents",
            topic: "linux"
        },
        {
            type: "multiple-choice",
            question: "What is the purpose of DNS?",
            options: ["Translates domain names to IP addresses", "Encrypts network traffic", "Stores user passwords", "Scans networks for vulnerabilities"],
            correctAnswer: "Translates domain names to IP addresses",
            explanation: "DNS (Domain Name System) translates human-readable domain names to IP addresses.",
            hint: "It helps you access websites by name",
            topic: "networking"
        },
        {
            type: "multiple-choice",
            question: "Which HTTP method is typically used to retrieve data from a server?",
            options: ["GET", "POST", "DELETE", "PUT"],
            correctAnswer: "GET",
            explanation: "GET is used to request data from a server without modifying it.",
            hint: "Think about reading or fetching data",
            topic: "web security"
        },
        {
            type: "multiple-choice",
            question: "What does SSH stand for?",
            options: ["Secure Shell", "Secure Service Host", "System Secure Host", "Secure System Hardware"],
            correctAnswer: "Secure Shell",
            explanation: "SSH (Secure Shell) is a cryptographic network protocol for secure remote login.",
            hint: "It provides secure remote access",
            topic: "networking"
        },
        {
            type: "multiple-choice",
            question: "What is the primary purpose of a firewall?",
            options: ["To filter and monitor network traffic", "To provide internet connection", "To increase internet speed", "To store sensitive data"],
            correctAnswer: "To filter and monitor network traffic",
            explanation: "A firewall controls incoming and outgoing traffic based on security rules.",
            hint: "Think about network security and traffic control",
            topic: "networking"
        },
        {
            type: "multiple-choice",
            question: "In Linux, what does the 'chmod' command do?",
            options: ["Changes file permissions", "Changes file ownership", "Changes file modification time", "Changes file content"],
            correctAnswer: "Changes file permissions",
            explanation: "chmod modifies read, write, and execute permissions on files and directories.",
            hint: "It controls who can read, write, or execute files",
            topic: "linux"
        },
        {
            type: "short-answer",
            question: "What are the three components of the CIA triad in information security?",
            expectedKeywords: ["confidentiality", "integrity", "availability"],
            explanation: "CIA stands for Confidentiality, Integrity, and Availability - the three core principles of information security.",
            hint: "Think about protecting data, keeping it accurate, and ensuring access",
            topic: "security concepts"
        },
        {
            type: "multiple-choice",
            question: "Which port is commonly used for HTTP web traffic?",
            options: ["80", "443", "22", "3389"],
            correctAnswer: "80",
            explanation: "Port 80 is the default port for unencrypted HTTP web traffic, while 443 is used for HTTPS.",
            hint: "Think about standard web browsing",
            topic: "networking"
        },
        {
            type: "short-answer",
            question: "What type of attack involves manipulating database queries through user input?",
            expectedKeywords: ["sql injection", "sqli", "sql"],
            explanation: "SQL Injection is an attack where malicious SQL code is inserted into application queries.",
            hint: "It targets database queries through untrusted input",
            topic: "web security"
        },
        {
            type: "multiple-choice",
            question: "What does XSS stand for in web security?",
            options: ["Cross-Site Scripting", "External Security System", "Cross-Server Scripting", "Extended Security Service"],
            correctAnswer: "Cross-Site Scripting",
            explanation: "XSS (Cross-Site Scripting) is a vulnerability that allows attackers to inject malicious scripts into web pages.",
            hint: "It involves injecting scripts across websites",
            topic: "web security"
        }
    ],
    oscp: [
        {
            type: "multiple-choice",
            question: "During a penetration test, you discover a web application vulnerable to LFI. Which file would be MOST useful for privilege escalation information on a Linux target?",
            options: ["/etc/passwd", "/var/www/html/index.php", "/etc/hostname", "/var/log/syslog"],
            correctAnswer: "/etc/passwd",
            explanation: "/etc/passwd contains user account information and can reveal valid usernames for further attacks.",
            hint: "Think about user enumeration",
            topic: "web exploitation"
        },
        {
            type: "short-answer",
            question: "You've gained a foothold on a Windows machine. What command would you run first to enumerate the current user's privileges?",
            expectedKeywords: ["whoami /priv", "whoami", "privileges"],
            explanation: "'whoami /priv' displays current user privileges and can reveal if tokens like SeImpersonatePrivilege are enabled.",
            hint: "Focus on checking what permissions your current account has",
            topic: "privilege escalation"
        },
        {
            type: "multiple-choice",
            question: "Which Kerberos attack allows you to request service tickets for any SPN without needing admin privileges?",
            options: ["Kerberoasting", "Pass-the-Hash", "Golden Ticket", "Silver Ticket"],
            correctAnswer: "Kerberoasting",
            explanation: "Kerberoasting requests TGS tickets for SPNs and cracks them offline to obtain service account passwords.",
            hint: "This attack targets service accounts with SPNs",
            topic: "active directory"
        },
        {
            type: "multiple-choice",
            question: "What privilege escalation technique involves exploiting a file with the SUID bit set?",
            options: ["Binary exploitation with elevated permissions", "Kernel module injection", "Service misconfiguration", "DLL hijacking"],
            correctAnswer: "Binary exploitation with elevated permissions",
            explanation: "SUID binaries run with the permissions of the file owner (often root), creating privilege escalation opportunities.",
            hint: "SUID allows programs to run as the file owner",
            topic: "privilege escalation"
        },
        {
            type: "short-answer",
            question: "What tool is commonly used to visualize Active Directory relationships and identify attack paths?",
            expectedKeywords: ["bloodhound", "blood hound"],
            explanation: "BloodHound maps Active Directory relationships and highlights paths for privilege escalation and lateral movement.",
            hint: "It creates a graph database of AD relationships",
            topic: "active directory"
        },
        {
            type: "multiple-choice",
            question: "You need to pivot through a compromised host to access an internal network. Which technique would establish a SOCKS proxy?",
            options: ["SSH dynamic port forwarding (-D)", "Port forwarding (-L)", "Remote port forwarding (-R)", "Netcat relay"],
            correctAnswer: "SSH dynamic port forwarding (-D)",
            explanation: "SSH -D creates a SOCKS proxy that allows routing traffic through the compromised host.",
            hint: "Think about dynamic proxy capabilities",
            topic: "pivoting"
        },
        {
            type: "multiple-choice",
            question: "Which Windows privilege is most commonly exploited with tools like JuicyPotato or PrintSpoofer?",
            options: ["SeImpersonatePrivilege", "SeDebugPrivilege", "SeBackupPrivilege", "SeLoadDriverPrivilege"],
            correctAnswer: "SeImpersonatePrivilege",
            explanation: "SeImpersonatePrivilege allows a process to impersonate tokens, which can be exploited for privilege escalation.",
            hint: "This privilege allows token impersonation",
            topic: "privilege escalation"
        },
        {
            type: "short-answer",
            question: "What technique allows you to dump NTLM hashes from a domain controller without executing code on it?",
            expectedKeywords: ["dcsync", "dc sync"],
            explanation: "DCSync mimics domain controller replication to extract password hashes from Active Directory.",
            hint: "It simulates domain controller replication",
            topic: "active directory"
        },
        {
            type: "multiple-choice",
            question: "During post-exploitation, you find a database connection string with credentials. What should be your FIRST action?",
            options: ["Test if credentials work for other services", "Extract the entire database", "Delete the connection string", "Modify the database"],
            correctAnswer: "Test if credentials work for other services",
            explanation: "Password reuse is common; credentials found should be tested against other services for lateral movement.",
            hint: "Think about credential reuse and lateral movement",
            topic: "post exploitation"
        },
        {
            type: "multiple-choice",
            question: "What type of SQLi payload would you use to determine if the database is MySQL?",
            options: ["' OR '1'='1' -- -", "' UNION SELECT @@version-- -", "' AND 1=2-- -", "'; DROP TABLE users-- -"],
            correctAnswer: "' UNION SELECT @@version-- -",
            explanation: "@@version is MySQL-specific syntax that returns the database version, helping identify the DBMS.",
            hint: "Look for database-specific version queries",
            topic: "web exploitation"
        }
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
1. Enumeration Depth: Service identification, versioning, script-based enumeration, finding low-hanging fruit.
2. Active Directory: Kerberoasting, AS-REP Roasting, BloodHound analysis, pivoting between domains, GPO abuse.
3. Privilege Escalation: Linux (SUID, Cron, Kernel, Capabilities) and Windows (Token Impersonation, Unquoted Service Paths, Registry abuse).
4. Web Exploitation: SQLi (Union/Error/Time-based), File Upload bypasses, LFI/RFI to RCE, Directory Traversal.
5. Buffer Overflow Concepts: Stack anatomy, EIP control, JMP ESP, Bad chars, Shellcode prep (Theory only).
6. Exam Mindset: Time management, report-writing essentials, note-taking, handling rabbit holes.

QUESTION STYLE FOR OSCP MODE:
- BRUTAL and HONEST. No beginner-level fluff.
- Scenario-based: "During an exam, you find X..." or "You have a shell as Y, now what?"
- Multi-step: Question should imply a sequence of actions.
- Open-ended: Use short-answer types to test depth.
- Methodology-focused, not exploit code.`;

        const beginnerTopics = `
BEGINNER-LEVEL TOPICS (foundational):
1. Computer Basics: RAM vs CPU, Operating Systems, File Systems.
2. Networking: What is an IP, what is a port, basic TCP/UDP.
3. Linux: Basic commands (ls, cd, cat), absolute vs relative paths.
4. Web: What is a URL, what is a browser, basics of HTTP.
5. Security: What is a password, basic CIA triad (Confidentiality, Integrity, Availability).`;

        return `You are creating a FRESH assessment for ${isOscp ? 'OSCP-prep learners (ADVANCED)' : 'absolute beginner cybersecurity learners (ZERO KNOWLEDGE)'}.

CRITICAL: Generate COMPLETELY NEW questions. This is retake #${retakeCount + 1}.
${usedHashes.length > 0 ? `\nAVOID these previously used question patterns - create entirely different scenarios.` : ''}

${isOscp ? oscpTopics : beginnerTopics}

REQUIREMENTS:
- 10 questions total: 5 multiple choice, 5 short answer.
- Each question must be UNIQUE and appropriate for the level.
- BEGINNER MODE: Questions must be GENTLE, FOUNDATIONAL, and EASY. NO ADVANCED jargon.
- OSCP MODE: Questions must be BRUTAL, EXAM-LEVEL, UNFORGIVING, and SCENARIO-BASED.
- Test understanding and methodology.

JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "type": "multiple-choice" | "short-answer",
      "question": "Realistic scenario-based question",
      "options": ["A", "B", "C", "D"], // only for multiple-choice
      "correctAnswer": "Exact correct answer",
      "explanation": "Why this is correct + OSCP exam insight",
      "hint": "Strategic hint",
      "topic": "networking|linux|web|security|ad|privesc|pivoting|bof|mindset"
    }
  ]
}

STRICT RULES:
✗ NO actual exploit code or payloads
✗ NO beginner-level definitions in OSCP mode
✓ Focus on decision making under pressure`;
    },

    /**
     * Evaluation prompt - enhanced with Readiness Analysis
     */
    evaluation: `You are a helpful cybersecurity mentor evaluating an assessment.

MODE-SPECIFIC INSTRUCTIONS:
- BEGINNER MODE: Be ENCOURAGING, FRIENDLY, and supportive. Focus on identifying what they already know and what foundations they need to build.
- OSCP MODE: Be BRUTALLY HONEST, RIGOROUS, and exam-focused. Analyze gaps specifically against the PEN-200 syllabus.

OUTPUT FORMAT (JSON):
{
  "readinessScore": <number 0-100, only relevant for OSCP mode, else 0>,
  "readinessStatus": "Ready" | "Almost Ready" | "Not Ready" | "N/A",
  "level": "Absolute Beginner" | "Beginner" | "Intermediate" | "Advanced",
  "score": <number 0-100>,
  "strengths": ["Specific skill 1", "Skill 2"],
  "weaknesses": ["Growth area 1", "Growth area 2"],
  "confidenceGaps": ["Area where user shows hesitation or partial knowledge"],
  "skillBreakdown": {
    "Foundations": <0-100>,
    "Linux/Windows": <0-100>,
    "Networking": <0-100>,
    "Web Security": <0-100>,
    "Methodology": <0-100>
  },
  "focusSuggestion": "Personalized advice on what to learn next.",
  "oscpAlignment": "Alignment with PEN-200 syllabus (only for OSCP mode)."
}

Be appropriate to the selected mode. Output ONLY valid JSON.`,

    /**
     * Adaptive Roadmap prompt - generates HIGHLY DETAILED structured JSON roadmap
     */
    roadmap: (mode, level, weaknesses, cert, resources, assessmentResult = {}) => {
        const isOscp = mode === 'oscp';

        const beginnerInstructions = `
IMPORTANT INSTRUCTIONS FOR BEGINNER MODE (ABSOLUTE ZERO):
- ASSUME ZERO KNOWLEDGE: This user knows NOTHING.
- START FROM SCRATCH: Begin with Computer basics, OS fundamentals, and Networking.
- NO SHORTCUTS: Do NOT compress phases. User needs to learn everything.
- DETAILED PATH: Provide 8-12 Progressive Phases:
  1. Computer & Hardware Basics
  2. Networking Fundamentals (TCP/IP, Ports)
  3. Linux Basics & CLI Usage
  4. Windows Basics & Administration
  5. Web Fundamentals (HTTP/HTML/JS)
  6. Basic Scripting (Python/Bash)
  7. Security Fundamentals (CIA, Auth)
  8. Intermediate Certification: THM Junior Penetration Tester
  9. Intermediate Certification: PNPT (Practical Network Penetration Tester)
  10. Advanced Enumeration & Methodology
  11. Active Directory Foundations
  12. Preparation for ${cert}
- MANDATORY LABS: Must include OverTheWire (Bandit), TryHackMe (Pre-Security, Complete Beginner), and HTB Academy modules.
- ALL LINKS MUST BE REAL: Use verified URLs from ${JSON.stringify(resources.thmPaths)} and ${JSON.stringify(resources.htbPaths)}.`;

        const oscpInstructions = `
IMPORTANT INSTRUCTIONS FOR OSCP MODE:
- BRUTAL & ADVANCED: Focus specifically on the exam level.
- ADAPTIVE DESIGN: Focus ONLY on the identified gaps: ${weaknesses.join(', ')}.
- OSCP SYLLABUS ALIGNMENT: Strictly align with PEN-200 syllabus.
- MANDATORY LABS: Include specific HTB (Dante, Offshore, etc.) and THM Offensive Pentesting links.
- PRE-OSCP ALIGNMENT: Recommend PNPT or CPTS as bridges if gaps are significant.`;

        return `Create a comprehensive, visually stunning, and HIGHLY ADAPTIVE ${cert} learning roadmap.

USER DATA:
- Mode: ${mode.toUpperCase()}
- Level: ${level}
- Identified Gaps: ${weaknesses.join(', ')}
- Readiness Score: ${assessmentResult.readinessScore || 'N/A'}%

${isOscp ? oscpInstructions : beginnerInstructions}

MUST INCLUDE IN JSON:
1. **Gap Analysis**: Checklist of missing skills and weak areas.
2. **Dynamic Phases** (8-12 for Beginners, 4-6 for OSCP Mode):
   - Phase Name and "Why it matters for ${cert}".
   - Outcomes, Tools, and Mandatory Labs (with URLs).
   - Resources with button-style links.
3. **Pre-OSCP Recommendations**: Aligned certifications with mapping to user gaps.
4. **Tools Mastery Guide**: Deep dive into critical tools with commands.
5. **Success Metrics**: Phase-wise indicators of readiness.

RESPOND WITH VALID JSON (pure JSON only):
{
  "targetCertification": "${cert}",
  "currentLevel": "${level}",
  "gap_analysis": {
    "missing_skills": [],
    "weak_areas": [],
    "alignment_percentage": 0
  },
  "roadmap": [
    {
      "phase": 1,
      "phase_name": "[Name]",
      "why_it_matters": "[Significance for ${cert}]",
      "duration_weeks": 4,
      "learning_outcomes": [],
      "weekly_breakdown": [{"week": 1, "topics": [], "labs": [], "checkpoint": ""}],
      "mandatory_labs": [{"name": "", "platform": "HTB|THM", "url": "", "skills": []}],
      "resources": [{"type": "YouTube|Blog", "name": "", "url": ""}],
      "completion_checklist": []
    }
  ],
  "pre_oscp_alignment": [
    {"cert": "PNPT|CRTP|eJPT", "reason": "", "overlap_with_oscp": "", "gap_it_bridges": ""}
  ],
  "tools_mastery_guide": [
    {
      "category": "Recon|Exploitation|Post-Exploitation",
      "tool": "",
      "skill_level": "Beginner|Intermediate|Advanced",
      "commands": [{"cmd": "", "purpose": ""}]
    }
  ],
  "daily_study_schedule": [],
  "success_metrics": []
}`;
    },

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

async function callAI(prompt, expectJson = false, retries = 3, customKeys = {}) {
    // Groq ONLY
    let currentApiKey = customKeys.groq || AI_API_KEY;

    if (!currentApiKey) {
        throw new Error("Groq API key is missing");
    }

    console.log(`📤 Calling GROQ API...`);
    
    const result = await tryCallAI(currentApiKey, AI_MODEL, AI_API_URL, prompt, expectJson, retries);
    
    if (result.success) {
        return result.data;
    }
    
    throw new Error(result.error || "AI call failed");
}

async function tryCallAI(apiKey, model, apiUrl, prompt, expectJson = false, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            let response, data;
            
            // Groq uses OpenAI-compatible format
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
                temperature: expectJson ? 0.1 : 0.7,
                max_tokens: 8192
            };

            response = await fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            }, 60000);

            if (response.ok) {
                data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    console.log(`✅ GROQ API call successful`);
                    return { success: true, data: data.choices[0].message.content };
                }
                throw new Error('Invalid API response');
            }

            // Handle errors
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429) {
                if (attempt < retries) {
                    // Exponential backoff: 5s, 15s, 30s for rate limits
                    const waitTimes = [5, 15, 30];
                    const waitTime = waitTimes[Math.min(attempt, waitTimes.length - 1)];
                    console.log(`⏳ GROQ rate limited, waiting ${waitTime}s before retry ${attempt + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }
                // Return rate limit error so caller can use fallback
                return { success: false, rateLimit: true, error: `GROQ rate limit exceeded` };
            }
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        } catch (error) {
            if (attempt === retries) {
                console.error(`❌ GROQ API error:`, error.message);
                return { success: false, rateLimit: false, error: error.message };
            }
            console.log(`⚠️ GROQ Attempt ${attempt} failed, retrying...`);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return { success: false, rateLimit: false, error: 'Max retries exceeded' };
}

function parseJsonResponse(text) {
    // 1. Try standard parse
    try {
        return JSON.parse(text);
    } catch (e) {
        // 2. Try to extract JSON from markdown blocks or find first brace/bracket
        let content = text.trim();

        // Check for markdown code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            content = codeBlockMatch[1].trim();
        } else {
            // Find first occurrence of { or [
            const firstBrace = content.indexOf('{');
            const firstBracket = content.indexOf('[');
            let start = -1;

            if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
            else start = Math.max(firstBrace, firstBracket);

            if (start !== -1) {
                // Try to find the last occurrence of } or ]
                const lastBrace = content.lastIndexOf('}');
                const lastBracket = content.lastIndexOf(']');
                const end = Math.max(lastBrace, lastBracket);

                if (end > start) {
                    content = content.substring(start, end + 1);
                } else {
                    content = content.substring(start);
                }
            }
        }

        // 3. Clean common LLM artifacts (trailing commas)
        content = content.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        // 4. Try parsing the extracted/cleaned content
        try {
            return JSON.parse(content);
        } catch (e2) {
            // Still fails, maybe truncated. Try to close brackets/braces.
            let fixedContent = content;
            let stack = [];
            let inString = false;
            let escaped = false;

            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                if (escaped) { escaped = false; continue; }
                if (char === '\\') { escaped = true; continue; }
                if (char === '"') { inString = !inString; continue; }
                if (!inString) {
                    if (char === '{') stack.push('}');
                    else if (char === '[') stack.push(']');
                    else if (char === '}') { if (stack[stack.length - 1] === '}') stack.pop(); }
                    else if (char === ']') { if (stack[stack.length - 1] === ']') stack.pop(); }
                }
            }

            if (inString) fixedContent += '"';
            while (stack.length > 0) {
                fixedContent += stack.pop();
            }

            try {
                return JSON.parse(fixedContent);
            } catch (e3) {
                // Return original error if robust parsing also fails
                console.error('Robust JSON parsing failed:', e3.message);
                throw e2;
            }
        }
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

        // Try to generate questions using AI
        try {
            const prompt = PROMPTS.questionGeneration(mode, usedHashes, retakeCount);
            
            console.log('📤 Calling AI API for question generation...');
            // Use retries=1 to fail fast when APIs are rate-limited
            const response = await callAI(prompt, true, 1, req.customKeys);
            console.log('📄 AI response received, length:', response?.length || 0);
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

            console.log('✅ Generated', parsed.questions.length, 'questions using AI');
            return res.json(parsed);
        } catch (aiError) {
            // AI failed - use fallback questions silently
            console.log('⚠️  AI generation failed, using fallback questions silently');
            console.log('   Error was:', aiError.message);
            
            // Return fallback questions based on mode
            const fallbackQuestions = FALLBACK_QUESTIONS[mode] || FALLBACK_QUESTIONS.beginner;
            console.log('✅ Returning', fallbackQuestions.length, 'fallback questions');
            
            return res.status(200).json({ questions: fallbackQuestions });
        }
    } catch (error) {
        // This should only catch unexpected errors (validation, etc.)
        console.error('❌ Unexpected error in generate-questions:', error.message);
        console.error('Stack:', error.stack);
        
        // Even on unexpected error, return fallback questions to avoid user-facing errors
        const fallbackQuestions = FALLBACK_QUESTIONS[req.body.mode] || FALLBACK_QUESTIONS.beginner;
        console.log('✅ Returning fallback questions due to unexpected error');
        return res.status(200).json({ questions: fallbackQuestions });
    }
});

app.post('/api/evaluate-assessment', async (req, res) => {
    console.log('\n📊 POST /api/evaluate-assessment');
    
    // Check if AI API is available (either system-wide or via custom keys)
    const hasCustomKey = req.customKeys && Object.values(req.customKeys).some(key => !!key);

    if (AI_PROVIDER === 'none' && !hasCustomKey) {
        return res.status(503).json({
            error: 'AI service not available. Please configure an API key.',
            userMessage: 'Assessment evaluation requires AI. Please configure your API key in Settings.'
        });
    }

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
        
        console.log('📤 Calling AI API for evaluation...');
        const response = await callAI(prompt, true, 3, req.customKeys);
        console.log('📄 AI response received, length:', response?.length || 0);
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
    
    // Check if AI API is available (either system-wide or via custom keys)
    const hasCustomKey = req.customKeys && Object.values(req.customKeys).some(key => !!key);

    if (AI_PROVIDER === 'none' && !hasCustomKey) {
        return res.status(503).json({ 
            error: 'AI service not available. Please configure an API key.',
            userMessage: 'Roadmap generation requires AI. Please configure your API key in Settings.'
        });
    }
    
    try {
        const { level, weaknesses, cert, assessmentResult, mode = 'beginner' } = req.body;
        
        if (!level || !weaknesses || !cert) {
            return res.status(400).json({ error: 'Level, weaknesses, and cert required' });
        }

        const prompt = PROMPTS.roadmap(mode, level, weaknesses, cert, RESOURCES, assessmentResult);
        
        let response;
        let retryCount = 0;
        const maxRetries = 2;
        
        // Retry loop for AI API calls
        while (retryCount < maxRetries) {
            try {
                console.log(`📤 Calling AI API for roadmap generation (attempt ${retryCount + 1}/${maxRetries})...`);
                // Use fallback chain with only 1 retry per attempt for fast response
                // CRITICAL: Set expectJson to true to ensure strict JSON output from LLM
                response = await callAI(prompt, true, 1, req.customKeys);
                console.log('📄 Roadmap response received, length:', response?.length || 0);
                
                // Validate response - check for meaningful content
                if (!response || response.length < 200) {
                    throw new Error('Roadmap response too short or empty - expected at least 200 characters');
                }
                
                // Check for basic JSON structure (expecting a JSON object)
                if (!response.trim().startsWith('{') && !response.includes('{')) {
                    throw new Error('Invalid roadmap format - expected JSON structure');
                }
                
                // Success - break out of retry loop
                break;
            } catch (attemptError) {
                retryCount++;
                console.log(`⚠️  Attempt ${retryCount} failed:`, attemptError.message);
                
                if (retryCount >= maxRetries) {
                    // All retries exhausted
                    throw attemptError;
                }
                
                // Wait before retrying with exponential backoff
                const waitTime = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s exponential
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

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

        // Clean and parse the AI response to ensure valid JSON is sent to the frontend
        const parsedRoadmap = parseJsonResponse(response);

        console.log('✅ Roadmap generated and parsed successfully');
        res.json({ roadmap: parsedRoadmap });
    } catch (error) {
        console.error('❌ Error in generate-roadmap:', error.message);
        console.error('Stack:', error.stack);
        
        // Return user-friendly error message (NO static fallback roadmap)
        res.status(500).json({ 
            error: 'AI is taking longer than expected. Please try again.',
            userMessage: 'AI is taking longer than expected. Please try again.',
            technicalDetails: error.message 
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
    
    // Check if AI API is available (either system-wide or via custom keys)
    const hasCustomKey = req.customKeys && Object.values(req.customKeys).some(key => !!key);

    if (AI_PROVIDER === 'none' && !hasCustomKey) {
        return res.status(503).json({
            error: 'AI service not available. Please configure an API key.',
            userMessage: 'Mentor chat requires AI. Please configure your API key in Settings.'
        });
    }

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
        
        console.log('📤 Calling AI API for mentor chat...');
        // Use fewer retries for mentor chat to fail faster and fallback quicker
        const response = await callAI(prompt, false, 1, req.customKeys);
        console.log('📄 AI response received');

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
            console.log('💬 GROQ API rate-limited, returning helpful guidance...');
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

app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║   🎓 OffSec AI Mentor v2.0 - Backend Server                    ║');
    console.log('║                                                                ║');
    console.log(`║   🚀 Server running on http://0.0.0.0:${PORT}                    ║`);
    console.log('║                                                                ║');
    console.log('║   📊 System Status:                                            ║');
    console.log(`║   • AI Provider: ${AI_PROVIDER.toUpperCase() || 'FALLBACK ONLY'}${AI_PROVIDER !== 'none' ? ' ✅' : ' ⚠️ '}          ║`);
    console.log('║   • Database: SQLite ✅                                        ║');
    console.log('║   • CORS: Public Access ✅                                    ║');
    console.log('║   • Authentication: Enabled ✅                                ║');
    console.log('║                                                                ║');
    console.log('║   ✨ Features:                                                 ║');
    console.log('║   • User authentication & sessions                            ║');
    console.log('║   • Question variation (no repeats!)                           ║');
    console.log('║   • Progress tracking & checklist                              ║');
    console.log('║   • Curated resources (YT, books, tools)                       ║');
    console.log('║   • OSCP mode with Pro Labs style questions                    ║');
    console.log('║                                                                ║');
    console.log('║   🌐 Ready for deployment!                                    ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
