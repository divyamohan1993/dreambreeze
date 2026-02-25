'use client';

import type { Posture } from '@/types/sleep';
import { POSTURE_LABELS } from '@/lib/constants/posture';

/** Compact SVG posture icons for the dashboard 2x2 metric grid. */
export default function PostureSilhouette({
  posture,
  className = '',
}: {
  posture: Posture;
  className?: string;
}) {
  const paths: Record<Posture, string> = {
    supine:
      'M20 8a4 4 0 108 0 4 4 0 00-8 0zM18 16h12v2H18zM16 20h16l-2 16H18z',
    prone:
      'M20 8a4 4 0 108 0 4 4 0 00-8 0zM16 15h16v3H16zM18 20h12l-1 16H19z',
    'left-lateral':
      'M22 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM20 13c0-1 2-2 4-2s3 1 3 2l1 8c0 1-1 2-2 2h-5c-1 0-2-1-2-2zM19 25l3 11h-4l-1-11z',
    'right-lateral':
      'M19 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM17 13c0-1 2-2 4-2s3 1 3 2l1 8c0 1-1 2-2 2h-5c-1 0-2-1-2-2zM28 25l-3 11h4l1-11z',
    fetal:
      'M22 6a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0zM18 12c0-1 3-2 5-1l4 5c1 1 0 3-1 3l-6 2c-1 0-2 0-3-1l-1-6c0-1 1-2 2-2z',
    unknown:
      'M20 8a4 4 0 108 0 4 4 0 00-8 0zM18 16h12v2H18zM16 20h16l-2 16H18z',
  };

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${POSTURE_LABELS[posture]} posture`}
    >
      <path d={paths[posture]} fillRule="evenodd" />
    </svg>
  );
}
