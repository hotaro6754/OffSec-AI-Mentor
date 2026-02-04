import sys

with open('server-v2.js', 'r') as f:
    content = f.read()

old_keys = """    // Groq ONLY
    let currentApiKey = customKeys.groq || AI_API_KEY;

    if (!currentApiKey) {
        throw new Error("Groq API key is missing");
    }

    console.log(`📤 Calling GROQ API (stream=${stream})...`);"""

new_keys = """    // Groq ONLY
    let currentApiKey = customKeys.groq || AI_API_KEY;
    const isCustom = !!customKeys.groq;

    if (!currentApiKey) {
        throw new Error("Groq API key is missing");
    }

    if (isCustom) {
        const maskedKey = currentApiKey.substring(0, 4) + '...' + currentApiKey.substring(currentApiKey.length - 4);
        console.log(`🔑 Using custom user-provided Groq API key: ${maskedKey}`);
    } else {
        console.log(`🤖 Using system-wide Groq API key`);
    }

    console.log(`📤 Calling GROQ API (stream=${stream}, isCustom=${isCustom})...`);"""

content = content.replace(old_keys, new_keys)

with open('server-v2.js', 'w') as f:
    f.write(content)
