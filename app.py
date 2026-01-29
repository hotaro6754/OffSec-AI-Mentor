"""
OffSec AI Mentor - Educational Penetration Testing Mentor
Streamlit application with guided steps, authentication, and stored progress.

IMPORTANT: This is an EDUCATIONAL tool focused on methodology and reasoning.

SECURITY NOTE: Uses a protected OpenAI API key (stored server-side) with strict
rate limits to prevent abuse. User credentials and progress are stored securely
in a local SQLite database.
"""

import streamlit as st
import google.generativeai as genai
import os
import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from prompts import get_prompt
import time

# Load environment variables from .env file (optional fallback for development)
load_dotenv()

# Default model selection
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # Default to Gemini 1.5 Flash

# Database path (local SQLite)
DB_PATH = Path(__file__).resolve().parent / "mentor.db"


# ============================================================================
# DATABASE HELPERS (SQLite, simple and local)
# ============================================================================
def init_db():
    """Create tables for users and saved progress if they do not exist."""
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS roadmaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS enumerations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )


def hash_password(password: str) -> str:
    """Hash a password with SHA-256 (simple built-in hashing)."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its SHA-256 hash."""
    return hash_password(password) == password_hash


def get_user_by_username(username: str):
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.execute("SELECT id, username, email, password_hash FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
    if row:
        return {"id": row[0], "username": row[1], "email": row[2], "password_hash": row[3]}
    return None


def create_user(username: str, email: str, password: str) -> tuple[bool, str]:
    """Create a new user if username is not taken."""
    if get_user_by_username(username):
        return False, "❌ Username already taken. Choose another."
    password_hash = hash_password(password)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (username, email, password_hash, datetime.now().isoformat())
        )
    return True, "✅ Account created. You can log in now."


def authenticate_user(username: str, password: str):
    """Return (success, user_dict | message)."""
    user = get_user_by_username(username)
    if not user:
        return False, "❌ User not found."
    if not verify_password(password, user["password_hash"]):
        return False, "❌ Incorrect password."
    return True, user


def save_assessment(user_id: int, content: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO assessments (user_id, content, created_at) VALUES (?, ?, ?)",
            (user_id, content, datetime.now().isoformat())
        )


def save_roadmap(user_id: int, content: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO roadmaps (user_id, content, created_at) VALUES (?, ?, ?)",
            (user_id, content, datetime.now().isoformat())
        )


def save_enumeration(user_id: int, content: str):
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO enumerations (user_id, content, created_at) VALUES (?, ?, ?)",
            (user_id, content, datetime.now().isoformat())
        )

# ============================================================================
# PAGE CONFIGURATION
# ============================================================================
# Configure the Streamlit page settings
st.set_page_config(
    page_title="OffSec AI Mentor",  # Browser tab title
    page_icon="🧠",                   # Browser tab icon
    layout="wide",                    # Use full width of the page
    initial_sidebar_state="expanded"  # Sidebar visible by default
)

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================
def initialize_session_state():
    """Initialize session state variables to maintain data across reruns."""
    # Developer API Configuration (stricter limits)
    if 'selected_model' not in st.session_state:
        st.session_state.selected_model = DEFAULT_MODEL
    # Usage tracking (stricter security for shared key)
    if 'api_call_count' not in st.session_state:
        st.session_state.api_call_count = 0
    if 'last_call_time' not in st.session_state:
        st.session_state.last_call_time = 0
    # Auth
    if 'user_authenticated' not in st.session_state:
        st.session_state.user_authenticated = False
    if 'user_id' not in st.session_state:
        st.session_state.user_id = None
    if 'username' not in st.session_state:
        st.session_state.username = None
    if 'user_email' not in st.session_state:
        st.session_state.user_email = None
    # Skill Assessment
    if 'assessment_started' not in st.session_state:
        st.session_state.assessment_started = False
    if 'current_question' not in st.session_state:
        st.session_state.current_question = 0
    if 'answers' not in st.session_state:
        st.session_state.answers = []
    if 'assessment_complete' not in st.session_state:
        st.session_state.assessment_complete = False
    if 'assessment_result' not in st.session_state:
        st.session_state.assessment_result = None
    # Learning Roadmap (STEP 2)
    if 'roadmap_generated' not in st.session_state:
        st.session_state.roadmap_generated = False
    if 'roadmap_content' not in st.session_state:
        st.session_state.roadmap_content = None
    # Enumeration Coach (STEP 3)
    if 'enumeration_used' not in st.session_state:
        st.session_state.enumeration_used = False
    # Learning mode
    if 'learning_mode' not in st.session_state:
        st.session_state.learning_mode = "Beginner Mode"

# ============================================================================
# SKILL ASSESSMENT QUESTIONS
# ============================================================================
# These are 10 structured questions to assess cybersecurity knowledge
ASSESSMENT_QUESTIONS = [
    {
        "id": 1,
        "question": "What is the primary purpose of the three-way handshake in TCP?",
        "type": "text",
        "hint": "Think about connection establishment"
    },
    {
        "id": 2,
        "question": "Which Linux command would you use to view currently running processes?",
        "type": "text",
        "hint": "Common system monitoring command"
    },
    {
        "id": 3,
        "question": "What information does an Nmap scan with the -sV flag provide?",
        "type": "text",
        "hint": "Think about service details"
    },
    {
        "id": 4,
        "question": "Explain what ports 80 and 443 are typically used for.",
        "type": "text",
        "hint": "Web-related protocols"
    },
    {
        "id": 5,
        "question": "What does enumeration mean in the context of penetration testing?",
        "type": "text",
        "hint": "Information gathering phase"
    },
    {
        "id": 6,
        "question": "Why is it important to enumerate SMB shares on a Windows system?",
        "type": "text",
        "hint": "Think about information disclosure"
    },
    {
        "id": 7,
        "question": "What is the purpose of a web directory brute-force tool like gobuster or dirbuster?",
        "type": "text",
        "hint": "Finding hidden resources"
    },
    {
        "id": 8,
        "question": "Explain what 'privilege escalation' means.",
        "type": "text",
        "hint": "Going from low to high access"
    },
    {
        "id": 9,
        "question": "What is the CIA triad in information security?",
        "type": "text",
        "hint": "Three core principles"
    },
    {
        "id": 10,
        "question": "Why should you always get written permission before testing a system?",
        "type": "text",
        "hint": "Legal and ethical considerations"
    }
]

# ============================================================================
# RATE LIMITING (Stricter for Shared API Key)
# ============================================================================
def check_rate_limit():
    """
    Stricter rate limiting for shared API key: Max 20 calls per session, 5 seconds between calls.
    Prevents abuse and protects developer's API key.
    
    Returns:
        (bool, str): (allowed, message)
    """
    # Check total call count (reduced from 30 to 20)
    if st.session_state.api_call_count >= 20:
        return False, "⚠️ **Rate Limit**: You've reached the maximum of 20 API calls per session. Please refresh to reset."
    
    # Check time between calls (increased from 3 to 5 seconds)
    current_time = time.time()
    time_since_last_call = current_time - st.session_state.last_call_time
    
    if st.session_state.last_call_time > 0 and time_since_last_call < 5:
        wait_time = int(5 - time_since_last_call) + 1
        return False, f"⚠️ **Rate Limit**: Please wait {wait_time} seconds between requests."
    
    return True, "OK"

# ============================================================================
# GOOGLE GEMINI API INTEGRATION (With Developer's Protected API Key)
# ============================================================================
def call_openai_api(system_prompt, user_message):
    """
    Call Google Gemini API with developer's API key and strict rate limiting.
    
    Args:
        system_prompt: The system prompt defining AI behavior
        user_message: The user's input message
    
    Returns:
        AI response as string, or error message
    """
    # Get API key from environment variables
    api_key = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
    if not api_key:
        return "⚠️ **Configuration Error**: API key not configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable."
    
    # Rate limiting check (stricter for shared key)
    allowed, message = check_rate_limit()
    if not allowed:
        return message
    
    try:
        # Configure Gemini with API key
        genai.configure(api_key=api_key)
        
        # Create the model
        model = genai.GenerativeModel(st.session_state.selected_model)
        
        # Combine system prompt and user message for Gemini
        # Gemini doesn't have separate system/user roles, so we combine them
        full_prompt = f"{system_prompt}\n\nUser Query:\n{user_message}"
        
        # Call Gemini API with generation config
        response = model.generate_content(
            full_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1500,
            )
        )
        
        # Update usage tracking
        st.session_state.api_call_count += 1
        st.session_state.last_call_time = time.time()
        
        # Extract and return the response content
        return response.text
    
    except Exception as e:
        error_msg = str(e).lower()
        if 'api key' in error_msg or 'authentication' in error_msg:
            return "⚠️ **Authentication Error**: API key issue. Please contact the developer."
        elif 'quota' in error_msg or 'rate limit' in error_msg:
            return "⚠️ **Rate Limit**: API quota exceeded. Please try again later."
        elif 'permission' in error_msg:
            return "⚠️ **Permission Denied**: API configuration issue. Please contact the developer."
        else:
            return f"⚠️ **Error**: {str(e)}"

# ============================================================================
# CUSTOM STYLING (Neo-Brutalism)
# ============================================================================
st.markdown("""
    <style>
    :root {
        --bg: #f6f4f0;
        --primary: #ff5a5f;
        --secondary: #4b88ff;
        --accent: #ffd447;
        --ink: #000000;
    }

    html, body, .main, .block-container {
        background: var(--bg) !important;
    }

    .main-header {
        font-size: 2.6rem;
        color: var(--ink);
        text-align: center;
        margin-bottom: 0.5rem;
        font-weight: 800;
        letter-spacing: -0.5px;
    }
    .sub-header {
        text-align: center;
        color: var(--ink);
        margin-bottom: 1.5rem;
        font-weight: 600;
    }

    /* Neo-brutalist cards */
    .brut-card {
        background: #ffffff;
        border: 4px solid var(--ink);
        box-shadow: 10px 10px 0 var(--ink);
        border-radius: 0;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    /* Question boxes */
    .question-box {
        padding: 1.25rem;
        background-color: #fff;
        border: 3px solid var(--ink);
        box-shadow: 8px 8px 0 var(--accent);
        border-radius: 0;
        margin: 1rem 0;
    }

    .progress-text {
        font-size: 1.05rem;
        color: var(--ink);
        font-weight: 800;
    }

    /* Buttons */
    .stButton > button {
        background: var(--primary) !important;
        color: var(--ink) !important;
        border: 3px solid var(--ink) !important;
        box-shadow: 6px 6px 0 var(--ink) !important;
        border-radius: 0 !important;
        font-weight: 800 !important;
    }
    .stButton > button:hover {
        background: var(--accent) !important;
        color: var(--ink) !important;
        box-shadow: 4px 4px 0 var(--ink) !important;
    }

    /* Text inputs */
    .stTextInput > div > div > input,
    .stTextArea textarea,
    .stSelectbox > div > div,
    .st-expander > div {
        border: 3px solid var(--ink) !important;
        border-radius: 0 !important;
        box-shadow: 4px 4px 0 #ccc !important;
    }

    /* Expanders */
    .streamlit-expanderHeader {
        font-weight: 800 !important;
        color: var(--ink) !important;
    }

    /* Sidebar styling */
    section[data-testid="stSidebar"] {
        border-right: 4px solid var(--ink);
        box-shadow: 8px 0 0 var(--ink);
        background: #fdfbf7 !important;
    }

    /* Alerts */
    .stAlert {
        border: 3px solid var(--ink) !important;
        border-radius: 0 !important;
        box-shadow: 6px 6px 0 #ccc !important;
    }
    </style>
""", unsafe_allow_html=True)

# ============================================================================
# AUTH FORMS (Login / Signup)
# ============================================================================
def render_auth_forms():
    """Render login and signup forms (neo-brutalist layout)."""
    st.markdown("## 🔐 Sign In to Continue")
    st.markdown("Choose an option below to access your learning journey.")

    login_tab, signup_tab = st.tabs(["Login", "Sign Up"])

    with login_tab:
        st.markdown("### 👋 Welcome Back")
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")
        if st.button("➡️ Log In", type="primary", use_container_width=True, key="login_button"):
            if not username or not password:
                st.warning("Please enter both username and password.")
            else:
                success, result = authenticate_user(username, password)
                if success:
                    st.session_state.user_authenticated = True
                    st.session_state.user_id = result["id"]
                    st.session_state.username = result["username"]
                    st.session_state.user_email = result["email"]
                    st.success("✅ Logged in! Redirecting...")
                    st.rerun()
                else:
                    st.error(result)

    with signup_tab:
        st.markdown("### 🆕 Create Account")
        new_username = st.text_input("Choose a username", key="signup_username")
        new_email = st.text_input("Email (optional)", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")
        new_password_confirm = st.text_input("Confirm Password", type="password", key="signup_password_confirm")

        if st.button("✨ Sign Up", type="primary", use_container_width=True, key="signup_button"):
            if not new_username or not new_password:
                st.warning("Username and password are required.")
            elif new_password != new_password_confirm:
                st.error("Passwords do not match.")
            else:
                ok, message = create_user(new_username, new_email, new_password)
                if ok:
                    st.success(message)
                    st.info("You can now log in with your credentials.")
                else:
                    st.error(message)

# ============================================================================
# SIDEBAR
# ============================================================================
# Create sidebar with app information and settings
def render_sidebar():
    """Render the sidebar with settings and usage tracking."""
    with st.sidebar:
        st.markdown("### 🧠 OffSec AI Mentor")
        st.markdown("---")
        # User info / logout
        if st.session_state.user_authenticated:
            st.success(f"Signed in as **{st.session_state.username}**")
            if st.button("🚪 Log Out", use_container_width=True, key="logout_button"):
                st.session_state.user_authenticated = False
                st.session_state.user_id = None
                st.session_state.username = None
                st.session_state.user_email = None
                # Reset progress gates
                st.session_state.assessment_started = False
                st.session_state.current_question = 0
                st.session_state.answers = []
                st.session_state.assessment_complete = False
                st.session_state.assessment_result = None
                st.session_state.roadmap_generated = False
                st.session_state.roadmap_content = None
                st.session_state.enumeration_used = False
                st.rerun()
        else:
            st.info("Please log in on the main page to access the mentor features.")
        
        # ========================================================================
        # SECURE MODE INFO
        # ========================================================================
        st.info("🔐 **Protected Mode**\n\nThis app uses a secured API key with strict rate limits to ensure fair usage for all learners.")
        
        st.markdown("---")
        
        # ========================================================================
        # USAGE TRACKING (Stricter Limits)
        # ========================================================================
        st.markdown("### 📊 Usage Tracking")
        
        # Display current usage with stricter limits
        call_count = st.session_state.api_call_count
        max_calls = 20  # Reduced from 30
        
        progress = min(call_count / max_calls, 1.0)
        st.progress(progress)
        
        st.markdown(f"**API Calls:** {call_count} / {max_calls}")
        
        if call_count >= max_calls:
            st.error("⚠️ Rate limit reached. Refresh to continue.")
        elif call_count >= max_calls * 0.8:
            st.warning(f"⚠️ {max_calls - call_count} calls remaining")
        else:
            st.success(f"✅ {max_calls - call_count} calls remaining")
        
        st.caption("⏱️ Rate limit: 20 calls per session, 5 seconds between calls")
        
        st.markdown("---")
        
        # ========================================================================
        # LEARNING MODE SELECTOR
        # ========================================================================
        st.markdown("### 🎯 Learning Mode")
        learning_mode = st.selectbox(
            "Select Mode",
            ["Beginner Mode", "OSCP Mode", "Red Team Mode"],
            help="**Beginner**: Detailed explanations\n**OSCP**: Concise guidance\n**Red Team**: Stealth & methodology"
        )
        st.session_state.learning_mode = learning_mode
        
        st.markdown("---")
        
        # ========================================================================
        # SECURITY & ETHICS
        # ========================================================================
        st.markdown("### 🛡️ Security Notes")
        with st.expander("Privacy & Security"):
            st.markdown("""
            **Protected API Key:**
            - Managed by the developer
            - Rate limited for fair use
            - Secure and monitored
            
            **Stricter Rate Limiting:**
            - Max 20 API calls per session
            - 5 seconds between requests
            - Prevents abuse
            
            **Cost Protection:**
            - Max 1500 tokens per response
            - Fair usage for all learners
            """)
        
        st.markdown("### ⚠️ Ethical Use Only")
        st.warning("Educational purposes only. Always obtain proper authorization.")
        
        st.markdown("---")
        
        # About section
        with st.expander("ℹ️ About"):
            st.markdown("""
            **OffSec AI Mentor** teaches:
            - 🎯 Skill assessment
            - 🗺️ Learning roadmaps
            - 🔍 Enumeration methodology
            - 📝 Report writing
            
            **NOT an exploit tool**
            """)

# ============================================================================
# STEP 1: SKILL ASSESSMENT TAB
# ============================================================================
def skill_assessment_tab():
    """
    STEP 1 Implementation: Skill Assessment
    - Asks 8-10 structured questions
    - Collects answers
    - Sends to AI for assessment
    - Displays structured results
    """
    st.markdown("## 🎯 Skill Assessment")
    st.markdown("""
    Let's evaluate your current cybersecurity knowledge through 10 questions.
    Answer honestly - this helps create a personalized learning path for you.
    """)
    
    # Check if assessment has started
    if not st.session_state.assessment_started:
        # Show start button
        st.info("📋 **10 questions** covering networking, Linux, enumeration, web security, and more.")
        
        if st.button("🚀 Start Skill Assessment", type="primary", use_container_width=True):
            st.session_state.assessment_started = True
            st.session_state.current_question = 0
            st.session_state.answers = []
            st.session_state.assessment_complete = False
            st.rerun()
    
    # If assessment is in progress
    elif st.session_state.assessment_started and not st.session_state.assessment_complete:
        # Get current question
        q_index = st.session_state.current_question
        question_data = ASSESSMENT_QUESTIONS[q_index]
        
        # Display progress
        progress = (q_index + 1) / len(ASSESSMENT_QUESTIONS)
        st.progress(progress)
        st.markdown(f'<p class="progress-text">Question {q_index + 1} of {len(ASSESSMENT_QUESTIONS)}</p>', 
                   unsafe_allow_html=True)
        
        # Display question in a styled box
        st.markdown('<div class="question-box">', unsafe_allow_html=True)
        st.markdown(f"### Question {q_index + 1}")
        st.markdown(f"**{question_data['question']}**")
        st.caption(f"💡 Hint: {question_data['hint']}")
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Answer input
        answer = st.text_area(
            "Your Answer:",
            height=100,
            key=f"answer_{q_index}",
            placeholder="Type your answer here... (Be honest, even 'I don't know' is a valid answer)"
        )
        
        # Navigation buttons
        col1, col2, col3 = st.columns([1, 1, 4])
        
        with col1:
            if q_index > 0:
                if st.button("⬅️ Previous"):
                    st.session_state.current_question -= 1
                    st.rerun()
        
        with col2:
            # Submit/Next button
            if answer.strip():
                button_label = "Submit Assessment ✅" if q_index == len(ASSESSMENT_QUESTIONS) - 1 else "Next ➡️"
                if st.button(button_label, type="primary"):
                    # Store answer
                    if q_index < len(st.session_state.answers):
                        st.session_state.answers[q_index] = answer
                    else:
                        st.session_state.answers.append(answer)
                    
                    # Check if this was the last question
                    if q_index == len(ASSESSMENT_QUESTIONS) - 1:
                        # Assessment complete - send to AI for evaluation
                        st.session_state.assessment_complete = True
                        with st.spinner("🤔 Analyzing your responses..."):
                            # Format all Q&A for AI
                            qa_text = ""
                            for i, (q, a) in enumerate(zip(ASSESSMENT_QUESTIONS, st.session_state.answers)):
                                qa_text += f"\nQuestion {i+1}: {q['question']}\n"
                                qa_text += f"Answer: {a}\n"
                            
                            # Get system prompt
                            system_prompt = get_prompt("skill_assessment", st.session_state.learning_mode)
                            
                            # Call AI
                            user_message = f"""Here are the learner's answers to the skill assessment questions:

{qa_text}

Please provide a structured assessment following the format specified."""
                            
                            result = call_openai_api(system_prompt, user_message)
                            st.session_state.assessment_result = result
                            if st.session_state.user_id:
                                save_assessment(st.session_state.user_id, result)
                        
                        st.rerun()
                    else:
                        # Move to next question
                        st.session_state.current_question += 1
                        st.rerun()
            else:
                st.warning("⚠️ Please provide an answer before continuing.")
    
    # If assessment is complete, show results
    elif st.session_state.assessment_complete and st.session_state.assessment_result:
        st.success("✅ **Assessment Complete!**")
        st.markdown("---")
        st.markdown("### 📊 Your Assessment Results")
        
        # Display AI assessment
        st.markdown(st.session_state.assessment_result)
        
        st.markdown("---")
        
        # Action buttons
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Retake Assessment", use_container_width=True):
                # Reset everything
                st.session_state.assessment_started = False
                st.session_state.current_question = 0
                st.session_state.answers = []
                st.session_state.assessment_complete = False
                st.session_state.assessment_result = None
                st.rerun()
        
        with col2:
            if st.button("📋 Review My Answers", use_container_width=True):
                with st.expander("View All Questions & Answers", expanded=True):
                    for i, (q, a) in enumerate(zip(ASSESSMENT_QUESTIONS, st.session_state.answers)):
                        st.markdown(f"**Q{i+1}: {q['question']}**")
                        st.info(f"Your answer: {a}")
                        st.markdown("---")

# ============================================================================
# STEP 2: LEARNING ROADMAP TAB
# ============================================================================
def learning_roadmap_tab():
    """
    STEP 2 Implementation: Learning Roadmap
    - Requires completed Skill Assessment
    - Uses assessment results as input
    - Generates phase-based learning roadmap
    - Displays structured learning path
    """
    st.markdown("## 🗺️ Personalized Learning Roadmap")
    
    # Check if Skill Assessment has been completed
    if not st.session_state.assessment_complete or not st.session_state.assessment_result:
        # Show message if assessment not done
        st.info("👈 **Complete the Skill Assessment first** to generate your personalized roadmap.")
        
        st.markdown("""
        ### What You'll Get:
        
        A customized learning roadmap based on your assessment will include:
        
        - **📚 Phase-Based Structure**
          - Foundations (if needed)
          - Core Offensive Skills
          - Intermediate Concepts
        
        - **🎯 Prioritized Topics**
          - What to study and when
          - Why each phase matters
          - How skills build on each other
        
        - **🛠️ Skill Development**
          - Tools and techniques to learn
          - Methodologies to master
          - OSCP alignment explanation
        
        - **💡 Practice Guidance**
          - Recommended platforms (high-level)
          - How to apply your learning
          - Real-world skill building
        """)
        
        # Link back to assessment
        st.markdown("---")
        st.markdown("**Ready?** Go to the **Skill Assessment** tab to get started!")
        return
    
    # Assessment completed - show roadmap generation
    st.markdown("""
    Based on your skill assessment, let's create a personalized learning path 
    tailored to your current level, strengths, and areas for growth.
    """)
    
    # Display assessment summary in an expander
    with st.expander("📊 Your Skill Assessment Summary"):
        st.markdown(st.session_state.assessment_result)
    
    st.markdown("---")
    
    # Check if roadmap has been generated
    if not st.session_state.roadmap_generated:
        # Show generate button
        st.markdown("### Generate Your Learning Roadmap")
        st.info("💡 This will create a phase-based learning plan aligned with your assessment results.")
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            if st.button("🎯 Generate My Roadmap", type="primary", use_container_width=True):
                # Prepare the input for AI
                # We'll send the assessment results and ask for a structured roadmap
                
                with st.spinner("🤔 Creating your personalized learning roadmap..."):
                    # Get the Learning Roadmap system prompt
                    system_prompt = get_prompt("roadmap", st.session_state.learning_mode)
                    
                    # Construct the user message with assessment results
                    user_message = f"""Based on the following skill assessment results, please create a personalized learning roadmap:

{st.session_state.assessment_result}

Please provide a structured roadmap that includes:
1. Phase-based learning path (Foundations → Core Offensive Skills → Intermediate Concepts)
2. Topics to study in each phase
3. Why each phase matters
4. Suggested practice platforms (high-level only)
5. OSCP alignment explanation

Format the roadmap clearly with phases and learning objectives."""
                    
                    # Call OpenAI API to generate roadmap
                    roadmap_result = call_openai_api(system_prompt, user_message)
                    
                    # Store the generated roadmap
                    st.session_state.roadmap_content = roadmap_result
                    st.session_state.roadmap_generated = True
                    if st.session_state.user_id:
                        save_roadmap(st.session_state.user_id, roadmap_result)
                
                # Rerun to display the roadmap
                st.rerun()
    
    # Display the generated roadmap
    if st.session_state.roadmap_generated and st.session_state.roadmap_content:
        st.success("✅ **Your Personalized Roadmap is Ready!**")
        st.markdown("---")
        
        # Display the roadmap content
        st.markdown("### 🗺️ Your Learning Path")
        st.markdown(st.session_state.roadmap_content)
        
        st.markdown("---")
        
        # Action buttons
        st.markdown("### Next Steps")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Regenerate roadmap button
            if st.button("🔄 Regenerate Roadmap", use_container_width=True):
                # Reset roadmap state to regenerate with same assessment
                st.session_state.roadmap_generated = False
                st.session_state.roadmap_content = None
                st.rerun()
        
        with col2:
            # Retake assessment button (starts over from beginning)
            if st.button("📝 Retake Assessment", use_container_width=True):
                # Reset both assessment and roadmap
                st.session_state.assessment_started = False
                st.session_state.current_question = 0
                st.session_state.answers = []
                st.session_state.assessment_complete = False
                st.session_state.assessment_result = None
                st.session_state.roadmap_generated = False
                st.session_state.roadmap_content = None
                st.info("Go to the Skill Assessment tab to start fresh!")
                st.rerun()
        
        # Additional guidance
        st.markdown("---")
        st.markdown("### 💡 Using Your Roadmap")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("""
            **📖 Study Systematically**
            - Follow phases in order
            - Master fundamentals first
            - Build skills progressively
            """)
        
        with col2:
            st.markdown("""
            **🛠️ Practice Regularly**
            - Use recommended platforms
            - Apply what you learn
            - Document your progress
            """)
        
        with col3:
            st.markdown("""
            **🎯 Stay Focused**
            - One phase at a time
            - Master before moving on
            - Review and reinforce
            """)

# ============================================================================
# STEP 3: ENUMERATION COACH TAB
# ============================================================================
def enumeration_coach_tab():
    """
    STEP 3 Implementation: Enumeration Coach
    - Accepts scan output (e.g., Nmap results)
    - Sends to Enumeration Coach system prompt
    - Explains methodology and reasoning
    - NO commands, exploits, or payloads
    """
    st.markdown("## 🔍 Enumeration Coach")
    
    st.markdown("""
    Paste your scan output below and the AI mentor will help you understand:
    - **What** the discovered services generally indicate
    - **What** areas to enumerate next (high-level thinking)
    - **Why** those areas matter in pentesting methodology
    
    ⚠️ **This is NOT a command generator** - it teaches you HOW to think, not WHAT commands to run.
    """)
    
    st.markdown("---")
    
    # ========================================================================
    # INPUT: SCAN OUTPUT
    # ========================================================================
    st.markdown("### 📋 Your Scan Output")
    
    # Large text area for scan results
    scan_output = st.text_area(
        "Paste your scan results here:",
        height=250,
        placeholder="""Example:
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu
80/tcp open  http    Apache httpd 2.4.41
139/tcp open  netbios-ssn Samba smbd 4.6.2
445/tcp open  netbios-ssn Samba smbd 4.6.2

Paste ANY scan output: Nmap, Nikto, enum4linux, gobuster results, etc.""",
        help="Paste scan output from Nmap, Nikto, or other enumeration tools"
    )
    
    # Optional: Additional context
    st.markdown("### 📝 Additional Context (Optional)")
    additional_context = st.text_input(
        "Any additional information?",
        placeholder="e.g., 'This is from a TryHackMe room' or 'Corporate web server' or 'CTF challenge'",
        help="Provide context to help the AI give more relevant guidance"
    )
    
    st.markdown("---")
    
    # ========================================================================
    # ANALYZE BUTTON
    # ========================================================================
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        analyze_button = st.button(
            "🔍 Analyze Scan Results",
            type="primary",
            use_container_width=True,
            disabled=not scan_output.strip()  # Disable if no scan input
        )
    
    # ========================================================================
    # PROCESS AND DISPLAY RESULTS
    # ========================================================================
    if analyze_button:
        # User clicked analyze - process the scan output
        
        with st.spinner("🤔 Analyzing scan results and explaining methodology..."):
            # Get the Enumeration Coach system prompt
            system_prompt = get_prompt("enumeration", st.session_state.learning_mode)
            
            # Construct the user message
            # Include scan output and optional context
            user_message = f"""Here are my scan results. Please help me understand them from a methodology perspective.

Scan Output:
```
{scan_output}
```"""
            
            # Add context if provided
            if additional_context.strip():
                user_message += f"\n\nAdditional Context: {additional_context}"
            
            # Add explicit instruction to focus on reasoning
            user_message += """

Please explain:
1. What these discovered services generally indicate about the system
2. What areas I should think about enumerating next (high-level only)
3. WHY those areas matter from a pentesting methodology perspective
4. The thinking process behind prioritizing enumeration steps

Remember: Focus on methodology and reasoning, not specific commands or exploits."""
            
            # Call OpenAI API
            analysis_result = call_openai_api(system_prompt, user_message)
            
            # Mark enumeration as used (unlocks STEP 4)
            st.session_state.enumeration_used = True
            if st.session_state.user_id:
                save_enumeration(st.session_state.user_id, analysis_result)
        
        # Display the results
        st.markdown("---")
        st.success("✅ **Analysis Complete - Report Helper Unlocked!**")
        st.markdown("### 📊 Enumeration Analysis & Methodology")
        
        # Display the AI's analysis in a clean format
        st.markdown(analysis_result)
        
        st.markdown("---")
        
        # Additional guidance after analysis
        st.markdown("### 💡 Next Steps")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **🎯 Apply This Thinking:**
            - Consider what you learned
            - Think about attack surface
            - Prioritize your enumeration
            - Document your findings
            """)
        
        with col2:
            st.markdown("""
            **🔄 Continue Learning:**
            - Run deeper enumeration
            - Paste new results for more guidance
            - Build your methodology habits
            - Practice systematic thinking
            """)
        
        # Warning about methodology focus
        st.info("💡 **Remember**: This tool teaches you to THINK like a pentester, not to copy commands. Understanding WHY is more important than memorizing HOW.")
    
    # ========================================================================
    # EXAMPLE SCAN OUTPUT (For Learning)
    # ========================================================================
    st.markdown("---")
    st.markdown("### 📝 Example Scan Outputs")
    
    with st.expander("See Example #1: Basic Nmap Scan"):
        st.code("""PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))""", language="text")
        
        st.caption("A simple scan showing SSH and HTTP services. Good for learning basic enumeration thinking.")
    
    with st.expander("See Example #2: Multiple Services"):
        st.code("""PORT     STATE SERVICE     VERSION
22/tcp   open  ssh         OpenSSH 8.2p1 Ubuntu
80/tcp   open  http        Apache httpd 2.4.41
139/tcp  open  netbios-ssn Samba smbd 4.6.2
445/tcp  open  netbios-ssn Samba smbd 4.6.2
3306/tcp open  mysql       MySQL 5.7.35
8080/tcp open  http-proxy""", language="text")
        
        st.caption("More complex scan with multiple services. Practice prioritizing what to enumerate first.")
    
    with st.expander("See Example #3: Web Directory Enumeration"):
        st.code("""[+] URL: http://target.com
[+] Threads: 10

Found:
/admin                (Status: 403) [Size: 277]
/uploads              (Status: 301) [Size: 312]
/backup               (Status: 200) [Size: 1234]
/api                  (Status: 200) [Size: 456]""", language="text")
        
        st.caption("Directory enumeration results. Think about what each finding tells you about the application.")
    
    # ========================================================================
    # LEARNING TIPS
    # ========================================================================
    st.markdown("---")
    st.markdown("### 🎓 Enumeration Philosophy")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        **🐌 Slow Down**
        - Don't rush to exploit
        - Enumerate thoroughly first
        - Understand the system
        - Build a complete picture
        """)
    
    with col2:
        st.markdown("""
        **🧠 Think Systematically**
        - What services are running?
        - What do they tell me?
        - What's the attack surface?
        - Where should I look deeper?
        """)
    
    with col3:
        st.markdown("""
        **📝 Document Everything**
        - Track your findings
        - Note interesting details
        - Build evidence
        - Support your conclusions
        """)

def report_helper_tab():
    """STEP 4: Report Helper (Coming Soon)"""
    st.markdown("## 📝 Pentest Report Helper")
    st.info("**STEP 4 - Coming Soon**\n\nThis will help format technical findings into professional reports.")
    st.markdown("**Features:**\n- Executive summary\n- Technical description\n- Risk assessment\n- Remediation guidance")

# ============================================================================
# MAIN APPLICATION
# ============================================================================
def main():
    """Main application entry point."""
    # Initialize session state and database
    initialize_session_state()
    init_db()
    
    # Render sidebar
    render_sidebar()
    
    # Main header
    st.markdown('<div class="main-header">🧠 OffSec AI Mentor</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Your AI-Powered Penetration Testing Learning Companion</div>',
        unsafe_allow_html=True
    )
    
    # Ethical warning banner
    st.warning(
        "⚠️ **Educational Use Only:** This tool teaches methodology and reasoning. "
        "It does NOT provide exploits or automated attacks."
    )

    # Require authentication before accessing steps
    if not st.session_state.user_authenticated:
        render_auth_forms()
        return
    
    # Progressive tab unlocking based on completion
    # Determine which tabs to show
    tab_labels = ["🎯 Skill Assessment"]
    
    if st.session_state.assessment_complete:
        tab_labels.append("🗺️ Learning Roadmap" + (" ✅" if st.session_state.roadmap_generated else ""))
    
    if st.session_state.roadmap_generated:
        tab_labels.append("🔍 Enumeration Coach" + (" ✅" if st.session_state.enumeration_used else ""))
    
    if st.session_state.enumeration_used:
        tab_labels.append("📝 Report Helper")
    
    # Create tabs dynamically
    tabs = st.tabs(tab_labels)
    
    # Always show Skill Assessment
    with tabs[0]:
        skill_assessment_tab()
    
    # Show Learning Roadmap if assessment complete
    if st.session_state.assessment_complete and len(tabs) > 1:
        with tabs[1]:
            learning_roadmap_tab()
    
    # Show Enumeration Coach if roadmap generated
    if st.session_state.roadmap_generated and len(tabs) > 2:
        with tabs[2]:
            enumeration_coach_tab()
    
    # Show Report Helper if enumeration used
    if st.session_state.enumeration_used and len(tabs) > 3:
        with tabs[3]:
            report_helper_tab()
    
    # Footer
    st.markdown("---")
    st.markdown("""
        <div style="text-align: center; color: #666; font-size: 0.9rem;">
            Built for the OffSec Community MCP Challenge | Educational purposes only
        </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
