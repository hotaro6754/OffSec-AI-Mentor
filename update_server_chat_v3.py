import re

with open('server-v2.js', 'r') as f:
    content = f.read()

# Use regex to find the block
pattern = re.compile(r'try\s*{\s*const\s*{\s*message,\s*context\s*=\s*{},\s*stream\s*=\s*true\s*}\s*=\s*req\.body;.*?const\s*prompt\s*=\s*`\${PROMPTS\.mentorChat}\${contextInfo}\\n\\nUser:\s*"\${message}"`;', re.DOTALL)

new_logic = """try {
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

if pattern.search(content):
    content = pattern.sub(new_logic, content)
    print("Pattern matched and replaced.")
else:
    print("Pattern NOT matched.")

# Final check for callAI(prompt -> callAI(messages
content = content.replace("callAI(prompt, { expectJson: false", "callAI(messages, { expectJson: false")

with open('server-v2.js', 'w') as f:
    f.write(content)
