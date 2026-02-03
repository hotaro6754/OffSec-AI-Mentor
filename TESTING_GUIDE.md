# Testing Guide for PR: Fix PDF Generation, Filter Non-OffSec Certifications, and Implement OSCP Mode Auto-Selection

## Overview
This guide provides step-by-step instructions for testing all the changes implemented in this PR.

## Prerequisites
- Node.js 18+ installed
- Groq API key (for roadmap generation)
- iLovePDF API keys (for PDF export testing)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Setup
```bash
# Install dependencies
npm install

# Create .env file with API keys
cp .env.example .env
# Edit .env and add:
# GROQ_API_KEY=your_groq_api_key
# ILOVEPDF_PUBLIC_KEY=your_public_key
# ILOVEPDF_SECRET_KEY=your_secret_key

# Start the server
npm start
```

Server should start at: http://localhost:3000

## Test Cases

### Test 1: Verify OffSec-Only Certifications in Modal

**Steps:**
1. Open the application in a browser
2. Start the assessment (either mode)
3. Complete the assessment
4. Click "Generate My Roadmap" button
5. Modal should appear with certification options

**Expected Results:**
- Modal should show ONLY 8 OffSec certifications:
  - ✅ OSCP (Offensive Security Certified Professional)
  - ✅ OSEP (Offensive Security Experienced Penetration Tester)
  - ✅ OSWE (Offensive Security Web Expert)
  - ✅ OSDA (Offensive Security Defense Analyst)
  - ✅ OSWP (Offensive Security Wireless Professional)
  - ✅ OSED (Offensive Security Exploit Developer)
  - ✅ OSEE (Offensive Security Exploitation Expert)
  - ✅ OSMR (Offensive Security macOS Researcher)

- Should NOT show:
  - ❌ CEH (Certified Ethical Hacker)
  - ❌ CPTS (Certified Penetration Testing Specialist)
  - ❌ eJPT (eLearnSecurity Junior Penetration Tester)
  - ❌ PNPT (Practical Network Penetration Tester)
  - ❌ THM Jr Pentester

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 2: OSCP Mode Auto-Selection

**Steps:**
1. Open the application
2. Toggle the mode switch to "OSCP Mode" (should turn red/dark theme)
3. Complete the assessment
4. Click "Generate My Roadmap" button

**Expected Results:**
- Modal should NOT appear
- OSCP should be auto-selected
- Roadmap should start generating immediately for OSCP
- Console log should show: "🎯 OSCP Mode detected - Auto-selecting OSCP certification"
- Loading screen should show "OSCP - Offensive Security Certified Professional"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 3: OSCP Mode Roadmap Content (Exam-Focused)

**Prerequisites:** Complete Test 2 first

**Expected Results:**
Roadmap should show:
- ✅ 8-10 intensive phases (not 12-14)
- ✅ Advanced focus (assumes foundational knowledge)
- ✅ Mentions of HTB Pro Labs: Offshore, RastaLabs, Cybernetics, APTLabs
- ✅ IppSec videos, TJ Null OSCP list references
- ✅ Focus on weak areas identified in assessment
- ✅ Manual exploitation techniques
- ✅ Active Directory attack paths
- ✅ Privilege escalation mastery content
- ❌ Should NOT show beginner content like "Linux basics for absolute beginners"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 4: Beginner Mode + OSCP Selection

**Steps:**
1. Refresh the application
2. Ensure mode is set to "Beginner Mode" (light theme)
3. Complete the assessment
4. Click "Generate My Roadmap"
5. Select "OSCP" from the modal
6. Click "Select & Generate"

**Expected Results:**
- Modal should appear with all 8 OffSec certifications
- After selecting OSCP, roadmap should generate
- Roadmap should show:
  - ✅ 12-14 progressive phases (more than OSCP mode)
  - ✅ Foundational phases (Linux basics, Networking fundamentals, Windows basics)
  - ✅ Beginner resources: TryHackMe rooms, OverTheWire, Easy-rated HTB boxes
  - ✅ Progressive difficulty curve
  - ✅ Phases 1-4: Foundations
  - ✅ Phases 5-8: Intermediate
  - ✅ Phases 9-12+: OSCP Prep
- If readiness score < 60%:
  - ✅ Should mention preparation certifications (eJPT, THM Jr Pentester, etc.)
  - ✅ Recommendation to consider prep certs before OSCP

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 5: QR Code Display

**Prerequisites:** Generate any roadmap

**Steps:**
1. Scroll to the bottom of the generated roadmap
2. Look for QR code section

**Expected Results:**
- ✅ QR code section should appear at bottom of roadmap
- ✅ Section should have:
  - Bold title: "🎯 SCAN FOR BONUS MENTOR WISDOM"
  - QR code image (placeholder SVG)
  - Subtitle: "Unlock exclusive cybersecurity insights and advanced tips!"
- ✅ Neo-Brutalist styling:
  - Thick black border (6px solid)
  - Yellow background (or dark background in OSCP mode)
  - High contrast
  - Sharp edges (no rounded corners)
  - Dashed border around QR code image

**OSCP Mode Specific:**
- ✅ Dark background (#2d2d2d)
- ✅ Orange/red border color
- ✅ Colored accent text

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 6: PDF Export with QR Code

**Prerequisites:** 
- iLovePDF API keys configured
- Roadmap generated

**Steps:**
1. Generate a roadmap (any certification)
2. Click "Download PDF" button
3. Wait for PDF to generate and download
4. Open the downloaded PDF

**Expected Results:**
- ✅ PDF should download successfully (no UrlError)
- ✅ PDF should contain all roadmap content
- ✅ QR code section should be included in PDF
- ✅ Styling should be preserved
- ✅ All phases should be visible
- ✅ Links should be clickable
- ✅ Console logs should show:
  ```
  📋 [1/7] Validating HTML structure...
  ✅ HTML structure validated
  🎨 [2/7] Preparing CSS injection for PDF...
  ✅ CSS injected and minified
  📄 [3/7] Initializing iLovePDF API...
  📄 [4/7] Packaging HTML into ZIP buffer...
  📄 [5/7] Starting iLovePDF task...
  📄 [6/7] Processing HTML to PDF conversion...
  📄 [7/7] Downloading generated PDF buffer...
  ✅ PDF generation workflow completed successfully
  ```

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 7: Regenerate Roadmap (OSCP Mode)

**Steps:**
1. While in OSCP mode with a generated roadmap
2. Click "🔄 Generate New Roadmap" button

**Expected Results:**
- ✅ Modal should NOT appear
- ✅ Should auto-select OSCP again
- ✅ New roadmap should generate
- ✅ Console should show: "🎯 OSCP Mode detected - Auto-selecting OSCP certification for regeneration"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 8: Preparation Certification Recommendations

**Prerequisites:** 
- Beginner mode
- Low readiness score (< 60%)
- OSCP selected

**Steps:**
1. Complete assessment with intentionally weak answers
2. Select OSCP from modal
3. Review generated roadmap phases 1-2

**Expected Results:**
- ✅ Early phases should mention preparation certifications:
  - eJPT (eLearnSecurity Junior Penetration Tester)
  - THM Jr Pentester (TryHackMe)
  - CEH (Certified Ethical Hacker)
  - PNPT (Practical Network Penetration Tester)
  - CPTS (Certified Penetration Testing Specialist)
- ✅ Should include text like: "Consider completing eJPT or THM Jr Pentester path before attempting OSCP if you feel overwhelmed by the material."

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 9: Mode Switching

**Steps:**
1. Start in Beginner mode
2. Generate a roadmap
3. Toggle to OSCP mode
4. Generate a new roadmap

**Expected Results:**
- ✅ UI should update (theme change)
- ✅ OSCP mode should bypass modal
- ✅ Different roadmap structure should be generated
- ✅ No errors should occur

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

### Test 10: Browser Compatibility

**Test in each browser:**
- Chrome
- Firefox
- Safari
- Edge

**Expected Results:**
- ✅ All features work in all browsers
- ✅ Styling displays correctly
- ✅ Modal appears and functions properly
- ✅ QR code displays correctly
- ✅ PDF download works

**Status:** 
- Chrome: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Firefox: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Safari: ⬜ Not Tested | ✅ Passed | ❌ Failed
- Edge: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Known Limitations

1. **QR Code Image:** Currently using a placeholder SVG. Replace with actual QR code linking to desired content.
2. **API Keys Required:** PDF generation and roadmap generation require valid API keys.
3. **Preparation Cert Recommendations:** Only appear in beginner mode when selecting OSCP with low readiness score.

## Troubleshooting

### Issue: Modal not appearing in beginner mode
- Check console for JavaScript errors
- Verify assessment was completed
- Try refreshing the page

### Issue: PDF download fails
- Verify iLovePDF API keys are configured
- Check console logs for detailed error messages
- Ensure HTML structure is valid

### Issue: Wrong roadmap type generated
- Verify mode switch is in correct position
- Check console logs for mode detection
- Try toggling mode and regenerating

### Issue: QR code not showing
- Check browser console for image loading errors
- Verify qr-code.svg exists in root directory
- Check if CSS is loaded properly

## Security Notes

- All changes passed CodeQL security scan with 0 alerts
- No SQL injection vulnerabilities
- No XSS vulnerabilities
- Proper input validation on PDF generation endpoint
- HTML structure validation prevents malformed input

## Reporting Issues

If any test fails, please report with:
1. Test case number
2. Browser and version
3. Console error logs (if any)
4. Screenshots (if UI issue)
5. Steps to reproduce
