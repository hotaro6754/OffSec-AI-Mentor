/**
 * DEPRECATED: Use app.js (merged production version).
 * OffSec AI Mentor - Main Application Script
 * Personalized cybersecurity learning roadmaps powered by Google Gemini
 */

// ============================================================================
// CONFIG
// ============================================================================

// DEPRECATED FILE: Use app.js and server-v2.js for production
const API_KEY = ''; // REMOVED: Use environment variables in server-v2.js
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CERTIFICATIONS = [
    { id: 'oscp', name: 'OSCP', title: 'Offensive Security Certified Professional', desc: 'Penetration testing certification' },
    { id: 'osep', name: 'OSEP', title: 'Offensive Security Web Expert', desc: 'Advanced web application attacks' },
    { id: 'oswe', name: 'OSWE', title: 'Offensive Security Web Expert', desc: 'Expert web security specialist' },
    { id: 'osed', name: 'OSED', title: 'Offensive Security Exploit Developer', desc: 'Exploit development mastery' },
    { id: 'osce3', name: 'OSCE³', title: 'Offensive Security Certified Expert', desc: 'Elite offensive security expertise' },
    { id: 'osee', name: 'OSEE', title: 'Offensive Security Web Expert', desc: 'Web security mastery' }
];

// ============================================================================
// STATE
// ============================================================================

const appState = {
    currentQuestion: 0,
    questions: [],
    answers: {},
    assessment: null,
    selectedCert: null,
    roadmap: null,
    mentorChat: []
};

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const systemPrompts = {
    questionGeneration: `You are creating assessment questions for cybersecurity learners. Generate 8 diverse beginner-level questions mixing multiple-choice and short-answer formats. Topics: Networking basics, Linux fundamentals, Web basics, Security concepts. Rules: No certifications mentioned, no commands or exploits, encouraging tone, new questions each time. Return ONLY valid JSON with format: {"questions": [{"type": "multiple-choice"|"short-answer", "question": "...", "options": ["a","b","c","d"] (MCQ only), "hint": "..."}]}`,
    
    evaluation: `Based on these answers, evaluate skill level. Return ONLY JSON: {"level": "Beginner|Foundation|Intermediate", "strengths": ["skill1", "skill2"], "weaknesses": ["area1", "area2"]}`,
    
    roadmap: (level, weaknesses, cert) => `Create a learning roadmap for someone at "${level}" level targeting "${cert}" with weak areas: ${weaknesses.join(', ')}. Structure: Phase 1: Foundations, Phase 2: Core Skills, Phase 3: Certification Prep. Focus on converting weaknesses to strengths. Educational guidance only, no attacks/exploits. Use markdown format.`,
    
    mentorChat: `You are an ethical security mentor. Answer ONLY about: career goals, cert choices, study mindset, motivation, time management. STRICTLY forbidden: exploits, vulnerabilities, attack commands, hacking techniques. Keep responses warm, focused, professional.`
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    startBtn: document.getElementById('startBtn'),
    nextBtn: document.getElementById('nextBtn'),
    prevBtn: document.getElementById('prevBtn'),
    selectCertBtn: document.getElementById('selectCertBtn'),
    copyRoadmapBtn: document.getElementById('copyRoadmapBtn'),
    exportRoadmapBtn: document.getElementById('exportRoadmapBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    sendMentorBtn: document.getElementById('sendMentorBtn'),
    
    assessmentSection: document.getElementById('assessmentSection'),
    evaluationSection: document.getElementById('evaluationSection'),
    certSection: document.getElementById('certSection'),
    roadmapSection: document.getElementById('roadmapSection'),
    mentorSection: document.getElementById('mentorSection'),
    actionsSection: document.getElementById('actionsSection'),
    
    questionContainer: document.getElementById('questionContainer'),
    progressFill: document.getElementById('progressFill'),
    questionCounter: document.getElementById('questionCounter'),
    assessmentForm: document.getElementById('assessmentForm'),
    
    currentLevel: document.getElementById('currentLevel'),
    levelDescription: document.getElementById('levelDescription'),
    strengthsList: document.getElementById('strengthsList'),
    weaknessesList: document.getElementById('weaknessesList'),
    
    certGrid: document.getElementById('certGrid'),
    selectedCertDisplay: document.getElementById('selectedCertDisplay'),
    
    roadmapContent: document.getElementById('roadmapContent'),
    
    chatHistory: document.getElementById('chatHistory'),
    mentorInput: document.getElementById('mentorInput'),
    mentorIntentButtons: document.getElementById('mentorIntentButtons')
};

// ============================================================================
// INIT
// ============================================================================

function init() {
    console.log('🚀 OffSec AI Mentor initialized');
    setupEventListeners();
}

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startAssessment);
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.prevBtn.addEventListener('click', prevQuestion);
    elements.selectCertBtn.addEventListener('click', showCertificationSection);
    elements.copyRoadmapBtn.addEventListener('click', copyRoadmap);
    elements.exportRoadmapBtn.addEventListener('click', exportRoadmap);
    elements.retakeBtn.addEventListener('click', resetAndRetake);
    elements.sendMentorBtn.addEventListener('click', sendMentorMessage);
    
    elements.mentorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMentorMessage();
        }
    });
    
    Array.from(elements.mentorIntentButtons.children).forEach(btn => {
        btn.addEventListener('click', (e) => selectMentorIntent(e.target));
    });
}

// ============================================================================
// ASSESSMENT FLOW
// ============================================================================

async function startAssessment() {
    console.log('📝 Starting assessment...');
    hideAllSections();
    elements.assessmentSection.classList.remove('hidden');
    
    await generateQuestions();
    renderQuestion();
}

async function generateQuestions() {
    console.log('🤖 Generating questions...');
    try {
        const response = await callGeminiAPI(systemPrompts.questionGeneration, '');
        const parsed = JSON.parse(response);
        appState.questions = parsed.questions || [];
        console.log(`✅ Generated ${appState.questions.length} questions`);
    } catch (e) {
        console.error('❌ Question generation failed:', e);
        appState.questions = getFallbackQuestions();
    }
}

function getFallbackQuestions() {
    return [
        { type: 'multiple-choice', question: 'What is the OSI model layer that handles routing?', options: ['Layer 2', 'Layer 3', 'Layer 4', 'Layer 7'], hint: 'Network layer' },
        { type: 'short-answer', question: 'What command displays your IP address in Linux?', hint: 'Starts with "ip"' },
        { type: 'multiple-choice', question: 'HTTPS uses which port by default?', options: ['80', '443', '8080', '3306'] },
        { type: 'short-answer', question: 'What does SQL injection mean to you?', hint: 'Security vulnerability' }
    ];
}

function renderQuestion() {
    const q = appState.questions[appState.currentQuestion];
    if (!q) return;
    
    const progress = ((appState.currentQuestion + 1) / appState.questions.length) * 100;
    elements.progressFill.style.width = progress + '%';
    elements.questionCounter.textContent = `Question ${appState.currentQuestion + 1} of ${appState.questions.length}`;
    
    let html = `<div class="question-item"><div class="question-text">${q.question}</div>`;
    
    if (q.type === 'multiple-choice') {
        html += '<div class="question-options">';
        q.options.forEach((opt, i) => {
            const id = `opt-${appState.currentQuestion}-${i}`;
            const checked = appState.answers[appState.currentQuestion] === opt ? 'checked' : '';
            html += `
                <input type="radio" id="${id}" name="answer" value="${opt}" class="option-input" ${checked}>
                <label for="${id}" class="option-label">${opt}</label>
            `;
        });
        html += '</div>';
    } else {
        const val = appState.answers[appState.currentQuestion] || '';
        html += `<input type="text" class="short-answer-input" value="${val}" placeholder="Your answer..." data-q="${appState.currentQuestion}">`;
    }
    
    html += '</div>';
    elements.questionContainer.innerHTML = html;
    
    elements.prevBtn.style.display = appState.currentQuestion > 0 ? 'inline-flex' : 'none';
    elements.nextBtn.textContent = appState.currentQuestion === appState.questions.length - 1 ? 'Submit' : 'Next';
    
    // Save answer on input
    if (q.type === 'multiple-choice') {
        document.querySelectorAll('input[name="answer"]').forEach(inp => {
            inp.addEventListener('change', (e) => {
                appState.answers[appState.currentQuestion] = e.target.value;
            });
        });
    } else {
        const inp = document.querySelector('.short-answer-input');
        if (inp) inp.addEventListener('input', (e) => {
            appState.answers[appState.currentQuestion] = e.target.value;
        });
    }
}

function nextQuestion() {
    if (appState.currentQuestion < appState.questions.length - 1) {
        appState.currentQuestion++;
        renderQuestion();
    } else {
        submitAssessment();
    }
}

function prevQuestion() {
    if (appState.currentQuestion > 0) {
        appState.currentQuestion--;
        renderQuestion();
    }
}

async function submitAssessment() {
    console.log('📊 Submitting assessment...');
    hideAllSections();
    elements.evaluationSection.classList.remove('hidden');
    
    await evaluateAssessment();
}

async function evaluateAssessment() {
    console.log('🔍 Evaluating...');
    const answersText = Object.values(appState.answers).join('. ');
    
    try {
        const response = await callGeminiAPI(systemPrompts.evaluation, answersText);
        const parsed = JSON.parse(response);
        appState.assessment = parsed;
        
        elements.currentLevel.textContent = parsed.level || 'Foundation';
        elements.levelDescription.textContent = `Your current skill level based on your answers.`;
        
        elements.strengthsList.innerHTML = (parsed.strengths || []).map(s => `<li>${s}</li>`).join('');
        elements.weaknessesList.innerHTML = (parsed.weaknesses || []).map(w => `<li>${w}</li>`).join('');
        
        console.log('✅ Evaluation complete:', parsed);
    } catch (e) {
        console.error('❌ Evaluation failed:', e);
        appState.assessment = { level: 'Foundation', strengths: ['Problem-solving'], weaknesses: ['Linux'] };
        elements.currentLevel.textContent = 'Foundation';
        elements.strengthsList.innerHTML = '<li>Problem-solving</li>';
        elements.weaknessesList.innerHTML = '<li>Linux basics</li>';
    }
}

// ============================================================================
// CERTIFICATION SELECTION
// ============================================================================

function showCertificationSection() {
    hideAllSections();
    elements.certSection.classList.remove('hidden');
    renderCertifications();
}

function renderCertifications() {
    elements.certGrid.innerHTML = CERTIFICATIONS.map(cert => `
        <div class="cert-card ${appState.selectedCert === cert.id ? 'selected' : ''}" data-cert="${cert.id}">
            <div class="cert-name">${cert.name}</div>
            <p>${cert.desc}</p>
            <button class="btn btn-secondary" onclick="selectCertification('${cert.id}')" style="margin-top: 16px;">Select</button>
        </div>
    `).join('');
}

async function selectCertification(certId) {
    appState.selectedCert = certId;
    const cert = CERTIFICATIONS.find(c => c.id === certId);
    console.log(`🎯 Selected: ${cert.name}`);
    
    hideAllSections();
    elements.roadmapSection.classList.remove('hidden');
    elements.selectedCertDisplay.textContent = cert.name;
    
    await generateRoadmap();
}

async function generateRoadmap() {
    console.log('🗺️ Generating roadmap...');
    const level = appState.assessment?.level || 'Foundation';
    const weaknesses = appState.assessment?.weaknesses || ['General knowledge'];
    const cert = CERTIFICATIONS.find(c => c.id === appState.selectedCert)?.name || 'OSCP';
    
    try {
        const prompt = systemPrompts.roadmap(level, weaknesses, cert);
        const response = await callGeminiAPI(prompt, '');
        appState.roadmap = response;
        displayRoadmap();
    } catch (e) {
        console.error('❌ Roadmap generation failed:', e);
        appState.roadmap = getFallbackRoadmap();
        displayRoadmap();
    }
}

function displayRoadmap() {
    const html = parseMarkdown(appState.roadmap);
    elements.roadmapContent.innerHTML = html;
    
    setTimeout(() => {
        elements.chatHistory.innerHTML = '';
        showSection('mentorSection');
        initMentorChat();
    }, 1000);
}

function getFallbackRoadmap() {
    return `
## Phase 1: Foundations
- Linux command line basics
- Networking fundamentals
- Web fundamentals

## Phase 2: Core Skills
- Vulnerability assessment
- Network scanning
- Security tools

## Phase 3: Certification Prep
- Practice exams
- Real-world labs
- Final review
    `.trim();
}

// ============================================================================
// MENTOR CHAT
// ============================================================================

function initMentorChat() {
    console.log('💬 Mentor chat initialized');
    showSection('mentorSection');
}

function selectMentorIntent(btn) {
    const intent = btn.dataset.intent;
    Array.from(elements.mentorIntentButtons.children).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const intentMessages = {
        goals: 'Tell me about your career goals in cybersecurity.',
        choose: 'Help me choose the right certification.',
        stuck: 'I\'m feeling overwhelmed with the roadmap.',
        time: 'How can I balance study time effectively?'
    };
    
    sendMentorMessage(intentMessages[intent]);
}

async function sendMentorMessage(msg = null) {
    const message = msg || elements.mentorInput.value.trim();
    if (!message) return;
    
    elements.mentorInput.value = '';
    
    // Add user message
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.textContent = message;
    elements.chatHistory.appendChild(bubble);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
    
    // Get mentor response
    try {
        const response = await callGeminiAPI(systemPrompts.mentorChat, message);
        const mentorBubble = document.createElement('div');
        mentorBubble.className = 'chat-bubble mentor';
        mentorBubble.textContent = response;
        elements.chatHistory.appendChild(mentorBubble);
        elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
    } catch (e) {
        console.error('Mentor error:', e);
    }
}

// ============================================================================
// ACTIONS
// ============================================================================

function copyRoadmap() {
    navigator.clipboard.writeText(appState.roadmap).then(() => {
        showSuccess('✅ Roadmap copied to clipboard!');
    });
}

function exportRoadmap() {
    const blob = new Blob([appState.roadmap], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roadmap.txt';
    link.click();
    showSuccess('✅ Roadmap exported!');
}

function resetAndRetake() {
    appState.currentQuestion = 0;
    appState.questions = [];
    appState.answers = {};
    appState.assessment = null;
    appState.selectedCert = null;
    appState.roadmap = null;
    appState.mentorChat = [];
    startAssessment();
}

// ============================================================================
// UTILITIES
// ============================================================================

async function callGeminiAPI(systemPrompt, userMessage) {
    const payload = {
        contents: [{
            parts: [
                { text: `[SYSTEM] ${systemPrompt}\n\n[USER] ${userMessage}` }
            ]
        }]
    };
    
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Invalid API response');
}

function parseMarkdown(text) {
    return text
        .replace(/^### (.*?)$/gm, '<h4 style="font-weight: 700; margin: 16px 0 8px 0;">$1</h4>')
        .replace(/^## (.*?)$/gm, '<h3 style="font-weight: 700; margin: 24px 0 12px 0;">$1</h3>')
        .replace(/^# (.*?)$/gm, '<h2 style="font-weight: 700; margin: 32px 0 16px 0;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/s, '<ul style="margin: 12px 0 12px 24px;">$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^(?!<)/gm, '<p>')
        .replace(/(?<!<\/p>)$/gm, '</p>')
        .replace(/<p><\/p>/g, '');
}

function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) section.classList.remove('hidden');
}

function hideAllSections() {
    ['assessmentSection', 'evaluationSection', 'certSection', 'roadmapSection', 'mentorSection', 'actionsSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function showSuccess(msg) {
    console.log(msg);
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #06d6a0; color: white; padding: 16px 24px; border: 3px solid black; z-index: 9999;';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================================
// START
// ============================================================================

window.addEventListener('DOMContentLoaded', init);
