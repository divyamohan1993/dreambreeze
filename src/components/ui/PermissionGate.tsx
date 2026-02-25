'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone, Mic, MapPin, Monitor, CheckCircle2, XCircle, AlertTriangle, ChevronRight
} from 'lucide-react';
import {
  getPermissionManager,
  type PermissionName,
  type PermissionStatus,
} from '@/lib/sensors/permission-manager';

interface PermissionStep {
  name: PermissionName;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const STEPS: PermissionStep[] = [
  {
    name: 'motion',
    title: 'Motion Sensors',
    description: 'Accelerometer detects your sleep posture throughout the night. Required for posture-based fan control.',
    icon: Smartphone,
    required: true,
  },
  {
    name: 'microphone',
    title: 'Ambient Noise',
    description: 'Measures room noise level (dB only) to auto-adjust soundscape volume. No audio is recorded or stored.',
    icon: Mic,
    required: false,
  },
  {
    name: 'location',
    title: 'Local Weather',
    description: 'Your GPS coordinates fetch accurate local temperature and humidity for thermal comfort. Coordinates are never uploaded.',
    icon: MapPin,
    required: false,
  },
  {
    name: 'wakeLock',
    title: 'Keep Screen On',
    description: 'Prevents your phone from sleeping so sensors stay active throughout the night. Plug in your phone for best results.',
    icon: Monitor,
    required: true,
  },
];

interface PermissionGateProps {
  onComplete: () => void;
  onSkip: () => void;
}

const statusIcon = (status: PermissionStatus) => {
  switch (status) {
    case 'granted': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'denied': return <XCircle className="w-5 h-5 text-red-400" />;
    case 'unavailable': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    default: return <ChevronRight className="w-5 h-5 text-slate-500" />;
  }
};

export default function PermissionGate({ onComplete, onSkip }: PermissionGateProps) {
  const pm = getPermissionManager();
  const [currentStep, setCurrentStep] = useState(0);
  const [statuses, setStatuses] = useState(pm.getAllStatuses());
  const [requesting, setRequesting] = useState(false);

  const step = STEPS[currentStep];
  const allRequiredGranted = STEPS.filter(s => s.required).every(
    s => statuses[s.name] === 'granted'
  );

  const requestCurrent = useCallback(async () => {
    if (!step) return;
    setRequesting(true);
    try {
      switch (step.name) {
        case 'motion': await pm.requestMotion(); break;
        case 'microphone': await pm.requestMicrophone(); break;
        case 'location': await pm.requestLocation(); break;
        case 'wakeLock': await pm.requestWakeLock(); break;
      }
      setStatuses(pm.getAllStatuses());
      setTimeout(() => {
        if (currentStep < STEPS.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, 600);
    } finally {
      setRequesting(false);
    }
  }, [step, pm, currentStep]);

  const handleFinish = () => {
    if (allRequiredGranted) onComplete();
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const Icon = step?.icon;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-white mb-1">Sensor Permissions</h2>
      <p className="text-sm text-slate-400 mb-6 text-center">
        DreamBreeze needs access to your device sensors for real sleep tracking.
      </p>

      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div
            key={s.name}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              statuses[s.name] === 'granted' ? 'bg-emerald-400'
                : statuses[s.name] === 'denied' ? 'bg-red-400'
                : i === currentStep ? 'bg-teal-400'
                : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              {Icon && <Icon className="w-6 h-6 text-teal-400" />}
              <span className="font-medium text-white">{step.title}</span>
              {step.required && (
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full">Required</span>
              )}
              <span className="ml-auto">{statusIcon(statuses[step.name])}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

            {statuses[step.name] === 'not-requested' && (
              <button
                onClick={requestCurrent}
                disabled={requesting}
                className="mt-4 w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {requesting ? 'Requesting...' : `Allow ${step.title}`}
              </button>
            )}

            {statuses[step.name] === 'denied' && (
              <div className="mt-4 text-sm text-amber-400">
                Permission denied. {step.required
                  ? 'This is required for sleep tracking. Check your browser settings.'
                  : 'This feature will be disabled. You can enable it later in Settings.'}
              </div>
            )}

            {statuses[step.name] === 'unavailable' && (
              <div className="mt-4 text-sm text-amber-400">
                Not available on this device/browser.{!step.required && ' This feature will be skipped.'}
              </div>
            )}

            {statuses[step.name] === 'granted' && !isLastStep && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="mt-4 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl transition-colors"
              >
                Next
              </button>
            )}

            {!step.required && statuses[step.name] === 'not-requested' && (
              <button
                onClick={() => { if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1); }}
                className="mt-2 w-full py-2 text-slate-500 text-sm hover:text-slate-400 transition-colors"
              >
                Skip
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isLastStep && statuses[step.name] !== 'not-requested' && (
        <div className="w-full space-y-2 mb-4">
          {STEPS.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-sm">
              {statusIcon(statuses[s.name])}
              <span className={statuses[s.name] === 'granted' ? 'text-white' : 'text-slate-500'}>{s.title}</span>
            </div>
          ))}
        </div>
      )}

      <div className="w-full flex gap-3">
        <button onClick={onSkip} className="flex-1 py-2.5 bg-slate-800 text-slate-400 text-sm rounded-xl hover:bg-slate-700 transition-colors">
          Skip All
        </button>
        {isLastStep && statuses[step.name] !== 'not-requested' && (
          <button
            onClick={handleFinish}
            disabled={!allRequiredGranted}
            className="flex-1 py-2.5 bg-teal-500 disabled:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Start Tracking
          </button>
        )}
      </div>
    </div>
  );
}
