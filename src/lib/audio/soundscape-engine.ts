/**
 * Adaptive soundscape mixing engine for DreamBreeze.
 *
 * Manages a Web Audio graph that:
 * - Plays procedural noise (white/pink/brown) or nature sounds
 * - Crossfades between mixes based on sleep stage
 * - Provides smooth volume transitions
 */

import type { NoiseType } from '@/stores/audio-store';
import type { SleepStage } from '@/stores/sleep-store';
import {
  generateWhiteNoise,
  generatePinkNoise,
  generateBrownNoise,
  createGainNode,
  createLowPassFilter,
  type NoiseNode,
} from './noise-generator';

// -- Types ----------------------------------------------------------------------

interface ActiveLayer {
  noiseType: NoiseType;
  noiseNode: NoiseNode;
  gainNode: GainNode;
  filterNode?: BiquadFilterNode;
}

interface StageMixConfig {
  primary: NoiseType;
  primaryGain: number;
  lowPassCutoff: number | null; // null = no filter
  secondary: NoiseType | null;
  secondaryGain: number;
  masterVolume: number; // multiplier relative to user's base volume
}

// -- Stage-specific mix presets -------------------------------------------------

function getStageMix(stage: SleepStage, baseVolume: number): StageMixConfig {
  switch (stage) {
    case 'awake':
      return {
        primary: 'white', // will be overridden by user preference
        primaryGain: 1.0,
        lowPassCutoff: null,
        secondary: null,
        secondaryGain: 0,
        masterVolume: baseVolume,
      };
    case 'light':
      return {
        primary: 'pink',
        primaryGain: 1.0,
        lowPassCutoff: null,
        secondary: null,
        secondaryGain: 0,
        masterVolume: baseVolume * 0.8, // reduce 20%
      };
    case 'deep':
      return {
        primary: 'brown',
        primaryGain: 1.0,
        lowPassCutoff: 200, // low frequency only
        secondary: null,
        secondaryGain: 0,
        masterVolume: baseVolume * 0.6, // reduce 40%
      };
    case 'rem':
      return {
        primary: 'pink',
        primaryGain: 0.8,
        lowPassCutoff: null,
        secondary: 'white', // noise masking layer
        secondaryGain: 0.3,
        masterVolume: baseVolume * 1.1, // increase 10%
      };
  }
}

// -- Soundscape Engine ----------------------------------------------------------

export class SoundscapeEngine {
  private _ctx: AudioContext | null = null;
  private _masterGain: GainNode | null = null;
  private _activeLayers: ActiveLayer[] = [];
  private _isPlaying = false;
  private _baseVolume = 0.5;
  private _userPreferredNoise: NoiseType = 'white';
  private _currentStage: SleepStage = 'awake';
  private _crossfadeTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize the audio context and master gain.
   * Must be called from a user gesture (click/tap) on iOS/Safari.
   */
  init(audioContext: AudioContext): void {
    this._ctx = audioContext;
    this._masterGain = this._ctx.createGain();
    this._masterGain.connect(this._ctx.destination);
    this._masterGain.gain.setValueAtTime(0, this._ctx.currentTime);
  }

  /**
   * Get whether the engine is currently playing.
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Start playback with the given noise type and volume.
   */
  play(noiseType: NoiseType, volume: number): void {
    if (!this._ctx || !this._masterGain) return;

    this._baseVolume = Math.max(0, Math.min(1, volume));
    this._userPreferredNoise = noiseType;

    // Resume context if suspended (browser autoplay policy)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    // Stop existing layers
    this._stopAllLayers();

    // Create primary layer
    this._addLayer(noiseType, 1.0, null);

    // Fade in master gain
    this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
    this._masterGain.gain.setValueAtTime(0, this._ctx.currentTime);
    this._masterGain.gain.linearRampToValueAtTime(this._baseVolume, this._ctx.currentTime + 1);

    this._isPlaying = true;
  }

  /**
   * Stop playback with a smooth fade out.
   */
  stop(fadeOutMs = 2000): void {
    if (!this._ctx || !this._masterGain) return;

    const fadeOutSec = fadeOutMs / 1000;
    this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
    this._masterGain.gain.setValueAtTime(
      this._masterGain.gain.value,
      this._ctx.currentTime,
    );
    this._masterGain.gain.linearRampToValueAtTime(0, this._ctx.currentTime + fadeOutSec);

    // After fade, stop all sources
    setTimeout(() => {
      this._stopAllLayers();
      this._isPlaying = false;
    }, fadeOutMs + 100);
  }

  /**
   * Adapt the soundscape to the current sleep stage.
   * Crossfades over 10 seconds by default.
   */
  adaptToSleepStage(stage: SleepStage): void {
    if (!this._ctx || !this._masterGain || !this._isPlaying) return;
    if (stage === this._currentStage) return;

    this._currentStage = stage;

    const mixConfig = getStageMix(stage, this._baseVolume);

    // For awake stage, use the user's preferred noise
    if (stage === 'awake') {
      mixConfig.primary = this._userPreferredNoise;
    }

    this.crossfade(mixConfig, 10_000);
  }

  /**
   * Crossfade from the current mix to a target mix over durationMs.
   */
  crossfade(targetMix: StageMixConfig, durationMs = 10_000): void {
    if (!this._ctx || !this._masterGain) return;

    // Clear any pending crossfade
    if (this._crossfadeTimer) {
      clearTimeout(this._crossfadeTimer);
      this._crossfadeTimer = null;
    }

    const fadeSec = durationMs / 1000;
    const now = this._ctx.currentTime;

    // Fade out existing layers
    for (const layer of this._activeLayers) {
      layer.gainNode.gain.cancelScheduledValues(now);
      layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
      layer.gainNode.gain.linearRampToValueAtTime(0, now + fadeSec * 0.4);
    }

    // Schedule new layers to start after the old ones fade
    this._crossfadeTimer = setTimeout(() => {
      this._stopAllLayers();

      // Primary layer
      this._addLayer(targetMix.primary, targetMix.primaryGain, targetMix.lowPassCutoff);

      // Secondary layer (e.g. noise masking for REM)
      if (targetMix.secondary) {
        this._addLayer(targetMix.secondary, targetMix.secondaryGain, null);
      }

      // Fade in new layers
      for (const layer of this._activeLayers) {
        const targetGain = layer.gainNode.gain.value;
        layer.gainNode.gain.setValueAtTime(0, this._ctx!.currentTime);
        layer.gainNode.gain.linearRampToValueAtTime(
          targetGain,
          this._ctx!.currentTime + fadeSec * 0.6,
        );
      }

      // Adjust master volume
      this._masterGain!.gain.cancelScheduledValues(this._ctx!.currentTime);
      this._masterGain!.gain.setValueAtTime(
        this._masterGain!.gain.value,
        this._ctx!.currentTime,
      );
      this._masterGain!.gain.linearRampToValueAtTime(
        Math.min(1, targetMix.masterVolume),
        this._ctx!.currentTime + fadeSec * 0.6,
      );
    }, durationMs * 0.4);
  }

  /**
   * Set the master volume (0-1) with a smooth transition.
   */
  setVolume(volume: number): void {
    this._baseVolume = Math.max(0, Math.min(1, volume));
    if (!this._ctx || !this._masterGain) return;

    this._masterGain.gain.cancelScheduledValues(this._ctx.currentTime);
    this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, this._ctx.currentTime);
    this._masterGain.gain.linearRampToValueAtTime(this._baseVolume, this._ctx.currentTime + 0.3);
  }

  /**
   * Clean up all audio resources.
   */
  destroy(): void {
    if (this._crossfadeTimer) {
      clearTimeout(this._crossfadeTimer);
    }
    this._stopAllLayers();
    if (this._masterGain) {
      this._masterGain.disconnect();
      this._masterGain = null;
    }
    this._ctx = null;
    this._isPlaying = false;
  }

  // -- Private ---------------------------------------------------------------

  private _addLayer(
    noiseType: NoiseType,
    gain: number,
    lowPassCutoff: number | null,
  ): void {
    if (!this._ctx || !this._masterGain) return;

    const noiseNode = this._createNoiseNode(noiseType);
    const gainNode = createGainNode(this._ctx, gain);

    let filterNode: BiquadFilterNode | undefined;

    if (lowPassCutoff !== null) {
      filterNode = createLowPassFilter(this._ctx, lowPassCutoff);
      noiseNode.node.connect(filterNode);
      filterNode.connect(gainNode);
    } else {
      noiseNode.node.connect(gainNode);
    }

    gainNode.connect(this._masterGain);
    noiseNode.start();

    this._activeLayers.push({ noiseType, noiseNode, gainNode, filterNode });
  }

  private _createNoiseNode(noiseType: NoiseType): NoiseNode {
    if (!this._ctx) throw new Error('AudioContext not initialized');

    switch (noiseType) {
      case 'white':
        return generateWhiteNoise(this._ctx);
      case 'pink':
        return generatePinkNoise(this._ctx);
      case 'brown':
        return generateBrownNoise(this._ctx);
      case 'rain':
        // Rain approximated as filtered pink noise with gentle modulation
        return generatePinkNoise(this._ctx);
      case 'ocean':
        // Ocean approximated as brown noise (low rumble)
        return generateBrownNoise(this._ctx);
      case 'forest':
        // Forest approximated as gentle pink noise
        return generatePinkNoise(this._ctx);
      default:
        return generateWhiteNoise(this._ctx);
    }
  }

  private _stopAllLayers(): void {
    for (const layer of this._activeLayers) {
      try {
        layer.noiseNode.stop();
      } catch {
        // Already stopped
      }
      try {
        layer.gainNode.disconnect();
      } catch {
        // Already disconnected
      }
      if (layer.filterNode) {
        try {
          layer.filterNode.disconnect();
        } catch {
          // Already disconnected
        }
      }
    }
    this._activeLayers = [];
  }
}
