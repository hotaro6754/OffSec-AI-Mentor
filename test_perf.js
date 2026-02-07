const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const db = new Database(':memory:');

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
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log('Populating 50,000 records...');
const insert = db.prepare('INSERT INTO assessments (id, user_id, mode, score) VALUES (?, ?, ?, ?)');
const userId = 'user-123';
const otherUserId = 'user-456';

db.transaction(() => {
    for (let i = 0; i < 50000; i++) {
        insert.run(uuidv4(), otherUserId, 'beginner', 50);
    }
    insert.run(uuidv4(), userId, 'pro', 90);
})();

function measure() {
    const start = process.hrtime.bigint();
    const result = db.prepare('SELECT * FROM assessments WHERE user_id = ?').all(userId);
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // ms
}

const before = measure();
console.log(`Time before index: ${before.toFixed(4)}ms`);

db.exec('CREATE INDEX idx_assessments_user_id ON assessments(user_id)');

const after = measure();
console.log(`Time after index: ${after.toFixed(4)}ms`);
