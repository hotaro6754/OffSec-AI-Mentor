import sys

with open('database.js', 'r') as f:
    content = f.read()

old_insert = """        for (const q of questions) {
            // Create a simple hash from question text
            const hash = Buffer.from(q.question).toString('base64').substring(0, 50);
            stmt.run(uuidv4(), userId, hash, q.question, mode);
        }"""

new_insert = """        for (const q of questions) {
            // Store the first 100 chars of the question as the "hash"
            // This is actually a plain-text summary the AI can read
            const summary = q.question.substring(0, 100).replace(/["']/g, '');
            stmt.run(uuidv4(), userId, summary, q.question, mode);
        }"""

content = content.replace(old_insert, new_insert)

with open('database.js', 'w') as f:
    f.write(content)
