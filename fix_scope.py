import re

def fix():
    with open('app.js', 'r') as f:
        content = f.read()

    # Find all function declarations
    # and make sure they are not nested
    # We will just find all 'function name() {' and ensure they have enough closing braces before the next one

    lines = content.split('\n')
    new_lines = []
    brace_count = 0
    in_function = False

    for line in lines:
        if re.match(r'^(async\s+)?function\s+\w+\s*\(.*?\)\s*\{', line):
            # If we are already in a function and it's not closed, close it!
            if brace_count > 0:
                while brace_count > 0:
                    new_lines.append('}')
                    brace_count -= 1
                new_lines.append('// Auto-closed by Bolt')

        new_lines.append(line)
        brace_count += line.count('{')
        brace_count -= line.count('}')

    with open('app.js', 'w') as f:
        f.write('\n'.join(new_lines))

fix()
