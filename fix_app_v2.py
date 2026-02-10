import sys
import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix restoreUI
pattern_restore = r'function restoreUI\(\) \{.*?\}'
replacement_restore = """function restoreUI() {
    console.log("🔄 Restoring session...");
    elements.bootScreen.classList.add('hidden');

    if (appState.mode === "cli") {
        switchMode("cli");
        return;
    }

    // Ensure main container is visible for web mode
    elements.containerMain.classList.remove("hidden");

    if (elements.modeCheckbox) {
        elements.modeCheckbox.checked = appState.learningMode === "oscp";
        updateLearningModeUI();
    }

    if (appState.roadmap) {
        displayRoadmap(appState.roadmap);
        showSection("roadmapSection");
    } else if (appState.assessment) {
        showEvaluation();
        showSection("evaluationSection");
    } else if (appState.questions && appState.questions.length > 0) {
        renderQuestion();
        updateProgress();
        showSection("assessmentSection");
    } else {
        showSection("homeSection");
    }
}"""
content = re.sub(pattern_restore, replacement_restore, content, flags=re.DOTALL)

# Fix containerMain selector
content = content.replace('containerMain: document.getElementById("container-main")', 'containerMain: document.querySelector(".container-main")')

# Add missing button elements
content = content.replace('bootOptions: document.getElementById("boot-options"),', 'bootOptions: document.getElementById("boot-options"),\n    chooseWebMode: document.getElementById("chooseWebMode"),\n    chooseTerminalMode: document.getElementById("chooseTerminalMode"),')

# Fix showBootScreen
pattern_boot = r'function showBootScreen\(\) \{.*?\}'
replacement_boot = """function showBootScreen() {
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
}"""
content = re.sub(pattern_boot, replacement_boot, content, flags=re.DOTALL)

# Add event listeners for mode buttons
content = content.replace('elements.sendMentorBtn?.addEventListener(\'click\', sendMentorMessage);', 'elements.sendMentorBtn?.addEventListener(\'click\', sendMentorMessage);\n    elements.chooseWebMode?.addEventListener("click", () => choosePrimaryMode("web"));\n    elements.chooseTerminalMode?.addEventListener("click", () => choosePrimaryMode("cli"));')

with open('app.js', 'w') as f:
    f.write(content)
