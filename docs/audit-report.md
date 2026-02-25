# DreamBreeze Audit Report vs CLAUDE.md Principles

**Date:** 2026-02-25
**Audited by:** 6 parallel sub-agents

## What's Done Well
- Custom design system (glassmorphism, skeuomorphic fan, custom SVG artwork)
- Privacy-first architecture -- sensor data stays on-device, Supabase RLS on all tables
- Zero hardcoded secrets, .env properly gitignored, never committed
- Security headers configured (X-Frame-Options, X-Content-Type-Options, etc.)
- No XSS vectors anywhere in the codebase
- TypeScript strict mode, zero `any` types
- Excellent "why" comments with research citations throughout
- Webhook client has proper retry + backoff + timeout
- Demo mode provides full offline graceful degradation
- Clean Zustand stores with proper selectors

## CRITICAL Gaps

| # | Principle | Issue |
|---|-----------|-------|
| 1 | Deploy | No autoconfig.sh, no Dockerfile, no deploy/ directory |
| 2 | Testing | Zero test files, no test framework installed, no test script |
| 3 | CI/CD | No GitHub Actions pipeline (no lint, build, audit in CI) |
| 4 | Deps | No Dependabot/Renovate config for automated updates |
| 5 | Resilience | No error boundaries (error.tsx) anywhere -- crash = white screen |
| 6 | API | No src/app/api/ routes, no /health endpoint |
| 7 | Security | Missing Content-Security-Policy header |

## HIGH Severity

| # | Principle | Issue | File |
|---|-----------|-------|------|
| 8 | Eases Life | Settings don't persist most preferences (MQTT, alarm, noise, sensitivity) | settings/page.tsx |
| 9 | Eases Life | Pre-sleep check-in always shows even when disabled in settings | sleep/page.tsx:70 |
| 10 | Simplicity | Dashboard has 11 information sections on one mobile page | app/page.tsx |
| 11 | DRY | POSTURE_LABELS duplicated in 5+ files | Multiple |
| 12 | DRY | NoiseType union duplicated in 5 files | Multiple |
| 13 | Open/Closed | Controller hardcodes 4 agent imports | controller.ts |
| 14 | Resilience | Weather fetch has no timeout -- can hang indefinitely | weather-service.ts:68 |
| 15 | Resilience | Supabase errors silently ignored in data-vault exports | data-vault.ts |
| 16 | Resilience | No circuit breakers anywhere | All services |
| 17 | Security | MQTT placeholder suggests insecure mqtt:// protocol | settings/page.tsx:410 |
| 18 | Security | No validation that MQTT/webhook URLs use TLS | mqtt-client.ts, webhook-client.ts |

## MEDIUM Severity

| # | Principle | Issue |
|---|-----------|-------|
| 19 | UI/UX | 3 duplicate inline components on dashboard inferior to dedicated versions |
| 20 | Experience | Dashboard simulates random data every 3 seconds -- feels fake |
| 21 | SRP | PreSleepCheckin is 930 lines -- god-component |
| 22 | SRP | SleepAgent class has 4 distinct responsibilities |
| 23 | Architecture | Domain types live in store files -- lib/ imports from stores/ |
| 24 | Simplicity | Forced 1.4s loading screen on every app load |
| 25 | Eases Life | History page uses only mock data -- sessions not saved |
| 26 | Accessibility | Likely missing aria labels, keyboard nav (needs dedicated audit) |

## Compliance Score

| Principle | Score |
|-----------|-------|
| Unique UI/UX | 7/10 |
| Eases Life | 4/10 |
| Simplicity | 5/10 |
| Experience | 6/10 |
| Security | 7/10 |
| Code Quality | 6/10 |
| Testing | 0/10 |
| Deployment | 1/10 |
| Dependencies | 6/10 |
| Resilience | 4/10 |
| Accessibility | ?/10 |
