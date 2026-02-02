# iLovePDF API Integration - Deployment Guide

## Overview

The OffSec AI Mentor now uses **iLovePDF API** for server-side PDF generation instead of client-side jsPDF library. This provides better reliability and doesn't depend on CDN availability.

## What Changed

### Removed
- ❌ Client-side jsPDF library (CDN dependency)
- ❌ Browser-based PDF generation
- ❌ Dependency on ad blockers not blocking CDN

### Added
- ✅ Server-side PDF generation via iLovePDF API
- ✅ Backend endpoint `/api/generate-pdf`
- ✅ Graceful error handling with fallback to JSON export
- ✅ Better reliability (no CDN issues)

## API Keys

You need to get iLovePDF API keys from: https://developer.ilovepdf.com

The API key provided:
```
Public Key: project_public_ebd0c610fb7f41467b8f3820d1bd3143_rx6Jv25bb682a21eb6b5815218327fc9417c2
Secret Key: secret_key_ebd0c610fb7f41467b8f3820d1bd3143_rx6Jv25bb682a21eb6b5815218327fc9417c2
```

## Environment Variables

Update your `.env` file with:

```bash
# iLovePDF API Configuration
ILOVEPDF_PUBLIC_KEY=project_public_ebd0c610fb7f41467b8f3820d1bd3143_rx6Jv25bb682a21eb6b5815218327fc9417c2
ILOVEPDF_SECRET_KEY=secret_key_ebd0c610fb7f41467b8f3820d1bd3143_rx6Jv25bb682a21eb6b5815218327fc9417c2
```

## Dependencies

The following npm package is required:

```bash
npm install @ilovepdf/ilovepdf-nodejs
```

This is already added to `package.json`.

## Network Requirements

⚠️ **IMPORTANT**: The server must have network access to `api.ilovepdf.com` on port 443 (HTTPS).

If deploying to:
- **Render.com**: Should work out of the box ✅
- **Heroku**: Should work out of the box ✅
- **AWS/Azure/GCP**: Ensure security groups allow outbound HTTPS ✅
- **Docker**: No special configuration needed ✅
- **Firewalled environments**: Whitelist `api.ilovepdf.com` ⚠️

## How It Works

### Frontend Flow
1. User clicks "Download as PDF" button
2. Frontend generates complete HTML document from roadmap
3. HTML is sent to backend `/api/generate-pdf` endpoint
4. Backend returns PDF file
5. Browser downloads the PDF

### Backend Flow
1. Receives HTML content and filename
2. Creates temporary HTML file
3. Initializes iLovePDF API with keys
4. Converts HTML to PDF using iLovePDF service
5. Returns PDF to frontend
6. Cleans up temporary files

## Error Handling

If PDF generation fails:
- ❌ User sees error message explaining the issue
- 💡 Message suggests using "Export as JSON" button instead
- 📋 Console shows troubleshooting steps
- ✅ App remains fully functional

## Testing

### Local Testing
```bash
# Start the server
npm start

# Open browser to http://localhost:3000
# Generate a roadmap
# Click "Download as PDF" button
# PDF should download automatically
```

### Verify API Keys
Check server logs on startup:
```
✅ iLovePDF API configured for PDF generation
```

If you see this, API keys are configured correctly.

### Troubleshooting

**Error: "PDF generation failed"**
- Check internet connection
- Verify API keys are correct
- Check if api.ilovepdf.com is accessible
- Check server logs for detailed error

**Error: "ENOTFOUND api.ilovepdf.com"**
- Server can't reach iLovePDF API
- Check firewall settings
- Check network restrictions
- Verify DNS resolution works

**Error: "Service not configured"**
- API keys not set in environment variables
- Check .env file
- Restart server after adding keys

## Cost Considerations

iLovePDF API has usage limits:
- Free tier: Limited number of conversions per month
- Paid tiers: Higher limits available

Monitor usage at: https://developer.ilovepdf.com/user/projects

## Fallback Option

Users can always export as JSON or TXT format if PDF generation is unavailable. These options don't require any API and work offline.

## Production Checklist

Before deploying to production:

- [ ] iLovePDF API keys added to environment variables
- [ ] Server can reach api.ilovepdf.com
- [ ] Tested PDF generation with real roadmap data
- [ ] Verified error handling works correctly
- [ ] Checked API usage limits
- [ ] Monitored server logs for errors
- [ ] Temporary files directory has write permissions
- [ ] JSON export still works as fallback

## Support

For iLovePDF API issues:
- Documentation: https://developer.ilovepdf.com/docs
- Support: https://developer.ilovepdf.com/support

For OffSec AI Mentor issues:
- GitHub: https://github.com/hotaro6754/OffSec-AI-Mentor/issues
