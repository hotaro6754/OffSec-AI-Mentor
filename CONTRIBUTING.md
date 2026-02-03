# Contributing to OffSec AI Mentor

Thank you for your interest in contributing! This project aims to help aspiring penetration testers learn through AI-powered mentorship.

## Code of Conduct

### Core Principles
- **Educational Focus**: All contributions must support learning, not exploitation
- **Ethical Standards**: No exploit code, payloads, or attack automation
- **Inclusive Learning**: Support learners at all skill levels
- **Responsible AI**: Maintain ethical constraints in prompts

## How to Contribute

### Reporting Issues
1. Check if the issue already exists
2. Provide clear description and steps to reproduce
3. Include:
   - Your OS and Python version
   - Error messages (if any)
   - What you expected vs. what happened

### Suggesting Features
Ideas we'd love to see:
- Additional learning modules
- Better prompt engineering
- UI/UX improvements
- Documentation enhancements
- Accessibility features
- Internationalization

### Code Contributions

#### Before You Start
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Keep changes focused and atomic

#### Development Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/OffSec-AI-Mentor.git
cd OffSec-AI-Mentor

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your API key for testing
```

#### Code Style
- Follow PEP 8 guidelines
- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions focused and single-purpose
- Maximum line length: 100 characters

Example:
```python
def calculate_skill_level(correct_answers, total_questions):
    """
    Calculate user skill level based on assessment results.
    
    Args:
        correct_answers: Number of correct answers
        total_questions: Total questions asked
    
    Returns:
        Skill level string: "Beginner", "Foundation", or "Intermediate"
    """
    score = (correct_answers / total_questions) * 100
    
    if score < 40:
        return "Beginner"
    elif score < 70:
        return "Foundation"
    else:
        return "Intermediate"
```

#### Prompt Engineering Guidelines

When modifying prompts in `prompts.py`:

**Must Include:**
- Clear role definition
- Ethical constraints (no exploits/payloads)
- Educational focus
- Examples of expected behavior

**Example:**
```python
NEW_FEATURE_PROMPT = BASE_SYSTEM_PROMPT + """

ROLE: [Define the AI's role clearly]

TASK: [What the AI should help with]

CRITICAL CONSTRAINTS:
- Do NOT provide exploit code or payloads
- Do NOT give step-by-step attack commands
- DO focus on methodology and reasoning
- DO ask guiding questions

STYLE: [How the AI should communicate]
"""
```

### Testing Your Changes

#### Manual Testing Checklist
- [ ] Application starts without errors
- [ ] All tabs/features load correctly
- [ ] API calls work with valid key
- [ ] Error handling works (test with invalid key)
- [ ] UI is responsive
- [ ] No console errors in browser
- [ ] Ethical constraints are maintained in AI responses

#### Test with Different Scenarios
```bash
# Test skill assessment
# Test roadmap generation
# Test enumeration coach with sample Nmap output
# Test report helper with sample finding
```

### Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Add comments in code

2. **Commit messages**
   ```
   # Good commit messages
   Add enumeration coach dark mode support
   Fix API error handling in skill assessment
   Update prompts to improve report formatting
   
   # Bad commit messages
   Fixed stuff
   Update
   Changes
   ```

3. **Create Pull Request**
   - Provide clear description of changes
   - Link related issues
   - Include screenshots for UI changes
   - List testing performed

4. **PR Template**
   ```markdown
   ## Description
   Brief description of what this PR does
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Prompt improvement
   
   ## Testing Performed
   - [ ] Tested locally
   - [ ] Tested all affected features
   - [ ] Checked ethical constraints
   
   ## Screenshots (if applicable)
   
   ## Additional Notes
   ```

## Areas for Contribution

### High Priority
- [ ] Add unit tests
- [ ] Improve error handling
- [ ] Add conversation export feature
- [ ] Optimize token usage
- [ ] Mobile responsiveness

### Medium Priority
- [ ] Add more learning modes
- [ ] Expand prompt engineering
- [ ] Add progress tracking
- [ ] Create sample datasets
- [ ] Improve UI/UX

### Nice to Have
- [ ] Multi-language support
- [ ] Integration with TryHackMe API
- [ ] Offline mode (with local LLM)
- [ ] Voice input support
- [ ] Custom prompt templates

## Ethical Guidelines for AI Features

### ✅ Acceptable Contributions
- Teaching enumeration methodology
- Explaining security concepts
- Guiding professional development
- Improving documentation skills
- Career path guidance

### ❌ Unacceptable Contributions
- Adding exploit databases
- Integrating vulnerability scanners
- Automating attacks
- Payload generators
- Credential stuffing tools
- Bypassing ethical constraints

### Gray Areas (Discuss First)
- Tool integration (discuss which tools)
- Output parsing (ensure educational focus)
- Automation features (ensure no attack automation)

## Community

### Getting Help
- Open an issue for questions
- Use GitHub Discussions for ideas
- Check existing documentation first

### Recognition
Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers this project.

## Questions?

Feel free to open an issue labeled "question" or start a discussion.

---

Thank you for helping make offensive security education more accessible! 🎓🔒
