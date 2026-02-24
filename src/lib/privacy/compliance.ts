/**
 * Privacy regulation detection and compliance for DreamBreeze.
 *
 * Detects applicable privacy regulations based on user locale/timezone
 * and provides structured policy text for each jurisdiction.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type RegulationId = 'DPDP' | 'GDPR' | 'CCPA';

export interface Regulation {
  id: RegulationId;
  name: string;
  jurisdiction: string;
  keyRequirements: string[];
  dataSubjectRights: string[];
}

export interface PrivacyPolicySection {
  title: string;
  content: string;
}

export interface StructuredPrivacyPolicy {
  appName: string;
  lastUpdated: string;
  applicableRegulations: RegulationId[];
  sections: PrivacyPolicySection[];
  contactInfo: {
    email: string;
    grievanceOfficer?: string; // Required by DPDP
    dpo?: string; // Required by GDPR
  };
}

// ── Regulation Definitions ─────────────────────────────────────────────────────

const REGULATIONS: Record<RegulationId, Regulation> = {
  DPDP: {
    id: 'DPDP',
    name: 'Digital Personal Data Protection Act, 2023',
    jurisdiction: 'India',
    keyRequirements: [
      'Consent must be free, specific, informed, unconditional, and unambiguous (Section 6)',
      'Data shall be processed only for the purpose consented to (Section 5)',
      'Data fiduciary must implement security safeguards (Section 8)',
      'Appoint a Data Protection Officer / Grievance Officer (Section 8(7))',
      'Notify data breach to the Board and affected individuals (Section 8(6))',
      'Data retention limited to purpose fulfillment (Section 8(3))',
    ],
    dataSubjectRights: [
      'Right to information about personal data processing (Section 11)',
      'Right to correction and erasure (Section 12)',
      'Right to grievance redressal (Section 13)',
      'Right to nominate (Section 14)',
    ],
  },
  GDPR: {
    id: 'GDPR',
    name: 'General Data Protection Regulation',
    jurisdiction: 'European Union / EEA',
    keyRequirements: [
      'Explicit consent with clear affirmative action (Article 7)',
      'Data Protection Officer designation (Article 37-39)',
      'Data breach notification within 72 hours (Article 33)',
      'Privacy by design and by default (Article 25)',
      'Data Protection Impact Assessment for high-risk processing (Article 35)',
      'Records of processing activities (Article 30)',
    ],
    dataSubjectRights: [
      'Right of access (Article 15)',
      'Right to rectification (Article 16)',
      'Right to erasure / right to be forgotten (Article 17)',
      'Right to data portability (Article 20)',
      'Right to object (Article 21)',
      'Right to restrict processing (Article 18)',
    ],
  },
  CCPA: {
    id: 'CCPA',
    name: 'California Consumer Privacy Act',
    jurisdiction: 'California, United States',
    keyRequirements: [
      'Disclose data collection practices in privacy policy',
      'Provide "Do Not Sell My Personal Information" option',
      'Equal service regardless of privacy choices (non-discrimination)',
      'Respond to consumer requests within 45 days',
      'Verify consumer identity before fulfilling requests',
    ],
    dataSubjectRights: [
      'Right to know what personal data is collected',
      'Right to delete personal data',
      'Right to opt-out of sale of personal data',
      'Right to non-discrimination for exercising rights',
    ],
  },
};

// ── Timezone → Regulation Mapping ──────────────────────────────────────────────

const INDIA_TIMEZONE = 'Asia/Kolkata';
const INDIA_LOCALES = ['hi', 'hi-IN', 'en-IN', 'bn-IN', 'ta-IN', 'te-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN', 'pa-IN'];

const EU_TIMEZONES = [
  'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Bratislava',
  'Europe/Brussels', 'Europe/Bucharest', 'Europe/Budapest', 'Europe/Copenhagen',
  'Europe/Dublin', 'Europe/Helsinki', 'Europe/Lisbon', 'Europe/Ljubljana',
  'Europe/London', 'Europe/Luxembourg', 'Europe/Madrid', 'Europe/Malta',
  'Europe/Nicosia', 'Europe/Oslo', 'Europe/Paris', 'Europe/Prague',
  'Europe/Riga', 'Europe/Rome', 'Europe/Sofia', 'Europe/Stockholm',
  'Europe/Tallinn', 'Europe/Vienna', 'Europe/Vilnius', 'Europe/Warsaw',
  'Europe/Zagreb',
];

const CALIFORNIA_TIMEZONE = 'America/Los_Angeles';

// ── Public Functions ───────────────────────────────────────────────────────────

/**
 * Detect applicable privacy regulations based on user's locale and timezone.
 */
export function getApplicableRegulations(
  locale?: string,
  timezone?: string,
): RegulationId[] {
  const detectedLocale = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en');
  const detectedTimezone =
    timezone ??
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC');

  const regulations: RegulationId[] = [];

  // India: DPDP
  if (
    detectedTimezone === INDIA_TIMEZONE ||
    INDIA_LOCALES.some((l) => detectedLocale.startsWith(l))
  ) {
    regulations.push('DPDP');
  }

  // EU: GDPR
  if (
    EU_TIMEZONES.includes(detectedTimezone) ||
    detectedLocale.match(/^(de|fr|it|es|pt|nl|pl|ro|hu|cs|sv|el|bg|da|fi|sk|lt|lv|et|sl|mt|hr|ga)-/)
  ) {
    regulations.push('GDPR');
  }

  // California: CCPA
  if (detectedTimezone === CALIFORNIA_TIMEZONE && detectedLocale.startsWith('en-US')) {
    regulations.push('CCPA');
  }

  // If no specific regulation detected, default to GDPR as the most comprehensive
  if (regulations.length === 0) {
    regulations.push('GDPR');
  }

  return regulations;
}

/**
 * Get details about a specific regulation.
 */
export function getRegulation(id: RegulationId): Regulation {
  return REGULATIONS[id];
}

/**
 * Generate a structured privacy policy based on applicable regulations.
 */
export function getPrivacyPolicy(regulations: RegulationId[]): StructuredPrivacyPolicy {
  const sections: PrivacyPolicySection[] = [];

  // 1. Introduction
  sections.push({
    title: 'Introduction',
    content:
      'DreamBreeze is an AI-powered sleep comfort application that uses your phone\'s motion sensors to track sleep posture and automatically adjust your fan speed for optimal comfort. This privacy policy explains how we collect, use, and protect your personal data.',
  });

  // 2. Data We Collect
  sections.push({
    title: 'Data We Collect',
    content: [
      'Motion Sensor Data: Accelerometer and gyroscope readings from your phone during sleep tracking. This data is processed on-device and used to classify your sleep posture.',
      'Sleep Analysis Data: Estimated sleep stages, posture transitions, and sleep quality scores derived from sensor data.',
      'Account Information: Email address and display name if you create an account.',
      'Fan Configuration: Your fan connection settings (MQTT broker URL, webhook URL) and preferred speed profiles.',
      'Usage Analytics: Anonymous feature usage data (no personal sleep data included).',
    ].join('\n\n'),
  });

  // 3. How We Use Your Data
  sections.push({
    title: 'How We Use Your Data',
    content: [
      'Sleep Tracking: Sensor data is processed locally to determine your sleep posture and stage in real-time.',
      'Fan Control: Posture and sleep stage data is used to calculate optimal fan speed settings.',
      'Insights and Reports: Sleep session summaries help you understand your sleep patterns over time.',
      'We do NOT sell your personal data to third parties.',
      'We do NOT use your sleep data for advertising.',
    ].join('\n\n'),
  });

  // 4. Data Storage and Security
  sections.push({
    title: 'Data Storage and Security',
    content: [
      'Raw sensor data is processed entirely on your device and is never uploaded to our servers.',
      'Sleep session summaries (not raw sensor readings) may be stored in Supabase if you enable cloud storage. This data is encrypted at rest.',
      'Data retention: Sleep sessions are automatically deleted after 365 days. You can delete all data at any time.',
    ].join('\n\n'),
  });

  // 5. Your Rights (based on applicable regulations)
  const rights: string[] = [];
  for (const regId of regulations) {
    const reg = REGULATIONS[regId];
    rights.push(`Under ${reg.name} (${reg.jurisdiction}):`);
    for (const right of reg.dataSubjectRights) {
      rights.push(`  - ${right}`);
    }
    rights.push('');
  }
  sections.push({
    title: 'Your Rights',
    content: [
      'You have the following rights regarding your personal data:',
      '',
      ...rights,
      'To exercise any of these rights, go to Settings > Privacy > Data Management in the app, or contact us at the email below.',
    ].join('\n'),
  });

  // 6. DPDP-specific sections
  if (regulations.includes('DPDP')) {
    sections.push({
      title: 'DPDP Act 2023 Compliance (India)',
      content: [
        'As a Data Fiduciary under the DPDP Act 2023, we affirm that:',
        '- Consent is obtained in a free, specific, informed, unconditional, and unambiguous manner (Section 6).',
        '- Personal data is processed only for the purpose consented to (Section 5).',
        '- We implement reasonable security safeguards to protect your data (Section 8).',
        '- A Grievance Officer has been appointed for redressal of your concerns (Section 8(7)).',
        '- In case of a data breach, we will notify the Data Protection Board and affected individuals without delay (Section 8(6)).',
        '- Data is retained only as long as necessary for the stated purpose, with a maximum retention of 365 days (Section 8(3)).',
      ].join('\n'),
    });
  }

  // 7. GDPR-specific sections
  if (regulations.includes('GDPR')) {
    sections.push({
      title: 'GDPR Compliance (European Union)',
      content: [
        'Legal basis for processing: Consent (Article 6(1)(a)).',
        'Data Protection Officer (DPO) has been appointed.',
        'In case of a data breach affecting your rights, we will notify the supervisory authority within 72 hours (Article 33).',
        'Data Protection Impact Assessment has been conducted for our processing activities (Article 35).',
        'Cross-border data transfers are conducted with appropriate safeguards in place.',
      ].join('\n'),
    });
  }

  // 8. CCPA-specific sections
  if (regulations.includes('CCPA')) {
    sections.push({
      title: 'CCPA Compliance (California)',
      content: [
        'Categories of personal information collected: identifiers (email), internet activity (usage analytics), sensory data (motion sensors).',
        'We do NOT sell your personal information.',
        'We will not discriminate against you for exercising your CCPA rights.',
        'To submit a request, use the in-app Data Management tools or email us.',
        'We will respond to verifiable consumer requests within 45 days.',
      ].join('\n'),
    });
  }

  // 9. Contact
  const contactInfo: StructuredPrivacyPolicy['contactInfo'] = {
    email: 'privacy@dreambreeze.app',
  };

  if (regulations.includes('DPDP')) {
    contactInfo.grievanceOfficer = 'grievance@dreambreeze.app';
  }
  if (regulations.includes('GDPR')) {
    contactInfo.dpo = 'dpo@dreambreeze.app';
  }

  sections.push({
    title: 'Contact Us',
    content: [
      `Email: ${contactInfo.email}`,
      contactInfo.grievanceOfficer
        ? `Grievance Officer (DPDP): ${contactInfo.grievanceOfficer}`
        : null,
      contactInfo.dpo ? `Data Protection Officer (GDPR): ${contactInfo.dpo}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  });

  return {
    appName: 'DreamBreeze',
    lastUpdated: new Date().toISOString().split('T')[0],
    applicableRegulations: regulations,
    sections,
    contactInfo,
  };
}
