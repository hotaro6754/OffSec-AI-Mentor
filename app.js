/**
 * OffSec AI Mentor - Frontend Application v2.0
 * 
 * FEATURES:
 * - User authentication (login/register)
 * - Progress tracking & checklist
 * - Loading animations
 * - Resources browser
 * - Question variation
 * 
 * ENDPOINTS USED:
 * - Auth: POST /api/register, /api/login, /api/logout, GET /api/me
 * - Assessment: POST /api/generate-questions, /api/evaluate-assessment
 * - Roadmap: POST /api/generate-roadmap, GET /api/roadmaps
 * - Chat: POST /api/mentor-chat, GET /api/chat-history
 * - Checklist: GET /api/checklist, POST /api/checklist, PUT /api/checklist/:id
 * - Stats: GET /api/stats
 * - Resources: GET /api/resources
 */

// ============================================================================
// CONFIG & CONSTANTS
// ============================================================================

const API_BASE = '';

const LOADING_TIPS = [
    "💡 Tip: Consistent practice beats cramming every time!",
    "🎯 Focus on understanding concepts, not memorizing commands.",
    "🔒 Always practice in legal, authorized environments.",
    "📚 TryHackMe and HackTheBox are great for hands-on learning.",
    "🛡️ Methodology matters more than tools.",
    "⏰ Take breaks! Your brain needs time to process.",
    "🔍 Enumeration is key - the more you find, the more attack vectors.",
    "📝 Document everything during practice - it helps retention.",
    "🤝 Join the community - Discord servers, forums, local meetups.",
    "🎮 Treat CTFs like games - they're meant to be fun!"
];

const DEV_JOKES = [
    "🔧 75% of bugs are fixed by checking the API key...",
    "🚀 If it works on localhost, it's production ready, right?",
    "🎯 Generating roadmap... responsibly hacking knowledge...",
    "🔑 Blaming the API key in 3...2...1...",
    "🤖 Teaching AI about responsible disclosure...",
    "📊 Enumerating best learning paths...",
    "⏱️ Compiling 200 hours of knowledge into 20 weeks...",
    "🔍 Scanning for optimal study strategies...",
    "🛡️ Hardening your learning methodology...",
    "💻 Exploiting the power of personalized education...",
    "🎓 Privilege escalating your skill level...",
    "🔐 Encrypting procrastination... decrypting motivation...",
    "🌐 Port forwarding knowledge directly to your brain...",
    "🎭 Social engineering the best resources for you...",
    "📚 Buffer overflow detected... loading more knowledge..."
];

const CERTIFICATIONS = [
    { 
        id: 'oscp', 
        name: 'OSCP', 
        title: 'Offensive Security Certified Professional', 
        description: 'The industry-leading penetration testing certification. Master real-world pentesting skills.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Intermediate',
        duration: '~200 hours'
    },
    { 
        id: 'osep', 
        name: 'OSEP', 
        title: 'Offensive Security Experienced Penetration Tester', 
        description: 'Advanced evasion techniques and sophisticated post-exploitation.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Advanced',
        duration: '~300 hours'
    },
    { 
        id: 'oswe', 
        name: 'OSWE', 
        title: 'Offensive Security Web Expert', 
        description: 'Expert-level web application security and whitebox pentesting.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Advanced',
        duration: '~250 hours'
    },
    { 
        id: 'osda', 
        name: 'OSDA', 
        title: 'Offensive Security Defense Analyst', 
        description: 'SOC analyst skills, threat detection, and defensive security.',
        type: 'defense',
        provider: 'OffSec',
        level: 'Intermediate',
        duration: '~150 hours'
    },
    { 
        id: 'oswp', 
        name: 'OSWP', 
        title: 'Offensive Security Wireless Professional', 
        description: 'Wireless network security assessment and attacks.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Intermediate',
        duration: '~40 hours'
    },
    { 
        id: 'osed', 
        name: 'OSED', 
        title: 'Offensive Security Exploit Developer', 
        description: 'Windows exploit development and binary analysis.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Advanced',
        duration: '~200 hours'
    },
    { 
        id: 'osee', 
        name: 'OSEE', 
        title: 'Offensive Security Exploitation Expert', 
        description: 'The most advanced OffSec certification. Elite-level exploitation.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Expert',
        duration: '~400 hours'
    },
    { 
        id: 'osmr', 
        name: 'OSMR', 
        title: 'Offensive Security macOS Researcher', 
        description: 'macOS security research and exploitation techniques.',
        type: 'attack',
        provider: 'OffSec',
        level: 'Advanced',
        duration: '~150 hours'
    },
    {
        id: 'pnpt',
        name: 'PNPT',
        title: 'Practical Network Penetration Tester',
        description: 'A comprehensive, practical exam covering OSINT, External/Internal attacks, and Reporting.',
        type: 'attack',
        provider: 'TCM Security',
        level: 'Intermediate',
        duration: '~100 hours'
    },
    {
        id: 'cpts',
        name: 'CPTS',
        title: 'Certified Penetration Testing Specialist',
        description: 'Highly technical and practical penetration testing certification from Hack The Box.',
        type: 'attack',
        provider: 'Hack The Box',
        level: 'Intermediate',
        duration: '~250 hours'
    },
    {
        id: 'ejpt',
        name: 'eJPT',
        title: 'eLearnSecurity Junior Penetration Tester',
        description: 'Excellent entry-level practical certification for aspiring penetration testers.',
        type: 'attack',
        provider: 'INE',
        level: 'Beginner',
        duration: '~80 hours'
    },
    {
        id: 'ceh',
        name: 'CEH',
        title: 'Certified Ethical Hacker',
        description: 'Industry-recognized foundational certification for ethical hacking.',
        type: 'attack',
        provider: 'EC-Council',
        level: 'Beginner',
        duration: '~120 hours'
    },
    {
        id: 'thm-jr-pentester',
        name: 'Jr Pentester',
        title: 'Junior Penetration Tester (THM)',
        description: 'A complete guided path from TryHackMe covering the essentials of pentesting.',
        type: 'attack',
        provider: 'TryHackMe',
        level: 'Beginner',
        duration: '~60 hours'
    }
];

// Motivational Cyber Quotes
const CYBER_QUOTES = [
    "The best way to predict the future is to invent it. - Alan Kay",
    "Security is not a product, but a process. - Bruce Schneier",
    "In the world of hacking, knowledge is the ultimate exploit.",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Try Harder. - Offensive Security",
    "Persistence breaks resistance.",
    "Every expert was once a beginner who refused to give up.",
    "Cybersecurity is much more than a matter of IT. - Stephane Nappo",
    "The quieter you become, the more you can hear. - Kali Linux",
    "Knowledge is power, but applied knowledge is unstoppable."
];

// ============================================================================
// GLOBAL STATE
// ============================================================================

let appState = {
    currentQuestion: 0,
    questions: [],
    answers: {},
    assessment: null,
    selectedCert: null,
    roadmap: null,
    mentorChat: [],
    learningMode: 'beginner',
    // Auth
    user: null,
    sessionId: localStorage.getItem('sessionId'),
    // Checklist
    checklist: [],
    // Resources
    resources: null
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    // Buttons
    startBtn: document.getElementById('startBtn'),
    nextBtn: document.getElementById('nextBtn'),
    prevBtn: document.getElementById('prevBtn'),
    selectCertBtn: document.getElementById('selectCertBtn'),
    copyRoadmapBtn: document.getElementById('copyRoadmapBtn'),
    exportRoadmapBtn: document.getElementById('exportRoadmapBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    sendMentorBtn: document.getElementById('sendMentorBtn'),
    modeCheckbox: document.getElementById('modeCheckbox'),
    modeLabel: document.getElementById('modeLabel'),
    reviewContinueBtn: document.getElementById('reviewContinueBtn'),
    
    // Sections
    assessmentSection: document.getElementById('assessmentSection'),
    evaluationSection: document.getElementById('evaluationSection'),
    certSection: document.getElementById('certSection'),
    roadmapSection: document.getElementById('roadmapSection'),
    mentorSection: document.getElementById('mentorSection'),
    actionsSection: document.getElementById('actionsSection'),
    reviewSection: document.getElementById('reviewSection'),
    checklistSection: document.getElementById('checklistSection'),
    
    // Assessment
    questionContainer: document.getElementById('questionContainer'),
    progressFill: document.getElementById('progressFill'),
    questionCounter: document.getElementById('questionCounter'),
    assessmentForm: document.getElementById('assessmentForm'),
    
    // Evaluation
    readinessScore: document.getElementById('readinessScore'),
    readinessStatus: document.getElementById('readinessStatus'),
    oscpAlignment: document.getElementById('oscpAlignment'),
    skillBreakdown: document.getElementById('skillBreakdown'),
    strengthsList: document.getElementById('strengthsList'),
    weaknessesList: document.getElementById('weaknessesList'),
    confidenceGapsList: document.getElementById('confidenceGapsList'),
    focusSuggestion: document.getElementById('focusSuggestion'),
    
    // Certification
    certGrid: document.getElementById('certGrid'),
    selectedCertDisplay: document.getElementById('selectedCertDisplay'),
    
    // Roadmap
    roadmapContent: document.getElementById('roadmapContent'),
    
    // Mentor
    chatHistory: document.getElementById('chatHistory'),
    mentorInput: document.getElementById('mentorInput'),
    mentorIntentButtons: document.getElementById('mentorIntentButtons'),

    // Mode UI
    heroSubtitle: document.getElementById('heroSubtitle'),
    assessmentTitle: document.getElementById('assessmentTitle'),
    assessmentSubtitle: document.getElementById('assessmentSubtitle'),
    modeBanner: document.getElementById('modeBanner'),

    // Review
    reviewContainer: document.getElementById('reviewContainer'),
    
    // Auth Modal
    authModal: document.getElementById('authModal'),
    closeAuthModal: document.getElementById('closeAuthModal'),

    // Settings Modal
    settingsModal: document.getElementById('settingsModal'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsModal: document.getElementById('closeSettingsModal'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    clearSettingsBtn: document.getElementById('clearSettingsBtn'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    navAuth: document.getElementById('navAuth'),
    navUser: document.getElementById('navUser'),
    navUsername: document.getElementById('navUsername'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),
    loadingTip: document.getElementById('loadingTip'),
    
    // Checklist
    checklistItems: document.getElementById('checklistItems'),
    checklistProgressCircle: document.getElementById('checklistProgressCircle'),
    checklistProgressText: document.getElementById('checklistProgressText'),
    checklistProgressLabel: document.getElementById('checklistProgressLabel'),
    newChecklistItem: document.getElementById('newChecklistItem'),
    addChecklistBtn: document.getElementById('addChecklistBtn'),
    viewChecklistBtn: document.getElementById('viewChecklistBtn'),
    navChecklist: document.getElementById('navChecklist'),
    
    // Resources
    resourcesModal: document.getElementById('resourcesModal'),
    closeResourcesModal: document.getElementById('closeResourcesModal'),
    resourcesContent: document.getElementById('resourcesContent'),
    navResources: document.getElementById('navResources')
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    console.log('🎓 OffSec AI Mentor - Initializing...');
    setupEventListeners();
    setupAuthListeners();
    setupSkillPanel();
    setupAOS();
    setupLenis();
    setupGSAP();
    setupIcons();
    setupParticles();
    setupTypedText();
    setupHeroAnimations();
    setupNavbarScroll();
    setupCertFilters();
    checkExistingSession();
    
    // Check PDF library status
    checkPDFLibraryStatus();
    
    if (elements.modeCheckbox) {
        toggleLearningMode();
    }

    // Initial Boot Animation
    runBootAnimation();

    console.log('✅ Initialization complete');
}

function runBootAnimation() {
    const bootScreen = document.getElementById('boot-screen');
    const output = document.getElementById('console-output');
    if (!bootScreen || !output) return;

    bootScreen.classList.remove('hidden');

    const logs = [
        { type: 'ok', msg: "Initializing OFFSEC_MENTOR Kernel v3.0..." },
        { type: 'ok', msg: "Loading AI Mentor Modules..." },
        { type: 'warn', msg: "Neural Network: Optimizing for OSCP mindset..." },
        { type: 'ok', msg: "Establishing secure connection to Groq API..." },
        { type: 'ok', msg: "ACCESS GRANTED. MENTOR ONLINE." }
    ];

    let delay = 0;
    logs.forEach((log, index) => {
        delay += (index === 0) ? 400 : 250;
        setTimeout(() => {
            output.innerHTML += `
                <div style="display: flex; align-items: center; margin-bottom: 4px; font-family: 'Space Mono', monospace; font-size: 0.9rem; color: #ccc;">
                    <span style="color: ${log.type==='ok'?'#00ff00':log.type==='warn'?'#ffff00':'#ff0000'}; font-weight: bold; margin-right: 15px;">[${log.type.toUpperCase()}]</span> ${log.msg}
                </div>`;
        }, delay);
    });

    setTimeout(() => {
        bootScreen.style.transform = 'translateY(-100%)';
        setTimeout(() => bootScreen.classList.add('hidden'), 600);
    }, delay + 1000);
}

function setupSkillPanel() {
    const closeBtn = document.getElementById('closeSkillPanel');
    const panel = document.getElementById('skillPanel');

    closeBtn?.addEventListener('click', () => {
        panel.classList.remove('open');
    });
}

async function checkPDFLibraryStatus() {
    try {
        // Check if backend PDF generation API is available
        const response = await fetch('/api/health');
        const health = await response.json();
        
        if (health.status === 'ok') {
            console.log('✅ PDF generation API available (iLovePDF)');
        } else {
            throw new Error('Backend not healthy');
        }
    } catch (error) {
        console.warn('⚠️ PDF generation API unavailable. PDF export will not work.');
        console.warn('💡 Users can still export as JSON or TXT format.');
        
        // Disable PDF download button
        const downloadPdfBtn = document.getElementById('downloadPdfBtn');
        if (downloadPdfBtn) {
            downloadPdfBtn.disabled = true;
            downloadPdfBtn.title = 'PDF export unavailable - API not configured';
            downloadPdfBtn.style.opacity = '0.5';
            downloadPdfBtn.style.cursor = 'not-allowed';
        }
    }
}

function checkApiKeyAndStart() {
    // Check if user is logged in - if not, show auth modal
    if (!appState.user) {
        showAuthModal('login');
        return;
    }

    const hasKey = localStorage.getItem('groqKey');

    if (!hasKey) {
        appState.isPromptingForKey = true;
        showNotification('Please provide an API key to start assessment!', 'info');
        showSettingsModal();
    } else {
        startAssessment();
    }
}

function setupEventListeners() {
    elements.startBtn?.addEventListener('click', checkApiKeyAndStart);

    // Settings
    elements.settingsBtn?.addEventListener('click', showSettingsModal);
    document.getElementById('lastRoadmapBtn')?.addEventListener('click', () => {
        if (appState.roadmap) {
            showSection('roadmapSection');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    elements.closeSettingsModal?.addEventListener('click', hideSettingsModal);
    elements.saveSettingsBtn?.addEventListener('click', saveSettings);
    elements.clearSettingsBtn?.addEventListener('click', clearSettings);
    elements.nextBtn?.addEventListener('click', nextQuestion);
    elements.prevBtn?.addEventListener('click', prevQuestion);
    elements.copyRoadmapBtn?.addEventListener('click', copyRoadmap);
    elements.exportRoadmapBtn?.addEventListener('click', exportRoadmap);
    elements.retakeBtn?.addEventListener('click', resetAndRetake);
    elements.sendMentorBtn?.addEventListener('click', sendMentorMessage);
    
    // PDF Download
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    downloadPdfBtn?.addEventListener('click', downloadRoadmapPDF);
    
    // Main Generate Roadmap Button (after evaluation)
    const generateRoadmapMainBtn = document.getElementById('generateRoadmapMainBtn');
    generateRoadmapMainBtn?.addEventListener('click', () => {
        // STRICT: Assessment required
        if (!appState.assessment) {
            showError('Please complete your skill assessment first!');
            showSection('assessmentSection');
            return;
        }
        // Open certification selection modal
        openCertModal();
    });
    
    // Regenerate button in roadmap section
    const regenerateRoadmapBtn = document.getElementById('regenerateRoadmapBtn');
    regenerateRoadmapBtn?.addEventListener('click', () => {
        if (!appState.assessment) {
            showError('Please complete your skill assessment first!');
            showSection('assessmentSection');
            return;
        }
        openCertModal();
    });
    
    // Certification Modal
    setupCertModal();
    
    if (elements.reviewContinueBtn) {
        elements.reviewContinueBtn.addEventListener('click', proceedToEvaluation);
    }
    if (elements.modeCheckbox) {
        elements.modeCheckbox.addEventListener('change', toggleLearningMode);
    }
    
    elements.mentorInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMentorMessage();
        }
    });
    
    // Intent buttons
    if (elements.mentorIntentButtons) {
        Array.from(elements.mentorIntentButtons.children).forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectMentorIntent(e.target);
            });
        });
    }
}

// ============================================================================
// AUTHENTICATION SYSTEM
// ============================================================================

function setupAuthListeners() {
    // Login button opens modal
    elements.loginBtn?.addEventListener('click', () => showAuthModal('login'));
    
    // Close modal
    elements.closeAuthModal?.addEventListener('click', hideAuthModal);
    elements.authModal?.addEventListener('click', (e) => {
        if (e.target === elements.authModal || e.target.classList.contains('modal-backdrop')) {
            hideAuthModal();
        }
    });
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tabName === 'login') {
                elements.loginForm?.classList.remove('hidden');
                elements.registerForm?.classList.add('hidden');
            } else {
                elements.loginForm?.classList.add('hidden');
                elements.registerForm?.classList.remove('hidden');
            }
        });
    });
    
    // Login form submit
    elements.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrUsername = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            showLoadingInButton(e.target.querySelector('button[type="submit"]'), 'Logging in...');
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password })
            });
            
            const data = await safeResponseJSON(response, '/api/login');
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Success - save session
            appState.sessionId = data.sessionId;
            appState.user = data.user;
            localStorage.setItem('sessionId', data.sessionId);
            
            hideAuthModal();
            updateAuthUI();
            showNotification('Welcome back! 🎉', 'success');
            
            // Start assessment flow (will prompt for key if missing)
            checkApiKeyAndStart();
            
        } catch (error) {
            showAuthError('login', error.message);
        } finally {
            resetButton(e.target.querySelector('button[type="submit"]'), 'Login');
        }
    });
    
    // Register form submit
    elements.registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        try {
            showLoadingInButton(e.target.querySelector('button[type="submit"]'), 'Creating account...');
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });
            
            const data = await safeResponseJSON(response, '/api/register');
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // Success - save session
            appState.sessionId = data.sessionId;
            appState.user = data.user;
            localStorage.setItem('sessionId', data.sessionId);
            
            hideAuthModal();
            updateAuthUI();
            showNotification('Account created! Welcome aboard! 🚀', 'success');
            
            // Start assessment flow (will prompt for key if missing)
            checkApiKeyAndStart();
            
        } catch (error) {
            showAuthError('register', error.message);
        } finally {
            resetButton(e.target.querySelector('button[type="submit"]'), 'Create Account');
        }
    });
    
    // Logout
    elements.logoutBtn?.addEventListener('click', handleLogout);
}

function showAuthModal(tab = 'login') {
    elements.authModal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Animate in
    const content = elements.authModal?.querySelector('.auth-modal');
    content?.classList.add('animate__animated', 'animate__zoomIn');
    
    // Set active tab
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'login') {
        elements.loginForm?.classList.remove('hidden');
        elements.registerForm?.classList.add('hidden');
    } else {
        elements.loginForm?.classList.add('hidden');
        elements.registerForm?.classList.remove('hidden');
    }
}

function hideAuthModal() {
    elements.authModal?.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Clear errors
    elements.loginError?.classList.add('hidden');
    elements.registerError?.classList.add('hidden');
}

function showAuthError(type, message) {
    const errorEl = type === 'login' ? elements.loginError : elements.registerError;
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

async function checkExistingSession() {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;
    
    try {
        const response = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${sessionId}` }
        });
        
        if (response.ok) {
            const data = await safeResponseJSON(response, '/api/me');
            appState.sessionId = sessionId;
            appState.user = data.user;
            updateAuthUI();
        } else {
            localStorage.removeItem('sessionId');
        }
    } catch (error) {
        console.error('Session check failed:', error);
        localStorage.removeItem('sessionId');
    }
}

function updateAuthUI() {
    if (appState.user) {
        elements.navAuth?.classList.add('hidden');
        elements.navUser?.classList.remove('hidden');
        if (elements.navUsername) {
            elements.navUsername.textContent = appState.user.username || 'User';
        }
    } else {
        elements.navAuth?.classList.remove('hidden');
        elements.navUser?.classList.add('hidden');
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${appState.sessionId}` }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    appState.sessionId = null;
    appState.user = null;
    localStorage.removeItem('sessionId');
    updateAuthUI();
    showNotification('Logged out successfully', 'info');
}

function showLoadingInButton(btn, text) {
    if (!btn) return;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
}

function resetButton(btn, text) {
    if (!btn) return;
    btn.textContent = text || btn.dataset.originalText || 'Submit';
    btn.disabled = false;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function setupAOS() {
    if (window.AOS) {
        AOS.init({
            duration: 800,
            offset: 100,
            once: false
        });
    } else {
        document.body.classList.add('aos-disabled');
    }
}

function setupLenis() {
    if (window.Lenis) {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }
}

function setupIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

function setupGSAP() {
    if (!window.gsap) return;
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach((btn) => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, { scale: 1.02, duration: 0.15, ease: 'power1.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { scale: 1, duration: 0.15, ease: 'power1.out' });
        });
        btn.addEventListener('mousedown', () => {
            gsap.to(btn, { scale: 0.98, duration: 0.1, ease: 'power1.out' });
        });
        btn.addEventListener('mouseup', () => {
            gsap.to(btn, { scale: 1.02, duration: 0.1, ease: 'power1.out' });
        });
    });
    
    // GSAP ScrollTrigger animations
    if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        
        // Animate sections on scroll
        gsap.utils.toArray('.section').forEach(section => {
            gsap.from(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: 'power2.out'
            });
        });
        
        // Animate cert cards
        gsap.utils.toArray('.cert-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 40,
                rotateX: -15,
                duration: 0.6,
                delay: i * 0.1,
                ease: 'back.out(1.2)'
            });
        });
    }
}

// Particle background animation
function setupParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.color = Math.random() > 0.5 ? '#ff6b35' : '#00d4aa';
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x < 0 || this.x > canvas.width || 
                this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.opacity;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    function init() {
        particles = [];
        const particleCount = Math.min(80, Math.floor(canvas.width / 20));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = '#ff6b35';
                    ctx.globalAlpha = (1 - dist / 120) * 0.2;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        drawConnections();
        animationId = requestAnimationFrame(animate);
    }
    
    resize();
    init();
    animate();
    
    window.addEventListener('resize', () => {
        resize();
        init();
    });
}

// Typed.js effect for hero subtitle
function setupTypedText() {
    const typedElement = document.querySelector('.typed-text');
    if (!typedElement || !window.Typed) return;
    
    new Typed('.typed-text', {
        strings: [
            'AI-Powered Learning Paths',
            'OSCP Preparation Made Easy',
            'Master Offensive Security',
            'Real-World Attack Techniques',
            'Personalized Skill Assessment'
        ],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true,
        cursorChar: '_',
        smartBackspace: true
    });
}

// Hero section animations
function setupHeroAnimations() {
    // Animate stat numbers
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    
    const animateNumber = (el) => {
        const target = parseInt(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        
        const duration = 2000;
        const start = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            const current = Math.floor(target * eased);
            el.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                el.textContent = target;
            }
        };
        
        animate();
    };
    
    // Use Intersection Observer for stat animation
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateNumber(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(num => observer.observe(num));
    }
    
    // Floating animation for logo rings
    const rings = document.querySelectorAll('.logo-ring');
    rings.forEach((ring, i) => {
        ring.style.animationDelay = `${i * 0.2}s`;
    });
    
    // Glitch effect trigger on hover
    const glitchTitle = document.querySelector('.glitch');
    if (glitchTitle && window.gsap) {
        glitchTitle.addEventListener('mouseenter', () => {
            gsap.to(glitchTitle, {
                skewX: 5,
                duration: 0.1,
                yoyo: true,
                repeat: 3,
                ease: 'power1.inOut'
            });
        });
    }
}

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// Certificate filter functionality
function setupCertFilters() {
    const filterBtns = document.querySelectorAll('.cert-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            filterCertifications(filter);
        });
    });
}

// ============================================================================
// LEARNING MODE TOGGLE
// ============================================================================

function toggleLearningMode() {
    appState.learningMode = elements.modeCheckbox?.checked ? 'oscp' : 'beginner';
    
    if (elements.modeLabel) {
        elements.modeLabel.textContent = appState.learningMode === 'oscp' ? 'OSCP Mode' : 'Beginner Mode';
    }
    if (elements.modeBanner) {
        elements.modeBanner.classList.toggle('active', appState.learningMode === 'oscp');
    }
    if (elements.heroSubtitle) {
        elements.heroSubtitle.textContent = appState.learningMode === 'oscp'
            ? 'OSCP-ready prep: prove your fundamentals and sharpen your mindset.'
            : 'Discover your security skills. Build your path to mastery.';
    }
    if (elements.assessmentTitle && elements.assessmentSubtitle) {
        elements.assessmentTitle.textContent = appState.learningMode === 'oscp'
            ? 'OSCP Readiness Check'
            : 'Skill Assessment';
        elements.assessmentSubtitle.textContent = appState.learningMode === 'oscp'
            ? 'Brutal but fair questions to measure your readiness.'
            : 'Answer these questions honestly. This helps us personalize your roadmap.';
    }
    
    document.body.classList.toggle('mode-oscp', appState.learningMode === 'oscp');
    showSuccess(`Switched to ${appState.learningMode === 'oscp' ? 'OSCP' : 'Beginner'} mode`);
}

// ============================================================================
// BACKEND API CALLS
// ============================================================================

/**
 * Safely parse JSON from response with HTML detection
 * @param {Response} response - Fetch response object
 * @param {string} endpoint - Endpoint name for logging
 * @returns {Promise<object>} - Parsed JSON data
 */
async function safeResponseJSON(response, endpoint) {
    const text = await response.text();
    console.log(`📄 Raw response from ${endpoint}:`, text.substring(0, 200));
    
    // CRITICAL: Check if response is HTML instead of JSON
    if (text.trim().startsWith('<')) {
        console.error(`❌ ROUTING ERROR: Received HTML instead of JSON from ${endpoint}`);
        console.error(`   This means the API route is not working correctly.`);
        console.error(`   Frontend called: ${endpoint}`);
        console.error(`   Response starts with: ${text.substring(0, 100)}`);
        throw new Error(`Routing error: API endpoint ${endpoint} returned HTML instead of JSON. Check backend API routes.`);
    }
    
    // Parse JSON from text
    try {
        return JSON.parse(text);
    } catch (parseError) {
        console.error(`❌ JSON Parse Error on ${endpoint}:`, parseError.message);
        console.error(`   Raw text:`, text);
        throw new Error(`Invalid JSON response from ${endpoint}: ${parseError.message}`);
    }
}

/**
 * Settings Management
 */
function showSettingsModal() {
    elements.settingsModal?.classList.remove('hidden');

    // Load existing keys
    document.getElementById('groqKey').value = localStorage.getItem('groqKey') || '';
    document.getElementById('ilovepdfPublicKey').value = localStorage.getItem('ilovepdfPublicKey') || '';
    document.getElementById('ilovepdfSecretKey').value = localStorage.getItem('ilovepdfSecretKey') || '';
}

function hideSettingsModal() {
    elements.settingsModal?.classList.add('hidden');
}

function saveSettings() {
    localStorage.setItem('groqKey', document.getElementById('groqKey').value.trim());
    localStorage.setItem('ilovepdfPublicKey', document.getElementById('ilovepdfPublicKey').value.trim());
    localStorage.setItem('ilovepdfSecretKey', document.getElementById('ilovepdfSecretKey').value.trim());

    showNotification('Settings saved successfully', 'success');
    hideSettingsModal();

    // If we were prompting for a key to start assessment, start it now
    if (appState.isPromptingForKey) {
        appState.isPromptingForKey = false;
        startAssessment();
    }
}

function clearSettings() {
    localStorage.removeItem('groqKey');
    localStorage.removeItem('ilovepdfPublicKey');
    localStorage.removeItem('ilovepdfSecretKey');

    document.getElementById('groqKey').value = '';
    document.getElementById('ilovepdfPublicKey').value = '';
    document.getElementById('ilovepdfSecretKey').value = '';

    showNotification('API keys cleared', 'info');
}

/**
 * Call backend API endpoint
 * @param {string} endpoint - API endpoint (e.g., '/api/generate-questions')
 * @param {object} data - Request body data
 * @returns {Promise<object>} - Response data
 */
async function callBackendAPI(endpoint, data = {}) {
    console.log(`📤 Calling ${endpoint}...`);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add custom API keys if present
        const groqKey = localStorage.getItem('groqKey');

        if (groqKey) headers['X-Groq-API-Key'] = groqKey;

        // Add authorization header if logged in
        if (appState.sessionId) {
            headers['Authorization'] = `Bearer ${appState.sessionId}`;
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        // Use safe JSON parsing with HTML detection
        const result = await safeResponseJSON(response, endpoint);
        
        // Check response status after parsing
        if (!response.ok) {
            console.error(`❌ API Error (${response.status}):`, result);
            throw new Error(result.error || `API request failed with status ${response.status}`);
        }

        console.log(`✅ ${endpoint} successful`);
        return result;
    } catch (error) {
        console.error(`❌ Error calling ${endpoint}:`, error.message);
        throw error;
    }
}

// ============================================================================
// SECTION 1: START ASSESSMENT
// ============================================================================

async function startAssessment() {
    console.log('🎯 Starting assessment...');
    showSection('assessmentSection');
    
    try {
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Generating Questions...';
        
        // Call backend API
        const data = await callBackendAPI('/api/generate-questions', {
            mode: appState.learningMode
        });
        
        appState.questions = data.questions || [];
        
        if (appState.questions.length === 0) {
            throw new Error('No questions generated');
        }
        
        console.log(`✅ Received ${appState.questions.length} questions`);
        
        appState.currentQuestion = 0;
        appState.answers = {};
        
        renderQuestion();
        updateProgress();
    } catch (error) {
        console.error('❌ Error starting assessment:', error);
        showError('Failed to generate assessment questions. Please try again.');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = 'Assess My Skill Level';
    }
}

function renderQuestion() {
    const question = appState.questions[appState.currentQuestion];
    if (!question) return;
    
    elements.questionContainer.innerHTML = '';
    
    const questionEl = document.createElement('div');
    questionEl.className = 'question-item';
    
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question;
    
    questionEl.appendChild(questionText);
    
    if (question.type === 'multiple-choice') {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-list';
        
        question.options.forEach((option, index) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.dataset.value = option;
            optionItem.dataset.index = index;
            
            if (appState.answers[appState.currentQuestion] === option) {
                optionItem.classList.add('selected');
            }
            
            const marker = document.createElement('div');
            marker.className = 'option-marker';
            marker.textContent = String.fromCharCode(65 + index); // A, B, C, D
            
            const label = document.createElement('div');
            label.className = 'option-label';
            label.textContent = option;
            
            optionItem.appendChild(marker);
            optionItem.appendChild(label);
            
            // Click handler
            optionItem.addEventListener('click', () => {
                // Remove selected from all options
                optionsContainer.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
                // Add selected to clicked option
                optionItem.classList.add('selected');
                // Save answer
                appState.answers[appState.currentQuestion] = option;
            });
            
            optionsContainer.appendChild(optionItem);
        });
        
        questionEl.appendChild(optionsContainer);
    } else if (question.type === 'short-answer') {
        const input = document.createElement('textarea');
        input.className = 'short-answer-input';
        input.placeholder = 'Your answer...';
        input.rows = 4;
        input.value = appState.answers[appState.currentQuestion] || '';
        input.addEventListener('input', (e) => {
            appState.answers[appState.currentQuestion] = e.target.value;
        });
        questionEl.appendChild(input);
    }
    
    elements.questionContainer.appendChild(questionEl);
}

function nextQuestion() {
    const qIndex = appState.currentQuestion;
    const question = appState.questions[qIndex];
    
    if (question.type === 'multiple-choice') {
        const selected = document.querySelector('.option-item.selected');
        if (!selected) {
            showError('Please select an answer before continuing.');
            return;
        }
        appState.answers[qIndex] = selected.dataset.value;
    }
    
    if (question.type === 'short-answer') {
        const input = elements.questionContainer.querySelector('.short-answer-input');
        if (!input || !input.value.trim()) {
            showError('Please write a short answer before continuing.');
            return;
        }
        appState.answers[qIndex] = input.value.trim();
    }
    
    if (appState.currentQuestion < appState.questions.length - 1) {
        appState.currentQuestion++;
        renderQuestion();
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        submitAssessment();
    }
}

function prevQuestion() {
    const qIndex = appState.currentQuestion;
    const question = appState.questions[qIndex];
    
    if (question.type === 'multiple-choice') {
        const selected = document.querySelector('.option-item.selected');
        if (selected) {
            appState.answers[qIndex] = selected.dataset.value;
        }
    }
    
    if (appState.currentQuestion > 0) {
        appState.currentQuestion--;
        renderQuestion();
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateProgress() {
    const total = appState.questions.length;
    const current = appState.currentQuestion + 1;
    const percentage = (current / total) * 100;
    
    elements.progressFill.style.width = `${percentage}%`;
    elements.questionCounter.textContent = `Question ${current} of ${total}`;
    
    elements.prevBtn.style.display = appState.currentQuestion > 0 ? 'inline-flex' : 'none';
    
    if (appState.currentQuestion === total - 1) {
        elements.nextBtn.textContent = 'Submit Assessment';
    } else {
        elements.nextBtn.textContent = 'Next';
    }
}

async function submitAssessment() {
    try {
        elements.nextBtn.disabled = true;
        elements.nextBtn.textContent = 'Reviewing...';

        buildReview();
        showSection('reviewSection');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        elements.nextBtn.disabled = false;
        elements.nextBtn.textContent = 'Next';
    } catch (error) {
        console.error('Error submitting assessment:', error);
        showError('Failed to submit assessment. Please try again.');
        elements.nextBtn.disabled = false;
        elements.nextBtn.textContent = 'Submit Assessment';
    }
}

function buildReview() {
    if (!elements.reviewContainer) return;
    elements.reviewContainer.innerHTML = '';

    appState.questions.forEach((q, idx) => {
        const userAnswer = appState.answers[idx] || '(No answer)';
        const correctAnswer = q.correctAnswer || 'Not provided';
        const explanation = q.explanation || 'No explanation provided.';

        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <h3>Q${idx + 1}: ${q.question}</h3>
            <div class="review-label">Your Answer</div>
            <div class="review-answer">${userAnswer}</div>
            <div class="review-label">Expected Answer</div>
            <div class="review-answer">${correctAnswer}</div>
            <div class="review-label">Explanation</div>
            <div class="review-explanation">${explanation}</div>
        `;
        elements.reviewContainer.appendChild(card);
    });
}

async function proceedToEvaluation() {
    try {
        elements.reviewContinueBtn.disabled = true;
        elements.reviewContinueBtn.textContent = 'Analyzing...';

        // Call backend API for evaluation
        const data = await callBackendAPI('/api/evaluate-assessment', {
            answers: appState.answers,
            questions: appState.questions,
            mode: appState.learningMode
        });

        appState.assessment = data;

        showEvaluation();
        showSection('evaluationSection');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 10% chance to show easter egg after assessment completion
        if (Math.random() < 0.1) {
            setTimeout(() => {
                showRandomEasterEgg();
            }, 2000);
        }
    } catch (error) {
        console.error('Error evaluating assessment:', error);
        showError('Failed to evaluate assessment. Please try again.');
    } finally {
        elements.reviewContinueBtn.disabled = false;
        elements.reviewContinueBtn.textContent = 'Continue to Evaluation';
    }
}

function showEvaluation() {
    const assessment = appState.assessment;
    
    // Toggle visibility based on mode
    const readinessCard = document.querySelector('.readiness-card');
    const gapsCard = document.querySelector('.gaps-card');

    if (appState.learningMode === 'beginner') {
        if (readinessCard) readinessCard.classList.add('hidden');
        if (gapsCard) gapsCard.classList.add('hidden');
    } else {
        if (readinessCard) readinessCard.classList.remove('hidden');
        if (gapsCard) gapsCard.classList.remove('hidden');
    }

    if (elements.readinessScore) {
        elements.readinessScore.textContent = `${assessment.readinessScore || 0}%`;
    }
    if (elements.readinessStatus) {
        elements.readinessStatus.textContent = assessment.readinessStatus || 'Analyzing...';
        elements.readinessStatus.className = `readiness-status status-${(assessment.readinessStatus || '').toLowerCase().replace(/\s/g, '-')}`;
    }
    if (elements.oscpAlignment) {
        elements.oscpAlignment.textContent = assessment.oscpAlignment || '';
    }
    
    if (elements.skillBreakdown && assessment.skillBreakdown) {
        elements.skillBreakdown.innerHTML = Object.entries(assessment.skillBreakdown)
            .map(([skill, score]) => `
                <div class="skill-item">
                    <div class="skill-label">
                        <span>${skill}</span>
                        <span>${score}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-bar-fill" style="width: ${score}%"></div>
                    </div>
                </div>
            `).join('');
    }
    
    if (elements.strengthsList) {
        elements.strengthsList.innerHTML = (assessment.strengths || [])
            .map(s => `<li>${s}</li>`)
            .join('');
    }
    
    if (elements.weaknessesList) {
        elements.weaknessesList.innerHTML = (assessment.weaknesses || [])
            .map(w => `<li>${w}</li>`)
            .join('');
    }

    if (elements.confidenceGapsList) {
        elements.confidenceGapsList.innerHTML = (assessment.confidenceGaps || [])
            .map(g => `<li>${g}</li>`)
            .join('');
    }

    if (elements.focusSuggestion) {
        elements.focusSuggestion.textContent = assessment.focusSuggestion || 'Focus on your growth areas.';
    }
}

// ============================================================================
// SECTION 2: CERTIFICATION SELECTION
// ============================================================================

function showCertificationSection() {
    // REQUIRE assessment to be completed first
    if (!appState.assessment) {
        showError('Please complete the assessment first.');
        showSection('assessmentSection');
        return;
    }
    
    renderCertifications();
    showSection('certSection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCertifications(filter = 'all') {
    const filteredCerts = filter === 'all' 
        ? CERTIFICATIONS 
        : CERTIFICATIONS.filter(c => c.type === filter);
    
    elements.certGrid.innerHTML = filteredCerts.map(cert => `
        <div class="cert-card" data-cert-id="${cert.id}" data-type="${cert.type}">
            <div class="cert-type-badge ${cert.type}">${cert.type === 'attack' ? 'ATTACK' : 'DEFENSE'}</div>
            <div class="cert-name">${cert.name}</div>
            <div class="cert-desc">${cert.title}</div>
            <p class="cert-detail">${cert.description}</p>
            <div class="cert-stats">
                <span class="cert-stat">${cert.provider}</span>
                <span class="cert-stat">${cert.level}</span>
                <span class="cert-stat">${cert.duration}</span>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    Array.from(elements.certGrid.children).forEach(card => {
        card.addEventListener('click', (e) => selectCertification(card, e));
    });
}

function filterCertifications(filter) {
    renderCertifications(filter);
}

function selectCertification(card, event) {
    // Mark selected
    Array.from(elements.certGrid.children).forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    appState.selectedCert = card.getAttribute('data-cert-id');
    const cert = CERTIFICATIONS.find(c => c.id === appState.selectedCert);
    
    // Show simple confirmation
    showCertSelectionOverlay(cert);
}

function showCertSelectionOverlay(cert) {
    const overlay = document.getElementById('selectedCertOverlay');
    if (!overlay) return;
    
    // Populate overlay content
    const overlayContent = overlay.querySelector('.cert-selected-content');
    if (overlayContent) {
        overlayContent.innerHTML = `
            <div class="selected-cert-badge ${cert.type}">${cert.type === 'attack' ? 'ATTACK PATH' : 'DEFENSE PATH'}</div>
            <h2 class="selected-cert-name">${cert.name}</h2>
            <p class="selected-cert-title">${cert.title}</p>
            <p class="selected-cert-desc">${cert.description}</p>
            <div class="selected-cert-stats">
                <div class="selected-stat">
                    <span class="stat-label">Provider</span>
                    <span class="stat-value">${cert.provider}</span>
                </div>
                <div class="selected-stat">
                    <span class="stat-label">Level</span>
                    <span class="stat-value">${cert.level}</span>
                </div>
                <div class="selected-stat">
                    <span class="stat-label">Study Time</span>
                    <span class="stat-value">${cert.duration}</span>
                </div>
            </div>
            <button class="btn btn-primary confirm-cert-btn">
                Generate My Roadmap
            </button>
        `;
        
        // Add click handler for confirm button
        const confirmBtn = overlayContent.querySelector('.confirm-cert-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                overlay.classList.remove('active');
                setTimeout(() => generateRoadmap(), 300);
            });
        }
    }
    
    // Show overlay with animation
    overlay.classList.add('active');
    
    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
    
    // Close on escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.classList.remove('active');
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ============================================================================
// SECTION 3: PERSONALIZED ROADMAP WITH CERTIFICATION MODAL
// ============================================================================

// Global state for modal
window.selectedCertification = null;
window.assessmentResult = null;

function setupCertModal() {
    const modal = document.getElementById('certModal');
    const backdrop = modal?.querySelector('.cert-modal-backdrop');
    const cancelBtn = document.getElementById('certModalCancel');
    const confirmBtn = document.getElementById('certModalConfirm');
    const options = document.querySelectorAll('.cert-option');
    
    // Close modal handlers
    backdrop?.addEventListener('click', closeCertModal);
    cancelBtn?.addEventListener('click', closeCertModal);
    
    // Confirm selection
    confirmBtn?.addEventListener('click', () => {
        if (window.selectedCertification) {
            closeCertModal();
            generateRoadmapForCert(window.selectedCertification);
        }
    });
    
    // Option selection
    options.forEach((option, index) => {
        option.addEventListener('click', () => selectCertOption(option));
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectCertOption(option);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = options[index + 1] || options[0];
                next.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = options[index - 1] || options[options.length - 1];
                prev.focus();
            }
        });
    });
    
    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeCertModal();
        }
    });
}

function openCertModal() {
    const modal = document.getElementById('certModal');
    const confirmBtn = document.getElementById('certModalConfirm');
    
    // Reset state
    window.selectedCertification = null;
    confirmBtn.disabled = true;
    
    // Clear previous selection
    document.querySelectorAll('.cert-option').forEach(opt => opt.classList.remove('selected'));
    
    // Show modal
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('active');
        // Focus first option
        document.querySelector('.cert-option')?.focus();
    }, 10);
}

function closeCertModal() {
    const modal = document.getElementById('certModal');
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function selectCertOption(option) {
    const confirmBtn = document.getElementById('certModalConfirm');
    
    // Remove previous selection
    document.querySelectorAll('.cert-option').forEach(opt => opt.classList.remove('selected'));
    
    // Select this one
    option.classList.add('selected');
    window.selectedCertification = option.dataset.cert;
    
    // Enable confirm button
    confirmBtn.disabled = false;
}

async function generateRoadmapForCert(certId) {
    // Store in window state
    window.selectedCertification = certId;
    window.assessmentResult = appState.assessment;
    
    const certNames = {
        'thm-jr-pentester': 'THM JR - TryHackMe Junior Penetration Tester',
        'ejpt': 'eJPT - eLearnSecurity Junior Penetration Tester',
        'ceh': 'CEH - Certified Ethical Hacker',
        'pnpt': 'PNPT - Practical Network Penetration Tester',
        'oscp': 'OSCP - Offensive Security Certified Professional',
        'cpts': 'CPTS - HTB Certified Penetration Testing Specialist',
        'osep': 'OSEP - Offensive Security Experienced Penetration Tester',
        'oswe': 'OSWE - Offensive Security Web Expert',
        'osda': 'OSDA - Offensive Security Defense Analyst',
        'oswp': 'OSWP - Offensive Security Wireless Professional',
        'osed': 'OSED - Offensive Security Exploit Developer',
        'osee': 'OSEE - Offensive Security Exploitation Expert',
        'osmr': 'OSMR - Offensive Security macOS Researcher'
    };
    
    const certName = certNames[certId] || certId.toUpperCase();
    appState.selectedCert = certId;
    
    // Get assessment data
    const level = appState.assessment?.level || 'Beginner';
    const weaknesses = appState.assessment?.weaknesses || ['networking', 'linux', 'web security'];
    
    // Show roadmap section
    showSection('roadmapSection');
    // Ensure the container for loading screen is visible
    document.getElementById('roadmapContainerLegacy')?.classList.remove('hidden');
    document.getElementById('roadmapTimelineV2')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update header
    const roadmapTitle = document.getElementById('roadmapTitle');
    const roadmapSubtitle = document.getElementById('roadmapSubtitle');
    if (roadmapTitle) roadmapTitle.textContent = `Your ${certName.split(' - ')[0]} Learning Roadmap`;
    if (roadmapSubtitle) roadmapSubtitle.textContent = `Personalized for your ${level} level • Target: ${certName}`;
    
    // Clear any existing intervals from previous calls
    if (window.roadmapCountdownInterval) {
        clearInterval(window.roadmapCountdownInterval);
    }
    if (window.roadmapJokeInterval) {
        clearInterval(window.roadmapJokeInterval);
    }
    if (window.roadmapStageInterval) {
        clearInterval(window.roadmapStageInterval);
    }
    
    // Enhanced multi-stage loading with progress tracking
    const roadmapContent = document.getElementById('roadmapContent');
    
    // Loading stages with realistic durations
    const loadingStages = [
        { stage: 1, text: "🔍 Analyzing your skill level and gaps...", duration: 3000 },
        { stage: 2, text: "🎯 Identifying key weaknesses to address...", duration: 2500 },
        { stage: 3, text: "📚 Structuring learning phases...", duration: 4000 },
        { stage: 4, text: "🔧 Finding tools and resources...", duration: 3500 },
        { stage: 5, text: "🗓️ Building your personalized timeline...", duration: 3000 },
        { stage: 6, text: "✨ Finalizing your roadmap...", duration: 2000 }
    ];
    
    // Calculate total duration once
    const TOTAL_LOADING_DURATION = loadingStages.reduce((sum, stage) => sum + stage.duration, 0);
    
    let currentStage = 0;
    let progress = 0;
    
    roadmapContent.innerHTML = `
        <div class="loading-state enhanced neo-brutal-loading">
            <div class="loading-header">
                <h3 class="neo-brutal-title glitch-text">COMPILING ROADMAP</h3>
                <p class="loading-cert-name-v3">${certName}</p>
            </div>
            
            <div class="brutal-percentage-container">
                <div class="brutal-percentage-value" id="progressPercentage">0%</div>
                <div class="brutal-percentage-label">SYSTEM_COMPILING...</div>
            </div>

            <div class="cyber-loader-container-v3">
                <div class="loading-joke-container-v3" id="loadingJoke">
                    "🔧 75% of bugs are fixed by checking the API key..."
                </div>
            </div>
            
            <div class="loading-stages-neo-v3">
                ${loadingStages.map((s, i) => `
                    <div class="stage-item-neo-v3 ${i === 0 ? 'active' : ''}" data-stage="${s.stage}">
                        <div class="stage-indicator-neo-v3">
                            <span class="stage-num-v3">${s.stage}</span>
                            <span class="stage-done-v3">DONE</span>
                        </div>
                        <div class="stage-label-v3">${s.text}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="neo-progress-container-v3">
                <div class="neo-progress-bar-v3" id="roadmapProgressBar" style="width: 0%"></div>
                <div class="neo-progress-glitch"></div>
            </div>
            
            <div class="neo-loading-footer-v3">
                <div class="terminal-status">
                    <span class="status-dot"></span>
                    <span class="status-text">KERNEL_STATUS: ACTIVE</span>
                </div>
                <div class="terminal-command">EXEC roadmap_gen --target "${certId}"</div>
            </div>
        </div>
    `;

    // Start Joke Rotation
    let jokeIndex = 0;
    window.roadmapJokeInterval = setInterval(() => {
        const jokeEl = document.getElementById('loadingJoke');
        if (jokeEl) {
            jokeIndex = (jokeIndex + 1) % DEV_JOKES.length;
            jokeEl.style.opacity = 0;
            setTimeout(() => {
                jokeEl.textContent = `"${DEV_JOKES[jokeIndex]}"`;
                jokeEl.style.opacity = 1;
            }, 300);
        }
    }, 4000);
    
    // Animate progress through stages
    const progressBar = document.getElementById('roadmapProgressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    let elapsedTime = 0;
    
    // Function to update stage UI
    const updateStage = (stageIndex) => {
        const stageItems = document.querySelectorAll('.stage-item-neo-v3');
        stageItems.forEach((item, i) => {
            if (i < stageIndex) {
                item.classList.remove('active');
                item.classList.add('completed');
            } else if (i === stageIndex) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });
    };
    
    // Progress animation
    window.roadmapStageInterval = setInterval(() => {
        elapsedTime += 100;
        progress = Math.min((elapsedTime / TOTAL_LOADING_DURATION) * 100, 99);
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.floor(progress)}%`;
        }
        
        // Update stage based on elapsed time
        let cumulativeTime = 0;
        for (let i = 0; i < loadingStages.length; i++) {
            cumulativeTime += loadingStages[i].duration;
            if (elapsedTime < cumulativeTime) {
                if (currentStage !== i) {
                    currentStage = i;
                    updateStage(i);
                }
                break;
            }
        }
    }, 100);
    
    try {
        const data = await callBackendAPI('/api/generate-roadmap', {
            level: level,
            weaknesses: weaknesses,
            cert: certName,
            mode: appState.learningMode,
            assessmentResult: appState.assessment
        });
        
        // Clear intervals
        if (window.roadmapCountdownInterval) clearInterval(window.roadmapCountdownInterval);
        if (window.roadmapJokeInterval) clearInterval(window.roadmapJokeInterval);
        if (window.roadmapStageInterval) clearInterval(window.roadmapStageInterval);
        
        // Complete the progress bar animation
        if (progressBar) progressBar.style.width = '100%';
        if (progressPercentage) progressPercentage.textContent = '100%';
        
        // Mark all stages complete
        document.querySelectorAll('.stage-item-neo-v3').forEach(item => {
            item.classList.remove('active');
            item.classList.add('completed');
        });
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        appState.roadmap = data.roadmap;
        displayRoadmap(data.roadmap);
        
        // Show "Latest Roadmap" button in navbar
        document.getElementById('lastRoadmapBtn')?.classList.remove('hidden');

        // Show actions
        document.getElementById('roadmapActionsDiv')?.classList.remove('hidden');
        
        // Show mentor section
        setTimeout(() => {
            const mentor = document.getElementById('mentorSection');
            if (mentor) mentor.classList.remove('hidden');
            initMentorChat();
        }, 500);
        
        showSuccess('Roadmap generated successfully!');
    } catch (error) {
        console.error('Error generating roadmap:', error);
        
        // Clear intervals
        if (window.roadmapCountdownInterval) clearInterval(window.roadmapCountdownInterval);
        if (window.roadmapJokeInterval) clearInterval(window.roadmapJokeInterval);
        if (window.roadmapStageInterval) clearInterval(window.roadmapStageInterval);
        
        // Show friendly error message (not technical details)
        const errorMessage = error.userMessage || error.message || 'AI is taking longer than expected. Please try again.';
        
        roadmapContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⏳</div>
                <h3>Roadmap Generation Delayed</h3>
                <p class="error-message-main">${errorMessage}</p>
                <p class="error-message-sub">The AI service might be experiencing high demand. This usually resolves in a few minutes.</p>
                <button class="btn btn-primary" onclick="openCertModal()">Try Again</button>
            </div>
        `;
    }
}

// Legacy function - now redirects to modal
async function generateRoadmap() {
    if (!appState.assessment) {
        showError('Please complete your skill assessment first!');
        showSection('assessmentSection');
        return;
    }
    openCertModal();
}

// Show integrated checklist based on certification
function showIntegratedChecklist(cert) {
    const checklistSection = document.getElementById('roadmapChecklist');
    const checklistItems = document.getElementById('checklistItems');
    const checklistCertName = document.getElementById('checklistCertName');
    
    if (!checklistSection || !checklistItems) return;
    
    // Set cert name
    if (checklistCertName) {
        checklistCertName.textContent = cert.name;
    }
    
    // Generate checklist based on certification
    const checklist = generateChecklistForCert(cert.id, appState.assessment?.level || 'Beginner');
    
    checklistItems.innerHTML = checklist.map((item, i) => `
        <div class="checklist-item" data-index="${i}">
            <div class="checklist-checkbox">
                <span class="check-icon" style="display: none;">✓</span>
            </div>
            <span class="checklist-text">${item}</span>
        </div>
    `).join('');
    
    // Add click handlers
    checklistItems.querySelectorAll('.checklist-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('completed');
            const icon = item.querySelector('.check-icon');
            if (icon) {
                icon.style.display = item.classList.contains('completed') ? 'block' : 'none';
            }
            updateChecklistProgress();
        });
    });
    
    checklistSection.classList.remove('hidden');
}

function generateChecklistForCert(certId, level) {
    const baseChecklist = {
        'ejpt': [
            'Complete networking fundamentals module',
            'Learn Linux command line basics',
            'Understand TCP/IP model and protocols',
            'Practice Nmap scanning techniques',
            'Study web application basics (HTTP, cookies)',
            'Complete 5 TryHackMe beginner rooms',
            'Set up your own lab environment',
            'Learn basic enumeration methodology',
            'Practice with Metasploit basics',
            'Complete INE free course materials'
        ],
        'oscp': [
            'Master Linux privilege escalation techniques',
            'Complete Windows privilege escalation path',
            'Build strong enumeration methodology',
            'Practice buffer overflow basics',
            'Master Active Directory fundamentals',
            'Complete 30+ HackTheBox machines',
            'Document your methodology in notes',
            'Practice time-boxed exam simulations',
            'Study web application attacks (SQLi, XSS)',
            'Master pivoting and tunneling'
        ],
        'osep': [
            'Complete OSCP or equivalent',
            'Master AV evasion techniques',
            'Study advanced Active Directory attacks',
            'Learn code execution techniques',
            'Practice lateral movement strategies',
            'Master phishing and initial access',
            'Study process injection methods',
            'Complete advanced HTB Pro Labs',
            'Practice report writing',
            'Build custom tooling skills'
        ],
        'oswe': [
            'Master web application fundamentals',
            'Complete PortSwigger Academy',
            'Study source code review methodology',
            'Learn authentication bypass techniques',
            'Practice SQL injection variants',
            'Master deserialization attacks',
            'Study file upload vulnerabilities',
            'Complete 20+ web-focused machines',
            'Build custom exploit scripts',
            'Practice whitebox testing methodology'
        ],
        'pnpt': [
            'Complete TCM PEH course',
            'Master OSINT techniques',
            'Learn external penetration testing',
            'Study Active Directory basics',
            'Practice network pivoting',
            'Complete TCM lab exercises',
            'Study web application testing',
            'Learn report writing basics',
            'Practice with vulnerable VMs',
            'Build professional methodology'
        ],
        'cpts': [
            'Complete HTB Academy paths',
            'Master enumeration techniques',
            'Study privilege escalation methods',
            'Practice Active Directory attacks',
            'Complete 40+ HTB machines',
            'Master post-exploitation',
            'Study network pivoting',
            'Practice with Pro Labs',
            'Document methodology thoroughly',
            'Prepare for practical exam format'
        ],
        'osda': [
            'Study SIEM fundamentals',
            'Learn log analysis techniques',
            'Master threat detection methods',
            'Study incident response basics',
            'Practice with security monitoring tools',
            'Complete SOC simulation exercises',
            'Study common attack patterns',
            'Learn forensics fundamentals',
            'Practice alert triage',
            'Build detection rule writing skills'
        ],
        'oswp': [
            'Study wireless networking fundamentals',
            'Learn 802.11 protocol details',
            'Master aircrack-ng suite',
            'Practice WEP/WPA/WPA2 attacks',
            'Study wireless reconnaissance',
            'Learn wireless client attacks',
            'Practice in isolated lab environment',
            'Study rogue access point attacks',
            'Master packet capture analysis',
            'Complete wireless penetration testing labs'
        ],
        'osed': [
            'Master x86/x64 assembly language',
            'Study Windows internals',
            'Learn reverse engineering with IDA/Ghidra',
            'Practice stack buffer overflows',
            'Study SEH overwrites',
            'Learn DEP/ASLR bypass techniques',
            'Master ROP chain development',
            'Practice shellcode development',
            'Study egghunters and staged payloads',
            'Complete exploit development labs'
        ],
        'osee': [
            'Complete OSED certification first',
            'Master advanced Windows exploitation',
            'Study kernel exploitation',
            'Learn browser exploitation basics',
            'Practice heap exploitation',
            'Study Windows kernel internals',
            'Master advanced ROP techniques',
            'Learn virtualization vulnerabilities',
            'Practice 0-day research methodology',
            'Build custom exploitation frameworks'
        ],
        'osmr': [
            'Study macOS architecture',
            'Learn Objective-C/Swift basics',
            'Master macOS security model',
            'Study code signing and notarization',
            'Practice macOS privilege escalation',
            'Learn sandbox escape techniques',
            'Study macOS malware analysis',
            'Master Mach-O binary analysis',
            'Practice kernel extension analysis',
            'Build macOS security research lab'
        ]
    };
    
    return baseChecklist[certId] || baseChecklist['oscp'];
}

function updateChecklistProgress() {
    const items = document.querySelectorAll('.checklist-item');
    const completed = document.querySelectorAll('.checklist-item.completed');
    const progress = items.length > 0 ? Math.round((completed.length / items.length) * 100) : 0;
    
    const progressCircle = document.getElementById('checklistProgressCircle');
    const progressText = document.getElementById('checklistProgressText');
    
    if (progressCircle) {
        const circumference = 283; // 2 * PI * 45
        const offset = circumference - (progress / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
}

// Show integrated resources based on cert and level
function showIntegratedResources(cert, level) {
    const resourcesSection = document.getElementById('roadmapResources');
    const resourcesContent = document.getElementById('resourcesContent');
    
    if (!resourcesSection || !resourcesContent) return;
    
    const resources = getResourcesForCert(cert.id, level);
    
    resourcesContent.innerHTML = resources.map(resource => `
        <div class="resource-card">
            <span class="resource-type">${resource.type}</span>
            <h4>${resource.name}</h4>
            <p>${resource.description}</p>
            <a href="${resource.url}" target="_blank" rel="noopener">Visit Resource</a>
        </div>
    `).join('');
    
    resourcesSection.classList.remove('hidden');
}

function getResourcesForCert(certId, level) {
    const resources = {
        'oscp': [
            { name: 'HackTheBox', type: 'Platform', url: 'https://hackthebox.com', description: 'Essential for OSCP preparation - practice machines' },
            { name: 'IppSec', type: 'YouTube', url: 'https://youtube.com/@ippsec', description: 'Detailed HTB walkthroughs and methodology' },
            { name: 'Proving Grounds', type: 'Platform', url: 'https://portal.offsec.com/labs/play', description: 'Official OffSec practice machines' },
            { name: 'TJ Null List', type: 'Resource', url: 'https://docs.google.com/spreadsheets/d/1dwSMIAPIam0PuRBkCiDI88pU3yzrqqHkDtBngUHNCw8', description: 'Curated OSCP-like HTB machines' }
        ],
        'osep': [
            { name: 'RastaMouse Blog', type: 'Resource', url: 'https://rastamouse.me/', description: 'Advanced red team content and evasion' },
            { name: 'HTB Pro Labs', type: 'Platform', url: 'https://hackthebox.com/prolabs', description: 'Enterprise-level attack simulations' },
            { name: 'Sektor7 Institute', type: 'Course', url: 'https://institute.sektor7.net/', description: 'Malware development and evasion courses' }
        ],
        'oswe': [
            { name: 'PortSwigger Academy', type: 'Platform', url: 'https://portswigger.net/web-security', description: 'Free comprehensive web security training' },
            { name: 'PentesterLab', type: 'Platform', url: 'https://pentesterlab.com', description: 'Hands-on web application pentesting' },
            { name: 'STÖK', type: 'YouTube', url: 'https://youtube.com/@STOKfredrik', description: 'Bug bounty and web security content' }
        ],
        'osda': [
            { name: 'LetsDefend', type: 'Platform', url: 'https://letsdefend.io', description: 'SOC analyst training with simulations' },
            { name: '13Cubed', type: 'YouTube', url: 'https://youtube.com/@13Cubed', description: 'DFIR and forensics content' },
            { name: 'Blue Team Labs', type: 'Platform', url: 'https://blueteamlabs.online', description: 'Defensive security challenges' }
        ],
        'oswp': [
            { name: 'WiFi Challenge Lab', type: 'Platform', url: 'https://wifichallengelab.com/', description: 'Wireless security practice environment' },
            { name: 'David Bombal', type: 'YouTube', url: 'https://youtube.com/@davidbombal', description: 'Networking and wireless tutorials' },
            { name: 'Aircrack-ng Docs', type: 'Resource', url: 'https://www.aircrack-ng.org/doku.php', description: 'Official aircrack-ng documentation' }
        ],
        'osed': [
            { name: 'Corelan Team', type: 'Resource', url: 'https://www.corelan.be/index.php/articles/', description: 'Classic exploit development tutorials' },
            { name: 'LiveOverflow', type: 'YouTube', url: 'https://youtube.com/@LiveOverflow', description: 'Binary exploitation and security research' },
            { name: 'Exploit Education', type: 'Platform', url: 'https://exploit.education/', description: 'Vulnerable VMs for exploit dev practice' }
        ],
        'osee': [
            { name: 'j00ru Blog', type: 'Resource', url: 'https://j00ru.vexillium.org/', description: 'Advanced Windows internals and exploitation' },
            { name: 'Windows Internals Book', type: 'Resource', url: 'https://learn.microsoft.com/en-us/sysinternals/resources/windows-internals', description: 'Essential Windows internals reference' },
            { name: 'Project Zero Blog', type: 'Resource', url: 'https://googleprojectzero.blogspot.com/', description: 'Cutting-edge vulnerability research' }
        ],
        'osmr': [
            { name: 'Objective-See', type: 'Resource', url: 'https://objective-see.org/', description: 'macOS security research and tools' },
            { name: 'Apple Security Docs', type: 'Resource', url: 'https://support.apple.com/guide/security/welcome/web', description: 'Official Apple security documentation' },
            { name: 'The Mac Hacker Handbook', type: 'Resource', url: 'https://www.wiley.com/en-us/The+Mac+Hacker%27s+Handbook-p-9780470395363', description: 'Classic macOS security reference' }
        ]
    };
    
    return resources[certId] || resources['oscp'];
}

function displayRoadmap(roadmapData) {
    const roadmapTimelineV2 = document.getElementById('roadmapTimelineV2');
    const roadmapLegacy = document.getElementById('roadmapContainerLegacy');
    const roadmapContent = document.getElementById('roadmapContent');
    const skillTreeSection = document.getElementById('skillTreeSection');
    const roadmapSection = document.getElementById('roadmapSection');

    if (!roadmapTimelineV2 || !roadmapLegacy || !roadmapContent) return;

    // Move skillTreeSection back to its original parent before clearing roadmapContent
    // to prevent it from being destroyed during innerHTML = ''
    if (skillTreeSection && roadmapSection && skillTreeSection.parentElement !== roadmapSection) {
        roadmapSection.appendChild(skillTreeSection);
    }

    let roadmapObj = roadmapData;
    if (typeof roadmapData === 'string') {
        try {
            roadmapObj = JSON.parse(roadmapData);
        } catch (e) {
            roadmapTimelineV2.classList.add('hidden');
            roadmapLegacy.classList.remove('hidden');
            displayRoadmapMarkdown(roadmapData);
            return;
        }
    }

    if (!roadmapObj) return;
    appState.roadmapJSON = roadmapObj;
    
    // Switch to V3 Structured layout
    roadmapTimelineV2.classList.add('hidden');
    roadmapLegacy.classList.remove('hidden');
    roadmapContent.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'roadmap-v3-container';

    // 1. Header
    const header = document.createElement('div');
    header.className = 'roadmap-v3-header';
    header.innerHTML = `
        <h1>${roadmapObj.targetCertification || 'Your Learning Roadmap'}</h1>
        <div class="roadmap-meta-v3">
            <div class="meta-item">Level: <strong>${roadmapObj.currentLevel || 'Beginner'}</strong></div>
            <div class="meta-item">Duration: <strong>12 Months</strong></div>
            <div class="meta-item">Phases: <strong>${roadmapObj.roadmap?.length || 0}</strong></div>
        </div>
        ${roadmapObj.certificationFocus ? `<p style="margin-top:15px; font-weight:600; opacity:0.9;">Focus: ${roadmapObj.certificationFocus}</p>` : ''}
    `;
    container.appendChild(header);

    // 2. Gap Analysis
    if (roadmapObj.gap_analysis) {
        const gapHeader = document.createElement('div');
        gapHeader.className = 'section-header-v3';
        gapHeader.innerHTML = `<h2>Gap Analysis</h2>`;
        container.appendChild(gapHeader);

        const gapGrid = document.createElement('div');
        gapGrid.className = 'gap-grid-v3';
        gapGrid.innerHTML = `
            <div class="gap-card">
                <h4>Missing Skills</h4>
                <ul>${(roadmapObj.gap_analysis.missing_skills || []).map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div class="gap-card">
                <h4>Weak Areas</h4>
                <ul>${(roadmapObj.gap_analysis.weak_areas || []).map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        `;
        container.appendChild(gapGrid);
    }

    // 3. Phases
    const phaseHeader = document.createElement('div');
    phaseHeader.className = 'section-header-v3';
    phaseHeader.innerHTML = `<h2>Learning Phases</h2>`;
    container.appendChild(phaseHeader);

    const phaseTimeline = document.createElement('div');
    phaseTimeline.className = 'phase-timeline-v3';

    const phases = roadmapObj.roadmap || [];
    phases.forEach((phase, index) => {
        const card = document.createElement('div');
        card.className = 'phase-card-v3';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="phase-badge-v3">PHASE ${index + 1}</span>
                <span class="phase-meta-tag">${phase.duration_weeks || 4} WEEKS</span>
            </div>
            <h3 class="card-title-v2">${phase.phase_name}</h3>
            <p class="phase-why-v3">${phase.why_it_matters}</p>

            <div class="section-header-v3" style="margin-top: 20px; font-size: 14px;">
                <h3>Learning Outcomes</h3>
            </div>
            <ul class="outcomes-list-v3">
                ${(phase.learning_outcomes || []).map(o => `<li>${o}</li>`).join('')}
            </ul>

            <div class="section-header-v3" style="margin-top: 20px; font-size: 14px;">
                <h3>Mandatory Labs</h3>
            </div>
            <div class="labs-grid-v3">
                ${(phase.mandatory_labs || []).map(lab => `
                    <div class="lab-mini-card">
                        <span class="lab-platform-tag">${lab.platform}</span>
                        <div style="font-weight:800; margin: 10px 0;">${lab.name}</div>
                        <div style="font-size: 11px; opacity:0.8; margin-bottom: 10px;">${lab.key_points}</div>
                        ${lab.url ? `<a href="${lab.url}" target="_blank" class="lab-link-v3">Start Lab →</a>` : ''}
                    </div>
                `).join('')}
            </div>

            <div class="section-header-v3" style="margin-top: 20px; font-size: 14px;">
                <h3>Resources & Documentation</h3>
            </div>
            <div class="resources-grid-v3">
                ${(phase.resources || []).map(res => `
                    <div class="resource-card-v3">
                        <div class="res-type-tag">${res.type}</div>
                        <div style="font-weight:800; margin: 8px 0; font-size: 14px;">${res.name}</div>
                        ${res.url && res.url !== '#' ? `<a href="${res.url}" target="_blank" class="res-link-btn-v3">Access Resource →</a>` : `<span class="res-link-btn-v3" style="opacity:0.5; cursor:not-allowed;">Link Unavailable</span>`}
                    </div>
                `).join('')}
            </div>

            <div class="section-header-v3" style="margin-top: 20px; font-size: 14px;">
                <h3>Tools to Master</h3>
            </div>
            <div class="resources-flex-v3">
                ${(phase.tools || []).map(t => `<span class="phase-meta-tag" style="background:var(--accent-v3); color:black;">${t}</span>`).join('')}
            </div>
        `;
        phaseTimeline.appendChild(card);
    });
    container.appendChild(phaseTimeline);

    // 5. Pre-OSCP Alignment
    if (roadmapObj.pre_oscp_alignment && Array.isArray(roadmapObj.pre_oscp_alignment)) {
        const alignHeader = document.createElement('div');
        alignHeader.className = 'section-header-v3';
        alignHeader.innerHTML = `
            <i data-lucide="award" class="w-8 h-8"></i>
            <h2>Pre-OSCP Alignment</h2>
        `;
        container.appendChild(alignHeader);

        const alignGrid = document.createElement('div');
        alignGrid.className = 'align-grid-v3';
        alignGrid.innerHTML = roadmapObj.pre_oscp_alignment.map(a => `
            <div class="align-card-v3">
                <h4>${a.cert}</h4>
                <p><strong>Reason:</strong> ${a.reason}</p>
                <p><strong>Bridges Gap:</strong> ${a.gap_it_bridges}</p>
                <div class="overlap-v3">Overlap with OSCP: ${a.overlap_with_oscp}</div>
            </div>
        `).join('');
        container.appendChild(alignGrid);
    }

    // 6. Tools Mastery Guide
    if (roadmapObj.tools_mastery_guide && Array.isArray(roadmapObj.tools_mastery_guide)) {
        const guideHeader = document.createElement('div');
        guideHeader.className = 'section-header-v3';
        guideHeader.innerHTML = `
            <i data-lucide="wrench" class="w-8 h-8"></i>
            <h2>Tools Mastery Guide</h2>
        `;
        container.appendChild(guideHeader);

        const guideGrid = document.createElement('div');
        guideGrid.className = 'tools-mastery-grid-v3';
        guideGrid.innerHTML = roadmapObj.tools_mastery_guide.map(tool => `
            <div class="tool-mastery-card-v3">
                <div class="flex justify-between items-start mb-2">
                    <span class="lab-platform-tag">${tool.category || 'Tool'}</span>
                    <span class="phase-meta-tag">${tool.skill_level || 'General'}</span>
                </div>
                <h4>${tool.tool}</h4>
                <div class="commands-v3">
                    ${(tool.commands || []).map(c => `
                        <div class="command-item">
                            <code>${c.cmd}</code>
                            <span>${c.purpose}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        container.appendChild(guideGrid);
    }

    // 7. Special Resource (Rickroll Easter Egg)
    if (roadmapObj.special_resource) {
        const randomQuote = getRandomQuote();

        const motivationalSection = document.createElement('div');
        motivationalSection.className = 'motivational-section';
        motivationalSection.innerHTML = `
            <blockquote class="cyber-quote">
                "${randomQuote}"
            </blockquote>
            <div class="secret-wisdom-container">
                <p class="wisdom-prompt">🎯 Completed your roadmap? Here's a special gift...</p>
                <button class="btn-reveal-secret" onclick="revealSecret('secret-content-roadmap')">
                    🎁 Reveal Cyber Wisdom
                </button>
                <div id="secret-content-roadmap" class="hidden">
                    <!-- QR Code and link will be generated here -->
                </div>
            </div>
        `;
        container.appendChild(motivationalSection);
    }

    // 8. Create Skill Tree (Relocated to end)
    if (roadmapObj.skill_tree) {
        const skillTreeSection = document.getElementById('skillTreeSection');
        if (skillTreeSection) {
            skillTreeSection.classList.remove('hidden');
            // Move skillTreeSection inside container for better layout/PDF export
            container.appendChild(skillTreeSection);
            setTimeout(() => createSkillTree(roadmapObj.skill_tree), 100);
        }
    }

    // Append everything to the main container
    roadmapContent.appendChild(container);

    // Initialize icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Scroll to top of roadmap
    window.scrollTo({ top: elements.roadmapSection.offsetTop - 100, behavior: 'smooth' });
}

function openSkillPanel(phaseData) {
    const panel = document.getElementById('skillPanel');
    if (!panel) return;

    document.getElementById('skillTitle').innerText = phaseData.phase_name;
    document.getElementById('skillIcon').innerText = '🛡️';
    document.getElementById('skillCategory').innerText = `Duration: ${phaseData.duration_weeks || '?'} Weeks`;
    document.getElementById('skillDescription').innerText = phaseData.why_it_matters || 'Advanced mentor guidance for this phase.';

    // Objectives
    const objectivesList = document.getElementById('skillObjectives');
    objectivesList.innerHTML = (phaseData.learning_outcomes || [])
        .map(obj => `<li>${obj}</li>`).join('');

    // Labs with Key Points
    const labsList = document.getElementById('skillLabs');
    labsList.innerHTML = (phaseData.mandatory_labs || [])
        .map(lab => `
            <li style="margin-bottom: 15px;">
                <div style="font-weight: 800; color: var(--primary-v3);">${lab.name} (${lab.platform})</div>
                <div style="font-size: 0.85rem; background: var(--bg-v3); padding: 10px; border-left: 3px solid var(--black-v3); margin-top: 5px;">
                    <strong>Mentor Key Points:</strong> ${lab.key_points || 'Focus on systematic enumeration and methodology.'}
                </div>
                ${lab.url ? `<a href="${lab.url}" target="_blank" style="display: inline-block; margin-top: 8px; font-size: 0.8rem; color: var(--secondary-v3); font-weight: 700;">Start Lab →</a>` : ''}
            </li>
        `).join('');

    // Tools
    const toolsContainer = document.getElementById('skillTools');
    toolsContainer.innerHTML = (phaseData.tools || [])
        .map(t => `<span class="year-badge-v2" style="background: var(--accent-v3); border-style: dashed;">${t.name || t}</span>`).join('');

    panel.classList.add('open');
}

function createSkillTree(treeData) {
    const container = document.getElementById('skillNodesContainer');
    const svg = document.getElementById('tree-svg-v2');
    if (!container || !svg || !treeData) return;

    container.innerHTML = '';
    svg.innerHTML = '';

    const width = container.offsetWidth || 1000;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const categories = treeData.categories || [];
    const categoryRadius = 180;
    const skillRadiusOffset = 120;

    categories.forEach((cat, catIdx) => {
        const catAngle = (catIdx / categories.length) * 2 * Math.PI - Math.PI / 2;
        const catX = centerX + categoryRadius * Math.cos(catAngle);
        const catY = centerY + categoryRadius * Math.sin(catAngle);

        // Category Hub Node
        const catNode = document.createElement('div');
        catNode.className = 'skill-node-v2 category-hub';
        catNode.style.left = `${catX - 55}px`;
        catNode.style.top = `${catY - 55}px`;
        catNode.style.background = 'var(--secondary-v3)';
        catNode.innerHTML = `
            <div class="skill-node-icon-v2">📦</div>
            <div class="skill-node-label-v2">${cat.name}</div>
        `;
        container.appendChild(catNode);

        // Line from center to category
        const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        centerLine.setAttribute('x1', centerX);
        centerLine.setAttribute('y1', centerY);
        centerLine.setAttribute('x2', catX);
        centerLine.setAttribute('y2', catY);
        centerLine.setAttribute('class', 'connection-line-v2 core-line');
        svg.appendChild(centerLine);

        // Skills around category
        const skills = cat.skills || [];
        skills.forEach((skill, skillIdx) => {
            const spreadAngle = 0.5; // radians
            const skillAngle = catAngle + (skillIdx - (skills.length - 1) / 2) * spreadAngle;
            const skillX = catX + skillRadiusOffset * Math.cos(skillAngle);
            const skillY = catY + skillRadiusOffset * Math.sin(skillAngle);

            // Skill Node
            const node = document.createElement('div');
            node.className = 'skill-node-v2 skill-leaf';
            node.style.left = `${skillX - 45}px`;
            node.style.top = `${skillY - 45}px`;
            node.style.width = '90px';
            node.style.height = '90px';
            node.innerHTML = `
                <div class="skill-node-icon-v2">${skill.icon || '🛡️'}</div>
                <div class="skill-node-label-v2">${skill.name}</div>
            `;
            
            node.addEventListener('click', () => {
                openSkillDetailPanel(skill, cat.name);
            });

            container.appendChild(node);

            // Line from category to skill
            const skillLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = `M ${catX} ${catY} Q ${(catX + skillX) / 2} ${(catY + skillY) / 2} ${skillX} ${skillY}`;
            skillLine.setAttribute('d', d);
            skillLine.setAttribute('class', 'connection-line-v2 skill-line');
            svg.appendChild(skillLine);
        });
    });

    // Central Core Node
    const core = document.createElement('div');
    core.className = 'skill-node-v2 core-node';
    core.style.width = '140px';
    core.style.height = '140px';
    core.style.left = `${centerX - 70}px`;
    core.style.top = `${centerY - 70}px`;
    core.style.background = 'var(--primary-v3)';
    core.style.color = 'white';
    core.style.zIndex = '10';
    core.innerHTML = `
        <div class="skill-node-icon-v2" style="font-size: 3rem;">🎯</div>
        <div class="skill-node-label-v2" style="color: white; font-size: 0.9rem;">CERTIFIED</div>
    `;
    container.appendChild(core);
}

function openSkillDetailPanel(skill, categoryName) {
    const panel = document.getElementById('skillPanel');
    if (!panel) return;

    document.getElementById('skillTitle').innerText = skill.name;
    document.getElementById('skillIcon').innerText = skill.icon || '🛡️';
    document.getElementById('skillCategory').innerText = categoryName + ' • ' + (skill.level || 'Mastery');

    // Use descriptions from assessment or default
    const descriptions = {
        'Linux Fundamentals': 'Core proficiency in Linux systems, terminal navigation, and permission management.',
        'Networking Fundamentals': 'Deep understanding of TCP/IP, OSI model, and network protocol analysis.',
        'Web Application Pentesting': 'Identifying and exploiting vulnerabilities in web services and applications.',
        'Active Directory Architecture': 'Understanding domain environments, Kerberos, and GPO structures.'
    };

    document.getElementById('skillDescription').innerText = descriptions[skill.name] || `Advanced level competency in ${skill.name} required for this certification path.`;

    // Dynamic Objectives
    const objectivesList = document.getElementById('skillObjectives');
    objectivesList.innerHTML = [
        `Master the core concepts of ${skill.name}`,
        `Implement advanced techniques in a lab environment`,
        `Apply knowledge to real-world ${appState.selectedCert} scenarios`
    ].map(obj => `<li>${obj}</li>`).join('');

    // Labs
    const labsList = document.getElementById('skillLabs');
    labsList.innerHTML = `
        <li>TryHackMe: ${skill.name} Modules</li>
        <li>HackTheBox: Specialized Challenges</li>
        <li>Custom Lab: Infrastructure Simulation</li>
    `;

    // Tools
    const toolsContainer = document.getElementById('skillTools');
    const tools = (appState.roadmapJSON?.roadmap?.[0]?.tools || ['Nmap', 'Metasploit', 'Burp Suite']).slice(0, 4);
    toolsContainer.innerHTML = tools
        .map(t => `<span class="year-badge-v2" style="background: var(--accent-v3); font-size: 10px;">${t}</span>`).join('');

    panel.classList.add('open');
}

// displayRoadmapMarkdown - handles markdown content when JSON parsing fails
function displayRoadmapMarkdown(markdownContent) {
    elements.roadmapContent.innerHTML = '';
    
    // Simple markdown to HTML conversion
    let html = (markdownContent || '')
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Wrap in paragraphs
    html = '<p>' + html + '</p>';
    html = html.replace(/<ul>/g, '</p><ul>').replace(/<\/ul>/g, '</ul><p>');
    
    // Store for later use
    appState.roadmap = markdownContent;
    
    const container = document.createElement('div');
    container.className = 'roadmap-markdown';
    container.innerHTML = html;
    
    elements.roadmapContent.appendChild(container);
}

// All roadmaps now render as structured HTML from JSON, no markdown needed

function copyRoadmap() {
    let text = '';
    if (appState.roadmapJSON) {
        text = JSON.stringify(appState.roadmapJSON, null, 2);
    } else {
        text = appState.roadmap || 'No roadmap available';
    }
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Roadmap copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        showError('Failed to copy. Try exporting instead.');
    });
}

function exportRoadmap() {
    let text = '';
    let filename = '';
    
    if (appState.roadmapJSON) {
        text = JSON.stringify(appState.roadmapJSON, null, 2);
        filename = `OffSec-Roadmap-${appState.selectedCert}-${new Date().toISOString().split('T')[0]}.json`;
    } else {
        text = appState.roadmap || 'No roadmap available';
        filename = `OffSec-Roadmap-${appState.selectedCert}-${new Date().toISOString().split('T')[0]}.txt`;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);

    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showSuccess('Roadmap exported!');
}

async function downloadRoadmapPDF() {
    if (!appState.roadmapJSON) {
        showError('No roadmap data available. Generate a roadmap first.');
        return;
    }
    
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const originalText = downloadPdfBtn.innerHTML;
    
    try {
        // Loading state
        downloadPdfBtn.disabled = true;
        downloadPdfBtn.innerHTML = '<span class="spinner-small"></span> Generating PDF...';
        showNotification('Preparing your roadmap for high-quality PDF export...', 'info');

        const isDarkMode = document.body.classList.contains('mode-oscp');

        // Step 1: Create print-safe HTML content
        const pdfRoot = document.createElement('div');
        pdfRoot.id = 'pdf-root';
        pdfRoot.className = 'roadmap-v3-container';
        // Apply critical styles directly to ensure they are captured by outerHTML
        pdfRoot.style.cssText = `
            width: 1000px;
            display: block;
            background: ${isDarkMode ? '#121212' : '#ffffff'};
            color: ${isDarkMode ? '#ffffff' : '#000000'};
            padding: 40px;
            margin: 0 auto;
            min-height: 100vh;
        `;
        
        // Clone roadmap content
        const contentClone = elements.roadmapContent.cloneNode(true);
        
        // Strip interactive elements but keep layout
        contentClone.querySelectorAll('button, input, select, .btn-reveal-secret, .hidden').forEach(el => el.remove());
        
        // Ensure all links are absolute and styled
        contentClone.querySelectorAll('a').forEach(link => {
            link.style.color = '#ff3e00';
            link.style.textDecoration = 'underline';
            link.style.fontWeight = 'bold';
        });

        // Add branding header
        const header = document.createElement('div');
        header.className = 'roadmap-v3-header';
        header.style.cssText = `
            background: #ff3e00;
            border: 3px solid #000;
            padding: 30px;
            box-shadow: 6px 6px 0px #000;
            color: white;
            margin-bottom: 30px;
            text-align: center;
        `;
        header.innerHTML = `
            <h1 style="font-size: 32px; margin: 0 0 10px 0; text-transform: uppercase; color: white;">
                OffSec Learning Roadmap
            </h1>
            <div style="display: flex; gap: 20px; justify-content: center; font-size: 14px;">
                <span style="background: rgba(0,0,0,0.1); padding: 4px 10px; border: 1px solid rgba(255,255,255,0.2);">Target: <strong>${appState.selectedCert?.toUpperCase() || 'Roadmap'}</strong></span>
                <span style="background: rgba(0,0,0,0.1); padding: 4px 10px; border: 1px solid rgba(255,255,255,0.2);">Date: <strong>${new Date().toLocaleDateString()}</strong></span>
                <span style="background: rgba(0,0,0,0.1); padding: 4px 10px; border: 1px solid rgba(255,255,255,0.2);">Mode: <strong>${isDarkMode ? 'OSCP (Advanced)' : 'Beginner'}</strong></span>
            </div>
        `;
        
        pdfRoot.appendChild(header);
        pdfRoot.appendChild(contentClone);
        
        // Add Raw JSON data (hidden in UI but present in PDF for copy-paste)
        const jsonSection = document.createElement('div');
        jsonSection.style.cssText = `
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border: 2px dashed #000;
            page-break-before: always;
        `;
        jsonSection.innerHTML = `
            <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 5px;">Raw Roadmap Data (JSON)</h2>
            <pre style="font-size: 10px; white-space: pre-wrap; word-break: break-all; color: #333;">${JSON.stringify(appState.roadmapJSON, null, 2)}</pre>
        `;
        pdfRoot.appendChild(jsonSection);

        // Add footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 50px;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-top: 3px solid #000;
            font-family: 'Space Mono', monospace;
        `;
        footer.innerHTML = `
            <p><strong>OFFSEC AI MENTOR</strong> - Your Path to Mastery</p>
            <p style="margin-top: 5px; opacity: 0.7;">This roadmap is generated based on your unique skill profile.</p>
            <p style="margin-top: 10px; font-size: 10px;">&copy; 2026 OffSec AI Mentor | Powered by Groq API & iLovePDF</p>
        `;
        pdfRoot.appendChild(footer);
        
        // Create complete HTML document - using outerHTML to preserve root styles
        // Note: style.css is now injected by the backend for higher reliability
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>OffSec Learning Roadmap</title>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; background: ${isDarkMode ? '#121212' : '#ffffff'}; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { margin: 0; size: A4; }
    </style>
</head>
<body class="${isDarkMode ? 'mode-oscp' : ''}">
    ${pdfRoot.outerHTML}
</body>
</html>
        `.trim();
        
        const filename = `OffSec-Roadmap-${appState.selectedCert || 'Learning'}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // Prepare headers with custom keys if available
        const headers = {
            'Content-Type': 'application/json'
        };

        const ilovepdfPublic = localStorage.getItem('ilovepdfPublicKey');
        const ilovepdfSecret = localStorage.getItem('ilovepdfSecretKey');

        if (ilovepdfPublic) headers['X-ILovePDF-Public-Key'] = ilovepdfPublic;
        if (ilovepdfSecret) headers['X-ILovePDF-Secret-Key'] = ilovepdfSecret;

        // Step 2: Send to backend API
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                html: htmlContent,
                filename: filename
            })
        });
        
        if (!response.ok) {
            // Robust error parsing for non-JSON responses
            let errorMsg = 'Failed to generate PDF';
            const responseText = await response.text();

            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.details ? `${errorData.error} (${errorData.details})` : (errorData.error || errorMsg);
            } catch (e) {
                // Fallback for HTML error pages or other non-JSON content
                console.error('Non-JSON error from PDF API:', responseText.substring(0, 200));
                errorMsg = `Server Error (${response.status}): The PDF service is temporarily unavailable.`;
            }
            throw new Error(errorMsg);
        }
        
        // Step 3: Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess('PDF generated successfully via iLovePDF!');
        
    } catch (error) {
        console.error('❌ PDF generation error:', error);
        showError(`PDF generation failed: ${error.message}. Please use "Export as JSON" instead.`);
    } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.innerHTML = originalText;
    }
}

// ============================================================================
// SECTION 4: GUIDED MENTOR CHAT
// ============================================================================

function initMentorChat() {
    // Check assessment
    if (!appState.assessment) {
        // Hide mentor section if accessed prematurely
        document.getElementById('mentorSection')?.classList.add('hidden');
        return; 
    }

    elements.chatHistory.innerHTML = '';
    appState.mentorChat = [];
    
    const welcomeMsg = {
        role: 'mentor',
        text: `Welcome! I'm your OffSec mentor. I can help you discuss your learning goals, choose between certifications, overcome challenges, and develop the right study mindset. What's on your mind?`
    };
    
    appState.mentorChat.push(welcomeMsg);
    addChatMessage(welcomeMsg);
}

function selectMentorIntent(button) {
    const intent = button.getAttribute('data-intent');
    const intentTexts = {
        'goals': 'I want to discuss my career goals in cybersecurity',
        'choose': 'Can you help me decide between certifications?',
        'stuck': 'I feel stuck in my learning. What should I focus on?',
        'time': 'How should I study effectively with limited time?'
    };
    
    const text = intentTexts[intent];
    if (text) {
        sendMentorMessage(text);
    }
}

async function sendMentorMessage(overrideText = null) {
    const userText = overrideText || elements.mentorInput?.value.trim();
    
    if (!userText) return;
    
    // Check for easter egg trigger words
    const lowerText = userText.toLowerCase();
    if (lowerText.includes('wisdom') || lowerText.includes('surprise') || lowerText.includes('secret')) {
        showRandomEasterEgg();
        if (elements.mentorInput) {
            elements.mentorInput.value = '';
        }
        return;
    }
    
    // Add user message
    const userMsg = { role: 'user', text: userText };
    appState.mentorChat.push(userMsg);
    addChatMessage(userMsg);
    
    if (elements.mentorInput) {
        elements.mentorInput.value = '';
    }
    elements.sendMentorBtn.disabled = true;
    
    try {
        // Call backend API for mentor chat
        const data = await callBackendAPI('/api/mentor-chat', {
            message: userText,
            context: {
                level: appState.assessment?.level,
                weaknesses: appState.assessment?.weaknesses,
                cert: CERTIFICATIONS.find(c => c.id === appState.selectedCert)?.name
            }
        });
        
        const mentorMsg = { role: 'mentor', text: data.reply };
        appState.mentorChat.push(mentorMsg);
        addChatMessage(mentorMsg);
    } catch (error) {
        console.error('Error getting mentor response:', error);
        const errorMsg = { role: 'mentor', text: 'I encountered an error. Please try again.' };
        appState.mentorChat.push(errorMsg);
        addChatMessage(errorMsg);
    } finally {
        elements.sendMentorBtn.disabled = false;
    }
}

function addChatMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.role}`;
    
    // Use textContent to safely render all messages as plain text (no markup needed)
    bubble.textContent = msg.text;
    
    elements.chatHistory.appendChild(bubble);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

// ============================================================================
// ACTIONS
// ============================================================================

function resetAndRetake() {
    appState.currentQuestion = 0;
    appState.questions = [];
    appState.answers = {};
    appState.assessment = null;
    
    hideAllSections();
    startAssessment();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// UI UTILITIES
// ============================================================================

function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        if (window.AOS) {
            AOS.refresh();
        }
    }
}

function hideAllSections() {
    const sections = [
        'assessmentSection',
        'reviewSection',
        'evaluationSection',
        'certSection',
        'roadmapSection',
        'mentorSection',
        'actionsSection'
    ];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showError(message) {
    console.error('🚨 Error:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff006e;
        color: white;
        padding: 32px 48px;
        border: 4px solid black;
        font-weight: 700;
        z-index: 9999;
        max-width: 500px;
        text-align: center;
        box-shadow: 8px 8px 0px black;
    `;
    errorDiv.innerHTML = `
        <h3 style="margin-bottom: 16px; font-size: 24px;">⚠️ Error</h3>
        <p style="margin-bottom: 24px;">${message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: white;
            color: black;
            border: 3px solid black;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: 600;
            font-family: 'Courier New', monospace;
        ">Close</button>
    `;
    document.body.appendChild(errorDiv);
}

function showSuccess(message) {
    console.log(`✅ ${message}`);
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #06d6a0;
        color: white;
        padding: 16px 24px;
        border: 3px solid black;
        font-weight: 600;
        z-index: 9999;
        animation: slideInToast 300ms ease forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 300ms ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Professional markdown-to-HTML parser for roadmap and chat display
// marked() function removed - using pure JSON rendering
// All HTML rendering happens through displayRoadmap() which uses JSON structures directly

// Toast animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInToast {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutToast {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================================================
// EASTER EGG FUNCTIONS
// ============================================================================

function getRandomQuote() {
    return CYBER_QUOTES[Math.floor(Math.random() * CYBER_QUOTES.length)];
}

function revealSecret(containerId) {
    const secretDiv = document.getElementById(containerId || 'secret-content');
    if (!secretDiv) return;
    
    secretDiv.classList.remove('hidden');
    secretDiv.classList.add('revealed');
    
    // Generate unique QR container ID
    const qrContainerId = 'qr-code-' + Math.random().toString(36).substring(7);
    
    // Create rickroll reveal content
    secretDiv.innerHTML = `
        <div class="rickroll-reveal">
            <p class="reveal-text">🎉 Your Cyber Wisdom Awaits! 🎉</p>
            <div class="qr-wrapper">
                <div id="${qrContainerId}"></div>
                <p style="margin-top: 12px; color: #000; font-weight: 700; text-transform: uppercase; font-size: 12px;">Scan for Wisdom</p>
            </div>
            <p class="or-text">OR</p>
            <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
               target="_blank" 
               class="btn btn-wisdom">
                🎵 Click for Knowledge
            </a>
        </div>
    `;
    
    // Generate QR code after DOM is updated
    setTimeout(() => {
        const qrElement = document.getElementById(qrContainerId);
        if (!qrElement) return;

        if (typeof QRCode !== 'undefined') {
            try {
                qrElement.innerHTML = ''; // Clear any existing
                new QRCode(qrElement, {
                    text: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    width: 180,
                    height: 180,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel?.H || 2
                });
            } catch (e) {
                console.error('QR generation error:', e);
                qrElement.innerHTML = '<span>QR Load Error</span>';
            }
        } else {
            qrElement.innerHTML = '<span style="color:red">QR Library Not Found</span>';
        }
    }, 200);
    
    addConfetti();
}

function addConfetti() {
    // Simple confetti effect using emoji
    const confettiCount = 30;
    const confettiEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎯', '🔥'];
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 3 + 's';
        confetti.style.fontSize = (Math.random() * 20 + 20) + 'px';
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 4000);
    }
}

function showRandomEasterEgg() {
    const randomQuote = getRandomQuote();
    const modal = document.createElement('div');
    modal.className = 'easter-egg-modal';
    modal.innerHTML = `
        <div class="easter-egg-content">
            <div class="motivational-section">
                <button class="close-modal" onclick="this.closest('.easter-egg-modal').remove()">×</button>
                <blockquote class="cyber-quote">
                    "${randomQuote}"
                </blockquote>
                <div class="secret-wisdom-container">
                    <p class="wisdom-prompt">💡 You've unlocked a special surprise!</p>
                    <button class="btn-reveal-secret" onclick="revealSecret('secret-content-modal')">
                        🎁 Reveal Cyber Wisdom
                    </button>
                    <div id="secret-content-modal" class="hidden">
                        <!-- QR Code and link will be generated here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================================================
// STARTUP
// ============================================================================

window.addEventListener('DOMContentLoaded', init);
