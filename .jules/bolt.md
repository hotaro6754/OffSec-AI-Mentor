## 2026-02-16 - [Structural Failure: Nested Scripts]
**Learning:** A missing closing brace in a major initialization function (setupEventListeners) nested almost the entire codebase within a single local scope. This caused global function definitions (showAuthModal, showSection) to be undefined in the global scope where HTML event handlers (onclick) expected them, leading to silent failures across the entire UI.
**Action:** Always verify script structure with `node -c` or similar syntax checks after major refactors. Use clear section markers to visually catch nesting errors.

## 2026-02-16 - [Streaming UI Optimization]
**Learning:** Frequent `innerHTML` updates and Markdown parsing during AI streaming can lock the main thread, especially with long responses.
**Action:** Use `requestAnimationFrame` to throttle UI updates to 60fps, ensuring the browser remains responsive even during heavy streaming.
