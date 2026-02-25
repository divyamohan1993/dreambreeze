'use client';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#0a0e27] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#e94560]/10 flex items-center justify-center">
          <span className="text-[#e94560] text-xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-white/50 mb-2">
          We hit an issue loading this section. Please try again.
        </p>
        <p className="text-sm text-white/50 mt-2 mb-6">{error.message}</p>
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
