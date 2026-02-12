async function handleLoginInput(input) {
    if (terminalState.loginStep === 'user') {
        terminalState.tempUser = input;
        terminalPrint(input);
        terminalPrint("Password: ", "inline");
        terminalState.loginStep = 'pass';
    } else if (terminalState.loginStep === 'pass') {
        terminalPrint("********");
        terminalPrint("Authenticating...", "term-dim");

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername: terminalState.tempUser, password: input })
            });

            if (response.ok) {
                const data = await response.json();
                appState.sessionId = data.sessionId;
                appState.user = data.user;
                localStorage.setItem('sessionId', data.sessionId);
                terminalState.inLogin = false;
                terminalPrint("ACCESS GRANTED", "term-green term-bold");
                setTimeout(showTerminalWelcome, 500);
            } else {
                terminalPrint("ACCESS DENIED", "term-red term-bold");
                terminalPrint("Username: ", "inline");
                terminalState.loginStep = 'user';
            }
        } catch (e) {
            terminalPrint("Connection Error.", "term-red");
            terminalPrint("Username: ", "inline");
            terminalState.loginStep = 'user';
        }
    }
}

function handleConfigInput(input) {
    if (terminalState.configStep === 0) {
        if (input) localStorage.setItem('groq_api_key', input);
        terminalPrint("Groq Key Set.");
        terminalPrint("Enter Gemini API Key (optional): ", "inline");
        terminalState.configStep = 1;
    } else if (terminalState.configStep === 1) {
        if (input) localStorage.setItem('gemini_api_key', input);
        terminalPrint("Gemini Key Set.");
        terminalPrint("Enter DeepSeek API Key (optional): ", "inline");
        terminalState.configStep = 2;
    } else if (terminalState.configStep === 2) {
        if (input) localStorage.setItem('deepseek_api_key', input);
        terminalPrint("Configuration Complete.");
        terminalState.inConfig = false;
        terminalPrint("Type 'help' to begin.", "term-dim");
    }
}

function showTerminalWelcome() {
    const banner = `
 <span class="term-blue"> _  __     _ _  ____                     </span>
 <span class="term-blue">| |/ /__ _| (_) / ___| _   _ _ __ _   _  </span>
 <span class="term-blue">| ' / _\\ | | | | |  _ | | | | '__| | | | </span>
 <span class="term-blue">| . \\\\ (_| | | | | |_| | |_| | |  | |_| | </span>
 <span class="term-blue">|_|\\\\_\\\\__,_|_|_|  \____|\\__,_|_|   \__,_| </span>
 <span class="term-white">   Ethical OffSec AI Mentor CLI Simulation v3.1</span>
 <span class="term-dim">   User: ${appState.user?.username || 'Guest'} | Status: ${appState.pwned ? 'PWNED' : 'SECURE'}</span>`;

    const pre = document.createElement('pre');
    pre.innerHTML = banner;
    elements.terminalOutput.appendChild(pre);
    terminalPrint("Welcome back, Commander.", "term-green");

    const hasKey = localStorage.getItem('groq_api_key') || localStorage.getItem('gemini_api_key') || localStorage.getItem('deepseek_api_key');
    if (!hasKey) {
        terminalPrint("\n[!] WARNING: AI Services not configured.", "term-yellow");
        terminalPrint("Type 'setup' to configure API keys.", "term-dim");
    }

    terminalPrint("\nType 'help' for available commands.", "term-dim");
}
