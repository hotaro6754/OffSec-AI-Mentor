/**
 * OffSec AI Mentor - Database Module
 * 
 * SQLite database for user accounts, progress tracking, and saved roadmaps
 * Uses better-sqlite3 for synchronous, high-performance operations
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize database
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'offsec_mentor.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Better performance

// ============================================================================
// SCHEMA INITIALIZATION
// ============================================================================

function initializeDatabase() {
    console.log('📦 Initializing database...');
    
    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            current_level TEXT DEFAULT 'Beginner',
            target_cert TEXT DEFAULT 'eJPT',
            learning_mode TEXT DEFAULT 'beginner'
        )
    `);

    // Sessions table for authentication
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Assessment history
    db.exec(`
        CREATE TABLE IF NOT EXISTS assessments (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            mode TEXT NOT NULL,
            score INTEGER,
            level TEXT,
            strengths TEXT,
            weaknesses TEXT,
            questions TEXT,
            answers TEXT,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Saved roadmaps
    db.exec(`
        CREATE TABLE IF NOT EXISTS roadmaps (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            target_cert TEXT,
            level TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // User checklist/goals
    db.exec(`
        CREATE TABLE IF NOT EXISTS checklist (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'general',
            is_completed INTEGER DEFAULT 0,
            order_index INTEGER DEFAULT 0,
            due_date DATE,
            completed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Chat history
    db.exec(`
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Question cache (to avoid repeating questions)
    db.exec(`
        CREATE TABLE IF NOT EXISTS question_cache (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            question_hash TEXT NOT NULL,
            question_text TEXT NOT NULL,
            mode TEXT NOT NULL,
            used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    console.log('✅ Database initialized successfully');
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Register a new user
 */
function registerUser(email, username, password) {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    
    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, email, username, password_hash)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(id, email.toLowerCase(), username.toLowerCase(), passwordHash);
        
        // Create default checklist items
        createDefaultChecklist(id);
        
        return { success: true, userId: id };
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            if (error.message.includes('email')) {
                return { success: false, error: 'Email already registered' };
            }
            if (error.message.includes('username')) {
                return { success: false, error: 'Username already taken' };
            }
        }
        return { success: false, error: error.message };
    }
}

/**
 * Login user and create session
 */
function loginUser(emailOrUsername, password) {
    const user = db.prepare(`
        SELECT * FROM users 
        WHERE email = ? OR username = ?
    `).get(emailOrUsername.toLowerCase(), emailOrUsername.toLowerCase());
    
    if (!user) {
        return { success: false, error: 'User not found' };
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
        return { success: false, error: 'Invalid password' };
    }
    
    // Create session (expires in 7 days)
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
        INSERT INTO sessions (id, user_id, expires_at)
        VALUES (?, ?, ?)
    `).run(sessionId, user.id, expiresAt);
    
    // Update last login
    db.prepare(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);
    
    return {
        success: true,
        sessionId,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            currentLevel: user.current_level,
            targetCert: user.target_cert,
            learningMode: user.learning_mode
        }
    };
}

/**
 * Validate session and get user
 */
function validateSession(sessionId) {
    if (!sessionId) return null;
    
    const session = db.prepare(`
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(sessionId);
    
    if (!session) return null;
    
    return {
        id: session.user_id,
        email: session.email,
        username: session.username,
        currentLevel: session.current_level,
        targetCert: session.target_cert,
        learningMode: session.learning_mode
    };
}

/**
 * Logout user (delete session)
 */
function logoutUser(sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return { success: true };
}

/**
 * Update user preferences
 */
function updateUserPreferences(userId, preferences) {
    const { targetCert, learningMode, currentLevel } = preferences;
    
    db.prepare(`
        UPDATE users 
        SET target_cert = COALESCE(?, target_cert),
            learning_mode = COALESCE(?, learning_mode),
            current_level = COALESCE(?, current_level)
        WHERE id = ?
    `).run(targetCert, learningMode, currentLevel, userId);
    
    return { success: true };
}

// ============================================================================
// ASSESSMENT TRACKING
// ============================================================================

/**
 * Save assessment result
 */
function saveAssessment(userId, data) {
    const id = uuidv4();
    const stmt = db.prepare(`
        INSERT INTO assessments (id, user_id, mode, score, level, strengths, weaknesses, questions, answers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
        id,
        userId,
        data.mode,
        data.score,
        data.level,
        JSON.stringify(data.strengths),
        JSON.stringify(data.weaknesses),
        JSON.stringify(data.questions),
        JSON.stringify(data.answers)
    );
    
    // Update user level
    db.prepare('UPDATE users SET current_level = ? WHERE id = ?').run(data.level, userId);
    
    return { success: true, assessmentId: id };
}

/**
 * Get user's assessment history
 */
function getAssessmentHistory(userId) {
    return db.prepare(`
        SELECT id, mode, score, level, completed_at
        FROM assessments
        WHERE user_id = ?
        ORDER BY completed_at DESC
        LIMIT 10
    `).all(userId);
}

/**
 * Get previously used question hashes for a user
 */
function getUsedQuestionHashes(userId, mode) {
    const results = db.prepare(`
        SELECT question_hash FROM question_cache
        WHERE user_id = ? AND mode = ?
        ORDER BY used_at DESC
        LIMIT 100
    `).all(userId, mode);
    
    return results.map(r => r.question_hash);
}

/**
 * Save used questions to prevent repetition
 */
function saveUsedQuestions(userId, questions, mode) {
    const stmt = db.prepare(`
        INSERT INTO question_cache (id, user_id, question_hash, question_text, mode)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const insert = db.transaction((questions) => {
        for (const q of questions) {
            // Create a simple hash from question text
            const hash = Buffer.from(q.question).toString('base64').substring(0, 50);
            stmt.run(uuidv4(), userId, hash, q.question, mode);
        }
    });
    
    insert(questions);
}

// ============================================================================
// ROADMAP MANAGEMENT
// ============================================================================

/**
 * Save a roadmap
 */
function saveRoadmap(userId, data) {
    const id = uuidv4();
    db.prepare(`
        INSERT INTO roadmaps (id, user_id, title, content, target_cert, level)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.title, data.content, data.targetCert, data.level);
    
    return { success: true, roadmapId: id };
}

/**
 * Get user's saved roadmaps
 */
function getUserRoadmaps(userId) {
    return db.prepare(`
        SELECT id, title, target_cert, level, created_at
        FROM roadmaps
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).all(userId);
}

/**
 * Get specific roadmap content
 */
function getRoadmap(roadmapId, userId) {
    return db.prepare(`
        SELECT * FROM roadmaps
        WHERE id = ? AND user_id = ?
    `).get(roadmapId, userId);
}

// ============================================================================
// CHECKLIST / GOALS
// ============================================================================

/**
 * Create default checklist items for new user
 */
function createDefaultChecklist(userId) {
    const defaultItems = [
        // Foundations
        { title: '📚 Complete networking fundamentals', category: 'foundations', order: 1 },
        { title: '🐧 Set up Linux VM (Kali/Parrot)', category: 'foundations', order: 2 },
        { title: '💻 Learn basic Linux commands', category: 'foundations', order: 3 },
        { title: '🔧 Understand TCP/IP & OSI models', category: 'foundations', order: 4 },
        { title: '🌐 Learn web fundamentals (HTTP, DNS)', category: 'foundations', order: 5 },
        
        // Practice Platforms
        { title: '🎮 Create TryHackMe account', category: 'platforms', order: 10 },
        { title: '🏴 Create HackTheBox account', category: 'platforms', order: 11 },
        { title: '🎯 Complete THM "Pre-Security" path', category: 'platforms', order: 12 },
        { title: '🔰 Complete THM "Complete Beginner" path', category: 'platforms', order: 13 },
        { title: '💀 Complete 5 easy HTB machines', category: 'platforms', order: 14 },
        
        // Tools
        { title: '🔍 Master Nmap scanning', category: 'tools', order: 20 },
        { title: '🌐 Learn Burp Suite basics', category: 'tools', order: 21 },
        { title: '🔑 Practice with Hashcat/John', category: 'tools', order: 22 },
        { title: '📡 Learn Wireshark analysis', category: 'tools', order: 23 },
        { title: '🐍 Write basic Python scripts', category: 'tools', order: 24 },
        
        // Certifications
        { title: '📜 Research certification path', category: 'certs', order: 30 },
        { title: '📖 Start certification study material', category: 'certs', order: 31 },
        { title: '📝 Take practice exams', category: 'certs', order: 32 },
    ];
    
    const stmt = db.prepare(`
        INSERT INTO checklist (id, user_id, title, category, order_index)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const item of defaultItems) {
        stmt.run(uuidv4(), userId, item.title, item.category, item.order);
    }
}

/**
 * Get user's checklist
 */
function getChecklist(userId) {
    return db.prepare(`
        SELECT * FROM checklist
        WHERE user_id = ?
        ORDER BY category, order_index
    `).all(userId);
}

/**
 * Toggle checklist item
 */
function toggleChecklistItem(userId, itemId) {
    const item = db.prepare('SELECT is_completed FROM checklist WHERE id = ? AND user_id = ?').get(itemId, userId);
    if (!item) return { success: false, error: 'Item not found' };
    
    const newStatus = item.is_completed ? 0 : 1;
    const completedAt = newStatus ? new Date().toISOString() : null;
    
    db.prepare(`
        UPDATE checklist 
        SET is_completed = ?, completed_at = ?
        WHERE id = ? AND user_id = ?
    `).run(newStatus, completedAt, itemId, userId);
    
    return { success: true, completed: !!newStatus };
}

/**
 * Add custom checklist item
 */
function addChecklistItem(userId, title, category = 'custom') {
    const id = uuidv4();
    const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM checklist WHERE user_id = ?').get(userId);
    
    db.prepare(`
        INSERT INTO checklist (id, user_id, title, category, order_index)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, title, category, (maxOrder?.max || 0) + 1);
    
    return { success: true, itemId: id };
}

/**
 * Delete checklist item
 */
function deleteChecklistItem(userId, itemId) {
    db.prepare('DELETE FROM checklist WHERE id = ? AND user_id = ?').run(itemId, userId);
    return { success: true };
}

// ============================================================================
// CHAT HISTORY
// ============================================================================

/**
 * Save chat message
 */
function saveChatMessage(userId, role, message) {
    const id = uuidv4();
    db.prepare(`
        INSERT INTO chat_history (id, user_id, role, message)
        VALUES (?, ?, ?, ?)
    `).run(id, userId, role, message);
}

/**
 * Get chat history
 */
function getChatHistory(userId, limit = 50) {
    return db.prepare(`
        SELECT role, message, created_at
        FROM chat_history
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    `).all(userId, limit).reverse();
}

/**
 * Clear chat history
 */
function clearChatHistory(userId) {
    db.prepare('DELETE FROM chat_history WHERE user_id = ?').run(userId);
    return { success: true };
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get user progress statistics
 */
function getUserStats(userId) {
    const assessmentCount = db.prepare('SELECT COUNT(*) as count FROM assessments WHERE user_id = ?').get(userId);
    const checklistProgress = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(is_completed) as completed
        FROM checklist WHERE user_id = ?
    `).get(userId);
    const latestAssessment = db.prepare(`
        SELECT level, score, completed_at 
        FROM assessments 
        WHERE user_id = ? 
        ORDER BY completed_at DESC 
        LIMIT 1
    `).get(userId);
    
    return {
        assessmentsTaken: assessmentCount.count,
        checklistTotal: checklistProgress.total,
        checklistCompleted: checklistProgress.completed || 0,
        checklistProgress: checklistProgress.total ? 
            Math.round((checklistProgress.completed || 0) / checklistProgress.total * 100) : 0,
        currentLevel: latestAssessment?.level || 'Beginner',
        lastAssessment: latestAssessment?.completed_at || null
    };
}

// Initialize on load
initializeDatabase();

// Export functions
module.exports = {
    // User management
    registerUser,
    loginUser,
    validateSession,
    logoutUser,
    updateUserPreferences,
    
    // Assessment
    saveAssessment,
    getAssessmentHistory,
    getUsedQuestionHashes,
    saveUsedQuestions,
    
    // Roadmaps
    saveRoadmap,
    getUserRoadmaps,
    getRoadmap,
    
    // Checklist
    getChecklist,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    
    // Chat
    saveChatMessage,
    getChatHistory,
    clearChatHistory,
    
    // Stats
    getUserStats
};
