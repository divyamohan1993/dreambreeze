# Privacy and Compliance

DreamBreeze treats privacy as a **fundamental right**, not a feature.

## Core Privacy Architecture

### On-Device Processing

All AI computation runs entirely on the user's device via TensorFlow.js:

| Data Type | Where It Lives | Leaves Device? |
|-----------|---------------|----------------|
| Raw accelerometer data | Phone memory only | Never |
| Posture classifications | Phone memory only | Never |
| Sleep stage estimations | Phone memory only | Never |
| AI agent computations | Phone memory only | Never |
| Audio generation | Phone memory only | Never |
| Sleep session summaries | Supabase (encrypted) | Only if user opts in |
| Authentication tokens | Supabase Auth | Yes (required for accounts) |

### Data Minimization

DreamBreeze follows the principle of **collecting only what is necessary**:

- No GPS or location tracking
- No microphone access
- No camera access
- No contact list access
- No browsing history
- No cross-app tracking
- No advertising identifiers

## Regulatory Compliance

### GDPR (EU General Data Protection Regulation)

| Requirement | Implementation |
|------------|---------------|
| **Lawful basis** | Explicit consent via ConsentBanner component |
| **Purpose limitation** | Data used only for sleep comfort optimization |
| **Data minimization** | On-device processing, minimal cloud storage |
| **Right to access** | Privacy Vault at `/app/privacy` -- view all stored data |
| **Right to erasure** | One-click data deletion in Privacy Vault |
| **Right to portability** | JSON export of all user data |
| **Consent withdrawal** | Granular consent toggles, revocable at any time |
| **Data Protection Officer** | Contact information provided in privacy settings |

### DPDP Act 2023 (India Digital Personal Data Protection)

| Requirement | Implementation |
|------------|---------------|
| **Consent-based processing** | Explicit opt-in for all data collection |
| **Purpose limitation** | Clear purpose statement for each data type |
| **Data principal rights** | Full access, correction, and erasure capabilities |
| **Data fiduciary obligations** | Transparent data handling documentation |
| **Cross-border transfer** | Optional -- data can remain entirely on-device |
| **Breach notification** | Incident response procedures documented |

### CCPA (California Consumer Privacy Act)

| Requirement | Implementation |
|------------|---------------|
| **Right to know** | Full transparency via Privacy Vault |
| **Right to delete** | One-click deletion of all personal data |
| **Right to opt-out** | No data sales -- nothing to opt out of |
| **Non-discrimination** | All features work identically regardless of privacy choices |
| **Financial incentives** | None offered for data sharing |

## Consent Banner

The `ConsentBanner` component (`src/components/ui/ConsentBanner.tsx`) implements a GDPR-compliant consent flow:

1. **First visit**: Banner appears with clear explanation of data practices
2. **Granular controls**: Users can individually toggle:
   - Sleep data storage (cloud backup)
   - Analytics (anonymous usage patterns)
   - Weather data fetching (requires approximate location)
3. **Accept all / Reject all**: Quick options for users who prefer not to customize
4. **Persistent**: Consent state stored in localStorage, revocable at any time via Settings

## Privacy Vault

The Privacy Vault (`/app/privacy`) gives users complete control:

### View
- All stored sleep session summaries
- Account information
- Consent history with timestamps

### Export
- JSON download of all personal data
- Sleep history in machine-readable format
- Suitable for data portability requests

### Delete
- Individual session deletion
- Full account data wipe
- Confirmation step to prevent accidents
- Irreversible -- data is permanently removed from Supabase

## Security Measures

| Measure | Details |
|---------|---------|
| **Encryption at rest** | Supabase PostgreSQL with AES-256 |
| **Encryption in transit** | TLS 1.3 for all API calls |
| **Row-level security** | Supabase RLS policies -- users can only access their own data |
| **Auth** | Supabase Auth with secure token handling |
| **No plaintext secrets** | Environment variables for all credentials |
| **CSP headers** | Content Security Policy configured via Next.js |

## What We Will Never Do

- Sell user data to third parties
- Share data with advertisers
- Use sleep data for targeted advertising
- Store raw sensor readings in the cloud
- Track users across apps or websites
- Require cloud connectivity for core features
- Degrade functionality for privacy-conscious users
