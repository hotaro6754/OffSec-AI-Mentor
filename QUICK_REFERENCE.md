# ⚡ Quick Reference Card

## 🚀 Quick Start
```bash
./start.sh                    # Automated setup & launch
# OR
streamlit run app.py          # Manual launch
```

## 📁 File Structure
```
app.py              → Main application (430+ lines)
prompts.py          → AI prompts & ethical constraints
requirements.txt    → Dependencies
.env               → Your API key (create from .env.example)
start.sh           → Automated setup script
README.md          → Full documentation
PROJECT_OVERVIEW.md → Technical deep-dive
```

## 🔑 Environment Setup
```bash
# .env file format:
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo
```

## 📊 Features at a Glance

| Feature | Purpose | Input | Output |
|---------|---------|-------|--------|
| 🎯 **Skill Assessment** | Evaluate knowledge | Answer questions | Skill level, strengths, weaknesses |
| 🗺️ **Learning Roadmap** | Personalized plan | Assessment results | Study plan, tools, timeline |
| 🔍 **Enumeration Coach** | Understand scans | Paste scan output | What it means, what's next |
| 📝 **Report Helper** | Professional docs | Finding description | Formatted report section |

## 🎨 Learning Modes

| Mode | Best For | Style |
|------|----------|-------|
| **Beginner** | New learners | Detailed, explains terms |
| **OSCP** | Exam prep | Hints, "Try Harder" |
| **Red Team** | Advanced | Methodology, OPSEC |

## 💻 Common Commands

```bash
# Setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run
streamlit run app.py

# Different port
streamlit run app.py --server.port 8502

# Check Python syntax
python3 -m py_compile app.py prompts.py
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| API error | Check `.env` file, verify API key |
| Module not found | `pip install -r requirements.txt` |
| Slow responses | Change to `gpt-3.5-turbo` in `.env` |
| Port busy | Use `--server.port 8502` |
| Command not found | Activate venv: `source venv/bin/activate` |

## 🔧 Quick Customizations

### Change AI Model
```env
# In .env file:
OPENAI_MODEL=gpt-3.5-turbo  # Fast & cheap
OPENAI_MODEL=gpt-4          # Better quality
```

### Modify AI Behavior
```python
# In prompts.py:
ENUMERATION_COACH_PROMPT += "\nALWAYS mention [your preference]"
```

### Add Custom CSS
```python
# In app.py, modify st.markdown with custom style:
st.markdown("""<style> .your-class { ... } </style>""")
```

## 📈 Cost Estimates

| Model | Per Session | Per Month (moderate use) |
|-------|-------------|-------------------------|
| GPT-3.5 | $0.01-0.05 | $5-15 |
| GPT-4 | $0.20-1.00 | $20-50 |

## ✅ Testing Checklist

- [ ] Run `./start.sh` successfully
- [ ] See "✅ API Key Configured" in sidebar
- [ ] Complete skill assessment (2-3 questions)
- [ ] Generate roadmap
- [ ] Analyze sample Nmap output
- [ ] Create sample report

## 📝 Sample Test Data

**Nmap Output:**
```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1
80/tcp open  http    Apache httpd 2.4.41
```

**Report Finding:**
```
Title: Default Administrative Credentials
Details: Found admin/admin on port 8080
Severity: High
```

## 🛡️ Ethical Reminders

✅ **The AI WILL:**
- Teach methodology
- Explain reasoning
- Guide learning
- Ask questions

❌ **The AI will NOT:**
- Provide exploits
- Give payloads
- Automate attacks
- Name specific CVEs

## 🔗 Important Links

- **Get API Key**: https://platform.openai.com/api-keys
- **Streamlit Docs**: https://docs.streamlit.io/
- **TryHackMe**: https://tryhackme.com
- **HackTheBox**: https://hackthebox.com

## 📦 Dependencies Explained

```
streamlit==1.31.0    → Web framework
openai==1.12.0       → API client
python-dotenv==1.0.1 → Environment variables
```

## 🎯 Typical Workflows

**Complete Beginner:**
```
1. Skill Assessment → Get level
2. Learning Roadmap → Get plan
3. Follow TryHackMe recommendation
4. Use Enumeration Coach for scans
5. Practice Report Helper
```

**OSCP Prep:**
```
1. Assessment (OSCP Mode) → Find gaps
2. Roadmap → Focus areas
3. HTB practice → Apply learning
4. Report every box
```

## 💡 Pro Tips

1. **Start with Beginner Mode** even if experienced
2. **Complete assessment first** for personalized roadmap
3. **Use real scan outputs** from practice labs
4. **Document everything** with Report Helper
5. **Ask "why"** in your inputs for better responses
6. **Switch modes** as you progress

## 🚨 When Things Go Wrong

```bash
# Nuclear option - fresh start
rm -rf venv
rm .env
./start.sh
```

## 📞 Getting Help

1. Check `README.md` for detailed docs
2. Read `PROJECT_OVERVIEW.md` for technical details
3. Open GitHub issue for bugs
4. Check Streamlit community for framework issues

## 🎓 Remember

This tool is a **learning companion**, not a shortcut.
Real understanding comes from **practice and persistence**.

---

**Happy Learning!** 🎓🔒

Quick access: `cat QUICK_REFERENCE.md` or open in your editor
