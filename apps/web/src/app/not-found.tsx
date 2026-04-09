import Link from 'next/link';

/**
 * 404 page. PRD Section 16.1.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-4xl mb-2">
        Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
      </h1>
      <p className="text-surface-500 text-6xl font-mono font-bold my-8">404</p>
      <p className="text-surface-300 text-center mb-8 max-w-md">
        This page doesn&apos;t exist. It may have been moved or you may have typed the URL incorrectly.
      </p>
      <Link
        href="/timer"
        className="px-6 py-3 bg-amber text-white font-semibold rounded-lg hover:bg-amber-light transition-colors"
      >
        Go to Timer
      </Link>
    </main>
  );
}
