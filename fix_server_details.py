import re

with open('server-v2.js', 'r') as f:
    content = f.read()

# Fix Shellcoder's Handbook name
content = content.replace("The Shellcoder0027s Handbook", "The Shellcoder's Handbook")

# Add some missing tools to masterToolList
tools_to_add = "Caido, Nuclei, SharpHound, PowerView, Patator, Medusa, hcxtools, ntlmrelayx, enum4linux-ng, "
content = content.replace("Recon: Nmap, Masscan, RustScan, Amass, Subfinder", "Recon: Nmap, Masscan, RustScan, Amass, Subfinder, Nuclei")
content = content.replace("Web: Burp Suite, OWASP ZAP, FFUF, SQLmap, XSStrike, Gobuster", "Web: Burp Suite, OWASP ZAP, Caido, FFUF, SQLmap, XSStrike, Gobuster")
content = content.replace("AD: BloodHound, Mimikatz, Rubeus, Evil-WinRM, Impacket, Responder", "AD: BloodHound, SharpHound, PowerView, Mimikatz, Rubeus, Evil-WinRM, Impacket, Responder, ntlmrelayx")
content = content.replace("Enumeration: Enum4linux, CrackMapExec, SMBMap, SNMPwalk, LDAPSearch", "Enumeration: Enum4linux, enum4linux-ng, CrackMapExec, SMBMap, SNMPwalk, LDAPSearch")
content = content.replace("Passwords: Hashcat, John, Hydra, SecLists, RockYou", "Passwords: Hashcat, John, Hydra, Patator, Medusa, SecLists, RockYou")
content = content.replace("Wireless: Aircrack-ng, Bettercap, Wifite", "Wireless: Aircrack-ng, Bettercap, Wifite, hcxtools")

with open('server-v2.js', 'w') as f:
    f.write(content)
