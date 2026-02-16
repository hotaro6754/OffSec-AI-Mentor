import re

with open('app.js', 'r') as f:
    content = f.read()

# Fix the broken regex line
old_line = r"let html = escaped.replace(/\\\[([^\\\]]+)\\\]\\(([^)]+)\\)/g, '<a href=\"$2\" target=\"_blank\" class=\"res-link-inline\">$1</a>');"
new_line = r"let html = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href=\"$2\" target=\"_blank\" class=\"res-link-inline\">$1</a>');"

# Just replace the specific line that caused the error
content = content.replace(r"let html = escaped.replace(/\\[([^\\]+)\\]\\(([^)]+)\\)/g, '<a href=\"$2\" target=\"_blank\" class=\"res-link-inline\">$1</a>');", new_line)

with open('app.js', 'w') as f:
    f.write(content)
