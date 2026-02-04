import sys

with open('server-v2.js', 'r') as f:
    content = f.read()

old_v = """CRITICAL: Generate COMPLETELY NEW questions. EVERY question must be different from any you have generated before. This is retake #${retakeCount + 1}. Random seed: ${randomSeed}.
${usedHashes.length > 0 ? `\\nAVOID these previously used question patterns and topics at all costs - create entirely different scenarios and test different edge cases: ${usedHashes.join(', ')}` : ''}"""

new_v = """CRITICAL: Generate COMPLETELY NEW questions. EVERY question must be different from any you have generated before. This is retake #${retakeCount + 1}. Random seed: ${randomSeed}.
${usedHashes.length > 0 ? `\\nAVOID these specific question topics and scenarios (previously used): ${usedHashes.join('; ')}. DO NOT repeat these scenarios.` : ''}"""

content = content.replace(old_v, new_v)

with open('server-v2.js', 'w') as f:
    f.write(content)
