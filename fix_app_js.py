import sys

def find_closing_brace(text, start_index):
    stack = 0
    for i in range(start_index, len(text)):
        if text[i] == '{':
            stack += 1
        elif text[i] == '}':
            stack -= 1
            if stack == 0:
                return i
    return -1

with open('app.js', 'r') as f:
    content = f.read()

# Function to remove a function by name
def remove_function(text, name):
    pattern = f"function {name}"
    start_pos = text.find(pattern)
    if start_pos == -1:
        return text

    brace_pos = text.find('{', start_pos)
    if brace_pos == -1:
        return text

    end_pos = find_closing_brace(text, brace_pos)
    if end_pos == -1:
        return text

    # Return text without the function
    return text[:start_pos] + text[end_pos+1:]

# First, let's restore initMentorChat to a clean state by removing the messed up version
# Find the first 'function initMentorChat'
start_pos = content.find("function initMentorChat")
if start_pos != -1:
    # We want to replace it with the NEW version
    new_init = """function initMentorChat() {
    // Check assessment
    if (!appState.assessment) {
        // Hide mentor section if accessed prematurely
        document.getElementById('mentorSection')?.classList.add('hidden');
        return;
    }

    elements.chatHistory.innerHTML = '';
    appState.mentorChat = [];

    const welcomeText = "Hi! I’m KaliGuru — your ethical Kali Linux mentor for authorized labs only.\\n\\nEverything we discuss is strictly for TryHackMe, HTB, VulnHub, self-owned labs, etc.\\n\\nWhich lab, machine, or topic are you working on right now? 😎";

    const welcomeMsg = {
        role: 'mentor',
        text: welcomeText
    };

    appState.mentorChat.push(welcomeMsg);
    addChatMessage(welcomeMsg);
    saveState();
}
"""
    # Find where the MESS ends. Since I messed up with multiple `initMentorChat` logic parts,
    # I'll just look for where `selectMentorIntent` function originally ended.
    # Actually, let's just look for the last '}' before 'formatMarkdown' or something.

    # Let's find 'formatMarkdown'
    format_start = content.find("function formatMarkdown")
    if format_start != -1:
        # Delete everything from the messed up initMentorChat until just before formatMarkdown
        content = content[:start_pos] + new_init + "\n\n" + content[format_start:]

# Remove any other mentions of the buttons/recommendations
content = content.replace("renderRecommendationBubbles();", "")

# Remove the intent buttons event listener in setupEventListeners or similar
# This one is trickier as it's inside another function.
# I'll just comment it out or use a simple replace if it's unique enough.
content = content.replace("if (elements.mentorIntentButtons) {", "if (false) { // Disabled buttons")

with open('app.js', 'w') as f:
    f.write(content)
