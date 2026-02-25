'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Download,
  Trash2,
  UserX,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Clock,
  FileText,
  Mail,
  Phone,
  Globe,
  Lock,
  X,
} from 'lucide-react';

// -- Types ----------------------------------------------------------------------

interface ConsentItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  enabled: boolean;
  consentDate: string | null;
}

interface Regulation {
  flag: string;
  code: string;
  name: string;
  fullName: string;
}

type ModalType = 'delete-data' | 'delete-account' | 'export' | null;

// -- Constants ------------------------------------------------------------------

const TIMEZONE_REGULATIONS: Record<string, Regulation> = {
  'Asia/Kolkata': {
    flag: '\u{1F1EE}\u{1F1F3}',
    code: 'DPDP',
    name: 'DPDP Act 2023',
    fullName: 'Digital Personal Data Protection Act, 2023',
  },
  'Europe/London': {
    flag: '\u{1F1EC}\u{1F1E7}',
    code: 'UK GDPR',
    name: 'UK GDPR',
    fullName: 'UK General Data Protection Regulation',
  },
  'Europe/Paris': {
    flag: '\u{1F1EA}\u{1F1FA}',
    code: 'GDPR',
    name: 'EU GDPR',
    fullName: 'General Data Protection Regulation',
  },
  'Europe/Berlin': {
    flag: '\u{1F1EA}\u{1F1FA}',
    code: 'GDPR',
    name: 'EU GDPR',
    fullName: 'General Data Protection Regulation',
  },
  'America/New_York': {
    flag: '\u{1F1FA}\u{1F1F8}',
    code: 'CCPA',
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act',
  },
  'America/Los_Angeles': {
    flag: '\u{1F1FA}\u{1F1F8}',
    code: 'CCPA',
    name: 'CCPA',
    fullName: 'California Consumer Privacy Act',
  },
};

const DEFAULT_REGULATION: Regulation = {
  flag: '\u{1F30D}',
  code: 'Privacy',
  name: 'Privacy Standards',
  fullName: 'International Privacy Best Practices',
};

const PRIVACY_SECTIONS = [
  {
    title: 'What Data We Collect',
    content:
      'DreamBreeze collects device motion sensor data (accelerometer and gyroscope) solely to detect your sleep posture. We also record sleep stage classifications, fan speed adjustments, and sound preferences during active tracking sessions. All sensor data is processed entirely on your device and is never transmitted to any server.',
  },
  {
    title: 'How We Use Your Data',
    content:
      'Your data is used exclusively to: (1) detect sleep posture in real-time, (2) automatically adjust fan speed for comfort, (3) generate adaptive soundscapes, and (4) provide sleep quality analytics. We never use your data for advertising, profiling, or any purpose beyond improving your sleep experience.',
  },
  {
    title: 'Data Storage',
    content:
      'Sleep session summaries (posture distribution, sleep stages, duration, scores) are stored locally on your device using browser storage (IndexedDB/localStorage). Raw sensor data is never stored -- it is processed in real-time and discarded immediately. You can optionally enable cloud backup, which uses end-to-end encryption.',
  },
  {
    title: 'Data Sharing',
    content:
      'DreamBreeze does not share, sell, or transfer your personal data to any third party. When you use optional fan integrations (MQTT/Webhook), only fan speed commands are transmitted to your specified endpoint -- never any personal or health data.',
  },
  {
    title: 'Your Rights',
    content:
      'You have the right to: access all your stored data, export it in a portable format (JSON), delete any or all of your data, withdraw consent for optional features at any time, and file a complaint with the relevant data protection authority. All these actions are available on this page.',
  },
  {
    title: 'Data Retention',
    content:
      'Session summaries are retained until you choose to delete them. There is no automatic retention period -- you are in full control. If you delete your data, it is permanently removed from local storage immediately. Cloud-synced data, if enabled, is deleted within 24 hours of your request.',
  },
  {
    title: 'Security Measures',
    content:
      'All data processing happens on-device using your browser. No data leaves your device unless you explicitly configure cloud backup or fan integrations. The app uses the Web Crypto API for any necessary encryption. We follow the principle of data minimization -- we only collect what is strictly necessary.',
  },
];

const DATA_FIELDS = [
  'Session start/end times',
  'Sleep score (0-100)',
  'Sleep stage timeline (Awake/Light/Deep/REM)',
  'Posture distribution (% per position)',
  'Fan speed adjustments log',
  'Sound preferences used',
  'Session duration',
];

// -- Consent Toggle Card --------------------------------------------------------

function ConsentCard({
  item,
  onToggle,
  onRevoke,
}: {
  item: ConsentItem;
  onToggle: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-db-text">{item.label}</p>
            {item.required && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-db-amber/15 text-db-amber font-medium">
                Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-db-text-muted mt-0.5">{item.description}</p>
        </div>
        <button
          onClick={item.required ? undefined : onToggle}
          className={`flex-shrink-0 transition-opacity ${
            item.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          disabled={item.required}
        >
          {item.enabled ? (
            <ToggleRight size={28} className="text-db-teal" />
          ) : (
            <ToggleLeft size={28} className="text-db-text-muted" />
          )}
        </button>
      </div>

      {item.consentDate && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-db-text-muted">
            Consented: {item.consentDate}
          </span>
          {!item.required && item.enabled && (
            <button
              onClick={onRevoke}
              className="text-[10px] text-db-rose hover:text-db-rose/80 transition-colors"
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -- Confirmation Modal ---------------------------------------------------------

function ConfirmModal({
  type,
  onConfirm,
  onCancel,
}: {
  type: ModalType;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);

  if (!type) return null;

  const configs = {
    'delete-data': {
      title: 'Delete All Data',
      description:
        'This will permanently delete all your sleep sessions, preferences, and analytics from this device. This action cannot be undone.',
      confirmWord: 'DELETE',
      buttonLabel: 'Delete All Data',
      icon: Trash2,
      steps: 1,
    },
    'delete-account': {
      title: 'Delete Account',
      description:
        'This will permanently delete your account and all associated data. You will need to set up DreamBreeze again from scratch.',
      confirmWord: 'DELETE MY ACCOUNT',
      buttonLabel: 'Delete Account',
      icon: UserX,
      steps: 2,
    },
    export: {
      title: 'Export Data',
      description:
        'We will generate a JSON file containing all your sleep data. The download will start automatically.',
      confirmWord: '',
      buttonLabel: 'Download JSON',
      icon: Download,
      steps: 1,
    },
  };

  const config = configs[type];
  const Icon = config.icon;
  const needsConfirmation = config.confirmWord.length > 0;
  const isConfirmed = !needsConfirmation || confirmText === config.confirmWord;
  const isDeleteAction = type === 'delete-data' || type === 'delete-account';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <motion.div
        className="relative glass skeu-raised rounded-2xl p-6 max-w-sm w-full space-y-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: 'rgba(21, 26, 53, 0.95)' }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-db-text-muted hover:text-db-text transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDeleteAction ? 'bg-db-rose/15' : 'bg-db-teal/15'
            }`}
          >
            <Icon
              size={20}
              className={isDeleteAction ? 'text-db-rose' : 'text-db-teal'}
            />
          </div>
          <h3 className="text-lg font-bold text-db-text">{config.title}</h3>
        </div>

        <p className="text-sm text-db-text-dim">{config.description}</p>

        {/* Double confirmation for delete account */}
        {type === 'delete-account' && step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-db-rose/10 border border-db-rose/20">
              <AlertTriangle size={16} className="text-db-rose flex-shrink-0" />
              <p className="text-xs text-db-rose">
                Are you absolutely sure? This is the first of two confirmations.
              </p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-db-rose/15 text-db-rose border border-db-rose/20 hover:bg-db-rose/25 transition-colors"
            >
              Yes, I want to delete my account
            </button>
          </div>
        )}

        {/* Type confirmation */}
        {needsConfirmation && (type !== 'delete-account' || step === 2) && (
          <div className="space-y-2">
            <p className="text-xs text-db-text-muted">
              Type <span className="font-mono text-db-rose font-bold">{config.confirmWord}</span> to
              confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm text-db-text bg-db-surface border border-white/[0.06] focus:border-db-rose/40 focus:outline-none"
              placeholder={config.confirmWord}
            />
          </div>
        )}

        {/* Actions */}
        {(type !== 'delete-account' || step === 2) && (
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-db-surface text-db-text-dim hover:text-db-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!isConfirmed}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isDeleteAction
                  ? 'bg-db-rose text-white hover:bg-db-rose/90'
                  : 'bg-db-teal text-db-navy hover:bg-db-teal/90'
              }`}
            >
              {config.buttonLabel}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// -- Main Component -------------------------------------------------------------

export default function PrivacyPage() {
  const [regulation] = useState<Regulation>(() => {
    if (typeof window === 'undefined') return DEFAULT_REGULATION;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const reg = TIMEZONE_REGULATIONS[tz];
      if (reg) return reg;
      // Check broader region matches
      if (tz.startsWith('Europe/')) {
        return TIMEZONE_REGULATIONS['Europe/Paris'];
      } else if (tz.startsWith('Asia/') && tz.includes('Kolkata') || tz.includes('Calcutta')) {
        return TIMEZONE_REGULATIONS['Asia/Kolkata'];
      } else if (tz.startsWith('America/')) {
        return TIMEZONE_REGULATIONS['America/New_York'];
      }
    } catch {
      // Keep default
    }
    return DEFAULT_REGULATION;
  });
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: 'sensor',
      label: 'Sensor Collection',
      description: 'Accelerometer & gyroscope data for posture detection',
      required: true,
      enabled: true,
      consentDate: 'Feb 20, 2026',
    },
    {
      id: 'analysis',
      label: 'Sleep Analysis',
      description: 'Process sensor data to classify sleep stages',
      required: true,
      enabled: true,
      consentDate: 'Feb 20, 2026',
    },
    {
      id: 'cloud',
      label: 'Cloud Storage',
      description: 'Backup sleep summaries to encrypted cloud storage',
      required: false,
      enabled: false,
      consentDate: null,
    },
    {
      id: 'fan',
      label: 'Fan Control',
      description: 'Send speed commands to your connected fan',
      required: false,
      enabled: true,
      consentDate: 'Feb 20, 2026',
    },
    {
      id: 'analytics',
      label: 'Usage Analytics',
      description: 'Anonymous usage data to improve the app',
      required: false,
      enabled: false,
      consentDate: null,
    },
  ]);
  const [modal, setModal] = useState<ModalType>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);

  const toggleConsent = useCallback((id: string) => {
    setConsents((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.required) return c;
        const newEnabled = !c.enabled;
        return {
          ...c,
          enabled: newEnabled,
          consentDate: newEnabled
            ? new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null,
        };
      })
    );
  }, []);

  const revokeConsent = useCallback((id: string) => {
    setConsents((prev) =>
      prev.map((c) => {
        if (c.id !== id || c.required) return c;
        return { ...c, enabled: false, consentDate: null };
      })
    );
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modal === 'export') {
      // Simulate JSON download
      const data = {
        exportDate: new Date().toISOString(),
        sessions: 7,
        totalDuration: '49h 32m',
        note: 'This is a demo export. In production, actual session data would be included.',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dreambreeze-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    setModal(null);
  }, [modal]);

  // Mock data stats
  const dataStats = useMemo(
    () => ({
      sessions: 7,
      totalSize: '42 KB',
      oldest: 'Feb 18, 2026',
      newest: 'Feb 25, 2026',
    }),
    []
  );

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-6">
      {/* -- Header -- */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center bg-db-teal/10 border border-db-teal/20"
            style={{ boxShadow: '0 0 24px rgba(78, 205, 196, 0.15)' }}
          >
            <Shield size={32} className="text-db-teal" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-db-text">Your Data, Your Rules</h1>
        <p className="text-xs text-db-text-dim max-w-xs mx-auto">
          DreamBreeze processes ALL sensor data on your device. We only store sleep summaries
          you choose to save.
        </p>
      </div>

      {/* ======================================================================
          Applicable Regulations
          ====================================================================== */}
      <section className="glass skeu-raised rounded-2xl p-4 space-y-3">
        <h2 className="text-[11px] text-db-text-muted uppercase tracking-wider font-medium">
          Applicable Regulations
        </h2>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-db-surface">
          <span className="text-2xl">{regulation.flag}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-db-text">{regulation.name}</p>
            <p className="text-[10px] text-db-text-dim">{regulation.fullName}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-db-teal/15 border border-db-teal/20">
            <ShieldCheck size={12} className="text-db-teal" />
            <span className="text-[10px] font-medium text-db-teal">Compliant</span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-db-teal/5 border border-db-teal/10">
          <CheckCircle2 size={14} className="text-db-teal flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-db-text-dim">
            DreamBreeze is fully compliant with {regulation.code} requirements. All data
            processing is on-device, consent is granular, and you have full data portability
            and deletion rights.
          </p>
        </div>
      </section>

      {/* ======================================================================
          Consent Management
          ====================================================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-db-text-dim uppercase tracking-wider">
          Consent Management
        </h2>
        {consents.map((item) => (
          <ConsentCard
            key={item.id}
            item={item}
            onToggle={() => toggleConsent(item.id)}
            onRevoke={() => revokeConsent(item.id)}
          />
        ))}
      </section>

      {/* ======================================================================
          Data Summary
          ====================================================================== */}
      <section className="glass skeu-raised rounded-2xl p-4 space-y-3">
        <h2 className="text-[11px] text-db-text-muted uppercase tracking-wider font-medium">
          Data Summary
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-db-surface">
            <Database size={14} className="text-db-teal" />
            <div>
              <p className="text-xs font-semibold text-db-text">{dataStats.sessions} sessions</p>
              <p className="text-[10px] text-db-text-muted">stored locally</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-db-surface">
            <FileText size={14} className="text-db-lavender" />
            <div>
              <p className="text-xs font-semibold text-db-text">{dataStats.totalSize}</p>
              <p className="text-[10px] text-db-text-muted">total data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-db-surface">
            <Clock size={14} className="text-db-amber" />
            <div>
              <p className="text-xs font-semibold text-db-text">{dataStats.oldest}</p>
              <p className="text-[10px] text-db-text-muted">oldest session</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-db-surface">
            <Clock size={14} className="text-db-amber" />
            <div>
              <p className="text-xs font-semibold text-db-text">{dataStats.newest}</p>
              <p className="text-[10px] text-db-text-muted">newest session</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-db-text-muted mb-1.5 uppercase tracking-wider">
            Stored Fields (summary only, never raw sensor)
          </p>
          <ul className="space-y-1">
            {DATA_FIELDS.map((field) => (
              <li
                key={field}
                className="text-[11px] text-db-text-dim flex items-center gap-1.5"
              >
                <Lock size={8} className="text-db-teal flex-shrink-0" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ======================================================================
          Actions
          ====================================================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-db-text-dim uppercase tracking-wider">
          Data Actions
        </h2>

        <button
          onClick={() => setModal('export')}
          className="w-full flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-db-teal/15">
            <Download size={18} className="text-db-teal" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-db-text">Export All My Data</p>
            <p className="text-[10px] text-db-text-muted">Download as JSON file</p>
          </div>
          <ChevronRight size={16} className="text-db-text-muted" />
        </button>

        <button
          onClick={() => setModal('delete-data')}
          className="w-full flex items-center gap-3 p-4 glass rounded-xl hover:bg-db-rose/5 transition-colors border border-transparent hover:border-db-rose/10"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-db-rose/15">
            <Trash2 size={18} className="text-db-rose" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-db-rose">Delete All My Data</p>
            <p className="text-[10px] text-db-text-muted">Permanently remove all sessions</p>
          </div>
          <ChevronRight size={16} className="text-db-text-muted" />
        </button>

        <button
          onClick={() => setModal('delete-account')}
          className="w-full flex items-center gap-3 p-4 glass rounded-xl hover:bg-db-rose/5 transition-colors border border-transparent hover:border-db-rose/10"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-db-rose/15">
            <UserX size={18} className="text-db-rose" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-db-rose">Delete Account</p>
            <p className="text-[10px] text-db-text-muted">
              Remove account and all data (double confirmation)
            </p>
          </div>
          <ChevronRight size={16} className="text-db-text-muted" />
        </button>
      </section>

      {/* ======================================================================
          Grievance Redressal (DPDP)
          ====================================================================== */}
      {regulation.code === 'DPDP' && (
        <section className="glass skeu-raised rounded-2xl p-4 space-y-3">
          <h2 className="text-[11px] text-db-text-muted uppercase tracking-wider font-medium">
            Grievance Redressal (DPDP)
          </h2>
          <p className="text-xs text-db-text-dim">
            In accordance with the DPDP Act 2023, a Grievance Officer has been appointed to
            address your concerns regarding personal data processing.
          </p>
          <div className="space-y-2 p-3 rounded-xl bg-db-surface">
            <p className="text-sm font-medium text-db-text">Grievance Officer</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-db-text-dim">
                <Mail size={12} className="text-db-teal" />
                <span>grievance@dreambreeze.app</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-db-text-dim">
                <Phone size={12} className="text-db-teal" />
                <span>+91 (XXX) XXX-XXXX</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-db-text-dim">
                <Globe size={12} className="text-db-teal" />
                <span>dreambreeze.app/grievance</span>
              </div>
            </div>
          </div>
          <a
            href="#"
            className="block w-full text-center py-2.5 rounded-xl text-sm font-medium bg-db-teal/15 text-db-teal border border-db-teal/20 hover:bg-db-teal/25 transition-colors"
          >
            File a Concern
          </a>
        </section>
      )}

      {/* ======================================================================
          Privacy Policy (Collapsible Sections)
          ====================================================================== */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-db-text-dim uppercase tracking-wider">
          Privacy Policy
        </h2>
        <p className="text-[10px] text-db-text-muted mb-3">
          Plain language, not legalese. Last updated Feb 25, 2026.
        </p>

        {PRIVACY_SECTIONS.map((section, idx) => (
          <div key={idx} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedPolicy(expandedPolicy === idx ? null : idx)}
              className="w-full flex items-center justify-between p-3.5 text-left"
            >
              <span className="text-sm font-medium text-db-text">{section.title}</span>
              {expandedPolicy === idx ? (
                <ChevronDown size={16} className="text-db-text-muted flex-shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-db-text-muted flex-shrink-0" />
              )}
            </button>
            <AnimatePresence>
              {expandedPolicy === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-db-text-dim px-3.5 pb-3.5 leading-relaxed border-t border-white/[0.04] pt-3">
                    {section.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modal && (
          <ConfirmModal
            type={modal}
            onConfirm={handleModalConfirm}
            onCancel={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
