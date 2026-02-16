import re

with open('app.js', 'r') as f:
    content = f.read()

# Identify the block to replace
# From initMentorChat to getRandomQuote (exclusive)
start_marker = 'function initMentorChat() {'
end_marker = 'function getRandomQuote() {'

block_match = re.search(rf'{re.escape(start_marker)}.*?{re.escape(end_marker)}', content, re.DOTALL)
if block_match:
    new_block = """function initMentorChat() {
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

async function sendMentorMessage() {
    const input = elements.mentorInput;
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Add user message to UI and state
    const userMsg = { role: 'user', text };
    if (!appState.mentorChat) appState.mentorChat = [];
    appState.mentorChat.push(userMsg);
    addChatMessage(userMsg);

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Prepare context
    const context = {
        level: appState.learningMode,
        cert: appState.selectedCert,
        weaknesses: appState.assessment?.weaknesses || []
    };

    try {
        // Create placeholder for mentor response
        const mentorMsg = { role: 'mentor', text: '' };
        const bubble = createChatBubble(mentorMsg.role, '');
        elements.chatHistory.appendChild(bubble);
        const contentDiv = bubble.querySelector('.message-content');

        // Initial scroll
        bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });

        // Call API (streaming)
        const response = await fetch('/api/mentor-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.sessionId}`
            },
            body: JSON.stringify({ message: text, context, stream: true })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\\n');

            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    const data = line.trim().slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices?.[0]?.delta?.content) {
                            fullText += parsed.choices[0].delta.content;
                            contentDiv.innerHTML = formatMarkdown(fullText);
                            // Auto scroll during stream
                            bubble.scrollIntoView({ behavior: 'auto', block: 'end' });
                        }
                    } catch (e) {
                        // Not JSON or partial JSON
                    }
                }
            }
        }

        // Save mentor message to state
        mentorMsg.text = fullText;
        appState.mentorChat.push(mentorMsg);
        saveState();

    } catch (error) {
        console.error('Mentor chat error:', error);
        addChatMessage({ role: 'mentor', text: 'Sorry, I encountered an error. Please check your connection or try again.' });
    }
}

function addChatMessage(msg, scroll = true) {
    if (!elements.chatHistory) return;
    const bubble = createChatBubble(msg.role, msg.text);
    elements.chatHistory.appendChild(bubble);
    if (scroll) {
        bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

function createChatBubble(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.innerHTML = `<div class="message-content">${formatMarkdown(text)}</div>`;
    return div;
}

function formatMarkdown(text) {
    if (!text) return '';

    // Basic HTML escaping for safety
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert links: [text](url)
    let html = escaped.replace(/\\\\[([^\\\\]+)\\\\]\\\\(([^)]+)\\\\)/g, '<a href="$2" target="_blank" class="res-link-inline">$1</a>');

    // Convert bold: **text** or __text__
    html = html.replace(/(\\\\*\\\\*|__)(.*?)\\\\1/g, '<strong>$2</strong>');

    // Convert code: `text`
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Convert newlines to <br>
    html = html.replace(/\\\\n/g, '<br>');

    return html;
}

"""
    content = content[:block_match.start()] + new_block + content[block_match.end():]

with open('app.js', 'w') as f:
    f.write(content)
