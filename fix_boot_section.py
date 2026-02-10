import sys
import re

with open('app.js', 'r') as f:
    content = f.read()

# Target the messy area
pattern = r'// BOOT, TERMINAL & CTF INTEGRATION.*?function switchMode'
replacement = """// BOOT, TERMINAL & CTF INTEGRATION
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

function switchMode"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('app.js', 'w') as f:
    f.write(content)
