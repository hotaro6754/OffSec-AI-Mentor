/**
 * DEPRECATED: Use app.js (merged production version).
 * OffSec AI Mentor - Main Application
 * AI: Google Gemini 2.5 Flash
 * Ethics: Educational guidance only
 */

// ============ CONFIG ============
// DEPRECATED FILE: Use app.js and server-v2.js for production
// This file kept for reference only - DO NOT USE
const CONFIG = {
    API_KEY: '', // REMOVED: Use environment variables in server-v2.js
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    CERTIFICATIONS: [
        {
            id: 'oscp',
            name: 'OSCP',
            title: 'Offensive Security Certified Professional',
            description: 'The industry-leading penetration testing certification',
            badge: '🎯'
        },
        {
            id: 'osep',
            name: 'OSEP',
            title: 'Offensive Security Experienced Penetration Tester',
            description: 'Advanced evasion techniques and methodology',
            badge: '🔒'
        },
        {
            id: 'oswe',
            name: 'OSWE',
            title: 'Offensive Security Web Expert',
            description: 'Expert-level web application security',
            badge: '🌐'
        },
        {
            id: 'osed',
            name: 'OSED',
            title: 'Offensive Security Exploit Developer',
            description: 'Advanced exploit development skills',
            badge: '⚙️'
        },
        {
            id: 'osce3',
            name: 'OSCE³',
            title: 'Offensive Security Certified Expert',
            description: 'Elite offensive security expertise',
            badge: '🏆'
        },
        {
            id: 'osee',
            name: 'OSEE',
            title: 'Offensive Security Exploitation Expert',
            description: 'Ultimate exploitation mastery',
            badge: '💀'
        }
    ]
};

// ============ STATE ============
const state = {
    currentQuestion: 0,
    questions: [],
    answers: {},
    evaluation: null,
    selectedCert: null,
    roadmap: null,
    mentorChat: [],
    selectedIntent: null
};

// ============ DOM ELEMENTS ============
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
    
    // Sections
    heroSection: document.getElementById('heroSection'),
    assessmentSection: document.getElementById('assessmentSection'),
    evaluationSection: document.getElementById('evaluationSection'),
    certSection: document.getElementById('certSection'),
    roadmapSection: document.getElementById('roadmapSection'),
    mentorSection: document.getElementById('mentorSection'),
    actionsSection: document.getElementById('actionsSection'),
    
    // Assessment
    questionContainer: document.getElementById('questionContainer'),
    progressFill: document.getElementById('progressFill'),
    questionCounter: document.getElementById('questionCounter'),
    
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
    mentorIntentButtons: document.getElementById('mentorIntentButtons'),
    
    // UI
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer')
};

// ============ SYSTEM PROMPTS ============
const prompts = {
    questionGeneration: `Generate exactly 8 beginner-friendly cybersecurity assessment questions.
Mix multiple-choice and short-answer questions.
Topics: Networking basics, Linux fundamentals, Web fundamentals, Security concepts
Rules:
- Do NOT mention certifications
- No commands or exploits
- Questions must vary each time
- Encouraging tone

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "hint": "Think about..."
    },
    {
      "type": "short-answer",
      "question": "Explain...",
      "hint": "Consider..."
    }
  ]
}`,

    evaluation: (answers) => `Based on these learner answers, evaluate their current skill level.

Answers:
${JSON.stringify(answers, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "level": "Beginner" or "Foundation" or "Intermediate",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "focusSuggestion": "A 2-3 sentence suggestion on what to focus on"
}

Rules:
- Be encouraging but honest
- Do NOT mention certifications
- Focus on foundational skills`,

    roadmap: (level, weaknesses, cert) => `Create a personalized learning roadmap for:
- Skill Level: ${level}
- Weak Areas: ${weaknesses.join(', ')}
- Target Certification: ${cert}

Create a phase-based roadmap with 3 phases:
- Phase 1: Foundations
- Phase 2: Core Skills
- Phase 3: Certification Alignment

For each phase:
- Explain WHAT to learn
- Explain WHY it matters
- How it connects to ${cert}

Rules:
- Educational tone only
- No promises of certification success
- Focus on converting weaknesses into strengths
- Use markdown formatting (headers, lists, bold)
- Be specific but encouraging`,

    mentorChat: (intent, context, evaluation) => `You are a supportive OffSec mentor.
The learner wants guidance on: ${intent}
${context ? `Additional context: ${context}` : ''}
${evaluation ? `Their current level: ${evaluation.level}` : ''}

Allowed topics ONLY:
- Career goals
- Certification decision reasoning
- Study mindset and motivation
- Time management for learning
- Focus strategies

STRICT RULES:
- No technical attack details
- No vulnerabilities
- No commands
- No hacking techniques
- If asked anything unsafe, politely redirect to learning concepts

Respond with warm, professional mentor guidance in 2-4 paragraphs.`
};

// ============ INITIALIZATION ============
function init() {
    console.log('🚀 OffSec AI Mentor initializing...');
    
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            offset: 100,
            once: false,
            mirror: true
        });
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize certifications
    renderCertifications();
    
    console.log('✅ Initialization complete');
}

function setupEventListeners() {
    elements.startBtn.addEventListener('click', startAssessment);
    elements.nextBtn.addEventListener('click', nextQuestion);
    elements.prevBtn.addEventListener('click', prevQuestion);
    elements.selectCertBtn.addEventListener('click', () => showSection('certSection'));
    elements.copyRoadmapBtn.addEventListener('click', copyRoadmap);
    elements.exportRoadmapBtn.addEventListener('click', exportRoadmap);
    elements.retakeBtn.addEventListener('click', retakeAssessment);
    elements.sendMentorBtn.addEventListener('click', sendMentorMessage);
    
    elements.mentorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMentorMessage();
        }
    });
    
    // Intent buttons
    document.querySelectorAll('.btn-intent').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-intent').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.selectedIntent = this.dataset.intent;
        });
    });
}

// ============ UI UTILITIES ============
function showSection(sectionId) {
    // Hide all sections
    [elements.heroSection, elements.assessmentSection, elements.evaluationSection,
     elements.certSection, elements.roadmapSection, elements.mentorSection,
     elements.actionsSection].forEach(section => {
        if (section) section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        if (typeof AOS !== 'undefined') AOS.refresh();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ API INTEGRATION ============
async function callGeminiAPI(prompt) {
    try {
        console.log('🔄 Calling Gemini API...');
        
        const response = await fetch(`${CONFIG.API_URL}?key=${CONFIG.API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Error:', errorData);
            throw new Error(errorData.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        console.log('✅ API Response received');
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Invalid response structure:', data);
            throw new Error('Invalid API response');
        }
        
        const text = data.candidates[0].content.parts.map(part => part.text).join('');
        console.log('✅ Text extracted, length:', text.length);
        
        return text;
    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        throw error;
    }
}

// ============ ASSESSMENT FLOW ============
function generateLocalQuestions() {
    return [
        {
            type: 'multiple-choice',
            question: 'What does an IP address identify on a network?',
            options: ['A device or host', 'A file on disk', 'A user account', 'A password'],
            hint: 'Think about how devices are addressed.'
        },
        {
            type: 'multiple-choice',
            question: 'Which tool helps you view active network interfaces on Linux?',
            options: ['ip', 'grep', 'tar', 'chmod'],
            hint: 'It replaces ifconfig on many systems.'
        },
        {
            type: 'short-answer',
            question: 'Explain the difference between HTTP and HTTPS in one or two sentences.',
            hint: 'Think about encryption and trust.'
        },
        {
            type: 'multiple-choice',
            question: 'Which concept best describes least privilege?',
            options: ['Grant only what is needed', 'Share all access', 'Rotate passwords daily', 'Disable logging'],
            hint: 'It limits access by default.'
        },
        {
            type: 'short-answer',
            question: 'What is a firewall and why is it used?',
            hint: 'Consider traffic control and protection.'
        },
        {
            type: 'multiple-choice',
            question: 'Which layer of the OSI model handles routing?',
            options: ['Network', 'Data Link', 'Transport', 'Application'],
            hint: 'IP lives here.'
        },
        {
            type: 'short-answer',
            question: 'Describe what a vulnerability is in simple terms.',
            hint: 'Think of a weakness that could be misused.'
        },
        {
            type: 'multiple-choice',
            question: 'What is the purpose of hashing a password?',
            options: ['Store it securely', 'Make it longer', 'Encrypt network traffic', 'Speed up login'],
            hint: 'It protects stored credentials.'
        }
    ];
}

async function startAssessment() {
    try {
        console.log('📝 Starting assessment...');
        showLoading();
        
        // Generate questions
        const response = await callGeminiAPI(prompts.questionGeneration);
        console.log('Raw response:', response);
        
        // Extract JSON from response (robust regex)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', response);
            throw new Error('Invalid format from AI');
        }
        
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            state.questions = parsed.questions || [];
        } catch (e) {
            console.error('JSON Parse Error:', e);
            // Try lenient parsing or cleanup
            const cleanJson = jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'); // Remove trailing commas
            const parsed = JSON.parse(cleanJson);
            state.questions = parsed.questions || [];
        }
        
        if (state.questions.length === 0) {
            throw new Error('No questions generated');
        }
        
        console.log(`✅ Generated ${state.questions.length} questions`);
        
        state.currentQuestion = 0;
        state.answers = {};
        
        showLoading(false);
        showSection('assessmentSection');
        renderQuestion();
        updateProgress();
        
    } catch (error) {
        console.error('❌ Error starting assessment:', error);
        showLoading(false);
        
        // Fallback to local questions if API fails
        state.questions = generateLocalQuestions();
        if (state.questions.length > 0) {
            state.currentQuestion = 0;
            state.answers = {};
            showToast('Using offline questions. You can still proceed.', 'error');
            showSection('assessmentSection');
            renderQuestion();
            updateProgress();
            return;
        }
        
        showToast('Failed to generate questions. Please try again.', 'error');
        alert(`Error: ${error.message}\n\nCheck the console (F12) for details.`);
    }
}

function renderQuestion() {
    const question = state.questions[state.currentQuestion];
    if (!question) return;
    
    elements.questionContainer.innerHTML = '';
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.textContent = question.question;
    
    questionDiv.appendChild(questionText);
    
    if (question.type === 'multiple-choice') {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'question-options';
        
        question.options.forEach((option, index) => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${state.currentQuestion}`;
            input.value = option;
            input.className = 'option-input';
            input.id = `option-${index}`;
            
            if (state.answers[state.currentQuestion] === option) {
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
        
        questionDiv.appendChild(optionsContainer);
    } else if (question.type === 'short-answer') {
        const textarea = document.createElement('textarea');
        textarea.className = 'short-answer-input';
        textarea.placeholder = 'Your answer...';
        textarea.value = state.answers[state.currentQuestion] || '';
        textarea.addEventListener('input', (e) => {
            state.answers[state.currentQuestion] = e.target.value;
        });
        
        questionDiv.appendChild(textarea);
    }
    
    elements.questionContainer.appendChild(questionDiv);
}

function updateProgress() {
    const progress = ((state.currentQuestion + 1) / state.questions.length) * 100;
    elements.progressFill.style.width = `${progress}%`;
    elements.questionCounter.textContent = `Question ${state.currentQuestion + 1} of ${state.questions.length}`;
    
    // Update button visibility
    elements.prevBtn.style.display = state.currentQuestion > 0 ? 'flex' : 'none';
    elements.nextBtn.textContent = state.currentQuestion === state.questions.length - 1 ? 'Submit' : 'Next';
}

function nextQuestion() {
    // Save answer
    if (state.questions[state.currentQuestion].type === 'multiple-choice') {
        const selected = document.querySelector(`input[name="question-${state.currentQuestion}"]:checked`);
        if (!selected) {
            showToast('Please select an answer', 'error');
            return;
        }
        state.answers[state.currentQuestion] = selected.value;
    } else {
        const textarea = elements.questionContainer.querySelector('.short-answer-input');
        if (!textarea.value.trim()) {
            showToast('Please provide an answer', 'error');
            return;
        }
        state.answers[state.currentQuestion] = textarea.value.trim();
    }
    
    // Move to next question or submit
    if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion++;
        renderQuestion();
        updateProgress();
    } else {
        submitAssessment();
    }
}

function prevQuestion() {
    if (state.currentQuestion > 0) {
        state.currentQuestion--;
        renderQuestion();
        updateProgress();
    }
}

async function submitAssessment() {
    try {
        console.log('📊 Evaluating assessment...');
        showLoading();
        
        const response = await callGeminiAPI(prompts.evaluation(state.answers));
        
        // Extract JSON using regex
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            state.evaluation = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No JSON found in response');
        }
        
        console.log('✅ Evaluation complete:', state.evaluation);
        
        showLoading(false);
        displayEvaluation();
        showSection('evaluationSection');
        
    } catch (error) {
        console.error('❌ Error evaluating assessment:', error);
        showLoading(false);
        showToast('Failed to evaluate assessment. Please try again.', 'error');
    }
}

function displayEvaluation() {
    const { level, strengths, weaknesses, focusSuggestion } = state.evaluation;
    
    elements.currentLevel.textContent = level;
    elements.levelDescription.textContent = `You're at the ${level} level`;
    
    elements.strengthsList.innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
    elements.weaknessesList.innerHTML = weaknesses.map(w => `<li>${w}</li>`).join('');
    elements.focusSuggestion.textContent = focusSuggestion;
}

// ============ CERTIFICATION SELECTION ============
function renderCertifications() {
    elements.certGrid.innerHTML = CONFIG.CERTIFICATIONS.map(cert => `
        <div class="cert-card" data-cert-id="${cert.id}" onclick="selectCertification('${cert.id}')">
            <div class="cert-badge">${cert.badge}</div>
            <div class="cert-name">${cert.name}</div>
            <div class="cert-title">${cert.title}</div>
            <div class="cert-desc">${cert.description}</div>
        </div>
    `).join('');
}

async function selectCertification(certId) {
    // Visual feedback
    document.querySelectorAll('.cert-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-cert-id="${certId}"]`).classList.add('selected');
    
    state.selectedCert = CONFIG.CERTIFICATIONS.find(c => c.id === certId);
    
    console.log('🎯 Selected certification:', state.selectedCert.name);
    
    // Generate roadmap
    try {
        showLoading();
        
        const response = await callGeminiAPI(
            prompts.roadmap(
                state.evaluation.level,
                state.evaluation.weaknesses,
                state.selectedCert.name
            )
        );
        
        state.roadmap = response;
        
        console.log('✅ Roadmap generated');
        
        showLoading(false);
        displayRoadmap();
        showSection('roadmapSection');
        
    } catch (error) {
        console.error('❌ Error generating roadmap:', error);
        showLoading(false);
        showToast('Failed to generate roadmap. Please try again.', 'error');
    }
}

function displayRoadmap() {
    elements.selectedCertDisplay.textContent = state.selectedCert.name;
    
    // Convert markdown to HTML (simple)
    let html = state.roadmap
        .replace(/^### (.*?)$/gm, '<div class="phase-title">$1</div>')
        .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<)/gm, '<p>')
        .replace(/$/gm, '</p>');
    
    // Wrap in phases
    html = html.replace(/<div class="phase-title">/g, '<div class="phase-block"><div class="phase-title">')
               .replace(/<div class="phase-title">(.*?)<\/div>/g, '<div class="phase-title">$1</div><div class="phase-content">')
               .replace(/<div class="phase-block">/g, (match, offset, string) => {
                   // Close previous phase-content if exists
                   return offset > 0 ? '</div></div><div class="phase-block">' : '<div class="phase-block">';
               });
    
    html += '</div></div>'; // Close last phase
    
    elements.roadmapContent.innerHTML = html;
    
    // Show mentor and actions
    elements.mentorSection.classList.remove('hidden');
    elements.actionsSection.classList.remove('hidden');
    initMentorChat();
}

function copyRoadmap() {
    navigator.clipboard.writeText(state.roadmap)
        .then(() => showToast('Roadmap copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy roadmap', 'error'));
}

function exportRoadmap() {
    const blob = new Blob([state.roadmap], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offsec-roadmap-${state.selectedCert.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Roadmap exported!', 'success');
}

// ============ MENTOR CHAT ============
function initMentorChat() {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'chat-bubble mentor';
    welcomeMsg.textContent = `Hey there! 👋 I'm here to help you with your learning journey. Select a topic above or ask me anything about your path to ${state.selectedCert.name}.`;
    elements.chatHistory.appendChild(welcomeMsg);
}

async function sendMentorMessage() {
    if (!state.selectedIntent) {
        showToast('Please select a topic first', 'error');
        return;
    }
    
    const context = elements.mentorInput.value.trim();
    
    // Display user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user';
    userMsg.textContent = state.selectedIntent.replace(/([A-Z])/g, ' $1').trim() + (context ? `: ${context}` : '');
    elements.chatHistory.appendChild(userMsg);
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
    
    elements.mentorInput.value = '';
    
    try {
        showLoading();
        
        const response = await callGeminiAPI(
            prompts.mentorChat(state.selectedIntent, context, state.evaluation)
        );
        
        showLoading(false);
        
        // Display mentor response
        const mentorMsg = document.createElement('div');
        mentorMsg.className = 'chat-bubble mentor';
        mentorMsg.textContent = response;
        elements.chatHistory.appendChild(mentorMsg);
        elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
        
        state.mentorChat.push({ role: 'user', content: state.selectedIntent });
        state.mentorChat.push({ role: 'mentor', content: response });
        
    } catch (error) {
        console.error('❌ Error in mentor chat:', error);
        showLoading(false);
        showToast('Failed to get mentor response', 'error');
    }
    
    // Reset intent
    document.querySelectorAll('.btn-intent').forEach(b => b.classList.remove('active'));
    state.selectedIntent = null;
}

// ============ RETAKE ============
function retakeAssessment() {
    state.currentQuestion = 0;
    state.questions = [];
    state.answers = {};
    state.evaluation = null;
    state.selectedCert = null;
    state.roadmap = null;
    state.mentorChat = [];
    
    elements.chatHistory.innerHTML = '';
    
    showSection('heroSection');
    startAssessment();
}

// ============ START ============
document.addEventListener('DOMContentLoaded', init);
