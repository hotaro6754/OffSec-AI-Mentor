with open('app.js', 'r') as f:
    content = f.read()

old_welcome = 'const welcomeText = "Hi! I’m KaliGuru — your ethical Kali Linux mentor for authorized labs only.\\n\\nEverything we discuss is strictly for TryHackMe, HTB, VulnHub, self-owned labs, etc.\\n\\nWhich lab, machine, or topic are you working on right now? 😎";'
new_welcome = 'const welcomeText = "Hi! I’m KaliGuru — your ethical Kali Linux mentor for authorized labs only.\\nEverything we discuss is strictly for TryHackMe, HTB, VulnHub, self-owned labs, etc.\\nWhich lab, machine, or topic are you working on right now? 😎";'

content = content.replace(old_welcome, new_welcome)

with open('app.js', 'w') as f:
    f.write(content)

print("Successfully updated welcome text in app.js")
