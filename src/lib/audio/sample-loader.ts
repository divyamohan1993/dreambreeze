/**
 * Audio sample loader with caching for nature sound loops.
 *
 * Fetches pre-recorded audio files (rain, ocean, forest) from /public/audio/,
 * decodes them into AudioBuffers, and caches them for reuse. This avoids
 * re-downloading and re-decoding on every play/crossfade cycle.
 */

// -- Sample URL registry --------------------------------------------------------

const SAMPLE_URLS: Record<string, string> = {
  rain: '/audio/rain-loop.mp3',
  ocean: '/audio/ocean-loop.mp3',
  forest: '/audio/forest-loop.mp3',
};

// -- In-memory buffer cache -----------------------------------------------------

const bufferCache = new Map<string, AudioBuffer>();

// -- Public API -----------------------------------------------------------------

/**
 * Load and decode an audio sample by name.
 *
 * Returns a cached AudioBuffer if available, otherwise fetches the file,
 * decodes it, and stores the result. Returns null if the sample name is
 * unknown or if loading/decoding fails.
 */
export async function loadSample(
  ctx: AudioContext,
  name: string,
): Promise<AudioBuffer | null> {
  if (bufferCache.has(name)) return bufferCache.get(name)!;

  const url = SAMPLE_URLS[name];
  if (!url) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCache.set(name, audioBuffer);
    return audioBuffer;
  } catch {
    return null;
  }
}

/**
 * Check whether a sound type has a pre-recorded sample (as opposed to
 * procedurally generated noise).
 */
export function isSampleBased(type: string): boolean {
  return type in SAMPLE_URLS;
}

/**
 * Clear all cached AudioBuffers.
 * Useful when the AudioContext is closed/recreated.
 */
export function clearSampleCache(): void {
  bufferCache.clear();
}
