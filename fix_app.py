import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix the double function header and missing braces
# Find where formatMarkdown(text) { is followed by async function sendMentorMessage()
content = content.replace('function formatMarkdown(text) {\nasync function sendMentorMessage()', 'async function sendMentorMessage()')

# Now I need to make sure formatMarkdown is still there and correct
# It should be after my added functions
if 'function createChatBubble(role, text) {' in content:
    # Ensure there is a closing brace for createChatBubble and then formatMarkdown
    # Wait, I inserted BEFORE formatMarkdown.
    pass

with open('app.js', 'w') as f:
    f.write(content)
