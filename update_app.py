import re

with open('app.js', 'r') as f:
    content = f.read()

# Update initMentorChat
new_init_mentor_chat = """function initMentorChat() {
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
}"""

content = re.sub(r'function initMentorChat\(\) \{.*?\}', new_init_mentor_chat, content, flags=re.DOTALL)

# Remove renderRecommendationBubbles
content = re.sub(r'function renderRecommendationBubbles\(\) \{.*?\}', '', content, flags=re.DOTALL)

# Remove selectMentorIntent
content = re.sub(r'function selectMentorIntent\(button\) \{.*?\}', '', content, flags=re.DOTALL)

# Remove the intent buttons event listener in setupEventListeners or similar
content = re.sub(r'// Intent buttons.*?if \(elements\.mentorIntentButtons\) \{.*?\}', '', content, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(content)
