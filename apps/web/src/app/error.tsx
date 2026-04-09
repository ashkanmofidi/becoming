'use client';

/**
 * Global error page. PRD Section 16.1.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-bg-primary text-surface-100">
      <h1 className="font-serif text-4xl mb-2">
        Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
      </h1>
      <p className="text-surface-500 text-6xl font-mono font-bold my-8">500</p>
      <p className="text-surface-300 text-center mb-4 max-w-md">
        Something went wrong on our end. Please try again in a moment.
      </p>
      <p className="text-surface-500 text-sm text-center mb-8">
        If the problem persists, send us feedback.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-amber text-white font-semibold rounded-lg hover:bg-amber-light transition-colors"
      >
        Try Again
      </button>
    </main>
  );
}
