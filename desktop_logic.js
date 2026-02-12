function initDesktopInteractions() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const winId = icon.dataset.window;
            openWindow(winId);
        });
    });

    const startBtn = document.getElementById('start-menu-btn');
    const startMenu = document.getElementById('start-menu');

    startBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu?.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        startMenu?.classList.add('hidden');
    });

    document.getElementById('start-switch-web')?.addEventListener('click', () => {
        if (typeof choosePrimaryMode === 'function') choosePrimaryMode('web');
    });

    document.getElementById('start-settings')?.addEventListener('click', () => {
        if (typeof showSettingsModal === 'function') showSettingsModal();
    });

    setInterval(updateTaskbarTime, 1000);
    updateTaskbarTime();
}

function updateTaskbarTime() {
    const el = document.getElementById('taskbar-time');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
}
