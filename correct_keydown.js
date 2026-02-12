function handleTerminalKeydown(e) {
    if (e.key === "Enter") {
        const input = elements.terminalInput.value.trim();
        elements.terminalInput.value = "";
        if (input || terminalState.inLogin) {
            if (!terminalState.inLogin && !terminalState.inConfig) {
                terminalPrint(`<span class="terminal-prompt">root@kali:${terminalState.cwd}#</span> ${input}`);
            }
            if (terminalState.inLogin) handleLoginInput(input);
            else if (terminalState.inConfig) handleConfigInput(input);
            else if (terminalState.inChat) handleChatInput(input);
            else if (terminalState.inAssessment) handleAssessmentInput(input);
            else processCommand(input);

            if (!terminalState.inLogin && !terminalState.inConfig && input) {
                terminalState.history.push(input);
                terminalState.historyIndex = terminalState.history.length;
            }
        }
    } else if (e.key === "ArrowUp") {
        if (terminalState.historyIndex > 0) {
            terminalState.historyIndex--;
            elements.terminalInput.value = terminalState.history[terminalState.historyIndex];
        }
    } else if (e.key === "ArrowDown") {
        if (terminalState.historyIndex < terminalState.history.length - 1) {
            terminalState.historyIndex++;
            elements.terminalInput.value = terminalState.history[terminalState.historyIndex];
        } else {
            terminalState.historyIndex = terminalState.history.length;
            elements.terminalInput.value = "";
        }
    }
}
