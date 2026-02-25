'use client';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#e94560]/10 flex items-center justify-center">
          <span className="text-[#e94560] text-2xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-white/50 mb-2">
          An unexpected error occurred. Please try again.
        </p>
        <p className="text-sm text-white/50 mt-2 mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-[#4ecdc4] text-[#0a0e27] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
