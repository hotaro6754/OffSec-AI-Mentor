# 🤖 OffSec AI Mentor - Mini Community Project (MCP)

## 🏆 Submission for the OffSec "Build with AI" Challenge

**OffSec AI Mentor** is a specialized, AI-powered study planner and resource recommender built by the community, for the community. It is designed to help learners navigate the rigorous path to OffSec certifications (OSCP, OSEP, OSWE, and more) by providing personalized guidance, objective skill assessment, and high-fidelity roadmaps.

---

### 🧠 Meet KaliGuru: Not Just Another Chatbot

Unlike generic AI assistants, **KaliGuru** is the heart of this platform—a specialized mentor designed with a "Lab-First" philosophy.

**What Makes KaliGuru Unique?**
- **Strict Ethical Guardrails**: Refuses real-world targeting and mandates authorized lab confirmation (THM, HTB, Proving Grounds).
- **Mentor-Style Interaction**: Doesn't just give answers; it coaches you on the "why" behind every tool and technique.
- **MITRE ATT&CK Integration**: Every technique is mapped to the ATT&CK framework with detection and mitigation insights.
- **Modern Kali Linux Expertise**: Fully aware of Kali 2025.2 updates, new tools, and safer defaults.
- **Shorthand Reporting Aesthetic**: Uses professional pentester markers (`[+]`, `[-]`, `[!]`, `[*]`, `[>]`) in responses.
- **Certification Tailoring**: Adjusts guidance depth and complexity based on your target (OSCP, OSEP, OSWE, OSDA, OSED).

---

## 💡 Project Impact: Who Does This Help?

- **Absolute Zeroes**: Those with no IT background get a gentle "Stage 0" foundation path.
- **Certification Aspirants**: Specific guidance for **13+ certifications** ranging from entry-level (eJPT, CEH) to elite OffSec Expert paths (OSEE, OSMR).
- **Stuck Learners**: The "OSCP Mode" provides brutal, honest evaluation to identify precisely where a learner's mindset or technical gaps are.
- **The Community**: A free, open tool that aggregates the best community resources (YouTube, HTB, THM, OTW) into one structured experience.

---

## ✨ Key AI Features & Implementation

### 1. **Neural Skill Assessment (Groq + LLaMA 3.3)**
- **Dynamic Questioning**: Uses LLaMA 3.3 (70B) via the Groq API for lightning-fast, scenario-based technical questions.
- **Mode-Specific Logic**:
    - **Beginner Mode**: Encouraging, foundational, and jargon-free.
    - **OSCP Mode**: Brutal, exam-level scenarios that test methodology, not just facts.

### 2. **KaliGuru Mentor Chat**
- **Terminal Interface**: A specialized chat experience with a `KALIGURU@OFFSEC:~$` terminal aesthetic.
- **Intelligent Tool Guidance**: Step-by-step guidance for 15+ core Kali Linux tools including Nmap, Metasploit, Burp Suite, and the Impacket suite.
- **Lab Strategy**: Helps plan reconnaissance, enumeration, and exploitation logic for authorized labs.
- **MITRE Mapping**: Automatically bridges red ↔ blue understanding by showing relevant ATT&CK IDs.

### 3. **Personalized Neural Roadmaps**
- **Gap Analysis**: AI analyzes assessment performance to identify strengths, weaknesses, and "Confidence Gaps".
- **Certification Segregation**: Generates unique paths for 13+ certifications, ensuring the syllabus alignment is 100% accurate.
- **Clickable Resource Engine**: Automatically curates working links for YouTube channels, technical books, and lab environments.

### 4. **Progress Persistence & Database Integration**
- Automatically saves assessment results, chat history, and multiple roadmap versions to a local SQLite database for continuous learning tracking.

---

## 🏗️ Neo-Brutalist v3.0 UI

The project features a unique **Neo-Brutalist Hacker Aesthetic**:
- **High-Contrast Design**: Bold black borders, vibrant accents, and sharp edges.
- **Interactive Skill Constellation**: A professional, SVG-based hierarchical tree visualizing your learning journey.
- **Terminal Boot Animation**: A cinematic entry experience that sets the tone for an OffSec learner.
- **Developer Jokes & Easter Eggs**: Keeps the "Try Harder" mindset fun with rotating jokes and a special "Mentor's Final Gift" (Rickroll).

---

## 🚀 Technical Stack

- **Frontend**: Vanilla JS, HTML5, CSS3 (No frameworks, pure speed).
- **Backend**: Node.js (Express), SQLite (better-sqlite3).
- **AI Stack**: Groq API (LLaMA 3.3 70B Versatile).
- **Security**: "Bring Your Own Key" (BYOK) support for users to bypass rate limits safely.

---

## 📦 Getting Started

### Prerequisites
- Node.js v18+
- Groq API Key (Get one free at [console.groq.com](https://console.groq.com))

### Installation
1. Clone the repo: `git clone https://github.com/hotaro6754/OffSec-AI-Mentor.git`
2. Install: `npm install`
3. Set `.env`: Add `GROQ_API_KEY=your_key`
4. Run: `node server-v2.js`
5. Explore: `http://localhost:3000`

---

## 📺 Demo Video
*[Link to your demo video here]*

---

## 🛡️ Ethical Disclaimer
This tool provides **educational guidance only**. It does not teach hacking, provide exploit code, or guarantee exam success. It is built to mentor the next generation of ethical hackers with integrity and the "Try Harder" spirit.

---

**Built with ❤️ for the OffSec Community by [Your Name/Handle]**
**#OffSec #AI #CyberSecurity #OSCP #HackingMentor**
