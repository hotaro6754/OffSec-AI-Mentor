function initWindowManagement() {
    const windows = document.querySelectorAll('.window');
    let activeWindow = null;
    let offsetX, offsetY;

    windows.forEach(win => {
        const header = win.querySelector('.window-header');
        if (!header) return;

        header.addEventListener('mousedown', (e) => {
            activeWindow = win;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            bringToFront(win);
        });

        win.addEventListener('mousedown', () => {
            bringToFront(win);
        });
    });

    document.addEventListener('mousemove', (e) => {
        if (activeWindow) {
            activeWindow.style.left = (e.clientX - offsetX) + 'px';
            activeWindow.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        activeWindow = null;
    });

    function bringToFront(win) {
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = 10);
        win.style.zIndex = 100;

        const winId = win.id.replace('window-', '');
        document.querySelectorAll('.task-app').forEach(app => {
            app.classList.toggle('active', app.dataset.window === winId);
        });
    }
}

function closeWindow(id) {
    const win = document.getElementById('window-' + id);
    if (win) {
        win.classList.add('hidden');
        const task = document.querySelector(`.task-app[data-window="${id}"]`);
        if (task) task.remove();
    }
}

function openWindow(id) {
    const win = document.getElementById('window-' + id);
    if (win) {
        win.classList.remove('hidden');

        if (!document.querySelector(`.task-app[data-window="${id}"]`)) {
            const tray = document.querySelector('.taskbar-apps');
            if (tray) {
                const app = document.createElement('div');
                app.className = 'task-app active';
                app.dataset.window = id;
                app.textContent = id.charAt(0).toUpperCase() + id.slice(1);
                app.onclick = () => openWindow(id);
                tray.appendChild(app);
            }
        }
    }
}
