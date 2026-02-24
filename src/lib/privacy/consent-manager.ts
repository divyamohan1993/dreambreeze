/**
 * Consent manager for DreamBreeze.
 *
 * DPDP Act 2023 (India) Section 6 compliant:
 * - Consent must be free, specific, informed, unconditional, and unambiguous
 * - Consent must indicate clear affirmative action
 * - Must be limited to the specified purpose
 *
 * Also supports GDPR (EU) and CCPA (California) patterns.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export enum ConsentPurpose {
  SENSOR_COLLECTION = 'sensor_collection',
  SLEEP_ANALYSIS = 'sleep_analysis',
  CLOUD_STORAGE = 'cloud_storage',
  FAN_CONTROL = 'fan_control',
  ANALYTICS = 'analytics',
}

export interface ConsentRecord {
  purpose: ConsentPurpose;
  granted: boolean;
  timestamp: string; // ISO 8601
  version: string; // consent policy version
}

export interface ConsentLogEntry {
  id: string;
  purpose: ConsentPurpose;
  action: 'granted' | 'revoked';
  timestamp: string;
  policyVersion: string;
}

/** Human-readable description of each purpose — presented to the user. */
export const CONSENT_DESCRIPTIONS: Record<ConsentPurpose, { title: string; description: string }> = {
  [ConsentPurpose.SENSOR_COLLECTION]: {
    title: 'Motion Sensor Access',
    description:
      'We use your phone\'s accelerometer and gyroscope to detect your sleep posture. Data is processed on-device and never shared raw with third parties.',
  },
  [ConsentPurpose.SLEEP_ANALYSIS]: {
    title: 'Sleep Analysis',
    description:
      'We analyze your movement patterns to estimate sleep stages (light, deep, REM) and generate insights. Analysis is done locally on your device.',
  },
  [ConsentPurpose.CLOUD_STORAGE]: {
    title: 'Cloud Storage',
    description:
      'Your sleep summaries (not raw sensor data) can be stored in the cloud so you can access your history across devices. Data is encrypted at rest.',
  },
  [ConsentPurpose.FAN_CONTROL]: {
    title: 'Fan Control',
    description:
      'Allow DreamBreeze to automatically adjust your connected fan speed based on your sleep posture and stage.',
  },
  [ConsentPurpose.ANALYTICS]: {
    title: 'Usage Analytics',
    description:
      'Anonymous usage analytics help us improve the app. No personal sleep data is included — only feature usage and error reports.',
  },
};

const STORAGE_KEY = 'dreambreeze-consent';
const LOG_KEY = 'dreambreeze-consent-log';
const POLICY_VERSION = '1.0.0';

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `consent-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredConsents(): Record<string, ConsentRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredConsents(consents: Record<string, ConsentRecord>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consents));
}

function getStoredLog(): ConsentLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendLogEntry(entry: ConsentLogEntry): void {
  if (typeof window === 'undefined') return;
  const log = getStoredLog();
  log.push(entry);
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

// ── Consent Manager Class ──────────────────────────────────────────────────────

export class ConsentManager {
  /**
   * Request consent for the given purposes.
   *
   * In a real app, this would trigger a UI dialog. Here, we provide the
   * programmatic API that the UI calls after the user makes their choice.
   *
   * @param purposes - Array of purposes to request consent for.
   * @param grantedPurposes - Array of purposes the user chose to grant.
   * @returns The final set of granted purposes.
   */
  requestConsent(
    purposes: ConsentPurpose[],
    grantedPurposes: ConsentPurpose[],
  ): ConsentPurpose[] {
    const consents = getStoredConsents();
    const now = new Date().toISOString();

    for (const purpose of purposes) {
      const isGranted = grantedPurposes.includes(purpose);

      consents[purpose] = {
        purpose,
        granted: isGranted,
        timestamp: now,
        version: POLICY_VERSION,
      };

      appendLogEntry({
        id: generateId(),
        purpose,
        action: isGranted ? 'granted' : 'revoked',
        timestamp: now,
        policyVersion: POLICY_VERSION,
      });
    }

    setStoredConsents(consents);
    return grantedPurposes;
  }

  /**
   * Check whether a specific consent has been granted.
   */
  hasConsent(purpose: ConsentPurpose): boolean {
    const consents = getStoredConsents();
    return consents[purpose]?.granted === true;
  }

  /**
   * Revoke consent for a specific purpose and trigger any necessary cleanup.
   */
  revokeConsent(purpose: ConsentPurpose): void {
    const consents = getStoredConsents();
    const now = new Date().toISOString();

    consents[purpose] = {
      purpose,
      granted: false,
      timestamp: now,
      version: POLICY_VERSION,
    };

    setStoredConsents(consents);

    appendLogEntry({
      id: generateId(),
      purpose,
      action: 'revoked',
      timestamp: now,
      policyVersion: POLICY_VERSION,
    });

    // Trigger purpose-specific cleanup
    this._cleanupForPurpose(purpose);
  }

  /**
   * Get the full consent audit trail (for data principal rights compliance).
   */
  getConsentLog(): ConsentLogEntry[] {
    return getStoredLog();
  }

  /**
   * Get the current consent status for all purposes.
   */
  getAllConsents(): Record<string, ConsentRecord> {
    return getStoredConsents();
  }

  /**
   * Get the descriptions for all consent purposes (for UI display).
   */
  getConsentDescriptions(): typeof CONSENT_DESCRIPTIONS {
    return CONSENT_DESCRIPTIONS;
  }

  /**
   * Check whether the user has completed the initial consent flow.
   */
  hasCompletedConsentFlow(): boolean {
    const consents = getStoredConsents();
    // At minimum, sensor collection consent must be recorded (granted or not)
    return consents[ConsentPurpose.SENSOR_COLLECTION] !== undefined;
  }

  /**
   * Revoke all consents and clear everything.
   */
  revokeAll(): void {
    const now = new Date().toISOString();
    const allPurposes = Object.values(ConsentPurpose);

    for (const purpose of allPurposes) {
      appendLogEntry({
        id: generateId(),
        purpose,
        action: 'revoked',
        timestamp: now,
        policyVersion: POLICY_VERSION,
      });
    }

    // Clear consent records (keep log for audit)
    setStoredConsents({});
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _cleanupForPurpose(purpose: ConsentPurpose): void {
    switch (purpose) {
      case ConsentPurpose.SENSOR_COLLECTION:
        // Stop any active sensor collection
        break;
      case ConsentPurpose.CLOUD_STORAGE:
        // Mark cloud data for deletion
        break;
      case ConsentPurpose.ANALYTICS:
        // Disable analytics tracking
        break;
      default:
        break;
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────────

let _instance: ConsentManager | null = null;

export function getConsentManager(): ConsentManager {
  if (!_instance) {
    _instance = new ConsentManager();
  }
  return _instance;
}
