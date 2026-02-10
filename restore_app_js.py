with open('app.js', 'r') as f:
    lines = f.readlines()

# Find the first occurrence of // BOOT, TERMINAL
target_index = -1
for i, line in enumerate(lines):
    if "// ============================================================================" in line and i + 1 < len(lines) and "// BOOT, TERMINAL" in lines[i+1]:
        target_index = i
        break

if target_index != -1:
    new_lines = lines[:target_index]
    with open('app.js', 'w') as f:
        f.writelines(new_lines)

    with open('app.js', 'a') as f:
        f.write("""// ============================================================================
// BOOT, TERMINAL & CTF INTEGRATION
// ============================================================================

function showBootScreen() {
    elements.bootScreen.classList.remove('hidden');
    elements.consoleOutput.innerHTML = '';
    elements.bootOptions.classList.add('hidden');

    const logs = [
        { type: 'ok', msg: 'Initializing KaliGuru OS Kernel...' },
        { type: 'ok', msg: 'Loading neural interface drivers...' },
        { type: 'ok', msg: 'Mounting knowledge base /mnt/offsec...' },
        { type: 'ok', msg: 'Network link established: local-lab-1337' },
        { type: 'ok', msg: 'KaliGuru Mentor is online.' }
    ];

    let delay = 0;
    logs.forEach((log, index) => {
        delay += (index === 0) ? 400 : 250;
        setTimeout(() => {
            const line = document.createElement('div');
            line.innerHTML = `<span style="color: ${log.type==='ok'?'#00ff00':'#ff0000'}; font-weight: bold; margin-right: 15px;">[${log.type.toUpperCase()}]</span> ${log.msg}`;
            elements.consoleOutput.appendChild(line);
        }, delay);
    });

    setTimeout(() => {
        elements.bootOptions.classList.remove('hidden');
    }, delay + 500);
}

function choosePrimaryMode(mode) {
    if (mode === 'web') {
        switchMode('web');
    } else {
        elements.bootOptions.innerHTML = `
            <div class="boot-menu">
                <p>Select CLI Training Level:</p>
                <button class="btn btn-primary" onclick="chooseCliSubMode('beginner')">A. Beginner Mode</button>
                <button class="btn btn-danger" onclick="chooseCliSubMode('oscp')">B. OSCP Readiness (Advanced/Spooky)</button>
            </div>
        `;
    }
}

function chooseCliSubMode(subMode) {
    appState.terminalSubMode = subMode;
    if (subMode === 'oscp') {
        document.body.classList.add('mode-oscp-spooky');
    } else {
        document.body.classList.remove('mode-oscp-spooky');
    }
    switchMode('cli');
}

function switchMode(mode) {
    appState.mode = mode;
    saveState();
    elements.bootScreen.classList.add('hidden');
    if (mode === 'web') {
        elements.terminalMode.classList.add('hidden');
        elements.containerMain.classList.remove('hidden');
        showSection('homeSection');
    } else {
        elements.containerMain.classList.add('hidden');
        elements.terminalMode.classList.remove('hidden');
        elements.terminalInput.focus();
        if (!terminalState.initialized) initTerminal();
    }
}

let terminalState = {
    initialized: false,
    cwd: '~',
    inChat: false,
    inAssessment: false,
    history: [],
    historyIndex: -1,
    pwned: false
};

function initTerminal() {
    terminalState.initialized = true;
    terminalPrint("KaliLinux Kernel 6.5.0-kali3-amd64 x86_64", "term-blue");
    terminalPrint("Welcome to KaliGuru CLI Simulation.", "term-white");
    terminalPrint("Type 'help' for available commands.", "term-dim");

    elements.terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = e.target.value;
            handleTerminalCommand(cmd);
            e.target.value = '';
        }
    });
}

function terminalPrint(text, className = '') {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    elements.terminalOutput.appendChild(line);
    elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
}

function handleTerminalCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    terminalPrint(`root@kali:${terminalState.cwd}# ${trimmed}`, 'term-bold');

    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
        case 'help':
            terminalPrint("Available commands: ls, cat, whoami, clear, exit, mentor, assessment, roadmap, flappy");
            break;
        case 'ls':
            terminalPrint("about.txt  secret_flag.txt.enc  labs/");
            break;
        case 'whoami':
            terminalPrint("root");
            break;
        case 'clear':
            elements.terminalOutput.innerHTML = '';
            break;
        case 'exit':
            switchMode('web');
            break;
        case 'mentor':
            terminalState.inChat = true;
            terminalPrint("Connected to KaliGuru. Type 'exit' to quit chat.");
            break;
        default:
            terminalPrint(`Command not found: ${command}`, 'term-red');
    }
}
""")
else:
    print("Could not find insertion point")
