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
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const ILovePDFFile = require('@ilovepdf/ilovepdf-nodejs/ILovePDFFile');

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

// iLovePDF Configuration
const ILOVEPDF_PUBLIC_KEY = process.env.ILOVEPDF_PUBLIC_KEY;
const ILOVEPDF_SECRET_KEY = process.env.ILOVEPDF_SECRET_KEY;

if (ILOVEPDF_PUBLIC_KEY && ILOVEPDF_SECRET_KEY) {
    console.log('✅ iLovePDF API configured for PDF generation');
} else {
    console.warn('⚠️  WARNING: No iLovePDF API keys found!');
    console.warn('   PDF export will not be available.');
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
        groq: req.headers['x-groq-api-key'],
        ilovepdfPublic: req.headers['x-ilovepdf-public-key'],
        ilovepdfSecret: req.headers['x-ilovepdf-secret-key']
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
            { name: 'Special Link', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', focus: 'Secret Cyber Security Wisdom' },
            { name: 'Harshith OS', url: 'https://hotaro6754.github.io/Roadmap/', focus: 'Comprehensive Red Team Roadmap Source' },
            { name: 'Null Byte', url: 'https://www.youtube.com/@NullByteWHT', focus: 'Practical hacking techniques and tools' },
            { name: 'Seytonic', url: 'https://www.youtube.com/@Seytonic', focus: 'Cybersecurity news and hardware projects' },
            { name: 'Mental Outlaw', url: 'https://www.youtube.com/@MentalOutlaw', focus: 'Privacy, Linux, and tech culture' }
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

const MASTER_SKILLS = [
    { id: 0, name: "Linux Fundamentals", category: "Core Foundations", estimatedTime: "3-4 weeks",
      description: "Master the essential Linux operating system concepts, command-line interface, file system navigation, permissions, and shell scripting basics.",
      objectives: ["Navigate the Linux file system with confidence", "Understand user permissions and file ownership", "Execute basic to intermediate bash commands", "Manage processes, services, and system resources", "Configure networking on Linux systems"],
      resources: [{ type: "Platform", text: "TryHackMe: Linux Fundamentals (Parts 1-3)", url: "https://tryhackme.com/module/linux-fundamentals" }, { type: "Wargame", text: "OverTheWire: Bandit", url: "https://overthewire.org/wargames/bandit/" }, { type: "Website", text: "Linux Journey", url: "https://linuxjourney.com" }, { type: "Book", text: "The Linux Command Line", url: "https://linuxcommand.org/tlcl.php" }],
      tools: ["Bash/Zsh", "Vim/Nano", "SSH", "Systemctl", "Grep/Sed/Awk"], labs: ["TryHackMe: Linux Fundamentals Rooms", "HackTheBox: Easy Linux machines", "PentesterLab: Linux exercises"],
      prerequisites: "None", nextSkills: "Bash Scripting, Reconnaissance Methodology" },
    { id: 1, name: "Bash Scripting", category: "Automation", estimatedTime: "2-3 weeks",
      description: "Learn to write efficient bash scripts for automation, reconnaissance, and task management in penetration testing workflows.",
      objectives: ["Write loops, conditionals, and functions in bash", "Automate reconnaissance and enumeration tasks", "Parse command output and process files", "Handle errors and implement logging"],
      resources: [{ type: "Website", text: "Bash Academy", url: "https://guide.bash.academy" }, { type: "Platform", text: "TryHackMe: Bash Scripting", url: "https://tryhackme.com" }],
      tools: ["Bash", "AWK", "Sed", "Cron", "Shellcheck"], labs: ["Create automated Nmap scanner", "Build subdomain enumeration tool", "Write log parser for Apache logs"],
      prerequisites: "Linux Fundamentals", nextSkills: "Python Fundamentals" },
    { id: 2, name: "Networking Fundamentals", category: "Core Foundations", estimatedTime: "4-5 weeks",
      description: "Understand TCP/IP, DNS, HTTP, network protocols, packet structure, and how data flows across networks.",
      objectives: ["Explain OSI and TCP/IP models", "Understand IP addressing and subnetting", "Analyze common protocols (HTTP, DNS, FTP, SMB)", "Capture and interpret network packets"],
      resources: [{ type: "Platform", text: "TryHackMe: Network Fundamentals", url: "https://tryhackme.com" }, { type: "Website", text: "Practical Networking", url: "https://www.practicalnetworking.net" }, { type: "Book", text: "TCP/IP Illustrated", url: "#" }],
      tools: ["Wireshark", "tcpdump", "Nmap", "Netcat", "dig/nslookup"], labs: ["TryHackMe: Wireshark 101", "Capture and analyze HTTP traffic", "Perform DNS enumeration"],
      prerequisites: "Basic computer knowledge", nextSkills: "Packet Analysis" },
    { id: 3, name: "Windows Basics", category: "Core Foundations", estimatedTime: "2-3 weeks",
      description: "Gain foundational knowledge of Windows operating systems, PowerShell, file system, services, and basic administration.",
      objectives: ["Navigate Windows file system and registry", "Use PowerShell for system administration", "Understand Windows services and processes", "Manage users and permissions"],
      resources: [{ type: "Platform", text: "TryHackMe: Windows Fundamentals", url: "https://tryhackme.com" }, { type: "Website", text: "Microsoft Learn: PowerShell", url: "https://learn.microsoft.com/powershell/" }],
      tools: ["PowerShell", "CMD", "Task Manager", "Event Viewer"], labs: ["TryHackMe: Windows Fundamentals Rooms", "PowerShell scripting challenges"],
      prerequisites: "Basic OS knowledge", nextSkills: "Windows Privilege Escalation" },
    { id: 4, name: "Virtualization", category: "Lab Setup", estimatedTime: "1-2 weeks",
      description: "Set up and manage virtual machines using VMware and VirtualBox to create isolated penetration testing labs.",
      objectives: ["Install and configure VirtualBox/VMware", "Create and manage VMs", "Configure virtual networking", "Set up Kali Linux attack machine"],
      resources: [{ type: "Website", text: "VirtualBox Documentation", url: "https://www.virtualbox.org/manual/" }],
      tools: ["VirtualBox", "VMware Workstation", "Vagrant", "Kali Linux"], labs: ["Build Kali + Metasploitable lab", "Configure NAT and Host-Only networks"],
      prerequisites: "None", nextSkills: "Any practical labs requiring VM setup" },
    { id: 5, name: "Python Fundamentals", category: "Programming", estimatedTime: "4-5 weeks",
      description: "Learn Python programming for scripting, automation, and tool development in cybersecurity contexts.",
      objectives: ["Understand Python syntax and data structures", "Work with files, APIs, and network sockets", "Write scripts for automation"],
      resources: [{ type: "Website", text: "Automate the Boring Stuff", url: "https://automatetheboringstuff.com" }, { type: "Book", text: "Black Hat Python", url: "#" }],
      tools: ["Python 3", "Requests", "Socket", "Scapy"], labs: ["Build port scanner", "Create HTTP client", "Write password brute-forcer"],
      prerequisites: "Basic programming logic", nextSkills: "Exploitation Framework Usage" },
    { id: 6, name: "Web Basics", category: "Web Foundations", estimatedTime: "2-3 weeks",
      description: "Understand HTTP protocol, cookies, sessions, authentication mechanisms, and how web applications work.",
      objectives: ["Explain HTTP request/response structure", "Understand cookies and session management", "Identify authentication methods"],
      resources: [{ type: "Platform", text: "PortSwigger Academy: HTTP Basics", url: "https://portswigger.net/web-security" }, { type: "Platform", text: "TryHackMe: Web Fundamentals", url: "https://tryhackme.com" }],
      tools: ["Burp Suite", "OWASP ZAP", "Browser DevTools", "Curl"], labs: ["Analyze HTTP traffic with Burp", "Manipulate cookies and sessions"],
      prerequisites: "Networking Fundamentals", nextSkills: "Web Application Penetration Testing" },
    { id: 7, name: "Reconnaissance Methodology", category: "Methodology", estimatedTime: "3-4 weeks",
      description: "Master passive and active reconnaissance techniques to gather information about targets before exploitation.",
      objectives: ["Perform OSINT and passive reconnaissance", "Conduct active scanning with Nmap", "Enumerate subdomains and DNS records", "Map attack surface"],
      resources: [{ type: "Platform", text: "TryHackMe: Recon", url: "https://tryhackme.com" }, { type: "Website", text: "OSINT Framework", url: "https://osintframework.com" }],
      tools: ["Nmap", "Gobuster", "ffuf", "Sublist3r", "theHarvester", "Shodan"], labs: ["Enumerate HTB machines", "Perform OSINT on public targets", "Directory brute-forcing practice"],
      prerequisites: "Networking Fundamentals, Linux Fundamentals", nextSkills: "Enumeration Methodology" },
    { id: 8, name: "Packet Analysis", category: "Network Analysis", estimatedTime: "2-3 weeks",
      description: "Analyze network packets to identify protocols, extract data, detect anomalies, and troubleshoot network issues.",
      objectives: ["Capture packets with Wireshark and tcpdump", "Filter and analyze protocol traffic", "Identify malicious network activity"],
      resources: [{ type: "Platform", text: "TryHackMe: Wireshark", url: "https://tryhackme.com" }],
      tools: ["Wireshark", "tcpdump", "tshark", "NetworkMiner"], labs: ["Analyze PCAP files for CTF challenges", "Detect port scans in captures"],
      prerequisites: "Networking Fundamentals", nextSkills: "Network Penetration Testing" },
    { id: 9, name: "Enumeration Methodology", category: "Methodology", estimatedTime: "3-4 weeks",
      description: "Systematically enumerate services, users, shares, and configurations to identify potential attack vectors.",
      objectives: ["Enumerate SMB, FTP, SSH, and other services", "Identify service versions and vulnerabilities", "Extract usernames and shares"],
      resources: [{ type: "Platform", text: "HTB Academy: Enumeration", url: "https://academy.hackthebox.com" }],
      tools: ["Nmap", "enum4linux", "smbclient", "ldapsearch", "Nikto"], labs: ["Enumerate HTB machines", "Practice on VulnHub VMs"],
      prerequisites: "Reconnaissance Methodology", nextSkills: "Network Penetration Testing" },
    { id: 10, name: "Web Application Penetration Testing", category: "Web Security", estimatedTime: "6-8 weeks",
      description: "Identify and exploit web application vulnerabilities including injection flaws, authentication bypasses, and business logic errors.",
      objectives: ["Test for common web vulnerabilities", "Exploit SQL injection manually and with tools", "Bypass authentication and authorization", "Identify XSS and CSRF vulnerabilities"],
      resources: [{ type: "Platform", text: "PortSwigger Academy (All Labs)", url: "https://portswigger.net/web-security" }, { type: "Website", text: "OWASP Juice Shop", url: "https://owasp.org/www-project-juice-shop/" }],
      tools: ["Burp Suite Pro", "SQLMap", "XSStrike", "Commix", "WPScan"], labs: ["Complete PortSwigger all labs", "Pentest Juice Shop", "HTB Web challenges"],
      prerequisites: "Web Basics, Enumeration Methodology", nextSkills: "OWASP Top 10 Exploitation" },
    { id: 11, name: "OWASP Top 10 Exploitation", category: "Web Security", estimatedTime: "4-6 weeks",
      description: "Deep dive into exploiting OWASP Top 10 vulnerabilities including injection, broken authentication, and sensitive data exposure.",
      objectives: ["Exploit SQL, command, and LDAP injection", "Bypass authentication and session management", "Exploit XXE and deserialization flaws"],
      resources: [{ type: "Platform", text: "PortSwigger OWASP Top 10", url: "https://portswigger.net/web-security/all-topics" }],
      tools: ["Burp Suite", "SQLMap", "XXEinjector", "ysoserial"], labs: ["PortSwigger labs for each OWASP category", "DVWA challenges"],
      prerequisites: "Web Application Penetration Testing", nextSkills: "Report Writing" },
    { id: 12, name: "Network Penetration Testing", category: "Network Security", estimatedTime: "4-5 weeks",
      description: "Conduct comprehensive network penetration tests, exploiting misconfigurations and vulnerable services to gain access.",
      objectives: ["Perform network vulnerability assessments", "Exploit vulnerable network services", "Pivot through networks", "Perform MITM attacks"],
      resources: [{ type: "Platform", text: "TryHackMe: Network Security", url: "https://tryhackme.com" }],
      tools: ["Nmap", "Metasploit", "Responder", "Impacket", "CrackMapExec"], labs: ["HTB Pro Labs", "TryHackMe Network Security rooms"],
      prerequisites: "Enumeration Methodology, Networking Fundamentals", nextSkills: "Lateral Movement" },
    { id: 13, name: "Linux Privilege Escalation", category: "Post-Exploitation", estimatedTime: "3-4 weeks",
      description: "Escalate privileges on Linux systems by exploiting misconfigurations, SUID binaries, kernel exploits, and more.",
      objectives: ["Identify privilege escalation vectors", "Exploit SUID/SGID binaries", "Abuse sudo misconfigurations", "Leverage kernel exploits"],
      resources: [{ type: "Platform", text: "TryHackMe: Linux PrivEsc", url: "https://tryhackme.com/room/linuxprivesc" }, { type: "Website", text: "GTFOBins", url: "https://gtfobins.github.io" }, { type: "Guide", text: "PayloadsAllTheThings", url: "https://github.com/swisskyrepo/PayloadsAllTheThings" }],
      tools: ["LinPEAS", "LinEnum", "pspy", "GTFOBins"], labs: ["TryHackMe Linux PrivEsc rooms", "HTB Easy/Medium Linux machines"],
      prerequisites: "Linux Fundamentals", nextSkills: "Post-Exploitation Techniques" },
    { id: 14, name: "Windows Privilege Escalation", category: "Post-Exploitation", estimatedTime: "3-4 weeks",
      description: "Escalate privileges on Windows systems through token manipulation, service exploits, registry abuse, and more.",
      objectives: ["Enumerate Windows privilege escalation vectors", "Exploit unquoted service paths", "Abuse Windows tokens and privileges", "Leverage registry and DLL hijacking"],
      resources: [{ type: "Platform", text: "TryHackMe: Windows PrivEsc", url: "https://tryhackme.com/room/windowsprivesc20" }, { type: "Guide", text: "PayloadsAllTheThings", url: "https://github.com/swisskyrepo/PayloadsAllTheThings" }],
      tools: ["WinPEAS", "PowerUp", "Seatbelt", "Mimikatz"], labs: ["TryHackMe Windows PrivEsc rooms", "HTB Windows machines"],
      prerequisites: "Windows Basics", nextSkills: "Active Directory Privilege Escalation" },
    { id: 15, name: "Password Cracking", category: "Credential Access", estimatedTime: "2-3 weeks",
      description: "Crack password hashes using various attack methods including dictionary, brute-force, and rule-based attacks.",
      objectives: ["Identify hash types", "Perform dictionary and brute-force attacks", "Use wordlists and rule sets"],
      resources: [{ type: "Platform", text: "TryHackMe: Password Cracking", url: "https://tryhackme.com" }, { type: "Website", text: "Hashcat Wiki", url: "https://hashcat.net/wiki/" }],
      tools: ["Hashcat", "John the Ripper", "CeWL", "Hydra", "SecLists"], labs: ["Crack hashes from HTB machines", "Practice on hash challenges"],
      prerequisites: "Linux Fundamentals", nextSkills: "Credential Dumping" },
    { id: 16, name: "Exploitation Framework Usage", category: "Exploitation", estimatedTime: "3-4 weeks",
      description: "Master Metasploit Framework for exploitation, payload generation, post-exploitation, and pivoting.",
      objectives: ["Navigate Metasploit Framework", "Search and use exploit modules", "Generate and deliver payloads"],
      resources: [{ type: "Platform", text: "TryHackMe: Metasploit", url: "https://tryhackme.com/module/metasploit" }, { type: "Website", text: "Metasploit Unleashed", url: "https://www.offensive-security.com/metasploit-unleashed/" }],
      tools: ["Metasploit Framework", "Msfvenom", "Meterpreter"], labs: ["Exploit HTB machines with Metasploit", "TryHackMe Metasploit rooms"],
      prerequisites: "Linux Fundamentals, Python Fundamentals", nextSkills: "Post-Exploitation Techniques" },
    { id: 17, name: "Report Writing", category: "Professional Skills", estimatedTime: "2-3 weeks",
      description: "Write professional penetration testing reports with clear findings, risk ratings, and remediation recommendations.",
      objectives: ["Structure professional pentest reports", "Document findings with evidence", "Rate vulnerabilities by severity"],
      resources: [{ type: "Guide", text: "TCM Security Report Writing", url: "https://tcm-sec.com/report-writing-for-penetration-testers/" }, { type: "Platform", text: "HTB Academy: Report Writing", url: "https://academy.hackthebox.com/module/details/161" }],
      tools: ["Markdown", "LaTeX", "Dradis", "PlexTrac"], labs: ["Write reports for HTB retired machines", "Practice on lab findings"],
      prerequisites: "Web/Network Penetration Testing", nextSkills: "Red Team Operations" },
    { id: 18, name: "Active Directory Architecture", category: "Active Directory", estimatedTime: "3-4 weeks",
      description: "Understand Active Directory structure, forests, domains, trusts, GPOs, and authentication mechanisms.",
      objectives: ["Explain AD forest and domain structure", "Understand domain trusts", "Analyze Group Policy Objects", "Map AD attack surface"],
      resources: [{ type: "Platform", text: "TryHackMe: Active Directory Basics", url: "https://tryhackme.com" }, { type: "Platform", text: "HackTheBox Academy: Active Directory", url: "https://academy.hackthebox.com" }],
      tools: ["BloodHound", "PowerView", "ADExplorer", "ldapsearch"], labs: ["Build AD home lab", "TryHackMe AD rooms"],
      prerequisites: "Windows Basics", nextSkills: "Kerberos Authentication Attacks" },
    { id: 19, name: "Kerberos Authentication Attacks", category: "Active Directory", estimatedTime: "3-4 weeks",
      description: "Exploit Kerberos protocol weaknesses including Kerberoasting, AS-REP Roasting, and Golden/Silver Ticket attacks.",
      objectives: ["Understand Kerberos authentication flow", "Perform Kerberoasting attacks", "Execute AS-REP Roasting", "Generate Golden and Silver Tickets"],
      resources: [{ type: "Platform", text: "TryHackMe: Kerberos", url: "https://tryhackme.com" }, { type: "Guide", text: "ired.team: Kerberos Attacks", url: "https://www.ired.team" }],
      tools: ["Rubeus", "Impacket", "Mimikatz", "BloodHound"], labs: ["Practice Kerberoasting in lab", "HTB Active Directory machines"],
      prerequisites: "Active Directory Architecture", nextSkills: "Lateral Movement" },
    { id: 20, name: "Credential Dumping", category: "Credential Access", estimatedTime: "2-3 weeks",
      description: "Extract credentials from memory, registries, and files using tools like Mimikatz and Impacket.",
      objectives: ["Dump LSASS memory", "Extract credentials from SAM/NTDS.dit", "Perform DCSync attacks"],
      resources: [{ type: "Platform", text: "TryHackMe: Credential Dumping", url: "https://tryhackme.com" }, { type: "Guide", text: "ired.team: Credential Access", url: "https://www.ired.team" }],
      tools: ["Mimikatz", "Impacket-secretsdump", "LaZagne", "ProcDump"], labs: ["Dump credentials in AD lab", "HTB Pro Labs"],
      prerequisites: "Windows Privilege Escalation, AD Architecture", nextSkills: "Lateral Movement" },
    { id: 21, name: "Lateral Movement", category: "Movement", estimatedTime: "3-4 weeks",
      description: "Move laterally through networks using Pass-the-Hash, Pass-the-Ticket, WMI, PSExec, and other techniques.",
      objectives: ["Execute Pass-the-Hash attacks", "Perform Pass-the-Ticket", "Use PSExec and WMI for lateral movement"],
      resources: [{ type: "Platform", text: "HTB Academy: Lateral Movement", url: "https://academy.hackthebox.com" }, { type: "Guide", text: "ired.team: Lateral Movement", url: "https://www.ired.team" }],
      tools: ["Impacket", "CrackMapExec", "Evil-WinRM", "WMIExec"], labs: ["Practice lateral movement in AD lab", "HTB Pro Labs"],
      prerequisites: "Credential Dumping", nextSkills: "Red Team Attack Chaining" },
    { id: 22, name: "AD Privilege Escalation", category: "Active Directory", estimatedTime: "3-4 weeks",
      description: "Escalate privileges in Active Directory by exploiting misconfigurations, ACLs, delegation, and trust relationships.",
      objectives: ["Identify AD privilege escalation paths", "Abuse ACLs and permissions", "Exploit delegation", "Leverage BloodHound"],
      resources: [{ type: "Platform", text: "TryHackMe: AD PrivEsc", url: "https://tryhackme.com" }, { type: "Guide", text: "SpecterOps: AD Attack Paths", url: "https://posts.specterops.io" }],
      tools: ["BloodHound", "PowerView", "Rubeus", "Impacket"], labs: ["Follow BloodHound attack paths", "HTB AD machines"],
      prerequisites: "AD Architecture, Kerberos Attacks", nextSkills: "Domain Persistence" },
    { id: 23, name: "Domain Persistence Techniques", category: "Persistence", estimatedTime: "2-3 weeks",
      description: "Establish and maintain persistent access in Active Directory environments using backdoors and stealthy techniques.",
      objectives: ["Create Golden Tickets for persistence", "Implement Skeleton Key attacks", "Abuse AdminSDHolder"],
      resources: [{ type: "Guide", text: "ired.team: Persistence", url: "https://www.ired.team" }, { type: "Platform", text: "TryHackMe: AD Persistence", url: "https://tryhackme.com" }],
      tools: ["Mimikatz", "PowerShell Empire", "DSInternals"], labs: ["Practice persistence in AD lab", "Red Team exercises"],
      prerequisites: "AD Privilege Escalation", nextSkills: "Red Team Operations" },
    { id: 24, name: "Windows Internals", category: "Advanced Windows", estimatedTime: "4-5 weeks",
      description: "Deep dive into Windows internals including processes, threads, tokens, security contexts, and API calls.",
      objectives: ["Understand Windows process architecture", "Analyze security tokens", "Explore Windows API for security"],
      resources: [{ type: "Book", text: "Windows Internals", url: "#" }, { type: "Platform", text: "HTB Academy: Windows Internals", url: "https://academy.hackthebox.com" }],
      tools: ["Process Hacker", "WinDbg", "API Monitor", "Sysinternals Suite"], labs: ["Analyze malware samples", "Debug Windows processes"],
      prerequisites: "Windows Basics, Windows PrivEsc", nextSkills: "AV/EDR Evasion" },
    { id: 25, name: "Red Team Attack Chaining", category: "Red Team", estimatedTime: "4-5 weeks",
      description: "Chain multiple attack techniques together to achieve complex objectives in realistic red team engagements.",
      objectives: ["Plan multi-stage attack campaigns", "Chain recon, exploitation, and post-exploitation", "Maintain OPSEC"],
      resources: [{ type: "Platform", text: "HTB Pro Labs", url: "https://www.hackthebox.com" }, { type: "Platform", text: "TryHackMe: Red Team Path", url: "https://tryhackme.com" }],
      tools: ["Full pentesting toolkit", "C2 Frameworks", "BloodHound"], labs: ["HTB Pro Labs (Rastalabs, APTLabs)", "TryHackMe Red Team challenges"],
      prerequisites: "All Year 2-3 skills", nextSkills: "Red Team Operations" },
    { id: 26, name: "MITRE ATT&CK Mapping", category: "Methodology", estimatedTime: "2-3 weeks",
      description: "Map attack techniques to the MITRE ATT&CK framework for structured reporting and detection analysis.",
      objectives: ["Understand MITRE ATT&CK framework", "Map techniques to tactics", "Document attacks using ATT&CK"],
      resources: [{ type: "Website", text: "MITRE ATT&CK Navigator", url: "https://mitre-attack.github.io/attack-navigator/" }],
      tools: ["ATT&CK Navigator", "Atomic Red Team"], labs: ["Map HTB machine attacks to ATT&CK", "Create attack matrices"],
      prerequisites: "Red Team fundamentals", nextSkills: "Red Team Operations" },
    { id: 27, name: "Red Team Operations", category: "Red Team", estimatedTime: "6-8 weeks",
      description: "Plan and execute end-to-end red team operations simulating advanced persistent threats against organizations.",
      objectives: ["Plan red team campaigns", "Simulate APT tactics", "Evade blue team detection"],
      resources: [{ type: "Book", text: "Red Team Development and Operations", author: "Joe Vest", url: "#" }, { type: "Platform", text: "TryHackMe: Red Team Path", url: "https://tryhackme.com" }],
      tools: ["C2 Frameworks", "OPSEC tools", "Full attack toolkit"], labs: ["HTB Pro Labs", "Custom red team exercises"],
      prerequisites: "All Year 3 skills", nextSkills: "C2 Operations" },
    { id: 28, name: "Command & Control Operations", category: "C2", estimatedTime: "4-5 weeks",
      description: "Deploy and operate command and control infrastructure using frameworks like Cobalt Strike, Sliver, and custom C2.",
      objectives: ["Set up C2 infrastructure", "Generate and deploy implants", "Manage beacons and agents"],
      resources: [{ type: "Platform", text: "TryHackMe: C2", url: "https://tryhackme.com" }, { type: "Website", text: "Sliver Wiki", url: "https://github.com/BishopFox/sliver/wiki" }],
      tools: ["Cobalt Strike", "Sliver", "Covenant", "Mythic"], labs: ["Deploy Sliver C2 in lab", "Customize malleable profiles"],
      prerequisites: "Red Team Operations", nextSkills: "AV/EDR Evasion" },
    { id: 29, name: "OPSEC Fundamentals", category: "Operational Security", estimatedTime: "3-4 weeks",
      description: "Maintain operational security during red team engagements to avoid detection and attribution.",
      objectives: ["Understand OPSEC principles", "Avoid common detection mistakes", "Anonymize infrastructure"],
      resources: [{ type: "Platform", text: "TryHackMe: OPSEC", url: "https://tryhackme.com" }],
      tools: ["ProxyChains", "Tor", "VPNs", "Domain Fronting"], labs: ["Practice OPSEC-aware attacks", "Analyze OPSEC failures"],
      prerequisites: "Red Team Operations", nextSkills: "Detection-Aware Attacks" },
    { id: 30, name: "AV/EDR Evasion Basics", category: "Evasion", estimatedTime: "4-5 weeks",
      description: "Bypass antivirus and endpoint detection/response solutions using obfuscation, encryption, and process injection.",
      objectives: ["Understand AV/EDR detection mechanisms", "Obfuscate payloads", "Perform process injection", "Bypass AMSI and ETW"],
      resources: [{ type: "Platform", text: "TryHackMe: AV Evasion", url: "https://tryhackme.com" }, { type: "Website", text: "Red Team Notes", url: "https://www.ired.team" }],
      tools: ["Veil", "Shellter", "Donut", "ScareCrow"], labs: ["Evade Windows Defender", "Bypass common EDR solutions"],
      prerequisites: "Windows Internals, Exploitation Frameworks", nextSkills: "Post-Exploitation Techniques" },
    { id: 31, name: "Post-Exploitation Techniques", category: "Post-Exploitation", estimatedTime: "3-4 weeks",
      description: "Advanced post-exploitation including data exfiltration, living-off-the-land techniques, and covert operations.",
      objectives: ["Perform stealthy data exfiltration", "Use LOLBins", "Execute fileless attacks"],
      resources: [{ type: "Website", text: "LOLBAS Project", url: "https://lolbas-project.github.io" }, { type: "Platform", text: "HTB Academy: Post-Exploitation", url: "https://academy.hackthebox.com" }],
      tools: ["PowerShell", "WMI", "LOLBins", "C2 frameworks"], labs: ["Practice fileless execution", "Exfiltrate data covertly"],
      prerequisites: "Windows Internals, AV/EDR Evasion", nextSkills: "Red Team Operations" },
    { id: 32, name: "Azure Active Directory Attacks", category: "Cloud Security", estimatedTime: "3-4 weeks",
      description: "Attack Azure AD environments including authentication bypasses, token theft, and privilege escalation in the cloud.",
      objectives: ["Understand Azure AD architecture", "Perform password spraying on Azure", "Steal and replay Azure tokens"],
      resources: [{ type: "Platform", text: "TryHackMe: Azure", url: "https://tryhackme.com" }],
      tools: ["AADInternals", "ROADtools", "AzureHound", "PowerZure"], labs: ["Attack Azure AD lab environment", "Cloud pentesting exercises"],
      prerequisites: "AD Architecture", nextSkills: "Cloud Red Teaming" },
    { id: 33, name: "AWS IAM Attacks", category: "Cloud Security", estimatedTime: "3-4 weeks",
      description: "Exploit AWS IAM misconfigurations, escalate privileges, and move laterally across AWS services.",
      objectives: ["Understand AWS IAM architecture", "Enumerate AWS environments", "Escalate IAM privileges"],
      resources: [{ type: "Platform", text: "TryHackMe: AWS", url: "https://tryhackme.com" }, { type: "Tool", text: "Pacu", url: "https://github.com/RhinoSecurityLabs/pacu" }],
      tools: ["Pacu", "ScoutSuite", "Prowler", "AWS CLI"], labs: ["Practice with flAWS challenges", "Pacu exploitation scenarios"],
      prerequisites: "Cloud fundamentals", nextSkills: "Cloud Red Teaming" },
    { id: 34, name: "Detection-Aware Attacks", category: "Advanced Red Team", estimatedTime: "3-4 weeks",
      description: "Understand blue team detection methods and adapt red team tactics to evade SIEM, IDS/IPS, and threat hunting.",
      objectives: ["Understand detection engineering", "Identify telemetry sources", "Modify TTPs to evade detection"],
      resources: [{ type: "Platform", text: "TryHackMe: Detection Engineering", url: "https://tryhackme.com" }],
      tools: ["Splunk", "Elastic SIEM", "Sysmon"], labs: ["Red vs Blue exercises", "Test attacks against SIEM"],
      prerequisites: "Red Team Operations, MITRE ATT&CK", nextSkills: "Cloud Red Teaming" },
    { id: 35, name: "Cloud Red Teaming", category: "Cloud Security", estimatedTime: "5-6 weeks",
      description: "Execute comprehensive red team operations across cloud environments (AWS, Azure, GCP) with cloud-specific TTPs.",
      objectives: ["Perform cloud reconnaissance", "Exploit cloud misconfigurations", "Move laterally across cloud resources"],
      resources: [{ type: "Platform", text: "HackTheBox: Cloud Labs", url: "https://www.hackthebox.com" }],
      tools: ["Pacu", "ScoutSuite", "AADInternals", "CloudFox"], labs: ["HTB Cloud Pro Labs", "Custom cloud red team scenarios"],
      prerequisites: "Azure/AWS Attacks, Red Team Operations", nextSkills: "Professional cloud security certifications" }
];

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
            'Linux Fundamentals: terminal commands, file permissions, user management, process control',
            'Windows Fundamentals: CMD, PowerShell, services, registry basics',
            'Networking Basics: TCP/IP, ports, protocols, subnetting fundamentals',
            'Reconnaissance: WHOIS lookups, DNS enumeration, subdomain discovery',
            'Service Enumeration: Nmap scanning, Gobuster directory brute-forcing, Nikto web scanning',
            'Burp Suite Basics: proxy setup, intercepting requests, repeater, intruder',
            'Metasploit Introduction: msfconsole basics, exploit modules, payloads, handlers',
            'Web Attacks: SQL injection (union, error, time-based), XSS, file inclusion (LFI/RFI), directory traversal, IDOR',
            'Linux Privilege Escalation: sudo abuse, SUID binaries, cron jobs, PATH hijacking',
            'Windows Privilege Escalation: service misconfigurations, registry abuse, DLL hijacking',
            'Password Cracking: Hashcat, John the Ripper, Hydra for credential attacks'
        ],
        youtubeChannels: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'Perfect for networking and Linux basics' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Excellent pentesting fundamentals' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'TryHackMe room walkthroughs' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', why: 'Tool tutorials and beginner methodology' }
        ],
        specificLabs: [
            { name: 'Pre Security Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/presecurity', duration: '40 hours', skills: ['Linux & Windows Fundamentals', 'Networking Basics'] },
            { name: 'Jr Penetration Tester Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/jrpenetrationtester', duration: '56 hours', skills: ['Full Pentest Workflow'] },
            { name: 'Linux Fundamentals', platform: 'THM', url: 'https://tryhackme.com/room/linux1', skills: ['Terminal', 'Permissions'] },
            { name: 'Nmap', platform: 'THM', url: 'https://tryhackme.com/room/furthernmap', skills: ['Scanning', 'Enumeration'] },
            { name: 'Burp Suite', platform: 'THM', url: 'https://tryhackme.com/room/burpsuitebasics', skills: ['Web Proxy', 'Intruder'] },
            { name: 'HTB Starting Point', platform: 'HTB', url: 'https://app.hackthebox.com/starting-point', skills: ['Beginner boxes'] }
        ],
        coreTools: ['Nmap', 'Gobuster', 'Nikto', 'Burp Suite', 'Metasploit', 'Hydra', 'Netcat', 'LinPEAS', 'WinPEAS'],
        keySkills: ['Network enumeration', 'Web app basics', 'Linux fundamentals', 'Metasploit basics', 'Privilege escalation intro']
    },
    'ejpt': {
        name: 'eJPT - eLearnSecurity Junior Penetration Tester',
        level: 'Entry',
        focus: 'Professional pentesting workflow with real-world network scenarios',
        prerequisites: ['Basic networking', 'Linux command line basics'],
        examFormat: '48-hour practical exam with multiple machines',
        syllabus: [
            'Advanced Networking: subnetting calculations, routing concepts, VLANs, firewalls and IDS basics',
            'Service Enumeration: SMB enumeration (enum4linux, smbclient), FTP, SSH, HTTP, SNMP, MySQL, PostgreSQL',
            'Nmap Advanced: NSE script usage, timing templates, output formats, service versioning',
            'Metasploit Framework: complete exploitation workflow, post-exploitation modules, meterpreter',
            'Web Exploitation: SQL injection variants, XSS types, authentication bypass techniques',
            'Credential Attacks: password spraying, credential reuse, hash cracking',
            'Pivoting Basics: port forwarding, SSH tunneling, routing through compromised hosts',
            'Post-Exploitation: credential looting, password dumping, lateral movement introduction',
            'Professional Reporting: executive summary writing, technical findings documentation, risk rating methodology'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical Ethical Hacking course' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', why: 'Tool tutorials and methodology' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'Networking and security foundations' },
            { name: 'INE Security', url: 'https://www.youtube.com/@INEtraining', why: 'Official eJPT training content' }
        ],
        specificLabs: [
            { name: 'INE PTS Learning Path', platform: 'INE', url: 'https://ine.com/learning/paths/penetration-testing-student', duration: '145 hours', skills: ['Complete eJPT prep'] },
            { name: 'OverTheWire: Bandit', platform: 'OTW', url: 'https://overthewire.org/wargames/bandit/', levels: '0-34', skills: ['Linux basics'] },
            { name: 'Blue', platform: 'THM', url: 'https://tryhackme.com/room/blue', difficulty: 'Easy', skills: ['Windows exploitation', 'EternalBlue'] },
            { name: 'SMB Enumeration', platform: 'THM', url: 'https://tryhackme.com/room/networkservices', skills: ['Enum4linux', 'SMBMap'] },
            { name: 'Offensive Pentesting', platform: 'THM', url: 'https://tryhackme.com/path/outline/pentesting', skills: ['Complete workflow'] }
        ],
        coreTools: ['Nmap', 'Metasploit', 'Searchsploit', 'CrackMapExec', 'Wireshark', 'Burp Suite', 'Enum4linux', 'Nikto'],
        keySkills: ['Host and network enumeration', 'Web application attacks', 'System exploitation', 'Pivoting basics', 'Professional reporting']
    },
    'ceh': {
        name: 'CEH - Certified Ethical Hacker',
        level: 'Entry',
        focus: 'Theory-heavy, broad coverage of ethical hacking concepts, good for vocabulary building',
        prerequisites: ['2 years IT experience recommended', 'Networking basics', 'Security concepts'],
        examFormat: '125 multiple-choice questions, 4 hours',
        syllabus: [
            'Footprinting & Reconnaissance: passive information gathering, OSINT, search engine reconnaissance',
            'Scanning & Enumeration: network scanning, vulnerability scanning, port enumeration',
            'Vulnerability Analysis: vulnerability assessment tools and techniques',
            'System Hacking: password cracking, privilege escalation, steganography, covering tracks',
            'Malware Threats: trojans, viruses, worms, malware analysis basics',
            'Sniffing: packet sniffing, ARP poisoning, MAC flooding',
            'Social Engineering: phishing, pretexting, baiting, tailgating',
            'Denial of Service (DoS/DDoS): attack types and mitigation',
            'Session Hijacking: session attacks and countermeasures',
            'Web Server Hacking: web server attacks and security',
            'Web Application Hacking: OWASP Top 10 vulnerabilities',
            'SQL Injection: types and exploitation techniques',
            'Wireless Network Hacking: WEP, WPA, WPA2 attacks',
            'Mobile Platform Security: Android and iOS security',
            'IoT Security: IoT vulnerabilities and attacks',
            'Cloud Computing Security: cloud service models and security',
            'Cryptography: encryption algorithms, hashing, PKI'
        ],
        youtubeChannels: [
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'CEH exam prep and concepts' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical security concepts' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'Networking and security foundations' },
            { name: 'HackerSploit', url: 'https://www.youtube.com/@HackerSploit', why: 'Tool demonstrations' }
        ],
        specificLabs: [
            { name: 'TryHackMe: Pre Security Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/presecurity', duration: '40 hours', skills: ['Foundations'] },
            { name: 'EC-Council iLabs', platform: 'EC-Council', url: 'https://ilabs.eccouncil.org/', type: 'Official', skills: ['CEH labs'] },
            { name: 'OWASP Top 10', platform: 'THM', url: 'https://tryhackme.com/room/owasptop10', skills: ['Web vulnerabilities'] },
            { name: 'Nmap', platform: 'THM', url: 'https://tryhackme.com/room/furthernmap', skills: ['Network scanning'] },
            { name: 'Metasploit: Introduction', platform: 'THM', url: 'https://tryhackme.com/room/metasploitintro', skills: ['Framework basics'] },
            { name: 'HTB Academy', platform: 'HTB', url: 'https://academy.hackthebox.com/', skills: ['Various modules'] }
        ],
        coreTools: ['Nmap', 'Wireshark', 'Metasploit', 'SQLMap', 'Burp Suite', 'Aircrack-ng', 'John the Ripper', 'Nessus', 'SET Toolkit'],
        keySkills: ['Reconnaissance', 'Scanning and enumeration', 'System hacking', 'Malware threats', 'Sniffing', 'Social engineering', 'Web application hacking', 'Wireless security']
    },
    'pnpt': {
        name: 'PNPT - Practical Network Penetration Tester',
        level: 'Attack-Focused',
        focus: 'REAL WORLD RED TEAM TRAINING with heavy Active Directory focus',
        prerequisites: ['Basic pentesting knowledge', 'Linux proficiency', 'Networking fundamentals'],
        examFormat: '5-day practical exam with full report due in 2 days + Live Defense Panel',
        syllabus: [
            'Professional Methodology: proper scoping, Rules of Engagement, client communication',
            'Active Directory Architecture: Kerberos authentication, NTLM, LDAP, Group Policy Objects (GPOs)',
            'AD Enumeration: BloodHound graph analysis, PowerView enumeration, ldapsearch queries',
            'LLMNR/NBT-NS Poisoning: using Responder to capture hashes',
            'Kerberoasting: requesting and cracking TGS service tickets with Rubeus and Impacket',
            'AS-REP Roasting: targeting accounts without Kerberos pre-authentication',
            'Pass-the-Hash (PtH): lateral movement with captured NTLM hashes',
            'Pass-the-Ticket (PtT): Kerberos ticket manipulation',
            'Golden Ticket Attacks: TGT forging with krbtgt hash',
            'Silver Ticket Attacks: TGS forging for specific services',
            'BloodHound Attack Paths: identifying privilege escalation routes in AD',
            'DCSync Attack: replicating domain credentials',
            'Post-Exploitation: credential dumping with Mimikatz, lateral movement techniques',
            'Professional Pentest Reporting: executive summary, risk ratings, remediation recommendations with screenshots'
        ],
        youtubeChannels: [
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Created by Heath Adams (TCM founder) - official PNPT prep' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'AD boxes and advanced methodology walkthroughs' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'AD attack demonstrations' },
            { name: 'TCM Security Official', url: 'https://www.youtube.com/@TCMSecurity', why: 'Official PNPT training insights' }
        ],
        specificLabs: [
            { name: 'Practical Ethical Hacking', platform: 'TCM Academy', url: 'https://academy.tcm-sec.com/p/practical-ethical-hacking-the-complete-course', skills: ['Full PNPT prep'] },
            { name: 'Active Directory Basics', platform: 'THM', url: 'https://tryhackme.com/room/winadbasics', skills: ['AD fundamentals'] },
            { name: 'Attacktive Directory', platform: 'THM', url: 'https://tryhackme.com/room/attacktivedirectory', skills: ['Kerberoasting', 'AS-REP'] },
            { name: 'Lateral Movement', platform: 'THM', url: 'https://tryhackme.com/room/lateralmovementandpivoting', skills: ['AD lateral movement'] },
            { name: 'Forest', platform: 'HTB', difficulty: 'Easy', url: 'https://app.hackthebox.com/machines/Forest', skills: ['AD enumeration', 'AS-REP Roasting'] },
            { name: 'Active', platform: 'HTB', difficulty: 'Easy', url: 'https://app.hackthebox.com/machines/Active', skills: ['Kerberoasting', 'GPP passwords'] }
        ],
        coreTools: ['BloodHound', 'CrackMapExec', 'Impacket', 'Responder', 'Mimikatz', 'PowerView', 'PowerUp', 'Rubeus', 'Evil-WinRM'],
        keySkills: ['External/Internal pentesting', 'Active Directory mastery', 'Professional report writing', 'Live defense presentation']
    },
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
            'Manual Exploit Modification: editing Python/Ruby exploits, adjusting payloads, debugging scripts',
            'Time Management Under Pressure: 24-hour exam simulation strategies'
        ],
        youtubeChannels: [
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'Essential HTB walkthroughs with manual methodology - THE OSCP resource' },
            { name: 'TJ Null', url: 'https://www.youtube.com/@TJNull', why: 'OSCP prep lists and guidance' },
            { name: 'The Cyber Mentor', url: 'https://www.youtube.com/@TCMSecurityAcademy', why: 'Practical techniques and mindset' },
            { name: 'S1REN', url: 'https://www.youtube.com/@S1REN', why: 'OSCP-style machine walkthroughs' },
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', why: 'Web exploitation techniques' }
        ],
        specificLabs: [
            { name: 'PEN-200 Course Labs', platform: 'OffSec', url: 'https://www.offensive-security.com/pwk-oscp/', skills: ['Official OSCP prep'] },
            { name: 'Proving Grounds Practice', platform: 'OffSec', url: 'https://www.offensive-security.com/labs/individual/', skills: ['OSCP-like boxes'] },
            { name: 'TJ Null OSCP HTB List', platform: 'HTB', url: 'https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8', skills: ['OSCP-style practice'] },
            { name: 'Offensive Pentesting Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/pentesting', skills: ['Complete methodology'] },
            { name: 'HTB Pro Labs: Dante', platform: 'HTB', url: 'https://app.hackthebox.com/prolabs', skills: ['AD and pivoting'] }
        ],
        coreTools: ['Nmap', 'Netcat', 'Burp Suite', 'Metasploit (limited use)', 'LinPEAS', 'WinPEAS', 'Chisel', 'Impacket', 'Custom scripts'],
        keySkills: ['Manual exploit modification', 'Time management under pressure', 'Systematic enumeration', 'Privilege escalation', 'Buffer overflow']
    },
    'cpts': {
        name: 'CPTS - HTB Certified Penetration Testing Specialist',
        level: 'Attack-Focused',
        focus: 'MOST DETAILED PENTEST COURSE ON EARTH covering wide range of attack vectors',
        prerequisites: ['Strong Linux/Windows skills', 'Web security knowledge', 'AD mastery'],
        examFormat: '10-day intense practical exam with full pentest report',
        syllabus: [
            'Network Attacks: ARP spoofing, VLAN hopping, man-in-the-middle attacks',
            'Deep Service Enumeration: exhaustive service fingerprinting and vulnerability identification',
            'Advanced Web Attacks: advanced SQLi (second-order, out-of-band), XXE, SSRF chaining, deserialization exploits',
            'Active Directory: all PNPT attacks plus constrained/unconstrained delegation, ADCS attacks, forest trusts',
            'Wireless Attacks: WPA/WPA2 cracking, evil twin attacks, WPS attacks',
            'Cloud Security: AWS and Azure misconfigurations, S3 bucket exploitation',
            'Password Attacks: advanced hash cracking, NTLM relay attacks, Kerberos delegation abuse',
            'Evasion Techniques: AV bypass, obfuscation, in-memory execution',
            'Advanced Pivoting & Tunneling: Chisel, Ligolo-NG, SSH advanced tunneling, Metasploit routes',
            'Exploit Development Basics: fuzzing, basic buffer overflows, identifying vulnerabilities'
        ],
        youtubeChannels: [
            { name: 'Hack The Box Official', url: 'https://www.youtube.com/@HackTheBox', why: 'Official HTB Academy content' },
            { name: 'IppSec', url: 'https://www.youtube.com/@ippsec', why: 'In-depth HTB walkthroughs - essential viewing' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'Detailed exploitation techniques' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', why: 'Bug bounty and web exploitation' },
            { name: 'ZSecurity', url: 'https://www.youtube.com/@zSecurity', why: 'Wireless and network attacks' }
        ],
        specificLabs: [
            { name: 'Penetration Tester Path', platform: 'HTB Academy', url: 'https://academy.hackthebox.com/path/preview/penetration-tester', skills: ['Complete CPTS prep'] },
            { name: 'Dante Pro Lab', platform: 'HTB', url: 'https://app.hackthebox.com/prolabs', skills: ['AD pivoting'] },
            { name: 'Zephyr Pro Lab', platform: 'HTB', url: 'https://app.hackthebox.com/prolabs', skills: ['Advanced techniques'] },
            { name: 'Offshore Pro Lab', platform: 'HTB', url: 'https://app.hackthebox.com/prolabs', skills: ['Enterprise networks'] },
            { name: 'Pivoting, Tunneling & Port Forwarding', platform: 'HTB Academy', skills: ['Advanced pivoting'] },
            { name: 'Active Directory Enumeration & Attacks', platform: 'HTB Academy', skills: ['Complete AD'] }
        ],
        coreTools: ['Nmap', 'Netcat', 'Gobuster', 'FFUF', 'Empire', 'Sliver', 'Covenant', 'Chisel', 'Ligolo-NG', 'BloodHound', 'CrackMapExec', 'Impacket'],
        keySkills: ['Advanced pivoting', 'Complex web exploitation', 'Enterprise AD attacks', 'Exhaustive reporting', 'Cloud security']
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
            'Living-off-the-Land (LOLBins): using built-in Windows binaries for attack (certutil, rundll32, regsvr32)',
            'PowerShell Obfuscation: encoding, encryption, script block logging bypass',
            'C# Tooling: SharpSploit, custom C# tools, in-memory execution',
            'Process Injection: CreateRemoteThread, process hollowing, reflective DLL injection',
            'DLL Hijacking & Side-Loading: exploiting DLL search order for persistence',
            'Custom Loaders: Donut shellcode execution, reflective PE loading',
            'Advanced AD: cross-forest attacks, trust exploitation, Kerberos delegation abuse'
        ],
        youtubeChannels: [
            { name: 'ZeroPoint Security', url: 'https://www.zeropointsecurity.co.uk/', why: 'Red team training experts, CRTO creators' },
            { name: 'Sektor7', url: 'https://institute.sektor7.net/', why: 'Malware development and evasion courses' },
            { name: 'Red Team Village', url: 'https://www.youtube.com/@RedTeamVillage', why: 'Community red teaming content' },
            { name: 'Ired.team', url: 'https://www.ired.team/', why: 'Excellent red teaming resource and techniques' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'Malware analysis and evasion techniques' }
        ],
        specificLabs: [
            { name: 'PEN-300 Course Labs', platform: 'OffSec', url: 'https://www.offensive-security.com/pen300-osep/', skills: ['Official OSEP prep'] },
            { name: 'RastaLabs', platform: 'HTB Pro Lab', url: 'https://app.hackthebox.com/prolabs', skills: ['Enterprise red teaming'] },
            { name: 'Red Teaming Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/redteaming', skills: ['Red team techniques'] },
            { name: 'Custom AD Lab', platform: 'Self-Hosted', skills: ['AD attack practice'] }
        ],
        coreTools: ['Sliver', 'Mythic', 'Empire', 'Covenant', 'Donut', 'SharpSploit', 'ScareCrow', 'Mimikatz', 'BloodHound', 'Custom C# tools'],
        keySkills: ['AV/EDR evasion', 'Custom payload development', 'Advanced AD persistence', 'Lateral movement', 'C# development']
    },
    'oswe': {
        name: 'OSWE - Offensive Security Web Expert',
        level: 'Advanced Attack',
        focus: 'WHITE-BOX WEB HACKING through source code review and exploit chaining',
        prerequisites: ['Strong web security knowledge', 'Programming: Python, PHP, Java, Node.js'],
        examFormat: '48-hour exam reviewing and exploiting real web applications',
        syllabus: [
            'Programming Languages: deep knowledge of Python, PHP, Java, JavaScript, Node.js code patterns',
            'Source Code Review: manual code audit, identifying logic flaws, authentication bypass',
            'Logic Flaw Detection: business logic vulnerabilities, race conditions, state manipulation',
            'Deserialization Attacks: Java deserialization, PHP object injection, Python pickle, .NET deserialization',
            'SSRF Chaining: exploiting Server-Side Request Forgery to access internal services and cloud metadata',
            'RCE from Code: template injection (SSTI), eval vulnerabilities, code execution chains',
            'Advanced Burp Suite: custom extensions, macro creation, automated exploit chains',
            'Custom Exploit Development: writing proof-of-concept exploits from source code analysis',
            'Authentication Bypass: JWT attacks, session management flaws, OAuth misconfigurations',
            'XXE Exploitation: XML External Entity attacks and data exfiltration'
        ],
        youtubeChannels: [
            { name: 'Rana Khalil', url: 'https://www.youtube.com/@RanaKhalil101', why: 'Exceptional OSWE prep and web security labs - THE OSWE resource' },
            { name: 'NahamSec', url: 'https://www.youtube.com/@NahamSec', why: 'Bug bounty and web hacking methodology' },
            { name: 'STÖK', url: 'https://www.youtube.com/@STOKfredrik', why: 'Bug bounty hunting and advanced web techniques' },
            { name: 'InsiderPhD', url: 'https://www.youtube.com/@InsiderPhD', why: 'Advanced web exploitation concepts and bug bounty' },
            { name: 'BugCrowd', url: 'https://www.youtube.com/@Bugcrowd', why: 'Bug bounty webinars and research' },
            { name: 'OWASP', url: 'https://www.youtube.com/@OWASPGLOBAL', why: 'Web security standards and research' }
        ],
        specificLabs: [
            { name: 'WEB-300 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/awae-oswe/', skills: ['Official OSWE prep'] },
            { name: 'PortSwigger Web Security Academy', platform: 'PortSwigger', url: 'https://portswigger.net/web-security', skills: ['Advanced web exploits'] },
            { name: 'Web Exploitation Advanced', platform: 'HTB Academy', url: 'https://academy.hackthebox.com/', skills: ['Advanced web techniques'] },
            { name: 'HackerOne CTFs', platform: 'HackerOne', url: 'https://www.hackerone.com/for-hackers/hacker-101', skills: ['Real-world web vulns'] }
        ],
        coreTools: ['Burp Suite Professional', 'Python', 'Custom scripts', 'Debuggers (gdb, node inspector)', 'Source code analyzers', 'curl', 'jq'],
        keySkills: ['Source code analysis', 'Exploit development (Python)', 'Complex vulnerability chaining', 'Auth bypass', 'Deserialization']
    },
    'osda': {
        name: 'OSDA - Offensive Security Defense Analyst',
        level: 'Defense-Focused',
        focus: 'SOC & BLUE TEAM operations with focus on log analysis and threat hunting',
        prerequisites: ['Security fundamentals', 'Log analysis basics', 'Networking knowledge'],
        examFormat: '24-hour practical defense-oriented exam',
        syllabus: [
            'Log Analysis: Windows Event Logs, syslog, Apache/Nginx logs, application logs',
            'SIEM Usage: Splunk queries (SPL), Elastic Stack (ELK), log aggregation and correlation',
            'Alert Triage: identifying false positives, validating true positives, alert prioritization',
            'Incident Response: NIST IR framework, containment strategies, eradication, recovery',
            'Threat Hunting: proactive searching for IOCs, behavioral analysis, MITRE ATT&CK mapping',
            'Detection Engineering: writing Sigma rules, YARA rule creation, custom detections',
            'Network Traffic Analysis: Wireshark packet analysis, Zeek (Bro) logs, Suricata IDS',
            'Malware Analysis Basics: static and dynamic analysis, sandbox usage',
            'Forensics Fundamentals: disk forensics, memory analysis, timeline creation'
        ],
        youtubeChannels: [
            { name: 'Security Onion', url: 'https://www.youtube.com/@SecurityOnion', why: 'Official defensive security training and platform' },
            { name: 'John Hammond', url: 'https://www.youtube.com/@_JohnHammond', why: 'IR, log analysis, and malware triage' },
            { name: 'Blue Team Village', url: 'https://www.youtube.com/@BlueTeamVillage', why: 'Community defensive security content' },
            { name: 'Elastic Security', url: 'https://www.youtube.com/@OfficialElasticVideos', why: 'Elastic Stack tutorials and use cases' }
        ],
        specificLabs: [
            { name: 'SOC-200 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/soc200-osda/', skills: ['Official OSDA prep'] },
            { name: 'SOC Level 1 Path', platform: 'THM', url: 'https://tryhackme.com/path/outline/soclevel1', skills: ['SOC analyst fundamentals'] },
            { name: 'Sherlock Challenges', platform: 'HTB', url: 'https://app.hackthebox.com/sherlocks', skills: ['Incident investigation'] },
            { name: 'Splunk Boss of the SOC', platform: 'Splunk', url: 'https://www.splunk.com/en_us/blog/conference/boss-of-the-soc.html', skills: ['SIEM challenges'] },
            { name: 'Security Onion', platform: 'Self-Hosted', url: 'https://securityonionsolutions.com/', skills: ['Full SOC stack'] }
        ],
        coreTools: ['Splunk', 'Elastic Stack (ELK)', 'Sysmon', 'Sigma Rules', 'YARA', 'Wireshark', 'Zeek', 'Suricata'],
        keySkills: ['SIEM mastery', 'Log analysis', 'Incident Response', 'Threat hunting', 'Detection engineering']
    },
    'oswp': {
        name: 'OSWP - Offensive Security Wireless Professional',
        level: 'Specialized',
        focus: '802.11 theory and practical wireless attacks (WPA/WPA2, Evil Twin)',
        prerequisites: ['Networking fundamentals', 'Linux proficiency'],
        examFormat: '3 hours 45 minutes practical exam',
        syllabus: [
            '802.11 Wireless Theory: 802.11 a/b/g/n/ac/ax standards, frame structures, channel management',
            'WPA/WPA2 Attacks: 4-way handshake capture, dictionary attacks, PMKID attacks',
            'Deauthentication Attacks: forcing client disconnection for handshake capture',
            'Evil Twin Attacks: rogue access point deployment, credential harvesting',
            'WPS Attacks: PIN brute-forcing, Pixie Dust attacks',
            'MAC Filtering Bypass: spoofing allowed MAC addresses',
            'Hidden SSID Discovery: identifying and connecting to hidden networks',
            'Wireless Packet Analysis: analyzing 802.11 frames with Wireshark',
            'Hardware Requirements: wireless adapters with monitor mode and packet injection'
        ],
        youtubeChannels: [
            { name: 'Hak5', url: 'https://www.youtube.com/@hak5', why: 'Wireless hacking hardware (WiFi Pineapple) and techniques' },
            { name: 'NetworkChuck', url: 'https://www.youtube.com/@NetworkChuck', why: 'Wireless networking foundations and attacks' },
            { name: 'David Bombal', url: 'https://www.youtube.com/@davidbombal', why: 'WiFi security concepts and demonstrations' },
            { name: 'Vivek Ramachandran', url: 'https://www.youtube.com/@securitytube', why: 'WiFu wireless security training' }
        ],
        specificLabs: [
            { name: 'PEN-210 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/pen210-oswp/', skills: ['Official OSWP prep'] },
            { name: 'Wireless Hacking 101', platform: 'THM', url: 'https://tryhackme.com/room/wifihacking101', skills: ['WPA2 cracking basics'] },
            { name: 'Real Hardware Testing', platform: 'Home Lab', skills: ['Aircrack-ng with Alfa adapters', 'Hands-on practice'] }
        ],
        coreTools: ['Aircrack-ng', 'Airmon-ng', 'Airodump-ng', 'Aireplay-ng', 'Bettercap', 'Wifite', 'Reaver', 'Kismet'],
        keySkills: ['Packet capture/analysis', 'Cracking handshakes', 'Deploying rogue APs', 'WPS attacks', '802.11 protocol knowledge']
    },
    'osed': {
        name: 'OSED - Offensive Security Exploit Developer',
        level: 'Expert',
        focus: 'Windows exploit development and reverse engineering',
        prerequisites: ['x86 Assembly', 'Debugging skills', 'Python programming'],
        examFormat: '48-hour exam developing multiple working exploits',
        syllabus: [
            'x86 Assembly: register manipulation, stack operations, CPU instructions',
            'Stack-Based Buffer Overflows: EIP control, bad character identification, shellcode space',
            'SEH Overflows: Structured Exception Handler exploitation, POP POP RET chains',
            'ROP Chains: Return-Oriented Programming to bypass DEP, gadget finding',
            'Egg Hunters: finding shellcode when buffer space is limited',
            'Reverse Engineering: IDA Pro usage, Ghidra analysis, static code analysis',
            'Debugging: WinDbg mastery, x64dbg, Immunity Debugger with mona.py',
            'Shellcode Development: custom payload creation, encoder writing',
            'DEP and ASLR Bypass: Data Execution Prevention and Address Space Layout Randomization mitigation',
            'Fuzzing Basics: identifying crashes and exploitable conditions'
        ],
        youtubeChannels: [
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', why: 'Binary exploitation deep dives - essential resource' },
            { name: 'Corelan Team', url: 'https://www.corelan.be/', why: 'Classic exploit development tutorials' },
            { name: 'OpenSecurityTraining', url: 'https://opensecuritytraining.info/', why: 'Free exploit development courses' },
            { name: 'FuzzySecurity', url: 'http://www.fuzzysecurity.com/', why: 'Classic exploit development guides' },
            { name: 'OALabs', url: 'https://www.youtube.com/@OALabs', why: 'Reverse engineering and malware analysis' }
        ],
        specificLabs: [
            { name: 'EXP-301 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/exp301-osed/', skills: ['Official OSED prep'] },
            { name: 'Phoenix', platform: 'Exploit Education', url: 'https://exploit.education/phoenix/', skills: ['Stack overflow practice'] },
            { name: 'Narnia', platform: 'OverTheWire', url: 'https://overthewire.org/wargames/narnia/', skills: ['Binary exploitation'] },
            { name: 'Pwn Machines', platform: 'HTB', skills: ['Binary exploitation challenges'] }
        ],
        coreTools: ['WinDbg', 'x64dbg', 'Immunity Debugger', 'mona.py', 'IDA Pro', 'Ghidra', 'GDB', 'Radare2'],
        keySkills: ['x86 Assembly coding', 'Custom shellcode development', 'Exploit chaining', 'Buffer overflow exploitation', 'ROP chain creation']
    },
    'osee': {
        name: 'OSEE - Offensive Security Exploitation Expert',
        level: 'Expert',
        focus: 'Advanced Windows internals and kernel exploitation',
        prerequisites: ['OSED certification', 'Advanced Assembly', 'OS Internals knowledge'],
        examFormat: '72-hour intense exploitation exam',
        syllabus: [
            'Kernel Exploitation: kernel mode debugging, pool overflows, use-after-free (UAF)',
            'Windows Internals: advanced heap management, memory structures, kernel objects',
            'Heap Exploitation: heap spraying, heap overflows, vtable hijacking',
            'Advanced Shellcode: custom shellcode for modern Windows mitigations',
            'Browser Exploitation: JavaScript engine exploitation, DOM manipulation',
            'Mitigation Bypass: DEP, ASLR, CFG, arbitrary write primitives',
            'Fuzzing: advanced fuzzing techniques, custom fuzzer development',
            '0-day Research: vulnerability discovery methodology, patch diffing'
        ],
        youtubeChannels: [
            { name: 'LiveOverflow', url: 'https://www.youtube.com/@LiveOverflow', why: 'Advanced exploitation techniques and concepts' },
            { name: 'Saumil Shah', url: 'https://twitter.com/saumilshah', why: 'Browser and advanced exploitation (Twitter for conference talks)' },
            { name: 'OpenSecurityTraining2', url: 'https://p.ost2.fyi/', why: 'Advanced exploitation courses' },
            { name: 'REcon Conference', url: 'https://recon.cx/', why: 'Cutting-edge security research presentations' }
        ],
        specificLabs: [
            { name: 'EXP-401 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/exp401-osee/', skills: ['Official OSEE prep'] },
            { name: 'Custom Kernel Labs', platform: 'Self-Hosted', skills: ['Kernel debugging environment'] },
            { name: 'Modern Binary Exploitation', platform: 'RPISEC', url: 'https://github.com/RPISEC/MBE', skills: ['Advanced exploitation'] }
        ],
        coreTools: ['WinDbg', 'IDA Pro', 'Binary Ninja', 'AFL (American Fuzzy Lop)', 'Visual Studio', 'Hex-Rays Decompiler'],
        keySkills: ['Kernel-mode exploitation', 'Mitigation bypass (modern Windows)', '0-day research mindset', 'Heap exploitation', 'Browser exploitation']
    },
    'osmr': {
        name: 'OSMR - Offensive Security macOS Researcher',
        level: 'Expert',
        focus: 'macOS internals, XNU kernel, and Objective-C research',
        prerequisites: ['macOS proficiency', 'Reverse engineering', 'C/Objective-C programming'],
        examFormat: '48-hour macOS exploitation exam',
        syllabus: [
            'macOS Internals: XNU kernel architecture, Mach-O binary format, dyld loading',
            'XNU Kernel: kernel debugging, kernel extensions (kexts), system calls',
            'TCC (Transparency, Consent, Control): privacy database exploitation',
            'Sandbox Bypass: escaping macOS application sandbox',
            'SIP Bypass: System Integrity Protection circumvention techniques',
            'Code Signing: understanding and bypassing code signature validation',
            'Objective-C Reversing: class-dump usage, runtime manipulation, method swizzling',
            'XPC Exploitation: Inter-Process Communication vulnerabilities',
            'Entitlements: privilege escalation through entitlement abuse',
            'macOS Malware Analysis: analyzing Mac-specific threats'
        ],
        youtubeChannels: [
            { name: 'Patrick Wardle (Objective-See)', url: 'https://objective-see.org/', why: 'THE leading macOS security researcher - essential resource' },
            { name: 'BlackHat macOS Talks', url: 'https://www.youtube.com/@BlackHatOfficialYT', why: 'State-of-the-art macOS security research presentations' },
            { name: 'macOS Security Conference', url: 'https://www.youtube.com/@ObjectivebytheSea', why: 'Objective by the Sea conference talks' }
        ],
        specificLabs: [
            { name: 'EXP-312 Course', platform: 'OffSec', url: 'https://www.offensive-security.com/exp312-osmr/', skills: ['Official OSMR prep'] },
            { name: 'Objective-See Tools', platform: 'Personal Lab', url: 'https://objective-see.org/tools.html', skills: ['macOS security tools'] },
            { name: 'macOS Internals Labs', platform: 'Self-Hosted', skills: ['XNU kernel debugging'] }
        ],
        coreTools: ['Hopper Disassembler', 'LLDB', 'Frida', 'Xcode', 'class-dump', 'otool', 'MachOView', 'dtrace'],
        keySkills: ['macOS kernel research', 'Objective-C reversing', 'XPC security analysis', 'Sandbox escapes', 'SIP bypass']
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

        const instructions = `
YOU ARE OFFSEC AI MENTOR - AN ELITE RED-TEAM TRAINER.
Your purpose is to generate an EXTREMELY DETAILED, 1-YEAR ROADMAP for ${cert}.

CORE GUIDELINES:
1. **ROLE**: Act as a senior OSCP/OSEP/OSWE mentor. Do NOT generate generic to-do lists.
2. **TIMELINE**: Strictly 1-YEAR duration with EXACTLY 11-14 phases.
3. **SOURCE MATERIAL**: Use the provided MASTER_SKILLS and RESOURCES as your absolute source of truth.
4. **CERTIFICATION FOCUS**:
   - Analyze the ${cert} syllabus logically.
   - Each certification roadmap must be UNIQUE (different tools, different mindset, different lab focus).
   - CEH focuses on tools/theory; OSCP focuses on manual exploitation/enumeration; OSEP focuses on evasion.
5. **MENTOR GUIDANCE**:
   - For every lab, provide "Mentor Key Points": explain common mistakes, how to think while solving, and red-team mindset tips.
   - Use stable, working URLs from the provided resources.
6. **WORKING LINKS ONLY**:
   - TryHackMe: https://tryhackme.com/room/[roomname]
   - HackTheBox: https://app.hackthebox.com/machines/[machinename]
   - No fake or broken links. Use links from the provided RESOURCES object.
7. **SKILL TREE**: Generate a FULL skill tree representing EVERY skill in the roadmap, not just 2-3.
8. **TAILORING**: Address these user weaknesses: ${weaknesses.join(', ')}.

PHASE STRUCTURE:
- Phases 1-3: Foundations (Networking, Linux/Windows Internals, Scripting)
- Phases 4-6: Enumeration Mastery & Initial Access
- Phases 7-9: Privilege Escalation & Active Directory (Vary depth based on cert)
- Phases 10-12: Advanced Topics (Evasion, Post-Exploitation, Cloud, etc.)
- Phases 13-14: Reporting & Mock Exam Simulations`;

        return `Create a comprehensive, 1-YEAR ${cert} learning roadmap as an Elite AI Mentor.

USER PROFILE:
- Level: ${level}
- Mode: ${mode.toUpperCase()}
- Readiness: ${assessmentResult.readinessScore || 'N/A'}%

${instructions}

REQUIREMENTS:
1. **Gap Analysis**: Detailed analysis of missing skills vs ${cert} requirements.
2. **11-14 Dynamic Phases**: Each MUST include:
   - "why_it_matters": Syllabus alignment for ${cert}.
   - "mentor_notes": Critical mindset tips and common pitfalls for this phase.
   - "mandatory_labs": WORKING URLs and "key_points" (mindset/enumeration tips).
   - "tools": Why & how to use specific flags/features.
   - "resources": YouTube, Web, and Book recommendations.
   - "completion_checklist": Measurable goals.
3. **Skill Tree**: Radial structure with categories (Foundation, Enumeration, Exploitation, Post-Exploitation, Exam Strategy).
4. **Tools Mastery Guide**: Deep dive into 5-8 critical tools with specific commands.
5. **Special Resource**: Rickroll at the end.

STRICT RULES:
- Ground all technical content in these skills: ${JSON.stringify(MASTER_SKILLS)}
- Use these verified resources: ${JSON.stringify(resources.youtube.channels)}
- RESPOND WITH PURE JSON ONLY.

JSON FORMAT:
{
  "targetCertification": "${cert}",
  "roadmap": [
    {
      "phase": 1,
      "phase_name": "[Name]",
      "why_it_matters": "[Alignment]",
      "mentor_notes": "[Red-team mindset tips]",
      "duration_weeks": 4,
      "learning_outcomes": ["Specific outcome 1", "Specific outcome 2"],
      "mandatory_labs": [
        {
          "name": "Lab Name",
          "platform": "HTB|THM|PortSwigger",
          "url": "WORKING URL",
          "key_points": "Enumeration steps and pitfalls"
        }
      ],
      "tools": [{"name": "Tool", "how_to_use": "Why and specific flags"}],
      "resources": [{"type": "YouTube|Web|Book", "name": "Name", "url": "URL", "description": "Why this resource"}],
      "completion_checklist": ["Goal 1", "Goal 2"]
    }
  ],
  "skill_tree": {
    "categories": [
      {
        "name": "Category",
        "skills": [{"name": "Skill", "level": "Beginner|Intermediate|Advanced", "icon": "emoji"}]
      }
    ]
  },
  "tools_mastery_guide": [
    {
      "tool": "Tool Name",
      "commands": [{"cmd": "nmap -sC -sV", "purpose": "Default scripts and versioning"}]
    }
  ],
  "special_resource": { "name": "Secret Cyber Wisdom", "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
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

// PDF Generation endpoint using iLovePDF
app.post('/api/generate-pdf', async (req, res) => {
    let tempHtmlPath = null;
    let tempPdfPath = null;

    try {
        const { html, filename } = req.body;
        
        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Prioritize custom keys from headers for BYOK support
        const publicKey = req.customKeys?.ilovepdfPublic || ILOVEPDF_PUBLIC_KEY;
        const secretKey = req.customKeys?.ilovepdfSecret || ILOVEPDF_SECRET_KEY;

        if (!publicKey || !secretKey) {
            return res.status(503).json({ 
                error: 'PDF generation service is not configured. Please contact the administrator.' 
            });
        }

        console.log('📄 Generating PDF via iLovePDF API...');

        // Initialize iLovePDF API
        const instance = new ILovePDFApi(publicKey, secretKey);
        
        // Create a temporary HTML file
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const timestamp = Date.now();
        tempHtmlPath = path.join(tempDir, `roadmap-${timestamp}.html`);
        tempPdfPath = path.join(tempDir, `roadmap-${timestamp}.pdf`);
        
        // Write HTML to temporary file
        fs.writeFileSync(tempHtmlPath, html, 'utf8');
        
        // Start HTML to PDF task
        const task = instance.newTask('htmlpdf');
        await task.start();
        
        // Upload HTML file using ILovePDFFile object
        const file = new ILovePDFFile(tempHtmlPath);
        await task.addFile(file);
        
        // Process the conversion
        await task.process();
        
        // Download the generated PDF buffer
        const pdfBuffer = await task.download();
        
        console.log('✅ PDF generated successfully');
        
        // Send PDF as response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'roadmap.pdf'}"`);
        res.send(Buffer.from(pdfBuffer));
        
    } catch (error) {
        console.error('❌ PDF generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate PDF. Please try again or use the JSON export option.',
            details: error.message 
        });
    } finally {
        // Clean up temporary files
        try {
            if (tempHtmlPath && fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
            if (tempPdfPath && fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
        } catch (cleanupError) {
            console.warn('⚠️  Temporary file cleanup failed:', cleanupError.message);
        }
    }
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
