import re

with open('server-v2.js', 'r') as f:
    content = f.read()

# 1. Fix the /api/mentor-chat logic
# We want to replace the part between "try {" and "if (stream) {"

old_part = """    try {
        const { message, context = {}, stream = true } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        let contextInfo = '';
        if (context.level) contextInfo += `\nLevel: ${context.level}`;
        if (context.weaknesses?.length) contextInfo += `\nFocus: ${context.weaknesses.join(', ')}`;
        if (context.cert) contextInfo += `\nTarget: ${context.cert}`;

        const prompt = `${PROMPTS.mentorChat}${contextInfo}\\n\\nUser: "${message}"`;"""

new_part = """    try {
        const { message, history = [], context = {}, stream = true } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message required' });
        }

        let contextInfo = '';
        if (context.level) contextInfo += `\nLevel: ${context.level}`;
        if (context.weaknesses?.length) contextInfo += `\nFocus: ${context.weaknesses.join(', ')}`;
        if (context.cert) contextInfo += `\nTarget: ${context.cert}`;

        // Construct conversation messages
        const messages = [
            { role: 'system', content: PROMPTS.mentorChat + contextInfo },
            ...history.map(m => ({
                role: m.role === 'mentor' ? 'assistant' : 'user',
                content: m.text
            })),
            { role: 'user', content: message }
        ];"""

content = content.replace(old_part, new_part)

# Also ensure callAI uses messages in BOTH stream and non-stream blocks
# (We already did a generic replace but let's be sure)
content = content.replace("await callAI(prompt, { expectJson: false", "await callAI(messages, { expectJson: false")

with open('server-v2.js', 'w') as f:
    f.write(content)

print("Successfully fixed server-v2.js")
