async function processCommand(cmdLine) {
    const parts = cmdLine.split(" ");
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case "help":
            terminalPrint("COMMANDS:", "term-blue term-bold");
            terminalPrint("  assess    - Start dynamic assessment", "term-white");
            terminalPrint("  roadmap   - Generate roadmap (e.g. 'roadmap oscp')", "term-white");
            terminalPrint("  chat      - Talk to KaliGuru Mentor", "term-white");
            terminalPrint("  setup     - Configure API keys", "term-white");
            terminalPrint("  ls / cat  - File system", "term-white");
            terminalPrint("  clear     - Clear screen", "term-white");
            terminalPrint("  exit      - Return to Web UI", "term-white");
            break;
        case "assess": startTerminalAssessment(); break;
        case "roadmap": startTerminalRoadmap(args[0]); break;
        case "chat":
            terminalPrint("Chat Mode enabled. Type 'exit' to quit.", "term-dim");
            terminalState.inChat = true;
            break;
        case "setup":
            terminalPrint("CONFIGURING API KEYS...", "term-blue");
            terminalPrint("Enter Groq API Key: ", "inline");
            terminalState.inConfig = true;
            terminalState.configStep = 0;
            break;
        case "clear": elements.terminalOutput.innerHTML = ""; break;
        case "ls": terminalPrint("about.txt  roadmap_sample.txt  labs/  pwn_instructions.txt"); break;
        case "cat": handleCat(args[0]); break;
        case "whoami": terminalPrint(appState.user ? appState.user.username : "Guest"); break;
        case "exit": choosePrimaryMode("web"); break;
        case "flappy": startFlappy(); break;
        default: terminalPrint(`Command not found: ${cmd}. Type 'help' for options.`, "term-red");
    }
}
