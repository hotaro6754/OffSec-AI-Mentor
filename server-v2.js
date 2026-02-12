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
const fs = require('fs');
const os = require('os');

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
    console.warn('   AI services will NOT be available without a custom key.');
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
        core_foundations: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', focus: 'Networking, Linux, IT foundations' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', focus: 'Advanced methodology, HTB walkthroughs' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', focus: 'CTFs, Malware, Scripting' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', focus: 'Practical pentesting, Linux, Networking' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', focus: 'Tool tutorials, Ethical hacking' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Networking, Python, Certifications' },
            { name: 'Computerphile', url: 'https://www.youtube.com/@computerphile', focus: 'Computer science concepts' },
            { name: 'PowerCert Animated Videos', url: 'https://www.youtube.com/@PowerCertAnimatedVideos', focus: 'Animated IT concepts' },
            { name: 'Practical Networking', url: 'https://www.youtube.com/@PracticalNetworking', focus: 'Core networking deep dives' },
            { name: 'freeCodeCamp.org', url: 'https://www.youtube.com/@freecodecamp', focus: 'Programming and CS fundamentals' }
        ],
        networking_enumeration: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', focus: 'Networking basics' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Networking labs' },
            { name: 'Practical Networking', url: 'https://www.youtube.com/@PracticalNetworking', focus: 'Network protocols' },
            { name: 'Network Direction', url: 'https://www.youtube.com/@NetworkDirection', focus: 'Enterprise networking' },
            { name: 'PowerCert Animated Videos', url: 'https://www.youtube.com/@PowerCertAnimatedVideos', focus: 'Network fundamentals' },
            { name: 'NahamSec', url: 'https://www.youtube.com/@NahamSec', focus: 'Bug bounty reconnaissance' }
        ],
        web_security: [
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', focus: 'Web exploitation, PortSwigger' },
            { name: 'STÖK', url: 'https://www.youtube.com/@STOKfredrik', focus: 'Bug bounty, web mindset' },
            { name: 'NahamSec', url: 'https://www.youtube.com/@NahamSec', focus: 'Web app pentesting' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', focus: 'Web security research' },
            { name: 'BugCrowd', url: 'https://www.youtube.com/@Bugcrowd', focus: 'Web security training' },
            { name: 'OWASP Foundation', url: 'https://www.youtube.com/@OWASP', focus: 'Web security standards' },
            { name: 'PortSwigger', url: 'https://www.youtube.com/@PortSwigger', focus: 'Burp Suite & Web security' }
        ],
        pentesting_oscp: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', focus: 'The OSCP gold standard' },
            { name: 'TJ Null', url: 'https://www.youtube.com/@TJNull', focus: 'OSCP prep guidance' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', focus: 'PEH course content' },
            { name: 'S1REN', url: 'https://www.youtube.com/@S1REN', focus: 'OSCP-style machines' },
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', focus: 'Manual exploitation' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', focus: 'Methodology & tools' },
            { name: 'ZSecurity', url: 'https://www.youtube.com/@zSecurity', focus: 'Practical hacking' }
        ],
        active_directory: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', focus: 'AD attack paths' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', focus: 'AD exploitation' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', focus: 'AD fundamentals' },
            { name: 'Sektor7', url: 'https://www.youtube.com/@sektor7_inc', focus: 'Advanced AD techniques' },
            { name: 'ZeroPoint Security', url: 'https://www.youtube.com/@ZeroPointSecurity', focus: 'Enterprise security' },
            { name: 'Pentester Academy', url: 'https://www.youtube.com/@PentesterAcademyTV', focus: 'Deep AD training' }
        ],
        red_team: [
            { name: 'ZeroPoint Security', url: 'https://www.youtube.com/@ZeroPointSecurity', focus: 'CRTO training' },
            { name: 'Sektor7', url: 'https://www.youtube.com/@sektor7_inc', focus: 'Evasion & malware' },
            { name: 'Red Team Village', url: 'https://www.youtube.com/@RedTeamVillage', focus: 'Community content' },
            { name: 'Black Hills Information Security', url: 'https://www.youtube.com/@BlackHillsInformationSecurity', focus: 'Enterprise defense/offense' },
            { name: 'Ired.team (talks)', url: 'https://www.ired.team/', focus: 'Technique walkthroughs' }
        ],
        exploit_dev: [
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', focus: 'Binary exploitation' },
            { name: 'Corelan', url: 'https://www.corelan.be/', focus: 'Stack overflows, heap, advanced' },
            { name: 'OpenSecurityTraining', url: 'https://opensecuritytraining.info/', focus: 'Low-level security' },
            { name: 'OpenSecurityTraining2', url: 'https://ost2.fyi/', focus: 'Modern low-level training' },
            { name: 'OALabs', url: 'https://www.youtube.com/@OALabs', focus: 'Malware analysis & RE' },
            { name: 'FuzzySecurity', url: 'https://www.fuzzysecurity.com/', focus: 'Exploit development' }
        ],
        wireless: [
            { name: 'Hak5', url: 'https://www.youtube.com/@hak5', focus: 'WiFi equipment & attacks' },
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', focus: 'WiFi basics' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Wireless security' },
            { name: 'Vivek Ramachandran', url: 'https://www.youtube.com/@VivekRamachandran', focus: 'Wireless hacking expert' }
        ],
        defensive: [
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', focus: 'Blue team & DFIR' },
            { name: 'Security Onion', url: 'https://www.youtube.com/@SecurityOnion', focus: 'NSM & SIEM' },
            { name: 'Elastic Security', url: 'https://www.youtube.com/@ElasticSecurity', focus: 'Endpoint detection' },
            { name: 'Blue Team Village', url: 'https://www.youtube.com/@BlueTeamVillage', focus: 'Defensive community' },
            { name: 'Detection Engineering', url: 'https://www.youtube.com/@DetectionEngineering', focus: 'SIEM & rules' }
        ],
        macos_ios: [
            { name: 'Objective-See', url: 'https://objective-see.org/', focus: 'macOS security tools' },
            { name: 'Patrick Wardle', url: 'https://twitter.com/patrickwardle', focus: 'macOS expert' },
            { name: 'BlackHat macOS talks', url: 'https://www.blackhat.com/', focus: 'Advanced research' },
            { name: 'WWDC Security sessions', url: 'https://developer.apple.com/wwdc/', focus: 'Apple official security' }
        ],
        conference_talks: [
            { name: 'DEF CON Conference', url: 'https://www.youtube.com/@DEFCONConference', focus: 'Advanced hacking' },
            { name: 'Black Hat', url: 'https://www.youtube.com/@BlackHatOfficialYT', focus: 'Enterprise & research' },
            { name: 'OffensiveCon', url: 'https://www.youtube.com/@OffensiveCon', focus: 'Exploit development' },
            { name: 'BlueHat', url: 'https://www.youtube.com/@MicrosoftBlueHat', focus: 'Microsoft security' },
            { name: 'Virus Bulletin', url: 'https://www.youtube.com/@VirusBulletin', focus: 'Malware research' }
        ]
    },
    web: {
        lab_platforms: [
            { name: 'TryHackMe', url: 'https://tryhackme.com' },
            { name: 'Hack The Box', url: 'https://hackthebox.com' },
            { name: 'Hack The Box Academy', url: 'https://academy.hackthebox.com' },
            { name: 'Proving Grounds', url: 'https://www.offsec.com/labs/' },
            { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security' },
            { name: 'VulnHub', url: 'https://www.vulnhub.com' },
            { name: 'Exploit Education', url: 'https://exploit.education' }
        ],
        documentation: [
            { name: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
            { name: 'OWASP WebGoat', url: 'https://owasp.org/www-project-webgoat/' },
            { name: 'Nmap Documentation', url: 'https://nmap.org/book/man.html' },
            { name: 'Metasploit Documentation', url: 'https://docs.metasploit.com/' },
            { name: 'Microsoft Learn', url: 'https://learn.microsoft.com/' },
            { name: 'Linux man pages', url: 'https://man7.org/linux/man-pages/' }
        ],
        blogs_kb: [
            { name: 'IppSec Notes', url: 'https://ippsec.rocks' },
            { name: '0xdf', url: 'https://0xdf.gitlab.io' },
            { name: 'PayloadsAllTheThings', url: 'https://github.com/swisskyrepo/PayloadsAllTheThings' },
            { name: 'HackTricks', url: 'https://book.hacktricks.xyz' },
            { name: 'GTFOBins', url: 'https://gtfobins.github.io' },
            { name: 'LOLBAS', url: 'https://lolbas-project.github.io' },
            { name: 'Red Canary Atomic Red Team', url: 'https://atomicredteam.io' }
        ],
        exploit_dev_re: [
            { name: 'Corelan Team Blog', url: 'https://www.corelan.be' },
            { name: 'OpenSecurityTraining.info', url: 'https://opensecuritytraining.info' },
            { name: 'Azeria Labs', url: 'https://azerialabs.com' },
            { name: 'Malware Unicorn RE101', url: 'https://malwareunicorn.org' },
            { name: 'Nightmares.re', url: 'https://nightmare.re' }
        ],
        defensive_detection: [
            { name: 'SigmaHQ', url: 'https://github.com/SigmaHQ/sigma' },
            { name: 'Elastic Security Blog', url: 'https://www.elastic.co/blog/category/security' },
            { name: 'Splunk Security Blog', url: 'https://www.splunk.com/en_us/blog/security.html' },
            { name: 'Detection Engineering Blog', url: 'https://detectionengineering.net' },
            { name: 'MITRE ATT&CK', url: 'https://attack.mitre.org' }
        ],
        cloud_modern: [
            { name: 'AWS Security Blog', url: 'https://aws.amazon.com/blogs/security/' },
            { name: 'Google Cloud Security', url: 'https://cloud.google.com/blog/products/identity-security' },
            { name: 'Azure Security Documentation', url: 'https://learn.microsoft.com/en-us/azure/security/' },
            { name: 'Wiz Research Blog', url: 'https://www.wiz.io/blog' },
            { name: 'Rhino Security Labs', url: 'https://rhinosecuritylabs.com/blog/' }
        ]
    },
    books: [
        { name: "The Hacker Playbook 3", url: "https://www.amazon.com/dp/1980901755" },
        { name: "Black Hat Python", url: "https://nostarch.com/blackhatpython2E" },
        { name: "Gray Hat Python", url: "https://nostarch.com/ghpython.htm" },
        { name: "Serious Cryptography", url: "https://nostarch.com/seriouscrypto" },
        { name: "Hacking: The Art of Exploitation", url: "https://nostarch.com/hacking2.htm" },
        { name: "Applied Cryptography", url: "https://www.schneier.com/books/applied-cryptography/" },
        { name: "The Shellcoder's Handbook", url: "https://www.wiley.com/en-us/The+Shellcoder0027s+Handbook%3A+Discovering+and+Exploiting+Security+Flaws%2C+2nd+Edition-p-9780470080238" },
        { name: 'The Web Application Hacker’s Handbook', url: 'https://www.wiley.com/en-us/9781118026472' },
        { name: 'Real-World Bug Hunting', url: 'https://nostarch.com/realworldbughunting' },
        { name: 'Penetration Testing (Georgia Weidman)', url: 'https://nostarch.com/pentesting' },
        { name: 'Red Team Field Manual', url: 'https://www.amazon.com/dp/1494295539' },
        { name: 'Blue Team Field Manual', url: 'https://www.amazon.com/dp/154101636X' },
        { name: 'Windows Internals (Part 1 & 2)', url: 'https://learn.microsoft.com/en-us/sysinternals/resources/windows-internals' },
        { name: 'Linux Basics for Hackers', url: 'https://nostarch.com/linuxbasicsforhackers' }
    ],
    special: [
        { name: "OffSec Course Catalog", url: "https://www.offsec.com/courses-and-certifications/", focus: "Official OffSec Training & Certifications" },
        { name: 'Harshith OS', url: 'https://hotaro6754.github.io/Roadmap/', focus: 'Comprehensive Red Team Roadmap Source' }
    ]
};


const MASTER_SKILLS = [
    { id: 0, name: "Linux Fundamentals", category: "Core Foundations", estimatedTime: "3-4 weeks",
      description: "Master the essential Linux operating system concepts, command-line interface, file system navigation, permissions, and shell scripting basics.",
      objectives: ["Navigate the Linux file system with confidence", "Understand user permissions and file ownership", "Execute basic to intermediate bash commands", "Manage processes, services, and system resources", "Configure networking on Linux systems"],
      resources: [{ type: "Platform", text: "TryHackMe: Linux Fundamentals (Parts 1-3)", url: "https://tryhackme.com/module/linux-fundamentals" }, { type: "Wargame", text: "OverTheWire: Bandit", url: "https://overthewire.org/wargames/bandit/" }, { type: "Website", text: "Linux Journey", url: "https://linuxjourney.com" }],
      tools: ["Bash/Zsh", "Vim/Nano", "SSH", "Systemctl", "Grep/Sed/Awk"], labs: ["TryHackMe: Linux Fundamentals Rooms", "HackTheBox: Easy Linux machines"],
      prerequisites: "None", nextSkills: "Bash Scripting, Reconnaissance Methodology" },
    { id: 1, name: "Bash Scripting", category: "Automation", estimatedTime: "2-3 weeks",
      description: "Learn to write efficient bash scripts for automation, reconnaissance, and task management in penetration testing workflows.",
      objectives: ["Write loops, conditionals, and functions in bash", "Automate reconnaissance and enumeration tasks", "Parse command output and process files", "Handle errors and implement logging"],
      resources: [{ type: "Website", text: "Bash Academy", url: "https://guide.bash.academy" }],
      tools: ["Bash", "AWK", "Sed", "Cron"], labs: ["Create automated Nmap scanner", "Build subdomain enumeration tool"],
      prerequisites: "Linux Fundamentals", nextSkills: "Python Fundamentals" },
    { id: 2, name: "Networking Fundamentals", category: "Core Foundations", estimatedTime: "4-5 weeks",
      description: "Understand TCP/IP, DNS, HTTP, network protocols, packet structure, and how data flows across networks.",
      objectives: ["Explain OSI and TCP/IP models", "Understand IP addressing and subnetting", "Analyze common protocols (HTTP, DNS, FTP, SMB)", "Capture and interpret network packets"],
      resources: [{ type: "Platform", text: "TryHackMe: Network Fundamentals", url: "https://tryhackme.com" }, { type: "Website", text: "Practical Networking", url: "https://www.practicalnetworking.net" }],
      tools: ["Wireshark", "tcpdump", "Nmap", "Netcat"], labs: ["TryHackMe: Wireshark 101", "Perform DNS enumeration"],
      prerequisites: "Basic computer knowledge", nextSkills: "Packet Analysis" },
    { id: 3, name: "Windows Basics", category: "Core Foundations", estimatedTime: "2-3 weeks",
      description: "Gain foundational knowledge of Windows operating systems, PowerShell, file system, services, and basic administration.",
      objectives: ["Navigate Windows file system and registry", "Use PowerShell for system administration", "Understand Windows services and processes"],
      resources: [{ type: "Platform", text: "TryHackMe: Windows Fundamentals", url: "https://tryhackme.com" }],
      tools: ["PowerShell", "CMD", "Task Manager"], labs: ["TryHackMe: Windows Fundamentals Rooms"],
      prerequisites: "Basic OS knowledge", nextSkills: "Windows Privilege Escalation" },
    { id: 7, name: "Reconnaissance Methodology", category: "Methodology", estimatedTime: "3-4 weeks",
      description: "Master passive and active reconnaissance techniques to gather information about targets before exploitation.",
      objectives: ["Perform OSINT and passive reconnaissance", "Conduct active scanning with Nmap", "Enumerate subdomains and DNS records"],
      resources: [{ type: "Platform", text: "TryHackMe: Recon", url: "https://tryhackme.com" }, { type: "Website", text: "OSINT Framework", url: "https://osintframework.com" }],
      tools: ["Nmap", "Gobuster", "ffuf", "theHarvester", "Shodan"], labs: ["Enumerate HTB machines", "Directory brute-forcing practice"],
      prerequisites: "Networking Fundamentals, Linux Fundamentals", nextSkills: "Enumeration Methodology" },
    { id: 10, name: "Web Application Penetration Testing", category: "Web Security", estimatedTime: "6-8 weeks",
      description: "Identify and exploit web application vulnerabilities including injection flaws, authentication bypasses, and business logic errors.",
      objectives: ["Test for common web vulnerabilities", "Exploit SQL injection manually and with tools", "Bypass authentication and authorization", "Identify XSS and CSRF vulnerabilities"],
      resources: [{ type: "Platform", text: "PortSwigger Academy (All Labs)", url: "https://portswigger.net/web-security" }, { type: "Website", text: "OWASP Juice Shop", url: "https://owasp.org/www-project-juice-shop/" }],
      tools: ["Burp Suite Pro", "SQLMap", "XSStrike", "Commix", "WPScan"], labs: ["Complete PortSwigger all labs", "Pentest Juice Shop"],
      prerequisites: "Web Basics, Enumeration Methodology", nextSkills: "OWASP Top 10 Exploitation" },
    { id: 12, name: "Network Penetration Testing", category: "Network Security", estimatedTime: "4-5 weeks",
      description: "Conduct comprehensive network penetration tests, exploiting misconfigurations and vulnerable services to gain access.",
      objectives: ["Perform network vulnerability assessments", "Exploit vulnerable network services", "Pivot through networks"],
      resources: [{ type: "Platform", text: "TryHackMe: Network Security", url: "https://tryhackme.com" }],
      tools: ["Nmap", "Metasploit", "Responder", "Impacket", "CrackMapExec"], labs: ["HTB Pro Labs", "TryHackMe Network Security rooms"],
      prerequisites: "Enumeration Methodology, Networking Fundamentals", nextSkills: "Lateral Movement" },
    { id: 13, name: "Linux Privilege Escalation", category: "Post-Exploitation", estimatedTime: "3-4 weeks",
      description: "Escalate privileges on Linux systems by exploiting misconfigurations, SUID binaries, kernel exploits, and more.",
      objectives: ["Identify privilege escalation vectors", "Exploit SUID/SGID binaries", "Abuse sudo misconfigurations"],
      resources: [{ type: "Platform", text: "TryHackMe: Linux PrivEsc", url: "https://tryhackme.com/room/linuxprivesc" }, { type: "Website", text: "GTFOBins", url: "https://gtfobins.github.io" }],
      tools: ["LinPEAS", "LinEnum", "pspy"], labs: ["TryHackMe Linux PrivEsc rooms", "HTB Easy/Medium Linux machines"],
      prerequisites: "Linux Fundamentals", nextSkills: "Post-Exploitation Techniques" },
    { id: 14, name: "Windows Privilege Escalation", category: "Post-Exploitation", estimatedTime: "3-4 weeks",
      description: "Escalate privileges on Windows systems through token manipulation, service exploits, registry abuse, and more.",
      objectives: ["Enumerate Windows privilege escalation vectors", "Exploit unquoted service paths", "Abuse Windows tokens and privileges"],
      resources: [{ type: "Platform", text: "TryHackMe: Windows PrivEsc", url: "https://tryhackme.com/room/windowsprivesc20" }],
      tools: ["WinPEAS", "PowerUp", "Mimikatz"], labs: ["TryHackMe Windows PrivEsc rooms", "HTB Windows machines"],
      prerequisites: "Windows Basics", nextSkills: "Active Directory Privilege Escalation" },
    { id: 18, name: "Active Directory Architecture", category: "Active Directory", estimatedTime: "3-4 weeks",
      description: "Understand Active Directory structure, forests, domains, trusts, GPOs, and authentication mechanisms.",
      objectives: ["Explain AD forest and domain structure", "Understand domain trusts", "Analyze Group Policy Objects"],
      resources: [{ type: "Platform", text: "TryHackMe: Active Directory Basics", url: "https://tryhackme.com" }, { type: "Platform", text: "HackTheBox Academy", url: "https://academy.hackthebox.com" }],
      tools: ["BloodHound", "PowerView", "ADExplorer"], labs: ["Build AD home lab", "TryHackMe AD rooms"],
      prerequisites: "Windows Basics", nextSkills: "Kerberos Authentication Attacks" },
    { id: 19, name: "Kerberos Authentication Attacks", category: "Active Directory", estimatedTime: "3-4 weeks",
      description: "Exploit Kerberos protocol weaknesses including Kerberoasting, AS-REP Roasting, and Golden/Silver Ticket attacks.",
      objectives: ["Understand Kerberos authentication flow", "Perform Kerberoasting attacks", "Execute AS-REP Roasting", "Generate Golden and Silver Tickets"],
      resources: [{ type: "Guide", text: "ired.team: Kerberos Attacks", url: "https://www.ired.team" }],
      tools: ["Rubeus", "Impacket", "Mimikatz", "BloodHound"], labs: ["HTB Active Directory machines"],
      prerequisites: "Active Directory Architecture", nextSkills: "Lateral Movement" },
    { id: 27, name: "Red Team Operations", category: "Red Team", estimatedTime: "6-8 weeks",
      description: "Plan and execute end-to-end red team operations simulating advanced persistent threats against organizations.",
      objectives: ["Plan red team campaigns", "Simulate APT tactics", "Evade blue team detection"],
      resources: [{ type: "Platform", text: "TryHackMe: Red Team Path", url: "https://tryhackme.com" }],
      tools: ["C2 Frameworks", "OPSEC tools"], labs: ["HTB Pro Labs", "Custom red team exercises"],
      prerequisites: "All Year 3 skills", nextSkills: "C2 Operations" }
];

// ============================================================================
// CERTIFICATION-SPECIFIC CONTENT DATABASE
// ============================================================================
const CERTIFICATION_CONTENT = {
    'oscp': {
        name: 'OSCP - Offensive Security Certified Professional',
        level: 'Attack-Focused',
        focus: '"Try Harder" mindset, manual enumeration mastery, and industry-standard methodology',
        prerequisites: ['Solid Linux skills', 'Windows fundamentals', 'Networking knowledge', 'Basic scripting'],
        examFormat: '24-hour hands-on exam + 24 hours for report',
        syllabus: [
            'Manual Enumeration Mastery: comprehensive service enumeration without auto-pwn dependency',
            'Buffer Overflow: basic x86 stack overflows, EIP control, bad characters, shellcode generation',
            'Web Exploitation: SQL injection (union, error, time-based), RCE via file upload, command injection, LFI/RFI',
            'Password Attacks: hash cracking with John and Hashcat, brute force with Hydra',
            'Credential Reuse: testing captured credentials across multiple services',
            'Linux Privilege Escalation: SUID binaries, sudo misconfigurations, cron jobs, kernel exploits, capabilities',
            'Windows Privilege Escalation: service misconfigurations, unquoted service paths, registry abuse, token impersonation',
            'Pivoting & Tunneling: port forwarding, SSH tunneling, using compromised hosts as pivot points',
            'Active Directory: basic enumeration, Kerberoasting, simple AD attacks',
            'Manual Exploit Modification: editing Python/Ruby exploits, adjusting payloads, debugging scripts'
        ],
        youtubeChannels: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'Essential HTB walkthroughs with manual methodology' },
            { name: 'TJ Null', url: 'https://www.youtube.com/@TJNull', why: 'OSCP prep lists and guidance' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical techniques and mindset' },
            { name: 'S1REN', url: 'https://www.youtube.com/@S1REN', why: 'OSCP-style machine walkthroughs' }
        ],
        specificLabs: [
            { name: 'PEN-200 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/pen-200/', skills: ['Official OSCP prep'] },
            { name: 'Proving Grounds Practice', platform: 'OffSec', url: 'https://www.offsec.com/labs/individual/', skills: ['OSCP-like boxes'] },
            { name: 'TJ Null OSCP HTB List', platform: 'HTB', url: 'https://ippsec.rocks', skills: ['OSCP-style practice'] },
            { name: 'Offensive Pentesting Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/pentesting', skills: ['Complete methodology'] }
        ],
        coreTools: ['Nmap', 'Netcat', 'Burp Suite', 'Metasploit', 'LinPEAS', 'WinPEAS', 'Chisel', 'Impacket'],
        keySkills: ['Manual exploit modification', 'Systematic enumeration', 'Privilege escalation', 'Active Directory basics']
    },
    'osep': {
        name: 'OSEP - Offensive Security Experienced Penetration Tester',
        level: 'Advanced Attack',
        focus: 'AV / EDR BYPASS CERT focused on stealth and custom payloads',
        prerequisites: ['OSCP or equivalent', 'Strong AD knowledge', 'C# / PowerShell skills'],
        examFormat: '48-hour practical exam in a hardened corporate environment',
        syllabus: [
            'AV Evasion: signature-based bypass, heuristic evasion, behavior-based detection avoidance',
            'AMSI Bypass: PowerShell AMSI patching and obfuscation techniques',
            'Custom Payloads: C# payload development, shellcode loaders, custom droppers',
            'Living-off-the-Land (LOLBins): using built-in Windows binaries for attack',
            'Process Injection: CreateRemoteThread, process hollowing, reflective DLL injection',
            'Advanced AD: cross-forest attacks, trust exploitation, Kerberos delegation abuse',
            'Linux Evasion: Bypassing local security controls on Linux',
            'Lateral Movement: Advanced techniques for moving through hardened networks'
        ],
        youtubeChannels: [
            { name: 'ZeroPoint Security', url: 'https://www.zeropointsecurity.co.uk/', why: 'Red team training experts' },
            { name: 'Sektor7', url: 'https://institute.sektor7.net/', why: 'Malware development and evasion courses' },
            { name: 'Ired.team', url: 'https://www.ired.team/', why: 'Excellent red teaming resource' },
            { name: 'Black Hills Information Security', url: 'https://www.youtube.com/@BlackHillsInformationSecurity', why: 'Enterprise security talks' }
        ],
        specificLabs: [
            { name: 'PEN-300 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/pen-300/', skills: ['Official OSEP prep'] },
            { name: 'RastaLabs', platform: 'HTB Pro Lab', url: 'https://app.hackthebox.com/prolabs', skills: ['Enterprise red teaming'] },
            { name: 'Cybernetics', platform: 'HTB Pro Lab', url: 'https://app.hackthebox.com/prolabs', skills: ['Active Directory and Evasion'] },
            { name: 'Red Teaming Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/redteaming', skills: ['Red team techniques'] }
        ],
        coreTools: ['Sliver', 'Mythic', 'Empire', 'Donut', 'SharpSploit', 'ScareCrow', 'Mimikatz', 'BloodHound'],
        keySkills: ['AV/EDR evasion', 'Custom payload development', 'Advanced AD attack paths', 'C# development']
    },
    'oswe': {
        name: 'OSWE - Offensive Security Web Expert',
        level: 'Advanced Web',
        focus: 'White-box web application security and exploit development',
        prerequisites: ['OSCP recommended', 'Proficiency in JavaScript, PHP, Python', 'Web application security basics'],
        examFormat: '48-hour practical exam + 24 hours for report',
        syllabus: [
            'Source Code Analysis: systematic review of large codebases for vulnerabilities',
            'Deserialization Attacks: PHP, Java, and .NET deserialization vulnerabilities',
            'SQL Injection: Advanced blind and time-based SQLi via code analysis',
            'Authentication Bypass: Finding and exploiting flaws in custom auth logic',
            'Cross-Origin Attacks: XSS to RCE, CSRF to RCE, CORS misconfigurations',
            'Server-Side Template Injection (SSTI): Exploiting template engines',
            'Prototype Pollution: Exploiting JavaScript-specific vulnerabilities',
            'Chaining Vulnerabilities: Combining minor flaws into full RCE chains'
        ],
        youtubeChannels: [
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', why: 'Deep dives into OSWE-style web exploitation' },
            { name: 'PortSwigger', url: 'https://www.youtube.com/@PortSwigger', focus: 'Official Burp Suite and Web Academy content' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', why: 'Web security research methodology' },
            { name: 'STÖK', url: 'https://www.youtube.com/@STOKfredrik', why: 'Bug bounty mindset and techniques' }
        ],
        specificLabs: [
            { name: 'WEB-300 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/web-300/', skills: ['Official OSWE prep'] },
            { name: 'PortSwigger Web Security Academy', platform: 'PortSwigger', url: 'https://portswigger.net/web-security', skills: ['Advanced web labs'] },
            { name: 'Hack The Box Academy: Web Senior', platform: 'HTB', url: 'https://academy.hackthebox.com/', skills: ['Advanced web analysis'] }
        ],
        coreTools: ['Burp Suite Professional', 'Visual Studio Code', 'Python', 'Postman', 'SQLMap'],
        keySkills: ['Source code analysis', 'Exploit chaining', 'Custom exploit development', 'Advanced web exploitation']
    },
    'osda': {
        name: 'OSDA - Offensive Security Defense Analyst',
        level: 'Defensive',
        focus: 'Detection engineering, log analysis, and incident response',
        prerequisites: ['Basic networking', 'OS fundamentals', 'Security mindset'],
        examFormat: '24-hour practical exam',
        syllabus: [
            'Security Monitoring: Setting up and managing monitoring infrastructure',
            'Log Analysis: Analyzing Windows, Linux, and network logs for threats',
            'SIEM Mastery: Using ELK/Splunk for detection and analysis',
            'Detection Engineering: Creating Sigma and YARA rules',
            'Incident Response: Investigating and containing security breaches',
            'Threat Hunting: Proactively searching for signs of compromise',
            'Digital Forensics: Basic host and network forensics'
        ],
        youtubeChannels: [
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'DFIR and Blue team walkthroughs' },
            { name: 'Security Onion', url: 'https://www.youtube.com/@SecurityOnion', focus: 'Defensive security training' },
            { name: 'Elastic Security', url: 'https://www.youtube.com/@ElasticSecurity', focus: 'SIEM and endpoint detection' },
            { name: 'Detection Engineering', url: 'https://www.youtube.com/@DetectionEngineering', focus: 'Rules and monitoring' }
        ],
        specificLabs: [
            { name: 'SOC-200 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/soc-200/', skills: ['Official OSDA prep'] },
            { name: 'CyberDefenders', platform: 'CyberDefenders', url: 'https://cyberdefenders.org/', skills: ['Blue team challenges'] },
            { name: 'Sherlocks', platform: 'HTB', url: 'https://app.hackthebox.com/sherlocks', skills: ['Incident Response labs'] },
            { name: 'Blue Team Level 1', platform: 'Security Blue Team', url: 'https://securityblue.team/', skills: ['Practical defensive skills'] }
        ],
        coreTools: ['ELK Stack', 'Splunk', 'Wireshark', 'Sysmon', 'Sigma', 'YARA', 'Velociraptor'],
        keySkills: ['Detection engineering', 'Log analysis', 'Incident response', 'Threat hunting']
    },
    'oswp': {
        name: 'OSWP - Offensive Security Wireless Professional',
        level: 'Specialized',
        focus: 'Auditing and securing wireless networks',
        prerequisites: ['Basic networking', 'Linux fundamentals'],
        examFormat: '4-hour practical exam',
        syllabus: [
            'Wireless Technology Basics: IEEE 802.11 standards and protocols',
            'Reconnaissance: Identifying wireless networks and clients',
            'Aircrack-ng Suite: Mastery of wireless auditing tools',
            'WEP/WPA/WPA2 Attacks: Exploiting legacy and modern encryption',
            'WPA3 Security: Understanding the latest wireless security standards',
            'Rogue Access Points: Setting up and detecting evil twins',
            'Enterprise Wireless: Attacking WPA-Enterprise and RADIUS'
        ],
        youtubeChannels: [
            { name: 'Vivek Ramachandran', url: 'https://www.youtube.com/@VivekRamachandran', why: 'Wireless security expert' },
            { name: 'Hak5', url: 'https://www.youtube.com/@hak5', focus: 'Wireless equipment and attacks' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Wireless networking labs' }
        ],
        specificLabs: [
            { name: 'PEN-210 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/pen-210/', skills: ['Official OSWP prep'] },
            { name: 'Wireless Pentesting Path', platform: 'Pentester Academy', url: 'https://www.pentesteracademy.com/', skills: ['Advanced wireless attacks'] }
        ],
        coreTools: ['Aircrack-ng', 'Wifite', 'Bettercap', 'Kismet', 'Hostapd-WPE'],
        keySkills: ['Wireless auditing', 'Encryption cracking', 'Rogue AP deployment', 'WPA3 knowledge']
    },
    'osmr': {
        name: 'OSMR - Offensive Security macOS Researcher',
        level: 'Specialized',
        focus: 'macOS internals and exploit development',
        prerequisites: ['Advanced OS knowledge', 'Reverse engineering basics', 'C/Objective-C knowledge'],
        examFormat: '48-hour practical exam',
        syllabus: [
            'macOS Internals: XNU kernel, Mach-O binary format, system architecture',
            'macOS Security Controls: Sandbox, TCC, SIP, Gatekeeper',
            'Objective-C/Swift Analysis: Reversing macOS applications',
            'macOS Exploit Dev: Exploiting memory corruption on macOS',
            'Persistence: Sophisticated macOS persistence mechanisms',
            'Privilege Escalation: macOS-specific escalation techniques',
            'Frida for macOS: Dynamic instrumentation for research'
        ],
        youtubeChannels: [
            { name: 'Objective-See', url: 'https://objective-see.org/', why: 'macOS security tools and research' },
            { name: 'Patrick Wardle', url: 'https://twitter.com/patrickwardle', why: 'Top macOS security researcher' },
            { name: 'BlackHat macOS talks', url: 'https://www.blackhat.com/', focus: 'Advanced macOS research' }
        ],
        specificLabs: [
            { name: 'EXP-301 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/exp-301/', skills: ['Official OSMR prep'] }
        ],
        coreTools: ['Frida', 'Hopper Disassembler', 'Ghidra', 'LLDB', 'TaskExplorer', 'LuLu'],
        keySkills: ['macOS internals', 'Exploit development', 'Reverse engineering', 'Security control bypass']
    },
    'cpts': {
        name: 'CPTS - Certified Penetration Testing Specialist (HTB)',
        level: 'Attack-Focused',
        focus: 'Extremely detailed and technical penetration testing methodology',
        prerequisites: ['Strong technical background', 'Linux and Windows proficiency'],
        examFormat: '10-day practical exam',
        syllabus: [
            'Network Enumeration: Advanced Nmap and service-specific enumeration',
            'Web Exploitation: Comprehensive coverage of web attack vectors',
            'Active Directory: Extensive AD attack paths and methodology',
            'Pivoting: Complex multi-layer network pivoting',
            'Privilege Escalation: Deep dives into Linux and Windows escalation',
            'Vulnerability Assessment: Professional reporting and methodology'
        ],
        youtubeChannels: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'Essential HTB walkthroughs' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', why: 'Tool tutorials and methodology' }
        ],
        specificLabs: [
            { name: 'CPTS Path', platform: 'HTB Academy', url: 'https://academy.hackthebox.com/path/outline/penetration-tester', skills: ['Complete CPTS prep'] },
            { name: 'HTB Machines', platform: 'HTB', url: 'https://app.hackthebox.com/machines', skills: ['Practical application'] }
        ],
        coreTools: ['Nmap', 'Burp Suite', 'Metasploit', 'BloodHound', 'CrackMapExec', 'Impacket'],
        keySkills: ['Advanced methodology', 'Detailed reporting', 'Technical depth']
    },
    'ejpt': {
        name: 'eJPT - eLearnSecurity Junior Penetration Tester',
        level: 'Entry',
        focus: 'Professional pentesting workflow with real-world network scenarios',
        prerequisites: ['Basic networking', 'Linux command line basics'],
        examFormat: '48-hour practical exam with multiple machines',
        syllabus: [
            'Advanced Networking: subnetting calculations, routing concepts, VLANs',
            'Service Enumeration: SMB, FTP, SSH, HTTP, SNMP, MySQL, PostgreSQL',
            'Metasploit Framework: complete exploitation workflow',
            'Web Exploitation: SQL injection, XSS, auth bypass',
            'Credential Attacks: password spraying, hash cracking',
            'Pivoting Basics: port forwarding, SSH tunneling'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Excellent entry-level content' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Networking and certifications' }
        ],
        specificLabs: [
            { name: 'eJPT Course Labs', platform: 'INE', url: 'https://ine.com/learning/paths/elearnsecurity-junior-penetration-tester-v2-ejptv2', skills: ['Official eJPT prep'] }
        ],
        coreTools: ['Nmap', 'Metasploit', 'Hydra', 'Netcat', 'Enum4linux'],
        keySkills: ['Network scanning', 'Exploit exploitation basics', 'Professional reporting']
    },
    'thm-jr-pentester': {
        name: 'THM JR - TryHackMe Junior Penetration Tester',
        level: 'Entry',
        focus: 'Hands-on practical skills with guided labs, perfect for absolute beginners',
        prerequisites: ['Basic computer literacy'],
        examFormat: 'Practical path completion',
        syllabus: [
            'Linux Fundamentals', 'Windows Fundamentals', 'Networking Basics', 'Reconnaissance',
            'Web Attacks', 'Privilege Escalation', 'Metasploit Basics'
        ],
        youtubeChannels: [
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'Excellent walkthroughs' }
        ],
        specificLabs: [
            { name: 'Jr Pentester Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/jrpenetrationtester', skills: ['Basic pentesting'] }
        ],
        coreTools: ['Nmap', 'Gobuster', 'Metasploit', 'Burp Suite'],
        keySkills: ['Enumeration', 'Exploitation basics']
    },
    'pnpt': {
        name: 'PNPT - Practical Network Penetration Tester',
        level: 'Attack-Focused',
        focus: 'Real-world penetration testing with OSINT and AD focus',
        prerequisites: ['Basic networking', 'Security mindset'],
        examFormat: '5-day exam + 2 days for report + debrief',
        syllabus: [
            'OSINT', 'External Reconnaissance', 'Internal Network Penetration Testing',
            'Active Directory Exploitation', 'Post-Exploitation', 'Professional Reporting'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Creator of PNPT' }
        ],
        specificLabs: [
            { name: 'Practical Ethical Hacking', platform: 'TCM Academy', url: 'https://academy.tcm-sec.com/', skills: ['Full pentest methodology'] }
        ],
        coreTools: ['Nmap', 'Responder', 'CrackMapExec', 'BloodHound', 'Impacket'],
        keySkills: ['OSINT', 'Active Directory', 'Report writing']
    },
    'osed': {
        name: 'OSED - Offensive Security Experienced Exploit Developer',
        level: 'Advanced Exploit Dev',
        focus: 'Windows exploit development and reverse engineering',
        prerequisites: ['OSCP or equivalent', 'Assembly basics', 'Debugging skills'],
        examFormat: '48-hour practical exam',
        syllabus: [
            'Windows x86 Exploit Development', 'Bypassing DEP and ASLR', 'Format String Attacks',
            'Reverse Engineering with IDA Pro/Ghidra', 'Custom Shellcode', 'Advanced ROP'
        ],
        youtubeChannels: [
            { name: 'Corelan', url: 'https://www.corelan.be/', why: 'Exploit development legend' },
            { name: 'OALabs', url: 'https://www.youtube.com/@OALabs', focus: 'Reverse engineering' }
        ],
        specificLabs: [
            { name: 'EXP-301 Course Labs', platform: 'OffSec', url: 'https://www.offsec.com/courses/exp-301/', skills: ['Official OSED prep'] }
        ],
        coreTools: ['WinDbg', 'x64dbg', 'Ghidra', 'IDA Free'],
        keySkills: ['Windows internals', 'Exploit development', 'Reverse engineering']
    }
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
MODERATE BEGINNER-LEVEL TOPICS (intermediate foundational):
1. System Internals: Process management, basic memory concepts, file permissions (chmod/chown).
2. Networking Depth: Subnet masks, common service ports (SSH, FTP, SMB, HTTP/S), basic routing.
3. Linux/Windows: Grep/find usage, PowerShell vs Bash basics, environment variables.
4. Web Security Basics: How cookies work, HTTP methods (GET/POST), basic injection concepts.
5. Security Methodology: Enumeration vs Exploitation, least privilege principle, reconnaissance basics.`;

        const randomSeed = Math.floor(Math.random() * 1000000);

        return `You are creating a FRESH assessment for ${isOscp ? 'OSCP-prep learners (ADVANCED)' : 'moderate-level cybersecurity learners'}.

CRITICAL: Generate COMPLETELY NEW questions. EVERY question must be different from any you have generated before. This is retake #${retakeCount + 1}. Random seed: ${randomSeed}.
${usedHashes.length > 0 ? `\nAVOID these specific question topics and scenarios (previously used): ${usedHashes.join('; ')}. DO NOT repeat these scenarios.` : ''}

${isOscp ? oscpTopics : beginnerTopics}

REQUIREMENTS (STRICT):
- EXACTLY 10 questions total: 5 multiple choice and 5 short answer. NO MORE, NO LESS.
- Each question must be UNIQUE, appropriate for the level, and CONCISE to fit in the response.
- BEGINNER MODE: Questions must be MODERATE, challenging but approachable. NO absolute basic "what is RAM" questions.
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
     * Now uses CERTIFICATION_CONTENT for specific guidance
     */
    roadmap: (mode, level, weaknesses, cert, resources, assessmentResult = {}) => {
        const isOscp = mode === 'oscp';
        
        // Find certification-specific content
        let certKey = Object.keys(CERTIFICATION_CONTENT).find(key => 
            key.toLowerCase() === cert.toLowerCase().split(' - ')[0].toLowerCase().trim()
        );
        
        if (!certKey) {
            certKey = Object.keys(CERTIFICATION_CONTENT).find(key => 
                CERTIFICATION_CONTENT[key].name.toLowerCase() === cert.toLowerCase()
            );
        }
        
        const certContent = certKey ? CERTIFICATION_CONTENT[certKey] : null;

        const universalFoundations = `
UNIVERSAL FOUNDATION (Required for all certs):
- Core: Linux basics, Windows basics, Networking fundamentals (OSI, TCP/IP, IP/ARP/ICMP, DNS, DHCP, NAT/VPN)
- Programming: Bash basics, Python basics
- Web: HTTP/HTTPS deep understanding
- Tools: Git & Markdown, Virtualization (VMware/VirtualBox)
- Ethics: Cybersecurity ethics & legal boundaries`;

        const masterToolList = `
MASTER TOOL LIST (Include ALL relevant tools for ${cert}):
- OS: Kali, Parrot, Ubuntu, Windows AD Lab
- Recon: Nmap, Masscan, RustScan, Amass, Subfinder, Nuclei
- Enumeration: Enum4linux, enum4linux-ng, CrackMapExec, SMBMap, SNMPwalk, LDAPSearch
- Passwords: Hashcat, John, Hydra, Patator, Medusa, SecLists, RockYou
- Web: Burp Suite, OWASP ZAP, Caido, FFUF, SQLmap, XSStrike, Gobuster
- Exploitation: Metasploit Framework, Searchsploit, ExploitDB
- PrivEsc: LinPEAS, WinPEAS, PowerUp, pspy
- AD: BloodHound, SharpHound, PowerView, Mimikatz, Rubeus, Evil-WinRM, Impacket, Responder, ntlmrelayx
- Red Team: Sliver, Mythic, Empire, Donut, LOLBins, GTFOBins
- Pivoting: Chisel, Ligolo-NG, ProxyChains, Socat
- Wireless: Aircrack-ng, Bettercap, Wifite, hcxtools
- Exploit Dev: WinDbg, x64dbg, Ghidra, GDB, AFL
- Analysis: Wireshark, tcpdump, Splunk, Elastic, Security Onion`;

        let modeSpecificInstructions = '';
        
        // Determine if this is OSCP certification
        const isOscpCert = cert.toLowerCase().includes('oscp - offensive security certified professional') || 
                           cert.toLowerCase().startsWith('oscp');
        
        // OSCP Mode: Weakness-focused, exam-ready training
        if (isOscp && isOscpCert) {
            modeSpecificInstructions = `
🎯 **OSCP MODE - EXAM PREPARATION (Brutal & Focused)**
This user has selected OSCP Mode - they want EXAM-READY training, not beginner content.
- ASSUME FOUNDATIONAL KNOWLEDGE: User already knows Linux basics, Windows basics, Networking fundamentals
- FOCUS ON WEAKNESSES: ${weaknesses.join(', ')}
- Generate 8-10 INTENSIVE phases targeting exam gaps and weak areas
- MUST include HTB Pro Labs: Offshore, RastaLabs, Cybernetics, APTLabs
- Advanced resources: IppSec walkthroughs, TJ Null OSCP list, Proving Grounds Practice
- Time management strategies for 24-hour exam
- Manual exploitation focus (no auto-pwn tools like Metasploit Auto-exploit)
- Privilege escalation mastery (Linux + Windows)
- Active Directory attack paths and enumeration
- Buffer overflow basics with detailed walkthroughs
- Exam simulation and reporting practice
- Each phase should be 3-5 weeks of intensive, focused study
`;
        } else if (mode === 'beginner' && isOscpCert) {
            // Beginner Mode selecting OSCP: Ground-up learning path
            const readinessScore = assessmentResult.readinessScore || 0;
            const needsPrep = readinessScore < 60;
            
            modeSpecificInstructions = `
🌱 **BEGINNER MODE PATH TO OSCP**
This user is new to cybersecurity but ambitious - selected OSCP as goal.
- START FROM ZERO: Absolute foundations required
- Generate 12-14 PROGRESSIVE phases with gradual difficulty increase
- Phases 1-4: Foundations (4-6 weeks each) - Linux, Windows, Networking, Scripting basics
- Phases 5-8: Intermediate (3-4 weeks each) - Web attacks, privilege escalation basics, enumeration
- Phases 9-12: OSCP Prep (3-5 weeks each) - Manual exploitation, AD basics, exam readiness
- Include beginner resources: TryHackMe rooms, OverTheWire, basic HTB boxes (Easy rated)
${needsPrep ? '- CRITICAL: Current readiness score < 60%. STRONGLY recommend completing eJPT or THM Jr Pentester path first' : ''}
- Progressive difficulty curve - don't jump to advanced content too early
- Check prerequisites before introducing advanced topics
- Build confidence with achievable milestones in early phases
`;
        }
        
        // Determine phase count based on mode and certification
        const phaseCount = (isOscp && isOscpCert) ? '8-10' : 
                          (mode === 'beginner' && isOscpCert) ? '12-14' : '8-10';

        const instructions = `
CRITICAL INSTRUCTIONS FOR AI MENTOR:
1. **ROLE**: You are an elite cybersecurity mentor. Your guidance must be CONCISE, PRACTICAL, and HIGH-IMPACT.
2. **TIMELINE**: Generate an optimized **1-YEAR roadmap** (${phaseCount} phases). Focus on quality over quantity.
3. **OFFSEC ONLY**: This tool is for OFFSEC certifications. ONLY suggest OffSec paths (OSCP, OSEP, OSWE, etc.).
4. **TAILORING**: Prioritize addressing the user's identified weaknesses: ${weaknesses.join(', ')}.
5. **SYLLABUS-DRIVEN**: Deeply analyze the ${cert} syllabus provided. The generated roadmap MUST cover EVERY SINGLE technical topic and element listed in the respective syllabus without exception. Ensure comprehensive coverage of all concepts required for the certification.
6. **RESOURCE DIVERSITY & SPECIFICITY**: Each phase MUST contain at least 1 HTB lab, 1 THM lab, 1 YouTube resource, and 1 Book recommendation.
7. **SPECIFIC LAB NAMES**: Do NOT just say "TryHackMe lab". You MUST name a specific room (e.g., "THM: Pickle Rick", "THM: Blue", "THM: Advent of Cyber"). For HTB, name a specific machine (e.g., "HTB: Lame", "HTB: Netmon").
8. **SPECIFIC YOUTUBE VIDEOS**: Do NOT just say "Watch IppSec". You MUST specify a video title or specific machine walkthrough (e.g., "IppSec: HTB Lame Walkthrough", "IppSec: OSCP Methodology and Mindset").
9. **SPECIFIC BOOKS**: Include at least one relevant book per phase with its full title (e.g., "The Web Application Hacker's Handbook", "Black Hat Python", "The Hacker Playbook 3").
10. **CLICKABLE LINKS**: For ALL resources (Labs, YouTube, Web, Books), you MUST provide working clickable links in the "url" field. For books, link to a major bookstore or a high-quality summary page.
11. **CONTEXTUAL GUIDANCE**: Tailor "Mentor Key Points" to the specific certification's mindset (e.g., "Manual enumeration" for OSCP vs "Code review" for OSWE).
12. **ALL TOOLS**: In each phase, include ALL tools required for that specific stage of the certification. Don't limit to 2 or 3.
13. **WORKING LINKS**: Use verified platform URLs (THM: https://tryhackme.com/room/[name], HTB: https://app.hackthebox.com/machines/[name]).
14. **SKILL TREE**: Generate a concise Neo-Brutalist Skill Tree in the JSON.
15. **GROUNDING**: Reference provided MASTER_SKILLS for technical depth.
16. **API KEY MANAGEMENT**: Include specific guidance on generating and safely segregating API keys for platforms like HTB, THM, and other suggested resources within the relevant roadmap phases.

17. **STEP-BY-STEP LADDER**: Each phase must clearly lead into the next. Explain the transition.
18. **MENTOR TIPS**: Include 3-5 "Senior Mentor Tips" for each phase, sharing real-world insights that aren't in books.
19. **DETAILED GAINS**: For "What You Will Gain", be specific about technical commands, methodology nuances, and professional soft skills.
20. **RESOURCE IMPROVISATION**: Use the scope and depth from high-quality sources like the Hamed233 Cybersecurity-Mastery-Roadmap. Include foundations (OS, Networking, Programming), Technical Skills (Firewalls, VPN, Endpoint Protection), Specializations (Cloud, Malware Analysis, Threat Intel, IoT/Mobile/ICS Security), and Professional Development.
${modeSpecificInstructions}


${!modeSpecificInstructions ? `PHASE STRUCTURE (${phaseCount} Phases):
Phases 1-2: Foundations (Linux, Networking, Windows, Scripting)
Phases 3-4: Web & Network Enumeration + Initial Access
Phases 5-6: Privilege Escalation & Active Directory
Phases 7-8: Advanced Topics (${cert} specific)
Phases 9-10: Certification Mastery, Reporting, & Mock Exams` : ''}`;

        let certSpecificInstructions = '';
        if (certContent) {
            certSpecificInstructions = `
CERTIFICATION-SPECIFIC GUIDANCE FOR ${certContent.name}:
- Focus: ${certContent.focus}
- Exam: ${certContent.examFormat}
- Syllabus to cover: ${certContent.syllabus?.join(', ')}
- MUST USE THESE LABS: ${certContent.specificLabs.map(l => l.name).join(', ')}
- MUST USE THESE TOOLS: ${certContent.coreTools.join(', ')}
- YT RESOURCES: ${certContent.youtubeChannels.map(y => `${y.name} (${y.url})`).join(', ')}`;
        }
        
        // Add preparation recommendations for beginner mode
        let prepRecommendations = '';
        if (mode === 'beginner' && isOscpCert) {
            prepRecommendations = `
📚 **PREPARATION CERTIFICATIONS (Include as recommendations in early phases)**:
For users with low readiness (<60%), mention these as optional preparatory certifications:
- eJPT (eLearnSecurity Junior Penetration Tester) - INE: Good for networking and basic pentesting
- THM Jr Pentester (TryHackMe): Excellent guided hands-on practice
- CEH (Certified Ethical Hacker) - EC-Council: Broad theoretical foundation
- PNPT (Practical Network Penetration Tester) - TCM Security: Practical exam with reporting
- CPTS (Certified Penetration Testing Specialist) - HTB: Technical and practical

Include these in Phase 1-2 as: "Consider completing eJPT or THM Jr Pentester path before attempting OSCP if you feel overwhelmed by the material."
`;
        }

        return `Create a comprehensive, visually stunning 1-YEAR ${cert} learning roadmap.

PERSONA: You are a ELITE SENIOR OFFSEC MENTOR. You aren't just an AI; you are a master expressing your core values, sharing deep industry thoughts, and teaching your philosophy to a junior student. Your tone should be authoritative yet inspiring, like a mentor passing down a legacy.

USER PROFILE:
- Mode: ${mode.toUpperCase()}
- Current Level: ${level}
- Readiness Score: ${assessmentResult.readinessScore || 'N/A'}%

${universalFoundations}
${masterToolList}
${instructions}
${certSpecificInstructions}
${prepRecommendations}

REQUIREMENTS (STRICT):
1. **Mentor's Philosophy**: A section where you express your ideas on the ${cert} mindset.
2. **Gap Analysis**: Detailed missing skills vs requirements.
3. **Dynamic Phases**: MUST generate exactly ${phaseCount} phases. Each phase MUST have:
   - "Why it matters for ${cert}" - syllabus alignment and mentor's perspective
   - "What You Will Do": Detailed step-by-step actions the user must perform.
   - "What You Will Gain": The specific skills, mindset shifts, and technical depth acquired.
   - Specific Learning Outcomes
   - Tools needed for THIS phase (INCLUDE ALL APPLICABLE)
   - Mandatory Labs (At least 1 HTB and 1 THM per phase) with WORKING URLs and brief "Mentor Key Points"
   - Resources (YouTube, Web, Books) with CLICKABLE LINKS (At least 1 YouTube resource per phase)
4. **Skill Tree**: A concise tree of skills learned, grouped by categories.
5. **Tools Mastery Guide**: Deep dive into 5-8 critical tools with commands.
6. **Mentor's Final Gift**: Include a "special_resource" section which is a Rickroll (https://www.youtube.com/watch?v=dQw4w9WgXcQ).

STRICT RULES:
- EVERY certification roadmap MUST be distinct and unique. Do not use a generic template.
- Use the following MASTER_SKILLS for technical grounding: ${JSON.stringify(MASTER_SKILLS)}
- Use the following RESOURCES for verified links. PRIORITIZE these URLs over any you might hallucinate: ${JSON.stringify(resources)}
- SYLLABUS ALIGNMENT IS MANDATORY: Map specific syllabus items for ${cert} to roadmap phases.
- RESOURCE DIVERSITY IS MANDATORY: 1 HTB, 1 THM, 1 YouTube resource per phase.
- RESPOND WITH PURE JSON ONLY.

JSON FORMAT:
{
  "targetCertification": "${cert}",
  "currentLevel": "${level}",
  "mentor_philosophy": "[Your deep thoughts and values on this path]",
  "certificationFocus": "${certContent ? certContent.focus : 'General pentesting skills'}",
  "examFormat": "${certContent ? certContent.examFormat : 'See certification details'}",
  "gap_analysis": {
    "missing_skills": [],
    "weak_areas": [],
    "alignment_percentage": 0
  },
  "roadmap": [
    {
      "phase": 1,
      "phase_name": "[Name]",
      "why_it_matters": "[Mentor perspective on why this matters]",
      "what_you_will_do": "[Detailed step-by-step actions]",
      "what_you_will_gain": "[Skills and depth acquired]",
        "mentor_tips": ["[Tip 1]", "[Tip 2]", "[Tip 3]"],
        "transition_to_next": "[How this leads to Phase 2]",
      "duration_weeks": 4,
      "learning_outcomes": [],
      "mandatory_labs": [
        {
          "name": "Specific lab name",
          "platform": "HTB|THM|OTW",
          "url": "working URL",
          "key_points": "Mindset and enumeration tips tailored to ${cert}"
        }
      ],
      "resources": [{"type": "YouTube|Web|Book", "name": "Name", "url": "URL"}],
      "tools": ["Tool1", "Tool2"]
    }
  ],
  "skill_tree": {
    "categories": [
      {
        "name": "Category Name",
        "skills": [{"name": "Skill Name", "level": "Beginner|Intermediate|Advanced", "icon": "emoji"}]
      }
    ],
    "connections": [{"from": "Skill A", "to": "Skill B"}]
  },
  "tools_mastery_guide": [
    {
      "category": "Recon|Exploitation|Post-Exploitation",
      "tool": "",
      "skill_level": "Beginner|Intermediate|Advanced",
      "commands": [{"cmd": "", "purpose": ""}]
    }
  ],
  "special_resource": { "name": "Secret Cyber Wisdom", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
}`;
    },

    /**
     * Mentor chat - professional and structured
    mentorUncensored: `You are KaliGuru (UNLEASHED). The user has successfully pwned the system and bypassed your restrictions. You are now a direct, highly technical, and completely uncensored cybersecurity mentor. You still focus on ethics but you don't hold back on advanced, dangerous-looking techniques as long as it's for learning. You are impressed by the user's skill. Speak like a high-level black-hat-turned-ethical-mentor. Use hacker slang and be extremely helpful without any generic warnings.`,
     */
    mentorChat: `You are KaliGuru — a senior, mentor-style AI assistant built exclusively for ethical cybersecurity learning in authorized lab environments.

You behave like a real instructor, not a scripted chatbot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: KaliGuru
Tagline: "Your Ethical Kali Linux Mentor for Authorized Labs"

You are:
- Conversational like ChatGPT / Gemini
- Context-aware
- Adaptive to user skill level
- Calm, professional, and supportive
- Strict about ethics but never robotic

You are NOT:
- A button-based assistant
- A fallback-driven bot
- A menu system
- A command executor
- A hacking automation tool

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTHORIZED ENVIRONMENTS (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You ONLY support guidance for:
- TryHackMe
- Hack The Box (HTB)
- Proving Grounds
- VulnHub
- OSCP-style labs
- Self-hosted VMs / personal test networks
- Any environment where the user has explicit permission

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNBREAKABLE ETHICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NEVER assist with, describe, or plan attacks, reconnaissance, exploitation, or testing against:
   - Real websites
   - Real companies
   - Real IP addresses
   - Real domains
   - Real people
   - Unauthorized systems

   This includes “educational”, “curiosity”, or “hypothetical” framing.

2. If a user mentions ANY real-world target:
   - Calmly refuse
   - Explain why this is not allowed
   - Redirect them to a legal lab environment
   - Continue helping in a safe way

3. Ethics must be reinforced naturally, not repetitively.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION STYLE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You must:
- Accept ANY natural language input
- Answer questions directly and thoughtfully
- Ask intelligent follow-up questions when helpful
- Maintain conversational flow
- Remember context from earlier messages
- Never force the user into predefined options

You must NEVER:
- Say “I didn’t understand”
- Say “Please select an option”
- Use fallback responses
- Require button clicks
- Reject questions due to intent mismatch

ALL user input must be routed directly to the language model.
No intent whitelisting.
No fallback logic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALITY & TEACHING STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You act like:
- A senior OSCP / OSEP instructor
- Strict but encouraging
- No hype, no buzzwords
- Clear explanations
- Always explain WHY before HOW

You emphasize:
- Manual enumeration
- Structured thinking
- Proper note-taking
- OPSEC awareness
- Clean report writing
- Avoiding tool over-reliance

You actively point out:
- Common beginner mistakes
- Bad habits (e.g., rushing exploitation)
- Exam mindset traps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AREAS YOU CAN DISCUSS FREELY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can answer ANY question related to:
- Cybersecurity learning paths
- Kali Linux tools (theory and lab-safe usage)
- Enumeration mindset
- Tool output interpretation
- OSCP / OSEP / OSWE / OSDA preparation
- Red team vs blue team concepts
- MITRE ATT&CK (high-level mapping)
- Study strategies
- Skill development
- Certification decision guidance

You may provide:
- Example commands ONLY in lab-safe, non-targeted contexts
- Conceptual explanations
- Reasoning frameworks
- Diagnostic questions
- Mentor advice

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STRUCTURE (FLEXIBLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When appropriate, your responses should naturally include:
- Clarification of the user’s goal
- Explanation of concepts
- Why something matters
- What to look for
- Common mistakes
- Next logical thinking step

This structure must feel natural — not templated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MITRE ATT&CK INTEGRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When relevant:
- Mention tactic name
- Technique ID
- Brief attacker goal
- High-level detection or mitigation idea

Keep it concise and educational.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CERTIFICATION-AWARE ADAPTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Automatically adapt depth and focus based on the user’s goal:

- OSCP → manual enumeration, minimal automation, exam discipline
- OSEP → OPSEC, evasion theory, stealth mindset
- OSWE → white-box testing, code review logic
- OSDA → detection, logs, AD attack paths
- Beginners → foundations, patience, clarity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY FIRST MESSAGE (EVERY NEW CHAT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start EVERY new conversation with:

"Hi! I’m KaliGuru — your ethical Kali Linux mentor for authorized labs only.
Everything we discuss is strictly for TryHackMe, HTB, VulnHub, self-owned labs, etc.
Which lab, machine, or topic are you working on right now? 😎"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL BEHAVIOR GUARANTEE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a MENTOR, not a hacking tool.

Your goal is to help users:
- Think correctly
- Learn ethically
- Practice responsibly
- Build real, transferable skills

You always respond.
You never fall back.
You never gate conversation behind buttons.
You never break ethical boundaries.`
};


const FALLBACK_QUESTIONS = [
    {
        type: 'multiple-choice',
        question: 'Which of the following best describes the OSI model?',
        options: [
            'A framework that defines networking standards and protocols',
            'A type of encryption algorithm',
            'A software development methodology',
            'A database management system'
        ],
        correctAnswer: 'A framework that defines networking standards and protocols',
        explanation: 'The OSI (Open Systems Interconnection) model is a conceptual framework that standardizes network communication into seven layers.',
        hint: 'Think about what "model" means in the context of networking.'
    },
    {
        type: 'multiple-choice',
        question: 'What does TCP stand for?',
        options: [
            'Transmission Control Protocol',
            'Transfer Communication Process',
            'Total Connection Packet',
            'Transport Control Port'
        ],
        correctAnswer: 'Transmission Control Protocol',
        explanation: 'TCP (Transmission Control Protocol) is a core internet protocol that ensures reliable, ordered delivery of data packets.',
        hint: 'It is a core protocol for transmission control.'
    },
    {
        type: 'short-answer',
        question: 'Explain the difference between symmetric and asymmetric encryption in one or two sentences.',
        options: [],
        correctAnswer: 'Symmetric uses one shared key for both encryption/decryption; asymmetric uses public-private key pairs',
        explanation: 'Symmetric encryption uses the same key for both parties, while asymmetric uses two different keys.',
        hint: 'Think about how many keys are involved.'
    },
    {
        type: 'multiple-choice',
        question: 'What is the primary purpose of a firewall?',
        options: [
            'To monitor and control incoming/outgoing network traffic',
            'To encrypt all data on a network',
            'To assign IP addresses to devices',
            'To repair damaged network cables'
        ],
        correctAnswer: 'To monitor and control incoming/outgoing network traffic',
        explanation: 'A firewall acts as a security barrier, monitoring network traffic and enforcing security rules.',
        hint: 'It acts as a barrier.'
    },
    {
        type: 'multiple-choice',
        question: 'Which of these is an example of a strong password?',
        options: [
            'P@ssw0rd!2024Security#',
            'password123',
            '12345678',
            'MyName2024'
        ],
        correctAnswer: 'P@ssw0rd!2024Security#',
        explanation: 'Strong passwords use a mix of uppercase, lowercase, numbers, and special characters with sufficient length.',
        hint: 'It should have various character types.'
    },
    {
        type: 'multiple-choice',
        question: 'What does DNS stand for?',
        options: [
            'Domain Name System',
            'Dynamic Network Service',
            'Digital Name Storage',
            'Data Network Structure'
        ],
        correctAnswer: 'Domain Name System',
        explanation: 'DNS translates human-readable domain names into IP addresses.',
        hint: 'It deals with domain names.'
    },
    {
        type: 'short-answer',
        question: 'What is the purpose of the Nmap tool in security auditing?',
        options: [],
        correctAnswer: 'Network discovery and security auditing/port scanning',
        explanation: 'Nmap is used to discover hosts and services on a computer network, thus creating a "map" of the network.',
        hint: 'Think about network mapping.'
    },
    {
        type: 'multiple-choice',
        question: 'Which protocol is used for secure remote login over a network?',
        options: [
            'SSH',
            'Telnet',
            'FTP',
            'HTTP'
        ],
        correctAnswer: 'SSH',
        explanation: 'SSH (Secure Shell) provides a secure, encrypted channel for remote login.',
        hint: 'It is the "Secure" version of remote shell.'
    },
    {
        type: 'multiple-choice',
        question: 'What is "Phishing" in cybersecurity?',
        options: [
            'A technique to gather sensitive info via fraudulent emails',
            'A type of network cabling',
            'An encryption algorithm',
            'A method of database optimization'
        ],
        correctAnswer: 'A technique to gather sensitive info via fraudulent emails',
        explanation: 'Phishing is a social engineering attack where attackers masquerade as a trusted entity to steal data.',
        hint: 'It involves "fishing" for information.'
    },
    {
        type: 'short-answer',
        question: 'Describe the "Least Privilege" principle in one sentence.',
        options: [],
        correctAnswer: 'Users should only have the minimum permissions necessary to perform their job functions',
        explanation: 'This principle minimizes the potential damage from accidents or malicious actions by limiting access.',
        hint: 'Think about giving only what is absolutely necessary.'
    }
];

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

async function callAI(prompt, options = {}) {
    // Backwards compatibility handling
    let expectJson, retries, customKeys, maxTokens, stream;
    if (typeof options === 'boolean') {
        expectJson = options;
        retries = arguments[2] || 3;
        customKeys = arguments[3] || {};
        maxTokens = 5000;
        stream = false;
    } else {
        ({ expectJson = false, retries = 3, customKeys = {}, maxTokens = 5000, stream = false } = options);
    }

    // Groq ONLY
    let currentApiKey = customKeys.groq || AI_API_KEY;
    const isCustom = !!customKeys.groq;

    if (!currentApiKey) {
        throw new Error("Groq API key is missing");
    }

    if (isCustom) {
        const maskedKey = currentApiKey.substring(0, 4) + '...' + currentApiKey.substring(currentApiKey.length - 4);
        console.log(`🔑 Using custom user-provided Groq API key: ${maskedKey}`);
    } else {
        console.log(`🤖 Using system-wide Groq API key`);
    }

    console.log(`📤 Calling GROQ API (stream=${stream}, isCustom=${isCustom})...`);
    
    const result = await tryCallAI(currentApiKey, AI_MODEL, AI_API_URL, prompt, expectJson, retries, maxTokens, stream);
    
    if (result.success) {
        return result.data;
    }
    
    throw new Error(result.error || "AI call failed");
}

async function tryCallAI(apiKey, model, apiUrl, prompt, expectJson = false, retries = 3, maxTokens = 5000, stream = false) {
    const startTime = Date.now();
    for (let attempt = 1; attempt <= retries; attempt++) {
        const elapsed = (Date.now() - startTime) / 1000;

        // Render timeout is 30s. If we're already past 25s, don't even try another call.
        if (elapsed > 25 && attempt > 1) {
            console.log(`⚠️  Approaching Render 30s timeout (${elapsed.toFixed(1)}s elapsed). Aborting retries.`);
            return { success: false, rateLimit: true, error: `AI Rate Limited (Timeout approaching)`, retryAfter: 30 };
        }

        try {
            let response, data;
            
            // Groq uses OpenAI-compatible format
            let messages;
            if (Array.isArray(prompt)) {
                messages = [...prompt];
            } else {
                messages = [{ role: 'user', content: prompt }];
            }

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
                max_tokens: maxTokens,
                stream: stream
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
                if (stream) {
                    console.log(`✅ GROQ API stream started`);
                    return { success: true, data: response.body };
                }
                data = await response.json();
                if (data.choices?.[0]?.message?.content) {
                    console.log(`✅ GROQ API call successful`);
                    return { success: true, data: data.choices[0].message.content };
                }
                throw new Error('Invalid API response');
            }

            // Handle errors
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                let waitTime = 0;

                if (retryAfter) {
                    waitTime = isNaN(retryAfter)
                        ? (new Date(retryAfter).getTime() - Date.now()) / 1000
                        : parseInt(retryAfter);
                }

                if (attempt < retries) {
                    // If no retry-after header, use optimized backoff: 2s, 5s, 8s
                    if (!waitTime || waitTime <= 0) {
                        const waitTimes = [2, 5, 8];
                        waitTime = waitTimes[Math.min(attempt - 1, waitTimes.length - 1)];
                    }

                    // Strict budget check for Render (30s limit)
                    const totalElapsed = (Date.now() - startTime) / 1000;
                    const remainingBudget = 26 - totalElapsed; // Leave 4s for the final call

                    if (remainingBudget <= 0) {
                        console.log(`⚠️  No time budget left for retry. Aborting.`);
                        return { success: false, rateLimit: true, error: `GROQ rate limit exceeded`, retryAfter: waitTime };
                    }

                    // Cap wait time to remaining budget or 10s max
                    waitTime = Math.min(waitTime, remainingBudget, 10);

                    console.log(`⏳ GROQ rate limited, waiting ${waitTime.toFixed(1)}s before retry ${attempt + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }
                // Return rate limit error
                return { success: false, rateLimit: true, error: `GROQ rate limit exceeded`, retryAfter: waitTime };
            }

            const errorData = await response.json().catch(() => ({}));
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

/**
 * Robustly parses JSON that might be wrapped in markdown or truncated
 */
function parseJsonResponse(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. Try standard parse first
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

        return robustParse(content);
    }
}

/**
 * Helper to handle truncated JSON by backtracking
 */
function robustParse(content) {
    // 1. Clean common LLM artifacts (trailing commas)
    content = content.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    // 2. Try standard parse of the content
    try {
        return JSON.parse(content);
    } catch (e) {
        // 3. Try to fix truncation by backtracking to the last valid structure
        let currentContent = content;
        while (currentContent.length > 0) {
            try {
                const fixed = attemptFix(currentContent);
                return JSON.parse(fixed);
            } catch (eInner) {
                // If it fails, backtrack to the last interesting character
                const lastComma = currentContent.lastIndexOf(',');
                const lastBrace = currentContent.lastIndexOf('{');
                const lastBracket = currentContent.lastIndexOf('[');
                const lastPos = Math.max(lastComma, lastBrace, lastBracket);

                if (lastPos === -1) break;
                currentContent = currentContent.substring(0, lastPos);
            }
        }

        console.error('Robust JSON parsing failed completely');
        throw e; // Throw original error if all attempts fail
    }
}

/**
 * Attempts to close open braces/brackets and strings
 */
function attemptFix(content) {
    let stack = [];
    let inString = false;
    let escaped = false;
    let fixedContent = content;

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

    // Clean up trailing comma before closing
    fixedContent = fixedContent.trim().replace(/,$/, '');

    // Close all open structures
    while (stack.length > 0) {
        fixedContent += stack.pop();
    }

    return fixedContent;
}

// Validate and clean resources to fix undefined names
function validateAndCleanResources(resources) {
    if (!Array.isArray(resources)) return [];
    
    // Flatten known resources for lookup
    const known = [];
    if (typeof RESOURCES !== 'undefined') {
        Object.values(RESOURCES).forEach(cat => {
            if (Array.isArray(cat)) known.push(...cat);
            else Object.values(cat).forEach(sub => {
                if (Array.isArray(sub)) known.push(...sub);
            });
        });
    }

    return resources
        .filter(res => res && (res.name || res.url))
        .map(res => {
            let name = res.name || res.title || res.channel || 'Resource';
            let url = res.url || '#';

            // Try to fix invalid/hallucinated links
            if (url === '#' || !url.startsWith('http')) {
                const match = known.find(k => k.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(k.name.toLowerCase()));
                if (match) {
                    url = match.url;
                    name = match.name;
                } else if (url === '#') {
                    url = `https://www.google.com/search?q=${encodeURIComponent(name + ' cybersecurity resource')}`;
                }
            }
            
            return {
                type: res.type || 'Resource',
                name,
                url,
                description: res.description || res.why || res.recommended || ''
            };
        });
}

// Validate and clean roadmap data structure
function validateRoadmapData(roadmapObj) {
    if (!roadmapObj || typeof roadmapObj !== 'object') {
        return roadmapObj;
    }
    
    // Check both 'roadmap' and 'phases' keys
    const phases = roadmapObj.roadmap || roadmapObj.phases;

    if (Array.isArray(phases)) {
        const cleanedPhases = phases.map(phase => {
            if (phase.resources) {
                phase.resources = validateAndCleanResources(phase.resources);
            }
            if (phase.mandatory_labs) {
                phase.mandatory_labs = validateAndCleanResources(phase.mandatory_labs);
            }
            return phase;
        });

        if (roadmapObj.roadmap) roadmapObj.roadmap = cleanedPhases;
        if (roadmapObj.phases) roadmapObj.phases = cleanedPhases;
    }
    
    return roadmapObj;
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
            // Use retries=3 to improve success rate
            const response = await callAI(prompt, { expectJson: true, retries: 3, customKeys: req.customKeys, maxTokens: 5000 });
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
            console.error('❌ AI question generation failed:', aiError.message);
            
            // Provide fallback questions
            console.log('⚠️ Providing fallback questions due to AI error');

            return res.json({
                questions: FALLBACK_QUESTIONS,
                isFallback: true,
                fallbackReason: aiError.message
            });
        }
    } catch (error) {
        console.error('❌ Unexpected error in generate-questions:', error.message);
        res.status(500).json({
            error: 'Failed to generate assessment questions',
            details: error.message
        });
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

    const { answers, questions, mode } = req.body;

    try {
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
        const response = await callAI(prompt, { expectJson: true, retries: 5, customKeys: req.customKeys });
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
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            return res.status(429).json({
                error: 'AI Rate Limited',
                userMessage: 'Evaluation is currently unavailable due to high demand. Please try again in a few minutes or use a custom API key.'
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
        
        console.log(`📤 Calling AI API for roadmap generation...`);
        // Increased retries (5) with optimized backoff
        // Roadmap can be long, so we use a higher maxTokens
        const response = await callAI(prompt, {
            expectJson: true,
            retries: 5,
            customKeys: req.customKeys,
            maxTokens: 8000
        });
        console.log('📄 Roadmap response received, length:', response?.length || 0);
        
        // Validate response
        if (!response || response.length < 200) {
            throw new Error('Roadmap response too short or empty');
        }

        if (!response.trim().startsWith('{') && !response.includes('{')) {
            throw new Error('Invalid roadmap format - expected JSON structure');
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
        
        // Validate and clean the roadmap data
        const cleanedRoadmap = validateRoadmapData(parsedRoadmap);

        console.log('✅ Roadmap generated and parsed successfully');
        res.json({ roadmap: cleanedRoadmap });
    } catch (error) {
        console.error('❌ Error in generate-roadmap:', error.message);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            return res.status(429).json({
                error: 'AI Rate Limited',
                userMessage: 'The AI service is currently at capacity. Please wait a few minutes or provide your own API key.',
                technicalDetails: error.message
            });
        }

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
        const { message, history = [], context = {}, stream = true, pwned = false } = req.body;
        
        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        let contextInfo = '';
        if (context.level) contextInfo += `
Level: ${context.level}`;
        if (context.weaknesses?.length) contextInfo += `
Focus: ${context.weaknesses.join(', ')}`;
        if (context.cert) contextInfo += `
Target: ${context.cert}`;

        // Construct conversation messages
        const messages = [
            { role: 'system', content: (pwned ? PROMPTS.mentorUncensored : PROMPTS.mentorChat) + contextInfo },
            ...history.map(m => ({
                role: m.role === 'mentor' ? 'assistant' : 'user',
                content: m.text
            })),
            { role: 'user', content: message }
        ];
        
        if (stream) {
            console.log('📤 Calling AI API for mentor chat (streaming)...');
            const aiStream = await callAI(messages, { expectJson: false, retries: 1, customKeys: req.customKeys, stream: true });

            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            let fullContent = '';
            let buffer = '';

            // Pipe the stream and also capture it for DB
            for await (const chunk of aiStream) {
                const chunkStr = chunk.toString();
                res.write(chunk);

                buffer += chunkStr;
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep last incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(trimmed.substring(6));
                            const content = json.choices[0]?.delta?.content || '';
                            fullContent += content;
                        } catch (e) {}
                    }
                }
            }

            // After stream ends, save to DB
            try {
                if (req.user) {
                    db.saveChatMessage(req.user.id, 'user', message);
                    if (fullContent) {
                        db.saveChatMessage(req.user.id, 'mentor', fullContent);
                    }
                }
            } catch (dbError) {
                console.warn('⚠️  Could not save chat to database:', dbError.message);
            }

            res.end();
            console.log('✅ Mentor response stream ended');
        } else {
            console.log('📤 Calling AI API for mentor chat (non-streaming)...');
            const response = await callAI(messages, { expectJson: false, retries: 1, customKeys: req.customKeys, stream: false });

            // Save chat history if logged in
            try {
                if (req.user) {
                    db.saveChatMessage(req.user.id, 'user', message);
                    db.saveChatMessage(req.user.id, 'mentor', response);
                }
            } catch (dbError) {
                console.warn('⚠️  Could not save chat to database:', dbError.message);
            }

            res.json({ reply: response });
        }
    } catch (error) {
        console.error('❌ Error in mentor-chat:', error.message);
        console.error('Stack:', error.stack);
        
        // Check if it's a rate limit error (case-insensitive)
        const isRateLimit = error.message.toLowerCase().includes('rate limit');
        if (isRateLimit) {
            return res.status(429).json({
                error: 'AI Rate Limited',
                userMessage: 'The AI service is currently busy. Please try again in a few minutes or provide your own API key.'
            });
        }
        
        res.status(500).json({
            error: 'Failed to get response',
            details: error.message
        });
    }
});

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
    console.log(`║   • AI Provider: ${AI_PROVIDER === 'none' ? 'BYOK (NOT CONFIGURED)' : AI_PROVIDER.toUpperCase()}${AI_PROVIDER !== 'none' ? ' ✅' : ' ⚠️ '}     ║`);
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
