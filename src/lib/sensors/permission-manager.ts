export type PermissionName = 'motion' | 'microphone' | 'location' | 'wakeLock';
export type PermissionStatus = 'not-requested' | 'granted' | 'denied' | 'unavailable';
export type PermissionState = Record<PermissionName, PermissionStatus>;

const STORAGE_KEY = 'dreambreeze-permissions';

const DEFAULT_STATE: PermissionState = {
  motion: 'not-requested',
  microphone: 'not-requested',
  location: 'not-requested',
  wakeLock: 'not-requested',
};

export class PermissionManager {
  private state: PermissionState;

  constructor() {
    this.state = this.load();
  }

  private load(): PermissionState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    } catch {
      /* ignore */
    }
    return { ...DEFAULT_STATE };
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  getStatus(name: PermissionName): PermissionStatus {
    return this.state[name];
  }

  getAllStatuses(): PermissionState {
    return { ...this.state };
  }

  setStatus(name: PermissionName, status: PermissionStatus): void {
    this.state[name] = status;
    this.persist();
  }

  hasAllRequired(): boolean {
    return this.state.motion === 'granted';
  }

  async requestMotion(): Promise<PermissionStatus> {
    const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        const status: PermissionStatus = result === 'granted' ? 'granted' : 'denied';
        this.setStatus('motion', status);
        return status;
      } catch {
        this.setStatus('motion', 'denied');
        return 'denied';
      }
    }
    if ('DeviceMotionEvent' in window) {
      this.setStatus('motion', 'granted');
      return 'granted';
    }
    this.setStatus('motion', 'unavailable');
    return 'unavailable';
  }

  async requestMicrophone(): Promise<PermissionStatus> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus('microphone', 'unavailable');
      return 'unavailable';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      this.setStatus('microphone', 'granted');
      return 'granted';
    } catch {
      this.setStatus('microphone', 'denied');
      return 'denied';
    }
  }

  async requestLocation(): Promise<PermissionStatus> {
    if (!navigator.geolocation) {
      this.setStatus('location', 'unavailable');
      return 'unavailable';
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => { this.setStatus('location', 'granted'); resolve('granted'); },
        () => { this.setStatus('location', 'denied'); resolve('denied'); },
        { timeout: 10000 }
      );
    });
  }

  async requestWakeLock(): Promise<PermissionStatus> {
    if (!('wakeLock' in navigator)) {
      this.setStatus('wakeLock', 'unavailable');
      return 'unavailable';
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      await lock.release();
      this.setStatus('wakeLock', 'granted');
      return 'granted';
    } catch {
      this.setStatus('wakeLock', 'denied');
      return 'denied';
    }
  }
}

let instance: PermissionManager | null = null;
export function getPermissionManager(): PermissionManager {
  if (!instance) instance = new PermissionManager();
  return instance;
}
