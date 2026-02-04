import sys

with open('database.js', 'r') as f:
    db_content = f.read()

old_insert = """        for (const q of questions) {
            // Store the first 100 chars of the question as the "hash"
            // This is actually a plain-text summary the AI can read
            const summary = q.question.substring(0, 100).replace(/["']/g, '');
            stmt.run(uuidv4(), userId, summary, q.question, mode);
        }"""

new_insert = """        for (const q of questions) {
            if (!q || !q.question) continue;
            // Store the first 100 chars of the question as the "hash"
            // This is actually a plain-text summary the AI can read
            const summary = q.question.substring(0, 100).replace(/["']/g, '');
            stmt.run(uuidv4(), userId, summary, q.question, mode);
        }"""

db_content = db_content.replace(old_insert, new_insert)

with open('database.js', 'w') as f:
    f.write(db_content)

with open('app.js', 'r') as f:
    app_content = f.read()

# Fix originalContent bug in proceedToEvaluation
old_eval_start = """async function proceedToEvaluation() {
    // Show evaluation section but clear content for loader
    const evaluationContainer = document.querySelector('.evaluation-container');
    const originalContent = evaluationContainer.innerHTML;
    evaluationContainer.innerHTML = '';"""

new_eval_start = """async function proceedToEvaluation() {
    // Show evaluation section but clear content for loader
    const evaluationContainer = document.querySelector('.evaluation-container');

    // Don't overwrite original content if we're already in an error state
    if (!window.originalEvaluationContent || evaluationContainer.querySelector('.error-state')) {
        if (!evaluationContainer.querySelector('.error-state')) {
            window.originalEvaluationContent = evaluationContainer.innerHTML;
        }
    }

    evaluationContainer.innerHTML = '';"""

app_content = app_content.replace(old_eval_start, new_eval_start)
app_content = app_content.replace('evaluationContainer.innerHTML = originalContent;', 'evaluationContainer.innerHTML = window.originalEvaluationContent || "";')

with open('app.js', 'w') as f:
    f.write(app_content)
