# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Rate limiting implementation with free/premium tiers
  - Free tier: 100 requests per hour
  - Premium tier: 1000 requests per hour
  - Rate limit headers in responses
  - Automatic cleanup of rate limit data after 2 hours
- Security improvements
  - CORS protection for authorized origins
  - Simple API key authentication
  - Enhanced input validation
  - Developer documentation for API access
- Monitoring and alerts
  - CloudWatch alarms for error rates and request patterns
  - Cost monitoring and alerts
  - Security event logging and alerts
  - Comprehensive monitoring documentation

## [v0.1.0] – 2025-05-08

### Added
- Initial mobile frontend (React Native + Expo)
- Live geolocation using `expo-location`
- Frontend H3 lookup via `lat/lon → backend`
- Traffic-light UI for air quality, UV, pollen, humidity
- Clickable rows with detail views
- GitHub repo cleanup with `.gitignore` and `README.md`
- Automated news data updates via CloudWatch scheduler
  - 15-minute update interval
  - Prioritized updates for oldest news
  - Batch processing of up to 10 cells per run
  - 6-hour news freshness threshold