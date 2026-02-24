import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// -- Types ----------------------------------------------------------------------

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
}

export interface GyroscopeData {
  alpha: number;
  beta: number;
  gamma: number;
}

// -- State Shape ----------------------------------------------------------------

export interface SensorState {
  /* accelerometer */
  accelerometer: AccelerometerData;

  /* gyroscope */
  gyroscope: GyroscopeData;

  /* meta */
  hasPermission: boolean;
  isCalibrated: boolean;
  sampleRate: number; // Hz

  /* calibration baseline (stored when phone placed flat) */
  calibrationBaseline: AccelerometerData | null;

  /* timestamps */
  lastUpdate: number | null;

  /* actions */
  updateAccelerometer: (data: AccelerometerData) => void;
  updateGyroscope: (data: GyroscopeData) => void;
  requestPermission: () => void;
  setPermission: (granted: boolean) => void;
  calibrate: () => void;
  setSampleRate: (rate: number) => void;
  reset: () => void;
}

// -- Store ----------------------------------------------------------------------

export const useSensorStore = create<SensorState>()(
  subscribeWithSelector((set, get) => ({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { alpha: 0, beta: 0, gamma: 0 },
    hasPermission: false,
    isCalibrated: false,
    sampleRate: 50,
    calibrationBaseline: null,
    lastUpdate: null,

    updateAccelerometer: (data: AccelerometerData) => {
      const baseline = get().calibrationBaseline;
      const calibrated = baseline
        ? {
            x: data.x - baseline.x,
            y: data.y - baseline.y,
            z: data.z - baseline.z,
          }
        : data;

      set({
        accelerometer: calibrated,
        lastUpdate: Date.now(),
      });
    },

    updateGyroscope: (data: GyroscopeData) => {
      set({
        gyroscope: data,
        lastUpdate: Date.now(),
      });
    },

    requestPermission: () => {
      // Permission is handled by the DeviceMotionSensor class.
      // This is a placeholder that hooks call after actual permission flow.
    },

    setPermission: (granted: boolean) => {
      set({ hasPermission: granted });
    },

    calibrate: () => {
      const { accelerometer } = get();
      set({
        calibrationBaseline: { ...accelerometer },
        isCalibrated: true,
      });
    },

    setSampleRate: (rate: number) => {
      set({ sampleRate: Math.max(1, Math.min(100, rate)) });
    },

    reset: () => {
      set({
        accelerometer: { x: 0, y: 0, z: 0 },
        gyroscope: { alpha: 0, beta: 0, gamma: 0 },
        hasPermission: false,
        isCalibrated: false,
        calibrationBaseline: null,
        lastUpdate: null,
      });
    },
  })),
);
