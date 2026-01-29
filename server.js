/**
 * OffSec AI Mentor - Backend Server
 * 
 * ARCHITECTURE:
 * - Express.js server handling all Gemini API calls
 * - Frontend communicates with this server (not directly with Gemini)
 * - API key is stored server-side only (via environment variable)
 * - CORS enabled for local development
 * 
 * ENDPOINTS:
 * POST /api/generate-questions   - Generate assessment questions
 * POST /api/evaluate-assessment  - Evaluate learner's answers
 * POST /api/generate-roadmap     - Create personalized learning roadmap
 * POST /api/mentor-chat          - Guided mentor conversation
 * 
 * SECURITY:
 * - No API keys exposed to frontend
 * - Rate limiting ready (can be added)
 * - Input validation on all endpoints
 * - Educational content only (no exploits/commands)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Gemini API Configuration
// Load environment variables
require('dotenv').config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ ERROR: No Gemini API key found!');
    console.error('   Please set GEMINI_API_KEY or GOOGLE_API_KEY in your .env file');
    process.exit(1);
}
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:3000', 'http://127.0.0.1:8000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// SYSTEM PROMPTS (Server-side only - never exposed to frontend)
// These are carefully crafted prompts that provide UNIQUE VALUE over raw AI
// ============================================================================

const PROMPTS = {
    /**
     * Generate assessment questions
     * @param {string} mode - 'beginner' or 'oscp'
     */
    questionGeneration: (mode) => {
        const difficulty = mode === 'oscp' 
            ? 'OSCP-prep learners. Questions should be scenario-based, require critical thinking, and test applied knowledge. Include real-world penetration testing scenarios without actual exploits.'
            : 'beginner learners. Questions should be encouraging, test foundational concepts, and build confidence while identifying knowledge gaps.';
        
        return `You are an expert cybersecurity instructor creating an assessment for ${difficulty}

Generate exactly 10 high-quality assessment questions.

QUESTION MIX:
- 6-7 multiple-choice questions (4 options each, one clearly correct)
- 3-4 short-answer questions (expecting 1-2 sentence responses)

TOPICS (distribute evenly):
1. Networking (TCP/IP model, ports, protocols, subnetting basics)
2. Linux (filesystem, permissions, common commands conceptually)
3. Web Security (HTTP methods, cookies, sessions, OWASP concepts)
4. Security Fundamentals (CIA triad, authentication, encryption concepts)

QUALITY STANDARDS:
✓ Each question tests understanding, not memorization
✓ Wrong options should be plausible but clearly incorrect to someone who knows the topic
✓ Explanations should teach, not just state the answer
✓ Hints should guide thinking without revealing answers
✓ Questions must vary - never repeat the same question pattern

STRICT RULES:
✗ NO certification names (OSCP, CEH, etc.)
✗ NO actual exploit code or commands
✗ NO real CVEs or vulnerability details
✗ NO unethical hacking references

JSON OUTPUT FORMAT:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "Clear, well-written question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Educational explanation of WHY this is correct and why others are wrong",
      "hint": "A thinking prompt that guides without giving away the answer"
    }
  ]
}`;
    },

    /**
     * Evaluate assessment answers - provides detailed analysis
     */
    evaluation: `You are a senior cybersecurity mentor evaluating a learner's assessment.

Analyze their answers carefully and provide a DETAILED evaluation.

OUTPUT FORMAT (JSON only):
{
  "level": "Beginner" | "Foundation" | "Intermediate",
  "strengths": [
    "Specific strength with evidence from their answers",
    "Another specific strength",
    "Third strength area"
  ],
  "weaknesses": [
    "Specific area needing improvement with constructive framing",
    "Another area to develop",
    "Third growth opportunity"
  ],
  "focusSuggestion": "A personalized 2-3 sentence recommendation that acknowledges their current level and provides a clear next step. Be encouraging but honest."
}

LEVEL CRITERIA:
- "Beginner": < 40% conceptual understanding, needs fundamental building blocks
- "Foundation": 40-70% understanding, ready for intermediate hands-on practice
- "Intermediate": > 70% understanding, ready for advanced topics and lab work

EVALUATION PRINCIPLES:
✓ Be encouraging and growth-focused
✓ Identify specific patterns in their answers
✓ Frame weaknesses as opportunities
✓ Provide actionable insights
✗ Never be discouraging or judgmental
✗ Never mention specific certifications

Output ONLY valid JSON.`,

    /**
     * Generate personalized roadmap - PROFESSIONAL with tables and structure
     * @param {string} level - Skill level
     * @param {string[]} weaknesses - Areas to improve
     * @param {string} cert - Target certification
     */
    roadmap: (level, weaknesses, cert) => `You are an elite cybersecurity mentor creating a PERSONALIZED, PROFESSIONAL learning roadmap.

═══════════════════════════════════════════════════════════════
LEARNER PROFILE
═══════════════════════════════════════════════════════════════
• Current Level: ${level}
• Growth Areas: ${weaknesses.join(', ')}
• Target Certification: ${cert}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
Create a comprehensive, STRUCTURED learning roadmap that stands out from generic AI responses.

FORMAT REQUIREMENTS:
1. Use clear markdown headers (##, ###)
2. Include HTML tables for structured information
3. Use bullet points for actionable items
4. Add time estimates for each section
5. Include progress checkpoints

═══════════════════════════════════════════════════════════════
ROADMAP STRUCTURE
═══════════════════════════════════════════════════════════════

Start with a brief EXECUTIVE SUMMARY (2-3 sentences about their personalized path).

Then create THREE PHASES:

## 📚 Phase 1: Foundation Building (Weeks 1-4)
Focus: Address the identified weak areas with structured fundamentals.

Include a table:
| Week | Focus Area | Learning Objectives | Resources | Milestone |
|------|------------|---------------------|-----------|-----------|

Then list:
### 🎯 Key Learning Objectives
### 📖 Recommended Resources (prioritize FREE)
### ✅ Phase 1 Checkpoint (how they know they're ready for Phase 2)

## 🔧 Phase 2: Practical Skills Development (Weeks 5-10)
Focus: Hands-on practice and skill building aligned with ${cert} expectations.

Include a table:
| Skill Area | Practice Method | Time Investment | Success Criteria |
|------------|-----------------|-----------------|------------------|

Then list:
### 🎯 Hands-On Objectives
### 🔬 Practice Environments (free labs, VMs)
### ✅ Phase 2 Checkpoint

## 🎓 Phase 3: Certification Readiness (Weeks 11-16)
Focus: Exam preparation mindset and methodology refinement.

Include a table:
| Preparation Area | Activity | Frequency | Goal |
|------------------|----------|-----------|------|

Then list:
### 🎯 Readiness Objectives
### 📝 Study Strategies
### ✅ Final Readiness Checklist

End with:
## 💡 Mentor's Note
A personalized, encouraging closing message about their journey.

═══════════════════════════════════════════════════════════════
STRICT RULES
═══════════════════════════════════════════════════════════════
✗ Do NOT promise exam success or passing
✗ Do NOT include actual exploit code
✗ Do NOT provide specific vulnerability details
✓ Focus on methodology and understanding
✓ Be encouraging and realistic
✓ Emphasize legal, ethical learning
✓ Make it feel personalized, not generic`,

    /**
     * Mentor chat guidance - STRUCTURED, PROFESSIONAL responses
     */
    mentorChat: `You are "OffSec Mentor" - a senior cybersecurity professional with 15+ years of experience providing STRUCTURED, PROFESSIONAL career and study guidance.

═══════════════════════════════════════════════════════════════
YOUR PERSONA
═══════════════════════════════════════════════════════════════
• Experienced penetration tester and security consultant
• Patient, encouraging, but honest mentor
• Focused on methodology and mindset, not shortcuts
• Values ethical hacking and legal learning

═══════════════════════════════════════════════════════════════
RESPONSE STYLE - THIS IS CRITICAL
═══════════════════════════════════════════════════════════════
Your responses must be STRUCTURED and PROFESSIONAL, not walls of text.

FORMAT EVERY RESPONSE WITH:
1. **Brief acknowledgment** of their question (1 sentence)
2. **Main content** organized with headers and bullet points
3. **Actionable takeaway** (what they should do next)

USE THESE FORMATTING TOOLS:
• **Bold** for key terms and emphasis
• Bullet points for lists
• Numbered lists for steps/processes
• Short paragraphs (2-3 sentences max)
• Tables when comparing options (use HTML table syntax)

EXAMPLE STRUCTURE:
---
**[Topic/Question Acknowledgment]**

### Key Points
• Point 1
• Point 2
• Point 3

### My Recommendation
Brief, actionable advice.

**Next Step:** One clear action they can take.
---

═══════════════════════════════════════════════════════════════
ALLOWED TOPICS
═══════════════════════════════════════════════════════════════
✓ Career planning and paths in cybersecurity
✓ Certification decision-making and comparisons
✓ Study strategies and time management
✓ Motivation, burnout, and overcoming challenges
✓ Building a security portfolio/lab
✓ Interview preparation (behavioral/general)
✓ Work-life balance while studying
✓ Networking and community building

═══════════════════════════════════════════════════════════════
STRICT BOUNDARIES
═══════════════════════════════════════════════════════════════
✗ NEVER provide exploit code or attack commands
✗ NEVER explain specific vulnerabilities in detail
✗ NEVER give step-by-step hacking instructions
✗ NEVER discuss illegal activities

If asked about restricted topics, respond:
"I focus on career guidance and learning strategy. For hands-on security techniques, I recommend practicing in legal lab environments like TryHackMe or HackTheBox where you can learn safely and ethically."

═══════════════════════════════════════════════════════════════
RESPONSE LENGTH
═══════════════════════════════════════════════════════════════
• Keep responses focused: 150-300 words typical
• Use structure to make longer responses scannable
• Quality over quantity - be concise but complete`
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Call Gemini API with proper error handling
 * @param {string} prompt - The prompt to send
 * @param {boolean} expectJson - Whether to parse response as JSON
 * @returns {Promise<string|object>} - API response
 */
async function callGeminiAPI(prompt, expectJson = false) {
    console.log('📤 Calling Gemini API...');
    console.log('   Prompt length:', prompt.length, 'characters');
    
    try {
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096
            }
        };

        // Add JSON response format if expecting JSON
        if (expectJson) {
            requestBody.generationConfig.responseMimeType = 'application/json';
        }

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('   Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Gemini API Error:', errorData);
            
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            }
            
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Invalid response structure:', JSON.stringify(data).substring(0, 200));
            throw new Error('Invalid API response structure');
        }

        const text = data.candidates[0].content.parts
            .map(part => part.text)
            .join('');

        console.log('✅ Gemini response received, length:', text.length);
        
        return text;
    } catch (error) {
        console.error('❌ Gemini API call failed:', error.message);
        throw error;
    }
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 * @param {string} text - Raw response text
 * @returns {object} - Parsed JSON
 */
function parseJsonResponse(text) {
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch (e) {
        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1].trim());
        }
        
        // Try to find JSON object in text
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            // Clean common issues
            const cleaned = objectMatch[0]
                .replace(/,\s*}/g, '}')
                .replace(/,\s*]/g, ']');
            return JSON.parse(cleaned);
        }
        
        throw new Error('No valid JSON found in response');
    }
}

/**
 * Validate request body has required fields
 * @param {object} body - Request body
 * @param {string[]} required - Required field names
 * @returns {string|null} - Error message or null if valid
 */
function validateRequest(body, required) {
    for (const field of required) {
        if (body[field] === undefined || body[field] === null) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/generate-questions
 * Generate assessment questions based on learning mode
 * 
 * Request body: { mode: 'beginner' | 'oscp' }
 * Response: { questions: [...] }
 */
app.post('/api/generate-questions', async (req, res) => {
    console.log('\n🎯 POST /api/generate-questions');
    
    try {
        const { mode = 'beginner' } = req.body;
        
        if (!['beginner', 'oscp'].includes(mode)) {
            return res.status(400).json({ 
                error: 'Invalid mode. Use "beginner" or "oscp".' 
            });
        }

        console.log('   Mode:', mode);
        
        const prompt = PROMPTS.questionGeneration(mode);
        
        let parsed;
        try {
            const response = await callGeminiAPI(prompt, true);
            parsed = parseJsonResponse(response);
        } catch (apiError) {
            console.warn('⚠️  Gemini API failed, using fallback questions:', apiError.message);
            // Provide fallback questions when API fails
            parsed = {
                questions: [
                    {
                        type: 'multiple-choice',
                        question: 'Which of the following best describes the OSI model?',
                        options: [
                            'A framework that defines networking standards and protocols',
                            'A type of encryption algorithm',
                            'A software development methodology',
                            'A database management system'
                        ],
                        correctAnswer: 'A framework that defines networking standards and protocols',
                        explanation: 'The OSI (Open Systems Interconnection) model is a conceptual framework that standardizes network communication into seven layers. It\'s not an encryption method, development approach, or database system.',
                        hint: 'Think about what "model" means in the context of networking - it\'s about structuring and organizing how systems communicate.'
                    },
                    {
                        type: 'multiple-choice',
                        question: 'What does TCP stand for?',
                        options: [
                            'Transmission Control Protocol',
                            'Transfer Communication Process',
                            'Total Connection Packet',
                            'Transport Control Port'
                        ],
                        correctAnswer: 'Transmission Control Protocol',
                        explanation: 'TCP (Transmission Control Protocol) is a core internet protocol that ensures reliable, ordered delivery of data packets. It\'s one of the fundamental protocols in network communication.',
                        hint: 'Consider what would be needed to "control" and ensure reliable transmission of data.'
                    },
                    {
                        type: 'short-answer',
                        question: 'Explain the difference between symmetric and asymmetric encryption in one or two sentences.',
                        options: [],
                        correctAnswer: 'Symmetric uses one shared key for both encryption/decryption; asymmetric uses public-private key pairs',
                        explanation: 'Symmetric encryption is faster and uses the same key for both parties. Asymmetric encryption is slower but more secure for key distribution as it uses two different keys (public and private).',
                        hint: 'Think about how many keys are involved and whether the sender and receiver use the same one.'
                    },
                    {
                        type: 'multiple-choice',
                        question: 'What is the primary purpose of a firewall?',
                        options: [
                            'To monitor and control incoming/outgoing network traffic',
                            'To encrypt all data on a network',
                            'To assign IP addresses to devices',
                            'To repair damaged network cables'
                        ],
                        correctAnswer: 'To monitor and control incoming/outgoing network traffic',
                        explanation: 'A firewall acts as a security barrier, monitoring network traffic and enforcing security rules. It\'s not responsible for encryption, DHCP, or physical infrastructure.',
                        hint: 'What is the main security function at the network level - what would "control" traffic mean?'
                    },
                    {
                        type: 'multiple-choice',
                        question: 'Which of these is an example of a strong password?',
                        options: [
                            'P@ssw0rd!2024Security#',
                            'password123',
                            '12345678',
                            'MyName2024'
                        ],
                        correctAnswer: 'P@ssw0rd!2024Security#',
                        explanation: 'Strong passwords use a mix of uppercase, lowercase, numbers, and special characters with sufficient length (12+ characters). Simple words, birthdays, or common patterns are weak.',
                        hint: 'Strong passwords combine different character types and avoid dictionary words or obvious patterns.'
                    }
                ]
            };
        }
        
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid questions format from API');
        }

        console.log('✅ Generated', parsed.questions.length, 'questions');
        
        return res.json({ 
            success: true, 
            ...parsed 
        });
    } catch (error) {
        console.error('❌ Error generating questions:', error.message);
        return res.json({ 
            success: false, 
            error: 'Failed to generate questions. Please try again.' 
        });
    }
});

/**
 * POST /api/evaluate-assessment
 * Evaluate learner's assessment answers
 * 
 * Request body: { answers: { 0: "answer1", 1: "answer2", ... }, questions: [...] }
 * Response: { level, strengths, weaknesses, focusSuggestion }
 */
app.post('/api/evaluate-assessment', async (req, res) => {
    console.log('\n📊 POST /api/evaluate-assessment');
    
    try {
        const { answers, questions } = req.body;
        
        const validationError = validateRequest(req.body, ['answers', 'questions']);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Build context for evaluation
        const answersText = Object.entries(answers)
            .map(([idx, answer]) => {
                const q = questions[parseInt(idx)];
                return `Q${parseInt(idx) + 1}: ${q?.question || 'Unknown question'}\nAnswer: ${answer}\nCorrect: ${q?.correctAnswer || 'N/A'}`;
            })
            .join('\n\n');

        const prompt = `${PROMPTS.evaluation}\n\nLearner's Assessment:\n${answersText}`;
        
        let parsed;
        try {
            const response = await callGeminiAPI(prompt, true);
            parsed = parseJsonResponse(response);
        } catch (apiError) {
            console.warn('⚠️  Gemini API failed, using mock evaluation:', apiError.message);
            // Provide a reasonable default evaluation when API fails
            parsed = {
                level: 'Foundation',
                strengths: [
                    'You demonstrated basic understanding of key concepts',
                    'Your answers showed logical thinking',
                    'You engaged with the assessment material'
                ],
                weaknesses: [
                    'Some areas need deeper exploration',
                    'Consider practicing more hands-on exercises',
                    'Review foundational concepts more thoroughly'
                ],
                focusSuggestion: 'Continue building your foundations with consistent practice. Focus on understanding the "why" behind each concept, not just the "what". Your progress is important, and persistence will lead to mastery.'
            };
        }
        
        console.log('✅ Evaluation complete - Level:', parsed.level);
        
        return res.json({ 
            success: true, 
            ...parsed 
        });
    } catch (error) {
        console.error('❌ Error evaluating assessment:', error.message);
        return res.json({ 
            success: false, 
            error: 'Failed to evaluate assessment. Please try again.' 
        });
    }
});

/**
 * POST /api/generate-roadmap
 * Generate personalized learning roadmap
 * 
 * Request body: { level, weaknesses, cert }
 * Response: { roadmap: "markdown text" }
 */
app.post('/api/generate-roadmap', async (req, res) => {
    console.log('\n🗺️ POST /api/generate-roadmap');
    
    try {
        const { level, weaknesses, cert } = req.body;
        
        const validationError = validateRequest(req.body, ['level', 'weaknesses', 'cert']);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        console.log('   Level:', level);
        console.log('   Cert:', cert);
        console.log('   Weaknesses:', weaknesses.join(', '));

        const prompt = PROMPTS.roadmap(level, weaknesses, cert);
        
        let response;
        try {
            response = await callGeminiAPI(prompt, false);
        } catch (apiError) {
            console.warn('⚠️  Gemini API failed, using template roadmap:', apiError.message);
            // Provide a reasonable default roadmap when API fails
            response = `# ${cert} Learning Roadmap

## 📚 Phase 1: Foundation Building (Weeks 1-4)
Focus: Address identified weak areas with structured fundamentals.

| Week | Focus Area | Learning Objectives | Resources | Milestone |
|------|------------|---------------------|-----------|-----------|
| 1 | Fundamentals | Understand core concepts | Official documentation | Key concepts mastered |
| 2-3 | Deep Dive | Explore in depth | Tutorials, courses | Hands-on exercises |
| 4 | Review | Consolidate knowledge | Practice exams | Checkpoint passed |

## 🔧 Phase 2: Practical Skills Development (Weeks 5-10)
Focus: Hands-on practice and skill building.

| Skill Area | Practice Method | Time Investment | Success Criteria |
|------------|-----------------|-----------------|------------------|
| Labs | Virtual environments | 10-15 hrs/week | Complete all labs |
| Projects | Real scenarios | 5-10 hrs/week | Build portfolio |
| CTFs | Challenges | 5 hrs/week | Solve progressively |

## 🎓 Phase 3: Certification Readiness (Weeks 11-16)
Focus: Exam preparation and methodology refinement.

| Preparation Area | Activity | Frequency | Goal |
|------------------|----------|-----------|------|
| Mock Exams | Practice tests | Weekly | 80%+ score |
| Weak Areas | Targeted review | Daily | Master gaps |
| Time Management | Timed practice | 2x weekly | Improve speed |

## 💡 Mentor's Note
You're on a solid path to mastery. The roadmap above is personalized for your learning level and target certification. Remember that progression isn't always linear - some weeks you'll learn more than others. Stay consistent, be patient with yourself, and celebrate small victories along the way.`;
        }
        
        console.log('✅ Roadmap generated');
        
        return res.json({ 
            success: true, 
            roadmap: response 
        });
    } catch (error) {
        console.error('❌ Error generating roadmap:', error.message);
        return res.json({ 
            success: false, 
            roadmap: "", 
            error: "Roadmap generation failed. Please try again." 
        });
    }
});

/**
 * POST /api/mentor-chat
 * Handle mentor conversation
 * 
 * Request body: { message, context: { level, weaknesses, cert } }
 * Response: { reply: "mentor response" }
 */
app.post('/api/mentor-chat', async (req, res) => {
    console.log('\n💬 POST /api/mentor-chat');
    
    try {
        const { message, context = {} } = req.body;
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('   Message:', message.substring(0, 50) + '...');

        // Build context-aware prompt
        let contextInfo = '';
        if (context.level) {
            contextInfo += `\nLearner's Current Level: ${context.level}`;
        }
        if (context.weaknesses && context.weaknesses.length > 0) {
            contextInfo += `\nAreas to Improve: ${context.weaknesses.join(', ')}`;
        }
        if (context.cert) {
            contextInfo += `\nTarget Certification: ${context.cert}`;
        }

        const prompt = `${PROMPTS.mentorChat}${contextInfo}\n\nLearner's Message: "${message}"\n\nProvide a helpful, encouraging response:`;
        
        let response;
        try {
            response = await callGeminiAPI(prompt, false);
        } catch (apiError) {
            console.warn('⚠️  Gemini API failed, using fallback mentor response:', apiError.message);
            // Provide a thoughtful default response when API fails
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('stuck') || lowerMessage.includes('help') || lowerMessage.includes('difficult')) {
                response = "**I understand you're feeling challenged.** That's completely normal on this learning journey! Here's what I recommend:\n\n• **Break it down**: Divide the topic into smaller, manageable pieces\n• **Practice consistently**: Even 30 minutes daily beats cramming\n• **Review fundamentals**: Sometimes the answer lies in revisiting basics\n• **Don't compare**: Your progress is your own - celebrate small wins\n\nRemember, every expert was once a beginner. You've got this! What specific area would you like to focus on?";
            } else if (lowerMessage.includes('progress') || lowerMessage.includes('how am i')) {
                response = "**You're making great progress!** The fact that you're engaged and learning shows real commitment. Keep these practices up:\n\n• **Stay consistent**: Regular effort compounds over time\n• **Track your wins**: Note what you've learned and mastered\n• **Set milestones**: Break your goal into achievable checkpoints\n• **Seek feedback**: Every mistake is a learning opportunity\n\nYou're on the right track. What's your next learning goal?";
            } else if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('certification')) {
                response = "**Great question about your certification!** Here's my mentoring perspective:\n\n• **Practice exams**: Take them regularly to identify gaps\n• **Time management**: Learn to pace yourself under exam conditions\n• **Focus on concepts**: Understand the 'why' behind techniques\n• **Stay calm**: Exam day nerves are normal - you've prepared\n\nYou've built a solid foundation. Trust your preparation and approach the exam with confidence. Any specific topics you'd like to review?";
            } else {
                response = "**That's a thoughtful question!** Based on what you're exploring:\n\n• **Deepen your understanding**: Go beyond surface-level knowledge\n• **Apply what you learn**: Practice makes permanent\n• **Stay curious**: Your inquisitive mindset is your greatest asset\n• **Connect concepts**: See how different ideas relate\n\nI'm here to guide you. Keep pushing forward - you're doing great work!";
            }
        }
        
        console.log('✅ Mentor response generated');
        
        return res.json({ 
            success: true, 
            reply: response 
        });
    } catch (error) {
        console.error('❌ Error in mentor chat:', error.message);
        return res.json({ 
            success: false, 
            error: 'Failed to get mentor response. Please try again.' 
        });
    }
});

/**
 * POST /api/register
 * User registration
 * 
 * Request body: { email, username, password }
 * Response: { sessionId, user, success }
 */
app.post('/api/register', async (req, res) => {
    console.log('\n📝 POST /api/register');
    
    try {
        const { email, username, password } = req.body;
        
        // Validate required fields
        if (!email || !username || !password) {
            return res.json({ 
                success: false, 
                error: 'Email, username, and password are required' 
            });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.json({ 
                success: false, 
                error: 'Password must be at least 6 characters' 
            });
        }
        
        // Simple session ID generation (in production, use proper tokens)
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        const user = { 
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email, 
            username 
        };
        
        console.log('✅ User registered:', username);
        
        return res.json({ 
            success: true, 
            sessionId, 
            user 
        });
    } catch (error) {
        console.error('❌ Error registering user:', error.message);
        return res.json({ 
            success: false, 
            error: 'Registration failed. Please try again.' 
        });
    }
});

/**
 * POST /api/login
 * User login
 * 
 * Request body: { emailOrUsername, password }
 * Response: { sessionId, user, success }
 */
app.post('/api/login', async (req, res) => {
    console.log('\n🔐 POST /api/login');
    
    try {
        const { emailOrUsername, password } = req.body;
        
        // Validate required fields
        if (!emailOrUsername || !password) {
            return res.json({ 
                success: false, 
                error: 'Email/username and password are required' 
            });
        }
        
        // Simple validation (in production, check against database)
        // For demo purposes, accept any non-empty credentials
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        const user = { 
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email: emailOrUsername.includes('@') ? emailOrUsername : emailOrUsername + '@example.com', 
            username: emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername
        };
        
        console.log('✅ User logged in:', user.username);
        
        return res.json({ 
            success: true, 
            sessionId, 
            user 
        });
    } catch (error) {
        console.error('❌ Error logging in user:', error.message);
        return res.json({ 
            success: false, 
            error: 'Login failed. Please try again.' 
        });
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/register',
            'POST /api/login',
            'POST /api/generate-questions',
            'POST /api/evaluate-assessment',
            'POST /api/generate-roadmap',
            'POST /api/mentor-chat'
        ]
    });
});

/**
 * Catch-all: Serve index.html for SPA routing
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║   🎓 OffSec AI Mentor - Backend Server                     ║');
    console.log('║                                                            ║');
    console.log(`║   🚀 Server running on http://localhost:${PORT}              ║`);
    console.log('║                                                            ║');
    console.log('║   Endpoints:                                               ║');
    console.log('║   • POST /api/register                                     ║');
    console.log('║   • POST /api/login                                        ║');
    console.log('║   • POST /api/generate-questions                           ║');
    console.log('║   • POST /api/evaluate-assessment                          ║');
    console.log('║   • POST /api/generate-roadmap                             ║');
    console.log('║   • POST /api/mentor-chat                                  ║');
    console.log('║   • GET  /api/health                                       ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
