## 2025-02-07 - [Restoration and Micro-UX]
**Learning:** In a vanilla JS project with high-interactivity, accidental deletion of core UI helpers (like notification wrappers) or section management functions can break the entire application flow. Always verify that event listeners point to existing functions after large refactors.
**Action:** Before refactoring, create a map of core utility functions and ensure they are preserved or properly replaced.
**Learning:** Neo-Brutalist UI benefits from high-contrast fixed elements. A "Back to Top" button should follow the same shadow/border patterns to feel integrated.
**Action:** Use CSS variables for colors and shadow offsets to maintain theme consistency for new UI elements.
