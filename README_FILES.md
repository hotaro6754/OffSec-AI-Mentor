# OffSec AI Mentor - Project Structure

This document describes the main files in the project and their roles.

## Main Files

- `server-v2.js`: The main backend server (Node.js/Express). Handles authentication, AI API calls, and serves static files.
- `database.js`: SQLite database management for users, assessments, roadmaps, and chat history.
- `app.js`: Main frontend logic. Handles UI interactions, API requests, and rendering of assessments and roadmaps.
- `index.html`: The main entry point for the frontend application.
- `style.css`: The primary stylesheet using a "Human-Crafted Neobrutalism" aesthetic.
- `package.json`: Node.js project configuration and dependencies.

## Deprecated Files

Moved to the `deprecated/` directory:
- Older versions of HTML/JS/CSS files (`*-new.html`, `*-clean.js`, etc.).
- The Python/Streamlit version of the app (`app.py`, `prompts.py`).
- Old server implementations (`server.js`).
- Scripts for old versions (`start.sh`, `start_dev_server.sh`).

## Documentation

- `README.md`: Main project overview and setup instructions.
- `ARCHITECTURE.txt`: Description of the project architecture.
- `USAGE_GUIDE.md`: Detailed guide on how to use the mentor.
- (Other `.md` files provide specific summaries and roadmaps).
