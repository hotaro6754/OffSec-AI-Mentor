from playwright.sync_api import sync_playwright
import time
import os

def verify_roadmap():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        mock_roadmap = {
            "targetCertification": "OSCP",
            "currentLevel": "Beginner",
            "totalDuration": "12 months",
            "difficulty_progression": "Steady increase",
            "executive_summary": "Your journey to becoming an OSCP starts with fundamentals.",
            "phases": [
                {
                    "phase_name": "Networking Fundamentals",
                    "duration_weeks": 4,
                    "total_hours": 40,
                    "learning_outcomes": ["Understand TCP/IP", "Master Nmap"],
                    "recommended_labs": [
                        {
                            "name": "TryHackMe Pre-Security",
                            "platform": "THM",
                            "difficulty": "Easy",
                            "url": "https://tryhackme.com/path/outline/presecurity"
                        }
                    ],
                    "resources_for_phase": [
                        {
                            "name": "IppSec YouTube",
                            "type": "YouTube",
                            "url": "https://youtube.com/ippsec"
                        }
                    ]
                }
            ],
            "curated_resources": {
                "learning_platforms": [
                    {"name": "Hack The Box", "url": "https://hackthebox.com", "type": "Lab"}
                ]
            },
            "similar_certifications": [
                {
                    "name": "PNPT",
                    "provider": "TCM Security",
                    "reason": "Practical focus similar to OSCP",
                    "url": "https://tcm-sec.com/pnpt/"
                }
            ]
        }

        page.goto(f"file://{os.getcwd()}/index.html")
        page.wait_for_function("typeof displayRoadmap === 'function'")

        page.evaluate(f"""
            (data) => {{
                displayRoadmap(data);
                showSection('roadmapSection');
            }}
        """, mock_roadmap)

        time.sleep(1)
        page.screenshot(path="roadmap_verification_final.png", full_page=True)
        print("Screenshot saved to roadmap_verification_final.png")
        browser.close()

if __name__ == "__main__":
    verify_roadmap()
