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
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', focus: 'Pentesting, Practical Ethical Hacking, Career Guidance, Networking, PrivEsc' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', focus: 'Pentesting tutorials, Cyber Security training, Kali Linux tools' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', focus: 'CTFs, Malware Analysis, General Hacking, Scripting' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', focus: 'HackTheBox walkthroughs, advanced methodology, exploitation' },
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', focus: 'Networking fundamentals, IT careers, Linux basics' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', focus: 'Networking, Cisco, Python, Certifications' },
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', focus: 'Binary exploitation, Reverse Engineering, CTFs' },
            { name: 'STÖK', url: 'https://www.youtube.com/@STOKfredrik', focus: 'Bug Bounty, Web Security, Mindset' },
            { name: 'NahamSec', url: 'https://www.youtube.com/@NahamSec', focus: 'Bug Bounty, Web Application Security' },
            { name: 'zSecurity', url: 'https://www.youtube.com/@zSecurity', focus: 'Ethical Hacking, WiFi Security' },
            { name: 'Learn Linux TV', url: 'https://www.youtube.com/@LearnLinuxTV', focus: 'Linux basics, administration' },
            { name: 'Practical Networking', url: 'https://www.youtube.com/@PracticalNetworking', focus: 'Networking fundamentals' },
            { name: 'Corey Schafer', url: 'https://www.youtube.com/@coreyms', focus: 'Python programming' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', focus: 'Web security, Bug Bounty' },
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', focus: 'Web exploitation, OSWE prep' },
            { name: 'S1REN', url: 'https://www.youtube.com/@S1REN', focus: 'OSCP-style machines' },
            { name: 'TCM Security Official', url: 'https://www.youtube.com/@TCMSecurity', focus: 'Official certification training' },
            { name: 'Hak5', url: 'https://www.youtube.com/@hak5', focus: 'Hardware hacking, Wireless security' },
            { name: 'Security Onion', url: 'https://www.youtube.com/@SecurityOnion', focus: 'Defensive security, Blue team' },
            { name: 'Special Link', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', focus: 'Secret Cyber Security Wisdom' }
        ]
    },
    platforms: {
        htb: {
            name: 'Hack The Box (HTB)',
            url: 'https://app.hackthebox.com',
            practiceLabs: ['Starting Point', 'Machines', 'Challenges', 'Endgames', 'Fortresses', 'Pro Labs', 'Battlegrounds', 'CTF', 'Bug Bounty Labs'],
            proLabs: ['Dante', 'Offshore', 'Cybernetics', 'RastaLabs', 'APTLabs', 'Enterprise', 'Zephyr'],
            academyPaths: ['Penetration Tester', 'Bug Bounty Hunter', 'SOC Analyst', 'Incident Responder', 'Defensive Security Analyst', 'Active Directory Penetration Tester', 'Web Application Penetration Tester', 'Cloud Security Specialist', 'Security Engineer'],
            academyModules: ['Getting Started', 'Linux Fundamentals', 'Windows Fundamentals', 'Networking Fundamentals', 'Web Requests', 'Web Attacks', 'Authentication & Authorization', 'Databases', 'Active Directory', 'Pivoting & Tunneling', 'Privilege Escalation', 'Password Attacks', 'Vulnerability Assessment', 'Metasploit Framework', 'Shells & Payloads', 'File Transfers', 'Post-Exploitation', 'Threat Hunting', 'SIEM Fundamentals', 'Malware Analysis', 'Digital Forensics', 'Binary Exploitation', 'Reverse Engineering', 'Cryptography', 'Cloud Security', 'DevOps Security', 'Mobile Security'],
            certs: ['CPTS', 'CWEE', 'CBBH', 'CAPE', 'CDSA']
        },
        thm: {
            name: 'TryHackMe (THM)',
            url: 'https://tryhackme.com',
            practiceLabs: ['Rooms', 'CTF Rooms', 'Boot2Root Rooms', 'Walkthrough Rooms', 'Challenge Rooms'],
            learningPaths: ['Pre Security', 'Introduction to Cyber Security', 'Complete Beginner', 'Jr Penetration Tester', 'Web Fundamentals', 'Offensive Pentesting', 'Red Teaming', 'Blue Teaming', 'Cyber Defense', 'SOC Level 1', 'Security Engineer', 'DevSecOps', 'Cloud Security', 'Threat Intelligence', 'Incident Response', 'Digital Forensics'],
            coreSeries: ['Advent of Cyber', 'OWASP Top 10', 'Red Team Fundamentals', 'Blue Team Fundamentals', 'Cyber Defense Frameworks'],
            domains: ['Linux', 'Windows', 'Networking', 'Web', 'Active Directory', 'Cloud', 'DevOps', 'Mobile', 'OSINT', 'Cryptography', 'Reverse Engineering', 'Binary Exploitation', 'Malware Analysis', 'Digital Forensics', 'Incident Response', 'Threat Detection', 'SIEM'],
            certs: ['eJPT', 'PNPT', 'CEH', 'Security+', 'Blue Team Level 1']
        },
        otw: {
            name: 'OverTheWire (OTW)',
            url: 'https://overthewire.org',
            practiceGames: ['Bandit', 'Leviathan', 'Natas', 'Krypton', 'Narnia', 'Behemoth', 'Utumno', 'Maze', 'Vortex', 'Manpage'],
            structure: ['Levels', 'SSH Access', 'Progressive Difficulty'],
            topics: ['Linux Command Line', 'File Permissions', 'Users & Groups', 'Environment Variables', 'Process Management', 'Networking Basics', 'Manual Enumeration', 'Password Discovery', 'Encoding & Decoding', 'Symmetric Cryptography', 'Asymmetric Cryptography', 'Binary Permissions', 'SUID Exploitation', 'Basic Buffer Overflows', 'Memory Concepts'],
            foundationFor: ['Linux+', 'Network+', 'Security+', 'eJPT']
        },
        pico: {
            name: 'PicoCTF',
            url: 'https://picoctf.org',
            focus: 'Beginner CTF challenges'
        }
    },
    tools: {
        reconnaissance: ['Nmap', 'Masscan', 'Rustscan', 'Amass', 'Subfinder', 'httpx', 'Shodan', 'theHarvester', 'Gobuster', 'ffuf', 'Recon-ng', 'Maltego'],
        webTesting: ['Burp Suite', 'OWASP ZAP', 'Nikto', 'SQLMap', 'wfuzz', 'XSStrike', 'Commix', 'WPScan', 'Postman', 'Dirsearch'],
        exploitation: ['Metasploit', 'searchsploit', 'msfvenom', 'CrackMapExec', 'Impacket', 'Responder', 'Evil-WinRM', 'ExploitDB'],
        passwordAttacks: ['Hashcat', 'John the Ripper', 'Hydra', 'CeWL', 'Crunch', 'LaZagne', 'Medusa', 'Ncrack'],
        postExploitation: ['Mimikatz', 'BloodHound', 'PowerView', 'Rubeus', 'Covenant', 'Ligolo-ng', 'PowerUp', 'Seatbelt', 'WinPEAS', 'LinPEAS', 'SharpUp', 'Watson'],
        c2Frameworks: ['Cobalt Strike', 'Sliver', 'Empire', 'Mythic', 'Havoc', 'Covenant', 'PowerShell Empire'],
        enumeration: ['enum4linux', 'smbclient', 'ldapsearch', 'ADExplorer', 'AzureHound', 'SMBMap', 'RPCClient', 'SNMPwalk'],
        cloud: ['Pacu', 'ScoutSuite', 'Prowler', 'AADInternals', 'ROADtools', 'CloudFox', 'Trivy'],
        wireless: ['Aircrack-ng', 'Wifite', 'Bettercap', 'Kismet', 'Reaver', 'Wash'],
        forensics: ['Volatility', 'Autopsy', 'Wireshark', 'FTK Imager', 'Sysmon', 'Splunk', 'ELK Stack'],
        scripting: ['Python 3', 'Bash', 'PowerShell']
    },
    books: [
        { title: "TCP/IP Illustrated", author: "W. Richard Stevens", focus: "Networking Fundamentals" },
        { title: "Black Hat Python", author: "Justin Seitz", focus: "Python for Hackers" },
        { title: "Red Team Development and Operations", author: "Joe Vest", focus: "Red Teaming Strategy" },
        { title: "Penetration Testing Azure for Ethical Hackers", author: "David Okeyode", focus: "Cloud Security" },
        { title: "Windows Internals", author: "Pavel Yosifovich", focus: "OS Internals" },
        { title: "The Web Application Hacker's Handbook", author: "Dafydd Stuttard", focus: "Web Security" },
        { title: "Practical Malware Analysis", author: "Sikorski & Honig", focus: "Malware Analysis" },
        { title: "The Hacker Playbook 3", author: "Peter Kim", focus: "Red Team Methodology" }
    ],
    reporting: {
        guides: [
            { name: "TCM Security Report Writing Guide", url: "https://tcm-sec.com/report-writing-for-penetration-testers/" },
            { name: "HTB Academy: Report Writing", url: "https://academy.hackthebox.com/module/details/161" }
        ],
        tools: ["Dradis", "PlexTrac", "PwnDoc", "Markdown", "LaTeX"]
    }
};

// ============================================================================
// CERTIFICATION-SPECIFIC CONTENT DATABASE
// ============================================================================
const CERTIFICATION_CONTENT = {
    'thm-jr-pentester': {
        name: 'THM JR - TryHackMe Junior Penetration Tester',
        level: 'Entry',
        focus: 'Hands-on practical skills with guided labs, perfect for absolute beginners',
        prerequisites: ['Basic computer literacy', 'Understanding of how the internet works'],
        examFormat: 'Practical path completion (no proctored exam)',
        syllabus: [
            'Foundations: Linux terminal, Windows CMD/PowerShell, Networking labs',
            'Reconnaissance: Passive (WHOIS, DNS), Active recon, Service enumeration',
            'Tools: Nmap, Gobuster, Nikto, Burp Suite, Metasploit, Hydra, Netcat',
            'Web Attacks: SQLi, XSS, File inclusion, IDOR, Auth bypass',
            'System Attacks: Linux/Windows Privilege Escalation, Password cracking'
        ],
        youtubeChannels: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'Perfect for networking and Linux basics' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Excellent pentesting fundamentals' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'TryHackMe room walkthroughs' }
        ],
        specificLabs: [
            { name: 'Pre Security Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/presecurity', duration: '40 hours' },
            { name: 'Jr Penetration Tester Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/jrpenetrationtester', duration: '56 hours' },
            { name: 'Linux Fundamentals', platform: 'THM', skills: ['Terminal', 'Permissions'] },
            { name: 'Nmap', platform: 'THM', skills: ['Scanning', 'Enumeration'] },
            { name: 'Burp Suite', platform: 'THM', skills: ['Web Proxy', 'Intruder'] }
        ],
        coreTools: ['Nmap', 'Gobuster', 'Nikto', 'Burp Suite', 'Metasploit', 'Hydra', 'Netcat'],
        keySkills: ['Network enumeration', 'Web app basics', 'Linux fundamentals', 'Metasploit basics', 'Privilege escalation intro']
    },
    'ejpt': {
        name: 'eJPT - eLearnSecurity Junior Penetration Tester',
        level: 'Entry',
        focus: 'Professional pentesting workflow with real-world network scenarios',
        prerequisites: ['Basic networking', 'Linux command line basics'],
        examFormat: '48-hour practical exam with multiple machines',
        syllabus: [
            'Networking: Subnetting, Routing, VLANs, Firewalls/IDS',
            'Enumeration: SMB, FTP, SSH, HTTP, SNMP, MySQL/PostgreSQL',
            'Tools: Nmap (advanced), Metasploit, Searchsploit, CrackMapExec, Wireshark',
            'Exploitation: Service exploits, Web exploits, Credential reuse, Pivoting',
            'Reporting: Executive summary, Technical findings, Risk rating'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical Ethical Hacking course' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', why: 'Tool tutorials and methodology' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'Networking and security foundations' }
        ],
        specificLabs: [
            { name: 'INE PTS Learning Path', platform: 'INE', url: 'https://ine.com/learning/paths/penetration-testing-student', duration: '145 hours' },
            { name: 'OverTheWire: Bandit', platform: 'OTW', url: 'https://overthewire.org/wargames/bandit/', levels: '0-34' },
            { name: 'Blue', platform: 'THM', difficulty: 'Easy', skills: ['Windows exploitation', 'EternalBlue'] },
            { name: 'SMB Enumeration', platform: 'THM', skills: ['Enum4linux', 'SMBMap'] }
        ],
        coreTools: ['Nmap', 'Metasploit', 'Searchsploit', 'CrackMapExec', 'Wireshark', 'Burp Suite'],
        keySkills: ['Host and network enumeration', 'Web application attacks', 'System exploitation', 'Pivoting basics', 'Professional reporting']
    },
    'ceh': {
        name: 'CEH - Certified Ethical Hacker',
        level: 'Entry',
        focus: 'Theory-heavy, broad coverage of ethical hacking concepts, good for vocabulary building',
        prerequisites: ['2 years IT experience recommended', 'Networking basics', 'Security concepts'],
        examFormat: '125 multiple-choice questions, 4 hours',
        youtubeChannels: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'CEH exam prep and concepts' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical security concepts' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'Networking and security foundations' }
        ],
        specificLabs: [
            { name: 'TryHackMe: Pre Security Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/presecurity', duration: '40 hours' },
            { name: 'EC-Council iLabs', platform: 'EC-Council', url: 'https://ilabs.eccouncil.org/', type: 'Official' },
            { name: 'OWASP Top 10', platform: 'THM', url: 'https://tryhackme.com/room/owasptop10', skills: ['Web vulnerabilities'] },
            { name: 'Nmap', platform: 'THM', skills: ['Network scanning'] },
            { name: 'Metasploit: Introduction', platform: 'THM', skills: ['Framework basics'] }
        ],
        coreTools: ['Nmap', 'Wireshark', 'Metasploit', 'SQLMap', 'Burp Suite', 'Aircrack-ng', 'John the Ripper', 'Nessus'],
        keySkills: ['Reconnaissance', 'Scanning and enumeration', 'System hacking', 'Malware threats', 'Sniffing', 'Social engineering', 'Web application hacking', 'Wireless security']
    },
    'pnpt': {
        name: 'PNPT - Practical Network Penetration Tester',
        level: 'Attack-Focused',
        focus: 'REAL WORLD RED TEAM TRAINING with heavy Active Directory focus',
        prerequisites: ['Basic pentesting knowledge', 'Linux proficiency', 'Networking fundamentals'],
        examFormat: '5-day practical exam with full report due in 2 days + Live Defense Panel',
        syllabus: [
            'Methodology: Scoping, Rules of Engagement, Client Communication',
            'Active Directory: Kerberos, NTLM, LDAP, GPO, BloodHound paths',
            'Attacks: LLMNR poisoning, Kerberoasting, AS-REP roasting, Golden/Silver tickets',
            'Tools: BloodHound, CrackMapExec, Impacket, Responder, Mimikatz, PowerView',
            'Reporting: Professional pentest report with risk explanations and mitigation'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Created by Heath Adams (TCM founder)' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'AD boxes and advanced methodology' },
            { name: 'TCM Security Official', url: 'https://www.youtube.com/@TCMSecurity', why: 'Official PNPT training insights' }
        ],
        specificLabs: [
            { name: 'Practical Ethical Hacking', platform: 'TCM Academy', url: 'https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course' },
            { name: 'Active Directory Basics', platform: 'THM', url: 'https://tryhackme.com/room/winadbasics' },
            { name: 'Attacktive Directory', platform: 'THM', url: 'https://tryhackme.com/room/attacktivedirectory' },
            { name: 'Forest', platform: 'HTB', difficulty: 'Easy', skills: ['AD enumeration', 'AS-REP Roasting'] },
            { name: 'Active', platform: 'HTB', difficulty: 'Easy', skills: ['Kerberoasting', 'GPP passwords'] }
        ],
        coreTools: ['BloodHound', 'CrackMapExec', 'Impacket', 'Responder', 'Mimikatz', 'PowerView', 'PowerUp'],
        keySkills: ['External/Internal pentesting', 'Active Directory mastery', 'Professional report writing', 'Live defense presentation']
    },
    'oscp': {
        name: 'OSCP - Offensive Security Certified Professional',
        level: 'Attack-Focused',
        focus: '"Try Harder" mindset, manual enumeration mastery, and industry-standard methodology',
        prerequisites: ['Solid Linux skills', 'Windows fundamentals', 'Networking knowledge', 'Basic scripting'],
        examFormat: '24-hour hands-on exam + 24 hours for report',
        syllabus: [
            'Enumeration: Manual enumeration mindset, service versioning',
            'Web Exploitation: SQLi, File inclusion, RCE, Auth bypass',
            'Privilege Escalation: Local Linux/Windows privesc without cheatsheets',
            'Pivoting & Tunneling: Moving through compromised networks',
            'Buffer Overflow: Basic stack-based overflows (theory and practice)'
        ],
        youtubeChannels: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'Essential HTB walkthroughs with manual methodology' },
            { name: 'TJ Null', url: 'https://www.youtube.com/@TJNull', why: 'OSCP prep lists and guidance' },
            { name: 'S1REN', url: 'https://www.youtube.com/@S1REN', why: 'OSCP-style machine walkthroughs' }
        ],
        specificLabs: [
            { name: 'PEN-200 Course Labs', platform: 'OffSec', url: 'https://www.offensive-security.com/pwk-oscp/' },
            { name: 'Proving Grounds Practice', platform: 'OffSec', url: 'https://www.offensive-security.com/labs/individual/' },
            { name: 'TJ Null OSCP HTB List', platform: 'HTB', url: 'https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8' },
            { name: 'Offensive Pentesting Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/pentesting' }
        ],
        coreTools: ['Nmap', 'Netcat', 'Burp Suite', 'Metasploit (limited)', 'LinPEAS', 'WinPEAS', 'Chisel'],
        keySkills: ['Manual exploit modification', 'Time management under pressure', 'Systematic enumeration', 'Privilege escalation']
    },
    'cpts': {
        name: 'CPTS - HTB Certified Penetration Testing Specialist',
        level: 'Attack-Focused',
        focus: 'MOST DETAILED PENTEST COURSE ON EARTH covering wide range of attack vectors',
        prerequisites: ['Strong Linux/Windows skills', 'Web security knowledge', 'AD mastery'],
        examFormat: '10-day intense practical exam with full pentest report',
        syllabus: [
            'Network Attacks: Deep service enumeration, complex exploitation',
            'Active Directory: Kerberos attacks, pivoting, tunneling, BloodHound analysis',
            'Web Attacks: Advanced SQLi, XSS, File inclusion, SSRF, Deserialization',
            'Reporting: Blue-team friendly reporting with risk scoring and evidence mapping',
            'Tools: EVERYTHING OSCP + Empire, Sliver, Covenant, Chisel, Ligolo'
        ],
        youtubeChannels: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'In-depth HTB walkthroughs' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'Detailed exploitation techniques' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', why: 'Bug bounty and web exploitation' }
        ],
        specificLabs: [
            { name: 'Penetration Tester Path', platform: 'HTB Academy', url: 'https://academy.hackthebox.com/path/preview/penetration-tester' },
            { name: 'Dante Pro Lab', platform: 'HTB', url: 'https://app.hackthebox.com/prolabs' },
            { name: 'Pivoting, Tunneling & Port Forwarding', platform: 'HTB Academy' },
            { name: 'Active Directory Enumeration & Attacks', platform: 'HTB Academy' }
        ],
        coreTools: ['Empire', 'Sliver', 'Covenant', 'Chisel', 'Ligolo-NG', 'BloodHound', 'CrackMapExec'],
        keySkills: ['Advanced pivoting', 'Complex web exploitation', 'Enterprise AD attacks', 'Exhaustive reporting']
    },
    'osep': {
        name: 'OSEP - Offensive Security Experienced Penetration Tester',
        level: 'Advanced Attack',
        focus: 'AV / EDR BYPASS CERT focused on stealth and custom payloads',
        prerequisites: ['OSCP or equivalent', 'Strong AD knowledge', 'C# / PowerShell skills'],
        examFormat: '48-hour practical exam in a hardened corporate environment',
        syllabus: [
            'Stealth: Payload obfuscation, AMSI bypass, Living-off-the-land (LOLBins)',
            'Custom Payloads: C# loaders, process injection, DLL hijacking',
            'AV Evasion: Evading modern antivirus and basic EDR solutions',
            'Advanced AD: Cross-forest attacks, Kerberos delegation abuse',
            'Tools: Sliver, Covenant, SharpSploit, Donut, Custom C# tooling'
        ],
        youtubeChannels: [
            { name: 'Ired.team', url: 'https://www.youtube.com/@rastamouse', why: 'Excellent red teaming resource' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'Malware analysis and evasion' },
            { name: 'ZeroPoint Security', url: 'https://www.youtube.com/@ZeroPointSecurity', why: 'Red team training experts' }
        ],
        specificLabs: [
            { name: 'PEN-300 Course Labs', platform: 'OffSec', url: 'https://www.offensive-security.com/pen300-osep/' },
            { name: 'RastaLabs', platform: 'HTB Pro Lab', url: 'https://app.hackthebox.com/prolabs' },
            { name: 'Red Teaming Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/redteaming' }
        ],
        coreTools: ['SharpSploit', 'Donut', 'Sliver', 'ScareCrow', 'Mimikatz', 'BloodHound'],
        keySkills: ['AV/EDR evasion', 'Custom payload development', 'Advanced AD persistence', 'Lateral movement']
    },
    'oswe': {
        name: 'OSWE - Offensive Security Web Expert',
        level: 'Advanced Attack',
        focus: 'WHITE-BOX WEB HACKING through source code review and exploit chaining',
        prerequisites: ['Strong web security knowledge', 'Programming: Python, PHP, Java, Node.js'],
        examFormat: '48-hour exam reviewing and exploiting real web applications',
        syllabus: [
            'Source Code Review: Logic flaw detection, identifying auth bypass',
            'Advanced Web: Deserialization, SSRF chaining, RCE from code',
            'Exploit Chaining: Combining multiple low-severity flaws into RCE',
            'Languages: PHP, Java, JavaScript, Node.js, Python',
            'Tools: Burp Suite (Advanced), Custom Python scripts, Debuggers'
        ],
        youtubeChannels: [
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', why: 'Exceptional OSWE prep and web security labs' },
            { name: 'NahamSec', url: 'https://www.youtube.com/@NahamSec', why: 'Bug bounty and web hacking methodology' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', why: 'Advanced web exploitation concepts' }
        ],
        specificLabs: [
            { name: 'WEB-300 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/awae-oswe/' },
            { name: 'PortSwigger Web Security Academy', platform: 'PortSwigger', url: 'https://portswigger.net/web-security' },
            { name: 'Web Exploitation Advanced', platform: 'HTB Academy' }
        ],
        coreTools: ['Burp Suite Professional', 'Python', 'Debuggers', 'Custom Exploit Scripts'],
        keySkills: ['Source code analysis', 'Exploit development (Python)', 'Complex vulnerability chaining', 'Auth bypass']
    },
    'osda': {
        name: 'OSDA - Offensive Security Defense Analyst',
        level: 'Defense-Focused',
        focus: 'SOC & BLUE TEAM operations with focus on log analysis and threat hunting',
        prerequisites: ['Security fundamentals', 'Log analysis basics', 'Networking knowledge'],
        examFormat: '24-hour practical defense-oriented exam',
        syllabus: [
            'Log Analysis: SIEM usage, alert triage, incident response',
            'Detection Engineering: Sigma rules, YARA, Sysmon configuration',
            'Threat Hunting: Proactive searching for indicators of compromise',
            'Tools: Splunk, Elastic Stack, Sysmon, Sigma rules',
            'Methodology: Thinking like an attacker to defend effectively'
        ],
        youtubeChannels: [
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'IR, log analysis, and malware triage' },
            { name: 'Security Onion', url: 'https://www.youtube.com/@SecurityOnion', why: 'Official defensive security training' },
            { name: 'Blue Team Village', url: 'https://www.youtube.com/@BlueTeamVillage', why: 'Community defensive security content' }
        ],
        specificLabs: [
            { name: 'SOC-200 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/soc200-osda/' },
            { name: 'SOC Level 1 Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/soclevel1' },
            { name: 'Sherlock Challenges', platform: 'HTB', url: 'https://app.hackthebox.com/sherlocks' }
        ],
        coreTools: ['Splunk', 'Elastic', 'Sysmon', 'Sigma Rules', 'Wireshark'],
        keySkills: ['SIEM mastery', 'Log analysis', 'Incident Response', 'Threat hunting', 'Detection engineering']
    },
    'oswp': {
        name: 'OSWP - Offensive Security Wireless Professional',
        level: 'Specialized',
        focus: '802.11 theory and practical wireless attacks (WPA/WPA2, Evil Twin)',
        prerequisites: ['Networking fundamentals', 'Linux proficiency'],
        examFormat: '3 hours 45 minutes practical exam',
        syllabus: [
            'Wireless Theory: 802.11 standards, packet structures',
            'Attacks: WPA/WPA2 cracking, Deauth attacks, Evil Twin',
            'Tools: Aircrack-ng suite, Wifite, Bettercap',
            'Evasion: Bypassing MAC filtering and hidden SSIDs'
        ],
        youtubeChannels: [
            { name: 'Hak5', url: 'https://www.youtube.com/@hak5', why: 'Wireless hacking hardware and techniques' },
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'Wireless networking foundations' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'WiFi security concepts' }
        ],
        specificLabs: [
            { name: 'Wireless Hacking 101', platform: 'THM', url: 'https://tryhackme.com/room/wifihacking101' },
            { name: 'Real Hardware Testing', platform: 'Home Lab', skills: ['Aircrack-ng', 'Alfa Adapters'] }
        ],
        coreTools: ['Aircrack-ng', 'Airmon-ng', 'Airodump-ng', 'Aireplay-ng', 'Bettercap'],
        keySkills: ['Packet capture/analysis', 'Cracking handshakes', 'Deploying rogue APs']
    },
    'osed': {
        name: 'OSED - Offensive Security Exploit Developer',
        level: 'Expert',
        focus: 'Windows exploit development and reverse engineering',
        prerequisites: ['x86 Assembly', 'Debugging skills', 'Python'],
        examFormat: '48-hour exam developing multiple working exploits',
        syllabus: [
            'Assembly: x86 assembly, register manipulation',
            'Overflows: Stack overflows, SEH, ROP chains',
            'Tools: WinDbg, IDA Pro, Ghidra, mona.py',
            'Bypass: DEP and ASLR bypass techniques'
        ],
        youtubeChannels: [
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', why: 'Binary exploitation deep dives' },
            { name: 'OALabs', url: 'https://www.youtube.com/@OALabs', why: 'Reverse engineering and malware analysis' },
            { name: 'FuzzySecurity', url: 'https://www.youtube.com/@FuzzySec', why: 'Classic exploit development guides' }
        ],
        specificLabs: [
            { name: 'Phoenix', platform: 'Exploit Education', url: 'https://exploit.education/phoenix/' },
            { name: 'Narnia', platform: 'OverTheWire', url: 'https://overthewire.org/wargames/narnia/' },
            { name: 'Pwn Machines', platform: 'HTB', skills: ['Binary exploitation'] }
        ],
        coreTools: ['WinDbg', 'x64dbg', 'Immunity Debugger', 'GDB', 'Radare2', 'Ghidra'],
        keySkills: ['Assembly coding', 'Custom shellcode development', 'Exploit chaining']
    },
    'osee': {
        name: 'OSEE - Offensive Security Exploitation Expert',
        level: 'Expert',
        focus: 'Advanced Windows internals and kernel exploitation',
        prerequisites: ['OSED', 'Advanced Assembly', 'OS Internals'],
        examFormat: '72-hour intense exploitation exam',
        syllabus: [
            'Kernel: Kernel exploitation, pool overflows, UAF',
            'Windows Internals: Advanced heap management, memory structures',
            'Custom: Developing custom shellcode for modern mitigations',
            'Expert Tools: WinDbg, IDA Pro, custom fuzzers'
        ],
        youtubeChannels: [
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', why: 'Advanced exploitation techniques' },
            { name: 'Saumil Shah', url: 'https://www.youtube.com/@therealsaumilshah', why: 'Browser and advanced exploitation' }
        ],
        specificLabs: [
            { name: 'Custom Kernel Labs', platform: 'Self-Hosted' },
            { name: 'Modern Binary Exploitation', platform: 'RPISEC', url: 'https://github.com/RPISEC/MBE' }
        ],
        coreTools: ['WinDbg', 'IDA Pro', 'Binary Ninja', 'AFL', 'Visual Studio'],
        keySkills: ['Kernel-mode exploitation', 'Mitigation bypass (modern Windows)', '0-day research mindset']
    },
    'osmr': {
        name: 'OSMR - Offensive Security macOS Researcher',
        level: 'Expert',
        focus: 'macOS internals, XNU kernel, and Objective-C research',
        prerequisites: ['macOS proficiency', 'Reverse engineering', 'C/Objective-C'],
        examFormat: '48-hour macOS exploitation exam',
        syllabus: [
            'macOS Internals: XNU kernel, Mach-O binaries, TCC',
            'Evasion: Sandbox bypass, SIP bypass, code signing',
            'Objective-C: Reversing Objective-C, XPC exploitation',
            'Tools: Hopper, LLDB, Frida, class-dump'
        ],
        youtubeChannels: [
            { name: 'Patrick Wardle', url: 'https://www.youtube.com/@ObjectiveSee', why: 'The leading macOS security researcher' },
            { name: 'BlackHat macOS Talks', url: 'YouTube', why: 'State-of-the-art macOS research' }
        ],
        specificLabs: [
            { name: 'Objective-See Tools', platform: 'Personal Lab' },
            { name: 'macOS Internals Labs', platform: 'OffSec' }
        ],
        coreTools: ['Hopper', 'LLDB', 'Frida', 'Xcode', 'class-dump', 'otool'],
        keySkills: ['macOS kernel research', 'Objective-C reversing', 'XPC security analysis']
    }
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

        const stagesLogic = `
LEARNING STAGES FRAMEWORK:
- Stage 0 (Absolute Zero): OverTheWire Bandit/Leviathan, PicoCTF, THM Pre-Security.
- Stage 1 (Beginner): THM Complete Beginner, HTB Academy Fundamentals, THM JR Pentester.
- Stage 2 (Junior): THM Offensive Pentesting, HTB Academy Pentester Path, eJPT, PortSwigger Academy.
- Stage 3 (Industry Ready): Active Directory (THM/HTB), PNPT, PG Practice.
- Stage 4 (Hardcore): OSCP preparation, Manual exploitation, Time management.
- Stage 5-12 (Advanced): CPTS, OSEP, OSWE, OSDA, OSWP, OSED, OSEE, OSMR.`;

        const masterToolList = `
MASTER TOOL LIST (Select relevant tools based on cert and phase):
- Recon: Nmap, Masscan, RustScan, Enum4linux, Amass, Subfinder
- Passwords: Hashcat, John, Hydra, SecLists
- Web: Burp Suite, OWASP ZAP, Gobuster, FFUF, SQLmap
- Exploitation: Metasploit, Searchsploit, Impacket, Responder
- PrivEsc: LinPEAS, WinPEAS, PowerUp, pspy
- AD: BloodHound, Mimikatz, Rubeus, Evil-WinRM
- Red Team: Sliver, Empire, Donut, LolBins
- Pivoting: Chisel, Ligolo-NG, ProxyChains
- Wireless: Aircrack-ng suite, Bettercap`;

        const beginnerInstructions = `
IMPORTANT INSTRUCTIONS FOR BEGINNER MODE:
- TIMELINE: 1-2 years. Start with STAGE 0 & 1.
- FOUNDATIONS: Include UNIVERSAL FOUNDATION topics.
- STRUCTURE: 8-12 Progressive Phases from zero to hero.
- SYLLABUS: Analyze ${cert} syllabus and map to phases.
- LABS: Mandatory labs from THM, HTB (Starting Point), OverTheWire.`;

        const oscpInstructions = `
IMPORTANT INSTRUCTIONS FOR OSCP MODE:
- TIMELINE: 6 months - 1 year. Focus on STAGE 3 & 4.
- INTENSITY: Brutal & Advanced. High focus on manual exploitation.
- GAPS: Prioritize addressing user weaknesses: ${weaknesses.join(', ')}.
- SYLLABUS: Strictly align with PEN-200.
- LABS: Advanced labs (PG Practice, TJ Null List, HTB Medium/Hard).`;

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

        return `Create a comprehensive, visually stunning ${cert} learning roadmap.

USER PROFILE:
- Mode: ${mode.toUpperCase()}
- Current Level: ${level}
- Readiness Score: ${assessmentResult.readinessScore || 'N/A'}%

${universalFoundations}
${stagesLogic}
${masterToolList}

${isOscp ? oscpInstructions : beginnerInstructions}
${certSpecificInstructions}

REQUIREMENTS:
1. **Gap Analysis**: Detailed missing skills vs requirements.
2. **Dynamic Phases**: (8-12 for Beginner, 4-6 for OSCP). Each must have:
   - "Why it matters for ${cert}"
   - Specific Outcomes & Tools (from Master List)
   - Mandatory Labs (PROVIDE WORKING URLs)
   - Resources (PROVIDE WORKING URLs for YouTube/Docs)
3. **Tools Mastery Guide**: Deep dive into 5-8 critical tools with commands.
4. **Special Resource**: END with "Secret Cyber Wisdom" (Rickroll: https://www.youtube.com/watch?v=dQw4w9WgXcQ)

STRICT RULES:
- Structural analysis of ${cert} syllabus is mandatory.
- Use the following RESOURCES object for verified links: ${JSON.stringify(resources)}
- RESPOND WITH PURE JSON ONLY.

JSON FORMAT:
{
  "targetCertification": "${cert}",
  "currentLevel": "${level}",
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
      "why_it_matters": "[Significance for ${cert}]",
      "duration_weeks": 4,
      "learning_outcomes": [],
      "weekly_breakdown": [{"week": 1, "topics": [], "labs": [], "checkpoint": ""}],
      "mandatory_labs": [{"name": "Specific lab name", "platform": "HTB|THM|OTW", "url": "working URL", "skills": []}],
      "resources": [{"type": "YouTube", "channel": "Channel Name", "url": "Channel URL", "recommended": "Specific playlist or video"}],
      "tools": [{"name": "Tool name", "commands": ["command 1", "command 2"]}],
      "completion_checklist": []
    }
  ],
  "special_resource": {
    "name": "Secret Cyber Wisdom",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  "prerequisite_certs": [
    {"cert": "Cert name", "reason": "", "overlap": "", "gap_it_bridges": ""}
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
                max_tokens: 4000
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
                    // Optimized backoff for Render 30s timeout: 2s, 5s, 10s
                    const waitTimes = [2, 5, 10];
                    const waitTime = waitTimes[Math.min(attempt - 1, waitTimes.length - 1)];
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

// Validate and clean resources to fix undefined names
function validateAndCleanResources(resources) {
    if (!Array.isArray(resources)) return [];
    
    return resources
        .filter(res => {
            // Keep resource if it has at least one valid field
            return res && (res.name || res.channel || res.title || res.url);
        })
        .map(res => {
            // Ensure resource has a name
            const name = res.name || res.channel || res.title || 'Resource';
            const type = res.type || 'Resource';
            const url = res.url || '#';
            const description = res.why || res.description || res.recommended || '';
            
            return {
                type,
                name,
                url,
                description
            };
        });
}

// Validate and clean roadmap data structure
function validateRoadmapData(roadmapObj) {
    if (!roadmapObj || typeof roadmapObj !== 'object') {
        return roadmapObj;
    }
    
    // Clean phases if they exist
    if (Array.isArray(roadmapObj.phases)) {
        roadmapObj.phases = roadmapObj.phases.map(phase => {
            if (phase.resources) {
                phase.resources = validateAndCleanResources(phase.resources);
            }
            return phase;
        });
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
        
        console.log(`📤 Calling AI API for roadmap generation...`);
        // Use default retries (3) which now has optimized backoff for Render
        const response = await callAI(prompt, true, 3, req.customKeys);
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
