# 🧪 Testing Guide: OffSec AI Mentor

## 🛠️ Environment Setup

1. **API Keys**: Ensure you have a valid Groq API key (available at [console.groq.com](https://console.groq.com)).
2. **Local Config**: Create a `.env` file with `GROQ_API_KEY=your_key_here`.
3. **Install**: Run `npm install` to install dependencies.
4. **Start**: Run `npm start`.

---

## 📋 Test Cases

### 1. Pure AI Integrity
- **Action**: Start the server without a `GROQ_API_KEY` in `.env`.
- **Action**: Attempt to start an assessment in the UI.
- **Expected**: The app should prompt for an API key in Settings or return a clear error (not fallback questions).

### 2. Senior Mentor Roadmaps
- **Action**: Complete an assessment and generate a roadmap.
- **Expected**: The roadmap should have a section for "Mentor's Philosophy" and detailed "What You Will Do" / "What You Will Gain" for each phase.
- **Expected**: Check the tone—it should feel authoritative and inspiring, like a master talking to a junior.

### 3. Roadmap Versioning
- **Action**: Generate a roadmap for "OSCP".
- **Action**: Click "Generate New Roadmap" and generate "OSCP" again.
- **Expected**: A version selector (e.g., "Version 2") should appear, allowing you to switch back to Version 1.

### 4. OSCP Mode Auto-Selection
- **Action**: Toggle "OSCP Mode" on the hero section.
- **Action**: Complete the assessment.
- **Expected**: The app should skip the certification selection modal and generate an OSCP roadmap immediately.

### 5. Cyber Wisdom Button
- **Action**: Scroll to the bottom of any generated roadmap.
- **Action**: Click "REVEAL CYBER WISDOM".
- **Expected**: You should be redirected to the Rickroll video in a new tab.

### 6. Question Uniqueness
- **Action**: Take the assessment twice.
- **Expected**: The second assessment should contain different questions than the first, even in the same mode.

---

## 🔍 Verification Tools

- **Server Logs**: Check the console for `📤 Calling GROQ API...` and `✅ Generated 10 questions using AI`.
- **Database**: Use a SQLite browser to inspect `offsec_mentor.db` and verify that `roadmaps` table has multiple entries for your user.
- **Browser Console**: Verify that no errors occur during version switching or cert modal bypassing.

---

**Last Updated**: February 3, 2025
**Version**: 2.0 Pure AI
