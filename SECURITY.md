# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Health Exposure, please send an email to feedback.stack021@passmail.net. All security vulnerabilities will be promptly addressed.

Please include the following information in your report:
- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Measures

Health Exposure implements several security measures:

1. **API Security**
   - API key authentication
   - CORS protection
   - Rate limiting
   - Input validation

2. **Data Protection**
   - Environment variables for sensitive data
   - No sensitive data in logs
   - Secure API endpoints

3. **Infrastructure Security**
   - AWS Lambda with least privilege
   - CloudFront with HTTPS
   - S3 bucket with proper access controls

## Best Practices

When using Health Exposure:

1. Never commit API keys or sensitive data
2. Keep dependencies updated
3. Use HTTPS for all API calls
4. Follow rate limiting guidelines
5. Report any security issues promptly 