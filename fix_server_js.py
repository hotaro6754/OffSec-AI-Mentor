import sys

with open('server-v2.js', 'r') as f:
    content = f.read()

old_try_call = """async function tryCallAI(apiKey, model, apiUrl, prompt, expectJson = false, retries = 3, maxTokens = 5000, stream = false) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {"""

new_try_call = """async function tryCallAI(apiKey, model, apiUrl, prompt, expectJson = false, retries = 3, maxTokens = 5000, stream = false) {
    const startTime = Date.now();
    for (let attempt = 1; attempt <= retries; attempt++) {
        const elapsed = (Date.now() - startTime) / 1000;

        // Render timeout is 30s. If we're already past 25s, don't even try another call.
        if (elapsed > 25 && attempt > 1) {
            console.log(`⚠️  Approaching Render 30s timeout (${elapsed.toFixed(1)}s elapsed). Aborting retries.`);
            return { success: false, rateLimit: true, error: `AI Rate Limited (Timeout approaching)`, retryAfter: 30 };
        }

        try {"""

old_429 = """            // Handle errors
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                let waitTime = 0;

                if (retryAfter) {
                    // retry-after can be in seconds or a date string
                    waitTime = isNaN(retryAfter)
                        ? (new Date(retryAfter).getTime() - Date.now()) / 1000
                        : parseInt(retryAfter);
                }

                if (attempt < retries) {
                    // If no retry-after header, use optimized backoff: 2s, 5s, 10s, 15s, 20s
                    if (!waitTime || waitTime <= 0) {
                        const waitTimes = [2, 5, 10, 15, 20];
                        waitTime = waitTimes[Math.min(attempt - 1, waitTimes.length - 1)];
                    }

                    // Cap wait time to 30s to avoid Render timeout if possible
                    waitTime = Math.min(waitTime, 30);

                    console.log(`⏳ GROQ rate limited, waiting ${waitTime}s before retry ${attempt + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }"""

new_429 = """            // Handle errors
            if (response.status === 429) {
                const retryAfter = response.headers.get('retry-after');
                let waitTime = 0;

                if (retryAfter) {
                    waitTime = isNaN(retryAfter)
                        ? (new Date(retryAfter).getTime() - Date.now()) / 1000
                        : parseInt(retryAfter);
                }

                if (attempt < retries) {
                    // If no retry-after header, use optimized backoff: 2s, 5s, 8s
                    if (!waitTime || waitTime <= 0) {
                        const waitTimes = [2, 5, 8];
                        waitTime = waitTimes[Math.min(attempt - 1, waitTimes.length - 1)];
                    }

                    // Strict budget check for Render (30s limit)
                    const totalElapsed = (Date.now() - startTime) / 1000;
                    const remainingBudget = 26 - totalElapsed; // Leave 4s for the final call

                    if (remainingBudget <= 0) {
                        console.log(`⚠️  No time budget left for retry. Aborting.`);
                        return { success: false, rateLimit: true, error: `GROQ rate limit exceeded`, retryAfter: waitTime };
                    }

                    // Cap wait time to remaining budget or 10s max
                    waitTime = Math.min(waitTime, remainingBudget, 10);

                    console.log(`⏳ GROQ rate limited, waiting ${waitTime.toFixed(1)}s before retry ${attempt + 1}/${retries}...`);
                    await new Promise(r => setTimeout(r, waitTime * 1000));
                    continue;
                }"""

content = content.replace(old_try_call, new_try_call)
content = content.replace(old_429, new_429)

with open('server-v2.js', 'w') as f:
    f.write(content)
