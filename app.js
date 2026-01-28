/**
 * OffSec AI Mentor - Main Application Script
 * 
 * FEATURES:
 * - Dynamic skill assessment (AI-generated questions)
 * - Skill evaluation with level classification
 * - Certification-aligned roadmap generation
 * - Guided mentor chat (constrained, safe)
 * - Roadmap export/copy
 * - Retake assessment
 * 
 * AI: Google Gemini 2.5 Flash
 * ETHIC: Educational guidance only - no exploits or hacking instructions
 */

// ============================================================================
// CONFIG & CONSTANTS
// ============================================================================

const API_KEY = 'AIzaSyARqNSFp8fPoFPVWd5DT6vqFB9UgeiFK1o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CERTIFICATIONS = [
    {
        id: 'oscp',
        name: 'OSCP',
        title: 'Offensive Security Certified Professional',
        description: 'The industry-leading penetration testing certification'
    },
    {
        id: 'osep',
        name: 'OSEP',
        title: 'Offensive Security Web Expert',
        description: 'Master advanced web application attacks'
    },
    {
        id: 'oswe',
        name: 'OSWE',
        title: 'Offensive Security Web Expert',
        description: 'Expert-level web security specialist'
    },
    {
        id: 'osed',
        name: 'OSED',
        title: 'Offensive Security Exploit Developer',
        description: 'Advanced exploit development skills'
    },
    {
        id: 'osce3',
        name: 'OSCE³',
        title: 'Offensive Security Certified Expert',
        description: 'Elite offensive security expertise'
    },
    {
        id: 'osee',
        name: 'OSEE',
        title: 'Offensive Security Web Expert',
        description: 'Web security mastery certification'
    }
];

// ============================================================================
// GLOBAL STATE
// ============================================================================

const appState = {
    currentQuestion: 0,
    questions: [],
    answers: {},
    assessment: null,
    selectedCert: null,
    roadmap: null,
    mentorChat: [],
    learningMode: 'beginner'
};

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const systemPrompts = {
    global: `You are a senior Offensive Security mentor. You provide educational guidance only. You never provide hacking commands, exploits, vulnerabilities, or payloads. You focus on learning direction, mindset, and ethical growth.`,
    
    questionGeneration: (mode) => `Generate exactly 20 cybersecurity assessment questions tailored for ${mode === 'oscp' ? 'OSCP-prep learners (more challenging, fundamentals + applied reasoning)' : 'beginner learners (fundamentals-focused)'}. Mix multiple-choice and short-answer questions. Topics: Networking basics, Linux fundamentals, Web fundamentals, Security concepts. Rules: Do not mention certifications, no commands or exploits, questions must vary each time, encouraging tone. For each question include a correctAnswer and a brief explanation. Format your response as valid JSON with this structure: {"questions": [{"type": "multiple-choice" or "short-answer", "question": "...", "options": ["opt1", "opt2", ...] (only for MCQ), "correctAnswer": "...", "explanation": "...", "hint": "..."}]}`,
    
    evaluation: `Based on the learner's answers, evaluate their current skill level. Output strictly as JSON: {"level": "Beginner|Foundation|Intermediate", "strengths": ["skill1", "skill2", ...], "weaknesses": ["weakness1", "weakness2", ...], "focusSuggestion": "..."}. Do not mention certifications.`,
    
    roadmap: (level, weaknesses, cert) => `The learner has: Skill Level: ${level}, Weak Areas: ${weaknesses.join(', ')}, Target Certification: ${cert}. Create a personalized learning roadmap. Requirements: Phase-based structure (Phase 1: Foundations, Phase 2: Core Skills, Phase 3: Certification Alignment), focus on converting weaknesses into strengths, explain WHY each phase matters, align generally with OffSec expectations, do not promise certification success, educational tone only. Format as clear text with proper markdown.`,
    
    mentorChat: `The learner wants mentorship guidance. Allowed topics ONLY: Career goals, Certification decision reasoning, Study mindset, Motivation and focus, Time management for learning. STRICT RULES: No technical attack details, No vulnerabilities, No commands, No hacking techniques. If asked anything unsafe, politely redirect to learning concepts. Keep response focused, warm, and professional.`
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
    
    // Assessment
    questionContainer: document.getElementById('questionContainer'),
    progressFill: document.getElementById('progressFill'),
    questionCounter: document.getElementById('questionCounter'),
    assessmentForm: document.getElementById('assessmentForm'),
    
    // Evaluation
    currentLevel: document.getElementById('currentLevel'),
    levelDescription: document.getElementById('levelDescription'),
    strengthsList: document.getElementById('strengthsList'),
    weaknessesList: document.getElementById('weaknessesList'),
    focusSuggestion: document.getElementById('focusSuggestion'),
    
    // Certification
    certGrid: document.getElementById('certGrid'),
    selectedCertDisplay: document.getElementById('selectedCertDisplay'),
    
    // Roadmap
    roadmapContent: document.getElementById('roadmapContent'),
    
    // Mentor
    chatHistory: document.getElementById('chatHistory'),
    mentorInput: document.getElementById('mentorInput'),
    mentorIntentButtons: document.getElementById('mentorIntentButtons')

    // Mode UI
    heroSubtitle: document.getElementById('heroSubtitle'),
    assessmentTitle: document.getElementById('assessmentTitle'),
    assessmentSubtitle: document.getElementById('assessmentSubtitle'),
    modeBanner: document.getElementById('modeBanner'),

    // Review
    reviewContainer: document.getElementById('reviewContainer')
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    setupEventListeners();
    setupAOS();
    setupLenis();
    setupGSAP();
    setupIcons();
    if (elements.modeCheckbox) {
        toggleLearningMode();
    }
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
    if (elements.reviewContinueBtn) {
        elements.reviewContinueBtn.addEventListener('click', proceedToEvaluation);
    }
    if (elements.modeCheckbox) {
        elements.modeCheckbox.addEventListener('change', toggleLearningMode);
    }
    elements.mentorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMentorMessage();
        }
    });
    
    // Intent buttons
    Array.from(elements.mentorIntentButtons.children).forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectMentorIntent(e.target);
        });
    });
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
}

function toggleLearningMode() {
    appState.learningMode = elements.modeCheckbox.checked ? 'oscp' : 'beginner';
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
// SECTION 1: START ASSESSMENT
// ============================================================================

async function startAssessment() {
    console.log('Starting assessment...');
    showSection('assessmentSection');
    
    try {
        elements.startBtn.disabled = true;
        elements.startBtn.textContent = 'Generating Questions...';
        
        appState.questions = await generateQuestions();
        
        if (appState.questions.length === 0) {
            throw new Error('No questions generated');
        }
        
        appState.currentQuestion = 0;
        appState.answers = {};
        
        renderQuestion();
        updateProgress();
    } catch (error) {
        console.error('Error starting assessment:', error);
        showError('Failed to generate assessment questions. Please try again.');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = 'Assess My Skill Level';
    }
}

async function generateQuestions() {
    try {
        const response = await callGeminiAPI(systemPrompts.questionGeneration(appState.learningMode));
        const parsed = parseGeminiJson(response);
        return parsed.questions || [];
    } catch (error) {
        console.error('Error parsing questions:', error);
        throw error;
    }
}

function parseGeminiJson(responseText) {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error('No JSON found in response');
    }
    try {
        return JSON.parse(match[0]);
    } catch (error) {
        const cleaned = match[0]
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
        return JSON.parse(cleaned);
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
        optionsContainer.className = 'question-options';
        
        question.options.forEach((option, index) => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${appState.currentQuestion}`;
            input.value = option;
            input.className = 'option-input';
            input.id = `option-${index}`;
            
            if (appState.answers[appState.currentQuestion] === option) {
                input.checked = true;
            }
            
            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.className = 'option-label';
            
            const checkbox = document.createElement('div');
            checkbox.className = 'option-checkbox';
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(option));
            
            optionsContainer.appendChild(input);
            optionsContainer.appendChild(label);
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
    // Save answer
    const qIndex = appState.currentQuestion;
    const question = appState.questions[qIndex];
    
    if (question.type === 'multiple-choice') {
        const selected = document.querySelector(`input[name="question-${qIndex}"]:checked`);
        if (!selected) {
            showError('Please select an answer before continuing.');
            return;
        }
        appState.answers[qIndex] = selected.value;
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
    // Save answer
    const qIndex = appState.currentQuestion;
    const question = appState.questions[qIndex];
    
    if (question.type === 'multiple-choice') {
        const selected = document.querySelector(`input[name="question-${qIndex}"]:checked`);
        if (selected) {
            appState.answers[qIndex] = selected.value;
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
        console.error('Error evaluating assessment:', error);
        showError('Failed to evaluate assessment. Please try again.');
        elements.nextBtn.disabled = false;
        elements.nextBtn.textContent = 'Submit Assessment';
    }
}

function buildReview() {
    if (!elements.reviewContainer) return;
    elements.reviewContainer.innerHTML = '';

    appState.questions.forEach((q, idx) => {
        const userAnswer = appState.answers[idx] || '(No answer)';
        const correctAnswer = q.correctAnswer || q.expectedAnswer || 'Not provided';
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

        const assessment = await evaluateAssessment();
        appState.assessment = assessment;

        showEvaluation();
        showSection('evaluationSection');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Error evaluating assessment:', error);
        showError('Failed to evaluate assessment. Please try again.');
    } finally {
        elements.reviewContinueBtn.disabled = false;
        elements.reviewContinueBtn.textContent = 'Continue to Evaluation';
    }
}

async function evaluateAssessment() {
    const answers = Object.entries(appState.answers)
        .map(([qIdx, answer]) => `Q${parseInt(qIdx) + 1}: ${answer}`)
        .join('\n');
    
    const evaluationPrompt = `${systemPrompts.evaluation}\n\nAssessment Answers:\n${answers}`;
    const response = await callGeminiAPI(evaluationPrompt);
    
    try {
        return parseGeminiJson(response);
    } catch (error) {
        console.error('Error parsing evaluation:', error);
        return {
            level: 'Foundation',
            strengths: ['Dedication to learning'],
            weaknesses: ['Some fundamentals to strengthen'],
            focusSuggestion: 'Focus on foundational concepts before pursuing certifications.'
        };
    }
}

function showEvaluation() {
    const assessment = appState.assessment;
    
    elements.currentLevel.textContent = assessment.level;
    elements.levelDescription.textContent = getLevelDescription(assessment.level);
    
    elements.strengthsList.innerHTML = assessment.strengths
        .map(s => `<li>${s}</li>`)
        .join('');
    
    elements.weaknessesList.innerHTML = assessment.weaknesses
        .map(w => `<li>${w}</li>`)
        .join('');
    
    elements.focusSuggestion.textContent = assessment.focusSuggestion;
}

function getLevelDescription(level) {
    const descriptions = {
        'Beginner': 'You\'re starting your security journey. Focus on fundamentals first.',
        'Foundation': 'You have foundational knowledge. You\'re ready for intermediate topics.',
        'Intermediate': 'You\'ve got solid skills. Advanced certifications are within reach.'
    };
    return descriptions[level] || 'Keep building your skills!';
}

// ============================================================================
// SECTION 2: CERTIFICATION SELECTION
// ============================================================================

function showCertificationSection() {
    renderCertifications();
    showSection('certSection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCertifications() {
    elements.certGrid.innerHTML = CERTIFICATIONS.map(cert => `
        <div class="cert-card" data-cert-id="${cert.id}">
            <div class="cert-name">${cert.name}</div>
            <div class="cert-desc">${cert.title}</div>
            <p style="font-size: 12px; margin-top: 12px; opacity: 0.8;">${cert.description}</p>
        </div>
    `).join('');
    
    Array.from(elements.certGrid.children).forEach(card => {
        card.addEventListener('click', () => selectCertification(card));
    });
}

function selectCertification(card) {
    Array.from(elements.certGrid.children).forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    appState.selectedCert = card.getAttribute('data-cert-id');
    
    // Show next button or auto-proceed
    setTimeout(() => {
        generateRoadmap();
    }, 300);
}

// ============================================================================
// SECTION 3: PERSONALIZED ROADMAP
// ============================================================================

async function generateRoadmap() {
    showSection('roadmapSection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const cert = CERTIFICATIONS.find(c => c.id === appState.selectedCert);
    elements.selectedCertDisplay.textContent = cert.name;
    
    try {
        elements.roadmapContent.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Building your personalized roadmap...</p></div>';
        
        const prompt = systemPrompts.roadmap(
            appState.assessment.level,
            appState.assessment.weaknesses,
            cert.name
        );
        
        const roadmapText = await callGeminiAPI(prompt);
        appState.roadmap = roadmapText;
        
        displayRoadmap(roadmapText);
        
        // Show mentor + actions without hiding roadmap
        setTimeout(() => {
            const mentor = document.getElementById('mentorSection');
            const actions = document.getElementById('actionsSection');
            if (mentor) mentor.classList.remove('hidden');
            if (actions) actions.classList.remove('hidden');
            initMentorChat();
        }, 800);
    } catch (error) {
        console.error('Error generating roadmap:', error);
        showError('Failed to generate roadmap. Please try again.');
    }
}

function displayRoadmap(roadmapText) {
    elements.roadmapContent.innerHTML = '';
    
    const phases = roadmapText.split(/Phase \d+:/i).filter(p => p.trim());
    
    phases.forEach((phase, idx) => {
        const phaseBlock = document.createElement('div');
        phaseBlock.className = 'phase-block';
        
        const lines = phase.trim().split('\n');
        const title = document.createElement('div');
        title.className = 'phase-title';
        title.textContent = `Phase ${idx + 1}: ${lines[0].trim()}`;
        
        const content = document.createElement('div');
        content.className = 'phase-content';
        content.innerHTML = marked(lines.slice(1).join('\n'));
        
        phaseBlock.appendChild(title);
        phaseBlock.appendChild(content);
        elements.roadmapContent.appendChild(phaseBlock);
    });
    
    if (window.AOS) {
        AOS.refresh();
    }
}

function copyRoadmap() {
    const text = appState.roadmap || 'No roadmap available';
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Roadmap copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        showError('Failed to copy. Try exporting instead.');
    });
}

function exportRoadmap() {
    const text = appState.roadmap || 'No roadmap available';
    const filename = `OffSec-Roadmap-${appState.selectedCert}-${new Date().toISOString().split('T')[0]}.txt`;
    
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

// ============================================================================
// SECTION 4: GUIDED MENTOR CHAT
// ============================================================================

function initMentorChat() {
    elements.chatHistory.innerHTML = '';
    appState.mentorChat = [];
    
    // Welcome message
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
    sendMentorMessage(text);
}

async function sendMentorMessage(overrideText = null) {
    const userText = overrideText || elements.mentorInput.value.trim();
    
    if (!userText) return;
    
    // Add user message
    const userMsg = { role: 'user', text: userText };
    appState.mentorChat.push(userMsg);
    addChatMessage(userMsg);
    
    elements.mentorInput.value = '';
    elements.sendMentorBtn.disabled = true;
    
    try {
        // Build context
        const context = `
Learner Profile:
- Current Level: ${appState.assessment.level}
- Weak Areas: ${appState.assessment.weaknesses.join(', ')}
- Selected Cert: ${CERTIFICATIONS.find(c => c.id === appState.selectedCert)?.name || 'Not selected'}

Learner Message: "${userText}"

${systemPrompts.mentorChat}
`;
        
        const response = await callGeminiAPI(context);
        
        const mentorMsg = { role: 'mentor', text: response };
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
    bubble.textContent = msg.text;
    elements.chatHistory.appendChild(bubble);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
}

// ============================================================================
// LEARNING MODE TOGGLE
// ============================================================================

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
// GEMINI API INTEGRATION
// ============================================================================

async function callGeminiAPI(prompt) {
    try {
        console.log('🔄 Calling Gemini API...');
        console.log('API URL:', `${GEMINI_API_URL}?key=${API_KEY.substring(0, 10)}...`);
        console.log('Prompt length:', prompt.length);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error Response:', errorData);
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Invalid response structure:', data);
            throw new Error('Invalid API response structure');
        }
        
        const text = data.candidates[0].content.parts
            .map(part => part.text)
            .join('');
        
        console.log('✅ Text extracted, length:', text.length);
        return text;
    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        console.error('Error details:', error.message);
        throw error;
    }
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
    console.error('🚨 Error shown to user:', message);
    
    // Create a more visible error display
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
        <p style="margin-top: 16px; font-size: 12px; opacity: 0.9;">Check browser console (F12) for details</p>
    `;
    document.body.appendChild(errorDiv);
    
    // Also show in console
    alert(`⚠️ Error: ${message}`);
}

function showSuccess(message) {
    console.log(`✅ ${message}`);
    // Toast notification
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
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Simple markdown-to-HTML for roadmap display (basic)
function marked(text) {
    let html = text
        .replace(/^### (.*?)$/gm, '<h4 style="font-weight: 700; margin-top: 16px;">$1</h4>')
        .replace(/^## (.*?)$/gm, '<h3 style="font-weight: 700; margin-top: 16px;">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/gm, '<p>');
    
    return html;
}

// Toast animation keyframes (add to style)
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
// STARTUP
// ============================================================================

window.addEventListener('DOMContentLoaded', init);
