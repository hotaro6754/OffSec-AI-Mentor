import sys

with open('app.js', 'r') as f:
    lines = f.readlines()

# Fix containerMain
for i in range(len(lines)):
    if 'containerMain: document.getElementById("container-main")' in lines[i]:
        lines[i] = lines[i].replace('document.getElementById("container-main")', 'document.querySelector(".container-main")')
        # Also add missing elements
        lines[i] += '    chooseWebMode: document.getElementById("chooseWebMode"),\n'
        lines[i] += '    chooseTerminalMode: document.getElementById("chooseTerminalMode"),\n'

# Fix restoreUI
start_restore = -1
end_restore = -1
for i in range(len(lines)):
    if 'function restoreUI()' in lines[i]:
        start_restore = i
    if start_restore != -1 and lines[i].strip() == '}':
        # Check if next line is updateLearningModeUI to be sure
        if i+2 < len(lines) and 'function updateLearningModeUI()' in lines[i+2]:
            end_restore = i
            break

if start_restore != -1 and end_restore != -1:
    new_restore = [
        'function restoreUI() {\n',
        '    console.log("🔄 Restoring session...");\n',
        "    elements.bootScreen.classList.add('hidden');\n",
        '\n',
        '    if (appState.mode === "cli") {\n',
        '        switchMode("cli");\n',
        '        return;\n',
        '    }\n',
        '\n',
        '    // Ensure main container is visible for web mode\n',
        '    elements.containerMain.classList.remove("hidden");\n',
        '\n',
        '    if (elements.modeCheckbox) {\n',
        '        elements.modeCheckbox.checked = appState.learningMode === "oscp";\n',
        '        updateLearningModeUI();\n',
        '    }\n',
        '\n',
        '    if (appState.roadmap) {\n',
        '        displayRoadmap(appState.roadmap);\n',
        '        showSection("roadmapSection");\n',
        '    } else if (appState.assessment) {\n',
        '        showEvaluation();\n',
        '        showSection("evaluationSection");\n',
        '    } else if (appState.questions && appState.questions.length > 0) {\n',
        '        renderQuestion();\n',
        '        updateProgress();\n',
        '        showSection("assessmentSection");\n',
        '    } else {\n',
        '        showSection("homeSection");\n',
        '    }\n',
        '}\n'
    ]
    lines[start_restore : end_restore + 1] = new_restore

# Fix showBootScreen
start_boot = -1
end_boot = -1
for i in range(len(lines)):
    if 'function showBootScreen()' in lines[i]:
        start_boot = i
    if start_boot != -1 and lines[i].strip() == '}':
        if i+2 < len(lines) and 'function choosePrimaryMode' in lines[i+2]:
            end_boot = i
            break

if start_boot != -1 and end_boot != -1:
    new_boot = [
        'function showBootScreen() {\n',
        "    elements.bootScreen.classList.remove('hidden');\n",
        "    elements.consoleOutput.innerHTML = '';\n",
        "    elements.bootOptions.classList.add('hidden');\n",
        '\n',
        '    const logs = [\n',
        "        { type: 'ok', msg: 'Initializing KaliGuru OS Kernel...' },\n",
        "        { type: 'ok', msg: 'Loading neural interface drivers...' },\n",
        "        { type: 'ok', msg: 'Mounting knowledge base /mnt/offsec...' },\n",
        "        { type: 'ok', msg: 'Network link established: local-lab-1337' },\n",
        "        { type: 'ok', msg: 'KaliGuru Mentor is online.' }\n",
        '    ];\n',
        '\n',
        '    let delay = 0;\n',
        '    logs.forEach((log, index) => {\n',
        '        delay += (index === 0) ? 400 : 250;\n',
        '        setTimeout(() => {\n',
        "            const line = document.createElement('div');\n",
        '            line.innerHTML = `<span style="color: ${log.type===\'ok\'?\'#00ff00\':\'#ff0000\'}; font-weight: bold; margin-right: 15px;">[${log.type.toUpperCase()}]</span> ${log.msg}`;\n',
        '            elements.consoleOutput.appendChild(line);\n',
        '        }, delay);\n',
        '    });\n',
        '\n',
        '    setTimeout(() => {\n',
        "        elements.bootOptions.classList.remove('hidden');\n",
        '    }, delay + 500);\n',
        '}\n'
    ]
    lines[start_boot : end_boot + 1] = new_boot

# Add event listeners
for i in range(len(lines)):
    if "elements.sendMentorBtn?.addEventListener('click', sendMentorMessage);" in lines[i]:
        lines[i] += '    elements.chooseWebMode?.addEventListener("click", () => choosePrimaryMode("web"));\n'
        lines[i] += '    elements.chooseTerminalMode?.addEventListener("click", () => choosePrimaryMode("cli"));\n'

with open('app.js', 'w') as f:
    f.writelines(lines)
