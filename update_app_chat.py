import re

with open('app.js', 'r') as f:
    content = f.read()

# 1. Update sendMentorMessage to include history
old_send_mentor = """        const response = await callBackendAPI('/api/mentor-chat', {
            message: text,
            context: {
                level: appState.assessment?.readinessStatus || 'Unknown',
                weaknesses: appState.assessment?.weaknesses || [],
                cert: appState.selectedCert || 'General Security'
            },
            stream: false
        });"""

new_send_mentor = """        const response = await callBackendAPI('/api/mentor-chat', {
            message: text,
            history: appState.mentorChat.slice(0, -1), // Send history before this message
            context: {
                level: appState.assessment?.readinessStatus || 'Unknown',
                weaknesses: appState.assessment?.weaknesses || [],
                cert: appState.selectedCert || 'General Security'
            },
            stream: false
        });"""

content = content.replace(old_send_mentor, new_send_mentor)

# 2. Remove mentorIntentButtons and beginnerRecommendations from elements
content = content.replace("    mentorIntentButtons: document.getElementById('mentorIntentButtons'),", "")
content = content.replace("    beginnerRecommendations: document.getElementById('beginnerRecommendations'),", "")

with open('app.js', 'w') as f:
    f.write(content)

print("Successfully updated app.js")
