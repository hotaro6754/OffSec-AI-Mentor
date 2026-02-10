import re

with open('style.css', 'r') as f:
    content = f.read()

# Remove .beginner-mode-ui .mentor-intent-buttons and related styles
pattern = re.compile(r'\.beginner-mode-ui \.mentor-intent-buttons {.*?}\s*\.beginner-mode-ui \.btn-intent {.*?}\s*\.beginner-mode-ui \.btn-intent:hover {.*?}\s*\.beginner-mode-ui \.btn-intent:active {.*?}', re.DOTALL)

content = pattern.sub('', content)

with open('style.css', 'w') as f:
    f.write(content)

print("Successfully cleaned up style.css")
