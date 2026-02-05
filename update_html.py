import re

with open('index.html', 'r') as f:
    content = f.read()

# Remove mentor-intent-buttons
content = re.sub(r'<div class="mentor-intent-buttons" id="mentorIntentButtons">.*?</div>', '', content, flags=re.DOTALL)

# Remove beginnerRecommendations
content = re.sub(r'<div id="beginnerRecommendations" class="recommendation-bubbles-container hidden">.*?</div>', '', content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)
