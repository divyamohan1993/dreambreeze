'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronDown, ChevronUp, Check, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ConsentPurpose {
  id: string;
  label: string;
  description: string;
  legalBasis: string;
  retention: string;
  required: boolean;
  defaultValue: boolean;
}

interface ConsentState {
  version: number;
  timestamp: string;
  purposes: Record<string, boolean>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONSENT_KEY = 'dreambreeze-consent';
const CONSENT_VERSION = 1;

const PURPOSES: ConsentPurpose[] = [
  {
    id: 'sensor_data',
    label: 'Sensor Data Collection',
    description:
      'Accelerometer and gyroscope data from your device to detect sleep posture. All processing happens on-device.',
    legalBasis: 'Legitimate interest / contractual necessity',
    retention: 'Session only (not stored)',
    required: true,
    defaultValue: true,
  },
  {
    id: 'sleep_analysis',
    label: 'Sleep Analysis',
    description:
      'On-device AI analysis of your sleep patterns to optimize comfort settings. No data leaves your device.',
    legalBasis: 'Legitimate interest / contractual necessity',
    retention: 'Local device storage, 30 days',
    required: true,
    defaultValue: true,
  },
  {
    id: 'fan_control',
    label: 'Fan Speed Control',
    description:
      'Automatic fan speed adjustment via MQTT/IR based on detected posture and sleep stage.',
    legalBasis: 'Consent',
    retention: 'Preferences stored locally',
    required: false,
    defaultValue: true,
  },
  {
    id: 'cloud_storage',
    label: 'Cloud Storage & Sync',
    description:
      'Optional backup of sleep history and preferences to encrypted cloud storage for cross-device sync.',
    legalBasis: 'Explicit consent',
    retention: 'Until account deletion',
    required: false,
    defaultValue: false,
  },
  {
    id: 'analytics',
    label: 'Usage Analytics',
    description:
      'Anonymous, aggregated usage statistics to improve DreamBreeze. No personal data is collected.',
    legalBasis: 'Consent',
    retention: '12 months, anonymised',
    required: false,
    defaultValue: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Helper: read / write localStorage                                  */
/* ------------------------------------------------------------------ */

function getSavedConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed: ConsentState = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(purposes: Record<string, boolean>): void {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    purposes,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
}

/* ------------------------------------------------------------------ */
/*  Toggle row                                                         */
/* ------------------------------------------------------------------ */

function PurposeToggle({
  purpose,
  checked,
  onChange,
}: {
  purpose: ConsentPurpose;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={purpose.required}
        onClick={() => onChange(!checked)}
        className={`
          relative mt-0.5 flex-shrink-0 w-10 h-[22px] rounded-full transition-colors duration-200
          ${checked ? 'bg-db-teal/70' : 'bg-white/10'}
          ${purpose.required ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200
            ${checked ? 'translate-x-[18px]' : 'translate-x-0'}
          `}
        />
      </button>

      {/* Label area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-db-text">
            {purpose.label}
          </span>
          {purpose.required && (
            <span className="text-[10px] uppercase tracking-wider text-db-teal/80 bg-db-teal/10 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-db-text-dim mt-0.5 leading-relaxed">
          {purpose.description}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          <span className="text-[10px] text-db-text-muted">
            Legal basis: {purpose.legalBasis}
          </span>
          <span className="text-[10px] text-db-text-muted">
            Retention: {purpose.retention}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [choices, setChoices] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    PURPOSES.forEach((p) => {
      defaults[p.id] = p.defaultValue;
    });
    return defaults;
  });

  /* On mount, check if consent was already given */
  useEffect(() => {
    const saved = getSavedConsent();
    if (!saved) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ---- Actions ---------------------------------------------------- */

  const handleAcceptAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    PURPOSES.forEach((p) => {
      all[p.id] = true;
    });
    saveConsent(all);
    setVisible(false);
  }, []);

  const handleSaveChoices = useCallback(() => {
    // Ensure required purposes are always true
    const final: Record<string, boolean> = { ...choices };
    PURPOSES.forEach((p) => {
      if (p.required) final[p.id] = true;
    });
    saveConsent(final);
    setVisible(false);
  }, [choices]);

  const handleRejectOptional = useCallback(() => {
    const minimal: Record<string, boolean> = {};
    PURPOSES.forEach((p) => {
      minimal[p.id] = p.required;
    });
    saveConsent(minimal);
    setVisible(false);
  }, []);

  const togglePurpose = useCallback((id: string, value: boolean) => {
    setChoices((prev) => ({ ...prev, [id]: value }));
  }, []);

  /* ---- Render ----------------------------------------------------- */

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="consent-banner"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed inset-x-0 bottom-0 z-[9999] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div
            className="mx-auto max-w-lg glass overflow-hidden"
            style={{
              boxShadow:
                '0 -4px 32px rgba(0,0,0,0.4), 0 0 60px rgba(78,205,196,0.06)',
            }}
          >
            {/* Header ------------------------------------------------- */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5 mb-2">
                <Shield size={18} className="text-db-teal" />
                <h2 className="text-sm font-semibold text-db-text tracking-wide">
                  Your Privacy Matters
                </h2>
              </div>

              <p className="text-xs text-db-text-dim leading-relaxed">
                DreamBreeze processes sensor data <strong>entirely on your device</strong> to
                detect sleep posture and adjust fan speed. We collect minimal
                data and respect your choices under GDPR and DPDP regulations.
              </p>
            </div>

            {/* Expanded toggles --------------------------------------- */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  key="expanded-toggles"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-2 max-h-[45vh] overflow-y-auto">
                    {PURPOSES.map((purpose) => (
                      <PurposeToggle
                        key={purpose.id}
                        purpose={purpose}
                        checked={choices[purpose.id]}
                        onChange={(v) => togglePurpose(purpose.id, v)}
                      />
                    ))}

                    <p className="text-[10px] text-db-text-muted mt-3 leading-relaxed">
                      You can change your preferences at any time from Settings &gt;
                      Privacy. For questions, contact privacy@dreambreeze.app.
                      View our{' '}
                      <button className="underline text-db-teal/70 hover:text-db-teal">
                        Privacy Policy
                      </button>{' '}
                      for full details.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions ------------------------------------------------ */}
            <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
              {/* Primary row */}
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-db-teal/90 hover:bg-db-teal text-[#0a0e27] text-sm font-semibold transition-colors"
                >
                  <Check size={15} />
                  Accept All
                </button>

                {expanded ? (
                  <button
                    onClick={handleSaveChoices}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-db-text text-sm font-medium transition-colors"
                  >
                    <Check size={15} />
                    Save Choices
                  </button>
                ) : (
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-db-text text-sm font-medium transition-colors"
                  >
                    Customize
                    <ChevronDown size={15} />
                  </button>
                )}
              </div>

              {/* Secondary row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleRejectOptional}
                  className="text-xs text-db-text-muted hover:text-db-text-dim transition-colors"
                >
                  <X size={12} className="inline mr-1 -mt-0.5" />
                  Reject optional
                </button>

                {expanded && (
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-xs text-db-text-muted hover:text-db-text-dim transition-colors flex items-center gap-1"
                  >
                    Collapse
                    <ChevronUp size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}